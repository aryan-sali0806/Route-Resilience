import { Crosshair } from 'lucide-react'

export default function Navbar({ page, onNavigate, onLaunch }) {
  const link = (id, label) => (
    <button
      key={id}
      onClick={() => onNavigate(id)}
      className={[
        'text-xs font-black tracking-[0.2em] uppercase transition-colors duration-200',
        page === id ? 'text-cyan-400' : 'text-slate-400 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16
                    flex items-center justify-between px-8
                    bg-white/[0.02] backdrop-blur-lg border-b border-white/[0.06]">

      {/* Logo */}
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2.5 group"
      >
        <Crosshair
          size={20}
          className="text-cyan-400 group-hover:rotate-45 transition-transform duration-300"
        />
        <span className="text-white font-black tracking-[0.15em] uppercase text-sm">
          Route<span className="text-cyan-400">Resilience</span>
        </span>
      </button>

      {/* Nav links */}
      <div className="flex items-center gap-10">
        {link('home',  'Home')}
        {link('about', 'About')}
      </div>

      {/* CTA */}
      <button
        onClick={onLaunch}
        className="px-5 py-2 rounded-md text-xs font-black tracking-[0.15em] uppercase
                   bg-orange-500 text-black
                   hover:bg-orange-400
                   shadow-[0_0_15px_rgba(249,115,22,0.4)]
                   hover:shadow-[0_0_22px_rgba(249,115,22,0.65)]
                   transition-all duration-200"
      >
        Portal Console
      </button>
    </nav>
  )
}
