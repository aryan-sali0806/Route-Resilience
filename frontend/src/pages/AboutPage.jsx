const PHASES = [
  {
    num: 'I',
    title: 'Occlusion-Robust Segmentation',
    desc: 'A DeepLabV3+ convolutional network with an Atrous Spatial Pyramid Pooling (ASPP) head identifies road pixels at full resolution, tolerating shadows, vegetation occlusion, and low-contrast surfaces common in satellite imagery.',
    badges: ['DeepLabV3+', 'ASPP', 'Dilated Convolutions', 'DeepGlobe Dataset', 'PyTorch'],
    accent: 'orange',
  },
  {
    num: 'II',
    title: 'Topological Reconstruction',
    desc: 'The binary road mask is thinned to a 1-pixel skeleton using the Zhang-Suen algorithm. Intersection pixels become graph nodes; continuous road segments become weighted edges with real-world geodesic length.',
    badges: ['Zhang-Suen Thinning', 'Skeletonization', 'Graph Construction', 'GeoJSON Export'],
    accent: 'cyan',
  },
  {
    num: 'III',
    title: 'Structural Intelligence',
    desc: 'NetworkX computes centrality metrics across the graph. Betweenness centrality identifies critical arterials; degree analysis flags isolated segments; community detection reveals neighbourhood clusters.',
    badges: ['Betweenness Centrality', 'Degree Analysis', 'Community Detection', 'NetworkX'],
    accent: 'orange',
  },
  {
    num: 'IV',
    title: 'Stress-Test Simulation',
    desc: 'Targeted edge-removal simulations model disaster scenarios — flooding, infrastructure failure, blockades. Each run recomputes global connectivity and average shortest path, producing a resilience score per scenario.',
    badges: ['Edge Removal', 'Connectivity Analysis', 'Resilience Score', 'Scenario Simulation'],
    accent: 'cyan',
  },
]

const STACK = [
  {
    col: 'Segmentation',
    tools: ['PyTorch', 'torchvision', 'DeepLabV3+', 'CUDA', 'scikit-image'],
  },
  {
    col: 'Geospatial',
    tools: ['Rasterio', 'GDAL', 'Shapely', 'GeoPandas', 'Pyproj'],
  },
  {
    col: 'Graph Engine',
    tools: ['NetworkX', 'SciPy', 'NumPy', 'scikit-learn', 'FastAPI'],
  },
  {
    col: 'Visualization',
    tools: ['React', 'Leaflet.js', 'React-Leaflet', 'Tailwind CSS', 'Vite'],
  },
]

function Badge({ label, accent }) {
  return accent === 'orange' ? (
    <span className="px-2 py-1 bg-orange-900/30 text-orange-400 text-xs rounded-full border border-orange-500/20 font-medium">
      {label}
    </span>
  ) : (
    <span className="px-2 py-1 bg-cyan-900/30 text-cyan-400 text-xs rounded-full border border-cyan-500/20 font-medium">
      {label}
    </span>
  )
}

function ToolPill({ name }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-white/[0.03] border border-slate-800
                    hover:border-cyan-500/40 hover:bg-cyan-900/10
                    transition-all duration-150 group cursor-default">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:shadow-[0_0_6px_rgba(34,211,238,0.8)] transition-shadow" />
      <span className="text-slate-300 text-sm font-medium">{name}</span>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#030712] bg-grid pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Page heading */}
        <div className="mb-14 text-center">
          <p className="text-orange-500 text-xs font-black tracking-[0.25em] uppercase mb-3">
            System Architecture
          </p>
          <h2 className="text-4xl font-black uppercase tracking-tight text-white">
            How Route Resilience Works
          </h2>
          <p className="text-slate-400 mt-4 text-base max-w-2xl mx-auto leading-relaxed">
            A four-phase AI pipeline that transforms raw satellite pixels into a
            stress-tested road resilience score.
          </p>
        </div>

        {/* ── Section 1: Pipeline phases ── */}
        <div className="space-y-4 mb-20">
          {PHASES.map((p) => (
            <div
              key={p.num}
              className="flex gap-6 p-6 rounded-xl
                         bg-white/[0.02] border border-slate-800
                         hover:border-slate-700 backdrop-blur-md
                         transition-colors duration-200"
            >
              {/* Phase number */}
              <div className="shrink-0 flex items-start pt-0.5">
                <span className={[
                  'text-4xl font-black tracking-tighter leading-none opacity-20',
                  p.accent === 'orange' ? 'text-orange-500' : 'text-cyan-400',
                ].join(' ')}>
                  {p.num}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h3 className={[
                    'font-black text-base uppercase tracking-wider',
                    p.accent === 'orange' ? 'text-orange-400' : 'text-cyan-400',
                  ].join(' ')}>
                    Phase {p.num} — {p.title}
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-7 mb-4">{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.badges.map((b) => <Badge key={b} label={b} accent={p.accent} />)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Section 2: Tech stack ── */}
        <div>
          <div className="mb-8 text-center">
            <p className="text-cyan-400 text-xs font-black tracking-[0.25em] uppercase mb-2">
              Commended Stack
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">
              Technology Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STACK.map(({ col, tools }) => (
              <div key={col} className="space-y-3">
                <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-500
                              border-b border-slate-800 pb-2">
                  {col}
                </p>
                {tools.map((t) => <ToolPill key={t} name={t} />)}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
