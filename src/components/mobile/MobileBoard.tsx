import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { SectionId, Specialite, Vehicle } from '../../domain/types'
import { matchesCap } from '../../domain/selectors'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { HighlightBar } from '../board/HighlightBar'
import { MainAction, StateMenu } from '../board/VehicleCard'
import { PostSlot } from '../board/PostSlot'
import { SECTION_META, vehiclesOf } from '../board/Sections'
import { AlertBar } from '../layout/AlertBar'
import { CAP_META, SpecBadge, StatePill, STATE_META } from '../ui/badges'

function VehicleRow({ vehicle, title }: { vehicle: Vehicle; title: string }) {
  const [open, setOpen] = useState(false)
  const status = useGarde((s) => s.vehicleStatus[vehicle.id])
  const assignments = useGarde((s) => s.assignments)
  const d = useDerived()
  const flash = useUI((s) => s.flashVehicleId === vehicle.id)
  const crew = vehicle.posts.map((p) => assignments[p.id]).filter(Boolean)
  const specs = [...new Set(crew.flatMap((pid) => d.personById[pid]?.specialites ?? []))] as Specialite[]
  const out = status.state === 'EN_MISSION'
  // Repérage actif : les véhicules qui comptent une personne concernée s'ouvrent et ressortent.
  const cap = useUI((s) => s.capFilter)
  const hit = !!cap && !out && crew.some((pid) => d.personById[pid] && matchesCap(d.personById[pid], cap))
  const expanded = open || hit

  return (
    <div
      id={`veh-${vehicle.id}`}
      className={clsx(
        'overflow-hidden rounded-xl border bg-paper transition-opacity',
        out ? 'border-mission/35' : 'border-line',
        flash && 'ring-4 ring-sky-400/60',
        hit && clsx('ring-2', CAP_META[cap!].ring),
        cap && !hit && 'opacity-50',
      )}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={expanded} className="flex w-full items-stretch gap-3 py-2.5 pr-3 pl-0 text-left">
        <span className={clsx('w-1.5 shrink-0 rounded-r', STATE_META[status.state].bar)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[17px] leading-tight font-semibold tracking-tight text-ink">{title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <span className={clsx('font-semibold tabular-nums', crew.length < vehicle.posts.length && 'text-reserve')}>
              {crew.length}/{vehicle.posts.length}
            </span>
            armés
            {specs.map((s) => <SpecBadge key={s} sp={s} variant="icon" />)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <StatePill state={status.state} since={status.since} size="sm" />
          <ChevronDown className={clsx('size-5 text-ink/45 transition-transform', expanded && 'rotate-180')} />
        </span>
      </button>
      {expanded && (
        <div className="space-y-1.5 border-t border-line px-3 pt-2.5 pb-3">
          {vehicle.posts.map((p) => <PostSlot key={p.id} post={p} locked={out} />)}
          <div className="flex items-center gap-2 pt-1.5">
            <div className="flex-1"><MainAction vehicles={[vehicle]} /></div>
            <StateMenu vehicle={vehicle} />
          </div>
        </div>
      )}
    </div>
  )
}

function MobileSection({ id, collapsible = false }: { id: SectionId; collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible)
  const vehicleStatus = useGarde((s) => s.vehicleStatus)
  const m = SECTION_META[id]
  const Icon = m.icon
  const list = vehiclesOf(id)
  const dispo = list.filter((v) => vehicleStatus[v.id]?.state === 'DISPONIBLE').length
  const outN = list.filter((v) => vehicleStatus[v.id]?.state === 'EN_MISSION').length
  return (
    <section>
      <button type="button" onClick={() => collapsible && setOpen((o) => !o)} className="mb-2 flex w-full items-center gap-2 px-1">
        <span className={clsx('grid size-7 place-items-center rounded-full text-white', m.tone)}><Icon className="size-4" /></span>
        <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">{m.title}</h2>
        {id !== 'coordination' && (
          <span className="ml-auto text-[12px] text-muted">
            <b className="text-ok">{dispo}</b> dispo{outN > 0 && <> · <b className="text-mission">{outN}</b> sortis</>}
          </span>
        )}
        {collapsible && <ChevronDown className={clsx('ml-auto size-5 text-ink/45', open && 'rotate-180')} />}
      </button>
      {open && (
        id === 'coordination' ? (
          <div className="space-y-1.5 rounded-xl border border-line bg-paper p-3">
            {list.map((v) => (
              <div key={v.id} className="grid grid-cols-[104px_1fr] items-center gap-2">
                <span className="truncate text-[11.5px] font-semibold text-muted uppercase">{v.nom}</span>
                <PostSlot post={v.posts[0]} locked={false} label={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((v) => <VehicleRow key={v.id} vehicle={v} title={v.groupe ? `${v.groupe} · ${v.id.startsWith('vo') ? 'VO' : 'P'}` : v.nom} />)}
          </div>
        )
      )}
    </section>
  )
}

/** Vue mobile : d'abord l'état des véhicules, détail à la demande. */
export function MobileBoard() {
  return (
    <div className="space-y-5 px-3 pt-3 pb-4">
      <AlertBar />
      <HighlightBar />
      <MobileSection id="incendie" />
      <MobileSection id="ambulances" />
      <MobileSection id="techniques" />
      <MobileSection id="coordination" collapsible />
    </div>
  )
}
