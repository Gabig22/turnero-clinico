import { z } from 'zod'

const optionalEmail = z
  .string()
  .trim()
  .email('Ingresá un email válido')
  .max(255, 'El email es demasiado largo')
  .optional()
  .or(z.literal(''))

export const pacienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
  dni: z.string().trim().min(7, 'El DNI debe tener al menos 7 caracteres').max(20),
  obra_social: z.string().trim().min(1, 'La obra social es obligatoria').max(100),
  telefono: z.string().trim().max(50).optional(),
  email: optionalEmail,
  notas: z.string().trim().max(1000).optional(),
  fecha_nacimiento: z.string().optional(),
  fecha_alta: z.string().optional(),
})

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
  hora: z.string().trim().min(1, 'La hora es obligatoria'),
  obra_social: z.string().trim().min(1, 'La obra social es obligatoria'),
  notas: z.string().trim().max(1000).optional(),
})

export type PacienteFormValues = z.infer<typeof pacienteSchema>
export type MedicoFormValues = z.infer<typeof medicoSchema>
export type TurnoFormValues = z.infer<typeof turnoSchema>
