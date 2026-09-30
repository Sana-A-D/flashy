import { apiClient } from './client';
import { SubscriptionResponse, SubscriptionTier } from '../../types/subscription';

export const billingApi = {
  getSubscription: async (): Promise<SubscriptionResponse> => {
    const res = await apiClient.fetch('/billing/subscription');
    return res.data;
  },

  upgradePlan: async (tier: SubscriptionTier): Promise<any> => {
    return apiClient.fetch('/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  },

  cancelSubscription: async (): Promise<any> => {
    return apiClient.fetch('/billing/cancel', {
      method: 'POST',
    });
  },
};
