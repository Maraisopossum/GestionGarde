import clsx from 'clsx'
import { Crosshair, X } from 'lucide-react'
import { matchesCap } from '../../domain/selectors'
import { SPECIALITES } from '../../domain/types'
import { useDerived } from '../../store/useDerived'
import { useUI, type CapFilter } from '../../store/useUI'
import { CAP_META } from '../ui/badges'

const CAPS: Exclude<CapFilter, null>[] = [...SPECIALITES, 'CHEF', 'CHAUFFEUR']

/**
 * Repérage sur le tableau : la capacité choisie (ici ou dans le panneau personnel)
 * met en surbrillance les personnes disponibles concernées, directement sur leurs postes.
 */
export function HighlightBar() {
  const cap = useUI((s) => s.capFilter)
  const setCapFilter = useUI((s) => s.setCapFilter)
  const d = useDerived()

  const matches = cap ? d.disponibles.filter((p) => matchesCap(p, cap)) : []
  const onPost = matches.filter((p) => d.status[p.id].posts.length > 0).length
  const free = matches.length - onPost

  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5 rounded-xl border px-2.5 py-2', cap ? 'border-slate-300 bg-white shadow-sm' : 'border-line/80 bg-white/60')}>
      <span className="mr-1 flex items-center gap-1.5 text-[11.5px] font-bold tracking-wider text-slate-500 uppercase">
        <Crosshair className="size-4" /> Repérer
      </span>
      {CAPS.map((c) => {
        const m = CAP_META[c]
        const on = cap === c
        return (
          <button
            key={c}
            type="button"
            aria-pressed={on}
            onClick={() => setCapFilter(on ? null : c)}
            className={clsx(
              'h-7 rounded-full px-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors',
              on ? clsx(m.solid, 'text-white shadow-sm') : clsx(m.soft, m.text, 'hover:brightness-95'),
            )}
          >
            {m.label}
          </button>
        )
      })}
      {cap && (
        <>
          <span className="ml-1 text-[12.5px] text-slate-600">
            <b className={clsx('tabular-nums', matches.length ? CAP_META[cap].text : 'text-mission')}>{matches.length}</b> disponible{matches.length > 1 ? 's' : ''}
            {matches.length > 0 && <span className="text-slate-400"> · {onPost} sur un poste{free > 0 && `, ${free} sans poste`}</span>}
          </span>
          <button type="button" onClick={() => setCapFilter(null)} className="ml-auto flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <X className="size-3.5" /> Effacer
          </button>
        </>
      )}
    </div>
  )
}
