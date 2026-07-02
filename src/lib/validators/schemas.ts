import { z } from 'zod'

const optionalEmail = z
  .string()
  .trim()
  .email('Ingresá un email válido')
  .max(255, 'El email es demasiado largo')
  .optional()
  .or(z.literal(''))

const optionalDate = z.string().optional().or(z.literal(''))
const today = () => new Date().toISOString().slice(0, 10)
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

function isFutureDate(value?: string) {
  return Boolean(value && value > today())
}

export const pacienteSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
    apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
    dni: z.string().trim().min(7, 'El DNI debe tener al menos 7 caracteres').max(20),
    obra_social: z.string().trim().min(1, 'La obra social es obligatoria').max(100),
    telefono: z.string().trim().max(50).optional(),
    email: optionalEmail,
    notas: z.string().trim().max(1000).optional(),
    fecha_nacimiento: optionalDate,
    fecha_alta: optionalDate,
    activo: z.boolean().default(true),
  })
  .refine((data) => !isFutureDate(data.fecha_nacimiento), {
    message: 'La fecha de nacimiento no puede ser futura',
    path: ['fecha_nacimiento'],
  })
  .refine((data) => !isFutureDate(data.fecha_alta), {
    message: 'La fecha de alta no puede ser futura',
    path: ['fecha_alta'],
  })
  .refine(
    (data) =>
      !data.fecha_nacimiento ||
      !data.fecha_alta ||
      data.fecha_alta >= data.fecha_nacimiento,
    {
      message: 'La fecha de alta no puede ser anterior al nacimiento',
      path: ['fecha_alta'],
    },
  )

export const medicoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  especialidad: z.string().trim().min(1, 'La especialidad es obligatoria').max(100),
  consultorio: z.string().trim().min(1, 'El consultorio es obligatorio').max(10),
  matricula: z.string().trim().max(50).optional(),
  telefono: z.string().trim().max(50).optional(),
  email: optionalEmail,
  obras_sociales: z.array(z.string()).optional(),
  dias_disponibles: z.array(z.string()).optional(),
  activo: z.boolean().default(true),
})

export const turnoSchema = z.object({
  medico_id: z.string().trim().min(1, 'Seleccioná un médico'),
  paciente_id: z.string().trim().min(1, 'Seleccioná un paciente'),
  fecha: z.string().trim().min(1, 'La fecha es obligatoria'),
  hora: z
    .string()
    .trim()
    .regex(timePattern, 'La hora debe tener formato HH:mm'),
  obra_social: z.string().trim().min(1, 'La obra social es obligatoria'),
  estado: z
    .enum(['pendiente', 'en_atencion', 'finalizado', 'cancelado', 'pospuesto'])
    .optional(),
  notas: z.string().trim().max(1000).optional(),
})

export const appSettingsSchema = z
  .object({
    horarioInicio: z
      .string()
      .trim()
      .min(1, 'El horario de inicio es obligatorio')
      .regex(timePattern, 'Usá formato HH:mm'),
    horarioFin: z
      .string()
      .trim()
      .min(1, 'El horario de fin es obligatorio')
      .regex(timePattern, 'Usá formato HH:mm'),
    slotDuracion: z.preprocess(
      (value) => Number(value),
      z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(40)], {
        message: 'Seleccioná una duración válida',
      }),
    ),
    obrasSociales: z.array(z.string().trim().min(1)).default([]),
  })
  .refine((data) => data.horarioInicio < data.horarioFin, {
    message: 'El horario de inicio debe ser menor al horario de fin',
    path: ['horarioFin'],
  })

export const turneroSettingsSchema = z.object({
  dingEnabled: z.boolean(),
  highContrastEnabled: z.boolean(),
})

export type PacienteFormValues = z.infer<typeof pacienteSchema>
export type MedicoFormValues = z.infer<typeof medicoSchema>
export type TurnoFormValues = z.infer<typeof turnoSchema>
export type AppSettingsFormValues = z.infer<typeof appSettingsSchema>
export type TurneroSettingsFormValues = z.infer<typeof turneroSettingsSchema>
