import clsx from 'clsx'
import { BadgeCheck, Flame, History, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, Siren, Truck, Users, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDerived } from '../../store/useDerived'
import { useUI } from '../../store/useUI'

export const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Tableau de garde', icon: LayoutDashboard },
  { to: '/personnel', label: 'Personnel', icon: Users },
  { to: '/vehicules', label: 'Véhicules', icon: Truck },
  { to: '/specialites', label: 'Spécialités', icon: BadgeCheck },
  { to: '/missions', label: 'Missions', icon: Siren },
  { to: '/historique', label: 'Historique', icon: History },
]

function Item({ to, label, icon: Icon, collapsed, badge }: { to: string; label: string; icon: LucideIcon; collapsed: boolean; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) => clsx(
        'relative flex h-10 items-center gap-3 rounded-md text-[13.5px] transition-colors',
        collapsed ? 'justify-center' : 'px-3',
        isActive ? 'bg-ink/[0.06] font-semibold text-ink' : 'text-ink/60 hover:bg-ink/[0.04] hover:text-ink',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {!!badge && (
        <span className={clsx('grid h-5 min-w-5 place-items-center rounded-full bg-mission px-1 text-[11px] font-semibold text-white', collapsed ? 'absolute top-1 right-1' : 'ml-auto')}>{badge}</span>
      )}
    </NavLink>
  )
}

export function Sidebar({ collapsed, canToggle }: { collapsed: boolean; canToggle: boolean }) {
  const { vehiclesOut } = useDerived()
  const toggle = useUI((s) => s.toggleSidebar)
  const missions = new Set(vehiclesOut.map((v) => v.groupe ?? v.id)).size
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <aside className={clsx('flex h-full shrink-0 flex-col border-r border-line bg-canvas px-2.5 py-3 text-ink transition-[width] duration-200', collapsed ? 'w-[60px]' : 'w-[208px]')}>
      <div className={clsx('mb-4 flex h-9 items-center gap-2.5', collapsed ? 'justify-center' : 'px-1')}>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink shadow-inset">
          <Flame className="size-[18px] text-red-400" strokeWidth={2.25} />
        </span>
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-semibold tracking-tight">Gestion garde</span>
            <span className="block truncate text-[11px] text-muted">Maquette · fictif</span>
          </span>
        )}
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((n) => <Item key={n.to} {...n} collapsed={collapsed} badge={n.to === '/missions' ? missions : undefined} />)}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        <Item to="/parametres" label="Paramètres" icon={Settings} collapsed={collapsed} />
        {canToggle && (
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-expanded={!collapsed}
            className={clsx('flex h-10 items-center gap-3 rounded-md text-[13.5px] text-ink/50 hover:bg-ink/[0.04] hover:text-ink', collapsed ? 'justify-center' : 'px-3')}
          >
            <ToggleIcon className="size-5 shrink-0" />
            {!collapsed && 'Replier le menu'}
          </button>
        )}
      </div>
    </aside>
  )
}
