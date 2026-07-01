import { UploadCloud } from 'lucide-react'

export default function UploadScreen({ onUpload }) {
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      <UploadCloud size={56} className="text-[#48CAE4] drop-shadow-[0_0_12px_rgba(72,202,228,0.5)]" />
      <div>
        <h2 className="text-xl font-semibold text-[#48CAE4] mb-1">Upload Satellite Image</h2>
        <p className="text-[#8899AA] text-sm">
          Accepts GeoTIFF or PNG road-network imagery.
        </p>
      </div>
      <label className="cursor-pointer">
        <input type="file" accept=".tif,.tiff,.png" className="hidden" onChange={handleFile} />
        <span className="px-6 py-3 rounded-lg bg-[#48CAE4] text-[#0B132B] font-semibold text-sm
                         hover:bg-[#2196C4] transition-colors shadow-[0_0_12px_2px_rgba(72,202,228,0.35)]">
          Choose File
        </span>
      </label>
    </div>
  )
}
