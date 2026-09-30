import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageLocationsApi } from '../services/api/storageLocations';
import { StorageLocation } from '../types/storageLocation';

export const useStorageLocations = () => {
  return useQuery({
    queryKey: ['storageLocations'],
    queryFn: async (): Promise<StorageLocation[]> => {
      const response = await storageLocationsApi.listStorageLocations();
      return response;
    },
  });
};

export const useCreateStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StorageLocation>) => storageLocationsApi.createStorageLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
    },
  });
};

export const useUpdateStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StorageLocation> }) => 
      storageLocationsApi.updateStorageLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
    },
  });
};

export const useDeleteStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storageLocationsApi.deleteStorageLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
    },
  });
};

