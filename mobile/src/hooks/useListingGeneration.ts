import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';

export interface ListingDraft {
  id: string;
  itemId: string;
  status: 'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  title: string | null;
  description: string | null;
  category: string | null;
  brand: string | null;
  condition: string | null;
  color: string | null;
  size: string | null;
  price: number | null;
  attributes: Record<string, any> | null;
  keywords: string[];
}

export function useListingGeneration(itemId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['listing-draft', itemId],
    queryFn: async () => {
      const response = await apiClient.fetch(`/items/${itemId}/listing-generation`, { method: 'GET' });
      return (response.data || response) as ListingDraft;
    },
    refetchInterval: (query) => {
      // Poll every 2 seconds if generating
      const status = query.state.data?.status;
      if (status === 'PENDING' || status === 'PROCESSING') {
        return 2000;
      }
      return false;
    },
    retry: false, // Don't retry if it returns 404 (no draft yet)
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.fetch(`/items/${itemId}/listing-generation`, { method: 'POST' });
      return (response.data || response) as ListingDraft;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['listing-draft', itemId], data);
    },
  });

  return {
    draft: query.data,
    isLoading: query.isLoading,
    isGenerating: mutation.isPending || query.data?.status === 'PENDING' || query.data?.status === 'PROCESSING',
    error: query.error || mutation.error,
    startGeneration: () => mutation.mutate(),
    status: query.data?.status || 'NONE',
  };
}

export function useUpdateListingDraft(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ListingDraft>) => {
      const response = await apiClient.fetch(`/items/${itemId}/listing-generation`, { 
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return (response.data || response) as ListingDraft;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['listing-draft', itemId], data);
    },
  });
}
