import { ArrowRight, FlaskConical } from 'lucide-react'

export default function HomePage({ onLaunchMission, onLaunchStress }) {
  return (
    <div className="min-h-screen bg-[#030712] bg-grid flex flex-col">

      {/* Hero — vertically centred in viewport */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 mb-8
                        px-4 py-1.5 rounded-full
                        bg-white/5 border border-white/10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-slate-400 text-xs tracking-[0.2em] uppercase font-medium">
            AI-Powered Geospatial Intelligence
          </span>
        </div>

        {/* Main headline */}
        <h1 className="max-w-5xl text-5xl sm:text-6xl lg:text-7xl font-black uppercase
                       tracking-tight leading-[1.05] text-white mb-6">
          The City&apos;s{' '}
          <span className="text-transparent bg-clip-text
                           bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
            Vulnerability,
          </span>
          <br />
          Made{' '}
          <span className="text-cyan-400">Transparent.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-slate-400 text-lg leading-relaxed mb-12">
          Upload a satellite image. Our DeepLabV3+ engine extracts the road
          network at pixel precision, reconstructs a topological graph, and
          stress-tests every edge — revealing where your city breaks first.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onLaunchMission}
            className="flex items-center gap-2.5 px-8 py-4 rounded-lg
                       bg-orange-500 text-black font-black text-sm tracking-[0.12em] uppercase
                       shadow-[0_0_20px_rgba(249,115,22,0.45)]
                       hover:bg-orange-400 hover:shadow-[0_0_32px_rgba(249,115,22,0.65)]
                       transition-all duration-200"
          >
            Launch Mission Control
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onLaunchStress}
            className="flex items-center gap-2.5 px-8 py-4 rounded-lg
                       bg-white/5 border border-slate-700 backdrop-blur-md
                       text-slate-300 font-black text-sm tracking-[0.12em] uppercase
                       hover:border-cyan-500/60 hover:text-cyan-400
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]
                       transition-all duration-200"
          >
            <FlaskConical size={16} />
            Run Stress-Test Console
          </button>
        </div>
      </section>

      {/* Bottom stat strip */}
      <section className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            ['DeepLabV3+',   'Segmentation model'],
            ['Pixel-precise', 'Road detection'],
            ['GeoJSON graph', 'Output format'],
            ['Real-time',     'Stress simulation'],
          ].map(([val, label]) => (
            <div key={val} className="text-center">
              <p className="text-cyan-400 font-black text-lg tracking-wide uppercase">{val}</p>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
