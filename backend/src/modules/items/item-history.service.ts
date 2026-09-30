import { PrismaClient } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

const prisma = new PrismaClient();

export class ItemHistoryService {
  static async getHistory(userId: string, itemId: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        images: true,
        recognition: true,
        listingDraft: true,
        listings: {
          include: { marketplace: true }
        },
        sale: true,
        pricingResearch: true,
      }
    });

    if (!item) throw new NotFoundError('Item not found');
    if (item.userId !== userId) throw new UnauthorizedError('Not authorized to access this item');

    const events: Array<{ id: string, type: string; timestamp: Date; title: string; details?: any }> = [];
    let eventIdCounter = 1;
    const addEvent = (event: Omit<typeof events[0], 'id'>) => {
      events.push({ ...event, id: `event_${eventIdCounter++}` });
    };

    // Created
    addEvent({
      type: 'CREATED',
      timestamp: item.createdAt,
      title: 'Item Added to Inventory',
    });

    // Preparation
    if ((item as any).preparedAt) {
      addEvent({
        type: 'ITEM_PREPARED',
        timestamp: (item as any).preparedAt,
        title: 'Item Prepared (Cleaned & Inspected)',
        details: { status: 'PREPARED' }
      });
    }

    // Ready to List
    if ((item as any).readyToListAt) {
      addEvent({
        type: 'ITEM_READY_TO_LIST',
        timestamp: (item as any).readyToListAt,
        title: 'Item Marked Ready to List',
        details: { status: 'READY_TO_LIST' }
      });
    }

    // Images
    for (const img of item.images) {
      if (img.processingStatus === 'COMPLETED') {
        addEvent({
          type: 'IMAGE_PROCESSED',
          timestamp: img.updatedAt,
          title: 'Image Background Removed',
        });
      }
    }

    // Recognition
    if (item.recognition && item.recognition.status === 'COMPLETED') {
      addEvent({
        type: 'RECOGNIZED',
        timestamp: item.recognition.updatedAt,
        title: 'AI Identification Completed',
        details: { category: item.recognition.category, brand: item.recognition.brand }
      });
    }

    // Pricing
    if (item.pricingResearch && item.pricingResearch.status === 'COMPLETED') {
      addEvent({
        type: 'PRICE_RESEARCHED',
        timestamp: item.pricingResearch.updatedAt,
        title: 'Pricing Research Completed',
        details: { recommendedPrice: item.pricingResearch.recommendedPrice }
      });
    }

    // Draft
    if (item.listingDraft && item.listingDraft.status === 'COMPLETED') {
      addEvent({
        type: 'DRAFT_GENERATED',
        timestamp: item.listingDraft.updatedAt,
        title: 'Listing Draft Generated',
      });
    }

    // Listings
    for (const listing of item.listings) {
      if (listing.listedAt) {
        addEvent({
          type: 'LISTED',
          timestamp: listing.listedAt,
          title: `Listed on ${listing.marketplace.name}`,
          details: { price: listing.listedPrice }
        });
      }
      if (listing.status === 'ENDED' || listing.status === 'SOLD') {
        addEvent({
          type: 'DELISTED',
          timestamp: listing.soldAt || new Date(listing.listedAt?.getTime() ? listing.listedAt.getTime() + 1000 : Date.now()), // Fallback since no updatedAt
          title: listing.status === 'SOLD' ? `Sold on ${listing.marketplace.name}` : `Delisted from ${listing.marketplace.name}`,
        });
      }
    }

    // Sale
    if (item.sale) {
      addEvent({
        type: 'SALE_RECORDED',
        timestamp: item.sale.createdAt,
        title: 'Sale Recorded',
        details: { salePrice: item.sale.salePrice }
      });
    }

    // Archived
    if (item.status === 'ARCHIVED') {
      addEvent({
        type: 'ARCHIVED',
        timestamp: item.updatedAt,
        title: 'Item Archived',
      });
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
