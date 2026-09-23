import clsx from 'clsx'
import { CornerDownLeft, EllipsisVertical, Siren } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Vehicle, VehicleState } from '../../domain/types'
import { fmtDuration, useNow } from '../../lib/time'
import { STATE_LABEL, useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { SpecBadge, StatePill, STATE_META } from '../ui/badges'
import { PostSlot } from './PostSlot'

/* ----------------------------------------------------------------- Actions */

export function useVehicleActions() {
  const sortir = useGarde((s) => s.sortir)
  const retour = useGarde((s) => s.retour)
  const ask = useUI((s) => s.ask)
  return {
    retour,
    /** Sortie immédiate (annulable) ; confirmation seulement si personne n'est à bord. */
    sortir(vehicles: Vehicle[]) {
      const { assignments } = useGarde.getState()
      const crew = vehicles.flatMap((v) => v.posts).filter((p) => assignments[p.id]).length
      if (crew > 0) return sortir(vehicles.map((v) => v.id))
      ask({
        title: `Sortir ${vehicles.map((v) => v.nom).join(' + ')} sans équipage ?`,
        body: 'Aucun poste n’est armé sur ce véhicule.',
        confirmLabel: 'Sortir quand même',
        tone: 'danger',
        onConfirm: () => sortir(vehicles.map((v) => v.id)),
      })
    },
  }
}

export function MainAction({ vehicles, size = 'md', full = true, suffix }: { vehicles: Vehicle[]; size?: 'sm' | 'md'; full?: boolean; suffix?: string }) {
  const states = useGarde((s) => vehicles.map((v) => s.vehicleStatus[v.id]?.state).join(','))
  const setVehicleState = useGarde((s) => s.setVehicleState)
  const { sortir, retour } = useVehicleActions()
  const list = states.split(',') as VehicleState[]
  const base = clsx(
    'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 active:opacity-80 touch-manipulation',
    size === 'md' ? 'h-9 px-4 text-[14px]' : 'h-8 px-3 text-[13px]',
    full && 'w-full',
  )
  if (list.every((s) => s === 'EN_MISSION'))
    return (
      <button type="button" onClick={() => retour(vehicles.map((v) => v.id))} className={clsx(base, 'bg-ok text-paper shadow-inset hover:bg-green-800')}>
        <CornerDownLeft className="size-4" strokeWidth={2.5} /> {suffix ? `Retour ${suffix}` : 'Retour disponible'}
      </button>
    )
  if (list.every((s) => s === 'DISPONIBLE'))
    return (
      <button type="button" onClick={() => sortir(vehicles)} className={clsx(base, 'border border-mission/40 bg-transparent text-mission hover:border-mission hover:bg-mission hover:text-paper')}>
        <Siren className="size-4" strokeWidth={2.5} /> {vehicles.length > 1 ? 'Sortir le départ' : suffix ? `Sortir ${suffix}` : 'Sortir'}
      </button>
    )
  if (vehicles.length === 1)
    return (
      <button type="button" onClick={() => setVehicleState(vehicles[0].id, 'DISPONIBLE')} className={clsx(base, 'border border-ink/40 bg-transparent text-ink hover:bg-ink/[0.04]')}>
        {suffix ? `${suffix} dispo` : 'Remettre disponible'}
      </button>
    )
  return null
}

export function StateMenu({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = useGarde((s) => s.vehicleStatus[vehicle.id]?.state)
  const setVehicleState = useGarde((s) => s.setVehicleState)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`État de ${vehicle.nom}`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-7 place-items-center rounded text-ink/45 hover:bg-ink/[0.05] hover:text-ink/85"
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute top-8 right-0 z-30 w-48 overflow-hidden rounded-lg border border-line bg-paper py-1 shadow-lg">
          <p className="px-3 pt-1.5 pb-1 text-[10.5px] font-semibold tracking-wider text-ink/45 uppercase">Changer l’état</p>
          {(['DISPONIBLE', 'EN_MISSION', 'RESERVE', 'INDISPONIBLE'] as VehicleState[]).map((st) => (
            <button
              key={st}
              type="button"
              disabled={st === current}
              onClick={() => { setVehicleState(vehicle.id, st); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink/85 hover:bg-ink/[0.03] disabled:font-semibold disabled:text-ink"
            >
              <span className={clsx('size-2.5 rounded-full', STATE_META[st].dot)} />
              {STATE_LABEL[st]}
              {st === current && <span className="ml-auto text-[11px] text-ink/45">actuel</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Elapsed({ since }: { since: string }) {
  const now = useNow(30_000)
  return <span className="text-[11px] font-medium text-mission tabular-nums">depuis {fmtDuration(since, now)}</span>
}

function CrewCount({ vehicle }: { vehicle: Vehicle }) {
  const filled = useGarde((s) => vehicle.posts.filter((p) => s.assignments[p.id]).length)
  const total = vehicle.posts.length
  return (
    <span className={clsx('text-[11px] font-semibold tabular-nums', filled < total ? 'text-reserve' : 'text-ink/45')} title="Postes armés">
      {filled}/{total}
    </span>
  )
}

function useFlash(ids: string[]) {
  return useUI((s) => !!s.flashVehicleId && ids.includes(s.flashVehicleId))
}

/* ----------------------------------------------------------------- Carte simple */

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const status = useGarde((s) => s.vehicleStatus[vehicle.id])
  const flash = useFlash([vehicle.id])
  const out = status.state === 'EN_MISSION'
  return (
    <article
      id={`veh-${vehicle.id}`}
      className={clsx(
        'flex flex-col overflow-hidden rounded-xl border bg-paper transition-shadow',
        out ? 'border-mission/35' : 'border-line',
        flash && 'ring-4 ring-sky-400/60',
      )}
    >
      <div className={clsx('h-1', STATE_META[status.state].bar)} />
      <header className={clsx('px-3 pt-2 pb-2', out && 'bg-mission-soft/50')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[17px] leading-tight font-semibold tracking-tight text-ink">{vehicle.nom}</h3>
          <StateMenu vehicle={vehicle} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatePill state={status.state} since={status.since} />
          {vehicle.specialite && <SpecBadge sp={vehicle.specialite} />}
          {out && status.since && <Elapsed since={status.since} />}
          <span className="ml-auto"><CrewCount vehicle={vehicle} /></span>
        </div>
      </header>
      <div className="flex-1 space-y-1.5 px-3 pt-1 pb-3">
        {vehicle.posts.map((p) => <PostSlot key={p.id} post={p} locked={out} />)}
      </div>
      <footer className="border-t border-line/70 px-3 py-2.5">
        <MainAction vehicles={[vehicle]} size="sm" />
      </footer>
    </article>
  )
}

/* ----------------------------------------------------------------- Départ (VO + P) */

function SubVehicle({ vehicle, title, hint, showState }: { vehicle: Vehicle; title: string; hint: string; showState: boolean }) {
  const status = useGarde((s) => s.vehicleStatus[vehicle.id])
  const out = status.state === 'EN_MISSION'
  return (
    <section className={clsx('border-l-[3px] py-2 pr-2 pl-2.5', out ? 'border-mission bg-mission-soft/40' : status.state === 'DISPONIBLE' ? 'border-ok' : status.state === 'RESERVE' ? 'border-reserve' : 'border-off')}>
      <div className="mb-1.5 flex items-center gap-2">
        <h4 className="text-[11.5px] font-semibold tracking-wide text-muted uppercase" title={hint}>{title}</h4>
        {showState && <StatePill state={status.state} since={status.since} size="sm" />}
        <span className="ml-auto"><CrewCount vehicle={vehicle} /></span>
        <StateMenu vehicle={vehicle} />
      </div>
      <div className="space-y-1.5">
        {vehicle.posts.map((p) => <PostSlot key={p.id} post={p} locked={out} />)}
      </div>
    </section>
  )
}

export function DepartCard({ groupe, vo, p }: { groupe: string; vo: Vehicle; p: Vehicle }) {
  const sVo = useGarde((s) => s.vehicleStatus[vo.id])
  const sP = useGarde((s) => s.vehicleStatus[p.id])
  const flash = useFlash([vo.id, p.id])
  const same = sVo.state === sP.state
  const agg: VehicleState = same ? sVo.state : sVo.state === 'EN_MISSION' || sP.state === 'EN_MISSION' ? 'EN_MISSION' : 'RESERVE'
  const since = sP.state === 'EN_MISSION' ? sP.since : sVo.since
  return (
    <article
      id={`veh-${p.id}`}
      className={clsx(
        'flex flex-col overflow-hidden rounded-xl border bg-paper',
        agg === 'EN_MISSION' ? 'border-mission/35' : 'border-line',
        flash && 'ring-4 ring-sky-400/60',
      )}
    >
      <span id={`veh-${vo.id}`} />
      <div className={clsx('h-1', STATE_META[agg].bar)} />
      <header className={clsx('flex items-center gap-2 px-3 pt-2 pb-1.5', agg === 'EN_MISSION' && 'bg-mission-soft/50')}>
        <h3 className="font-display text-[19px] leading-tight font-semibold tracking-tight text-ink">{groupe}</h3>
        {same && <StatePill state={agg} since={since} />}
        {same && agg === 'EN_MISSION' && since && <Elapsed since={since} />}
      </header>
      <div className="flex-1 space-y-2 px-2 pb-2">
        <SubVehicle vehicle={vo} title="VO R" hint={vo.nom} showState={!same} />
        <SubVehicle vehicle={p} title="Autopompe P" hint={p.nom} showState={!same} />
      </div>
      <footer className="flex gap-2 border-t border-line/70 px-3 py-2.5">
        {same ? (
          <MainAction vehicles={[vo, p]} size="sm" />
        ) : (
          <>
            <div className="flex-1"><MainAction vehicles={[vo]} size="sm" suffix="VO" /></div>
            <div className="flex-1"><MainAction vehicles={[p]} size="sm" suffix="P" /></div>
          </>
        )}
      </footer>
    </article>
  )
}
