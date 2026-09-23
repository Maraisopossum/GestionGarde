import clsx from 'clsx'
import { Check, CornerDownLeft, EllipsisVertical, Pencil, Siren, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ORG_META } from '../../domain/selectors'
import { ORGANISMES, type Organisme, type Vehicle, type VehicleState } from '../../domain/types'
import { fmtDuration, useNow } from '../../lib/time'
import { STATE_LABEL, useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { OrgBadge, SpecBadge, StatePill, STATE_META } from '../ui/badges'
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

export function MainAction({ vehicles, size = 'md', full = true }: { vehicles: Vehicle[]; size?: 'sm' | 'md'; full?: boolean }) {
  const states = useGarde((s) => vehicles.map((v) => s.vehicleStatus[v.id]?.state).join(','))
  const setVehicleState = useGarde((s) => s.setVehicleState)
  const { sortir, retour } = useVehicleActions()
  const list = states.split(',') as VehicleState[]
  const base = clsx(
    'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 active:opacity-80 touch-manipulation',
    size === 'md' ? 'h-9 px-4 text-[14px]' : 'h-8 px-3 text-[13px]',
    full && 'w-full',
  )
  if (list.every((s) => s === 'EN_MISSION'))
    return (
      <button type="button" onClick={() => retour(vehicles.map((v) => v.id))} className={clsx(base, 'bg-ok text-paper shadow-inset hover:bg-green-800')}>
        <CornerDownLeft className="size-4" strokeWidth={2.5} /> Retour disponible
      </button>
    )
  if (list.every((s) => s === 'DISPONIBLE'))
    return (
      <button type="button" onClick={() => sortir(vehicles)} className={clsx(base, 'border border-mission/40 bg-transparent text-mission hover:border-mission hover:bg-mission hover:text-paper')}>
        <Siren className="size-4" strokeWidth={2.5} /> Sortir
      </button>
    )
  if (vehicles.length === 1)
    return (
      <button type="button" onClick={() => setVehicleState(vehicles[0].id, 'DISPONIBLE')} className={clsx(base, 'border border-ink/40 bg-transparent text-ink hover:bg-ink/[0.04]')}>
        Remettre disponible
      </button>
    )
  return null
}

/* ----------------------------------------------------------------- Menu du véhicule */

export function StateMenu({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = useGarde((s) => s.vehicleStatus[vehicle.id]?.state)
  const org = useGarde((s) => s.vehicleOrg[vehicle.id])
  const setVehicleState = useGarde((s) => s.setVehicleState)
  const setVehicleOrg = useGarde((s) => s.setVehicleOrg)
  const removeVehicle = useGarde((s) => s.removeVehicle)
  const ask = useUI((s) => s.ask)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] text-ink/85 hover:bg-ink/[0.04] disabled:font-semibold disabled:text-ink'
  const pick = (o: Organisme | null) => { setVehicleOrg(vehicle.id, o); setOpen(false) }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Options de ${vehicle.nom}`}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'grid size-7 place-items-center rounded-full text-ink/45 hover:bg-ink/[0.05] hover:text-ink/85 focus-visible:opacity-100',
          !open && 'pointer-fine:opacity-0 pointer-fine:group-hover/card:opacity-100',
        )}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute top-8 right-0 z-30 w-56 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-focus">
          <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-ink/45">État</p>
          {(['DISPONIBLE', 'EN_MISSION', 'RESERVE', 'INDISPONIBLE'] as VehicleState[]).map((st) => (
            <button key={st} type="button" disabled={st === current} onClick={() => { setVehicleState(vehicle.id, st); setOpen(false) }} className={item}>
              <span className={clsx('size-2.5 rounded-full', STATE_META[st].dot)} />
              {STATE_LABEL[st]}
              {st === current && <Check className="ml-auto size-4 text-ink/45" />}
            </button>
          ))}
          <p className="mt-1 border-t border-line px-3 pt-2 pb-1 text-[11px] font-medium text-ink/45">Armé par</p>
          <button type="button" disabled={!org} onClick={() => pick(null)} className={item}>
            SIAMU {!org && <Check className="ml-auto size-4 text-ink/45" />}
          </button>
          {ORGANISMES.map((o) => (
            <button key={o} type="button" disabled={org === o} onClick={() => pick(o)} className={item}>
              <OrgBadge org={o} short /> {ORG_META[o].label}
              {org === o && <Check className="ml-auto size-4 text-ink/45" />}
            </button>
          ))}
          {vehicle.custom && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                ask({
                  title: `Retirer ${vehicle.nom} du tableau ?`,
                  body: 'Le véhicule et ses affectations sont supprimés (action annulable).',
                  confirmLabel: 'Retirer', tone: 'danger',
                  onConfirm: () => removeVehicle(vehicle.id),
                })
              }}
              className={clsx(item, 'mt-1 border-t border-line text-mission')}
            >
              <Trash2 className="size-4" /> Retirer ce véhicule
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- Code + indicatif */

/** « AP 11 » : code de type fixe + indicatif modifiable d'un clic (Entrée valide, Échap annule). */
export function IndicatifTag({ vehicle }: { vehicle: Vehicle }) {
  const value = useGarde((s) => s.indicatifs[vehicle.id] ?? '')
  const setIndicatif = useGarde((s) => s.setIndicatif)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) { setDraft(value); inputRef.current?.select() } }, [editing, value])
  const save = () => { setIndicatif(vehicle.id, draft); setEditing(false) }

  return (
    <span className="inline-flex h-6 items-center overflow-hidden rounded-full border border-line bg-paper text-[12px]">
      {vehicle.code && <span className="flex h-full items-center bg-ink px-2 font-semibold text-paper">{vehicle.code}</span>}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={save}
          maxLength={12}
          aria-label={`Indicatif de ${vehicle.nom}`}
          className="h-full w-20 bg-sky-50 px-2 font-semibold text-ink outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Modifier l’indicatif"
          className={clsx('group/ind flex h-full items-center gap-1 px-2 hover:bg-ink/[0.04]', value ? 'font-semibold text-ink' : 'text-ink/40')}
        >
          {value || 'indicatif'}
          <Pencil className="size-3 text-ink/30 group-hover/ind:text-ink/60" />
        </button>
      )}
    </span>
  )
}

function Elapsed({ since }: { since: string }) {
  const now = useNow(30_000)
  return <span className="text-[11.5px] font-medium text-mission tabular-nums">depuis {fmtDuration(since, now)}</span>
}

function CrewCount({ vehicle }: { vehicle: Vehicle }) {
  const filled = useGarde((s) => vehicle.posts.filter((p) => s.assignments[p.id]).length)
  const total = vehicle.posts.length
  if (filled === total) return null
  return (
    <span className="text-[11.5px] font-semibold text-reserve tabular-nums" title="Postes armés">
      {filled}/{total}
    </span>
  )
}

/* ----------------------------------------------------------------- Carte */

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const status = useGarde((s) => s.vehicleStatus[vehicle.id])
  const org = useGarde((s) => s.vehicleOrg[vehicle.id])
  const flash = useUI((s) => s.flashVehicleId === vehicle.id)
  if (!status) return null
  const out = status.state === 'EN_MISSION'
  return (
    <article
      id={`veh-${vehicle.id}`}
      className={clsx(
        'group/card flex flex-col overflow-hidden rounded-2xl border bg-paper transition-shadow hover:shadow-focus',
        out ? 'border-mission/35' : org ? 'border-red-300' : 'border-line',
        flash && 'ring-4 ring-sky-400/60',
      )}
    >
      <div className={clsx('h-1', STATE_META[status.state].bar)} />
      <header className={clsx('px-3 pt-2 pb-2', out && 'bg-mission-soft/50')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[17px] leading-tight font-semibold tracking-tight text-ink">{vehicle.nom}</h3>
          <StateMenu vehicle={vehicle} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <StatePill state={status.state} since={status.since} />
          {(vehicle.code || vehicle.section !== 'coordination') && <IndicatifTag vehicle={vehicle} />}
          {org && <OrgBadge org={org} />}
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
