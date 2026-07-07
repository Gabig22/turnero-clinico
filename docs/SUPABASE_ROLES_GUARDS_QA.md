# S3 - Roles y guards con Supabase Auth

Esta fase valida rutas y perfiles reales sin migrar todavia los datos operativos.

## Objetivo

- Mantener datos en modo mock/localStorage.
- Activar Auth real de Supabase.
- Usar `profiles.role` para dirigir usuarios.
- Usar `user_medico_access` para preparar asignaciones de medicos.

## Configuracion recomendada para probar S3

```env
VITE_APP_DATA_MODE=mock
VITE_APP_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Con esto:

- Auth usa Supabase.
- Las pantallas siguen usando datos mock/localStorage.
- No se necesita `supabaseApi` real todavia.

## Preparar Supabase

1. Crear proyecto en Supabase.
2. Ejecutar el borrador SQL si todavia no existen tablas:

```txt
docs/SUPABASE_SCHEMA_DRAFT.sql
```

3. Crear usuarios desde Supabase Auth:

- `admin@demo.com`
- `doctor@demo.com`
- `secretaria@demo.com`

4. Crear profiles.

Ejemplo admin:

```sql
insert into public.profiles (id, email, nombre, role, activo)
select id, email, 'Admin Demo', 'admin_general', true
from auth.users
where email = 'admin@demo.com'
on conflict (id) do update set
  nombre = excluded.nombre,
  role = excluded.role,
  activo = excluded.activo;
```

Ejemplo medico:

```sql
insert into public.profiles (id, email, nombre, role, activo)
select id, email, 'Dr. Demo', 'doctor', true
from auth.users
where email = 'doctor@demo.com'
on conflict (id) do update set
  nombre = excluded.nombre,
  role = excluded.role,
  activo = excluded.activo;
```

Ejemplo secretaria:

```sql
insert into public.profiles (id, email, nombre, role, activo)
select id, email, 'Secretaria Demo', 'secretaria_medico', true
from auth.users
where email = 'secretaria@demo.com'
on conflict (id) do update set
  nombre = excluded.nombre,
  role = excluded.role,
  activo = excluded.activo;
```

5. Crear al menos un medico real de prueba en Supabase para asignacion.

```sql
insert into public.medicos (nombre, especialidad, consultorio, activo)
values ('Dr. Demo Supabase', 'Clinica', '1', true)
returning id;
```

6. Asignar medico a doctor o secretaria.

```sql
insert into public.user_medico_access (user_id, medico_id)
select u.id, m.id
from auth.users u
cross join public.medicos m
where u.email = 'doctor@demo.com'
  and m.nombre = 'Dr. Demo Supabase'
on conflict (user_id, medico_id) do nothing;
```

Repetir para secretaria si corresponde.

## Pruebas de rutas

### Sin sesion

1. Abrir `/inicio`.
2. Debe redirigir a `/login?next=...`.
3. Abrir `/doctor`.
4. Debe redirigir a `/login?next=...`.
5. Abrir `/turnero`.
6. Debe seguir siendo publico.

### Admin

1. Login con `admin@demo.com`.
2. `/` debe redirigir a `/inicio`.
3. `/inicio`, `/medicos`, `/turnos`, `/pacientes`, `/configuracion` deben abrir.
4. Intentar `/doctor`.
5. Debe volver a `/inicio`.

### Doctor

1. Login con `doctor@demo.com`.
2. `/` debe redirigir a `/doctor`.
3. `/doctor`, `/doctor/agenda`, `/doctor/pacientes` deben abrir.
4. Intentar `/inicio`.
5. Debe volver a `/doctor`.

### Secretaria medica

1. Login con `secretaria@demo.com`.
2. `/` debe redirigir a `/doctor`.
3. `/doctor`, `/doctor/agenda`, `/doctor/pacientes` deben abrir.
4. Intentar `/turnos`.
5. Debe volver a `/doctor`.

### Perfil faltante

1. Crear usuario Auth sin fila en `profiles`.
2. Iniciar sesion.
3. Debe mostrar `Perfil no disponible`.

### Usuario inactivo

```sql
update public.profiles
set activo = false
where email = 'doctor@demo.com';
```

1. Iniciar sesion con ese usuario.
2. Debe mostrar `Usuario inactivo`.

## Criterios de aceptacion

- `npm run lint` pasa.
- `npm run build` pasa.
- En modo mock puro no cambia la app.
- En Auth Supabase + datos mock se puede iniciar sesion.
- Admin queda limitado a rutas admin.
- Doctor y secretaria quedan limitados al portal medico.
- Turnero publico no exige login.
- La app lee `user_medico_access` sin bloquear la navegacion si hay asignaciones.
