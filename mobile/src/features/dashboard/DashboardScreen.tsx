import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuthStore } from '../auth/store/useAuthStore';
import { useItems } from '../../hooks/useItems';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { centsToCurrency } from '../../utils/currency';
import {
  ScreenContainer,
  AppButton,
  StatusBadge,
  LoadingState,
  ErrorState,
  PrettyIcon,
} from '../../components';

export const DashboardScreen = ({ navigation }: any) => {
  const user = useAuthStore((state) => state.user);
  const { data: items = [], isLoading, error, refetch } = useItems();

  // Physical lifecycle counts
  const totalItems = items.length;
  const inInventory = items.filter((i: any) => i.status === 'INVENTORY' || i.status === 'DRAFT').length;
  const readyToList = items.filter((i: any) => i.preparationStatus === 'READY_TO_LIST' && i.status !== 'SOLD').length;
  const activeListings = items.filter((i: any) => i.status === 'LISTED').length;
  const soldItems = items.filter((i: any) => i.status === 'SOLD').length;

  // Actionable items needing attention
  const needsPreparation = items.filter(
    (i: any) => i.preparationStatus === 'UNPREPARED' && i.status !== 'SOLD' && i.status !== 'ARCHIVED'
  );
  const readyForMarketplace = items.filter(
    (i: any) => i.preparationStatus === 'READY_TO_LIST' && i.status !== 'LISTED' && i.status !== 'SOLD'
  );

  // Recent items with photography
  const recentItems = items.slice(0, 5);

  return (
    <ScreenContainer
      title="Workspace"
      subtitle="Secondary inventory management"
      activeTab="Dashboard"
      rightAction={
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerSettingBtn}
          accessibilityLabel="Settings"
        >
          <PrettyIcon name="settings" size="xs" variant="neutral" />
        </TouchableOpacity>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {error ? (
          <ErrorState
            message="Could not load inventory overview."
            onRetry={refetch}
          />
        ) : null}

        {/* 1. Resale Workspace Hero with Direct Scan & Manual Intake */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.workspaceGreeting}>
              Welcome back, {user?.name || 'Reseller'}
            </Text>
            <Text style={styles.workspaceSummary}>
              {totalItems} total items • {activeListings} listed • {soldItems} sold
            </Text>
          </View>

          <View style={styles.heroActionsRow}>
            <AppButton
              title="Scan Item"
              onPress={() => navigation.navigate('AddItem')}
              variant="primary"
              size="md"
              style={styles.heroPrimaryBtn}
            />
            <AppButton
              title="Add Manually"
              onPress={() => navigation.navigate('AddItem')}
              variant="outline"
              size="md"
              style={styles.heroSecondaryBtn}
            />
          </View>
        </View>

        {/* 2. Concise Resale Status Row - Clean Divider Layout */}
        <View style={styles.metricsBar}>
          <TouchableOpacity
            style={styles.metricCol}
            onPress={() => navigation.navigate('Inventory')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricVal}>{inInventory}</Text>
            <Text style={styles.metricLabel}>In Stock</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricCol}
            onPress={() => navigation.navigate('Inventory')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: colors.warning }]}>{readyToList}</Text>
            <Text style={styles.metricLabel}>Ready to List</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricCol}
            onPress={() => navigation.navigate('Inventory')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: colors.primary }]}>{activeListings}</Text>
            <Text style={styles.metricLabel}>Active Listed</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricCol}
            onPress={() => navigation.navigate('Analytics')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: colors.success }]}>{soldItems}</Text>
            <Text style={styles.metricLabel}>Sold Items</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Needs Attention - Actionable reseller tasks */}
        {(readyForMarketplace.length > 0 || needsPreparation.length > 0) && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>NEEDS ATTENTION</Text>

            {readyForMarketplace.length > 0 && (
              <TouchableOpacity
                style={styles.attentionRow}
                onPress={() => navigation.navigate('Inventory')}
                activeOpacity={0.7}
              >
                <View style={styles.attentionIconWrap}>
                  <Text style={styles.attentionIconText}>⚡</Text>
                </View>
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>
                    {readyForMarketplace.length} {readyForMarketplace.length === 1 ? 'item' : 'items'} ready to publish
                  </Text>
                  <Text style={styles.attentionDesc}>
                    Preparation and photos complete. Publish to eBay or copy manual channels.
                  </Text>
                </View>
                <PrettyIcon name="chevronRight" size="xs" variant="neutral" />
              </TouchableOpacity>
            )}

            {needsPreparation.length > 0 && (
              <TouchableOpacity
                style={styles.attentionRow}
                onPress={() => navigation.navigate('Inventory')}
                activeOpacity={0.7}
              >
                <View style={[styles.attentionIconWrap, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={styles.attentionIconText}>📦</Text>
                </View>
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>
                    {needsPreparation.length} {needsPreparation.length === 1 ? 'item' : 'items'} awaiting inspection
                  </Text>
                  <Text style={styles.attentionDesc}>
                    Assign storage bin, clean, and verify specs to advance to ready to list.
                  </Text>
                </View>
                <PrettyIcon name="chevronRight" size="xs" variant="neutral" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 4. Recent Items with Photography */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionRowBetween}>
            <Text style={styles.sectionHeading}>RECENT INVENTORY</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
              <Text style={styles.viewAllText}>View All ({totalItems}) →</Text>
            </TouchableOpacity>
          </View>

          {recentItems.length > 0 ? (
            recentItems.map((item: any) => {
              const photoUri = item.photos && item.photos.length > 0 ? item.photos[0].url : null;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentItemRow}
                  onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemPhotoWrap}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.itemPhoto} />
                    ) : (
                      <PrettyIcon name="camera" size="xs" variant="neutral" />
                    )}
                  </View>

                  <View style={styles.itemMetaWrap}>
                    <Text style={styles.itemTitleText} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemSubText} numberOfLines={1}>
                      {[item.brand, item.category].filter(Boolean).join(' • ') || 'Uncategorized'}
                    </Text>
                  </View>

                  <View style={styles.itemPriceWrap}>
                    {item.marketPrice !== undefined && item.marketPrice !== null ? (
                      <Text style={styles.itemPriceText}>${centsToCurrency(item.marketPrice)}</Text>
                    ) : item.purchasePrice !== undefined && item.purchasePrice !== null ? (
                      <Text style={styles.itemCostText}>Cost ${centsToCurrency(item.purchasePrice)}</Text>
                    ) : null}
                    <StatusBadge status={item.status} style={styles.itemStatusBadge} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyRecentWrap}>
              <Text style={styles.emptyRecentText}>No inventory items recorded yet.</Text>
            </View>
          )}
        </View>

        {isLoading && items.length === 0 && <LoadingState message="Loading workspace..." />}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  headerSettingBtn: {
    padding: 6,
  },
  heroSection: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  heroHeader: {
    marginBottom: spacing.md,
  },
  workspaceGreeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  workspaceSummary: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 3,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroPrimaryBtn: {
    flex: 1.2,
  },
  heroSecondaryBtn: {
    flex: 1,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    marginHorizontal: -spacing.screenPadding,
    paddingHorizontal: spacing.screenPadding,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderSubtle,
  },
  metricVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  metricLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: typography.weights.medium,
  },
  sectionContainer: {
    marginTop: spacing.xl,
  },
  sectionHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  sectionRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewAllText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primaryDark,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  attentionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  attentionIconText: {
    fontSize: 16,
  },
  attentionTextWrap: {
    flex: 1,
    marginRight: spacing.xs,
  },
  attentionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  attentionDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemPhotoWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  itemPhoto: {
    width: 44,
    height: 44,
  },
  itemMetaWrap: {
    flex: 1,
    marginRight: spacing.xs,
  },
  itemTitleText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  itemSubText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPriceWrap: {
    alignItems: 'flex-end',
  },
  itemPriceText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  itemCostText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  itemStatusBadge: {
    marginTop: 3,
  },
  emptyRecentWrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
