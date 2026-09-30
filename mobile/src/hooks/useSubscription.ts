import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../services/api/billing';
import { SubscriptionResponse, SubscriptionTier } from '../types/subscription';

export const useSubscription = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionResponse> => {
      return billingApi.getSubscription();
    },
  });
};

export const useUpgradePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tier: SubscriptionTier) => billingApi.upgradePlan(tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
};
