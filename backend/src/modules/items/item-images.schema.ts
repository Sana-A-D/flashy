import { z } from 'zod';

export const requestUploadSchema = z.object({
  mimeType: z.string().refine((val) => ['image/jpeg', 'image/png', 'image/webp'].includes(val), {
    message: "Invalid mime type. Must be image/jpeg, image/png, or image/webp",
  }),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  originalFilename: z.string().optional(),
});

export type RequestUploadDto = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z.object({
  storageKey: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  originalFilename: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ConfirmUploadDto = z.infer<typeof confirmUploadSchema>;

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string()),
});

export type ReorderImagesDto = z.infer<typeof reorderImagesSchema>;

export const directUploadSchema = z.object({
  base64Data: z.string().min(1, 'base64Data is required'),
  mimeType: z.string().default('image/jpeg'),
  originalFilename: z.string().optional(),
});

export type DirectUploadDto = z.infer<typeof directUploadSchema>;


