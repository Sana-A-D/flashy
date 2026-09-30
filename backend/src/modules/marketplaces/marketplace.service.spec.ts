import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketplaceService, defaultMarketplaceRegistry } from './marketplace.service';
import { MarketplaceRegistry } from './marketplace.registry';
import { TestMarketplaceAdapter } from './adapters/test.adapter';
import { MarketplaceErrorCategory, MarketplaceOperationStatus, MarketplaceId } from './marketplace.types';
import { PrismaClient, ListingStatus } from '@prisma/client';
import { UnauthorizedError, NotFoundError } from '../../shared/errors';

// Mock prisma client
vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    item: { findUnique: vi.fn(), update: vi.fn() },
    marketplace: { findUnique: vi.fn() },
    marketplaceAccount: { findFirst: vi.fn() },
    marketplaceListing: { create: vi.fn() },
  };
  return {
    PrismaClient: class { constructor() { return mPrismaClient; } },
    ListingStatus: { ACTIVE: 'ACTIVE', DRAFT: 'DRAFT' },
    ItemStatus: { DRAFT: 'DRAFT', LISTED: 'LISTED', INVENTORY: 'INVENTORY' }
  };
});

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let registry: MarketplaceRegistry;
  let prisma: any;

  beforeEach(() => {
    registry = new MarketplaceRegistry();
    service = new MarketplaceService(registry);
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  it('1. Adapter registry resolves supported adapter', () => {
    const testAdapter = new TestMarketplaceAdapter();
    registry.register(testAdapter);
    
    const resolvedAdapter = registry.getAdapter(testAdapter.getMarketplaceId());
    expect(resolvedAdapter).toBe(testAdapter);
  });

  it('2. Unsupported marketplace is handled correctly', () => {
    expect(() => registry.getAdapter('UNSUPPORTED_MP')).toThrowError(/Marketplace adapter for UNSUPPORTED_MP is not supported/);
  });

  it('3. Adapter contract accepts normalized listing input', async () => {
    const testAdapter = new TestMarketplaceAdapter();
    registry.register(testAdapter);

    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'user-1', status: 'DRAFT' });
    prisma.marketplace.findUnique.mockResolvedValue({ id: 'mp-1', type: 'TEST_MARKETPLACE', name: 'Test MP' });
    prisma.marketplaceAccount.findFirst.mockResolvedValue({ id: 'acc-1', userId: 'user-1', marketplaceId: 'mp-1' });

    const input = {
      title: 'Test Item',
      description: 'Test Description',
      price: 1000,
      imageUrls: ['http://example.com/image.jpg']
    };

    const result = await service.publishListing('user-1', 'item-1', 'mp-1', input);
    
    expect(result.status).toBe(MarketplaceOperationStatus.SUCCESS);
    expect(result.externalListingId).toBeDefined();
    
    // Verify DB calls
    expect(prisma.marketplaceListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itemId: 'item-1',
          marketplaceId: 'mp-1',
          status: 'ACTIVE',
        })
      })
    );
  });

  it('4. Adapter result is normalized correctly', async () => {
    const testAdapter = new TestMarketplaceAdapter();
    
    // Override the mock to return a specific normalized result
    vi.spyOn(testAdapter, 'createListing').mockResolvedValue({
      status: MarketplaceOperationStatus.SUCCESS,
      externalListingId: 'external-123',
      externalListingUrl: 'https://test.com/external-123'
    });
    
    registry.register(testAdapter);

    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'user-1', status: 'DRAFT' });
    prisma.marketplace.findUnique.mockResolvedValue({ id: 'mp-1', type: 'TEST_MARKETPLACE', name: 'Test MP' });
    prisma.marketplaceAccount.findFirst.mockResolvedValue({ id: 'acc-1', userId: 'user-1', marketplaceId: 'mp-1' });

    const result = await service.publishListing('user-1', 'item-1', 'mp-1', {
      title: 'Item', description: 'Desc', price: 100, imageUrls: []
    });

    expect(result.status).toBe(MarketplaceOperationStatus.SUCCESS);
    expect(result.externalListingId).toBe('external-123');
    expect(result.externalListingUrl).toBe('https://test.com/external-123');
  });

  it('5. Marketplace errors are normalized', async () => {
    const testAdapter = new TestMarketplaceAdapter();
    vi.spyOn(testAdapter, 'createListing').mockResolvedValue({
      status: MarketplaceOperationStatus.FAILED,
      error: {
        category: MarketplaceErrorCategory.VALIDATION,
        message: 'Invalid price'
      }
    });
    
    registry.register(testAdapter);

    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'user-1', status: 'DRAFT' });
    prisma.marketplace.findUnique.mockResolvedValue({ id: 'mp-1', type: 'TEST_MARKETPLACE', name: 'Test MP' });
    prisma.marketplaceAccount.findFirst.mockResolvedValue({ id: 'acc-1', userId: 'user-1', marketplaceId: 'mp-1' });

    const result = await service.publishListing('user-1', 'item-1', 'mp-1', {
      title: 'Item', description: 'Desc', price: -1, imageUrls: []
    });

    expect(result.status).toBe(MarketplaceOperationStatus.FAILED);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.VALIDATION);
    expect(result.error?.message).toBe('Invalid price');
  });

  it('6. Unsupported capabilities are handled via MANUAL_REQUIRED', async () => {
    const testAdapter = new TestMarketplaceAdapter();
    vi.spyOn(testAdapter, 'supportsCreateListing').mockReturnValue(false);
    registry.register(testAdapter);

    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'user-1', status: 'DRAFT' });
    prisma.marketplace.findUnique.mockResolvedValue({ id: 'mp-1', type: 'TEST_MARKETPLACE', name: 'Test MP' });
    prisma.marketplaceAccount.findFirst.mockResolvedValue({ id: 'acc-1', userId: 'user-1', marketplaceId: 'mp-1' });

    const result = await service.publishListing('user-1', 'item-1', 'mp-1', {
      title: 'Item', description: 'Desc', price: 100, imageUrls: []
    });

    expect(result.status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
    expect(result.requiresManualAction).toBe(true);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.UNSUPPORTED);
  });

  it('7. Manual-required result is represented correctly', async () => {
    const testAdapter = new TestMarketplaceAdapter();
    vi.spyOn(testAdapter, 'createListing').mockResolvedValue({
      status: MarketplaceOperationStatus.MANUAL_REQUIRED,
      requiresManualAction: true
    });
    
    registry.register(testAdapter);

    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'user-1', status: 'DRAFT' });
    prisma.marketplace.findUnique.mockResolvedValue({ id: 'mp-1', type: 'TEST_MARKETPLACE', name: 'Test MP' });
    prisma.marketplaceAccount.findFirst.mockResolvedValue({ id: 'acc-1', userId: 'user-1', marketplaceId: 'mp-1' });

    const result = await service.publishListing('user-1', 'item-1', 'mp-1', {
      title: 'Item', description: 'Desc', price: 100, imageUrls: []
    });

    expect(result.status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
    
    expect(prisma.marketplaceListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DRAFT'
        })
      })
    );
  });

  it('8. Marketplace account ownership is enforced where applicable', async () => {
    const testAdapter = new TestMarketplaceAdapter();
    registry.register(testAdapter);

    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'user-1', status: 'DRAFT' });
    prisma.marketplace.findUnique.mockResolvedValue({ id: 'mp-1', type: 'TEST_MARKETPLACE', name: 'Test MP' });
    // Simulate user has no account for this marketplace
    prisma.marketplaceAccount.findFirst.mockResolvedValue(null);

    const result = await service.publishListing('user-1', 'item-1', 'mp-1', {
      title: 'Item', description: 'Desc', price: 100, imageUrls: []
    });

    expect(result.status).toBe(MarketplaceOperationStatus.FAILED);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.AUTHENTICATION);
  });

  it('9. Item ownership is strictly enforced', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 'item-1', userId: 'other-user', status: 'DRAFT' });

    await expect(
      service.publishListing('user-1', 'item-1', 'mp-1', {
        title: 'Item', description: 'Desc', price: 100, imageUrls: []
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
