import axios from "axios";

const apikey = import.meta.env.VITE_API_KEY;
const baseurl = "https://techhk.aoscdn.com/api/tasks/visual/scale";

// Task state constants for better readability
// Based on actual API response: state: 1 with state_detail: "Complete" means completed
const TASK_STATES = {
  COMPLETED: 1,      // When state_detail: "Complete" and progress: 100
  PROCESSING: 2,     // Other processing states
  PROCESSING_3: 3,   
  PROCESSING_4: 4,
  PENDING: 0,        // Initial state
  FAILED: 6          // Failed state
};

// Enhanced main function with retry logic
export async function enhanceimage(file, options = {}) {
  const { 
    maxAttempts = 3, 
    validateImage = true,
    maxFileSizeMB = 10 
  } = options;
  
  console.log("🟡 Starting image enhancement...");
  console.log("📤 Input file:", file?.name || 'Unknown file', `(${Math.round(file?.size / 1024)}KB)`);

  if (!file) {
    throw new Error("No file provided for enhancement");
  }

  if (!apikey) {
    throw new Error("API key not found. Please check your VITE_API_KEY environment variable.");
  }

  // Enhanced file validation
  if (validateImage) {
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Please upload an image file (JPEG, PNG, etc.).`);
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      throw new Error(`File too large: ${fileSizeMB.toFixed(1)}MB. Maximum allowed: ${maxFileSizeMB}MB`);
    }
    
    console.log("✅ File validation passed:", {
      type: file.type,
      sizeMB: fileSizeMB.toFixed(2),
      name: file.name
    });
  }

  let lastError = null;
  
  // Retry logic for the entire enhancement process
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🎯 Enhancement attempt ${attempt}/${maxAttempts}`);
      
      const taskid = await uploadimage(file);
      console.log("✅ Task ID received:", taskid);

      const resultUrl = await polling(taskid);
      console.log("✅ Enhancement complete! Final image URL:", resultUrl);

      return resultUrl;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.message.includes('Invalid file type') || 
          error.message.includes('File too large') ||
          error.message.includes('API key') ||
          error.message.includes('Bad Request') ||
          error.message.includes('Unauthorized')) {
        console.error("🚫 Non-retryable error detected. Stopping attempts.");
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const waitTime = Math.min(5000 * attempt, 15000); // 5s, 10s, 15s max
        console.log(`⏳ Waiting ${waitTime/1000}s before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`All ${maxAttempts} enhancement attempts failed. Last error: ${lastError?.message}`);
}

// STEP 1: Upload image to get task ID
async function uploadimage(file) {
  console.log("📤 Uploading image...");
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error("Invalid file type. Please upload an image file.");
  }

  const formData = new FormData();
  formData.append("image_file", file);

  try {
    const response = await axios.post(`${baseurl}`, formData, {
      headers: {
        "X-API-KEY": apikey,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 second timeout
    });

    console.log("📦 Upload response:", response.data);

    if (!response.data?.data?.task_id) {
      throw new Error("Invalid response: task_id not found");
    }

    const task_id = response.data.data.task_id;
    console.log("🔑 Extracted task_id:", task_id);

    return task_id;
  } catch (err) {
    if (err.response) {
      console.error("❌ Server error:", err.response.status, err.response.data);
      throw new Error(`Upload failed: ${err.response.status} - ${err.response.data?.message || 'Server error'}`);
    } else if (err.request) {
      console.error("❌ Network error - no response received");
      throw new Error("Network error: Unable to reach the server");
    } else {
      console.error("❌ Error uploading image:", err.message);
      throw err;
    }
  }
}

// STEP 2: Polling until processing is complete
async function polling(taskid, retry = 0) {
  const maxRetries = 60; // Increased to 2 minutes total
  const baseDelayMs = 2000; // Start with 2 seconds
  
  // Progressive delay: increase wait time for longer tasks
  const delayMs = retry < 10 ? baseDelayMs : 
                  retry < 30 ? 3000 : 5000; // 2s -> 3s -> 5s
  
  console.log(`🔁 Polling for task ID: ${taskid} | Attempt: ${retry + 1}/${maxRetries} | Wait: ${delayMs/1000}s`);

  try {
    const result = await fetchTaskStatus(taskid);
    
    // Check completion based on actual API response structure
    const isCompleted = (result.state_detail === "Complete" && result.progress === 100) || 
                       (result.state === TASK_STATES.COMPLETED);
    const isFailed = result.state === TASK_STATES.FAILED || 
                    result.state_detail === "Failed" ||
                    result.state_detail === "Error";
    const isProcessing = !isCompleted && !isFailed;
    
    // Enhanced logging with more details
    console.log("📊 Task Details:", {
      state: result.state,
      stateDetail: result.state_detail,
      progress: result.progress,
      isCompleted,
      isFailed,
      isProcessing,
      hasResultUrl: !!(result.result_url || result.image),
      taskId: taskid,
      attempt: retry + 1,
      totalTimeElapsed: `${Math.round((retry * baseDelayMs) / 1000)}s`
    });

    // Log the full result object for debugging stuck tasks
    if (retry > 20) {
      console.log("🔍 Full API Response (debugging):", result);
    }

    // Check if task is still processing
    if (isProcessing) {
      console.log("⏳ Task still in progress...");
      
      // Warning at 30 seconds
      if (retry === 15) {
        console.warn("⚠️ Task taking longer than expected (30s). This may indicate server issues.");
      }
      
      // Final warning before timeout
      if (retry === maxRetries - 5) {
        console.warn("🚨 Approaching timeout limit. Task may be stuck on server side.");
      }
      
      if (retry >= maxRetries) {
        console.error("⛔ Max retry reached. Task appears to be stuck.");
        
        // Provide debugging information
        const totalTime = Math.round((maxRetries * baseDelayMs) / 1000);
        const debugInfo = {
          taskId: taskid,
          finalState: result.state,
          stateDetail: result.state_detail,
          progress: result.progress,
          totalAttempts: maxRetries,
          totalTimeSeconds: totalTime,
          lastKnownState: result
        };
        
        console.error("📋 Debug Information:", debugInfo);
        
        throw new Error(
          `Task timeout after ${maxRetries} attempts (${totalTime}s). ` +
          `Task stuck in state ${result.state} (${result.state_detail}). ` +
          `This usually indicates a server-side processing issue. Please try again or contact API support.`
        );
      }
      
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return polling(taskid, retry + 1);
    }

    // Task completed successfully
    if (isCompleted) {
      // Check for result URL in different possible fields
      const resultUrl = result.result_url || result.image;
      
      if (!resultUrl) {
        throw new Error("Enhancement completed but no result URL provided by server");
      }
      
      const totalTime = Math.round((retry * baseDelayMs) / 1000);
      console.log(`✅ Enhancement complete in ${totalTime}s!`);
      console.log("🖼️ Enhanced image URL:", resultUrl);
      console.log("📏 Image dimensions:", `${result.image_width || 'unknown'}x${result.image_height || 'unknown'}`);
      console.log("⏱️ Processing time:", `${result.time_elapsed || 'unknown'}ms`);
      
      return resultUrl;
    }

    // Task failed
    if (isFailed) {
      throw new Error(
        "❌ Enhancement failed at server. This could be due to: " +
        "invalid image format, image too large, or server processing error. " +
        "Please try with a different image or contact support."
      );
    }

    // Unknown state - log for debugging
    console.error("❓ Unknown task state encountered:", {
      state: result.state,
      stateDetail: result.state_detail,
      progress: result.progress,
      taskId: taskid,
      fullResponse: result
    });
    
    throw new Error(`❌ Unknown task state: ${result.state} (${result.state_detail}). Please contact API support.`);
  } catch (err) {
    // Don't log error if it's our timeout error (already logged above)
    if (!err.message.includes('Task timeout')) {
      console.error("❌ Error during polling:", {
        message: err.message,
        taskId: taskid,
        attempt: retry + 1
      });
    }
    throw err;
  }
}

// STEP 3: Fetch enhanced image result using /api/tasks/visual/scale/{task_id}
async function fetchTaskStatus(taskid) {
  console.log("📥 Fetching enhanced image result for task:", taskid);

  if (!taskid) {
    throw new Error("Task ID is required");
  }

  try {
    // Call the GET /api/tasks/visual/scale/{task_id} endpoint
    const response = await axios.get(`${baseurl}/${taskid}`, {
      headers: {
        "X-API-KEY": apikey, // Required API Key in header
      },
      timeout: 10000, // 10 second timeout
    });

    console.log("📨 Enhanced image API response:", {
      status: response.status,
      taskId: taskid,
      hasData: !!response.data?.data
    });

    // Validate response structure
    if (!response.data?.data) {
      throw new Error("Invalid response format: missing data field");
    }

    const taskData = response.data.data;
    
    // Log current task state for debugging
    console.log("🔍 Task details:", {
      state: taskData.state,
      stateDescription: getStateDescription(taskData.state),
      hasResultUrl: !!taskData.result_url
    });

    return taskData;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const errorData = err.response.data;
      
      console.error("❌ API Error:", {
        status,
        taskId: taskid,
        error: errorData
      });

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          throw new Error("Bad Request: Invalid task ID format");
        case 401:
          throw new Error("Unauthorized: Invalid or missing API key");
        case 404:
          throw new Error(`Task not found: ${taskid}`);
        case 429:
          throw new Error("Rate limit exceeded. Please wait before retrying.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(`API Error ${status}: ${errorData?.message || 'Unknown error'}`);
      }
    } else if (err.request) {
      console.error("❌ Network error - no response received for task:", taskid);
      throw new Error("Network error: Unable to reach the enhancement server");
    } else {
      console.error("❌ Error fetching enhanced image result:", err.message);
      throw err;
    }
  }
}

// Helper function to get human-readable state descriptions
function getStateDescription(state, stateDetail = null, progress = null) {
  // Use state_detail if available (more accurate)
  if (stateDetail) {
    return stateDetail;
  }
  
  // Fallback to state number interpretation
  const descriptions = {
    0: "Pending",
    1: progress === 100 ? "Completed" : "Processing",
    2: "Processing (Step 2)",
    3: "Processing (Step 3)", 
    4: "Processing (Step 4)",
    5: "Completed",
    6: "Failed"
  };
  return descriptions[state] || `Unknown (${state})`;
}

// Utility function to check if a task is stuck and suggest solutions
export async function checkTaskStatus(taskid) {
  console.log("🔍 Checking task status:", taskid);
  
  try {
    const result = await fetchTaskStatus(taskid);
    
    const status = {
      taskId: taskid,
      state: result.state,
      stateDescription: getStateDescription(result.state),
      isCompleted: result.state === TASK_STATES.COMPLETED,
      isFailed: result.state === TASK_STATES.FAILED,
      isProcessing: [TASK_STATES.PENDING, TASK_STATES.PROCESSING_2, TASK_STATES.PROCESSING_3, TASK_STATES.PROCESSING_4].includes(result.state),
      resultUrl: result.result_url || null,
      fullResponse: result
    };
    
    console.log("📋 Task Status Report:", status);
    
    // Provide suggestions based on status
    if (status.isProcessing) {
      console.log("💡 Suggestion: Task is still processing. You can continue polling or wait longer.");
    } else if (status.isCompleted && !status.resultUrl) {
      console.warn("⚠️ Warning: Task completed but no result URL. This may be an API issue.");
    } else if (status.isFailed) {
      console.error("❌ Task failed. Consider uploading a different image or checking image format/size.");
    }
    
    return status;
  } catch (error) {
    console.error("❌ Error checking task status:", error.message);
    throw error;
  }
}

// Function to estimate processing time based on file size
function estimateProcessingTime(fileSizeBytes) {
  const sizeMB = fileSizeBytes / (1024 * 1024);
  
  // Rough estimates based on typical image processing times
  if (sizeMB < 1) return "10-30 seconds";
  if (sizeMB < 3) return "30-60 seconds";
  if (sizeMB < 5) return "1-2 minutes";
  return "2-5 minutes";
}

// Function to get image as base64 data URL (useful for displaying in browser)
export async function getEnhancedImageAsDataUrl(resultUrl) {
  console.log("🖼️ Converting enhanced image to data URL:", resultUrl);
  
  try {
    const response = await axios.get(resultUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // Convert to base64
    const base64 = btoa(
      new Uint8Array(response.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Determine MIME type from response headers or default to JPEG
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log("✅ Enhanced image converted to data URL");
    return dataUrl;
  } catch (err) {
    console.error("❌ Error converting enhanced image:", err.message);
    throw new Error(`Failed to convert enhanced image: ${err.message}`);
  }
}