import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fashionApi } from '../services/api/fashion';
import { FashionItem, UpdateFashionItemPayload } from '../types/fashion';

export const fashionKeys = {
  all: ['fashion'] as const,
  lists: () => [...fashionKeys.all, 'list'] as const,
  list: (filter: string) => [...fashionKeys.lists(), filter] as const,
  details: () => [...fashionKeys.all, 'detail'] as const,
  detail: (id: string) => [...fashionKeys.details(), id] as const,
};

export function useFashionItems(filter: 'SAVED' | 'RECENT' | 'ALL' = 'ALL') {
  return useQuery({
    queryKey: fashionKeys.list(filter),
    queryFn: () => fashionApi.listItems(filter),
  });
}

export function useFashionItem(id: string | undefined) {
  return useQuery({
    queryKey: fashionKeys.detail(id || ''),
    queryFn: () => fashionApi.getItem(id!),
    enabled: Boolean(id),
  });
}

export function useCreateFashionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { title?: string }) => fashionApi.createItem(data),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData(fashionKeys.detail(newItem.id), newItem);
    },
  });
}

export function useAnalyzeFashionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fashionApi.analyzeItem(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData(fashionKeys.detail(updated.id), updated);
    },
  });
}

export function useResearchFashionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fashionApi.researchItem(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData(fashionKeys.detail(updated.id), updated);
    },
  });
}

export function useUpdateFashionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFashionItemPayload }) =>
      fashionApi.updateItem(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData(fashionKeys.detail(updated.id), updated);
    },
  });
}

export function useToggleSaveFashionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }) => fashionApi.toggleSave(id, save),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData(fashionKeys.detail(updated.id), updated);
    },
  });
}

export function useDeleteFashionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fashionApi.deleteItem(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: fashionKeys.all });
      const previousLists = queryClient.getQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData<FashionItem[]>(fashionKeys.list('RECENT'), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
      queryClient.setQueryData<FashionItem[]>(fashionKeys.list('SAVED'), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
      queryClient.setQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
      return { previousLists };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<FashionItem[]>(fashionKeys.list('RECENT'), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
      queryClient.setQueryData<FashionItem[]>(fashionKeys.list('SAVED'), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
      queryClient.setQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
      queryClient.removeQueries({ queryKey: fashionKeys.detail(id) });
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.list('RECENT') });
      queryClient.invalidateQueries({ queryKey: fashionKeys.list('SAVED') });
      queryClient.invalidateQueries({ queryKey: fashionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fashionKeys.all });
      if (id) {
        queryClient.removeQueries({ queryKey: fashionKeys.detail(id) });
      }
    },
  });
}

export function useBatchDeleteFashionItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => fashionApi.batchDeleteItems(ids),
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: fashionKeys.all });
      const previousLists = queryClient.getQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() });
      const idSet = new Set(ids);
      queryClient.setQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => !idSet.has(item.id));
      });
      return { previousLists };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSuccess: (_data, ids) => {
      const idSet = new Set(ids);
      queryClient.setQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => !idSet.has(item.id));
      });
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: fashionKeys.detail(id) });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.all });
    },
  });
}

export function useClearHistoryFashionItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fashionApi.clearHistory(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: fashionKeys.all });
      const previousLists = queryClient.getQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() });
      queryClient.setQueryData<FashionItem[]>(fashionKeys.list('RECENT'), []);
      queryClient.setQueriesData<FashionItem[]>({ queryKey: fashionKeys.lists() }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.saved);
      });
      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fashionKeys.all });
    },
  });
}


