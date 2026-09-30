import { apiClient } from './client';
import { StorageLocation } from '../../types/storageLocation';

export const storageLocationsApi = {
  listStorageLocations: () => {
    return apiClient.fetch('/storage-locations');
  },
  
  createStorageLocation: (data: Partial<StorageLocation>) => {
    return apiClient.fetch('/storage-locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateStorageLocation: (id: string, data: Partial<StorageLocation>) => {
    return apiClient.fetch(`/storage-locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteStorageLocation: (id: string) => {
    return apiClient.fetch(`/storage-locations/${id}`, {
      method: 'DELETE',
    });
  },
};
