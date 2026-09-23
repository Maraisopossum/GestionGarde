import clsx from 'clsx'
import { ArrowDown, ArrowUp, Check, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Page } from '../components/layout/Page'
import { statusLine } from '../components/people/AvailablePanel'
import { Avatar, OrgBadge, PERSON_STATUS_META, SPEC_META, SpecBadges } from '../components/ui/badges'
import { personName } from '../domain/selectors'
import { GRADE_RANK, SPECIALITES, type Person, type PersonStatusKind } from '../domain/types'
import { useIsMobile } from '../lib/useMedia'
import { useDerived } from '../store/useDerived'
import { useUI } from '../store/useUI'

type SortKey = 'nom' | 'grade' | 'statut' | 'affectation'
const STATUS_ORDER: Record<PersonStatusKind, number> = { LIBRE: 0, AFFECTE: 1, EN_MISSION: 2, ABSENT: 3 }
const FILTERS: { id: 'TOUS' | PersonStatusKind | 'DISPO'; label: string }[] = [
  { id: 'TOUS', label: 'Tous' },
  { id: 'DISPO', label: 'Disponibles' },
  { id: 'LIBRE', label: 'Sans poste' },
  { id: 'EN_MISSION', label: 'En mission' },
  { id: 'ABSENT', label: 'Absents' },
]

function StatusCell({ kind }: { kind: PersonStatusKind }) {
  const m = PERSON_STATUS_META[kind]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-[12.5px] font-semibold', m.text)}>
      <span className={clsx('size-2 rounded-full', m.dot)} />
      {kind === 'LIBRE' ? 'Disponible' : m.label}
    </span>
  )
}

export function Personnel() {
  const d = useDerived()
  const openSheet = useUI((s) => s.openSheet)
  const mobile = useIsMobile()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('TOUS')
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'grade', asc: false })

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    const list = Object.values(d.personById).filter((p) => {
      const k = d.status[p.id].kind
      if (filter === 'DISPO' && (k === 'EN_MISSION' || k === 'ABSENT')) return false
      if (filter !== 'TOUS' && filter !== 'DISPO' && k !== filter) return false
      return !n || `${p.grade} ${p.nom} ${p.prenom} ${p.specialites.join(' ')} ${statusLine(p, d.status[p.id])}`.toLowerCase().includes(n)
    })
    const cmp: Record<SortKey, (a: Person, b: Person) => number> = {
      nom: (a, b) => a.nom.localeCompare(b.nom),
      grade: (a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || b.nom.localeCompare(a.nom),
      statut: (a, b) => STATUS_ORDER[d.status[a.id].kind] - STATUS_ORDER[d.status[b.id].kind],
      affectation: (a, b) => statusLine(a, d.status[a.id]).localeCompare(statusLine(b, d.status[b.id])),
    }
    return list.sort((a, b) => (sort.asc ? 1 : -1) * cmp[sort.key](a, b) || a.nom.localeCompare(b.nom))
  }, [d, q, filter, sort])

  const counts = {
    TOUS: d.presents.length + Object.values(d.status).filter((s) => s.kind === 'ABSENT').length,
    DISPO: d.disponibles.length,
    LIBRE: Object.values(d.status).filter((s) => s.kind === 'LIBRE').length,
    EN_MISSION: d.enMission.length,
    ABSENT: Object.values(d.status).filter((s) => s.kind === 'ABSENT').length,
    AFFECTE: 0,
  }

  const Th = ({ k, children, className }: { k?: SortKey; children: ReactNode; className?: string }) => (
    <th className={clsx('px-3 py-2.5 text-left text-[11px] font-semibold tracking-wider text-muted uppercase', className)}>
      {k ? (
        <button type="button" onClick={() => setSort((s) => ({ key: k, asc: s.key === k ? !s.asc : true }))} className="inline-flex items-center gap-1 hover:text-ink">
          {children}
          {sort.key === k && (sort.asc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
        </button>
      ) : children}
    </th>
  )

  return (
    <Page title="Personnel" subtitle={`${counts.TOUS} personnes dans la garde · ${d.disponibles.length} disponibles · ${d.enMission.length} en mission`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-full rounded-md border border-line bg-paper pl-8 text-sm outline-none focus:border-sky-500" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={clsx('h-9 rounded-md border px-3 text-[12.5px] font-semibold', filter === f.id ? 'border-ink bg-ink text-paper shadow-inset' : 'border-line bg-paper text-muted hover:bg-ink/[0.03]')}>
              {f.label} <span className="opacity-60 tabular-nums">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {mobile ? (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
          {rows.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => openSheet(p.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                <Avatar person={p} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{personName(p)} <span className="font-normal text-ink/45">{p.prenom}</span></span>
                  <span className="block truncate text-[12px] text-muted">{statusLine(p, d.status[p.id])}</span>
                </span>
                <SpecBadges specs={p.specialites} variant="icon" />
                <span className={clsx('size-2.5 shrink-0 rounded-full', PERSON_STATUS_META[d.status[p.id].kind].dot)} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="border-b border-line bg-ink/[0.03]">
              <tr>
                <Th k="nom">Nom</Th>
                <Th k="grade">Grade</Th>
                <Th k="statut">Statut</Th>
                <Th k="affectation">Affectation</Th>
                {SPECIALITES.map((s) => <Th key={s} className="text-center">{SPEC_META[s].label}</Th>)}
                <Th className="text-center">Chef</Th>
                <Th className="text-center">Chauf.</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = d.status[p.id]
                return (
                  <tr key={p.id} onClick={() => openSheet(p.id)} className={clsx('cursor-pointer border-b border-line/70 last:border-0 hover:bg-sky-50/50', st.kind === 'ABSENT' && 'text-ink/45')}>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2.5">
                        <Avatar person={p} />
                        <span className="text-[13.5px] font-semibold text-ink">{p.nom}</span>
                        <span className="text-[12.5px] text-ink/45">{p.prenom}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[13px]">{p.organisme ? <OrgBadge org={p.organisme} short /> : p.grade}</td>
                    <td className="px-3 py-2"><StatusCell kind={st.kind} /></td>
                    <td className="max-w-[260px] truncate px-3 py-2 text-[12.5px] text-muted">{statusLine(p, st)}</td>
                    {SPECIALITES.map((s) => (
                      <td key={s} className="px-3 py-2 text-center">
                        {p.specialites.includes(s) && (() => { const I = SPEC_META[s].icon; return <span className={clsx('inline-grid size-6 place-items-center rounded', SPEC_META[s].soft, SPEC_META[s].text)}><I className="size-3.5" strokeWidth={2.5} /></span> })()}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">{p.fonctions.includes('CHEF') && <Check className="inline size-4 text-muted" />}</td>
                    <td className="px-3 py-2 text-center">{p.fonctions.includes('CHAUFFEUR') && <Check className="inline size-4 text-muted" />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  )
}
