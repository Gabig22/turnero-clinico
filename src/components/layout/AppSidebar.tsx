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
]

const adminSectionItems: NavItem[] = [
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
  const shouldShowSectionSwitch = section === 'admin'

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
          <SidebarLink
            compact={compact}
            end={item.href === '/inicio' || (section === 'doctor' && item.href === '/doctor')}
            item={item}
            key={item.href}
          />
        ))}

        {shouldShowSectionSwitch ? (
          <div
            className={cn(
              compact
                ? 'ml-2 flex items-center gap-2 border-l border-border pl-3'
                : 'mt-5 border-t border-border pt-4',
            )}
          >
            {!compact ? (
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Cambiar sección
              </p>
            ) : (
              <span className="sr-only">Cambiar sección</span>
            )}
            <div className={cn('gap-1', compact ? 'flex' : 'flex flex-col')}>
              {adminSectionItems.map((item) => (
                <SidebarLink compact={compact} end={false} item={item} key={item.href} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  )
}

type SidebarLinkProps = {
  item: NavItem
  compact: boolean
  end?: boolean
}

function SidebarLink({ item, compact, end = item.href === '/inicio' }: SidebarLinkProps) {
  return (
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
      end={end}
      to={item.href}
    >
      <item.icon aria-hidden="true" className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  )
}
