# Plan de migracion a Supabase/Auth

## Objetivo

Preparar la app para pasar de modo demo con `localStorage` a Supabase/Auth real sin romper el flujo actual. El modo demo debe seguir existiendo como fallback operativo y como entorno de prueba.

Decisiones base:

- Los usuarios se crean inicialmente desde el panel de Supabase.
- Una secretaria puede manejar varios medicos.
- El Turnero TV sera publico mediante clave.
- Admin ve todo.
- Medicos y secretarias ven solo medicos asignados, sus turnos y pacientes asociados.
- `mockApi` se mantiene como fallback/demo.
- Mas adelante se agrega `supabaseApi` con una interfaz compatible con `mockApi`.
- Mas adelante se agrega `dataApi`, que elige entre `mockApi` y `supabaseApi` segun `APP_DATA_MODE`.

## Arquitectura recomendada

La migracion debe hacerse por capas, no reemplazando pantallas una por una.

Estructura objetivo:

```txt
src/
  config/
    dataMode.ts              # APP_DATA_MODE: "mock" | "supabase"
  services/
    mock/
      mockApi.ts             # existente, no se reemplaza
    supabase/
      client.ts              # cliente Supabase, solo cuando se instalen deps
      supabaseApi.ts         # misma superficie principal que mockApi
      mappers.ts             # DB row -> tipos de dominio
    dataApi.ts               # switch mock/supabase
  hooks/
    useAuthSession.ts        # fase auth real
    useCurrentProfile.ts
```

Estrategia:

1. Mantener hooks existentes apuntando a la misma API publica.
2. Introducir `dataApi` como capa intermedia cuando `supabaseApi` este listo.
3. Evitar que los componentes conozcan Supabase.
4. Mantener tipos de dominio actuales (`Medico`, `Paciente`, `Turno`, etc.) y mapear desde DB.
5. Validar que cada mutacion invalide las mismas queries que hoy.

## Fases de implementacion

### S1 - Configuracion base sin afectar demo

- Agregar variables de entorno.
- Crear `APP_DATA_MODE`.
- Crear stubs de `supabaseApi` y `dataApi`, pero mantener `mock` como default.
- No cambiar pantallas todavia.
- Agregar documentacion de setup local.

Criterio de aceptacion:

- `APP_DATA_MODE=mock` funciona igual que hoy.
- Build/lint pasan.
- No se instala Supabase hasta que se decida ejecutar S2.

### S2 - Supabase client y Auth minimo

- Instalar `@supabase/supabase-js`.
- Crear `supabaseClient`.
- Crear ruta `/login`.
- Implementar login/logout con email/password.
- Crear hooks `useAuthSession` y `useCurrentProfile`.
- Mantener demo accesible con `APP_DATA_MODE=mock`.

Criterio de aceptacion:

- En modo mock no se requiere login.
- En modo supabase, rutas privadas requieren sesion.
- Usuarios se crean desde el panel de Supabase.

### S3 - Profiles, roles y route guards

- Implementar tabla `profiles`.
- Sincronizar manualmente `profiles.id = auth.users.id`.
- Crear roles: `admin_general`, `doctor`, `secretaria_medico`.
- Implementar guards por rol:
  - Admin: admin routes.
  - Doctor/secretaria: portal medico.
  - Turnero: publico con clave.
- Crear selector de medico asignado para doctor/secretaria cuando corresponda.

Criterio de aceptacion:

- Admin entra a `/inicio`.
- Doctor/secretaria entra a `/doctor`.
- Usuario sin profile queda bloqueado con mensaje claro.

### S4 - Lecturas Supabase

- Implementar en `supabaseApi`:
  - `listMedicos`
  - `getMedicoById`
  - `listPacientes`
  - `listTurnos`
  - `listTurneroEvents`
  - settings
- Mapear joins para `TurnoDetallado`.
- Mantener filtros actuales.

Criterio de aceptacion:

- Admin ve todo.
- Doctor/secretaria ve solo datos asignados.
- Turnero no expone datos sensibles.

### S5 - Mutaciones operativas

- Implementar CRUD:
  - medicos
  - pacientes
  - turnos
- Implementar acciones:
  - cambiar estado
  - siguiente turno
  - rellamar
  - finalizar
  - cancelar
  - ausente
  - reprogramar
  - posponer
- Mantener la regla de un solo `en_atencion` por medico y fecha.

Criterio de aceptacion:

- El flujo Paciente -> Turno -> Llamado -> Turnero funciona en Supabase.
- Queries se invalidan igual que en modo mock.

### S6 - RLS completo y endurecimiento

- Activar RLS en todas las tablas.
- Crear funciones helper:
  - `is_admin()`
  - `can_access_medico(medico_id)`
  - `get_turnero_public(access_key)`
- Auditar que el cliente no pueda leer DNI/email/telefono/notas desde turnero publico.
- Revisar inserts/updates de doctor y secretaria.

Criterio de aceptacion:

- Un doctor no puede consultar turnos de otro medico no asignado.
- Una secretaria puede ver varios medicos asignados.
- El turnero publico solo devuelve datos minimos.

### S7 - Migracion de datos y cierre

