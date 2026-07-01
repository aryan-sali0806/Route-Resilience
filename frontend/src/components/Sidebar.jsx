import { MapPin } from 'lucide-react'

export default function Sidebar({ children }) {
  return (
    <aside className="flex flex-col w-80 min-w-[20rem] h-full bg-[#1C2541] border-r border-[#48CAE4]/20 overflow-y-auto z-10">
      {/* Brand header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#48CAE4]/20">
        <MapPin className="text-[#48CAE4]" size={20} />
        <span className="text-[#48CAE4] font-semibold tracking-wider text-sm uppercase">
          Route Resilience
        </span>
      </div>

      {/* Panel content */}
      <div className="flex-1 p-4 space-y-4">
        {children}
      </div>
    </aside>
  )
}
