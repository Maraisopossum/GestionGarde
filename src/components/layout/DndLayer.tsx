import {
  DndContext, DragOverlay, MouseSensor, pointerWithin, rectIntersection, TouchSensor, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useState, type ReactNode } from 'react'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { useAssign } from '../board/PostPicker'
import { PersonInline, type DragData } from '../board/PostSlot'

// Le pointeur prime (précis sur des postes serrés) ; repli sur l'intersection.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

/** Contexte de glisser-déposer : panneau personnel ⇄ postes ⇄ postes. */
export function DndLayer({ children }: { children: ReactNode }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )
  const d = useDerived()
  const assign = useAssign()
  const unassign = useGarde((s) => s.unassign)
  const [active, setActive] = useState<DragData | null>(null)

  const onStart = (e: DragStartEvent) => {
    setActive(e.active.data.current as DragData)
    useUI.getState().closePicker()
  }
  const onEnd = (e: DragEndEvent) => {
    setActive(null)
    const data = e.active.data.current as DragData | undefined
    const over = e.over?.data.current as { postId?: string; panel?: boolean } | undefined
    if (!data || !over) return
    if (over.panel) {
      if (data.from) unassign(data.from)
      return
    }
    if (over.postId && over.postId !== data.from) assign(d.personById[data.personId], over.postId, data.from)
  }

  const person = active ? d.personById[active.personId] : undefined
  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)} autoScroll={{ threshold: { x: 0, y: 0.12 }, acceleration: 6 }}>
      {children}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
        {person && (
          <div className="flex h-9 w-60 cursor-grabbing items-center rounded-md border border-sky-400 bg-paper px-2 shadow-[0_10px_28px_rgb(15_29_51/0.28)] ring-2 ring-sky-400/30">
            <PersonInline person={person} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
