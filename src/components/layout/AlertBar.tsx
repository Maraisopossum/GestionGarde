import clsx from 'clsx'
import { ChevronDown, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Alert } from '../../domain/selectors'
import { useDerived } from '../../store/useDerived'
import { useUI } from '../../store/useUI'

const LEVEL = {
  danger: { icon: CircleAlert, pill: 'border-mission/30 bg-mission-soft text-mission', dot: 'text-mission' },
  warning: { icon: TriangleAlert, pill: 'border-amber-300 bg-amber-50 text-amber-700', dot: 'text-amber-600' },
  info: { icon: Info, pill: 'border-line bg-paper text-muted', dot: 'text-ink/40' },
}

/**
 * Alertes opérationnelles, repliées en une pastille résumé (la plus grave est citée).
 * Un clic déplie la liste ; chaque alerte mène au véhicule, à la personne ou à la spécialité.
 */
export function AlertBar({ className }: { className?: string }) {
  const { alerts } = useDerived()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ui = useUI.getState()
  if (!alerts.length) return null
  const top = alerts[0]
  const L = LEVEL[top.level]
  const Icon = L.icon

  const act = (a: Alert) => {
    setOpen(false)
    if (a.vehicleId) { navigate('/'); setTimeout(() => ui.flashVehicle(a.vehicleId!), 50) }
    else if (a.personId) ui.openSheet(a.personId)
    else if (a.specialite) navigate('/specialites')
  }

  return (
    <div className={clsx('relative min-w-0', className)} role="status" aria-label="Alertes opérationnelles">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={clsx('flex h-9 max-w-full items-center gap-2 rounded-full border pr-2.5 pl-3 text-left transition-colors', L.pill)}
      >
        <Icon className="size-4 shrink-0" strokeWidth={2.5} />
        <span className="shrink-0 text-[13px] font-semibold">{alerts.length} alerte{alerts.length > 1 ? 's' : ''}</span>
        <span className="truncate text-[12.5px] opacity-80">· {top.title}</span>
        <ChevronDown className={clsx('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="absolute top-11 left-0 z-30 w-[min(420px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-paper py-1 shadow-focus">
          {alerts.map((a) => {
            const A = LEVEL[a.level]
            const AIcon = A.icon
            const clickable = !!(a.vehicleId || a.personId || a.specialite)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => act(a)}
                  className="flex w-full items-start gap-2.5 px-3 py-2 text-left enabled:hover:bg-ink/[0.03]"
                >
                  <AIcon className={clsx('mt-0.5 size-4 shrink-0', A.dot)} strokeWidth={2.5} />
                  <span className="min-w-0 text-[13px] leading-snug">
                    <span className="block font-semibold text-ink">{a.title}</span>
                    {a.detail && <span className="block text-[12px] text-muted">{a.detail}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
