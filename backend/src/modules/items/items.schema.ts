import { z } from 'zod';
import { ItemStatus } from '@prisma/client';

export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  condition: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  sku: z.string().optional(),
  purchasePrice: z.number().int().min(0, 'Purchase price cannot be negative').optional(),
  purchaseDate: z.string().datetime().optional(), // ISO string
  storageLocationId: z.string().uuid().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const changeItemStatusSchema = z.object({
  status: z.nativeEnum(ItemStatus),
});

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  storageLocationId: z.string().uuid().optional(),
  sortBy: z.enum(['newest', 'oldest', 'highest_price', 'lowest_price']).default('newest'),
});

export const updateItemPreparationSchema = z.object({
  status: z.enum(['UNPREPARED', 'PREPARED', 'READY_TO_LIST']),
});

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type ChangeItemStatusDto = z.infer<typeof changeItemStatusSchema>;
export type ListItemsQueryDto = z.infer<typeof listItemsQuerySchema>;
export type UpdateItemPreparationDto = z.infer<typeof updateItemPreparationSchema>;
