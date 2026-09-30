// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaleService } from './sale.service';
import { AppError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { DelistingService } from '../marketplaces/delisting.service';

// Mock Prisma
const mockTx = {
  item: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  sale: {
    create: vi.fn(),
  },
  marketplaceListing: {
    findUnique: vi.fn(),
    update: vi.fn(),
  }
};

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      $transaction = vi.fn((callback) => callback(mockTx));
      item = {
        findUnique: vi.fn(),
      };
    }
  };
});

describe('SaleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(DelistingService.prototype, 'performDelisting').mockResolvedValue([]);
  });

  describe('Profit Calculation', () => {
    it('1. Calculates profit correctly with all expenses', () => {
      const profit = SaleService.calculateProfit(7200, 800, 1000, 700, 200);
      expect(profit).toBe(4500); // 72 - 8 - 10 - 7 - 2 = 45
    });

    it('2. Calculates profit with zero expenses', () => {
      const profit = SaleService.calculateProfit(5000, 0, 0, 0, 0);
      expect(profit).toBe(5000);
    });

    it('3. Calculates negative profit properly', () => {
      const profit = SaleService.calculateProfit(1000, 2000, 0, 0, 0);
      expect(profit).toBe(-1000);
    });
  });

  describe('recordSale', () => {
    it('4. Rejects nonexistent item', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce(null);

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 1000,
        marketplaceFees: 0,
        shippingCost: 0,
        otherExpenses: 0
      })).rejects.toThrow(NotFoundError);
    });

    it('5. Rejects unauthorized item', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'wrong-user',
        status: 'LISTED'
      });

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 1000,
        marketplaceFees: 0,
        shippingCost: 0,
        otherExpenses: 0
      })).rejects.toThrow(UnauthorizedError);
    });

    it('6. Rejects already SOLD item', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD'
      });

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 1000,
        marketplaceFees: 0,
        shippingCost: 0,
        otherExpenses: 0
      })).rejects.toThrow(AppError);
    });

    it('7. Rejects ARCHIVED item', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'ARCHIVED'
      });

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 1000,
        marketplaceFees: 0,
        shippingCost: 0,
        otherExpenses: 0
      })).rejects.toThrow(AppError);
    });

    it('8. Rejects if sale record already exists', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED',
        sale: { id: 'sale-1' }
      });

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 1000,
        marketplaceFees: 0,
        shippingCost: 0,
        otherExpenses: 0
      })).rejects.toThrow(AppError);
    });

    it('9. Rejects invalid marketplace listing', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED'
      });
      mockTx.marketplaceListing.findUnique.mockResolvedValueOnce(null);

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 1000,
        marketplaceListingId: 'listing-1'
      })).rejects.toThrow(NotFoundError);
    });

    it('10. Successfully records sale without marketplace', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED',
        purchasePrice: 500
      });

      mockTx.sale.create.mockResolvedValueOnce({ id: 'new-sale' });

      const result = await SaleService.recordSale('user-1', 'item-1', {
        salePrice: 2000,
        marketplaceFees: 100,
        shippingCost: 200,
        otherExpenses: 50
      });

      expect(mockTx.sale.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          salePrice: 2000,
          marketplaceFees: 100,
          shippingCost: 200,
          otherExpenses: 50,
          itemId: 'item-1'
        })
      }));

      expect(mockTx.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: 'SOLD' }
      });

      expect(result.financials.profit).toBe(1150); // 2000 - 500 - 100 - 200 - 50 = 1150
      expect(result.financials.purchaseCost).toBe(500);
    });

    it('11. Successfully records sale with marketplace listing', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED',
        purchasePrice: 0
      });

      mockTx.marketplaceListing.findUnique.mockResolvedValueOnce({
        id: 'listing-1',
        itemId: 'item-1',
        item: { userId: 'user-1' }
      });

      mockTx.sale.create.mockResolvedValueOnce({ id: 'new-sale' });

      await SaleService.recordSale('user-1', 'item-1', {
        salePrice: 2000,
        marketplaceListingId: 'listing-1'
      });

      expect(mockTx.marketplaceListing.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'listing-1' },
        data: expect.objectContaining({ status: 'SOLD' })
      }));
    });

    it('12. Synchronizes sale with cross-listing delisting cleanup', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED',
        purchasePrice: 1000
      });

      mockTx.sale.create.mockResolvedValueOnce({ id: 'new-sale' });

      // DelistingService mock will be called
      const mockDelist = vi.spyOn(DelistingService.prototype, 'performDelisting')
        .mockResolvedValueOnce([
          { marketplace: 'eBay', status: 'FAILED', error: 'UNSUPPORTED' },
          { marketplace: 'Poshmark', status: 'SUCCESS' }
        ] as any);

      const result = await SaleService.recordSale('user-1', 'item-1', {
        salePrice: 3000,
        marketplaceFees: 150,
        shippingCost: 350,
        otherExpenses: 0
      });

      expect(mockDelist).toHaveBeenCalledWith('user-1', 'item-1');
      expect(result.syncResults).toHaveLength(2);
      expect(result.syncResults).toEqual([
        { marketplace: 'eBay', status: 'FAILED', error: 'UNSUPPORTED' },
        { marketplace: 'Poshmark', status: 'SUCCESS' }
      ]);
      expect(result.financials.profit).toBe(1500); // 3000 - 1000 - 150 - 350 = 1500
    });

    it('13. Rejects sale on an item that is already SOLD', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'SOLD',
        purchasePrice: 1000
      });

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 3000
      })).rejects.toThrow('Item is already sold');
    });

    it('14. Rejects sale when a sale record already exists for the item', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'LISTED',
        sale: { id: 'existing-sale' }
      });

      await expect(SaleService.recordSale('user-1', 'item-1', {
        salePrice: 3000
      })).rejects.toThrow('A sale record already exists for this item');
    });

    it('15. Rejects sale attempt by another user (security check)', async () => {
      mockTx.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-actual-owner',
        status: 'LISTED'
      });

      await expect(SaleService.recordSale('attacker-user-id', 'item-1', {
        salePrice: 5000
      })).rejects.toThrow(UnauthorizedError);
    });
  });
});
