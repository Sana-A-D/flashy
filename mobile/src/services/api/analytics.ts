import { apiClient } from './client';

export interface ProfitMetrics {
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

export interface SalesHistoryItem {
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

export const analyticsApi = {
  getMetrics: (period: '7d' | '30d' | '90d' | 'all' = 'all'): Promise<{ data: ProfitMetrics }> => {
    return apiClient.fetch(`/analytics/metrics?period=${period}`);
  },

  getSalesHistory: (period: '7d' | '30d' | '90d' | 'all' = 'all'): Promise<{ data: SalesHistoryItem[] }> => {
    return apiClient.fetch(`/analytics/sales-history?period=${period}`);
  },
};
