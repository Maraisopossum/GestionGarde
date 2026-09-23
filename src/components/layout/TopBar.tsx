import clsx from 'clsx'
import { Moon, Siren, Sun, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SPECIALITES, type Specialite } from '../../domain/types'
import { currentShift, fmtDate, fmtTime, useNow } from '../../lib/time'
import { useIsMobile, useIsWide } from '../../lib/useMedia'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { SPEC_META } from '../ui/badges'

type Tone = 'neutral' | 'ok' | 'mission' | 'warn' | 'danger'

/** Indicateur compact en pastille : icône + chiffre + libellé court. */
function Kpi({ value, total, label, icon: Icon, tone = 'neutral', onClick, title, accent, iconOnly }: {
  value: number; total?: number; label: string; icon: typeof Sun; tone?: Tone; onClick: () => void; title?: string; accent?: string; iconOnly?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={`${label} : ${value}${total !== undefined ? ` sur ${total}` : ''}`}
      className={clsx(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-full border pr-3 pl-2 transition-colors active:opacity-80',
        iconOnly && 'justify-center pr-2',
        tone === 'danger' ? 'pulse-danger border-mission bg-mission text-white'
          : tone === 'warn' ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-line bg-paper text-ink hover:border-ink/25',
      )}
    >
      <Icon
        className={clsx('size-4 shrink-0', tone === 'ok' && 'text-ok', tone === 'mission' && 'text-mission', tone === 'warn' && 'text-amber-600', tone === 'neutral' && (accent ?? 'text-muted'))}
        strokeWidth={2.25}
      />
      <span className="text-[15px] font-semibold tracking-tight tabular-nums">
        {value}
        {total !== undefined && !iconOnly && <span className={clsx('text-[12px] font-medium', tone === 'danger' ? 'text-white/70' : 'text-ink/35')}>/{total}</span>}
      </span>
      {!iconOnly && <span className={clsx('text-[12.5px]', tone === 'danger' ? 'text-white' : 'text-muted')}>{label}</span>}
    </button>
  )
}

export function Kpis({ iconOnly }: { iconOnly?: boolean }) {
  const d = useDerived()
  const navigate = useNavigate()
  const wide = useIsWide()
  const mobile = useIsMobile()
  const { setCapFilter, setStatusFilter, setSearch, setDrawer } = useUI.getState()
  const showPanel = () => {
    if (mobile) navigate('/disponibles')
    else { navigate('/'); if (!wide) setDrawer(true) }
  }
  const filterSpec = (sp: Specialite | null) => { setCapFilter(sp); setStatusFilter('DISPO'); setSearch(''); showPanel() }
  const vehiclesOut = new Set(d.vehiclesOut.map((v) => v.groupe ?? v.id)).size // un départ VO + P compte pour 1

  return (
    <>
      <Kpi iconOnly={iconOnly} value={d.disponibles.length} total={d.presents.length} label="dispo" icon={UserCheck} tone="ok" onClick={() => filterSpec(null)} title="Personnel disponible / présent" />
      <Kpi iconOnly={iconOnly} value={vehiclesOut} label="sortis" icon={Siren} tone="mission" onClick={() => navigate('/missions')} title={`Véhicules en mission · ${d.enMission.length} personnes engagées`} />
      {SPECIALITES.map((sp) => {
        const n = d.specialiteDispo[sp].length
        const m = SPEC_META[sp]
        return (
          <Kpi
            key={sp}
            iconOnly={iconOnly}
            value={n}
            total={d.specialiteTotal[sp].length}
            label={m.label}
            icon={m.icon}
            accent={m.text}
            tone={n === 0 ? 'danger' : n === 1 ? 'warn' : 'neutral'}
            onClick={() => filterSpec(sp)}
            title={`${m.label} disponibles / présents`}
          />
        )
      })}
    </>
  )
}

export function TopBar() {
  const now = useNow(10_000)
  const shiftMode = useGarde((s) => s.shift)
  const shift = currentShift(shiftMode, now)
  const mobile = useIsMobile()
  const ShiftIcon = shift.kind === 'JOUR' ? Sun : Moon

  if (mobile)
    return (
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-canvas/95 text-ink backdrop-blur">
        <div className="flex items-center gap-2 px-4 pt-2 pb-1.5">
          <h1 className="text-[18px] font-semibold tracking-[-0.4px]">Garde — Bruxelles</h1>
          <ShiftIcon className="size-4 text-amber-500" aria-label={shift.label} />
          <p className="ml-auto text-[18px] font-semibold tracking-tight tabular-nums">{fmtTime(now)}</p>
        </div>
        <div className="grid grid-cols-6 gap-1 px-2 pb-2">
          <Kpis iconOnly />
        </div>
      </header>
    )

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-canvas px-4 text-ink">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h1 className="text-[19px] font-semibold whitespace-nowrap tracking-[-0.4px]">Garde — Bruxelles</h1>
        <p className="hidden items-center gap-1.5 truncate text-[12.5px] text-muted 2xl:flex">
          {fmtDate(now)}
        </p>
        <p className="flex items-center gap-1 text-[12.5px] whitespace-nowrap text-muted">
          <ShiftIcon className="size-3.5 translate-y-0.5 text-amber-500" /> {shift.kind === 'JOUR' ? 'Jour' : 'Nuit'}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
        <Kpis />
      </div>
      <p className="shrink-0 text-[20px] font-semibold tracking-tight tabular-nums" title="Synchronisé (démo)">
        {fmtTime(now)}
      </p>
    </header>
  )
}
