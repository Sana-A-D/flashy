import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional(),
});

export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

export const updateUserSubscriptionSchema = z.object({
  tier: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
});

export type UpdateUserSubscriptionDto = z.infer<typeof updateUserSubscriptionSchema>;

export interface AdminSystemStats {
  totalUsers: number;
  totalItems: number;
  totalSales: number;
  totalRevenueCents: number;
  totalMarketplaceListings: number;
  subscriptionsByTier: Record<string, number>;
  itemsByStatus: Record<string, number>;
  recentActivity: Array<{
    type: 'USER_REGISTERED' | 'ITEM_CREATED' | 'SALE_RECORDED' | 'SUBSCRIPTION_UPGRADED';
    description: string;
    timestamp: Date;
  }>;
}
