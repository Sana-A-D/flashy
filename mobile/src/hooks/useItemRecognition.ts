import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemRecognitionApi, ItemRecognition } from '../services/api/itemRecognition';

export const useItemRecognition = (itemId: string) => {
  return useQuery({
    queryKey: ['item-recognition', itemId],
    queryFn: () => itemRecognitionApi.getRecognition(itemId),
    refetchInterval: (query) => {
      // Poll every 2 seconds if processing or pending
      const status = query.state?.data?.status;
      if (status === 'PENDING' || status === 'PROCESSING') {
        return 2000;
      }
      return false;
    },
  });
};

export const useStartItemRecognition = (itemId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => itemRecognitionApi.startRecognition(itemId),
    onSuccess: (data) => {
      queryClient.setQueryData(['item-recognition', itemId], data);
    },
  });
};

export const useUpdateItemRecognition = (itemId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ItemRecognition>) => itemRecognitionApi.updateRecognition(itemId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['item-recognition', itemId], data);
      // Also invalidate item query if we want to sync data back to main item eventually
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
  });
};
