import { useParams } from 'react-router-dom'

import { AgendaMedicoPage } from '@/features/medicos/AgendaMedicoPage'

export function AgendaMedicoMesPage() {
  const { medicoId } = useParams()

  return <AgendaMedicoPage medicoId={medicoId} />
}
