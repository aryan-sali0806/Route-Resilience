import { Loader2 } from 'lucide-react'

export default function ProcessingScreen({ filename }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
      <Loader2 size={48} className="text-[#48CAE4] animate-spin" />
      <div>
        <h2 className="text-lg font-semibold text-[#48CAE4] mb-1">Analyzing Route Network</h2>
        <p className="text-[#8899AA] text-sm truncate max-w-[200px]">{filename}</p>
      </div>
      <p className="text-[#8899AA] text-xs">Segmenting road geometry…</p>
    </div>
  )
}
