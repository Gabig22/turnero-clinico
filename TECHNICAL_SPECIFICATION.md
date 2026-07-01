# TURNERO CLÍNICO - COMPLETE TECHNICAL SPECIFICATION

**Version:** 1.0  
**Date:** 2026-01-09  
**Mode:** Mock/Demo (localStorage-based)

---

## 1. SYSTEM OVERVIEW

### 1.1 Purpose
Medical appointment management system ("Turnero") for clinical centers. Manages the complete lifecycle of patient appointments from scheduling through completion, with a public-facing digital queue display.

### 1.2 Problem Solved
- Centralized appointment scheduling for multiple doctors
- Real-time queue management with public display
- Patient registry management
- Doctor agenda visualization
- Administrative oversight of clinical operations

### 1.3 Target Users and Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin_general` | Full system administrator | All modules, all CRUD operations |
| `supervisor` | Limited administrator | View + limited edit capabilities |
| `doctor` | Medical professional | Personal agenda, own patients (derived from appointments) |
| `public` | Waiting room display | Read-only turnero view |

### 1.4 End-to-End Usage Flow

```
1. Admin creates doctors → assigns specialties, consultation rooms, available days
2. Admin/Staff creates patients → personal data, health insurance (obra social)
3. Admin/Staff schedules appointments → links patient + doctor + date/time
4. Day of appointment:
   a. Patient arrives at clinic
   b. Staff/Doctor calls next patient → appointment status changes to "en_atencion"
   c. Turnero TV displays current patient being attended
   d. Consultation completes → status changes to "finalizado"
   e. Repeat for next patient
5. Doctor can view their agenda, manage appointments, view assigned patients
```

---

## 2. SCREENS / PANELS STRUCTURE

### 2.1 Route Map

| Route | Internal Name | Layout | Access |
|-------|---------------|--------|--------|
| `/` | Root | Redirect | All |
| `/inicio` | Dashboard | MainLayout | Admin |
| `/medicos` | MedicosPanel | MainLayout | Admin |
| `/medicos/:id` | MedicoAgenda | MainLayout | Admin |
| `/agenda/:medicoId` | AgendaMedicoMes | MainLayout | Admin |
| `/turnos` | TurnosPanel | MainLayout | Admin |
| `/pacientes` | PacientesPanel | MainLayout | Admin |
| `/turnero` | TurneroTV | Fullscreen (no sidebar) | Public |
| `/configuracion` | ConfiguracionPanel | MainLayout | Admin |
| `/doctor` | DoctorHome | MainLayout | Doctor |
| `/doctor/agenda` | DoctorAgenda | MainLayout | Doctor |
| `/doctor/pacientes` | DoctorPacientes | MainLayout | Doctor |

### 2.2 Screen Specifications

---

#### 2.2.1 Dashboard (`/inicio`)

**Functional Objective:** Overview of daily clinical operations with quick metrics and doctor status cards.

**Navigation Source:** Sidebar menu "Inicio" or root redirect

**Data Displayed:**
- Selected date (defaults to today)
- Active doctors count for the day
- Unique patients with appointments
- Total appointments for the day
- Pending/In-progress/Finalized counts
- Doctor cards showing individual appointment summaries

**Actions Available:**
- Change date filter (Today/Tomorrow/Week)
- Filter by specialty, status, health insurance
- Search by text
- Create new appointment (opens modal)
- Navigate to specific doctor's agenda
- Reset demo data

**States:**
- Loading: Skeleton placeholders
- Empty (Sunday): "Los domingos el centro permanece cerrado"
- Empty (no doctors): "No hay médicos disponibles para hoy"
- Populated: Grid of DoctorCard components

---

#### 2.2.2 Doctors Panel (`/medicos`)

**Functional Objective:** CRUD management of medical professionals.

**Navigation Source:** Sidebar menu "Médicos"

**Data Displayed:**
- Table with columns: Name, Specialty, Office, License, Available Days, Health Insurances, Status (active/inactive), Actions

**Actions Available:**
- Create new doctor (opens form modal)
- Edit doctor (opens form modal with prefilled data)
- Toggle doctor active/inactive status
- Delete doctor (only if no appointments exist)
- Filter by search, specialty, office, status
- Reset demo data

**States:**
- Loading: "Cargando..."
- Empty: EmptyState with create button
- Populated: Table with rows

---

#### 2.2.3 Doctor Agenda (`/medicos/:id` and `/agenda/:medicoId`)

**Functional Objective:** Monthly calendar view of a specific doctor's appointments.

**Navigation Source:** Click on doctor card from Dashboard, or click "Ver agenda" from doctors table

**Data Displayed:**
- Doctor name and specialty in header
- FullCalendar monthly view with appointment events
- Selected day's appointments in sidebar panel

**Actions Available:**
- Navigate between months
- Click date to view that day's appointments
- Click appointment to open detail modal
- Create new appointment on specific date
- Change appointment status
- Drag-and-drop to reschedule (time only)

**States:**
- Loading: Skeleton calendar
- No appointments: Empty calendar
- Populated: Events displayed on calendar

---

#### 2.2.4 Appointments Panel (`/turnos`)

**Functional Objective:** Comprehensive appointment management with filtering and pagination.

