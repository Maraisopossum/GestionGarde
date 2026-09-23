import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { GripVertical, Search, UserMinus, X } from 'lucide-react'
import { useMemo } from 'react'
import { personName, postShort, PRESENCE_LABEL } from '../../domain/selectors'
import { GRADE_RANK, SPECIALITES, type Person, type PersonStatus } from '../../domain/types'
import { useDerived } from '../../store/useDerived'
import { useUI, type CapFilter, type StatusFilter } from '../../store/useUI'
import type { DragData } from '../board/PostSlot'
import { Avatar, CAP_META, MissionTag, PERSON_STATUS_META, SPEC_META, SpecBadges } from '../ui/badges'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'DISPO', label: 'Disponibles' },
  { id: 'LIBRE', label: 'Sans poste' },
  { id: 'MISSION', label: 'En mission' },
  { id: 'TOUS', label: 'Tous' },
]

const CAPS: { id: Exclude<CapFilter, null>; label: string }[] = [
  ...SPECIALITES.map((s) => ({ id: s, label: SPEC_META[s].label })),
  { id: 'CHEF', label: 'Chef' },
  { id: 'CHAUFFEUR', label: 'Chauffeur' },
]

export function statusLine(p: Person, st: PersonStatus): string {
  if (st.kind === 'ABSENT') return PRESENCE_LABEL[p.presence]
  if (st.kind === 'EN_MISSION') return st.vehiclePosts.map(postShort)[0] ?? ''
  if (st.posts.length) return st.posts.map(postShort).join(' + ')
  return 'Sans poste'
}

export function usePersonFilter() {
  const d = useDerived()
  const statusFilter = useUI((s) => s.statusFilter)
  const capFilter = useUI((s) => s.capFilter)
  const search = useUI((s) => s.search)
  return useMemo(() => {
    const q = search.trim().toLowerCase()
    const order = { LIBRE: 0, AFFECTE: 1, EN_MISSION: 2, ABSENT: 3 }
    return Object.values(d.personById)
      .filter((p) => {
        const k = d.status[p.id].kind
        if (statusFilter === 'DISPO' && (k === 'EN_MISSION' || k === 'ABSENT')) return false
        if (statusFilter === 'LIBRE' && k !== 'LIBRE') return false
        if (statusFilter === 'MISSION' && k !== 'EN_MISSION') return false
        if (capFilter === 'CHEF' || capFilter === 'CHAUFFEUR') { if (!p.fonctions.includes(capFilter)) return false }
        else if (capFilter && !p.specialites.includes(capFilter)) return false
        if (q && !`${p.grade} ${p.nom} ${p.prenom} ${p.specialites.join(' ')} ${statusLine(p, d.status[p.id])}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) =>
        order[d.status[a.id].kind] - order[d.status[b.id].kind] ||
        GRADE_RANK[b.grade] - GRADE_RANK[a.grade] ||
        a.nom.localeCompare(b.nom))
  }, [d, statusFilter, capFilter, search])
}

function PersonRow({ person }: { person: Person }) {
  const d = useDerived()
  const openSheet = useUI((s) => s.openSheet)
  const st = d.status[person.id]
  const movable = st.kind === 'LIBRE' || st.kind === 'AFFECTE'
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `panel:${person.id}`,
    data: { personId: person.id, from: null } satisfies DragData,
    disabled: !movable,
  })
  const meta = PERSON_STATUS_META[st.kind]
  return (
    <li>
      <button
        ref={setNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        onClick={() => openSheet(person.id)}
        className={clsx(
          'group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-ink/[0.03] focus-visible:ring-2 focus-visible:ring-sky-500 touch-manipulation',
          isDragging && 'opacity-30',
          movable && 'cursor-grab active:cursor-grabbing',
          st.kind === 'ABSENT' && 'opacity-60',
        )}
      >
        <Avatar person={person} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="truncate text-[13px] font-semibold text-ink">{personName(person)}</span>
            <span className="truncate text-[11.5px] text-ink/45">{person.prenom}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11.5px]">
            <span className={clsx('size-1.5 shrink-0 rounded-full', meta.dot)} />
            <span className={clsx('truncate', st.kind === 'LIBRE' ? 'font-medium text-ok' : st.kind === 'EN_MISSION' ? 'text-mission' : 'text-muted')}>
              {statusLine(person, st)}
            </span>
          </span>
        </span>
        {st.kind === 'EN_MISSION' && <MissionTag />}
        <SpecBadges specs={person.specialites} />
        {movable && <GripVertical className="size-4 shrink-0 text-ink/30 opacity-0 group-hover:opacity-100" />}
      </button>
    </li>
  )
}

export function AvailablePanel({ className, onClose }: { className?: string; onClose?: () => void }) {
  const d = useDerived()
  const list = usePersonFilter()
  const { statusFilter, capFilter, search, setStatusFilter, setCapFilter, setSearch } = useUI()
  const { active } = useDndContext()
  const fromPost = (active?.data.current as DragData | undefined)?.from
  const { setNodeRef, isOver } = useDroppable({ id: 'panel', data: { panel: true } })

  return (
    <section ref={setNodeRef} aria-label="Personnel disponible" className={clsx('relative flex min-h-0 flex-col rounded-xl border border-line bg-paper', className)}>
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">Personnel disponible</h2>
        <p className="ml-auto font-display text-[22px] leading-none font-semibold text-ok tabular-nums">
          {d.disponibles.length}<span className="text-[15px] text-ink/45"> / {d.presents.length}</span>
        </p>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-8 place-items-center rounded text-ink/45 hover:bg-ink/[0.05]">
            <X className="size-5" />
          </button>
        )}
      </header>

      <div className="space-y-2 px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/45" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un personnel…"
            className="h-9 w-full rounded-md border border-line bg-ink/[0.03] pr-8 pl-8 text-sm outline-none focus:border-sky-500 focus:bg-paper"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Effacer" className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded text-ink/45 hover:text-ink/85">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 rounded-md bg-ink/[0.05] p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={clsx('h-7 rounded text-[11.5px] font-semibold', statusFilter === t.id ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CAPS.map((c) => {
            const on = capFilter === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCapFilter(on ? null : c.id)}
                aria-pressed={on}
                className={clsx(
                  'h-7 rounded-full border px-2.5 text-[11px] font-semibold tracking-wide uppercase transition-colors',
                  on ? clsx('border-transparent text-white shadow-sm', CAP_META[c.id].solid) : clsx('border-transparent', CAP_META[c.id].soft, CAP_META[c.id].text, 'hover:border-ink/25'),
                )}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto border-t border-line px-1.5 py-1.5">
        {list.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Aucun résultat pour ces filtres</li>}
        {list.map((p) => <PersonRow key={p.id} person={p} />)}
      </ul>

      {fromPost && (
        <div className={clsx(
          'pointer-events-none absolute inset-0 grid place-items-center rounded-xl border-2 border-dashed backdrop-blur-[1px] transition-colors',
          isOver ? 'border-reserve bg-reserve-soft/90' : 'border-ink/25 bg-paper/85',
        )}>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink/85">
            <UserMinus className="size-5" /> Déposer ici pour retirer du poste
          </p>
        </div>
      )}
    </section>
  )
}
