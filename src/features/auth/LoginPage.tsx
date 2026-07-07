import { Activity, CalendarClock, Loader2, Monitor, Stethoscope, UsersRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { hasSupabaseConfig } from '@/services/supabase/client'

const loginHighlights = [
  {
    title: 'Agenda médica',
    description: 'Turnos diarios ordenados por profesional y consultorio.',
    icon: CalendarClock,
  },
  {
    title: 'Atención clínica',
    description: 'Llamados, estados y seguimiento operativo en tiempo real.',
    icon: Stethoscope,
  },
  {
    title: 'Turnero TV',
    description: 'Pantalla pública clara para sala de espera.',
    icon: Monitor,
  },
]

function getPostLoginPath(role?: string | null) {
  return role === 'doctor' || role === 'secretaria_medico' ? '/doctor' : '/inicio'
}

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nextPath = searchParams.get('next')

  if (auth.isMockMode) {
    return <Navigate replace to="/inicio" />
  }

  if (auth.isAuthenticated && auth.profile) {
    return <Navigate replace to={nextPath || getPostLoginPath(auth.profile?.role)} />
  }

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await auth.signIn(email.trim(), password)
      toast.success('Sesión iniciada correctamente.')
      navigate(nextPath || '/', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-2xl border border-border bg-card/85 p-8 shadow-clinical lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
            <Activity aria-hidden="true" className="h-4 w-4" />
            Modo clínico operativo
          </div>

          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Turnos, agenda y sala de espera
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Turnero Clínico
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Accedé al panel para coordinar pacientes, médicos y llamados del día con una
              experiencia simple, clara y preparada para migrar a producción.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {loginHighlights.map((item) => {
              const Icon = item.icon

              return (
                <div
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4"
                  key={item.title}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-primary-soft/70 to-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">Sala de espera digital</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Flujo preparado para pacientes, secretaría y portal médico.
                </p>
              </div>
              <UsersRound aria-hidden="true" className="h-9 w-9 text-primary" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-card/80 p-3">
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-xs font-medium text-muted-foreground">Turnos</p>
              </div>
              <div className="rounded-xl bg-card/80 p-3">
                <p className="text-2xl font-bold text-info">3</p>
                <p className="text-xs font-medium text-muted-foreground">En atención</p>
              </div>
              <div className="rounded-xl bg-card/80 p-3">
                <p className="text-2xl font-bold text-warning">8</p>
                <p className="text-xs font-medium text-muted-foreground">Próximos</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="w-full max-w-md justify-self-center shadow-clinical lg:justify-self-end">
        <CardHeader className="space-y-4 text-center">
          <div className="login-turnero-heartbeat relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <CalendarClock aria-hidden="true" className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[0.55rem] font-bold text-white">
              +
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl">Ingresar al sistema</CardTitle>
            <CardDescription>
              Acceso con usuario creado desde el panel de Supabase.
            </CardDescription>
          </div>
          <div className="flex justify-center">
            <Badge variant="info">Modo Supabase</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {!hasSupabaseConfig() ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
              Faltan las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Configuralas o
              volvé a `VITE_APP_DATA_MODE=mock`.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submitLogin}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Email</span>
                <input
                  autoComplete="email"
                  className="form-input"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@clinica.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Contraseña
                </span>
                <input
                  autoComplete="current-password"
                  className="form-input"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresá tu contraseña"
                  required
                  type="password"
                  value={password}
                />
              </label>

              {auth.error ? (
                <p className="rounded-md border border-warning/20 bg-warning-soft px-3 py-2 text-sm text-warning">
                  {auth.error}
                </p>
              ) : null}

              <Button className="w-full" disabled={isSubmitting || auth.isLoading} type="submit">
                {isSubmitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          )}
        </CardContent>
        </Card>
      </div>
    </main>
  )
}
