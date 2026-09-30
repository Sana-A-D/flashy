import { PrismaClient, ListingStatus, ItemStatus } from '@prisma/client';
import { MarketplaceRegistry } from './marketplace.registry';
import { 
  MarketplaceListingInput, 
  MarketplaceOperationResult, 
  MarketplaceOperationStatus, 
  MarketplaceErrorCategory,
  MarketplaceError
} from './marketplace.types';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

const prisma = new PrismaClient();

// In a real application, you might inject the registry instead of instantiating or globally creating it here.
// We'll export a default instance for simplicity in this structure.
export const defaultMarketplaceRegistry = new MarketplaceRegistry();

export class MarketplaceService {
  constructor(private registry: MarketplaceRegistry = defaultMarketplaceRegistry) {}

  async publishListing(
    userId: string,
    itemId: string,
    marketplaceId: string,
    input: MarketplaceListingInput
  ): Promise<MarketplaceOperationResult> {
    // 1. Verify item ownership
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this item');
    }

    // 2. Fetch Marketplace to get the adapter type
    const marketplace = await prisma.marketplace.findUnique({
      where: { id: marketplaceId }
    });

    if (!marketplace) {
      throw new NotFoundError('Marketplace not found');
    }

    // 3. Get adapter first to check capabilities
    let adapter;
    try {
      adapter = this.registry.getAdapter(marketplace.type);
    } catch (err: any) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: err as MarketplaceError,
      };
    }

    const capabilities = adapter.getCapabilities ? adapter.getCapabilities() : null;
    if (capabilities?.manualOnly || !adapter.supportsCreateListing()) {
      return {
        status: MarketplaceOperationStatus.MANUAL_REQUIRED,
        requiresManualAction: true,
        error: {
          category: MarketplaceErrorCategory.UNSUPPORTED,
          message: `${marketplace.name} does not support automated API listing creation. Please use manual cross-listing.`,
        },
      };
    }

    // 4. Verify account ownership for automated adapters
    const account = await prisma.marketplaceAccount.findFirst({
      where: { userId, marketplaceId },
    });

    if (!account) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.AUTHENTICATION,
          message: `No connected account found for marketplace ${marketplace.name}`,
        },
      };
    }

    // 5. Call adapter
    const result = await adapter.createListing(userId, account.id, input);

    // 6. If successful, record the listing in DB
    if (result.status === MarketplaceOperationStatus.SUCCESS && result.externalListingId) {
      await prisma.marketplaceListing.create({
        data: {
          itemId,
          marketplaceId,
          externalListingId: result.externalListingId,
          status: ListingStatus.ACTIVE,
          listingUrl: result.externalListingUrl ?? null,
          listedPrice: input.price,
          listedAt: new Date(),
        },
      });
      // Optionally update item status to LISTED if not already
      if (item.status === ItemStatus.DRAFT || item.status === ItemStatus.INVENTORY) {
        await prisma.item.update({
          where: { id: itemId },
          data: { status: ItemStatus.LISTED },
        });
      }
    } else if (result.status === MarketplaceOperationStatus.MANUAL_REQUIRED) {
      // Record manual creation pending
      await prisma.marketplaceListing.create({
        data: {
          itemId,
          marketplaceId,
          status: ListingStatus.DRAFT,
        },
      });
    }

    return result;
  }

  async delistListing(
    userId: string,
    itemId: string,
    marketplaceId: string
  ): Promise<MarketplaceOperationResult> {
    // 1. Verify item ownership
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this item');
    }

    // 2. Fetch Marketplace to get the adapter type
    const marketplace = await prisma.marketplace.findUnique({
      where: { id: marketplaceId }
    });

    if (!marketplace) {
      throw new NotFoundError('Marketplace not found');
    }

    // 3. Find the specific ACTIVE MarketplaceListing
    const listing = await prisma.marketplaceListing.findFirst({
      where: { itemId, marketplaceId, status: ListingStatus.ACTIVE },
    });

    if (!listing) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.NOT_FOUND,
          message: `No active listing found for marketplace ${marketplace.name}`,
        },
      };
    }

    // 4. Get adapter first to check capabilities
    let adapter;
    try {
      adapter = this.registry.getAdapter(marketplace.type);
    } catch (err: any) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: err as MarketplaceError,
      };
    }

    const capabilities = adapter.getCapabilities ? adapter.getCapabilities() : null;
    if (capabilities?.manualOnly || !adapter.supportsEndListing()) {
      return {
        status: MarketplaceOperationStatus.MANUAL_REQUIRED,
        requiresManualAction: true,
        error: {
          category: MarketplaceErrorCategory.UNSUPPORTED,
          message: `Marketplace ${marketplace.name} does not support automated delisting. Please delist manually.`,
        },
      };
    }

    // 5. Verify account ownership via listing's account link
    const account = await prisma.marketplaceAccount.findUnique({
      where: { id: listing.marketplaceAccountId || '' },
    });
    
    // If account not found by listing's ID, fallback to finding one by userId/marketplaceId
    const targetAccountId = account ? account.id : (await prisma.marketplaceAccount.findFirst({
      where: { userId, marketplaceId }
    }))?.id;

    if (!targetAccountId) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.AUTHENTICATION,
          message: `No connected account found for marketplace ${marketplace.name}`,
        },
      };
    }
    
    // Additional verification that the account belongs to the user
    const userAccount = await prisma.marketplaceAccount.findFirst({
        where: { id: targetAccountId, userId }
    });
    
    if (!userAccount) {
      throw new UnauthorizedError('Not authorized to use this marketplace account');
    }

    // 6. Call adapter
    const result = await adapter.endListing(userId, targetAccountId, listing.externalListingId || '');

    // 7. If successful, record the delisting in DB
    if (result.status === MarketplaceOperationStatus.SUCCESS) {
      await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: { status: ListingStatus.ENDED },
      });
    }

    return result;
  }

  async delistEverywhere(
    userId: string,
    itemId: string
  ): Promise<{ results: Record<string, MarketplaceOperationResult> }> {
    // 1. Verify item ownership
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this item');
    }

    // 2. Fetch all ACTIVE listings for the item
    const activeListings = await prisma.marketplaceListing.findMany({
      where: { itemId, status: ListingStatus.ACTIVE },
      include: { marketplace: true }
    });

    const results: Record<string, MarketplaceOperationResult> = {};

    // 3. Delist each one sequentially to avoid rate limits or complex rollbacks
    for (const listing of activeListings) {
      const result = await this.delistListing(userId, itemId, listing.marketplaceId);
      results[listing.marketplace.name] = result;
    }

    return { results };
  }
}
