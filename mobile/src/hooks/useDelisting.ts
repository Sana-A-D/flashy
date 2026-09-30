import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';
import { Alert } from 'react-native';

export interface DelistingStatusResponse {
  marketplaceId: string;
  marketplaceName: string;
  marketplaceType: string;
  status: string;
  listingUrl?: string;
}

export interface DelistingResult {
  marketplace: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'MANUAL_REQUIRED';
  error?: string;
  requiresManualAction?: boolean;
  listingUrl?: string;
}

export function useDelistingStatus(itemId: string) {
  return useQuery({
    queryKey: ['delisting', itemId],
    queryFn: async () => {
      const data = await apiClient.fetch(`/items/${itemId}/delisting`);
      return data.listings as DelistingStatusResponse[];
    },
    enabled: !!itemId,
  });
}

export function useDelistItem(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await apiClient.fetch(`/items/${itemId}/delisting`, {
        method: 'POST'
      });
      return data.results as DelistingResult[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delisting', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
    onError: (error: any) => {
      const msg = error.message || 'Unknown error occurred during delisting';
      Alert.alert('Delisting Error', msg);
    }
  });
}