- Crear export/import desde backup JSON actual hacia Supabase.
- Crear script o procedimiento manual para importar:
  - medicos
  - pacientes
  - turnos
  - settings
- Hacer pruebas con data real anonimizando datos sensibles.
- Documentar rollback a `APP_DATA_MODE=mock`.

Criterio de aceptacion:

- Se puede poblar Supabase desde datos demo/backup.
- Modo mock sigue disponible.
- QA completo pasa en ambos modos.

## Variables de entorno necesarias

```env
VITE_APP_DATA_MODE=mock
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Opcionales para mas adelante:

```env
VITE_TURNERO_PUBLIC_KEY_PARAM=key
```

Notas:

- No usar service role key en frontend.
- La service role key solo podria usarse en scripts backend o tareas administrativas fuera de Vite.
- `VITE_APP_DATA_MODE` debe aceptar `mock` y `supabase`.

## Tablas propuestas

### profiles

Perfil de usuario autenticado.

Campos principales:

- `id uuid primary key references auth.users(id)`
- `email text`
- `nombre text`
- `role app_role`
- `activo boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

### user_medico_access

Relaciona usuarios con medicos asignados.

Campos principales:

- `id uuid`
- `user_id uuid references profiles(id)`
- `medico_id uuid references medicos(id)`
- `created_at timestamptz`

Reglas:

- Un doctor puede tener uno o mas medicos asignados si se necesita.
- Una secretaria puede tener varios medicos asignados.
- Admin no necesita filas en esta tabla para ver todo.

### medicos

Campos principales:

