export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  subscription: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
  } | null;
  _count: {
    items: number;
    marketplaceAccounts: number;
  };
}

export interface AdminStats {
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
    timestamp: string;
  }>;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
