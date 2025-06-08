// import React, { useState, useEffect } from "react";
// import { enhanceimage } from "../utils/api";
// import Loading from "./Loading";
// export default function Landingpage() {
//   const [uploadedimage, setuploadedimage] = useState(null);
//   const [enhancedimage, setenhancedimage] = useState(null);
//   const [loading, setloading] = useState(false);

//   const handleuploadedimage = async (file) => {
//     setuploadedimage(URL.createObjectURL(file));
//     setenhancedimage(null);
//     setloading(true);
//     try {
//       const result = await enhanceimage(file);
//       setenhancedimage(result);
//     } catch (error) {
//       console.error("❌ Enhancement failed:", error);
//     } finally {
//       setloading(false);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       if (uploadedimage) URL.revokeObjectURL(uploadedimage);
//     };
//   }, [uploadedimage]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-50 p-6">
//       <h1 className="text-2xl font-bold text-gray-800">🖼️ AI Image Enhancer</h1>

//       <input
//         type="file"
//         accept="image/*"
//         className="block w-full max-w-xs text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-700"
//         onChange={(e) => {
//           if (e.target.files?.[0]) handleuploadedimage(e.target.files[0]);
//         }}
//       />

//       {loading && (
//         <div className="flex items-center justify-center mt-4">
//           <Loading />
//           <span className="ml-2 text-gray-600">Processing image, please wait...</span>
//         </div>
//       )}

//       <div className="flex flex-wrap justify-center gap-8 mt-6">
//         {uploadedimage && (
//           <div className="flex flex-col items-center">
//             <p className="mb-2 font-medium">Original Image</p>
//             <img
//               src={uploadedimage}
//               alt="Original"
//               className="rounded-lg shadow-md w-[200px] object-contain"
//             />
//           </div>
//         )}

//         {enhancedimage && (
//           <div className="flex flex-col items-center">
//             <p className="mb-2 font-medium">Enhanced Image</p>
//             <img
//               src={enhancedimage}
//               alt="Enhanced"
//               className="rounded-lg shadow-md w-[200px] object-contain"
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { enhanceimage } from "../utils/api";
import Loading from "./Loading";
import ImageUpload from "./Imageupload";
import ImagePreview from "./Imagepreview";
import { Download, RefreshCw } from "lucide-react";

export default function LandingPage() {
  const [uploadedimage, setuploadedimage] = useState(null);
  const [enhancedimage, setenhancedimage] = useState(null);
  const [loading, setloading] = useState(false);
  const [error, setError] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);

  const handleuploadedimage = async (file) => {
    if (!file) return;
    setError(null);
    setOriginalFile(file);
    setuploadedimage(URL.createObjectURL(file));
    setenhancedimage(null);
    setloading(true);

    try {
      const result = await enhanceimage(file);
      setenhancedimage(result);
    } catch (err) {
      setError("Enhancement failed. Try again.");
    } finally {
      setloading(false);
    }
  };

  const handleRetry = () => {
    if (originalFile) handleuploadedimage(originalFile);
  };

  const handleReset = () => {
    if (uploadedimage) URL.revokeObjectURL(uploadedimage);
    if (enhancedimage) URL.revokeObjectURL(enhancedimage);
    setuploadedimage(null);
    setenhancedimage(null);
    setloading(false);
    setError(null);
    setOriginalFile(null);
  };

  useEffect(() => {
    return () => {
      if (uploadedimage) URL.revokeObjectURL(uploadedimage);
      if (enhancedimage) URL.revokeObjectURL(enhancedimage);
    };
  }, [uploadedimage, enhancedimage]);

  return (
    <div className="min-h-screen bg-white text-gray-800 px-4 py-8">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">AI Image Enhancer</h1>
        <p className="text-sm text-gray-600">Upload an image and get an enhanced version instantly</p>
        {!uploadedimage && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <ImageUpload handleuploadedimage={handleuploadedimage} />
          </div>
        )}
      </div>

      {/* Results */}
      {uploadedimage && (
        <div className="max-w-3xl mx-auto mt-6 space-y-4">
          {loading && (
            <div className="text-center bg-white border p-6 rounded-lg shadow">
              <Loading />
              <p className="text-sm text-gray-600 mt-2">Enhancing...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 p-4 rounded-lg text-red-700 flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={handleRetry}
                className="flex items-center text-red-600 hover:underline"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white border p-4 rounded-lg shadow">
              <ImagePreview uploadedimage={uploadedimage} enhancedimage={enhancedimage} />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-3">
            {enhancedimage && (
              <a
                href={enhancedimage}
                download
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            <button
              onClick={handleReset}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