- `id uuid`
- `nombre text`
- `especialidad text`
- `consultorio text`
- `matricula text`
- `telefono text`
- `email text`
- `obras_sociales text[]`
- `dias_disponibles text[]`
- `activo boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

### pacientes

Campos principales:

- `id uuid`
- `nombre text`
- `apellido text`
- `dni text`
- `obra_social text`
- `telefono text`
- `email text`
- `notas text`
- `fecha_nacimiento date`
- `fecha_alta date`
- `activo boolean`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Regla importante:

- Medico/secretaria puede ver pacientes asociados por turnos a sus medicos.
- Si medico/secretaria crea un paciente, debe poder verlo aunque todavia no tenga turno mediante `created_by`.

### turnos

Campos principales:

- `id uuid`
- `medico_id uuid references medicos(id)`
- `paciente_id uuid references pacientes(id)`
- `fecha date`
- `hora time`
- `estado turno_estado`
- `obra_social text`
- `consultorio_cache text`
- `notas text`
- `llamado_count integer`
- `pospuesto_count integer`
- `reprogramado_count integer`
- `started_at timestamptz`
- `completed_at timestamptz`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

### turnero_events

Campos principales:

- `id uuid`
- `turno_id uuid references turnos(id)`
- `medico_id uuid references medicos(id)`
- `accion turnero_event_action`
- `consultorio text`
- `paciente_display text`
- `llamado_nro integer`
- `created_at timestamptz`

### app_settings

Configuracion general.

Campos principales:

- `id boolean primary key default true`
- `horario_inicio time`
- `horario_fin time`
- `slot_duracion integer`
- `obras_sociales text[]`
- `updated_at timestamptz`
- `updated_by uuid references profiles(id)`

### turnero_settings

Configuracion del turnero publico.

Campos principales:

- `id boolean primary key default true`
- `ding_enabled boolean`
- `high_contrast_enabled boolean`
- `public_access_key_hash text`
- `public_access_enabled boolean`
- `updated_at timestamptz`
- `updated_by uuid references profiles(id)`

Nota:

- Idealmente guardar hash de la clave publica, no la clave plana.
- Si se prioriza simplicidad inicial, puede guardarse una clave plana temporalmente, pero debe quedar marcado como deuda tecnica.

## Relaciones

```txt
auth.users 1---1 profiles
profiles 1---N user_medico_access N---1 medicos
medicos 1---N turnos N---1 pacientes
turnos 1---N turnero_events
profiles 1---N pacientes.created_by
profiles 1---N turnos.created_by
```

## Estrategia de roles

Roles:

- `admin_general`: acceso total.
- `doctor`: acceso a medicos asignados.
- `secretaria_medico`: acceso a uno o varios medicos asignados.

Recomendacion:

- Guardar el rol en `profiles.role`.
- No depender de metadata de Auth para autorizacion critica.
- RLS debe consultar `profiles`, no solo estado del frontend.

## Estrategia de RLS

Principios:

- RLS debe ser la fuente real de seguridad.
- El frontend solo mejora UX, no autoriza.
- Admin puede seleccionar, insertar, actualizar y desactivar todo.
- Doctor/secretaria solo opera sobre medicos asignados.
- Turnero publico no usa policies anonimas directas sobre tablas sensibles; usa funcion RPC segura.

Funciones:

- `is_admin()`: true si el usuario actual tiene role `admin_general`.
- `can_access_medico(medico_id)`: true si admin o si existe fila en `user_medico_access`.
- `get_turnero_public(access_key)`: devuelve solo datos minimos del dia actual.

Pacientes:

- Admin ve todos.
- Doctor/secretaria ve pacientes que:
  - tienen turnos con sus medicos asignados, o
  - fueron creados por ese usuario (`created_by = auth.uid()`).

Turnos:

- Admin ve todos.
- Doctor/secretaria ve turnos de medicos asignados.

Settings:

- Solo admin modifica.
- Lectura para usuarios autenticados segun necesidad.

## Turnero publico con clave

Ruta esperada:

```txt
/turnero?key=...
```

Estrategia:

1. El frontend lee `key` desde query string.
2. En modo Supabase llama a `get_turnero_public(key)`.
3. La funcion valida la clave contra `turnero_settings`.
4. Devuelve solo:
   - fecha
   - hora
   - paciente display publico
   - medico
   - consultorio
   - estado
   - llamado_nro
   - eventos recientes CALL/RECALL
5. No devuelve:
   - DNI
   - telefono
   - email
   - notas
   - fecha de nacimiento
   - ids internos si no son necesarios

Recomendacion de privacidad:

- Para TV, usar `Apellido, Nombre` o incluso inicial si se requiere mas privacidad.
- Mantener `paciente_display` controlado desde backend/RPC.

## Estrategia para mantener modo demo

`APP_DATA_MODE`:

```ts
export type AppDataMode = "mock" | "supabase"
```

Default recomendado:

```env
VITE_APP_DATA_MODE=mock
```

Reglas:

- `mockApi` no se elimina.
- `supabaseApi` replica funciones principales.
- `dataApi` decide:

```ts
export const dataApi = APP_DATA_MODE === "supabase" ? supabaseApi : mockApi
```

Hooks:

- Los hooks deben importar `dataApi`, no `mockApi`, recien cuando `supabaseApi` este listo.
- El cambio a `dataApi` debe hacerse en una fase especifica y probada.

Fallback:

- Si faltan variables de Supabase y `APP_DATA_MODE=supabase`, mostrar error claro.
- No cambiar automaticamente a mock en produccion sin aviso, para evitar confusion.

## Riesgos tecnicos

- RLS incompleto podria exponer pacientes o turnos de medicos no asignados.
- Turnero publico podria filtrar datos sensibles si se reutiliza `listTurnos`.
- La regla de unico `en_atencion` por medico y fecha debe ser atomica en Supabase para evitar carreras.
- Fechas y zona horaria: la app usa `YYYY-MM-DD`; Supabase debe conservar `date` y no convertir por timezone.
- `created_by` es necesario para que doctor/secretaria vea pacientes recien creados sin turno.
- Imports desde backup JSON pueden duplicar DNI si no hay estrategia de upsert.
- `consultorio_cache` debe actualizarse al cambiar consultorio del medico o aceptarse como historico.
- Secretarias con muchos medicos pueden necesitar filtros server-side eficientes.
- La clave del turnero no debe estar hardcodeada ni exponerse como secreto real; es control de acceso publico limitado.
- Realtime no es obligatorio al inicio; polling puede seguir, pero hay que vigilar costos y frecuencia.

## Checklist de QA

### Modo mock

- Dashboard carga.
- Medicos CRUD funciona.
- Pacientes CRUD funciona.
- Turnos CRUD funciona.
- Calendario general funciona.
- Agenda medica funciona.
- Portal medico funciona.
- Turnero publico funciona.
- Configuracion y backup/export siguen funcionando.

### Auth

- Usuario admin entra a `/inicio`.
- Usuario doctor entra a `/doctor`.
- Usuario secretaria entra a `/doctor`.
- Usuario sin profile ve bloqueo claro.
- Logout limpia sesion.

### RLS admin

- Admin puede leer todos los medicos.
- Admin puede leer todos los pacientes.
- Admin puede leer todos los turnos.
- Admin puede modificar settings.

### RLS doctor/secretaria

- Solo ve medicos asignados.
- Solo ve turnos de medicos asignados.
- Ve pacientes asociados por turnos.
- Ve pacientes creados por si mismo aunque todavia no tengan turno.
- No puede ver DNI/email/telefono/notas por rutas publicas.
- Puede llamar/rellamar/finalizar/reprogramar/posponer/ausente solo turnos permitidos.

### Turnero publico

- `/turnero?key=valida` muestra datos minimos.
- `/turnero?key=invalida` no muestra datos.
- No expone DNI.
- No expone telefono.
- No expone email.
- No expone notas.
- No permite escrituras.

### Datos y concurrencia

- Dos clicks simultaneos de llamar no dejan dos turnos `en_atencion` para el mismo medico/fecha.
- Crear turno respeta medico/paciente existentes.
- Reprogramar mantiene historial y estado coherente.
- Rellamar crea evento RECALL.
- Llamar crea evento CALL.

## Pendientes de decision

- Si el turnero publico muestra nombre completo o formato parcial.
- Si `turnero_settings.public_access_key_hash` usa hash con `pgcrypto` desde el inicio.
- Si se usara polling o Supabase Realtime en Turnero TV.
- Si los admins pueden crear usuarios desde la app o se mantiene solo panel Supabase.
- Si habra multi-sede/multi-tenant en el futuro.
