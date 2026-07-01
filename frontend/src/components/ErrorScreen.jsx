import { XCircle, RotateCcw, ArrowLeft, FileX2, HardDriveUpload, Wifi } from 'lucide-react'

const COMMON_ISSUES = [
  { icon: FileX2,          text: 'File format not supported — use .tif or .png' },
  { icon: HardDriveUpload, text: 'Image too large — keep files under 50 MB' },
  { icon: Wifi,            text: 'Network error — check your connection and retry' },
]

export default function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#1C2541] p-10 rounded-xl border border-red-500/30 text-center">

        {/* Icon */}
        <XCircle
          size={64}
          className="text-red-400 mx-auto"
          style={{ filter: 'drop-shadow(0 0 14px rgba(248,113,113,0.45))' }}
        />

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white mt-4">Something went wrong</h2>
        <p className="text-slate-400 mt-2 text-sm">We couldn&apos;t process your image.</p>

        {/* Raw error (if any) */}
        {message && (
          <p className="mt-4 text-xs text-red-400/80 font-mono bg-red-950/30
                        border border-red-500/20 rounded-lg px-4 py-3 text-left break-all">
            {message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg
                       bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm
                       shadow-[0_0_15px_rgba(72,202,228,0.4)] transition-all duration-200 cursor-pointer"
          >
            <RotateCcw size={15} />
            Try Again
          </button>

          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg
                       border border-slate-600 text-slate-300 text-sm font-medium
                       hover:border-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>

        {/* Common issues */}
        <div className="mt-8 text-left bg-[#0B132B]/60 border border-slate-700
                        rounded-lg px-5 py-4 space-y-3">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Common Issues</p>
          {COMMON_ISSUES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <Icon size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-slate-400 text-sm leading-snug">{text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
