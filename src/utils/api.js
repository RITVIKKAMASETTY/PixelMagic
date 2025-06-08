import axios from "axios";

const apikey = process.env.apikey;
const baseurl = "https://techhk.aoscdn.com/api/tasks/visual/scale";

// MAIN FUNCTION: Enhance image
export async function enhanceimage(file) {
  console.log("🟡 Starting image enhancement...");
  console.log("📤 Input file:", file);

  try {
    const taskid = await uploadimage(file);
    console.log("✅ Task ID received:", taskid);

    const resultUrl = await polling(taskid);
    console.log("✅ Enhancement complete! Final image URL:", resultUrl);

    return resultUrl;
  } catch (error) {
    console.error("❌ Error in enhanceimage:", error.message);
    return null;
  }
}

// STEP 1: Upload image to get task ID
async function uploadimage(file) {
  console.log("📤 Uploading image...");
  const formData = new FormData();
  formData.append("image_file", file);

  try {
    const response = await axios.post(`${baseurl}`, formData, {
      headers: {
        "X-API-KEY": apikey,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("📦 Upload response:", response.data);

    const task_id = response.data.data.task_id;
    console.log("🔑 Extracted task_id:", task_id);

    return task_id;
  } catch (err) {
    console.error("❌ Error uploading image:", err.message);
    throw err;
  }
}

// STEP 2: Polling until processing is complete
async function polling(taskid, retry = 0) {
  console.log(`🔁 Polling for task ID: ${taskid} | Attempt: ${retry}`);

  try {
    const result = await fetcchimage(taskid);
    console.log("📊 Task state:", result.state);

    if ([1, 2, 3, 4].includes(result.state)) {
      console.log("⏳ Task still in progress...");
      if (retry >= 20) {
        console.error("⛔ Max retry reached. Exiting.");
        throw new Error("Timeout: Image enhancement not finished in time.");
      }
      await new Promise((r) => setTimeout(r, 2000)); 
      return polling(taskid, retry + 1);
    }

    if (result.state === 5) {
      console.log("✅ Enhancement complete! URL:", result.result_url);
      return result.result_url;
    }

    if (result.state === 6) {
      throw new Error("❌ Enhancement failed at server.");
    }

    throw new Error(`❌ Unknown task state: ${result.state}`);
  } catch (err) {
    console.error("❌ Error during polling:", err.message);
    throw err;
  }
}


// STEP 3: Fetch task status and result URL
async function fetcchimage(taskid) {
  console.log("📥 Fetching task status for:", taskid);

  try {
    const response = await axios.get(`${baseurl}/${taskid}`, {
      headers: {
        "X-API-KEY": apikey,
      },
    });

    console.log("📨 Status response:", response.data);

    return response.data.data;
  } catch (err) {
    console.error("❌ Error fetching task status:", err.message);
    throw err;
  }
}
