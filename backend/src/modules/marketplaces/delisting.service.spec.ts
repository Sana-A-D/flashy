// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DelistingService } from './delisting.service';
import { NotFoundError, UnauthorizedError, AppError } from '../../shared/errors';
import { MarketplaceRegistry } from './marketplace.registry';
import { 
  MarketplaceAdapter, 
  MarketplaceOperationResult, 
  MarketplaceOperationStatus 
} from './marketplace.types';

const mockPrisma = vi.hoisted(() => ({
  item: { findUnique: vi.fn() },
  marketplaceAccount: { findFirst: vi.fn() },
  marketplaceListing: { update: vi.fn() },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    item = mockPrisma.item;
    marketplaceAccount = mockPrisma.marketplaceAccount;
    marketplaceListing = mockPrisma.marketplaceListing;
  },
  ItemStatus: { SOLD: 'SOLD', LISTED: 'LISTED' },
  ListingStatus: { ACTIVE: 'ACTIVE', ENDED: 'ENDED', SOLD: 'SOLD' },
}));

// Mock Adapter
class MockAdapter implements MarketplaceAdapter {
  constructor(
    public supportsEnd: boolean,
    public endResult: MarketplaceOperationResult
  ) {}
  getMarketplaceId() { return 'MOCK'; }
  supportsCreateListing() { return false; }
  supportsUpdateListing() { return false; }
  supportsEndListing() { return this.supportsEnd; }
  async createListing() { return { status: MarketplaceOperationStatus.FAILED }; }
  async updateListing() { return { status: MarketplaceOperationStatus.FAILED }; }
  async endListing() { return this.endResult; }
}

describe('DelistingService', () => {
  let registry: MarketplaceRegistry;
  let service: DelistingService;

  beforeEach(() => {
    vi.clearAllMocks();
    registry = new MarketplaceRegistry();
    service = new DelistingService(registry);
  });

  describe('performDelisting', () => {
    it('1. Rejects unauthorized item', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'wrong-user',
        status: 'SOLD',
        listings: [],
      });

      await expect(service.performDelisting('user-1', 'item-1'))
        .rejects.toThrow(UnauthorizedError);
    });

    it('2. Rejects non-SOLD item', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED',
        listings: [],
      });

      await expect(service.performDelisting('user-1', 'item-1'))
        .rejects.toThrow(AppError);
    });

    it('3. Returns empty array if no active listings', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD',
        listings: [
          { id: 'l1', status: 'ENDED', marketplace: { id: 'm1', type: 'MOCK1' } }
        ],
        sale: { marketplaceListingId: 'l1' }
      });

      const results = await service.performDelisting('user-1', 'item-1');
      expect(results).toEqual([]);
    });

    it('4. Returns MANUAL_REQUIRED for unsupported adapter', async () => {
      const mockAdapter = new MockAdapter(false, { status: MarketplaceOperationStatus.FAILED });
      registry.register(mockAdapter);

      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD',
        listings: [
          { id: 'l1', status: 'ACTIVE', externalListingId: 'ext-1', marketplace: { id: 'm1', name: 'Mock', type: 'MOCK' } }
        ],
      });
      mockPrisma.marketplaceAccount.findFirst.mockResolvedValueOnce({ id: 'acc-1' });

      const results = await service.performDelisting('user-1', 'item-1');
      
      expect(results[0].status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
      expect(mockPrisma.marketplaceListing.update).not.toHaveBeenCalled();
    });

    it('5. Successfully ends listing and updates DB', async () => {
      const mockAdapter = new MockAdapter(true, { status: MarketplaceOperationStatus.SUCCESS });
      registry.register(mockAdapter);

      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD',
        listings: [
          { id: 'l1', status: 'ACTIVE', externalListingId: 'ext-1', marketplace: { id: 'm1', name: 'Mock', type: 'MOCK' } }
        ],
      });
      mockPrisma.marketplaceAccount.findFirst.mockResolvedValueOnce({ id: 'acc-1' });

      const results = await service.performDelisting('user-1', 'item-1');
      
      expect(results[0].status).toBe(MarketplaceOperationStatus.SUCCESS);
      expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { status: 'ENDED' }
      });
    });

    it('6. Failed endListing does NOT mark listing ended', async () => {
      const mockAdapter = new MockAdapter(true, { status: MarketplaceOperationStatus.FAILED, error: { category: 'NETWORK', message: 'fail' } as any });
      registry.register(mockAdapter);

      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD',
        listings: [
          { id: 'l1', status: 'ACTIVE', externalListingId: 'ext-1', marketplace: { id: 'm1', name: 'Mock', type: 'MOCK' } }
        ],
      });
      mockPrisma.marketplaceAccount.findFirst.mockResolvedValueOnce({ id: 'acc-1' });

      const results = await service.performDelisting('user-1', 'item-1');
      
      expect(results[0].status).toBe(MarketplaceOperationStatus.FAILED);
      expect(results[0].error).toBe('fail');
      expect(mockPrisma.marketplaceListing.update).not.toHaveBeenCalled();
    });

    it('7. Multiple marketplaces process independently', async () => {
      class Adapter1 extends MockAdapter {
        getMarketplaceId() { return 'MOCK1'; }
      }
      class Adapter2 extends MockAdapter {
        getMarketplaceId() { return 'MOCK2'; }
      }

      registry.register(new Adapter1(true, { status: MarketplaceOperationStatus.SUCCESS }));
      registry.register(new Adapter2(true, { status: MarketplaceOperationStatus.FAILED, error: { category: 'NETWORK', message: 'err' } as any }));

      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD',
        listings: [
          { id: 'l1', status: 'ACTIVE', externalListingId: 'ext-1', marketplace: { id: 'm1', name: 'Mock1', type: 'MOCK1' } },
          { id: 'l2', status: 'ACTIVE', externalListingId: 'ext-2', marketplace: { id: 'm2', name: 'Mock2', type: 'MOCK2' } }
        ],
      });
      mockPrisma.marketplaceAccount.findFirst.mockResolvedValueOnce({ id: 'acc-1' }).mockResolvedValueOnce({ id: 'acc-2' });

      const results = await service.performDelisting('user-1', 'item-1');
      
      expect(results.length).toBe(2);
      expect(results.find(r => r.marketplace === 'Mock1')?.status).toBe(MarketplaceOperationStatus.SUCCESS);
      expect(results.find(r => r.marketplace === 'Mock2')?.status).toBe(MarketplaceOperationStatus.FAILED);
      expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledTimes(1); // Only for MOCK1
    });
  });
});
