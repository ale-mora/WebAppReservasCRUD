import { z } from 'zod';

export const ReservaCreateSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.email(),
  country: z.string().optional().nullable(),
  dealname: z.string().min(1),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
});

// Update de DEAL (reservas): solo campos del deal
export const ReservaUpdateSchema = z.object({
  dealname: z.string().min(1).optional(),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
});
