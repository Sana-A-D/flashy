import { PrismaClient } from '@prisma/client';
import { AnalyticsQueryInput, ProfitMetricsDto, SalesHistoryItemDto } from './analytics.schema';
import { SaleService } from '../sales/sale.service';

const prisma = new PrismaClient();

export class AnalyticsService {
  private static getPeriodStartDate(period: string): Date | null {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return null;
    }
  }

  static async getProfitMetrics(userId: string, query: AnalyticsQueryInput): Promise<ProfitMetricsDto> {
    const startDate = this.getPeriodStartDate(query.period || 'all');

    const sales = await prisma.sale.findMany({
      where: {
        item: {
          userId,
        },
        ...(startDate ? { soldAt: { gte: startDate } } : {}),
      },
      include: {
        item: {
          select: {
            purchasePrice: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let totalFees = 0;
    let totalShipping = 0;
    let totalOtherExpenses = 0;
    let netProfit = 0;

    for (const sale of sales) {
      const purchaseCost = sale.item?.purchasePrice || 0;
      totalRevenue += sale.salePrice;
      totalCostOfGoods += purchaseCost;
      totalFees += sale.marketplaceFees;
      totalShipping += sale.shippingCost;
      totalOtherExpenses += sale.otherExpenses;

      const profit = SaleService.calculateProfit(
        sale.salePrice,
        purchaseCost,
        sale.marketplaceFees,
        sale.shippingCost,
        sale.otherExpenses
      );
      netProfit += profit;
    }

    const itemsSold = sales.length;
    const profitMarginPercent = totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 10000) / 100
      : 0;
    const averageSalePrice = itemsSold > 0 ? Math.round(totalRevenue / itemsSold) : 0;
    const averageProfitPerItem = itemsSold > 0 ? Math.round(netProfit / itemsSold) : 0;

    return {
      totalRevenue,
      totalCostOfGoods,
      totalFees,
      totalShipping,
      totalOtherExpenses,
      netProfit,
      itemsSold,
      profitMarginPercent,
      averageSalePrice,
      averageProfitPerItem,
    };
  }

  static async getSalesHistory(userId: string, query: AnalyticsQueryInput): Promise<SalesHistoryItemDto[]> {
    const startDate = this.getPeriodStartDate(query.period || 'all');

    const sales = await prisma.sale.findMany({
      where: {
        item: {
          userId,
        },
        ...(startDate ? { soldAt: { gte: startDate } } : {}),
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            brand: true,
            purchasePrice: true,
          },
        },
        marketplaceListing: {
          include: {
            marketplace: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        soldAt: 'desc',
      },
    });

    return sales.map((sale) => {
      const purchaseCost = sale.item?.purchasePrice || 0;
      const netProfit = SaleService.calculateProfit(
        sale.salePrice,
        purchaseCost,
        sale.marketplaceFees,
        sale.shippingCost,
        sale.otherExpenses
      );

      return {
        saleId: sale.id,
        itemId: sale.itemId,
        itemTitle: sale.item?.title || 'Unknown Item',
        itemBrand: sale.item?.brand || null,
        salePrice: sale.salePrice,
        purchaseCost,
        marketplaceFees: sale.marketplaceFees,
        shippingCost: sale.shippingCost,
        otherExpenses: sale.otherExpenses,
        netProfit,
        soldAt: sale.soldAt.toISOString(),
        marketplaceName: sale.marketplaceListing?.marketplace?.name || null,
      };
    });
  }
}
