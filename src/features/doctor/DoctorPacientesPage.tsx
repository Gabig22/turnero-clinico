import { CalendarDays, Search, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { useDoctorDemo, useDoctorPatients } from '@/hooks/useDoctorDemo'
import { formatDateDisplay } from '@/lib/dates/displayDate'
import type { TurnoDetallado } from '@/types'

export function DoctorPacientesPage() {
  const [search, setSearch] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const { selectedMedico, selectedMedicoId, isLoading: isDoctorLoading } = useDoctorDemo()
  const patientsQuery = useDoctorPatients(selectedMedicoId)
  const obrasSociales = useMemo(
    () =>
      Array.from(
        new Set(
          patientsQuery.pacientes
            .map((item) => item.paciente?.obra_social)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [patientsQuery.pacientes],
  )
  const filteredPatients = useMemo(() => {
    const normalizedSearch = normalizeText(search)

    return patientsQuery.pacientes.filter((item) => {
      const paciente = item.paciente

      if (!paciente) {
        return false
      }

      const matchesSearch = normalizedSearch
        ? normalizeText(`${paciente.nombre} ${paciente.apellido} ${paciente.dni}`).includes(
            normalizedSearch,
          )
        : true
      const matchesObraSocial = obraSocial ? paciente.obra_social === obraSocial : true

      return matchesSearch && matchesObraSocial
    })
  }, [obraSocial, patientsQuery.pacientes, search])

  if (isDoctorLoading) {
    return <EmptyState icon={UsersRound} title="Cargando pacientes del médico" />
  }

  if (!selectedMedicoId) {
    return (
      <EmptyState
        description="Seleccioná un médico demo desde el portal médico para ver sus pacientes."
        icon={UsersRound}
        title="No hay médico demo seleccionado"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={buttonVariants({ variant: 'outline' })} to="/doctor/agenda">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Mi agenda
          </Link>
        }
        description={
          selectedMedico
            ? `${selectedMedico.nombre} · ${selectedMedico.especialidad} · Consultorio ${selectedMedico.consultorio}`
            : 'Pacientes con turnos asociados al médico demo.'
        }
        title="Mis Pacientes"
      />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <label className="relative block">
              <span className="sr-only">Buscar pacientes</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, apellido o DNI"
                value={search}
              />
            </label>

            <select
              className="form-input"
              onChange={(event) => setObraSocial(event.target.value)}
              value={obraSocial}
            >
              <option value="">Todas las obras sociales</option>
              {obrasSociales.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {patientsQuery.isLoading ? (
            <EmptyState icon={UsersRound} title="Cargando pacientes" />
          ) : filteredPatients.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[900px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[26%] px-4 py-3 font-semibold">Paciente</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">DNI</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Último turno</th>
                    <th className="px-4 py-3 font-semibold">Próximo turno</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border align-middle">
                  {filteredPatients.map(({ paciente, ultimoTurno, proximoTurno }) => (
                    <tr className="hover:bg-accent/50" key={paciente?.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">
                          {paciente?.apellido}, {paciente?.nombre}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {paciente?.obra_social}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {paciente?.dni}
                      </td>
                      <td className="px-4 py-3 text-xs leading-5 text-muted-foreground">
                        <p>{paciente?.telefono || 'Sin teléfono'}</p>
                        <p className="max-w-[220px] truncate">{paciente?.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3">{renderTurnoSummary(ultimoTurno)}</td>
                      <td className="px-4 py-3">{renderTurnoSummary(proximoTurno)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={paciente?.activo ? 'success' : 'muted'}>
                          {paciente?.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="No hay pacientes asociados a este médico con los filtros actuales."
              icon={UsersRound}
              title="Sin pacientes asociados"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function renderTurnoSummary(turno: TurnoDetallado | null) {
  if (!turno) {
    return <span className="text-xs text-muted-foreground">Sin datos</span>
  }

  return (
    <div className="space-y-1">
      <p className="whitespace-nowrap text-sm font-medium text-foreground">
        {formatDateDisplay(turno.fecha)} · {turno.hora}
      </p>
      <StatusBadge estado={turno.estado} />
    </div>
  )
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}
