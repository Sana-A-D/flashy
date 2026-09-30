import { apiClient } from './client';
import { FashionItem, UpdateFashionItemPayload } from '../../types/fashion';

export const fashionApi = {
  /**
   * Create an initial FashionItem container
   */
  createItem: async (data?: { title?: string }): Promise<FashionItem> => {
    const res = await apiClient.fetch('/fashion/items', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return res.data || res;
  },

  /**
   * Get a single FashionItem with hydrated photos and fashion intelligence
   */
  getItem: async (id: string): Promise<FashionItem> => {
    const res = await apiClient.fetch(`/fashion/items/${id}`, {
      method: 'GET',
    });
    return res.data || res;
  },

  /**
   * Run Gemini visual identification & style reasoning on the item
   */
  analyzeItem: async (id: string): Promise<FashionItem> => {
    const res = await apiClient.fetch(`/fashion/items/${id}/analyze`, {
      method: 'POST',
    });
    return res.data || res;
  },

  /**
   * Run live market research, real comps, prices, and similar items
   */
  researchItem: async (id: string): Promise<FashionItem> => {
    const res = await apiClient.fetch(`/fashion/items/${id}/research`, {
      method: 'POST',
    });
    return res.data || res;
  },

  /**
   * User correction / editing of AI results
   */
  updateItem: async (id: string, payload: UpdateFashionItemPayload): Promise<FashionItem> => {
    const res = await apiClient.fetch(`/fashion/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data || res;
  },

  /**
   * Toggle save state for an item
   */
  toggleSave: async (id: string, save: boolean): Promise<FashionItem> => {
    const res = await apiClient.fetch(`/fashion/items/${id}/save`, {
      method: 'POST',
      body: JSON.stringify({ save }),
    });
    return res.data || res;
  },

  /**
   * List fashion items: 'SAVED', 'RECENT', or 'ALL'
   */
  listItems: async (filter: 'SAVED' | 'RECENT' | 'ALL' = 'ALL'): Promise<FashionItem[]> => {
    const res = await apiClient.fetch(`/fashion/items?filter=${filter}`, {
      method: 'GET',
    });
    return res.data || res;
  },

  /**
   * Delete a fashion item and cleanup assets
   */
  deleteItem: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.fetch(`/fashion/items/${id}`, {
      method: 'DELETE',
    });
    return res.data || res;
  },

  /**
   * Batch delete multiple fashion items
   */
  batchDeleteItems: async (ids: string[]): Promise<{ count: number }> => {
    const res = await apiClient.fetch('/fashion/items/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    return res.data || res;
  },

  /**
   * Clear all scan history (draft scans)
   */
  clearHistory: async (): Promise<{ count: number }> => {
    const res = await apiClient.fetch('/fashion/items/history', {
      method: 'DELETE',
    });
    return res.data || res;
  },

  /**
   * Upload an item photo directly
   */
  uploadPhotoDirect: async (itemId: string, base64Data: string, mimeType: string = 'image/jpeg') => {
    const res = await apiClient.fetch(`/fashion/items/${itemId}/images/direct`, {
      method: 'POST',
      body: JSON.stringify({ base64Data, mimeType }),
    });
    return res.data || res;
  },
};

