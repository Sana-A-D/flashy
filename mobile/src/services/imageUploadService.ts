import { itemImagesApi, ConfirmUploadRequest } from './api/itemImages';
import { LocalPhoto } from '../types/item';

export const uploadLocalPhoto = async (itemId: string, photo: LocalPhoto): Promise<void> => {
  if (!photo.uri) throw new Error('No URI found for photo');
  
  // 1. Request Upload URL
  const mimeType = photo.mimeType || 'image/jpeg';
  const fileSize = photo.fileSize || 1024;
  
  const { uploadUrl, storageKey } = await itemImagesApi.requestUploadUrl(itemId, {
    mimeType,
    fileSize,
    originalFilename: photo.fileName,
  });

  // 2. Upload file to S3 via fetch
  // React Native's fetch supports blob/file uploads. Depending on the exact RN environment, 
  // you might need to use FormData or RN-Fetch-Blob, but for basic signed URL uploads, 
  // this pattern works in modern React Native.
  
  const response = await fetch(photo.uri);
  const blob = await response.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to storage provider');
  }

  // 3. Confirm Upload
  const confirmData: ConfirmUploadRequest = {
    storageKey,
    mimeType,
    fileSize,
    originalFilename: photo.fileName,
    width: photo.width,
    height: photo.height,
  };
  
  await itemImagesApi.confirmUpload(itemId, confirmData);
};
