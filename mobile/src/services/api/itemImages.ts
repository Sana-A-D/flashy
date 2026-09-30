import { apiClient } from './client';
import { ItemImage } from '../../types/item';

export interface RequestUploadRequest {
  mimeType: string;
  fileSize: number;
  originalFilename?: string;
}

export interface RequestUploadResponse {
  uploadUrl: string;
  storageKey: string;
}

export interface ConfirmUploadRequest {
  storageKey: string;
  mimeType: string;
  fileSize: number;
  originalFilename?: string;
  width?: number;
  height?: number;
}

export interface DirectUploadRequest {
  base64Data: string;
  mimeType?: string;
  originalFilename?: string;
}

export const itemImagesApi = {
  uploadDirect: async (itemId: string, data: DirectUploadRequest): Promise<ItemImage> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/direct`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  requestUploadUrl: async (itemId: string, data: RequestUploadRequest): Promise<RequestUploadResponse> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/upload-url`, { method: 'POST', body: JSON.stringify(data) });
    return response;
  },

  confirmUpload: async (itemId: string, data: ConfirmUploadRequest): Promise<ItemImage> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/confirm`, { method: 'POST', body: JSON.stringify(data) });
    return response;
  },

  listImages: async (itemId: string): Promise<ItemImage[]> => {
    const response = await apiClient.fetch(`/items/${itemId}/images`);
    return response;
  },

  setPrimary: async (itemId: string, imageId: string): Promise<ItemImage[]> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/${imageId}/primary`, { method: 'PATCH' });
    return response;
  },

  reorderImages: async (itemId: string, imageIds: string[]): Promise<ItemImage[]> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/reorder`, { method: 'PATCH', body: JSON.stringify({ imageIds }) });
    return response;
  },

  deleteImage: async (itemId: string, imageId: string): Promise<ItemImage[]> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/${imageId}`, { method: 'DELETE' });
    return response;
  },

  processImage: async (itemId: string, imageId: string): Promise<{ image: ItemImage }> => {
    const response = await apiClient.fetch(`/items/${itemId}/images/${imageId}/process`, { method: 'POST' });
    return response;
  },
};
