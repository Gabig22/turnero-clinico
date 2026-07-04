import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { FullscreenLayout } from '@/components/layout/FullscreenLayout'
import { MainLayout } from '@/components/layout/MainLayout'
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
import { useDemoRole } from '@/hooks/useDemoRole'

function RootRedirect() {
  const { role } = useDemoRole()
  const destination = role === 'doctor' ? '/doctor' : '/inicio'

  return <Navigate replace to={destination} />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootRedirect />} path="/" />

        <Route element={<MainLayout section="admin" />}>
          <Route element={<DashboardPage />} path="/inicio" />
          <Route element={<MedicosPage />} path="/medicos" />
          <Route element={<MedicoAgendaPage />} path="/medicos/:id" />
          <Route element={<AgendaMedicoMesPage />} path="/agenda/:medicoId" />
          <Route element={<TurnosPage />} path="/turnos" />
          <Route element={<TurnosCalendarioPage />} path="/turnos/calendario" />
          <Route element={<PacientesPage />} path="/pacientes" />
          <Route element={<ConfiguracionPage />} path="/configuracion" />
        </Route>

        <Route element={<MainLayout section="doctor" />}>
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
