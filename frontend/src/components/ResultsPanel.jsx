import { CheckCircle2, Route, RefreshCw } from 'lucide-react'

export default function ResultsPanel({ geojson, onReset }) {
  const edgeCount = geojson?.features?.length ?? 0

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Status badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#48CAE4]/10 border border-[#48CAE4]/30">
        <CheckCircle2 size={16} className="text-[#48CAE4]" />
        <span className="text-[#48CAE4] text-sm font-medium">Graph extracted</span>
      </div>

      {/* Stats */}
      <div className="rounded-lg bg-[#243055] border border-[#48CAE4]/15 p-4 space-y-3">
        <p className="text-[#8899AA] text-xs uppercase tracking-widest">Network Stats</p>
        <div className="flex items-center gap-2">
          <Route size={15} className="text-[#48CAE4]" />
          <span className="text-white text-sm">{edgeCount} road edges</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      <button
        onClick={onReset}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                   bg-[#243055] border border-[#48CAE4]/20 text-[#8899AA] text-sm
                   hover:border-[#48CAE4]/60 hover:text-[#48CAE4] transition-colors"
      >
        <RefreshCw size={14} /> New Upload
      </button>
    </div>
  )
}
