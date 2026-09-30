import { z } from 'zod';

export const ListingDraftSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.any()).nullable().optional(),
  keywords: z.array(z.string()).optional(),
  price: z.number().int().nonnegative().nullable().optional(),
});

export type GeneratedListingDraft = z.infer<typeof ListingDraftSchema>;
