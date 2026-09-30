import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api/admin';
import { AdminStats, AdminUsersResponse, UserRole, SubscriptionTier } from '../types/admin';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async (): Promise<AdminStats> => {
      return adminApi.getStats();
    },
  });
};

export const useAdminUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
}) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: async (): Promise<AdminUsersResponse> => {
      return adminApi.listUsers(params);
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: SubscriptionTier }) =>
      adminApi.updateUserSubscription(userId, tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};
