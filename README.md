# Turnero Clinico

Web app React + Vite + TypeScript para gestion de turnos clinicos, agenda medica, portal medico y turnero publico de sala de espera.

La version actual funciona en modo demo/mock usando `localStorage`. La migracion a Supabase/Auth esta planificada, pero todavia no esta implementada.

## Stack

- React
- Vite
- TypeScript
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- FullCalendar
- lucide-react
- sonner

## Requisitos

- Node.js compatible con el proyecto
- npm

## Configuracion local

Crear un `.env` a partir de `.env.example` si hace falta:

```env
VITE_APP_DATA_MODE=mock
VITE_APP_AUTH_MODE=mock
```

Si no se define `VITE_APP_DATA_MODE` ni `VITE_APP_AUTH_MODE`, la app usa `mock` por defecto.

Para probar Auth real sin migrar datos:

```env
VITE_APP_DATA_MODE=mock
VITE_APP_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

No usar todavia:

```env
VITE_APP_DATA_MODE=supabase
```

El modo `supabase` esta reservado para las fases siguientes. Por ahora existe un stub tipado que falla con un mensaje claro si se activa antes de implementar Supabase.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Rutas principales

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

## Persistencia demo

El modo mock guarda datos en `localStorage`:

- `turnero_mock_v1`
- `app_settings`
- `turnero_settings`
- `doctor_demo_selected_id`
- `turnero_backup_metadata_v1`

Desde `/configuracion` se puede:

- reiniciar demo
- exportar backup JSON
- importar backup JSON
- exportar CSV de turnos, pacientes y medicos
- ajustar configuracion operativa

## Migracion a Supabase

Documentacion de preparacion:

- [Plan de migracion](docs/SUPABASE_MIGRATION_PLAN.md)
- [Borrador de schema SQL](docs/SUPABASE_SCHEMA_DRAFT.sql)
- [Setup Auth minimo](docs/SUPABASE_AUTH_SETUP.md)
- [QA roles y guards](docs/SUPABASE_ROLES_GUARDS_QA.md)
- [Checklist QA modo mock](docs/MOCK_DATA_MODE_QA_CHECKLIST.md)

Arquitectura preparada:

- `mockApi`: implementacion actual demo/localStorage.
- `supabaseApi`: stub tipado para fases futuras.
- `dataApi`: capa intermedia que elige segun `VITE_APP_DATA_MODE`.

## Deploy en Vercel

El repo incluye `vercel.json` con rewrites para React Router SPA.

Configuracion recomendada:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
