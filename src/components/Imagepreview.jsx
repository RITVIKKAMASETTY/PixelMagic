// import React from 'react'

// export default function Imagepreview({uploadedimage,enhancedimage}) {
//   return (
//     <div className="w-1/2">
//       <div className="text-center">
//         <h2>original image</h2>
//       </div>
//       <img src={uploadedimage} alt="" className="w-100 h-full object-cover" />
//       <div className="text-center">
//         <h2>enhanced image</h2>
//       </div>
//       <img src={enhancedimage?enhancedimage:""} alt="" className="w-100 h-full object-cover" />
//     </div>
    
//   )
// }
import React from 'react'

export default function ImagePreview({ uploadedimage, enhancedimage }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-800 text-center">
              Original Image
            </h2>
          </div>
          <div className="p-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {uploadedimage ? (
                <img 
                  src={uploadedimage} 
                  alt="Original uploaded image" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm">No image uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-800 text-center">
              Enhanced Image
            </h2>
          </div>
          <div className="p-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              {enhancedimage ? (
                <img 
                  src={enhancedimage} 
                  alt="Enhanced processed image" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="mt-2 text-sm">Processing...</p>
                  </div>
                </div>
              )}
              {enhancedimage && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Enhanced
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Controls */}
      {uploadedimage && enhancedimage && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Original</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Enhanced</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}