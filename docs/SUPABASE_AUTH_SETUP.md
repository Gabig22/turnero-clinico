# Supabase Auth minimo

Esta fase agrega el cliente Supabase y la ruta `/login`, pero no migra datos operativos. El modo demo/localStorage sigue siendo el modo seguro por defecto.

## Modo demo

```env
VITE_APP_DATA_MODE=mock
VITE_APP_AUTH_MODE=mock
```

Con este modo:

- No se exige login.
- `mockApi` sigue funcionando mediante `dataApi`.
- `/login` redirige a `/inicio`.

## Modo Supabase Auth

```env
VITE_APP_DATA_MODE=mock
VITE_APP_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Con este modo:

- `/login` permite iniciar sesion con email/password.
- Las rutas admin y portal medico requieren sesion.
- `/turnero` sigue siendo publico.
- El header muestra el usuario autenticado y boton `Salir`.
- Los datos operativos pueden seguir en mock hasta implementar `supabaseApi`.

## Usuarios

Por decision de producto, los usuarios se crean inicialmente desde el panel de Supabase.

Despues de crear un usuario en Supabase Auth, crear una fila en `profiles`:

```sql
insert into public.profiles (id, email, nombre, role, activo)
values (
  'AUTH_USER_ID',
  'usuario@clinica.com',
  'Nombre Apellido',
  'admin_general',
  true
);
```

Roles previstos:

- `admin_general`
- `doctor`
- `secretaria_medico`

## Importante

- Esta fase no implementa `supabaseApi` real.
- Para probar Auth sin datos reales, usar `VITE_APP_DATA_MODE=mock` y `VITE_APP_AUTH_MODE=supabase`.
- Si `VITE_APP_DATA_MODE=supabase`, `dataApi` apunta al stub de `supabaseApi`.
- Las lecturas y mutaciones reales quedan para fases S4-S5.
- RLS y asignacion medico/usuario quedan para S3/S6.
