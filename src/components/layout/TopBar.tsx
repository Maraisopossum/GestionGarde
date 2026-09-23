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

function Kpi({ value, total, sub, label, icon: Icon, tone = 'neutral', onClick, title, compact }: {
  value: number; total?: number; sub?: string; compact?: boolean; label: string; icon: typeof Sun; tone?: 'neutral' | 'ok' | 'mission' | 'warn' | 'danger'; onClick: () => void; title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'flex shrink-0 items-center rounded-lg border text-left transition-colors',
        compact ? 'h-12 min-w-0 gap-1.5 px-2' : 'h-[54px] gap-2 pr-3 pl-2.5',
        tone === 'danger' ? 'pulse-danger border-mission bg-mission text-white' : 'border-white/10 bg-white/[0.06] hover:bg-white/[0.11]',
        tone === 'warn' && 'border-amber-400/70',
      )}
    >
      <Icon
        className={clsx(compact ? 'size-[18px] shrink-0' : 'size-6 shrink-0', tone === 'ok' && 'text-ok-dot', tone === 'mission' && 'text-red-400', tone === 'warn' && 'text-amber-300', tone === 'neutral' && 'text-sky-300')}
        strokeWidth={2.25}
      />
      <span className="leading-none">
        <span className={clsx('block font-display font-bold whitespace-nowrap tabular-nums', compact ? 'text-[21px]' : 'text-[26px]', tone === 'warn' && 'text-amber-300')}>
          {value}
          {total !== undefined && <span className="text-[15px] font-semibold text-white/45"> /{total}</span>}
          {sub && !compact && <span className="ml-1 font-sans text-[12px] font-semibold text-white/55">{sub}</span>}
        </span>
        <span className={clsx('mt-0.5 block truncate font-semibold tracking-wide uppercase', compact ? 'text-[9.5px]' : 'text-[11px]', tone === 'danger' ? 'text-white' : 'text-white/65')}>{label}</span>
      </span>
    </button>
  )
}

export function Kpis({ compact }: { compact?: boolean }) {
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
      <Kpi compact={compact} value={d.disponibles.length} total={d.presents.length} label="Disponibles" icon={UserCheck} tone="ok" onClick={() => filterSpec(null)} title="Personnel présent et non engagé" />
      <Kpi compact={compact} value={vehiclesOut} label={`En mission`} total={undefined} sub={`${d.enMission.length} pers.`} icon={Siren} tone="mission" onClick={() => navigate('/missions')} />
      {SPECIALITES.map((sp) => {
        const n = d.specialiteDispo[sp].length
        const m = SPEC_META[sp]
        return (
          <Kpi
            key={sp}
            compact={compact}
            value={n}
            total={d.specialiteTotal[sp].length}
            label={n === 0 ? `0 ${m.label} dispo` : m.label}
            icon={m.icon}
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
      <header className="bg-ink text-white">
        <div className="pt-safe sticky top-0 z-30 flex items-center gap-3 bg-ink px-4 pt-2.5 pb-2 shadow-[0_1px_0_rgb(255_255_255/0.06)]">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[22px] leading-none font-bold tracking-wide">GARDE — BRUXELLES</h1>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-white/70">
              <ShiftIcon className="size-3.5 text-amber-300" /> {shift.label}
            </p>
          </div>
          <p className="font-display text-[28px] leading-none font-bold tabular-nums">{fmtTime(now)}</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
          <Kpis compact />
        </div>
      </header>
    )

  return (
    <header className="bg-ink text-white">
      <div className="flex items-center gap-5 px-5 py-3">
        <div className="min-w-0 shrink">
          <h1 className="font-display text-[32px] leading-none font-bold tracking-wide">GARDE — BRUXELLES</h1>
          <p className="mt-1.5 flex items-center gap-2 text-[13.5px] whitespace-nowrap text-white/75">
            {fmtDate(now)}
            <span className="text-white/30">·</span>
            <ShiftIcon className="size-4 shrink-0 text-amber-300" />
            Quart {shift.kind === 'JOUR' ? 'de jour' : 'de nuit'} ({shift.label.split('·')[1].trim()})
          </p>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Kpis />
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[36px] leading-none font-bold tabular-nums">{fmtTime(now)}</p>
          <p className="mt-1 flex items-center justify-end gap-1.5 text-[11.5px] text-white/60">
            <span className="size-1.5 rounded-full bg-ok-dot" /> Synchronisé · démo
          </p>
        </div>
      </div>
    </header>
  )
}
