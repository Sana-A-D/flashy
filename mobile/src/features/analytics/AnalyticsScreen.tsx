import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useProfitMetrics, useSalesHistory, AnalyticsPeriod } from '../../hooks/useAnalytics';
import { colors, spacing, typography, radii } from '../../constants/theme';
import {
  ScreenContainer,
  AppCard,
  SectionHeader,
  LoadingState,
  ErrorState,
} from '../../components';

export const AnalyticsScreen = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('all');
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useProfitMetrics(period);
  const { data: sales = [], isLoading: salesLoading, error: salesError, refetch: refetchSales } = useSalesHistory(period);

  const isLoading = metricsLoading || salesLoading;
  const error = metricsError || salesError;

  const handleRefresh = () => {
    refetchMetrics();
    refetchSales();
  };

  const revenue = metrics?.totalRevenue || 0;
  const profit = metrics?.netProfit || 0;
  const itemsSold = metrics?.itemsSold || 0;
  const avgProfit = metrics?.averageProfitPerItem || 0;

  return (
    <ScreenContainer
      title="Sales & Profit"
      subtitle="Financial performance and sales history"
      activeTab="Analytics"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['7d', '30d', '90d', 'all'] as AnalyticsPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'all' ? 'All Time' : p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <ErrorState message="Could not load analytics." onRetry={handleRefresh} />
        ) : null}

        {/* Core Financial Metrics */}
        <View style={styles.statsGrid}>
          <AppCard variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>Total Net Profit</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              ${profit.toFixed(2)}
            </Text>
            <Text style={styles.statSub}>after fees & shipping</Text>
          </AppCard>

          <AppCard variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>Total Gross Revenue</Text>
            <Text style={styles.statValue}>${revenue.toFixed(2)}</Text>
            <Text style={styles.statSub}>across all channels</Text>
          </AppCard>

          <AppCard variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>Total Items Sold</Text>
            <Text style={styles.statValue}>{itemsSold}</Text>
            <Text style={styles.statSub}>completed orders</Text>
          </AppCard>

          <AppCard variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Profit / Item</Text>
            <Text style={styles.statValue}>${avgProfit.toFixed(2)}</Text>
            <Text style={styles.statSub}>margin efficiency</Text>
          </AppCard>
        </View>

        {/* Recent Transactions List */}
        <SectionHeader
          title="Sales Activity"
          subtitle="Recorded sales with individual net profit"
          style={{ marginTop: spacing.lg }}
        />

        {sales.length > 0 ? (
          sales.map((sale) => (
            <AppCard key={sale.saleId} variant="flat" style={styles.saleRowCard}>
              <View style={styles.saleInfo}>
                <Text style={styles.saleItemTitle} numberOfLines={1}>
                  {sale.itemTitle || 'Resale Item'}
                </Text>
                <Text style={styles.saleMeta}>
                  {sale.marketplaceName || 'Direct'} • {new Date(sale.soldAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.saleAmounts}>
                <Text style={styles.salePrice}>+${Number(sale.salePrice).toFixed(2)}</Text>
                <Text
                  style={[
                    styles.saleProfit,
                    { color: sale.netProfit >= 0 ? colors.success : colors.error },
                  ]}
                >
                  Profit: ${Number(sale.netProfit || 0).toFixed(2)}
                </Text>
              </View>
            </AppCard>
          ))
        ) : (
          <AppCard variant="muted" style={styles.noSalesCard}>
            <Text style={styles.noSalesText}>
              No sales recorded for this period.
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  periodChipActive: {
    backgroundColor: colors.text,
  },
  periodText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginVertical: spacing.xxs,
  },
  statSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  saleRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
  },
  saleInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  saleItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  saleMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saleAmounts: {
    alignItems: 'flex-end',
  },
  salePrice: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  saleProfit: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  noSalesCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  noSalesText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
