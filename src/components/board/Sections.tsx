import clsx from 'clsx'
import { Ambulance, Flame, Network, Plus, Wrench, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { VEHICLES } from '../../data/seed'
import type { SectionId, Vehicle } from '../../domain/types'
import { useGarde } from '../../store/useGarde'
import { AddVehicleDialog } from './AddVehicleDialog'
import { PostSlot } from './PostSlot'
import { VehicleCard } from './VehicleCard'

export const SECTION_META: Record<SectionId, { title: string; icon: LucideIcon; tone: string }> = {
  incendie: { title: 'Incendie', icon: Flame, tone: 'bg-red-600' },
  ambulances: { title: 'Ambulances', icon: Ambulance, tone: 'bg-emerald-600' },
  techniques: { title: 'Véhicules techniques', icon: Wrench, tone: 'bg-sky-700' },
  coordination: { title: 'Coordination', icon: Network, tone: 'bg-violet-700' },
}

export const vehiclesOf = (section: SectionId) => VEHICLES.filter((v) => v.section === section)

/** Abonne le composant aux véhicules armés pendant la garde (le registre est mis à jour en place). */
export const useVehicleRegistry = () => useGarde((s) => s.customVehicles)

/** Bouton « + Armer » d'une section, ouvre la fenêtre de création. */
export function AddVehicleButton({ section, compact }: { section: 'incendie' | 'ambulances' | 'techniques'; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Armer un nouveau véhicule"
        className={clsx('flex h-8 shrink-0 items-center gap-1 rounded-full border border-ink/40 text-[13px] text-ink hover:bg-ink/[0.04] active:opacity-80', compact ? 'px-2' : 'px-3')}
      >
        <Plus className="size-4" /> {!compact && 'Armer'}
      </button>
      {open && <AddVehicleDialog section={section} onClose={() => setOpen(false)} />}
    </>
  )
}

function SectionCount({ vehicles }: { vehicles: Vehicle[] }) {
  const counts = useGarde((s) => {
    let dispo = 0, out = 0
    for (const v of vehicles) {
      const st = s.vehicleStatus[v.id]?.state
      if (st === 'DISPONIBLE') dispo++
      else if (st === 'EN_MISSION') out++
    }
    return `${dispo}|${out}`
  })
  const [dispo, out] = counts.split('|').map(Number)
  return (
    <p className="flex items-center gap-3 text-[12.5px] text-muted">
      <span><b className="text-ok tabular-nums">{dispo}</b> disponible{dispo > 1 ? 's' : ''}</span>
      {out > 0 && <span><b className="text-mission tabular-nums">{out}</b> sorti{out > 1 ? 's' : ''}</span>}
      <span className="text-ink/45">/ {vehicles.length}</span>
    </p>
  )
}

export function Section({ id, children, count = true }: { id: SectionId; children: ReactNode; count?: boolean }) {
  const m = SECTION_META[id]
  const Icon = m.icon
  return (
    <section aria-labelledby={`sec-${id}`} className="rounded-2xl border border-line p-3 sm:p-4">
      <header className="mb-3 flex items-center gap-2.5">
        <span className={clsx('grid size-8 place-items-center rounded-full text-white', m.tone)}>
          <Icon className="size-[18px]" strokeWidth={2.25} />
        </span>
        <h2 id={`sec-${id}`} className="font-display text-[24px] leading-none font-semibold tracking-[-0.6px] text-ink">{m.title}</h2>
        {count && <div className="ml-auto"><SectionCount vehicles={vehiclesOf(id)} /></div>}
        {id !== 'coordination' && <AddVehicleButton section={id} />}
      </header>
      {children}
    </section>
  )
}

const grid = (min: number) => ({ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` })

function Row({ title, children, min }: { title: string; children: ReactNode; min: number }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-[12.5px] font-medium text-muted">{title}</h3>
      <div className="grid gap-3" style={grid(min)}>{children}</div>
    </div>
  )
}

/** Incendie : Départs P (AP), Voitures Officier R (VO), puis échelles (AE) et AMB INC — chacun indépendant. */
export function IncendieSection() {
  useVehicleRegistry()
  const all = vehiclesOf('incendie')
  const ap = all.filter((v) => v.code === 'AP')
  const vo = all.filter((v) => v.code === 'VO')
  const autres = all.filter((v) => v.code !== 'AP' && v.code !== 'VO')
  return (
    <Section id="incendie">
      <div className="space-y-4">
        <Row title="Départs P — autopompes (AP)" min={240}>{ap.map((v) => <VehicleCard key={v.id} vehicle={v} />)}</Row>
        <Row title="Voitures Officier R (VO)" min={200}>{vo.map((v) => <VehicleCard key={v.id} vehicle={v} />)}</Row>
        <Row title="Échelles (AE) et AMB INC" min={200}>{autres.map((v) => <VehicleCard key={v.id} vehicle={v} />)}</Row>
      </div>
    </Section>
  )
}

export function SimpleSection({ id, min = 200 }: { id: 'ambulances' | 'techniques'; min?: number }) {
  useVehicleRegistry()
  return (
    <Section id={id}>
      <div className="grid gap-3" style={grid(min)}>
        {vehiclesOf(id).map((v) => <VehicleCard key={v.id} vehicle={v} />)}
      </div>
    </Section>
  )
}

export function CoordinationSection() {
  const filled = useGarde((s) => vehiclesOf('coordination').filter((v) => s.assignments[v.posts[0].id]).length)
  const all = vehiclesOf('coordination')
  return (
    <Section id="coordination" count={false}>
      <p className="-mt-1 mb-3 text-[12.5px] text-muted">
        <b className="text-ink/85 tabular-nums">{filled}</b> / {all.length} fonctions pourvues · une fonction de coordination peut se cumuler avec un poste véhicule
      </p>
      <div className="grid gap-2" style={grid(150)}>
        {all.map((v) => (
          <div key={v.id} className="rounded-lg border border-line bg-paper px-2 pt-1.5 pb-2">
            <p className="mb-1 truncate text-[11px] font-semibold tracking-wide text-muted uppercase">{v.nom}</p>
            <PostSlot post={v.posts[0]} locked={false} label={false} />
          </div>
        ))}
      </div>
    </Section>
  )
}
