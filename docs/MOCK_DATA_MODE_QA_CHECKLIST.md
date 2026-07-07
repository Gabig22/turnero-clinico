# QA modo mock con dataApi

Esta checklist valida que la app sigue funcionando en modo demo/localStorage despues de introducir la capa `dataApi`.

## Configuracion esperada

```env
VITE_APP_DATA_MODE=mock
```

Si no existe `.env`, la app usa `mock` por defecto.

No usar todavia:

```env
VITE_APP_DATA_MODE=supabase
```

Ese modo queda reservado para fases S2-S5. Por ahora el stub de Supabase muestra un error claro si se activa antes de tiempo.

## Comandos base

```bash
npm run lint
npm run build
npm run dev
```

## Rutas de humo

- `/`
- `/inicio`
- `/medicos`
- `/turnos`
- `/turnos/calendario`
- `/pacientes`
- `/configuracion`
- `/turnero`
- `/doctor`
- `/doctor/agenda`
- `/doctor/pacientes`

## Flujo admin

- Entrar a `/inicio`.
- Ver metricas del dia.
- Llamar siguiente desde una card medica.
- Rellamar turno actual.
- Finalizar turno actual.
- Ver reflejo en `/turnero`.

## Medicos

- Entrar a `/medicos`.
- Crear medico.
- Editar medico.
- Activar/desactivar medico.
- Entrar a agenda con el boton de agenda.
- Confirmar que `/agenda/:medicoId` carga.

## Pacientes

- Entrar a `/pacientes`.
- Crear paciente.
- Editar paciente.
- Activar/desactivar paciente.
- Buscar por nombre, apellido o DNI.
- Filtrar por obra social.

## Turnos

- Entrar a `/turnos`.
- Abrir el boton `Filtros`.
- Filtrar por fecha, estado, medico, obra social y consultorio.
- Limpiar filtros.
- Crear turno.
- Editar turno.
- Llamar turno pendiente.
- Rellamar turno en atencion.
- Finalizar turno.
- Cancelar turno.
- Posponer turno.
- Reprogramar turno.
- Marcar ausente.

## Calendario general

- Entrar a `/turnos/calendario`.
- Cambiar fecha desde el calendario.
- Crear turno desde fecha seleccionada.
- Ver el turno en calendario y en tabla/listado.
- Usar acciones rapidas de turno.

## Agenda medica admin

- Entrar desde `/medicos` a la agenda.
- Cambiar fecha.
- Crear turno con medico preseleccionado.
- Llamar, rellamar, finalizar, cancelar, posponer, reprogramar y ausente.

## Portal medico

- Entrar a `/doctor`.
- Cambiar medico demo.
- Ver `Turnos de Hoy`.
- Ir a `/doctor/agenda`.
- Crear turno desde agenda.
- Ir a `/doctor/pacientes`.
- Crear turno desde un paciente.
- Volver a Panel Admin.

## Turnero publico

- Entrar a `/turnero`.
- Ver paciente en atencion si existe.
- Ver historial de llamados.
- Ver proximos turnos.
- Probar pantalla completa.
- Probar activar/desactivar sonido.
- Probar alto contraste desde `/configuracion`.

## Configuracion y persistencia

- Cambiar horario de inicio/fin.
- Cambiar duracion de slot.
- Agregar/quitar obra social.
- Cambiar sonido ding.
- Cambiar alto contraste.
- Exportar backup JSON.
- Exportar CSV de turnos, pacientes y medicos.
- Importar backup JSON.
- Reiniciar demo.
- Recargar navegador y confirmar persistencia.

## Criterios de aceptacion S1B

- `npm run lint` pasa.
- `npm run build` pasa.
- Todas las rutas principales renderizan.
- El flujo Paciente -> Turno -> Llamado -> Turnero sigue funcionando.
- El modo mock no requiere variables de Supabase.
- No hay imports operativos directos a `mockApi` desde hooks; pasan por `dataApi`.
- Activar `VITE_APP_DATA_MODE=supabase` no se considera soportado todavia.
