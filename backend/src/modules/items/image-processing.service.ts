import { PrismaClient } from '@prisma/client';
import { ItemsService } from './items.service';
import { storageService } from '../storage/storage.service';
import { backgroundRemovalProvider } from './providers/background-removal.provider';
import { NotFoundError, ValidationError } from '../../shared/errors';

const prisma = new PrismaClient();

export class ImageProcessingService {
  /**
   * Request background removal for an item image.
   * Returns immediately with the updated status.
   */
  static async requestBackgroundRemoval(userId: string, itemId: string, imageId: string) {
    // 1. Verify Item ownership
    await ItemsService.getById(userId, itemId);

    // 2. Verify Image ownership
    const image = await prisma.itemImage.findFirst({
      where: { id: imageId, itemId },
      include: { variants: true },
    });

    if (!image) throw new NotFoundError('Image not found');

    // 3. Idempotency check
    if (image.processingStatus === 'COMPLETED') {
      return image; // Already processed
    }
    if (image.processingStatus === 'PROCESSING' || image.processingStatus === 'PENDING') {
      return image; // Already processing
    }

    // 4. Update status to PENDING
    const updatedImage = await prisma.itemImage.update({
      where: { id: imageId },
      data: { processingStatus: 'PENDING' },
      include: { variants: true },
    });

    // 5. Trigger async processing (detached)
    this.processImageAsync(userId, itemId, imageId).catch((err) => {
      console.error('Async processing failed:', err);
    });

    return updatedImage;
  }

  private static async processImageAsync(userId: string, itemId: string, imageId: string) {
    try {
      // Mark as PROCESSING
      await prisma.itemImage.update({
        where: { id: imageId },
        data: { processingStatus: 'PROCESSING' },
      });

      const image = await prisma.itemImage.findUniqueOrThrow({ where: { id: imageId } });

      // In a real implementation, we would download the image buffer from S3:
      // const originalBuffer = await storageService.getObject(image.storageKey);
      const originalBuffer = Buffer.from('dummy-image-data'); // Mock for now since we don't have a real getObject yet

      // Call provider
      const processedResult = await backgroundRemovalProvider.removeBackground(originalBuffer, image.mimeType);

      // Upload processed image
      const processedKey = `users/${userId}/items/${itemId}/variants/${imageId}-bg-removed.png`;
      // await storageService.putObject(processedKey, processedResult.buffer, processedResult.mimeType);

      // Create variant
      await prisma.$transaction([
        prisma.itemImageVariant.create({
          data: {
            itemImageId: imageId,
            type: 'BACKGROUND_REMOVED',
            storageKey: processedKey,
            mimeType: processedResult.mimeType,
            fileSize: processedResult.buffer.length,
            width: image.width, // Ideally we get actual dimensions
            height: image.height,
          },
        }),
        prisma.itemImage.update({
          where: { id: imageId },
          data: { processingStatus: 'COMPLETED' },
        }),
      ]);
    } catch (error: any) {
      console.error('Image processing error:', error);
      // Mark as FAILED
      await prisma.itemImage.update({
        where: { id: imageId },
        data: { processingStatus: 'FAILED' },
      });
    }
  }
}
