import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { DemoBadge } from '@/components/shared/DemoBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { useAuth, type AuthRole } from '@/hooks/useAuth'

const roleLabels: Record<AuthRole, string> = {
  admin_general: 'Administrador',
  doctor: 'Médico',
  secretaria_medico: 'Secretaría médica',
}

export function AuthStatus() {
  const auth = useAuth()
  const navigate = useNavigate()

  if (auth.isMockMode) {
    return <DemoBadge />
  }

  const signOut = async () => {
    try {
      await auth.signOut()
      toast.success('Sesión cerrada.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos cerrar la sesión.')
    }
  }

  if (auth.isLoading) {
    return <Badge variant="muted">Verificando sesión</Badge>
  }

  if (!auth.isAuthenticated) {
    return (
      <Link className={buttonVariants({ size: 'sm', variant: 'outline' })} to="/login">
        Iniciar sesión
      </Link>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="info">Modo Supabase</Badge>
      <Badge variant="muted">
        {auth.profile?.nombre || auth.user?.email || 'Usuario autenticado'}
      </Badge>
      {auth.profile ? <Badge variant="default">{roleLabels[auth.profile.role]}</Badge> : null}
      {auth.profile && auth.profile.role !== 'admin_general' ? (
        <Badge variant="muted">{auth.medicoAccessIds.length} médicos asignados</Badge>
      ) : null}
      <Button onClick={signOut} size="sm" type="button" variant="outline">
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Salir
      </Button>
    </div>
  )
}
