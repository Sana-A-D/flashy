import { apiClient } from './client';

export type RecognitionStatus = 'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ItemRecognition {
  id: string;
  itemId: string;
  status: RecognitionStatus;
  confidence: number | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  productName: string | null;
  color: string | null;
  secondaryColors: string[];
  material: string | null;
  style: string | null;
  audience: string | null;
  size: string | null;
  pattern: string | null;
  conditionClues: string[];
  visibleFeatures: string[];
  distinctiveFeatures?: string[];
  era?: string | null;
  modelNumber: string | null;
  sku: string | null;
  upc: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const itemRecognitionApi = {
  startRecognition: async (itemId: string, sync: boolean = false): Promise<ItemRecognition> => {
    const url = sync ? `/items/${itemId}/recognition?sync=true` : `/items/${itemId}/recognition`;
    const response = await apiClient.fetch(url, {
      method: 'POST',
    });
    return response.data || response;
  },

  getRecognition: async (itemId: string): Promise<ItemRecognition | null> => {
    const response = await apiClient.fetch(`/items/${itemId}/recognition`, {
      method: 'GET',
    });
    return response.data || response;
  },

  updateRecognition: async (itemId: string, data: Partial<ItemRecognition>): Promise<ItemRecognition> => {
    const response = await apiClient.fetch(`/items/${itemId}/recognition`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },
};
