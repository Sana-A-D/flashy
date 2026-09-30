import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).optional().default('all'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export interface ProfitMetricsDto {
  totalRevenue: number;
  totalCostOfGoods: number;
  totalFees: number;
  totalShipping: number;
  totalOtherExpenses: number;
  netProfit: number;
  itemsSold: number;
  profitMarginPercent: number;
  averageSalePrice: number;
  averageProfitPerItem: number;
}

export interface SalesHistoryItemDto {
  saleId: string;
  itemId: string;
  itemTitle: string;
  itemBrand: string | null;
  salePrice: number;
  purchaseCost: number;
  marketplaceFees: number;
  shippingCost: number;
  otherExpenses: number;
  netProfit: number;
  soldAt: string;
  marketplaceName: string | null;
}
