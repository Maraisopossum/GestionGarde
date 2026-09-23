import clsx from 'clsx'
import { BadgeCheck, LayoutDashboard, Menu, Siren, UserCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDerived } from '../../store/useDerived'

export function MobileNav() {
  const d = useDerived()
  const missions = new Set(d.vehiclesOut.map((v) => v.groupe ?? v.id)).size
  const items = [
    { to: '/', label: 'Garde', icon: LayoutDashboard },
    { to: '/disponibles', label: 'Disponibles', icon: UserCheck, badge: d.disponibles.length, tone: 'bg-ok' },
    { to: '/specialites', label: 'Spécialités', icon: BadgeCheck },
    { to: '/missions', label: 'Missions', icon: Siren, badge: missions, tone: 'bg-mission' },
    { to: '/plus', label: 'Plus', icon: Menu },
  ]
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, badge, tone }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => clsx('relative flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold', isActive ? 'text-ink' : 'text-slate-400')}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-b bg-ink" />}
                  <Icon className="size-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                  {label}
                  {!!badge && <span className={clsx('absolute top-1.5 left-1/2 ml-2 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white', tone)}>{badge}</span>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
