import { CalendarDays, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { useMedicos } from '@/hooks/useMedicos'

export function MedicosPage() {
  const medicosQuery = useMedicos()

  return (
    <div className="space-y-6">
      <PageHeader
        description="Listado simple de profesionales cargados en el demo local."
        title="Médicos"
      />

      <Card>
        <CardContent className="p-5">
          {medicosQuery.isLoading ? (
            <EmptyState icon={Stethoscope} title="Cargando médicos" />
          ) : medicosQuery.data?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[840px] border-collapse bg-card text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Especialidad</th>
                    <th className="px-4 py-3 font-semibold">Consultorio</th>
                    <th className="px-4 py-3 font-semibold">Días disponibles</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {medicosQuery.data.map((medico) => (
                    <tr className="hover:bg-accent/50" key={medico.id}>
                      <td className="px-4 py-3 font-medium text-foreground">{medico.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{medico.especialidad}</td>
                      <td className="px-4 py-3 text-muted-foreground">{medico.consultorio}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {medico.dias_disponibles?.join(', ') || 'L a S'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={medico.activo ? 'success' : 'muted'}>
                          {medico.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                          to={`/agenda/${medico.id}`}
                        >
                          <CalendarDays aria-hidden="true" className="h-4 w-4" />
                          Ver agenda
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="Usá Reiniciar demo desde el Dashboard para regenerar los datos iniciales."
              icon={Stethoscope}
              title="No hay médicos cargados"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
