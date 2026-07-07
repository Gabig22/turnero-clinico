import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

type AuthAccessStateProps = {
  description: string
  title: string
}

export function AuthAccessState({ description, title }: AuthAccessStateProps) {
  const auth = useAuth()
  const navigate = useNavigate()

  const signOut = async () => {
    try {
      await auth.signOut()
      toast.success('Sesión cerrada.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos cerrar la sesión.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {auth.error ? (
            <div className="rounded-lg border border-warning/20 bg-warning-soft p-4 text-sm leading-6 text-warning">
              {auth.error}
            </div>
          ) : null}
          <Button onClick={signOut} type="button" variant="outline">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
