import { PrismaClient, Prisma } from '@prisma/client';
import { listingGenerationProvider } from './providers/listing-generation.provider';

const prisma = new PrismaClient();

export class ListingGenerationService {
  async startGeneration(itemId: string, userId: string) {
    // Verify item ownership
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { recognition: true },
    });

    if (!item) {
      throw new Error('NOT_FOUND: Item not found');
    }

    if (item.userId !== userId) {
      throw new Error('UNAUTHORIZED: Not owner');
    }

    if (!item.recognition || item.recognition.status !== 'COMPLETED') {
        throw new Error('RECOGNITION_NOT_COMPLETED: Item recognition must be completed before listing generation');
    }

    // Check existing draft state
    let draft = await prisma.listingDraft.findUnique({
      where: { itemId },
    });

    if (draft && (draft.status === 'PENDING' || draft.status === 'PROCESSING')) {
        throw new Error('ALREADY_PROCESSING: Generation is already in progress');
    }

    if (!draft) {
      draft = await prisma.listingDraft.create({
        data: {
          itemId,
          status: 'PENDING',
        },
      });
    } else {
       draft = await prisma.listingDraft.update({
           where: { itemId },
           data: { status: 'PENDING' }
       })
    }

    // Fire and forget generation
    this.processGeneration(itemId, item, item.recognition).catch(err => {
      console.error(`Listing generation failed for item ${itemId}:`, err);
    });

    return draft;
  }

  private async processGeneration(itemId: string, itemData: any, recognitionData: any) {
    await prisma.listingDraft.update({
      where: { itemId },
      data: { status: 'PROCESSING' },
    });

    try {
      // Create safe objects without IDs or timestamps to feed to the AI
      const safeItem = {
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          brand: itemData.brand,
          condition: itemData.condition,
          color: itemData.color,
          size: itemData.size,
      };

      const safeRecognition = { ...recognitionData };
      delete safeRecognition.id;
      delete safeRecognition.itemId;
      delete safeRecognition.rawResponse;
      delete safeRecognition.createdAt;
      delete safeRecognition.updatedAt;

      const generated = await listingGenerationProvider.generateListing(safeItem, safeRecognition);

      await prisma.listingDraft.update({
        where: { itemId },
        data: {
          status: 'COMPLETED',
          title: generated.title || null,
          description: generated.description || null,
          category: generated.category || null,
          brand: generated.brand || null,
          condition: generated.condition || null,
          color: generated.color || null,
          size: generated.size || null,
          attributes: generated.attributes ? generated.attributes as Prisma.InputJsonValue : Prisma.JsonNull,
          keywords: generated.keywords || [],
        },
      });
    } catch (error) {
      console.error('Failed to generate listing:', error);
      await prisma.listingDraft.update({
        where: { itemId },
        data: { status: 'FAILED' },
      });
    }
  }

  async getDraft(itemId: string, userId: string) {
    const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { userId: true }
    });

    if (!item) {
        return null;
    }

    if (item.userId !== userId) {
        throw new Error('UNAUTHORIZED: Not owner');
    }

    return prisma.listingDraft.findUnique({
      where: { itemId },
    });
  }

  async updateDraft(itemId: string, userId: string, data: any) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });

    if (!item) {
      throw new Error('NOT_FOUND: Item not found');
    }

    if (item.userId !== userId) {
      throw new Error('UNAUTHORIZED: Not owner');
    }

    return prisma.listingDraft.update({
      where: { itemId },
      data,
    });
  }
}

export const listingGenerationService = new ListingGenerationService();
