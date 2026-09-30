import { apiClient } from './client';
import { Item, PaginatedResponse, ItemStatus } from '../../types/item';

export const itemsApi = {
  listItems: (params?: { page?: number; limit?: number; search?: string; status?: ItemStatus; storageLocationId?: string; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.storageLocationId) query.append('storageLocationId', params.storageLocationId);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.fetch(`/items${queryString}`);
  },
  
  getItem: (id: string) => {
    return apiClient.fetch(`/items/${id}`);
  },
  
  createItem: (data: Partial<Item>) => {
    return apiClient.fetch('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateItem: (id: string, data: Partial<Item>) => {
    return apiClient.fetch(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  archiveItem: (id: string) => {
    return apiClient.fetch(`/items/${id}/archive`, {
      method: 'POST',
    });
  },

  updatePreparation: (id: string, status: 'UNPREPARED' | 'PREPARED' | 'READY_TO_LIST') => {
    return apiClient.fetch(`/items/${id}/preparation`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
