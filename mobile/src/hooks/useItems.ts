import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../services/api/items';
import { Item, ItemStatus } from '../types/item';

export const useItems = (params?: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  status?: ItemStatus;
  storageLocationId?: string;
  sortBy?: 'newest' | 'oldest' | 'highest_price' | 'lowest_price';
}) => {
  return useQuery({
    queryKey: ['items', params],
    queryFn: async () => {
      const res = await itemsApi.listItems(params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    },
  });
};

export const useItem = (id: string) => {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await itemsApi.getItem(id);
      if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        return res.data;
      }
      return res;
    },
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Item>) => itemsApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) => itemsApi.updateItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.id] });
    },
  });
};

export const useArchiveItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.archiveItem(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', variables] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useUpdatePreparation = (itemId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: 'UNPREPARED' | 'PREPARED' | 'READY_TO_LIST') =>
      itemsApi.updatePreparation(itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', itemId, 'history'] });
    },
  });
};