**Navigation Source:** Sidebar menu "Turnos"

**Data Displayed:**
- Table with columns: Patient (name, DNI), Health Insurance, Date, Time, Doctor, Office, Status, Actions
- Pagination controls
- Total count

**Filters:**
- Temporal view tabs: "Próximos" (upcoming), "Todos" (all), "Pasados" (past)
- Date range (from/to)
- Status multi-select
- Doctor dropdown
- Health insurance dropdown
- Office dropdown
- Text search (patient name, DNI, doctor name)

**Actions Available:**
- Create new appointment
- Create new patient (quick form)
- Edit appointment
- Change appointment status
- Cancel appointment
- Edit patient from context
- Export to CSV

**States:**
- Loading: Skeleton rows
- Empty: "No hay turnos que coincidan con los filtros"
- Populated: Paginated table

---

#### 2.2.5 Patients Panel (`/pacientes`)

**Functional Objective:** Patient registry management.

**Navigation Source:** Sidebar menu "Pacientes"

**Data Displayed:**
- Table with columns: Full Name (Apellido, Nombre), Age (with birth date tooltip), DNI, Health Insurance, Phone, Email, Status, Actions

**Filters:**
- Text search (DNI, name, surname)
- Health insurance dropdown

**Actions Available:**
- Create new patient (opens form dialog)
- Edit patient
- Toggle active/inactive status
- Confirmation dialogs for destructive actions

**States:**
- Loading: "Cargando..."
- Empty: EmptyState with create button
- Populated: Table with rows

---

#### 2.2.6 Turnero TV (`/turnero`)

**Functional Objective:** Public-facing real-time queue display for waiting room monitors.

**Navigation Source:** Direct URL access, typically with auth key parameter (`?key=demo`)

