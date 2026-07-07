-- SUPABASE SCHEMA DRAFT
-- Este archivo es un borrador. No aplicar en produccion sin revisar RLS,
-- indices, estrategia de clave publica del turnero y migracion de datos.

-- Recomendado para UUID y hashing simple.
-- En Supabase normalmente pgcrypto esta disponible, pero debe verificarse.
create extension if not exists pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'admin_general',
      'doctor',
      'secretaria_medico'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'turno_estado') then
    create type public.turno_estado as enum (
      'pendiente',
      'en_atencion',
      'finalizado',
      'cancelado',
      'pospuesto',
      'ausente',
      'reprogramado'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'turnero_event_action') then
    create type public.turnero_event_action as enum (
      'CALL',
      'RECALL'
    );
  end if;
end $$;

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text not null default '',
  role public.app_role not null default 'doctor',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  especialidad text not null,
  consultorio text not null,
  matricula text not null default '',
  telefono text,
  email text,
  obras_sociales text[] not null default '{}',
  dias_disponibles text[] not null default '{}',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_medico_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  medico_id uuid not null references public.medicos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, medico_id)
);

create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  dni text not null,
  obra_social text not null,
  telefono text,
  email text,
  notas text,
  fecha_nacimiento date,
  fecha_alta date,
  activo boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pacientes_dni_unique unique (dni)
);

create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid not null references public.medicos(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  fecha date not null,
  hora time not null,
  estado public.turno_estado not null default 'pendiente',
  obra_social text not null,
  consultorio_cache text,
  notas text,
  llamado_count integer not null default 0,
  pospuesto_count integer not null default 0,
  reprogramado_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.turnero_events (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid references public.turnos(id) on delete set null,
  medico_id uuid not null references public.medicos(id) on delete restrict,
  accion public.turnero_event_action not null,
  consultorio text,
  paciente_display text,
  llamado_nro integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id boolean primary key default true,
  horario_inicio time not null default '09:00',
  horario_fin time not null default '17:30',
  slot_duracion integer not null default 30,
  obras_sociales text[] not null default array[
    'OSDE',
    'Swiss Medical',
    'IAPS',
    'IPS',
    'PAMI',
    'Galeno',
    'Particular'
  ],
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = true),
  constraint app_settings_slot_duracion_check check (slot_duracion in (15, 20, 30, 40)),
  constraint app_settings_horario_check check (horario_inicio < horario_fin)
);

create table if not exists public.turnero_settings (
  id boolean primary key default true,
  ding_enabled boolean not null default true,
  high_contrast_enabled boolean not null default false,
  public_access_enabled boolean not null default true,
  public_access_key_hash text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint turnero_settings_singleton check (id = true)
);

-- Nota:
-- Para una primera demo puede usarse public_access_key_hash con crypt().
-- Antes de produccion decidir si se genera/rota la clave desde backend o panel admin.

insert into public.app_settings (id)
values (true)
on conflict (id) do nothing;

insert into public.turnero_settings (id)
values (true)
on conflict (id) do nothing;

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_activo on public.profiles(activo);

create index if not exists idx_user_medico_access_user_id
  on public.user_medico_access(user_id);

create index if not exists idx_user_medico_access_medico_id
  on public.user_medico_access(medico_id);

create index if not exists idx_medicos_nombre
  on public.medicos using btree (nombre);

create index if not exists idx_medicos_especialidad
  on public.medicos using btree (especialidad);

create index if not exists idx_medicos_activo
  on public.medicos(activo);

create index if not exists idx_pacientes_apellido_nombre
  on public.pacientes(apellido, nombre);

create index if not exists idx_pacientes_dni
  on public.pacientes(dni);

create index if not exists idx_pacientes_created_by
  on public.pacientes(created_by);

create index if not exists idx_turnos_fecha_hora
  on public.turnos(fecha, hora);

create index if not exists idx_turnos_medico_fecha_hora
  on public.turnos(medico_id, fecha, hora);

create index if not exists idx_turnos_paciente_id
  on public.turnos(paciente_id);

create index if not exists idx_turnos_estado
  on public.turnos(estado);

create index if not exists idx_turnero_events_created_at
  on public.turnero_events(created_at desc);

create index if not exists idx_turnero_events_medico_created_at
  on public.turnero_events(medico_id, created_at desc);

