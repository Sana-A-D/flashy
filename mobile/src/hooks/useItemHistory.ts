import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';

export interface ItemEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  details?: any;
}

export function useItemHistory(itemId: string | undefined) {
  return useQuery({
    queryKey: ['items', itemId, 'history'],
    queryFn: async (): Promise<ItemEvent[]> => {
      const response = await apiClient.fetch(`/items/${itemId}/history`);
      return response;
    },
    enabled: !!itemId,
  });
}
