import { useQuery } from '@tanstack/react-query';
import { analyticsApi, ProfitMetrics, SalesHistoryItem } from '../services/api/analytics';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export function useProfitMetrics(period: AnalyticsPeriod = 'all') {
  return useQuery({
    queryKey: ['analytics_metrics', period],
    queryFn: async () => {
      const res = await analyticsApi.getMetrics(period);
      return res.data;
    },
  });
}

export function useSalesHistory(period: AnalyticsPeriod = 'all') {
  return useQuery({
    queryKey: ['analytics_sales_history', period],
    queryFn: async () => {
      const res = await analyticsApi.getSalesHistory(period);
      return res.data;
    },
  });
}