-- Evita mas de un turno en atencion por medico y fecha.
-- Esta regla complementa la logica transaccional de "llamar siguiente".
create unique index if not exists idx_turnos_one_en_atencion_per_medico_day
  on public.turnos(medico_id, fecha)
  where estado = 'en_atencion';

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_medicos_updated_at on public.medicos;
create trigger set_medicos_updated_at
before update on public.medicos
for each row execute function public.set_updated_at();

drop trigger if exists set_pacientes_updated_at on public.pacientes;
create trigger set_pacientes_updated_at
before update on public.pacientes
for each row execute function public.set_updated_at();

drop trigger if exists set_turnos_updated_at on public.turnos;
create trigger set_turnos_updated_at
before update on public.turnos
for each row execute function public.set_updated_at();

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_turnero_settings_updated_at on public.turnero_settings;
create trigger set_turnero_settings_updated_at
before update on public.turnero_settings
for each row execute function public.set_updated_at();

-- =========================================================
-- RLS HELPERS
-- =========================================================

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.activo = true
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin_general', false)
$$;

create or replace function public.can_access_medico(target_medico_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.user_medico_access uma
      join public.profiles p on p.id = uma.user_id
      where uma.user_id = auth.uid()
        and uma.medico_id = target_medico_id
        and p.activo = true
        and p.role in ('doctor', 'secretaria_medico')
    )
$$;

create or replace function public.can_access_paciente(target_paciente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.pacientes p
      where p.id = target_paciente_id
        and p.created_by = auth.uid()
    )
    or exists (
      select 1
      from public.turnos t
      where t.paciente_id = target_paciente_id
        and public.can_access_medico(t.medico_id)
    )
$$;

-- =========================================================
-- PUBLIC TURNERO RPC
-- =========================================================

create or replace function public.get_turnero_public(access_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  settings_row public.turnero_settings%rowtype;
  is_valid_key boolean := false;
  today_date date := current_date;
begin
  select *
  into settings_row
  from public.turnero_settings
  where id = true;

  if settings_row.public_access_enabled is not true then
    return jsonb_build_object('ok', false, 'reason', 'disabled');
  end if;

  -- Decision pendiente:
  -- Si public_access_key_hash se genera con crypt(), validar con:
  -- crypt(access_key, settings_row.public_access_key_hash) = settings_row.public_access_key_hash
  -- Para un primer borrador se deja esa estrategia.
  is_valid_key :=
    settings_row.public_access_key_hash is not null
    and access_key is not null
    and crypt(access_key, settings_row.public_access_key_hash) = settings_row.public_access_key_hash;

  if not is_valid_key then
    return jsonb_build_object('ok', false, 'reason', 'invalid_key');
  end if;

  return jsonb_build_object(
    'ok', true,
    'fecha', today_date,
    'turnos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'hora', to_char(t.hora, 'HH24:MI'),
          'paciente', concat(p.apellido, ', ', p.nombre),
          'medico', m.nombre,
          'consultorio', coalesce(t.consultorio_cache, m.consultorio),
          'estado', t.estado,
          'llamado_nro', t.llamado_count
        )
        order by t.hora asc
      )
      from public.turnos t
      join public.pacientes p on p.id = t.paciente_id
      join public.medicos m on m.id = t.medico_id
      where t.fecha = today_date
        and t.estado in ('pendiente', 'en_atencion', 'finalizado', 'cancelado')
    ), '[]'::jsonb),
    'eventos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'accion', e.accion,
          'paciente', e.paciente_display,
          'consultorio', e.consultorio,
          'llamado_nro', e.llamado_nro,
          'created_at', e.created_at
        )
        order by e.created_at desc
      )
      from (
        select *
        from public.turnero_events
        where created_at >= today_date
        order by created_at desc
        limit 8
      ) e
    ), '[]'::jsonb)
  );
end;
$$;

-- La funcion publica debe poder ejecutarse sin sesion.
-- Importante: no concede lectura directa sobre tablas.
grant execute on function public.get_turnero_public(text) to anon, authenticated;

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.medicos enable row level security;
alter table public.user_medico_access enable row level security;
alter table public.pacientes enable row level security;
alter table public.turnos enable row level security;
alter table public.turnero_events enable row level security;
alter table public.app_settings enable row level security;
alter table public.turnero_settings enable row level security;

-- =========================================================
-- RLS POLICIES - profiles
-- =========================================================

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_basic_or_admin" on public.profiles;
create policy "profiles_update_self_basic_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Inserts de profiles normalmente se hacen por trigger o por admin desde SQL.
-- Si se habilita alta desde app, crear policy especifica y restringida.

-- =========================================================
-- RLS POLICIES - medicos
-- =========================================================

