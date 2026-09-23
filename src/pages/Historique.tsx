import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HistoryItem } from '../components/history/HistoryPanel'
import { Page } from '../components/layout/Page'
import type { HistoryKind } from '../domain/types'
import { useGarde } from '../store/useGarde'

const GROUPS: { id: string; label: string; kinds: HistoryKind[] | null }[] = [
  { id: 'all', label: 'Tout', kinds: null },
  { id: 'veh', label: 'Sorties / retours', kinds: ['sortie', 'retour', 'etat'] },
  { id: 'aff', label: 'Affectations', kinds: ['affectation', 'deplacement', 'permutation', 'liberation'] },
  { id: 'pres', label: 'Présences', kinds: ['presence'] },
]

export function Historique() {
  const history = useGarde((s) => s.history)
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const kinds = GROUPS.find((g) => g.id === group)?.kinds
    const n = q.trim().toLowerCase()
    return history.filter((h) => (!kinds || kinds.includes(h.kind)) && (!n || `${h.text} ${h.by}`.toLowerCase().includes(n)))
  }, [history, group, q])

  return (
    <Page title="Historique" subtitle={`${history.length} événements depuis la prise de garde`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-full rounded-md border border-line bg-paper pl-8 text-sm outline-none focus:border-sky-500" />
        </div>
        {GROUPS.map((g) => (
          <button key={g.id} type="button" onClick={() => setGroup(g.id)} className={clsx('h-9 rounded-md border px-3 text-[12.5px] font-semibold', group === g.id ? 'border-ink bg-ink text-paper shadow-inset' : 'border-line bg-paper text-muted hover:bg-ink/[0.03]')}>
            {g.label}
          </button>
        ))}
      </div>
      <ol className="max-w-3xl rounded-xl border border-line bg-paper px-4 py-2">
        {list.length === 0 && <li className="py-6 text-center text-sm text-muted">Aucun événement.</li>}
        {list.map((h) => <HistoryItem key={h.id} h={h} />)}
      </ol>
    </Page>
  )
}
