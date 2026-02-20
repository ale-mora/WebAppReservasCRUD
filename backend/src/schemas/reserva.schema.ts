import { z } from 'zod';

export const ReservaCreateSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  fecha: z.string().min(1),
  hora: z.string().min(1),
  servicio: z.string().min(1),
  notas: z.string().optional(),
});

export const ReservaUpdateSchema = ReservaCreateSchema.partial();
