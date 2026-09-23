import clsx from 'clsx'
import { BadgeCheck, Flame, History, LayoutDashboard, Settings, Siren, Truck, Users, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDerived } from '../../store/useDerived'

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
        'relative flex h-11 items-center gap-3 rounded-lg text-[14px] font-medium transition-colors',
        collapsed ? 'justify-center' : 'px-3',
        isActive ? 'bg-white/[0.12] text-white before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-1 before:rounded-r before:bg-sky-400' : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {!!badge && (
        <span className={clsx('grid h-5 min-w-5 place-items-center rounded-full bg-mission px-1 text-[11px] font-bold text-white', collapsed ? 'absolute top-1 right-1' : 'ml-auto')}>{badge}</span>
      )}
    </NavLink>
  )
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { vehiclesOut } = useDerived()
  const missions = new Set(vehiclesOut.map((v) => v.groupe ?? v.id)).size
  return (
    <aside className={clsx('flex h-full shrink-0 flex-col bg-ink-2 px-3 py-4 text-white', collapsed ? 'w-[68px]' : 'w-[228px]')}>
      <div className={clsx('mb-6 flex items-center gap-2.5', collapsed && 'justify-center')}>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-600">
          <Flame className="size-6 text-amber-100" strokeWidth={2.25} />
        </span>
        {!collapsed && (
          <span className="leading-tight">
            <span className="block font-display text-[19px] font-bold tracking-wide">GESTION GARDE</span>
            <span className="block text-[11px] text-white/50">Maquette · données fictives</span>
          </span>
        )}
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => <Item key={n.to} {...n} collapsed={collapsed} badge={n.to === '/missions' ? missions : undefined} />)}
      </nav>
      <div className="mt-auto">
        <Item to="/parametres" label="Paramètres" icon={Settings} collapsed={collapsed} />
      </div>
    </aside>
  )
}
