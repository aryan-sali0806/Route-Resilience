import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Circle, Activity } from 'lucide-react'

const STEPS = [
  'Calculating Betweenness Centrality...',
  'Identifying Top 5% Critical Bottlenecks...',
  'Ablating high-centrality nodes (Simulating Flooding)...',
  'Recalculating Global Network Efficiency...',
]

const STEP_DURATION_MS = 1500

export default function ProcessingScreen({ filename, onComplete }) {
  const [completed, setCompleted] = useState(0) // number of checked steps
  const [progress,  setProgress]  = useState(0) // 0–100
  const timerRef = useRef(null)

  useEffect(() => {
    // Animate progress bar smoothly to the target for each step
    let step = 0

    function tick() {
      step += 1
      const targetProgress = Math.round((step / STEPS.length) * 100)

      // Ramp the progress bar up to targetProgress over ~400 ms
      const start     = Date.now()
      const fromProg  = Math.round(((step - 1) / STEPS.length) * 100)
      const duration  = 400

      function animateBar() {
        const elapsed = Date.now() - start
        const t       = Math.min(elapsed / duration, 1)
        // ease-out cubic
        const eased   = 1 - Math.pow(1 - t, 3)
        setProgress(Math.round(fromProg + (targetProgress - fromProg) * eased))
        if (t < 1) requestAnimationFrame(animateBar)
      }

      requestAnimationFrame(animateBar)

      // Mark this step complete after the bar animation finishes
      setTimeout(() => {
        setCompleted(step)
        if (step < STEPS.length) {
          timerRef.current = setTimeout(tick, STEP_DURATION_MS)
        } else {
          // All steps done — hand off to parent
          setTimeout(() => onComplete?.(), 600)
        }
      }, duration + 100)
    }

    timerRef.current = setTimeout(tick, STEP_DURATION_MS * 0.6)

    return () => clearTimeout(timerRef.current)
  }, [onComplete])

  return (
    /* Full-viewport dark overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-[#030712]/80 backdrop-blur-md">

      {/* Modal card */}
      <div className="relative w-full max-w-lg mx-4
                      bg-white/[0.03] border border-slate-800
                      rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)]">

        {/* Top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="px-8 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-orange-500 animate-pulse" />
                <span className="text-orange-500 text-[10px] font-black tracking-[0.25em] uppercase">
                  Mission Active
                </span>
              </div>
              <h2 className="text-white font-black text-xl uppercase tracking-wider leading-tight">
                Simulating Network<br />Ablation...
              </h2>
            </div>
            <span className="text-cyan-400 font-black text-3xl tabular-nums">
              {progress}%
            </span>
          </div>

          {/* Filename */}
          {filename && (
            <p className="text-slate-500 text-xs mt-2 truncate font-mono">
              ↳ {filename}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-6 mb-8">
            <div className="h-[3px] w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300
                           shadow-[0_0_10px_rgba(34,211,238,0.7)]
                           transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Tick marks */}
            <div className="relative flex justify-between mt-1 px-0">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`text-[9px] font-mono transition-colors duration-300 ${
                    i < completed ? 'text-cyan-500' : 'text-slate-700'
                  }`}
                >
                  {String(Math.round(((i + 1) / STEPS.length) * 100)).padStart(2, '0')}%
                </span>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            {STEPS.map((label, i) => {
              const done    = i < completed
              const active  = i === completed
              return (
                <div key={label} className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle2
                        size={16}
                        className="text-cyan-400"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.7))' }}
                      />
                    ) : (
                      <Circle
                        size={16}
                        className={active ? 'text-slate-500 animate-pulse' : 'text-slate-700'}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span className={[
                    'text-sm leading-snug transition-colors duration-300',
                    done   ? 'text-slate-400 line-through decoration-slate-600' :
                    active ? 'text-white font-medium'                           :
                             'text-slate-600',
                  ].join(' ')}>
                    {label}
                  </span>

                  {/* Running indicator */}
                  {active && (
                    <span className="ml-auto shrink-0 flex gap-1 pt-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="w-1 h-1 rounded-full bg-orange-500 animate-bounce"
                          style={{ animationDelay: `${d * 120}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p className="mt-8 text-slate-600 text-[10px] text-center tracking-widest uppercase">
            Do not close this window — analysis in progress
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
    </div>
  )
}
