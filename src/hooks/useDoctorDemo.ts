import { useEffect, useMemo, useState } from 'react'

import { useMedicos } from '@/hooks/useMedicos'
import { useTurnosDeMedico, useTurnosMedico } from '@/hooks/useTurnos'
import {
  readDoctorDemoSelectedId,
  writeDoctorDemoSelectedId,
} from '@/lib/storage/doctorDemoStorage'
import { isTurnoVencidoPendienteDeCierre, todayKey } from '@/lib/turnos/status'

export function useDoctorDemo() {
  const medicosQuery = useMedicos({ estado: 'activo' })
  const [selectedMedicoId, setSelectedMedicoId] = useState(() => readDoctorDemoSelectedId() ?? '')
  const medicos = useMemo(() => medicosQuery.data ?? [], [medicosQuery.data])
  const selectedMedico = medicos.find((medico) => medico.id === selectedMedicoId) ?? null

  useEffect(() => {
    if (!medicos.length) {
      return
    }

    const selectedExists = medicos.some((medico) => medico.id === selectedMedicoId)

    if (!selectedMedicoId || !selectedExists) {
      const fallbackId = medicos[0].id

      setSelectedMedicoId(fallbackId)
      writeDoctorDemoSelectedId(fallbackId)
    }
  }, [medicos, selectedMedicoId])

  const selectMedico = (medicoId: string) => {
    setSelectedMedicoId(medicoId)
    writeDoctorDemoSelectedId(medicoId)
  }

  return {
    medicos,
    selectedMedico,
    selectedMedicoId,
    selectMedico,
    isLoading: medicosQuery.isLoading,
  }
}

export function useDoctorToday(medicoId: string) {
  const fechaHoy = todayKey()
  const todayQuery = useTurnosMedico(medicoId, fechaHoy)
  const allTurnosQuery = useTurnosDeMedico(medicoId)
  const turnosHoy = todayQuery.data ?? []
  const allTurnos = allTurnosQuery.data ?? []
  const vencidosPendientes = allTurnos.filter(isTurnoVencidoPendienteDeCierre)
  const metrics = {
    total: turnosHoy.length,
    pendiente: turnosHoy.filter((turno) => turno.estado === 'pendiente').length,
    en_atencion: turnosHoy.filter((turno) => turno.estado === 'en_atencion').length,
    finalizado: turnosHoy.filter((turno) => turno.estado === 'finalizado').length,
    vencidos: vencidosPendientes.length,
  }

  return {
    fechaHoy,
    turnosHoy,
    vencidosPendientes,
    metrics,
    isLoading: todayQuery.isLoading || allTurnosQuery.isLoading,
  }
}

export function useDoctorAgenda(medicoId: string, fecha: string) {
  return useTurnosMedico(medicoId, fecha)
}

export function useDoctorPatients(medicoId: string) {
  const turnosQuery = useTurnosDeMedico(medicoId)
  const turnos = useMemo(() => turnosQuery.data ?? [], [turnosQuery.data])

  const pacientes = useMemo(() => {
    const today = todayKey()
    const byPaciente = new Map<string, (typeof turnos)[number][]>()

    turnos.forEach((turno) => {
      if (!turno.paciente) {
        return
      }

      const current = byPaciente.get(turno.paciente_id) ?? []
      byPaciente.set(turno.paciente_id, [...current, turno])
    })

    return Array.from(byPaciente.values())
      .map((items) => {
        const sorted = [...items].sort((a, b) => {
          const dateComparison = a.fecha.localeCompare(b.fecha)
          return dateComparison !== 0 ? dateComparison : a.hora.localeCompare(b.hora)
        })
        const previousTurnos = sorted.filter((turno) => turno.fecha <= today)
        const nextTurnos = sorted.filter(
          (turno) => turno.fecha >= today && turno.estado !== 'cancelado',
        )

        return {
          paciente: sorted[0].paciente,
          ultimoTurno: previousTurnos.at(-1) ?? null,
          proximoTurno: nextTurnos[0] ?? null,
          turnos: sorted,
        }
      })
      .filter((item) => item.paciente)
      .sort((a, b) =>
        `${a.paciente?.apellido ?? ''} ${a.paciente?.nombre ?? ''}`.localeCompare(
          `${b.paciente?.apellido ?? ''} ${b.paciente?.nombre ?? ''}`,
          'es',
        ),
      )
  }, [turnos])

  return {
    pacientes,
    isLoading: turnosQuery.isLoading,
  }
}
