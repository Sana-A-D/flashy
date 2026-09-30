import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';

export function useSale(itemId: string) {
  return useQuery({
    queryKey: ['sale', itemId],
    queryFn: async () => {
      try {
        const data = await apiClient.fetch(`/items/${itemId}/sale`);
        return data;
      } catch (err: any) {
        if (err.status === 404 || err.message === 'No sale record found') {
          return null;
        }
        throw err;
      }
    },
    enabled: !!itemId,
  });
}

export function useRecordSale(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      salePrice: number;
      marketplaceFees?: number;
      shippingCost?: number;
      otherExpenses?: number;
      soldAt?: string;
      marketplaceListingId?: string | null;
    }) => {
      const data = await apiClient.fetch(`/items/${itemId}/sale`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['analytics_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics_sales_history'] });
      queryClient.invalidateQueries({ queryKey: ['item_marketplaces', itemId] });
      queryClient.invalidateQueries({ queryKey: ['delisting', itemId] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}
