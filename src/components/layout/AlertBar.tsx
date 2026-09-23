import clsx from 'clsx'
import { ChevronDown, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Alert } from '../../domain/selectors'
import { useIsMobile } from '../../lib/useMedia'
import { useDerived } from '../../store/useDerived'
import { useUI } from '../../store/useUI'

const LEVEL = {
  danger: { icon: CircleAlert, cls: 'border-mission/30 bg-mission-soft text-mission', title: 'text-red-800' },
  warning: { icon: TriangleAlert, cls: 'border-amber-300/70 bg-amber-50 text-amber-600', title: 'text-amber-900' },
  info: { icon: Info, cls: 'border-line bg-paper text-muted', title: 'text-ink/85' },
}

/** Alertes opérationnelles : visibles, compactes, jamais bloquantes. */
export function AlertBar() {
  const { alerts } = useDerived()
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const mobile = useIsMobile()
  const ui = useUI.getState()
  if (!alerts.length) return null
  const max = mobile ? 2 : 4
  const shown = expanded ? alerts : alerts.slice(0, max)

  const act = (a: Alert) => {
    if (a.vehicleId) { navigate('/'); setTimeout(() => ui.flashVehicle(a.vehicleId!), 50) }
    else if (a.personId) ui.openSheet(a.personId)
    else if (a.specialite) navigate('/specialites')
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="status" aria-label="Alertes opérationnelles">
      {shown.map((a) => {
        const L = LEVEL[a.level]
        const Icon = L.icon
        const clickable = !!(a.vehicleId || a.personId || a.specialite)
        return (
          <button
            key={a.id}
            type="button"
            disabled={!clickable}
            onClick={() => act(a)}
            className={clsx('flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left', L.cls, clickable && 'hover:brightness-[0.97]', mobile && 'w-full')}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.5} />
            <span className="min-w-0 text-[12.5px] leading-tight">
              <b className={clsx('font-semibold', L.title)}>{a.title}</b>
              {a.detail && <span className="text-muted"> · {a.detail}</span>}
            </span>
          </button>
        )
      })}
      {alerts.length > max && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-muted hover:bg-paper">
          {expanded ? 'Réduire' : `+ ${alerts.length - max} alerte${alerts.length - max > 1 ? 's' : ''}`}
          <ChevronDown className={clsx('size-4', expanded && 'rotate-180')} />
        </button>
      )}
    </div>
  )
}
