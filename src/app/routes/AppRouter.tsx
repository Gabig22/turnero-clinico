import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { FullscreenLayout } from '@/components/layout/FullscreenLayout'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthAccessState } from '@/features/auth/AuthAccessState'
import { LoginPage } from '@/features/auth/LoginPage'
import { ConfiguracionPage } from '@/features/configuracion/ConfiguracionPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DoctorAgendaPage } from '@/features/doctor/DoctorAgendaPage'
import { DoctorHomePage } from '@/features/doctor/DoctorHomePage'
import { DoctorPacientesPage } from '@/features/doctor/DoctorPacientesPage'
import { AgendaMedicoMesPage } from '@/features/medicos/AgendaMedicoMesPage'
import { MedicoAgendaPage } from '@/features/medicos/MedicoAgendaPage'
import { MedicosPage } from '@/features/medicos/MedicosPage'
import { PacientesPage } from '@/features/pacientes/PacientesPage'
import { TurneroPage } from '@/features/turnero/TurneroPage'
import { TurnosCalendarioPage } from '@/features/turnos/TurnosCalendarioPage'
import { TurnosPage } from '@/features/turnos/TurnosPage'
import { useAuth, type AuthRole } from '@/hooks/useAuth'
import { useDemoRole } from '@/hooks/useDemoRole'

const adminRoles: AuthRole[] = ['admin_general']
const doctorRoles: AuthRole[] = ['doctor', 'secretaria_medico']

function getRoleHome(role?: AuthRole | null) {
  return role === 'doctor' || role === 'secretaria_medico' ? '/doctor' : '/inicio'
}

function RootRedirect() {
  const auth = useAuth()
  const { role } = useDemoRole()

  if (!auth.isMockMode) {
    if (auth.isLoading) {
      return <RouteLoading />
    }

    if (!auth.isAuthenticated) {
      return <Navigate replace to="/login" />
    }

    if (!auth.profile) {
      return (
        <AuthAccessState
          description="La sesión existe, pero falta crear o habilitar el perfil del usuario en Supabase."
          title="Perfil no disponible"
        />
      )
    }

    if (!auth.profile.activo) {
      return (
        <AuthAccessState
          description="Este usuario está marcado como inactivo. Pedile a un administrador que revise el perfil."
          title="Usuario inactivo"
        />
      )
    }

    return <Navigate replace to={getRoleHome(auth.profile.role)} />
  }

  const destination = role === 'doctor' || role === 'secretaria_medico' ? '/doctor' : '/inicio'

  return <Navigate replace to={destination} />
}

type RequireAuthProps = {
  allowedRoles?: AuthRole[]
  children: ReactNode
}

function RequireAuth({ allowedRoles, children }: RequireAuthProps) {
  const auth = useAuth()

  if (auth.isMockMode) {
    return children
  }

  if (auth.isLoading) {
    return <RouteLoading />
  }

  if (!auth.isAuthenticated) {
    const next = `${window.location.pathname}${window.location.search}`

    return <Navigate replace to={`/login?next=${encodeURIComponent(next)}`} />
  }

  if (!auth.profile) {
    return (
      <AuthAccessState
        description="La sesión existe, pero falta crear o habilitar el perfil del usuario en Supabase."
        title="Perfil no disponible"
      />
    )
  }

  if (!auth.profile.activo) {
    return (
      <AuthAccessState
        description="Este usuario está marcado como inactivo. Pedile a un administrador que revise el perfil."
        title="Usuario inactivo"
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(auth.profile.role)) {
    return <Navigate replace to={getRoleHome(auth.profile.role)} />
  }

  return children
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm font-medium text-muted-foreground shadow-clinical">
        Verificando sesión...
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootRedirect />} path="/" />
        <Route element={<LoginPage />} path="/login" />

        <Route
          element={
            <RequireAuth allowedRoles={adminRoles}>
              <MainLayout section="admin" />
            </RequireAuth>
          }
        >
          <Route element={<DashboardPage />} path="/inicio" />
          <Route element={<MedicosPage />} path="/medicos" />
          <Route element={<MedicoAgendaPage />} path="/medicos/:id" />
          <Route element={<AgendaMedicoMesPage />} path="/agenda/:medicoId" />
          <Route element={<TurnosPage />} path="/turnos" />
          <Route element={<TurnosCalendarioPage />} path="/turnos/calendario" />
          <Route element={<PacientesPage />} path="/pacientes" />
          <Route element={<ConfiguracionPage />} path="/configuracion" />
        </Route>

        <Route
          element={
            <RequireAuth allowedRoles={doctorRoles}>
              <MainLayout section="doctor" />
            </RequireAuth>
          }
        >
          <Route element={<DoctorHomePage />} path="/doctor" />
          <Route element={<DoctorAgendaPage />} path="/doctor/agenda" />
          <Route element={<DoctorPacientesPage />} path="/doctor/pacientes" />
        </Route>

        <Route element={<FullscreenLayout />}>
          <Route element={<TurneroPage />} path="/turnero" />
        </Route>

        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}
