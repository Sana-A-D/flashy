import { apiClient } from './client';
import { AdminStats, AdminUsersResponse, UserRole, SubscriptionTier } from '../../types/admin';

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.fetch('/admin/stats');
    return res.data;
  },

  listUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    subscriptionTier?: SubscriptionTier;
  }): Promise<AdminUsersResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.subscriptionTier) query.append('subscriptionTier', params.subscriptionTier);

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    const res = await apiClient.fetch(endpoint);
    return res.data;
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    return apiClient.fetch(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  updateUserSubscription: async (userId: string, tier: SubscriptionTier) => {
    return apiClient.fetch(`/admin/users/${userId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    });
  },
};
