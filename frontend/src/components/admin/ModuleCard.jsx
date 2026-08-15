import { ChevronRight } from 'lucide-react'

const ACCENTS = {
  orange: {
    icon: 'bg-orange-500/10 text-orange-300 ring-orange-400/15',
    glow: 'bg-orange-500/10',
    border: 'hover:border-orange-400/25',
    badge: 'bg-orange-500/10 text-orange-300 ring-orange-400/15',
  },
  blue: {
    icon: 'bg-sky-500/10 text-sky-300 ring-sky-400/15',
    glow: 'bg-sky-500/10',
    border: 'hover:border-sky-400/25',
    badge: 'bg-sky-500/10 text-sky-300 ring-sky-400/15',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/15',
    glow: 'bg-emerald-500/10',
    border: 'hover:border-emerald-400/25',
    badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/15',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-300 ring-violet-400/15',
    glow: 'bg-violet-500/10',
    border: 'hover:border-violet-400/25',
    badge: 'bg-violet-500/10 text-violet-300 ring-violet-400/15',
  },
  rose: {
    icon: 'bg-rose-500/10 text-rose-300 ring-rose-400/15',
    glow: 'bg-rose-500/10',
    border: 'hover:border-rose-400/25',
    badge: 'bg-rose-500/10 text-rose-300 ring-rose-400/15',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-300 ring-amber-400/15',
    glow: 'bg-amber-500/10',
    border: 'hover:border-amber-400/25',
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/15',
  },
  cyan: {
    icon: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/15',
    glow: 'bg-cyan-500/10',
    border: 'hover:border-cyan-400/25',
    badge: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/15',
  },
  lime: {
    icon: 'bg-lime-500/10 text-lime-300 ring-lime-400/15',
    glow: 'bg-lime-500/10',
    border: 'hover:border-lime-400/25',
    badge: 'bg-lime-500/10 text-lime-300 ring-lime-400/15',
  },
}

function ModuleCard({
  title,
  description,
  icon: Icon,
  accent = 'orange',
  count,
  countLabel,
  onClick,
}) {
  const styles = ACCENTS[accent] || ACCENTS.orange

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[150px] overflow-hidden rounded-[18px] border border-white/[0.075] bg-[#171311] p-4 text-left shadow-[0_16px_45px_rgba(0,0,0,0.19)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1b1613] hover:shadow-[0_22px_60px_rgba(0,0,0,0.28)] ${styles.border}`}
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`} />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset transition duration-300 group-hover:scale-105 ${styles.icon}`}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-white/25 transition group-hover:translate-x-0.5 group-hover:bg-orange-500/10 group-hover:text-orange-300">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold tracking-tight text-white/85">{title}</h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/32">{description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-white/22 transition group-hover:text-white/40">
            Abrir módulo
          </span>
          {count !== undefined && count !== null && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${styles.badge}`}>
              {count} {countLabel}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default ModuleCard
