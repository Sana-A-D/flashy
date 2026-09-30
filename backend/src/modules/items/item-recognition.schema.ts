import { z } from 'zod';

export const AIStructuredAttributesSchema = z.object({
  category: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  secondaryColors: z.array(z.string()).default([]),
  material: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  conditionClues: z.array(z.string()).default([]),
  visibleFeatures: z.array(z.string()).default([]),
  distinctiveFeatures: z.array(z.string()).default([]),
  modelNumber: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  upc: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateItemRecognitionSchema = z.object({
  params: z.object({
    itemId: z.string().uuid(),
  }),
  body: z.object({
    category: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    productName: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    material: z.string().nullable().optional(),
    style: z.string().nullable().optional(),
    audience: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    pattern: z.string().nullable().optional(),
    modelNumber: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    upc: z.string().nullable().optional(),
  }),
});

export type AIStructuredAttributes = z.infer<typeof AIStructuredAttributesSchema>;
