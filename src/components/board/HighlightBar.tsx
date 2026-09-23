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
export function HighlightBar({ className }: { className?: string }) {
  const cap = useUI((s) => s.capFilter)
  const setCapFilter = useUI((s) => s.setCapFilter)
  const d = useDerived()

  const matches = cap ? d.disponibles.filter((p) => matchesCap(p, cap)) : []
  const onPost = matches.filter((p) => d.status[p.id].posts.length > 0).length
  const free = matches.length - onPost

  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5', className)}>
      <span className="mr-0.5 flex items-center gap-1 text-[12.5px] text-muted" title="Mettre en surbrillance sur le tableau">
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
              'h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors active:opacity-80',
              on ? clsx(m.solid, 'text-white shadow-sm') : clsx(m.soft, m.text, 'hover:brightness-95'),
            )}
          >
            {m.label}
          </button>
        )
      })}
      {cap && (
        <>
          <span className="ml-1 text-[12.5px] whitespace-nowrap text-muted">
            <b className={clsx('tabular-nums', matches.length ? CAP_META[cap].text : 'text-mission')}>{matches.length}</b> disponible{matches.length > 1 ? 's' : ''}
            {matches.length > 0 && <span className="text-ink/45"> · {onPost} sur un poste{free > 0 && `, ${free} sans poste`}</span>}
          </span>
          <button type="button" onClick={() => setCapFilter(null)} className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold text-muted hover:bg-ink/[0.05] hover:text-ink">
            <X className="size-3.5" /> Effacer
          </button>
        </>
      )}
    </div>
  )
}
