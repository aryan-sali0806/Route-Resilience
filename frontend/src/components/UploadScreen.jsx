import { useRef, useState, useCallback } from 'react'
import { UploadCloud, FileWarning, Zap, Cpu, ListOrdered } from 'lucide-react'

const ACCEPTED = '.tif,.tiff,.png'

function isAccepted(file) {
  if (!file) return false
  return /\.(tif|tiff|png)$/i.test(file.name)
}

export default function UploadScreen({ onUpload }) {
  const inputRef            = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [picked,   setPicked]   = useState(null)
  const [reject,   setReject]   = useState(false)

  const commit = useCallback((file) => {
    if (!isAccepted(file)) { setReject(true); setPicked(null); return }
    setReject(false)
    setPicked(file)
  }, [])

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); commit(e.dataTransfer.files?.[0]) }
  const onFileInput = (e) => commit(e.target.files?.[0])

  return (
    <div className="min-h-screen bg-[#0B132B] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 mt-12">

        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">Route Resilience</h1>
          <p className="text-slate-400 mt-1 text-sm">
            AI-powered road network extraction from satellite imagery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── LEFT: Upload card ── */}
          <div className="bg-[#1C2541] rounded-xl p-8 border border-slate-700">
            <h2 className="text-white font-semibold text-lg mb-6">Upload Satellite Image</h2>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={[
                'border-2 border-dashed h-64 flex flex-col items-center justify-center',
                'rounded-lg bg-cyan-900/10 cursor-pointer transition-all duration-200',
                dragging
                  ? 'border-cyan-400 bg-cyan-900/20 scale-[1.01]'
                  : 'border-cyan-500/50 hover:border-cyan-400',
              ].join(' ')}
            >
              <UploadCloud
                size={48}
                className={`mb-4 transition-colors ${dragging ? 'text-cyan-400' : 'text-cyan-500/70'}`}
                style={{ filter: dragging ? 'drop-shadow(0 0 10px rgba(72,202,228,0.6))' : 'none' }}
              />

              {picked ? (
                <div className="text-center px-4">
                  <p className="text-cyan-400 font-medium text-sm break-all">{picked.name}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {(picked.size / 1024 / 1024).toFixed(2)} MB — ready to analyze
                  </p>
                </div>
              ) : (
                <div className="text-center px-4">
                  <p className="text-white text-sm font-medium">Drag &amp; drop your image here</p>
                  <p className="text-slate-400 text-xs mt-2">or click to browse</p>
                  <p className="text-slate-500 text-xs mt-3">Supported: GeoTIFF (.tif) · PNG</p>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={onFileInput}
              />
            </div>

            {/* Rejection warning */}
            {reject && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg
                              bg-red-900/30 border border-red-500/40">
                <FileWarning size={14} className="text-red-400 shrink-0" />
                <span className="text-red-400 text-xs">
                  Unsupported format. Please upload a .tif or .png file.
                </span>
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={() => picked && onUpload(picked)}
              disabled={!picked}
              className={[
                'w-full mt-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2',
                'transition-all duration-200',
                picked
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(72,202,228,0.5)] cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed',
              ].join(' ')}
            >
              <Zap size={16} />
              Analyze Image
            </button>
          </div>

          {/* ── RIGHT: Info cards ── */}
          <div className="flex flex-col gap-6">

            {/* Card 1 — About */}
            <div className="bg-[#1C2541] rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={18} className="text-cyan-400" />
                <h3 className="text-white font-semibold">About This Tool</h3>
              </div>
              <p className="text-slate-400 text-sm leading-7">
                Route Resilience uses a{' '}
                <span className="text-white font-medium">DeepLabV3+</span> semantic segmentation
                model trained on the{' '}
                <span className="text-white font-medium">DeepGlobe Road Extraction</span> dataset
                to detect road networks from satellite imagery at pixel-level precision.
              </p>
              <p className="text-slate-400 text-sm leading-7 mt-3">
                The resulting road mask is skeletonised and converted into a traversable{' '}
                <span className="text-white font-medium">GeoJSON graph</span> — ready for
                interactive visualisation and resilience analysis.
              </p>
            </div>

            {/* Card 2 — How it works */}
            <div className="bg-[#1C2541] rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-5">
                <ListOrdered size={18} className="text-cyan-400" />
                <h3 className="text-white font-semibold">How It Works</h3>
              </div>
              <ol className="space-y-4">
                {[
                  ['Upload',      'Provide a satellite image of your region of interest.'],
                  ['Segment',     'DeepLabV3+ identifies road pixels at full resolution.'],
                  ['Skeletonize', 'The mask is thinned to a single-pixel centreline.'],
                  ['Build Graph', 'Intersections become nodes; road segments become edges.'],
                  ['Visualise',   'The network overlays an interactive dark-mode map.'],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex items-start gap-4">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/40
                                     text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium leading-snug">{title}</p>
                      <p className="text-slate-400 text-sm leading-6 mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
