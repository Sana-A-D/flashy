import { PrismaClient } from '@prisma/client';
import { visionRecognitionProvider } from './providers/vision-recognition.provider';
import { AIStructuredAttributes } from './item-recognition.schema';
import { storageService } from '../storage/storage.service';

const prisma = new PrismaClient();

export class ItemRecognitionService {
  async startRecognition(userId: string, itemId: string) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
      include: {
        recognition: true,
        images: {
          include: { variants: true }
        }
      }
    });

    if (!item) {
      throw new Error('NOT_FOUND: Item not found');
    }

    if (item.recognition) {
      const status = item.recognition.status;
      if (status === 'PROCESSING' || status === 'PENDING') {
        return item.recognition;
      }
      if (status === 'COMPLETED') {
        return item.recognition;
      }
    }

    const recognition = await prisma.itemRecognition.upsert({
      where: { itemId },
      update: { status: 'PENDING' },
      create: { itemId, status: 'PENDING' }
    });

    const processPromise = this.processRecognition(userId, itemId);
    
    // Return early or let background job run
    processPromise.catch(console.error);

    return recognition;
  }

  async runRecognitionSync(userId: string, itemId: string) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) {
      throw new Error('NOT_FOUND: Item not found');
    }

    await prisma.itemRecognition.upsert({
      where: { itemId },
      update: { status: 'PENDING' },
      create: { itemId, status: 'PENDING' }
    });

    await this.processRecognition(userId, itemId);

    return prisma.itemRecognition.findUnique({
      where: { itemId }
    });
  }

  private async processRecognition(userId: string, itemId: string) {
    await prisma.itemRecognition.update({
      where: { itemId },
      data: { status: 'PROCESSING' }
    });

    try {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { images: { include: { variants: true } } }
      });
      
      if (!item || item.images.length === 0) {
        throw new Error('No images available for recognition');
      }

      // Collect all images for multi-image reasoning across front, back, tags, labels, and details
      const imageBuffers: { buffer: Buffer; mimeType: string }[] = [];

      for (const img of item.images) {
        const bgRemoved = img.variants.find(v => v.type === 'BACKGROUND_REMOVED');
        const storageKey = bgRemoved ? bgRemoved.storageKey : img.storageKey;
        const mimeType = bgRemoved ? bgRemoved.mimeType : img.mimeType;

        try {
          const buffer = await storageService.downloadObject(storageKey);
          imageBuffers.push({ buffer, mimeType });
        } catch (downloadErr) {
          console.warn(`Failed to download image ${img.id} for item ${itemId}:`, downloadErr);
        }
      }

      if (imageBuffers.length === 0) {
        throw new Error('No readable images could be retrieved for recognition');
      }

      const result = await visionRecognitionProvider.analyzeImages(imageBuffers);

      const updateData = {
          status: 'COMPLETED',
          confidence: result.confidence,
          category: result.category,
          brand: result.brand,
          model: result.model,
          productName: result.productName,
          color: result.color,
          secondaryColors: result.secondaryColors,
          material: result.material,
          style: result.style,
          audience: result.audience,
          size: result.size,
          pattern: result.pattern,
          conditionClues: result.conditionClues,
          visibleFeatures: result.visibleFeatures,
          modelNumber: result.modelNumber,
          sku: result.sku,
          upc: result.upc,
          notes: result.notes,
          rawResponse: JSON.parse(JSON.stringify(result)) 
        } as any;
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      await prisma.itemRecognition.update({
        where: { itemId },
        data: updateData
      });
    } catch (error) {
      console.error('Recognition error:', error);
      await prisma.itemRecognition.update({
        where: { itemId },
        data: { status: 'FAILED' }
      });
    }
  }

  async getRecognition(userId: string, itemId: string) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
      include: { recognition: true }
    });
    if (!item) throw new Error('NOT_FOUND: Item not found');
    return item.recognition;
  }

  async updateRecognition(userId: string, itemId: string, data: Partial<AIStructuredAttributes>) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
      include: { recognition: true }
    });
    if (!item || !item.recognition) throw new Error('NOT_FOUND: Item or recognition not found');
    
    const updateData = { ...data } as any;
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
    
    return prisma.itemRecognition.update({
      where: { itemId },
      data: updateData
    });
  }
}

export const itemRecognitionService = new ItemRecognitionService();
