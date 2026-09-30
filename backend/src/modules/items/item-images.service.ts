import { PrismaClient } from '@prisma/client';
import { ItemsService } from './items.service';
import { storageService } from '../storage/storage.service';
import { RequestUploadDto, ConfirmUploadDto, ReorderImagesDto, DirectUploadDto } from './item-images.schema';
import { ValidationError, NotFoundError } from '../../shared/errors';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const MAX_ITEM_PHOTOS = 8;

export class ItemImagesService {
  static async uploadDirect(userId: string, itemId: string, data: DirectUploadDto) {
    // Verify item ownership
    await ItemsService.getById(userId, itemId);

    const currentCount = await prisma.itemImage.count({ where: { itemId } });
    if (currentCount >= MAX_ITEM_PHOTOS) {
      throw new ValidationError(`Maximum of ${MAX_ITEM_PHOTOS} images allowed per item`);
    }

    // Clean base64 string
    let cleanBase64 = data.base64Data;
    let mimeType = data.mimeType || 'image/jpeg';
    if (cleanBase64.includes(',')) {
      const parts = cleanBase64.split(',');
      const header = parts[0];
      const match = header ? header.match(/:(.*?);/) : null;
      if (match && match[1]) mimeType = match[1];
      cleanBase64 = parts[1] || '';
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    const imageId = crypto.randomUUID();
    const extension = mimeType.split('/')[1] || 'jpg';
    const storageKey = `users/${userId}/items/${itemId}/${imageId}.${extension}`;

    // Store in storage service (supports local fallback store & s3)
    await storageService.putObject(storageKey, buffer, mimeType);

    const isPrimary = currentCount === 0;
    const sortOrder = currentCount;

    const image = await prisma.itemImage.create({
      data: {
        itemId,
        storageKey,
        mimeType,
        fileSize: buffer.length,
        originalFilename: data.originalFilename || `photo-${Date.now()}.${extension}`,
        sortOrder,
        isPrimary,
      },
    });

    const url = await storageService.getObjectUrl(storageKey);
    return {
      ...image,
      url,
    };
  }

  static async requestUploadUrl(userId: string, itemId: string, data: RequestUploadDto) {
    // Verify item ownership and existence
    const item = await ItemsService.getById(userId, itemId);

    // Check max images
    const currentCount = await prisma.itemImage.count({ where: { itemId } });
    if (currentCount >= MAX_ITEM_PHOTOS) {
      throw new ValidationError(`Maximum of ${MAX_ITEM_PHOTOS} images allowed per item`);
    }

    // Generate secure storage key
    const imageId = crypto.randomUUID();
    const extension = data.mimeType.split('/')[1] || 'jpg';
    const storageKey = `users/${userId}/items/${itemId}/${imageId}.${extension}`;

    // Get signed URL
    const uploadUrl = await storageService.getUploadUrl(storageKey, data.mimeType);

    return { uploadUrl, storageKey };
  }

  static async confirmUpload(userId: string, itemId: string, data: ConfirmUploadDto) {
    // Verify item ownership
    const item = await ItemsService.getById(userId, itemId);

    const currentCount = await prisma.itemImage.count({ where: { itemId } });
    if (currentCount >= MAX_ITEM_PHOTOS) {
      throw new ValidationError(`Maximum of ${MAX_ITEM_PHOTOS} images allowed per item`);
    }

    const isPrimary = currentCount === 0; // First image is primary
    const sortOrder = currentCount;

    const createData = {
        itemId,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        originalFilename: data.originalFilename,
        width: data.width,
        height: data.height,
        sortOrder,
        isPrimary,
    } as any;
    Object.keys(createData).forEach(k => createData[k] === undefined && delete createData[k]);

    const image = await prisma.itemImage.create({
      data: createData,
    });

    return image;
  }

  static async listImages(userId: string, itemId: string) {
    // Verify item ownership
    await ItemsService.getById(userId, itemId);

    const images = await prisma.itemImage.findMany({
      where: { itemId },
      orderBy: { sortOrder: 'asc' },
    });

    // Add presigned GET URLs
    const imagesWithUrls = await Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await storageService.getObjectUrl(img.storageKey),
      }))
    );

    return imagesWithUrls;
  }

  static async setPrimaryImage(userId: string, itemId: string, imageId: string) {
    await ItemsService.getById(userId, itemId);

    const image = await prisma.itemImage.findFirst({ where: { id: imageId, itemId } });
    if (!image) throw new NotFoundError('Image not found');

    // Use transaction to update old primary and set new primary
    await prisma.$transaction([
      prisma.itemImage.updateMany({
        where: { itemId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.itemImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return this.listImages(userId, itemId);
  }

  static async reorderImages(userId: string, itemId: string, data: ReorderImagesDto) {
    await ItemsService.getById(userId, itemId);

    const { imageIds } = data;
    
    // Validate we have the same number of images
    const currentImages = await prisma.itemImage.findMany({ where: { itemId } });
    if (currentImages.length !== imageIds.length) {
      throw new ValidationError('Invalid number of image IDs provided for reordering');
    }

    // Check all IDs exist
    const currentImageIds = currentImages.map(img => img.id);
    const hasAll = imageIds.every(id => currentImageIds.includes(id));
    if (!hasAll) {
      throw new ValidationError('Invalid image IDs provided');
    }

    // Update inside a transaction
    const updatePromises = imageIds.map((id, index) =>
      prisma.itemImage.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updatePromises);

    return this.listImages(userId, itemId);
  }

  static async deleteImage(userId: string, itemId: string, imageId: string) {
    await ItemsService.getById(userId, itemId);

    const image = await prisma.itemImage.findFirst({ where: { id: imageId, itemId } });
    if (!image) throw new NotFoundError('Image not found');

    // Delete from DB first
    await prisma.itemImage.delete({ where: { id: imageId } });

    // Promote another image to primary if needed
    if (image.isPrimary) {
      const nextImage = await prisma.itemImage.findFirst({
        where: { itemId },
        orderBy: { sortOrder: 'asc' },
      });
      if (nextImage) {
        await prisma.itemImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    // Try deleting from storage (fire and forget for now, but in real app handle failures)
    storageService.deleteObject(image.storageKey).catch(err => {
      console.error('Failed to delete object from storage:', err);
    });

    return this.listImages(userId, itemId);
  }
}
