import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';

export interface PricingResearch {
  id: string;
  itemId: string;
  status: 'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recommendedPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  originalRetailPrice?: number | null;
  resaleMedian?: number | null;
  sampleSize?: number;
  sources?: string[];
  soldPriceStatus?: 'AVAILABLE' | 'UNAVAILABLE';
  researchedAt?: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  currency: string;
  source: 'MARKET_COMPS' | 'USER_HISTORY' | 'ESTIMATE' | 'MANUAL';
  factors: string[];
}

export function usePricingResearch(itemId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pricing', itemId],
    queryFn: async () => {
      const response = await apiClient.fetch(`/items/${itemId}/pricing`, { method: 'GET' });
      return (response.data || response) as PricingResearch;
    },
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.fetch(`/items/${itemId}/pricing/research`, { method: 'POST' });
      return (response.data || response) as PricingResearch;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['pricing', itemId], data);
    },
  });

  return {
    research: query.data,
    isLoading: query.isLoading,
    isResearching: mutation.isPending,
    error: query.error || mutation.error,
    startResearch: () => mutation.mutate(),
  };
}
