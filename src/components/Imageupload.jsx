// import React from 'react'

// export default function Imageupload({handleuploadedimage}) {
//   function showimage(e){
//     const file=e.target.files[0];
//     handleuploadedimage(file);
//   }
//   return (
//     <div className="bg-gray-200 p-4 w-100 border border-gray-300">
//       <label htmlFor="fileInput" className="block mb-2 cursor-ponter">Upload Image</label>
//       <input type="file" id="fileInput" className="hidden" onChange={showimage}/>
//     </div>
//   )
// }
import React from 'react'
import { Upload, Image } from 'lucide-react'

export default function Imageupload({handleuploadedimage}) {
  function showimage(e){
    const file=e.target.files[0];
    handleuploadedimage(file);
  }

  return (
    <div className="bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-8 transition-all duration-200 cursor-pointer group">
      <label htmlFor="fileInput" className="cursor-pointer block text-center">
        <div className="space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto bg-gray-100 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors">
            <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-600" />
          </div>
          
          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-700">
              Upload Image
            </h3>
            <p className="text-sm text-gray-500">
              Click to browse or drag and drop
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
          
          {/* Upload Button */}
          <div className="pt-2">
            <span className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              <Image className="w-4 h-4 mr-2" />
              Choose File
            </span>
          </div>
        </div>
      </label>
      
      <input 
        type="file" 
        id="fileInput" 
        className="hidden" 
        accept="image/*"
        onChange={showimage}
      />
    </div>
  )
}