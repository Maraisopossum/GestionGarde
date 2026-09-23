import clsx from 'clsx'
import { ChevronDown, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HistoryEntry } from '../../domain/types'
import { fmtTime } from '../../lib/time'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'

export const KIND_DOT: Record<HistoryEntry['kind'], string> = {
  sortie: 'bg-mission',
  retour: 'bg-ok-dot',
  affectation: 'bg-sky-500',
  deplacement: 'bg-sky-500',
  permutation: 'bg-violet-500',
  liberation: 'bg-ink/30',
  etat: 'bg-reserve',
  presence: 'bg-amber-400',
  systeme: 'bg-ink/25',
}

export function HistoryItem({ h }: { h: HistoryEntry }) {
  return (
    <li className="relative grid grid-cols-[44px_1fr] gap-2 py-1.5">
      <span className="pt-px text-[12.5px] font-semibold text-ink/85 tabular-nums">{fmtTime(h.at)}</span>
      <span className="relative pl-4">
        <span className={clsx('absolute top-[5px] left-0 size-2 rounded-full', KIND_DOT[h.kind])} />
        <span className="block text-[12.5px] leading-snug text-ink">{h.text}</span>
        <span className="block text-[11px] text-ink/45">Par {h.by}</span>
      </span>
    </li>
  )
}

export function HistoryPanel({ limit = 6, collapsible = true }: { limit?: number; collapsible?: boolean }) {
  const history = useGarde((s) => s.history)
  const storedOpen = useUI((s) => s.historyOpen)
  const toggle = useUI((s) => s.toggleHistory)
  const open = !collapsible || storedOpen
  const last = history[0]
  return (
    <section aria-label="Dernières modifications" className="rounded-2xl border border-line bg-paper">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={collapsible ? toggle : undefined}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <History className="size-4 shrink-0 text-muted" />
          <span className="shrink-0 text-[14px] font-semibold tracking-tight text-ink">Dernières modifications</span>
          {collapsible && <ChevronDown className={clsx('size-4 shrink-0 text-ink/40 transition-transform', open && 'rotate-180')} />}
        </button>
        <Link to="/historique" className="shrink-0 text-[12px] font-medium text-ink/60 underline-offset-2 hover:text-ink hover:underline">Tout voir</Link>
      </header>
      {open ? (
        <ol className="border-t border-line px-3 pt-1 pb-2">{history.slice(0, limit).map((h) => <HistoryItem key={h.id} h={h} />)}</ol>
      ) : last && (
        <button type="button" onClick={toggle} className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-[12px] text-muted">
          <span className={clsx('size-1.5 shrink-0 rounded-full', KIND_DOT[last.kind])} />
          <span className="font-semibold tabular-nums text-ink/70">{fmtTime(last.at)}</span>
          <span className="truncate">{last.text}</span>
        </button>
      )}
    </section>
  )
}
