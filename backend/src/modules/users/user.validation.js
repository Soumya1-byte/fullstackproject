import { z } from 'zod';

export const requestAdminAccessSchema = z.object({
  message: z.string().trim().max(500).optional().default('')
});

export const reviewAdminAccessSchema = z.object({
  decision: z.enum(['APPROVED', 'DENIED']),
  note: z.string().trim().max(500).optional().default('')
});