**Data Displayed:**
- Current date
- Current appointment banner (patient name, office number, doctor, time)
- Banner queue indicator ("+N en cola")
- Appointment history table (today's appointments sorted by time)
- Call history cards (recent CALL/RECALL events)
- "Next appointment" indicator

**Features:**
- Banner display duration: 10 seconds per appointment
- Audio ding on new "en_atencion" status
- Auto-refresh every 60 seconds
- High contrast mode toggle
- Fullscreen mode
- "Hora vigente" highlighting (first pending time slot)
- Zap icon when 2+ appointments at same time

**Actions Available (with auth key):**
- Click row to open action overlay
- Change status from overlay
- Fullscreen toggle
- Return to admin panel

**States:**
- Loading: Skeleton rows
- No appointments: "Esperando próximos llamados…"
- Populated: Table with rows, optional banner

---

#### 2.2.7 Configuration (`/configuracion`)

**Functional Objective:** System-wide settings management.

**Navigation Source:** Sidebar menu "Configuración"

**Tabs:**

**Parameters Tab:**
- Operating hours (start/end time inputs)
- Slot duration (15/20/30/40 minutes dropdown)
- Turnero access key (text input)

**Health Insurances Tab:**
- List of configured options as chips
- Add new option
- Remove option (click X on chip)
- Reset to defaults

**Turnero Tab:**
- Ding sound toggle + test button
- High contrast mode toggle
- Clear call history button

**Demo Data Tab:**
- Reset demo data button
- Reload December/January data button

---

#### 2.2.8 Doctor Portal Home (`/doctor`)

**Functional Objective:** Doctor's personal dashboard.

**Navigation Source:** Sidebar when in doctor context

**Data Displayed:**
- Welcome message with doctor name
- Doctor selector (if multiple doctors in demo mode)
- Quick navigation buttons (Agenda, Patients)
- Today's appointments card (TurnosDeHoyCard)

**Actions Available:**
- Switch doctor (demo mode)
- Navigate to agenda
- Navigate to patients
- Call next patient
- Re-call current patient
- Postpone patient

---

#### 2.2.9 Doctor Agenda (`/doctor/agenda`)

**Functional Objective:** Doctor's personal calendar view.

**Navigation Source:** Doctor Portal → "Agenda" button

**Data Displayed:**
- FullCalendar with personal appointments
- Daily stats (pending, in-progress, finalized)
- Selected day detail panel

**Actions Available:**
- Same as Admin agenda but filtered to logged doctor
- Create appointment (auto-assigns to self)
- Change status, edit, reschedule

---

#### 2.2.10 Doctor Patients (`/doctor/pacientes`)

**Functional Objective:** View patients associated with the doctor (derived from appointment history).

**Navigation Source:** Doctor Portal → "Pacientes" button

**Data Displayed:**
- Same table structure as admin patients
- Filtered to patients who have had appointments with this doctor

**Actions Available:**
- Create patient (auto-associated via future appointments)
- Edit patient
- Toggle active status
- Search and filter

---

## 3. TEXT-ONLY FUNCTIONAL WIREFRAMES

### 3.1 Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ [SIDEBAR TRIGGER] [DEMO BADGE]                                  │
├─────────────────────────────────────────────────────────────────┤
│ HEADER BAR                                                      │
│ ┌───────────────────────────────────────────┬─────────────────┐ │
│ │ "Panel de Control"                        │ [REINICIAR]     │ │
│ │ 📅 {weekday}, {day} de {month} de {year}  │ [FILTROS]       │ │
│ │                                           │ [+ NUEVO TURNO] │ │
│ └───────────────────────────────────────────┴─────────────────┘ │
│ FILTER CHIPS: [Hoy ✕] [Clínica ✕] [OSDE ✕]                      │
├─────────────────────────────────────────────────────────────────┤
│ STATS GRID (2x2 on mobile, 4-col on desktop)                    │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│ │ Médicos      │ Pacientes    │ Turnos Hoy   │ Finalizados  │   │
│ │ [count]      │ [count]      │ [count]      │ [count]      │   │
│ │ [icon]       │ [icon]       │ [pend/aten]  │ de [total]   │   │
│ └──────────────┴──────────────┴──────────────┴──────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ "Médicos del día"                                               │
│ "Agenda y turnos del día"                                       │
├─────────────────────────────────────────────────────────────────┤
│ DOCTOR CARDS GRID (1-col mobile, 2-col tablet, 3-col desktop)   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ DOCTOR CARD                                                 │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ {Doctor Name}                               [ACTIVO]    │ │ │
│ │ │ {Specialty} · Consultorio {N}                          │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ MINI STATS: [Pendientes: N] [En curso: N] [Final: N]   │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ APPOINTMENT LIST (scrollable, max-height)              │ │ │
│ │ │ {hora} | {Apellido, Nombre} | [STATUS BADGE]           │ │ │
│ │ │ {hora} | {Apellido, Nombre} | [STATUS BADGE]           │ │ │
│ │ │ ...                                                     │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ [VER AGENDA →]                                          │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Turnero TV

```
┌─────────────────────────────────────────────────────────────────┐
│ FLOATING CONTROLS (auto-hide after 5s)                          │
│ [← VOLVER] [PANTALLA COMPLETA]                                  │
├─────────────────────────────────────────────────────────────────┤
│                     HEADER (centered)                           │
│                   "Turnero Digital"                             │
│         {weekday}, {day} de {month} de {year}                   │
│                                                                 │
│         [Next: HH:MM — {Apellido}, {Nombre} (C{N})]             │
├─────────────────────────────────────────────────────────────────┤
│ BANNER (when appointment is "en_atencion")                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                      [EN CURSO +N en cola]                  │ │
│ │ ┌──────────┬────────────────────────────────┬────────────┐  │ │
│ │ │ Consult. │      {Apellido}, {Nombre}      │    Hora    │  │ │
│ │ │   {N}    │         {Doctor Name}          │   HH:MM    │  │ │
│ │ └──────────┴────────────────────────────────┴────────────┘  │ │
│ │ [================ PROGRESS BAR (10s) =================]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ CALL HISTORY CARDS (grid, max 6)                                │
│ ┌───────────┬───────────┬───────────┐                          │
│ │ C{N}      │ C{N}      │ C{N}      │                          │
│ │ LLAMADO #1│ RELLAMADO │ LLAMADO #1│                          │
│ │ {Patient} │ {Patient} │ {Patient} │                          │
│ │ HH:MM     │ HH:MM     │ HH:MM     │                          │
│ └───────────┴───────────┴───────────┘                          │
├─────────────────────────────────────────────────────────────────┤
│ APPOINTMENTS TABLE                                              │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ HORA    │ PACIENTE           │ CONSULT. │ MÉDICO  │ ESTADO│   │
│ ├─────────┼────────────────────┼──────────┼─────────┼───────┤   │
│ │ ⚡09:00 │ {Apellido, Nombre} │ 1        │ Dr. X   │ [PEND]│   │
│ │ ⚡09:00 │ {Apellido, Nombre} │ 2        │ Dra. Y  │ [PEND]│   │
│ │ 09:30   │ {Apellido, Nombre} │ 1        │ Dr. X   │ [FIN] │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Legend: ⚡ = "Hora vigente" (next time slot with pending appts) │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Patient Form Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ DIALOG HEADER                                                   │
│ "{Nuevo Paciente | Editar Paciente}"                           │
├─────────────────────────────────────────────────────────────────┤
│ FORM FIELDS (2-column grid on desktop)                          │
│                                                                 │
│ ┌─────────────────────┬─────────────────────┐                   │
│ │ Nombre *            │ Apellido *          │                   │
│ │ [________________]  │ [________________]  │                   │
│ └─────────────────────┴─────────────────────┘                   │
│ ┌─────────────────────┬─────────────────────┐                   │
│ │ DNI *               │ Fec. Nac.           │                   │
│ │ [________________]  │ [__/__/____]        │                   │
│ └─────────────────────┴─────────────────────┘                   │
│ ┌─────────────────────┬─────────────────────┐                   │
│ │ Teléfono            │ Email               │                   │
│ │ [________________]  │ [________________]  │                   │
│ └─────────────────────┴─────────────────────┘                   │
│                                                                 │
│ Obra Social * (click para seleccionar)                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [OSDE] [Swiss Medical] [IAPS] [IPS] [PAMI] [Galeno]         │ │
│ │ [Particular] [+Otra...]                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Fecha de alta       │                                       │ │
│ │ [__/__/____]        │                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Notas                                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ [TEXTAREA - 4 rows]                                         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                        [CANCELAR] [CREAR]│
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. NAVIGATION & USER FLOWS

### 4.1 Main Navigation (Sidebar)

**Admin Menu Items:**
```
- Inicio → /inicio
- Médicos → /medicos
- Turnos → /turnos
- Pacientes → /pacientes
- Turnero → /turnero
- Configuración → /configuracion
```

**Doctor Menu Items:**
```
- Portal Médico → /doctor
- Mi Agenda → /doctor/agenda
- Mis Pacientes → /doctor/pacientes
```

### 4.2 Action-Triggered Navigation

| Trigger | Source | Destination | Type |
|---------|--------|-------------|------|
| Click "Ver agenda" | DoctorCard | `/agenda/{medicoId}` | Page navigation |
| Click doctor row | MedicosTable | `/medicos/{id}` | Page navigation |
| Click "Turnos Hoy" stat | Dashboard | `/turnos?range=hoy` | Page navigation with filter |
| Click "Finalizados" stat | Dashboard | `/turnos?range=hoy&estado=finalizado` | Page navigation with filter |
| Click "Nuevo Turno" | Dashboard | AppointmentModal | Modal open |
| Click appointment row | TurnosTable | AppointmentModal | Modal open with data |
| Click "Nuevo Paciente" | PacientesPanel | Dialog | Dialog open |
| Click patient edit | PacientesTable | Dialog | Dialog open with data |
| Click calendar event | AgendaCalendar | AppointmentModal | Modal open with data |
| Click "Volver" | Any page | Previous page or /inicio | Browser history |

### 4.3 Modal/Dialog Flows

**Appointment Creation Flow:**
```
1. User clicks "Nuevo Turno"
2. AppointmentModal opens (empty form)
3. User selects doctor → available slots load
4. User searches/selects patient OR creates new inline
5. User selects date and time slot
6. User optionally adds notes
7. User clicks "Crear"
8. API call executes
9. Success toast shown
10. Modal closes
11. Parent view refreshes
```

**Patient Creation Flow:**
```
1. User clicks "Nuevo Paciente"
2. Dialog opens (empty form)
3. User fills required fields (nombre, apellido, dni, obra_social)
4. User optionally fills additional fields
5. User clicks "Crear"
6. Validation runs (zod schema)
7. If valid: API call → success toast → dialog closes → table refreshes
8. If invalid: error messages shown inline
```

### 4.4 Edge Case Flows

**Appointment conflict:**
- Not currently enforced; multiple appointments can exist at same time/doctor

**Delete doctor with appointments:**
```
1. User clicks delete on doctor
2. System checks if doctor has appointments
3. If yes: Error toast "No se puede eliminar porque tiene turnos registrados. Podés desactivarlo."
4. If no: Confirmation dialog → delete → refresh
```

**Deactivate patient with pending appointments:**
- No automatic cascade; appointments remain with inactive patient

---

## 5. BUSINESS LOGIC

### 5.1 Appointment State Machine

```
                    ┌─────────────┐
                    │  pendiente  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌─────────────┐   ┌───────────┐
    │ cancelado│    │ en_atencion │   │ pospuesto │
    └──────────┘    └──────┬──────┘   └─────┬─────┘
                           │                │
                           │                │
                           ▼                │
                    ┌─────────────┐         │
                    │ finalizado  │         │
                    └─────────────┘         │
                           ▲                │
                           └────────────────┘
```

**Valid Transitions:**
| From | To | Trigger |
|------|----|---------|
| pendiente | en_atencion | "Llamar" / "Siguiente turno" |
| pendiente | cancelado | "Cancelar" |
| pendiente | pospuesto | "Posponer" |
| en_atencion | finalizado | "Finalizar" / "Siguiente turno" (previous) |
| en_atencion | pendiente | "Re-call" creates event but status stays |
| pospuesto | pendiente | Automatic when postpone period starts |
| pospuesto | en_atencion | "Llamar" |

### 5.2 "Siguiente Turno" Logic (Portal Médico)

```typescript
async siguienteTurno(medicoId: string) {
  1. Get today's date string
  2. Find current "en_atencion" appointment for this doctor today
  3. If exists:
     - Set status to "finalizado"
     - Set completed_at timestamp
  4. Find all "pendiente" appointments for this doctor today
  5. Sort by hora ascending
  6. Take first one as "siguiente"
  7. If siguiente exists:
     - Set status to "en_atencion"
     - Set started_at timestamp
     - Increment llamado_count
     - Create TurneroEvent with accion="CALL"
  8. Return { turnoFinalizado, turnoNuevo, evento }
}
```

### 5.3 "Hora Vigente" Logic

```typescript
// The "hora vigente" is the first time slot that has pending appointments
function getHoraVigente(appointments) {
  1. Sort appointments by hora ascending
  2. Find first appointment where estado is in ["pendiente", "en_atencion", "pospuesto"]
  3. Return normalized hora (HH:MM) or null
}

// Turnero highlights rows at hora vigente with amber background
// Shows ⚡ icon if 2+ appointments at hora vigente
```

### 5.4 Doctor Availability Logic

```typescript
// Days are coded as: L, Ma, Mi, J, V, S (null for Sunday)
const DAY_CODE_MAP = {
  0: null,  // Domingo
  1: "L",   // Lunes
  2: "Ma",  // Martes
  3: "Mi",  // Miércoles
  4: "J",   // Jueves
  5: "V",   // Viernes
  6: "S"    // Sábado
};

function isMedicoActivoEnFecha(medico, date) {
  if (!medico.activo) return false;
  const dayCode = DAY_CODE_MAP[date.getDay()];
  if (dayCode === null) return false;  // Sunday = no service
  const dias = medico.dias_disponibles || [];
  if (dias.length === 0) return true;  // No config = available L-S
  return dias.includes(dayCode);
}
```

### 5.5 Postpone Logic

```typescript
async posponerTurno(turnoId: string, minutos: number | 'final', motivo?: string) {
  1. Find appointment
  2. Reset status to "pendiente"
  3. Clear started_at
  4. Increment pospuesto_count
  5. If motivo provided, append to notas
  6. If minutos === 'final':
     - Find latest appointment for same doctor/date
     - Set new hora to latest hora + 5 minutes
  7. Else:
     - Add minutos to current hora
  8. Save and return updated appointment
}
```

### 5.6 Validation Rules

**Patient Form:**
```typescript
pacienteSchema = {
  nombre: string, required, min(1), max(100), trimmed
  apellido: string, required, min(1), max(100), trimmed
  dni: string, required, min(7), max(20), trimmed
  obra_social: string, required, min(1), max(100)
  telefono: string, optional, max(50)
  email: string, optional, email format, max(255)
  notas: string, optional, max(1000)
  fecha_nacimiento: date string, optional, >= "1900-01-01", <= today
  fecha_alta: date string, optional, >= "1900-01-01", <= today, >= fecha_nacimiento
}
```

**Doctor Form:**
```typescript
medicoSchema = {
  nombre: string, required, min(1), max(100)
  especialidad: string, required, min(1), max(100)
  consultorio: string, required, min(1), max(10)
  matricula: string, optional, max(50)
  telefono: string, optional, max(50)
  email: string, optional, email format, max(255)
  obras_sociales: string[], optional
  dias_disponibles: string[], optional
  activo: boolean, default true
}
```

**Appointment Form:**
```typescript
appointmentSchema = {
  medico_id: uuid, required
  paciente_id: uuid, required
  fecha: date string YYYY-MM-DD, required
  hora: time string HH:MM or HH:MM:SS, required
  obra_social: string, required
  notas: string, optional
}
```

### 5.7 Time Slot Generation

```typescript
function timeSlots(start = '09:00', end = '17:30', stepMin = 30) {
  const slots = [];
  let currentMinutes = parseTime(start);
  const endMinutes = parseTime(end);
  
  while (currentMinutes <= endMinutes) {
    slots.push(formatTime(currentMinutes));
    currentMinutes += stepMin;
  }
  return slots;
}

// Default: ["09:00", "09:30", "10:00", ..., "17:30"]
```

### 5.8 TurneroEvent TTL

```typescript
CALL_HISTORY_TTL_MS = 4 * 60 * 60 * 1000;  // 4 hours

function cleanupOldEvents() {
  // Remove events older than 4 hours
  events = events.filter(evt => 
    (Date.now() - new Date(evt.created_at).getTime()) < TTL
  );
}
```

---

## 6. DATA MODEL

### 6.1 Entity Definitions

#### Medico
```sql
CREATE TABLE medicos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  especialidad TEXT NOT NULL,
  consultorio  TEXT NOT NULL,
  matricula    TEXT DEFAULT '',
  telefono     TEXT,
  email        TEXT,
  obras_sociales TEXT[] DEFAULT '{}',
  dias_disponibles TEXT[] DEFAULT '{}',
  activo       BOOLEAN DEFAULT true,
  user_id      UUID,  -- Link to auth.users for portal access
  login_enabled BOOLEAN DEFAULT false,
  login_email  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

#### Paciente
```sql
CREATE TABLE pacientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  dni             TEXT NOT NULL,
  obra_social     TEXT NOT NULL,
  telefono        TEXT,
  email           TEXT,
  notas           TEXT,
  fecha_nacimiento DATE,
  fecha_alta      DATE,
  activo          BOOLEAN DEFAULT true,
  created_by      UUID,  -- Link to user who created
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### Turno (Appointment)
```sql
CREATE TABLE turnos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id        UUID NOT NULL REFERENCES medicos(id),
  paciente_id      UUID NOT NULL REFERENCES pacientes(id),
  fecha            DATE NOT NULL,
  hora             TIME NOT NULL,
  estado           estado_turno DEFAULT 'pendiente',
  obra_social      TEXT NOT NULL,
  consultorio_cache TEXT,  -- Denormalized from medico
  notas            TEXT,
  llamado_count    INTEGER DEFAULT 0,
  pospuesto_count  INTEGER DEFAULT 0,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Enum
CREATE TYPE estado_turno AS ENUM (
  'pendiente',
  'en_atencion', 
  'finalizado',
  'cancelado',
  'pospuesto'
);
```

#### TurneroEvent
```sql
CREATE TABLE turnero_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id        UUID REFERENCES turnos(id),
  medico_id       UUID REFERENCES medicos(id),
  accion          TEXT NOT NULL,  -- 'CALL' | 'RECALL'
  consultorio     TEXT,
  paciente_display TEXT,  -- "Apellido, Nombre (Obra Social)"
  llamado_nro     INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 6.2 TypeScript Types

```typescript
type Medico = {
  id: string;
  nombre: string;
  especialidad: string;
  consultorio: string;
  activo: boolean;
  matricula?: string;
  obras_sociales?: string[];
  dias_disponibles?: string[];
  telefono?: string;
  email?: string;
};

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  obra_social: string;
  telefono?: string;
  email?: string | null;
  notas?: string | null;
  activo: boolean;
  fecha_nacimiento?: string | null;  // "YYYY-MM-DD"
  fecha_alta?: string | null;        // "YYYY-MM-DD"
  created_at?: string;
};

type TurnoEstado = 'pendiente' | 'en_atencion' | 'finalizado' | 'cancelado' | 'pospuesto';

type Turno = {
  id: string;
  medico_id: string;
  paciente_id: string;
  fecha: string;          // "YYYY-MM-DD"
  hora: string;           // "HH:MM" or "HH:MM:SS"
  estado: TurnoEstado;
  obra_social: string;
  consultorio_cache?: string;
  notas?: string | null;
  llamado_count?: number;
  pospuesto_count?: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type TurneroEvent = {
  id: string;
  turno_id: string;
  medico_id: string;
  accion: 'CALL' | 'RECALL';
  consultorio?: string;
  paciente_display?: string;
  llamado_nro?: number;
  created_at: string;
};

// Enriched types for UI
type TurnoDetallado = Turno & {
  medico?: Medico;
  paciente?: Paciente;
};
```

### 6.3 Relationships

```
medicos 1 ──────< turnos >────── 1 pacientes
    │                │
    │                │
    └───< turnero_events >───┘
```

---

## 7. DATA MOCKS

### 7.1 Initial Seed Data

**Medicos (3 records):**
```json
[
  {
    "id": "uuid-1",
    "nombre": "Dr. Juan Romero",
    "especialidad": "Clínica",
    "consultorio": "1",
    "email": "dr.romero@demo.com",
    "activo": true,
    "obras_sociales": ["OSDE", "IPS"],
    "dias_disponibles": ["L", "Ma", "Mi", "J", "V"],
    "matricula": "MP 12345",
    "telefono": "+54 376 4 123456"
  },
  {
    "id": "uuid-2",
    "nombre": "Dra. Sofía Pérez",
    "especialidad": "Pediatría",
    "consultorio": "2",
    "email": "dra.perez@demo.com",
    "activo": true,
    "obras_sociales": ["PAMI", "Galeno"],
    "dias_disponibles": ["L", "Mi", "V"],
    "matricula": "MP 54321",
    "telefono": "+54 376 4 654321"
  },
  {
    "id": "uuid-3",
    "nombre": "Dr. Martín Díaz",
    "especialidad": "Traumatología",
    "consultorio": "3",
    "activo": true,
    "obras_sociales": ["Swiss Medical", "OSDE"],
    "dias_disponibles": ["Ma", "J", "S"],
    "matricula": "MP 98765"
  }
]
```

**Pacientes (220 records, generated):**
```json
{
  "id": "uuid",
  "nombre": "{random from: María, Juan, Carlos, Laura, ...}",
  "apellido": "{random from: García, Pérez, Rodríguez, ...}",
  "dni": "{random 30000000-50000000}",
  "telefono": "+54 9 376 4XXXXXX",
  "email": null,
  "obra_social": "{random from: OSDE, Swiss Medical, Galeno, IAPS, IPS, PAMI, Particular}",
  "activo": true,
  "fecha_nacimiento": "{random 1950-2010}-{MM}-{DD}",
  "fecha_alta": "{today}"
}
```

**Turnos (generated for Dec current year + Jan next year):**
- For each day except Sundays
- 8 random time slots per day per doctor
- Past appointments: 85% "finalizado", 15% "cancelado"
- Today's appointments: "pendiente"
- Future appointments: "pendiente"

### 7.2 Mock API Response Examples

**listMedicos():**
```json
{
  "data": [
    { "id": "...", "nombre": "Dr. Juan Romero", ... },
    { "id": "...", "nombre": "Dr. Martín Díaz", ... },
    { "id": "...", "nombre": "Dra. Sofía Pérez", ... }
  ]
}
```

**listTurnos({ fecha: "2026-01-09" }):**
```json
{
  "data": [
    {
      "id": "uuid",
      "fecha": "2026-01-09",
      "hora": "09:00",
      "estado": "pendiente",
      "obra_social": "OSDE",
      "medico": { "id": "...", "nombre": "Dr. Juan Romero", ... },
      "paciente": { "id": "...", "nombre": "María", "apellido": "García", ... }
    }
  ]
}
```

**getTurnosHoy(medicoId):**
```json
[
  {
    "id": "uuid",
    "hora": "09:00",
    "estado": "pendiente",
    "paciente": { "id": "...", "nombre": "María", "apellido": "García", "dni": "35123456" }
  },
  {
    "id": "uuid",
    "hora": "09:30",
    "estado": "en_atencion",
    "paciente": { "id": "...", "nombre": "Juan", "apellido": "Pérez", "dni": "32456789" }
  }
]
```

---

## 8. DATA FLOW & CONNECTIONS

### 8.1 Read Operations by Screen

| Screen | Data Consumed | Query Key |
|--------|---------------|-----------|
| Dashboard | medicos (active), turnos (today) | `["doctors", filters]` |
| MedicosPanel | medicos (all) | `["medicos", filters]` |
| TurnosPanel | turnos (filtered), medicos, obras_sociales | `["turnos", filters]` |
| PacientesPanel | pacientes (filtered) | `["pacientes", search, filter]` |
| Turnero | turnos (today), turnero_events | `["turnero"]` |
| DoctorAgenda | turnos (by doctor), medicos | `["appointments", medicoId]` |
| DoctorPacientes | pacientes (via turnos) | `["pacientes"]` + client-side filter |

### 8.2 Write Operations

| Action | Mutation | Invalidates |
|--------|----------|-------------|
| Create appointment | `mock.createTurno()` | `["turnos"]`, `["doctors"]` |
| Update appointment | `mock.updateTurno()` | `["turnos"]`, `["doctors"]` |
| Delete appointment | `mock.deleteTurno()` | `["turnos"]`, `["doctors"]` |
| Create patient | `mock.upsertPaciente()` | `["pacientes"]` |
| Update patient | `mock.upsertPaciente()` | `["pacientes"]` |
| Toggle patient | `mock.togglePaciente()` | `["pacientes"]`, `["turnos"]` |
| Create doctor | `mock.upsertMedico()` | `["medicos"]` |
| Update doctor | `mock.upsertMedico()` | `["medicos"]` |
| Toggle doctor | `mock.toggleMedico()` | `["medicos"]`, `["turnos"]` |
| Next appointment | `mock.siguienteTurno()` | `["turnos"]`, `["turnero"]` |
| Re-call | `mock.rellamarTurno()` | `["turnero"]` |
| Postpone | `mock.posponerTurno()` | `["turnos"]`, `["turnero"]` |

### 8.3 Realtime/Polling

| Source | Interval | Purpose |
|--------|----------|---------|
| Turnero | 60s | Full page reload |
| TurnosPanel | 10s | `refetchInterval` on query |
| TurneroEvents | 10s | `refetchInterval` on query |

### 8.4 Data Dependency Graph

```
Configuracion.obrasSociales
        ↓
ObrasSocialesSelector (patient/doctor forms)
        ↓
Paciente.obra_social ←──── Turno.obra_social
        ↓                         ↑
Patient forms               (copied on create)
```

---

## 9. ROLES & PERMISSIONS

### 9.1 Permission Matrix

| Resource | Action | admin_general | supervisor | doctor | public |
|----------|--------|---------------|------------|--------|--------|
| Medicos | Create | ✅ | ❌ | ❌ | ❌ |
| Medicos | Read | ✅ | ✅ | ✅ (self) | ❌ |
| Medicos | Update | ✅ | ✅ | ❌ | ❌ |
| Medicos | Delete | ✅ | ❌ | ❌ | ❌ |
| Pacientes | Create | ✅ | ✅ | ✅ | ❌ |
| Pacientes | Read | ✅ | ✅ | ✅ (own) | ❌ |
| Pacientes | Update | ✅ | ✅ | ✅ | ❌ |
| Pacientes | Delete | ✅ | ❌ | ❌ | ❌ |
| Turnos | Create | ✅ | ✅ | ✅ (self) | ❌ |
| Turnos | Read | ✅ | ✅ | ✅ (own) | ✅ (today) |
| Turnos | Update | ✅ | ✅ | ✅ (own) | ❌ |
| Turnos | Delete | ✅ | ❌ | ❌ | ❌ |
| Configuracion | All | ✅ | ❌ | ❌ | ❌ |
| Turnero | View | ✅ | ✅ | ✅ | ✅ |
| Turnero | Control | ✅ | ✅ | ✅ | ❌ (needs key) |

### 9.2 Route-Based Access (RoleGate logic)

```typescript
// On "/" or "/login":
if (role === 'doctor') navigate('/doctor');
else navigate('/inicio');

// On /doctor/*:
if (role !== 'doctor') navigate('/');

// On admin routes (/inicio, /medicos, /turnos, /pacientes, /configuracion, /turnero):
if (role === 'doctor') navigate('/doctor');
```

### 9.3 Edge Cases

- **Doctor without user_id:** Cannot log into portal
- **Multiple doctors per user:** Not supported; one-to-one relationship
- **Turnero without auth key:** View-only, no action overlay
- **Supervisor role:** Currently treated same as admin for most operations

---

## 10. ERROR HANDLING & STATES

### 10.1 Data States

| State | Condition | Behavior |
|-------|-----------|----------|
| Loading | `isLoading === true` | Show skeleton/spinner |
| Empty | Data array length === 0 | Show EmptyState component |
| Error | Query error | Toast error message |
| Populated | Data exists | Render normal UI |

### 10.2 Form Validation Errors

```typescript
// Displayed inline below each field
{form.formState.errors.fieldName && (
  <p className="text-sm text-destructive mt-1">
    {form.formState.errors.fieldName.message}
  </p>
)}
```

### 10.3 API Error Handling

```typescript
// Mutations use onError callback
onError: (error: Error) => {
  toast.error("Error message: " + error.message);
}
```

### 10.4 Specific Error Messages

| Scenario | Message |
|----------|---------|
| Delete doctor with appointments | "No se puede eliminar porque tiene turnos registrados. Podés desactivarlo." |
| Invalid form data | Field-specific validation messages from zod |
| API failure | "Error al [acción]: [error.message]" |
| Empty search results | "No hay [entidad] que coincidan con los filtros" |
| Sunday selected | "Los domingos el centro permanece cerrado" |
| No doctors available | "No hay médicos disponibles para hoy" |

### 10.5 Confirmation Dialogs

Used for destructive actions:
- Delete patient
- Toggle patient active/inactive
- Clear turnero history
- Reset demo data

---

## 11. NON-NEGOTIABLE ASSUMPTIONS & CONSTRAINTS

### 11.1 Technical Constraints

1. **Single-tenant:** System designed for one clinical center
2. **No real-time websockets:** Uses polling (10-60s intervals)
3. **localStorage-based in demo:** No persistence across browsers
4. **No authentication in demo mode:** APP_MODE='mock' bypasses auth
5. **Client-side filtering:** All filtering done in browser
6. **Spanish language only:** All UI text in Spanish
7. **Timezone agnostic:** Dates stored as strings, no timezone handling

### 11.2 Business Constraints

1. **No double-booking prevention:** Multiple appointments at same time allowed
2. **No appointment duration:** All appointments are single slot
3. **No recurring appointments:** Each appointment is individual
4. **No payment/billing integration:** Out of scope
5. **No patient portal:** Patients cannot self-schedule
6. **One health insurance per patient:** Not supporting multiple

### 11.3 Data Constraints

1. **Patient.obra_social:** Must match from configured list (or "Particular")
2. **Doctor.dias_disponibles:** Must use codes: L, Ma, Mi, J, V, S
3. **Turno.hora:** Must be within configured operating hours
4. **Turnero events TTL:** 4 hours, auto-cleaned

### 11.4 Forbidden Operations

1. **Never delete patient with appointments** (soft-delete only)
2. **Never delete doctor with appointments** (must deactivate)
3. **Never edit Supabase auto-generated files** (types.ts, client.ts)
4. **Never store private API keys in code** (use secrets)
5. **Never allow anonymous signups** (standard auth only)

---

## 12. APPENDIX

### 12.1 File Structure

```
src/
├── App.tsx                 # Routes configuration
├── main.tsx                # Entry point
├── index.css               # Global styles & CSS variables
├── config/
│   └── appMode.ts          # APP_MODE constant
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # RoleGate
│   ├── filters/            # Filter system components
│   ├── AppSidebar.tsx      # Navigation sidebar
│   ├── AppointmentModal.tsx
│   ├── StatusBadge.tsx
│   ├── TurnosTable.tsx
│   ├── DoctorCard.tsx
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── useDoctors.ts
│   ├── useMedicosManagement.ts
│   ├── usePacientesManagement.ts
│   ├── useTurnosManagement.ts
│   ├── useTurneroRealtime.ts
│   ├── useTurneroSettings.ts
│   └── useAppSettings.ts
├── lib/
│   ├── utils.ts            # cn() utility
│   ├── date-utils.ts       # Date formatting
│   ├── turnos-utils.ts     # Appointment utilities
│   └── agenda-utils.ts     # Doctor availability
├── mock/
│   ├── db.ts               # Mock data structures
│   └── api.ts              # Mock API functions
└── pages/
    ├── Dashboard.tsx
    ├── Medicos.tsx
    ├── Turnos.tsx
    ├── Pacientes.tsx
    ├── Turnero.tsx
    ├── Configuracion.tsx
    └── doctor/
        ├── DoctorHome.tsx
        ├── DoctorAgenda.tsx
        └── DoctorPacientes.tsx
```

### 12.2 Key Settings (localStorage)

**turnero_mock_v1:** Main mock data store
```json
{
  "medicos": [...],
  "pacientes": [...],
  "turnos": [...],
  "turnero_events": [...]
}
```

**turnero_settings:** Turnero preferences
```json
{
  "dingEnabled": true,
  "highContrastEnabled": false
}
```

**app_settings:** Application configuration
```json
{
  "horarioInicio": "09:00",
  "horarioFin": "17:30",
  "slotDuracion": 30,
  "obrasSociales": ["OSDE", "Swiss Medical", "IAPS", "IPS", "PAMI", "Galeno", "Particular"]
}
```

### 12.3 Status Badge Configuration

```typescript
const statusConfig = {
  pendiente: {
    label: "Pendiente",
    className: "bg-warning/10 text-warning border-warning/30"
  },
  en_atencion: {
    label: "En curso",
    className: "bg-in-progress text-white border-in-progress font-semibold"
  },
  finalizado: {
    label: "Finalizado",
    className: "bg-completed/10 text-completed border-completed/30"
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-cancelled/10 text-cancelled border-cancelled/30"
  },
  pospuesto: {
    label: "Pospuesto",
    className: "bg-muted/50 text-muted-foreground border-muted"
  }
};
```

---

**END OF SPECIFICATION**
