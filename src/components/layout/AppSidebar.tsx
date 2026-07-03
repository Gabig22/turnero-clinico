import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Monitor,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils/cn'

export type SidebarSection = 'admin' | 'doctor'

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
}

const adminItems: NavItem[] = [
  { label: 'Inicio', href: '/inicio', icon: LayoutDashboard },
  { label: 'Médicos', href: '/medicos', icon: Stethoscope },
  { label: 'Turnos', href: '/turnos', icon: CalendarClock },
  { label: 'Pacientes', href: '/pacientes', icon: UsersRound },
  { label: 'Turnero', href: '/turnero', icon: Monitor },
  { label: 'Configuración', href: '/configuracion', icon: Settings },
  { label: 'Portal Médico', href: '/doctor', icon: UserRound },
]

const doctorItems: NavItem[] = [
  { label: 'Portal Médico', href: '/doctor', icon: UserRound },
  { label: 'Mi Agenda', href: '/doctor/agenda', icon: ClipboardList },
  { label: 'Mis Pacientes', href: '/doctor/pacientes', icon: UsersRound },
  { label: 'Turnero', href: '/turnero', icon: Monitor },
  { label: 'Panel admin', href: '/inicio', icon: LayoutDashboard },
]

type AppSidebarProps = {
  section?: SidebarSection
  compact?: boolean
}

export function AppSidebar({ section = 'admin', compact = false }: AppSidebarProps) {
  const items = section === 'doctor' ? doctorItems : adminItems

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        compact
          ? 'flex gap-2 overflow-x-auto border-t border-border bg-card px-4 py-3 md:hidden'
          : 'hidden min-h-screen w-72 flex-col border-r border-border bg-card px-4 py-5 md:flex',
      )}
    >
      {!compact ? (
        <div className="mb-7 px-2">
          <div className="text-lg font-semibold text-foreground">Turnero Clínico</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Gestión demo de turnos</p>
        </div>
      ) : null}

      <div className={cn('gap-1', compact ? 'flex min-w-max' : 'flex flex-col')}>
        {items.map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                compact ? 'shrink-0' : 'w-full',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
            end={item.href === '/inicio' || item.href === '/doctor'}
            key={item.href}
            to={item.href}
          >
            <item.icon aria-hidden="true" className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
