import clsx from 'clsx'
import { Ambulance, Flame, Network, Wrench, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { VEHICLES } from '../../data/seed'
import type { SectionId, Vehicle } from '../../domain/types'
import { useGarde } from '../../store/useGarde'
import { PostSlot } from './PostSlot'
import { DepartCard, VehicleCard } from './VehicleCard'

export const SECTION_META: Record<SectionId, { title: string; icon: LucideIcon; tone: string }> = {
  incendie: { title: 'Incendie', icon: Flame, tone: 'bg-red-600' },
  ambulances: { title: 'Ambulances', icon: Ambulance, tone: 'bg-emerald-600' },
  techniques: { title: 'Véhicules techniques', icon: Wrench, tone: 'bg-sky-700' },
  coordination: { title: 'Coordination', icon: Network, tone: 'bg-violet-700' },
}

export const vehiclesOf = (section: SectionId) => VEHICLES.filter((v) => v.section === section)

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
    <p className="flex items-center gap-3 text-[12.5px] text-slate-500">
      <span><b className="text-ok tabular-nums">{dispo}</b> disponible{dispo > 1 ? 's' : ''}</span>
      {out > 0 && <span><b className="text-mission tabular-nums">{out}</b> sorti{out > 1 ? 's' : ''}</span>}
      <span className="text-slate-400">/ {vehicles.length}</span>
    </p>
  )
}

export function Section({ id, children, count = true }: { id: SectionId; children: ReactNode; count?: boolean }) {
  const m = SECTION_META[id]
  const Icon = m.icon
  return (
    <section aria-labelledby={`sec-${id}`} className="rounded-xl border border-line/80 bg-white/55 p-3 sm:p-4">
      <header className="mb-3 flex items-center gap-2.5">
        <span className={clsx('grid size-8 place-items-center rounded-full text-white', m.tone)}>
          <Icon className="size-[18px]" strokeWidth={2.25} />
        </span>
        <h2 id={`sec-${id}`} className="font-display text-[22px] leading-none font-bold tracking-wide text-ink uppercase">{m.title}</h2>
        {count && <div className="ml-auto"><SectionCount vehicles={vehiclesOf(id)} /></div>}
      </header>
      {children}
    </section>
  )
}

const grid = (min: number) => ({ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))` })

export function IncendieSection() {
  const all = vehiclesOf('incendie')
  const groupes = [...new Set(all.map((v) => v.groupe).filter(Boolean))] as string[]
  const autres = all.filter((v) => !v.groupe)
  return (
    <Section id="incendie">
      <div className="grid gap-3" style={grid(250)}>
        {groupes.map((g) => {
          const [vo, p] = all.filter((v) => v.groupe === g)
          return <DepartCard key={g} groupe={g} vo={vo} p={p} />
        })}
      </div>
      <div className="mt-3 grid gap-3" style={grid(200)}>
        {autres.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
      </div>
    </Section>
  )
}

export function SimpleSection({ id, min = 200 }: { id: 'ambulances' | 'techniques'; min?: number }) {
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
      <p className="-mt-1 mb-3 text-[12.5px] text-slate-500">
        <b className="text-slate-700 tabular-nums">{filled}</b> / {all.length} fonctions pourvues · une fonction de coordination peut se cumuler avec un poste véhicule
      </p>
      <div className="grid gap-2" style={grid(150)}>
        {all.map((v) => (
          <div key={v.id} className="rounded-lg border border-line bg-white px-2 pt-1.5 pb-2">
            <p className="mb-1 truncate text-[11px] font-bold tracking-wide text-slate-600 uppercase">{v.nom}</p>
            <PostSlot post={v.posts[0]} locked={false} label={false} />
          </div>
        ))}
      </div>
    </Section>
  )
}
