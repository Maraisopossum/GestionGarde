import clsx from 'clsx'
import { LifeBuoy, Mountain, Radiation, Siren, Waves, type LucideIcon } from 'lucide-react'
import { GRADE_INITIALS } from '../../domain/selectors'
import type { Person, PersonStatusKind, Specialite, VehicleState } from '../../domain/types'
import { fmtTime } from '../../lib/time'

/* ----------------------------------------------------------------- Spécialités */

export const SPEC_META: Record<Specialite, { icon: LucideIcon; label: string; text: string; soft: string; solid: string }> = {
  PLONGEUR: { icon: Waves, label: 'Plongeur', text: 'text-plong', soft: 'bg-plong-soft', solid: 'bg-plong' },
  HAZMAT: { icon: Radiation, label: 'HAZMAT', text: 'text-hazmat', soft: 'bg-hazmat-soft', solid: 'bg-hazmat' },
  RISC: { icon: LifeBuoy, label: 'RISC', text: 'text-risc', soft: 'bg-risc-soft', solid: 'bg-risc' },
  GRIMP: { icon: Mountain, label: 'GRIMP', text: 'text-grimp', soft: 'bg-grimp-soft', solid: 'bg-grimp' },
}

/** Couleurs de surbrillance sur le tableau (spécialités + fonctions Chef / Chauffeur) */
export const CAP_META: Record<Specialite | 'CHEF' | 'CHAUFFEUR', { label: string; soft: string; text: string; ring: string; solid: string }> = {
  PLONGEUR: { label: 'Plongeur', soft: 'bg-plong-soft', text: 'text-plong', ring: 'ring-plong', solid: 'bg-plong' },
  HAZMAT: { label: 'HAZMAT', soft: 'bg-hazmat-soft', text: 'text-hazmat', ring: 'ring-amber-500', solid: 'bg-amber-500' },
  RISC: { label: 'RISC', soft: 'bg-risc-soft', text: 'text-risc', ring: 'ring-risc', solid: 'bg-risc' },
  GRIMP: { label: 'GRIMP', soft: 'bg-grimp-soft', text: 'text-grimp', ring: 'ring-grimp', solid: 'bg-grimp' },
  CHEF: { label: 'Chef', soft: 'bg-sky-100', text: 'text-sky-800', ring: 'ring-sky-600', solid: 'bg-sky-600' },
  CHAUFFEUR: { label: 'Chauffeur', soft: 'bg-teal-100', text: 'text-teal-800', ring: 'ring-teal-600', solid: 'bg-teal-600' },
}

/** `icon` : pastille compacte (postes) — `label` : badge complet (listes, fiches) */
export function SpecBadge({ sp, variant = 'label', className }: { sp: Specialite; variant?: 'icon' | 'label'; className?: string }) {
  const m = SPEC_META[sp]
  const Icon = m.icon
  if (variant === 'icon')
    return (
      <span title={m.label} className={clsx('inline-grid size-[18px] shrink-0 place-items-center rounded', m.soft, m.text, className)}>
        <Icon className="size-3" strokeWidth={2.5} />
        <span className="sr-only">{m.label}</span>
      </span>
    )
  return (
    <span className={clsx('inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[10.5px] font-semibold tracking-wide uppercase', m.soft, m.text, className)}>
      <Icon className="size-3" strokeWidth={2.5} />
      {m.label}
    </span>
  )
}

export function SpecBadges({ specs, variant }: { specs: Specialite[]; variant?: 'icon' | 'label' }) {
  if (!specs.length) return null
  return <span className="inline-flex items-center gap-1">{specs.map((s) => <SpecBadge key={s} sp={s} variant={variant} />)}</span>
}

/* ----------------------------------------------------------------- Grade */

const GRADE_TONE: Record<Person['grade'], string> = {
  SP: 'bg-ink/70 text-white',
  Cpl: 'bg-sky-800 text-white',
  Sgt: 'bg-orange-600 text-white',
  'Sgt Maj': 'bg-orange-700 text-white',
  Adj: 'bg-ink text-amber-300',
}

export function Avatar({ person, size = 'sm', className }: { person: Person; size?: 'xs' | 'sm' | 'lg'; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-tight',
        GRADE_TONE[person.grade],
        size === 'xs' && 'size-5 text-[8.5px]',
        size === 'sm' && 'size-6 text-[9.5px]',
        size === 'lg' && 'size-14 text-lg',
        className,
      )}
      aria-hidden
    >
      {GRADE_INITIALS[person.grade]}
    </span>
  )
}

/* ----------------------------------------------------------------- États véhicule */

export const STATE_META: Record<VehicleState, { label: string; pill: string; bar: string; soft: string; dot: string }> = {
  DISPONIBLE: { label: 'Disponible', pill: 'bg-ok text-white', bar: 'bg-ok', soft: 'bg-ok-soft', dot: 'bg-ok-dot' },
  EN_MISSION: { label: 'En mission', pill: 'bg-mission text-white', bar: 'bg-mission', soft: 'bg-mission-soft', dot: 'bg-mission' },
  RESERVE: { label: 'Réserve', pill: 'bg-reserve text-white', bar: 'bg-reserve', soft: 'bg-reserve-soft', dot: 'bg-reserve' },
  INDISPONIBLE: { label: 'Indisponible', pill: 'bg-off text-white', bar: 'bg-off', soft: 'bg-off-soft', dot: 'bg-off' },
}

export function StatePill({ state, since, size = 'md' }: { state: VehicleState; since?: string; size?: 'sm' | 'md' }) {
  const m = STATE_META[state]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded font-semibold tracking-wide uppercase',
        m.pill,
        size === 'md' ? 'h-6 px-2 text-[11px]' : 'h-5 px-1.5 text-[10px]',
      )}
    >
      {state === 'EN_MISSION' ? <Siren className="size-3.5" strokeWidth={2.5} /> : <span className="size-1.5 rounded-full bg-white/90" />}
      {state === 'EN_MISSION' ? 'Sorti' : m.label}
      {state === 'EN_MISSION' && since && <span className="font-semibold tabular-nums opacity-95">{fmtTime(since)}</span>}
    </span>
  )
}

/* ----------------------------------------------------------------- Statut personne */

export const PERSON_STATUS_META: Record<PersonStatusKind, { label: string; dot: string; text: string }> = {
  LIBRE: { label: 'Disponible', dot: 'bg-ok-dot', text: 'text-ok' },
  AFFECTE: { label: 'Disponible', dot: 'bg-ok-dot', text: 'text-ok' },
  EN_MISSION: { label: 'En mission', dot: 'bg-mission', text: 'text-mission' },
  ABSENT: { label: 'Absent', dot: 'bg-ink/30', text: 'text-muted' },
}

export function MissionTag({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex h-[18px] shrink-0 items-center rounded-sm bg-mission-soft px-1 text-[9.5px] font-semibold tracking-wide text-mission uppercase', className)}>
      En mission
    </span>
  )
}
