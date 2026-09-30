import { z } from 'zod';

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    message: 'Please type DELETE to confirm permanent account deletion',
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
