import { z } from 'zod';

export const createStorageLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

export const updateStorageLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
});

export type CreateStorageLocationDto = z.infer<typeof createStorageLocationSchema>;
export type UpdateStorageLocationDto = z.infer<typeof updateStorageLocationSchema>;
