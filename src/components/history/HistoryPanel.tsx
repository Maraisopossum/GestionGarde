import clsx from 'clsx'
import { Link } from 'react-router-dom'
import type { HistoryEntry } from '../../domain/types'
import { fmtTime } from '../../lib/time'
import { useGarde } from '../../store/useGarde'

export const KIND_DOT: Record<HistoryEntry['kind'], string> = {
  sortie: 'bg-mission',
  retour: 'bg-ok-dot',
  affectation: 'bg-sky-500',
  deplacement: 'bg-sky-500',
  permutation: 'bg-violet-500',
  liberation: 'bg-slate-400',
  etat: 'bg-reserve',
  presence: 'bg-amber-400',
  systeme: 'bg-slate-300',
}

export function HistoryItem({ h }: { h: HistoryEntry }) {
  return (
    <li className="relative grid grid-cols-[44px_1fr] gap-2 py-1.5">
      <span className="pt-px text-[12.5px] font-semibold text-slate-700 tabular-nums">{fmtTime(h.at)}</span>
      <span className="relative pl-4">
        <span className={clsx('absolute top-[5px] left-0 size-2 rounded-full', KIND_DOT[h.kind])} />
        <span className="block text-[12.5px] leading-snug text-slate-800">{h.text}</span>
        <span className="block text-[11px] text-slate-400">Par {h.by}</span>
      </span>
    </li>
  )
}

export function HistoryPanel({ limit = 6 }: { limit?: number }) {
  const history = useGarde((s) => s.history)
  return (
    <section aria-label="Dernières modifications" className="rounded-xl border border-line bg-white px-3 pt-3 pb-2">
      <header className="mb-1 flex items-center">
        <h2 className="font-display text-[17px] font-bold tracking-wide text-ink uppercase">Dernières modifications</h2>
        <Link to="/historique" className="ml-auto text-[12.5px] font-semibold text-sky-700 hover:underline">Tout voir</Link>
      </header>
      <ol>{history.slice(0, limit).map((h) => <HistoryItem key={h.id} h={h} />)}</ol>
    </section>
  )
}
