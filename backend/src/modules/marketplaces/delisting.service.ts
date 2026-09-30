import { PrismaClient, ListingStatus, ItemStatus } from '@prisma/client';
import { MarketplaceRegistry } from './marketplace.registry';
import { defaultMarketplaceRegistry } from './marketplace.service';
import { 
  MarketplaceOperationStatus, 
  MarketplaceErrorCategory,
  MarketplaceOperationResult
} from './marketplace.types';
import { NotFoundError, UnauthorizedError, AppError } from '../../shared/errors';

const prisma = new PrismaClient();

export interface DelistingResult {
  marketplace: string;
  status: MarketplaceOperationStatus;
  error?: string;
  requiresManualAction?: boolean;
  listingUrl?: string;
}

export class DelistingService {
  constructor(private registry: MarketplaceRegistry = defaultMarketplaceRegistry) {}

  async getDelistingStatus(userId: string, itemId: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        listings: {
          include: { marketplace: true }
        },
        sale: true
      }
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this item');
    }

    // We only delist if the item is SOLD
    if (item.status !== ItemStatus.SOLD) {
      throw new AppError(400, 'Item must be SOLD to perform post-sale delisting');
    }

    // Identify listings that need attention or have been acted upon during post-sale
    // Exclude the one it was sold on
    const relevantListings = item.listings.filter(
      l => l.id !== item.sale?.marketplaceListingId
    );

    return relevantListings.map(l => ({
      marketplaceId: l.marketplace.id,
      marketplaceName: l.marketplace.name,
      marketplaceType: l.marketplace.type,
      status: l.status,
      listingUrl: l.listingUrl,
    }));
  }

  async performDelisting(userId: string, itemId: string): Promise<DelistingResult[]> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        listings: {
          include: { marketplace: true }
        },
        sale: true
      }
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this item');
    }

    if (item.status !== ItemStatus.SOLD) {
      throw new AppError(400, 'Item must be SOLD to perform post-sale delisting');
    }

    const activeListings = item.listings.filter(
      l => l.status === ListingStatus.ACTIVE && l.id !== item.sale?.marketplaceListingId
    );

    if (activeListings.length === 0) {
      return [];
    }

    const results: DelistingResult[] = [];

    // Parallelize operations for speed
    const operations = activeListings.map(async (listing) => {
      const marketplace = listing.marketplace;
      const resultTemplate: Omit<DelistingResult, 'listingUrl'> = {
        marketplace: marketplace.name,
        status: MarketplaceOperationStatus.PENDING,
      };

      try {
        let adapter;
        try {
          adapter = this.registry.getAdapter(marketplace.type);
        } catch (e: any) {
          return {
            ...resultTemplate,
            status: MarketplaceOperationStatus.FAILED,
            error: e.message || 'Adapter not found',
          };
        }

        const capabilities = adapter.getCapabilities ? adapter.getCapabilities() : null;
        if (capabilities?.manualOnly || !adapter.supportsEndListing()) {
          return {
            ...resultTemplate,
            status: MarketplaceOperationStatus.MANUAL_REQUIRED,
            requiresManualAction: true,
            error: `${marketplace.name} requires manual delisting`,
            ...(listing.listingUrl ? { listingUrl: listing.listingUrl } : {}),
          };
        }

        const account = await prisma.marketplaceAccount.findFirst({
          where: { userId, marketplaceId: marketplace.id },
        });

        if (!account) {
          return {
            ...resultTemplate,
            status: MarketplaceOperationStatus.FAILED,
            error: 'No connected account found',
          };
        }

        if (!listing.externalListingId) {
          return {
            ...resultTemplate,
            status: MarketplaceOperationStatus.MANUAL_REQUIRED,
            error: 'No external listing ID found',
            requiresManualAction: true,
            ...(listing.listingUrl ? { listingUrl: listing.listingUrl } : {}),
          };
        }

        const opResult = await adapter.endListing(userId, account.id, listing.externalListingId);

        if (opResult.status === MarketplaceOperationStatus.SUCCESS) {
          await prisma.marketplaceListing.update({
            where: { id: listing.id },
            data: { status: ListingStatus.ENDED },
          });
        }

        return {
          ...resultTemplate,
          status: opResult.status,
          ...(opResult.error?.message ? { error: opResult.error.message } : {}),
          requiresManualAction: opResult.requiresManualAction || opResult.status === MarketplaceOperationStatus.MANUAL_REQUIRED,
          ...(listing.listingUrl ? { listingUrl: listing.listingUrl } : {}),
        };

      } catch (err: any) {
        return {
          ...resultTemplate,
          status: MarketplaceOperationStatus.FAILED,
          error: err.message || 'Unexpected error occurred',
        };
      }
    });

    const completedOps = await Promise.all(operations);
    return completedOps;
  }
}
