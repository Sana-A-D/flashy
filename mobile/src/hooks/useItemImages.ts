import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemImagesApi, RequestUploadRequest, ConfirmUploadRequest } from '../services/api/itemImages';

export const useItemImages = (itemId: string) => {
  return useQuery({
    queryKey: ['itemImages', itemId],
    queryFn: () => itemImagesApi.listImages(itemId),
    enabled: !!itemId,
    refetchInterval: (query) => {
      const images = query.state?.data;
      if (!images) return false;
      const isProcessing = images.some(img => img.processingStatus === 'PENDING' || img.processingStatus === 'PROCESSING');
      return isProcessing ? 3000 : false; // poll every 3 seconds if processing
    },
  });
};

export const useRequestImageUpload = () => {
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: RequestUploadRequest }) =>
      itemImagesApi.requestUploadUrl(itemId, data),
  });
};

export const useConfirmImageUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: ConfirmUploadRequest }) =>
      itemImagesApi.confirmUpload(itemId, data),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['itemImages', itemId] });
    },
  });
};

export const useSetPrimaryImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, imageId }: { itemId: string; imageId: string }) =>
      itemImagesApi.setPrimary(itemId, imageId),
    onSuccess: (data, { itemId }) => {
      queryClient.setQueryData(['itemImages', itemId], data);
    },
  });
};

export const useReorderImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, imageIds }: { itemId: string; imageIds: string[] }) =>
      itemImagesApi.reorderImages(itemId, imageIds),
    onSuccess: (data, { itemId }) => {
      queryClient.setQueryData(['itemImages', itemId], data);
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, imageId }: { itemId: string; imageId: string }) =>
      itemImagesApi.deleteImage(itemId, imageId),
    onSuccess: (data, { itemId }) => {
      queryClient.setQueryData(['itemImages', itemId], data);
    },
  });
};

export const useProcessItemImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, imageId }: { itemId: string; imageId: string }) =>
      itemImagesApi.processImage(itemId, imageId),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['itemImages', itemId] });
    },
  });
};