drop policy if exists "medicos_select_allowed" on public.medicos;
create policy "medicos_select_allowed"
on public.medicos
for select
to authenticated
using (public.can_access_medico(id));

drop policy if exists "medicos_insert_admin" on public.medicos;
create policy "medicos_insert_admin"
on public.medicos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "medicos_update_admin" on public.medicos;
create policy "medicos_update_admin"
on public.medicos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "medicos_delete_admin" on public.medicos;
create policy "medicos_delete_admin"
on public.medicos
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS POLICIES - user_medico_access
-- =========================================================

drop policy if exists "user_medico_access_select_self_or_admin" on public.user_medico_access;
create policy "user_medico_access_select_self_or_admin"
on public.user_medico_access
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_medico_access_admin_write" on public.user_medico_access;
create policy "user_medico_access_admin_write"
on public.user_medico_access
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- RLS POLICIES - pacientes
-- =========================================================

drop policy if exists "pacientes_select_allowed" on public.pacientes;
create policy "pacientes_select_allowed"
on public.pacientes
for select
to authenticated
using (public.can_access_paciente(id));

drop policy if exists "pacientes_insert_allowed" on public.pacientes;
create policy "pacientes_insert_allowed"
on public.pacientes
for insert
to authenticated
with check (
  public.is_admin()
  or (
    created_by = auth.uid()
    and public.current_profile_role() in ('doctor', 'secretaria_medico')
  )
);

drop policy if exists "pacientes_update_allowed" on public.pacientes;
create policy "pacientes_update_allowed"
on public.pacientes
for update
to authenticated
using (public.can_access_paciente(id))
with check (public.can_access_paciente(id));

-- No se recomienda delete fisico de pacientes.
-- Usar activo=false. Si se habilita delete, solo admin.

-- =========================================================
-- RLS POLICIES - turnos
-- =========================================================

drop policy if exists "turnos_select_allowed" on public.turnos;
create policy "turnos_select_allowed"
on public.turnos
for select
to authenticated
using (public.can_access_medico(medico_id));

drop policy if exists "turnos_insert_allowed" on public.turnos;
create policy "turnos_insert_allowed"
on public.turnos
for insert
to authenticated
with check (
  public.can_access_medico(medico_id)
  and (
    public.is_admin()
    or created_by = auth.uid()
  )
);

drop policy if exists "turnos_update_allowed" on public.turnos;
create policy "turnos_update_allowed"
on public.turnos
for update
to authenticated
using (public.can_access_medico(medico_id))
with check (public.can_access_medico(medico_id));

drop policy if exists "turnos_delete_admin" on public.turnos;
create policy "turnos_delete_admin"
on public.turnos
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS POLICIES - turnero_events
-- =========================================================

drop policy if exists "turnero_events_select_allowed" on public.turnero_events;
create policy "turnero_events_select_allowed"
on public.turnero_events
for select
to authenticated
using (public.can_access_medico(medico_id));

drop policy if exists "turnero_events_insert_allowed" on public.turnero_events;
create policy "turnero_events_insert_allowed"
on public.turnero_events
for insert
to authenticated
with check (public.can_access_medico(medico_id));

-- Eventos no deberian actualizarse ni borrarse desde cliente.

-- =========================================================
-- RLS POLICIES - settings
-- =========================================================

drop policy if exists "app_settings_select_authenticated" on public.app_settings;
create policy "app_settings_select_authenticated"
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write"
on public.app_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "turnero_settings_select_authenticated" on public.turnero_settings;
create policy "turnero_settings_select_authenticated"
on public.turnero_settings
for select
to authenticated
using (true);

drop policy if exists "turnero_settings_admin_write" on public.turnero_settings;
create policy "turnero_settings_admin_write"
on public.turnero_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- SUGGESTED RPCS FOR LATER IMPLEMENTATION
-- =========================================================

-- Pendiente:
-- Crear RPC transaccional siguiente_turno(medico_id uuid)
-- que:
-- 1. Bloquee turnos del medico/fecha actual.
-- 2. Finalice el turno en_atencion actual.
-- 3. Tome el primer pendiente por hora.
-- 4. Lo pase a en_atencion.
-- 5. Incremente llamado_count.
-- 6. Cree turnero_event CALL.
--
-- Esto evita condiciones de carrera que el frontend no puede resolver solo.

-- Pendiente:
-- Crear RPC rellamar_turno(turno_id uuid)
-- que valide acceso, estado en_atencion e inserte RECALL.
