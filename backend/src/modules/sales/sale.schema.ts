import { z } from 'zod';

export const recordSaleSchema = z.object({
  salePrice: z.number().int().min(0),
  marketplaceFees: z.number().int().min(0).optional().default(0),
  shippingCost: z.number().int().min(0).optional().default(0),
  otherExpenses: z.number().int().min(0).optional().default(0),
  soldAt: z.string().datetime().optional(),
  marketplaceListingId: z.string().uuid().optional().nullable(),
});

export type RecordSaleInput = z.infer<typeof recordSaleSchema>;
