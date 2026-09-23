import { ChevronRight, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HistoryPanel } from '../components/history/HistoryPanel'
import { NAV } from '../components/layout/Sidebar'
import { AvailablePanel } from '../components/people/AvailablePanel'

/** Mobile : panneau « Personnel disponible » en pleine page. */
export function Disponibles() {
  return (
    <div className="p-3">
      <AvailablePanel className="h-[calc(100dvh-13rem-env(safe-area-inset-bottom))]" />
    </div>
  )
}

/** Mobile : entrées secondaires de navigation. */
export function Plus() {
  const items = [...NAV.filter((n) => ['/personnel', '/vehicules', '/historique'].includes(n.to)), { to: '/parametres', label: 'Paramètres', icon: Settings }]
  return (
    <div className="space-y-4 p-3">
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="flex h-14 items-center gap-3 px-4 text-[15px] font-medium text-ink">
              <Icon className="size-5 text-slate-500" /> {label}
              <ChevronRight className="ml-auto size-5 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
      <HistoryPanel limit={5} />
    </div>
  )
}
