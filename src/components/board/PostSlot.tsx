import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { checkPost, matchesCap, personName } from '../../domain/selectors'
import type { Person, Post } from '../../domain/types'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { Avatar, CAP_META, MissionTag, SpecBadges } from '../ui/badges'

export interface DragData { personId: string; from: string | null }

/** Contenu d'une personne dans un poste (réutilisé par l'aperçu de glisser-déposer). */
export function PersonInline({ person, inMission, dense, strong }: { person: Person; inMission?: boolean; dense?: boolean; strong?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <Avatar person={person} size="xs" />
      <span className={clsx('truncate text-slate-800', strong ? 'font-bold text-ink' : 'font-medium', dense ? 'text-[12px]' : 'text-[12.5px]')}>{personName(person)}</span>
      <SpecBadges specs={person.specialites} variant="icon" />
      {inMission && <MissionTag className="ml-auto" />}
    </span>
  )
}

/**
 * Un poste d'un véhicule (ou d'une fonction de coordination).
 * Cible de dépôt + source de glisser ; un clic ouvre le sélecteur rapide.
 */
export function PostSlot({ post, locked, label = true }: { post: Post; locked: boolean; label?: boolean }) {
  const personId = useGarde((s) => s.assignments[post.id])
  const d = useDerived()
  const openPicker = useUI((s) => s.openPicker)
  const pickerPost = useUI((s) => s.picker?.postId)
  const person = personId ? d.personById[personId] : undefined
  const inMission = !!personId && d.status[personId]?.kind === 'EN_MISSION'
  // Repérage d'une spécialité : les personnes disponibles concernées ressortent, les autres s'effacent.
  const cap = useUI((s) => s.capFilter)
  const hl = !!cap && !!person && !inMission && matchesCap(person, cap)
  const dim = !!cap && !!person && !hl

  const { active } = useDndContext()
  const drag = active?.data.current as DragData | undefined
  const dragPerson = drag ? d.personById[drag.personId] : undefined
  const isSource = drag?.from === post.id
  const compat = dragPerson && !isSource ? checkPost(dragPerson, post.id).ok : true

  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `post:${post.id}`, data: { postId: post.id }, disabled: locked })
  const { setNodeRef: dragRef, attributes, listeners, isDragging } = useDraggable({
    id: `drag:${post.id}`,
    data: { personId, from: post.id } satisfies Partial<DragData>,
    disabled: !person || locked || inMission,
  })

  const dragging = !!dragPerson
  const req = post.requires?.length ? post.requires : null

  return (
    <div className={clsx(label && 'grid grid-cols-[42px_1fr] items-center gap-1.5')}>
      {label && (
        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase" title={req ? 'Poste qualifié' : undefined}>
          {post.label}
        </span>
      )}
      <div
        ref={dropRef}
        className={clsx(
          'relative rounded-md transition-[background-color,box-shadow,opacity] duration-100',
          dragging && !isSource && locked && 'opacity-40',
          dragging && !isSource && !locked && compat && !person && 'bg-ok-soft ring-1 ring-ok/40',
          dragging && !isSource && !locked && !compat && 'opacity-45 [background:repeating-linear-gradient(135deg,#f1f5f9_0_6px,#e2e8f0_6px_12px)]',
          isOver && compat && 'ring-2 ring-ok',
          isOver && !compat && 'opacity-100 ring-2 ring-reserve',
        )}
      >
        {person ? (
          <button
            ref={dragRef}
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => openPicker(post.id, e.currentTarget)}
            className={clsx(
              'flex h-8 w-full min-w-0 items-center rounded-md border px-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
              hl ? clsx('border-transparent ring-2 shadow-sm', CAP_META[cap!].soft, CAP_META[cap!].ring)
                : inMission ? 'border-mission/20 bg-mission-soft/60' : 'border-line bg-white hover:border-slate-300 hover:bg-slate-50',
              dim && 'opacity-35',
              !locked && !inMission && 'cursor-grab active:cursor-grabbing',
              isDragging && 'opacity-30',
              pickerPost === post.id && 'ring-2 ring-sky-500',
              'touch-manipulation',
            )}
          >
            <PersonInline person={person} inMission={inMission} dense strong={hl} />
          </button>
        ) : (
          <button
            type="button"
            disabled={locked}
            onClick={(e) => openPicker(post.id, e.currentTarget)}
            className={clsx(
              'group flex h-8 w-full items-center gap-1.5 rounded-md border border-dashed px-2 text-[10.5px] font-semibold tracking-wider uppercase outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
              locked ? 'border-slate-200 text-slate-300' : 'border-slate-300 text-slate-400 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700',
              pickerPost === post.id && 'border-sky-500 bg-sky-50 text-sky-700',
            )}
          >
            <Plus className="size-3.5 opacity-60 group-hover:opacity-100" />
            Poste libre
          </button>
        )}
        {isOver && !compat && (
          <span className="pointer-events-none absolute -top-5 right-0 z-10 rounded bg-reserve px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white shadow">
            Qualification manquante
          </span>
        )}
      </div>
    </div>
  )
}
