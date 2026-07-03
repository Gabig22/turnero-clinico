import { useParams } from 'react-router-dom'

import { AgendaMedicoPage } from '@/features/medicos/AgendaMedicoPage'

export function MedicoAgendaPage() {
  const { id } = useParams()

  return <AgendaMedicoPage medicoId={id} />
}
