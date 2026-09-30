// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';

const mockPrisma = vi.hoisted(() => ({
  sale: {
    findMany: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    sale = mockPrisma.sale;
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfitMetrics', () => {
    it('1. Returns zeroed metrics when no sales exist', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([]);

      const metrics = await AnalyticsService.getProfitMetrics('user-1', { period: 'all' });

      expect(metrics).toEqual({
        totalRevenue: 0,
        totalCostOfGoods: 0,
        totalFees: 0,
        totalShipping: 0,
        totalOtherExpenses: 0,
        netProfit: 0,
        itemsSold: 0,
        profitMarginPercent: 0,
        averageSalePrice: 0,
        averageProfitPerItem: 0,
      });
    });

    it('2. Correctly aggregates multiple sales and profit metrics', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        {
          id: 'sale-1',
          itemId: 'item-1',
          salePrice: 10000, // $100.00
          marketplaceFees: 1300, // $13.00
          shippingCost: 800, // $8.00
          otherExpenses: 200, // $2.00
          item: { purchasePrice: 2500 }, // $25.00 purchase price
          // Net profit = 10000 - 2500 - 1300 - 800 - 200 = 5200 ($52.00)
        },
        {
          id: 'sale-2',
          itemId: 'item-2',
          salePrice: 5000, // $50.00
          marketplaceFees: 600, // $6.00
          shippingCost: 500, // $5.00
          otherExpenses: 100, // $1.00
          item: { purchasePrice: 1000 }, // $10.00 purchase price
          // Net profit = 5000 - 1000 - 600 - 500 - 100 = 2800 ($28.00)
        },
      ]);

      const metrics = await AnalyticsService.getProfitMetrics('user-1', { period: 'all' });

      expect(metrics.totalRevenue).toBe(15000);
      expect(metrics.totalCostOfGoods).toBe(3500);
      expect(metrics.totalFees).toBe(1900);
      expect(metrics.totalShipping).toBe(1300);
      expect(metrics.totalOtherExpenses).toBe(300);
      expect(metrics.netProfit).toBe(8000); // 5200 + 2800
      expect(metrics.itemsSold).toBe(2);
      // Margin = (8000 / 15000) * 100 = 53.33%
      expect(metrics.profitMarginPercent).toBe(53.33);
      expect(metrics.averageSalePrice).toBe(7500);
      expect(metrics.averageProfitPerItem).toBe(4000);
    });

    it('3. Applies period filter properly', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([]);

      await AnalyticsService.getProfitMetrics('user-1', { period: '30d' });

      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            item: { userId: 'user-1' },
            soldAt: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getSalesHistory', () => {
    it('4. Formats sales history with item details and marketplace attribution', async () => {
      const mockDate = new Date('2026-09-01T12:00:00Z');
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        {
          id: 'sale-1',
          itemId: 'item-1',
          salePrice: 6000,
          marketplaceFees: 700,
          shippingCost: 500,
          otherExpenses: 0,
          soldAt: mockDate,
          item: {
            id: 'item-1',
            title: 'Vintage Denim Jacket',
            brand: "Levi's",
            purchasePrice: 1500,
          },
          marketplaceListing: {
            marketplace: {
              name: 'eBay',
            },
          },
        },
      ]);

      const history = await AnalyticsService.getSalesHistory('user-1', { period: 'all' });

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        saleId: 'sale-1',
        itemId: 'item-1',
        itemTitle: 'Vintage Denim Jacket',
        itemBrand: "Levi's",
        salePrice: 6000,
        purchaseCost: 1500,
        marketplaceFees: 700,
        shippingCost: 500,
        otherExpenses: 0,
        netProfit: 3300, // 6000 - 1500 - 700 - 500 = 3300
        soldAt: mockDate.toISOString(),
        marketplaceName: 'eBay',
      });
    });
  });
});
