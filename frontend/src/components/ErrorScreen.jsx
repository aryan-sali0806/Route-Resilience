import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function ErrorScreen({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
      <AlertTriangle size={48} className="text-red-400" />
      <div>
        <h2 className="text-lg font-semibold text-red-400 mb-1">Analysis Failed</h2>
        <p className="text-[#8899AA] text-sm">{message ?? 'An unexpected error occurred.'}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C2541] border border-red-400/40
                   text-red-400 text-sm font-medium hover:bg-red-400/10 transition-colors"
      >
        <RotateCcw size={15} /> Try Again
      </button>
    </div>
  )
}
