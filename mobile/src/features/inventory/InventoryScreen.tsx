import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useItems } from '../../hooks/useItems';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { centsToCurrency } from '../../utils/currency';
import {
  ScreenContainer,
  AppCard,
  StatusBadge,
  EmptyState,
  LoadingState,
  ErrorState,
  PrettyIcon,
} from '../../components';

export const InventoryScreen = ({ navigation }: any) => {
  const { data: items = [], isLoading, error, refetch } = useItems();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'INVENTORY' | 'READY' | 'LISTED' | 'SOLD'>('ALL');

  const filteredItems = items.filter((item: any) => {
    if (filter === 'INVENTORY' && item.status !== 'INVENTORY' && item.status !== 'DRAFT') return false;
    if (filter === 'READY' && item.preparationStatus !== 'READY_TO_LIST') return false;
    if (filter === 'LISTED' && item.status !== 'LISTED') return false;
    if (filter === 'SOLD' && item.status !== 'SOLD') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const brandMatch = item.brand?.toLowerCase().includes(q);
      const skuMatch = item.sku?.toLowerCase().includes(q);
      const locMatch = item.storageLocation?.name?.toLowerCase().includes(q);
      return titleMatch || brandMatch || skuMatch || locMatch;
    }

    return true;
  });

  const renderItemCard = ({ item }: { item: any }) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    const photoUri = hasPhoto ? item.photos[0].url : null;

    return (
      <AppCard
        variant="elevated"
        onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
        style={styles.itemCard}
      >
        <View style={styles.cardRow}>
          {/* Physical Photo / Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.thumbnail} />
            ) : (
              <PrettyIcon name="camera" size="sm" variant="cream" containerStyle={styles.placeholderThumbnail} />
            )}
          </View>

          {/* Details */}
          <View style={styles.itemInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>

            {(item.brand || item.category) && (
              <Text style={styles.brandText} numberOfLines={1}>
                {[item.brand, item.category].filter(Boolean).join(' • ')}
              </Text>
            )}

            {/* Badges: Status + Preparation + Storage Bin */}
            <View style={styles.badgesRow}>
              <StatusBadge status={item.status} />

              {item.preparationStatus === 'READY_TO_LIST' && (
                <StatusBadge
                  status="READY_TO_LIST"
                  label="Ready"
                  style={styles.pillMargin}
                />
              )}

              {item.storageLocation?.name && (
                <View style={styles.locationTag}>
                  <Text style={styles.locationTagText} numberOfLines={1}>
                    📍 {item.storageLocation.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Financial metadata */}
            <View style={styles.priceRow}>
              {item.purchasePrice !== undefined && item.purchasePrice !== null && (
                <Text style={styles.costText}>
                  Cost: ${centsToCurrency(item.purchasePrice)}
                </Text>
              )}
              {item.marketPrice !== undefined && item.marketPrice !== null && (
                <Text style={styles.marketPriceText}>
                  Target: ${centsToCurrency(item.marketPrice)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </AppCard>
    );
  };

  return (
    <ScreenContainer
      title="Inventory"
      subtitle={`${filteredItems.length} items listed`}
      activeTab="Inventory"
      rightAction={
        <TouchableOpacity
          onPress={() => navigation.navigate('AddItem')}
          style={styles.headerAddBtn}
          accessibilityLabel="Add Item"
        >
          <Text style={styles.headerAddBtnText}>＋ Add Item</Text>
        </TouchableOpacity>
      }
    >
      {/* Search & Filter Header */}
      <View style={styles.topFilterSection}>
        <View style={styles.searchContainer}>
          <PrettyIcon name="search" size="xs" variant="silk" containerStyle={{ marginRight: spacing.xs }} />
          <TextInput
            placeholder="Search title, brand, SKU, storage bin..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            onPress={() => setFilter('ALL')}
            style={[styles.tab, filter === 'ALL' && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === 'ALL' && styles.tabTextActive]}>
              All ({items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('READY')}
            style={[styles.tab, filter === 'READY' && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === 'READY' && styles.tabTextActive]}>
              Ready to List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('LISTED')}
            style={[styles.tab, filter === 'LISTED' && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === 'LISTED' && styles.tabTextActive]}>
              Listed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('SOLD')}
            style={[styles.tab, filter === 'SOLD' && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === 'SOLD' && styles.tabTextActive]}>
              Sold
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List Content */}
      {isLoading && items.length === 0 ? (
        <LoadingState message="Loading inventory..." />
      ) : error ? (
        <ErrorState message="Could not load inventory items." onRetry={refetch} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItemCard}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title={search ? 'No matching items' : 'Your inventory is empty'}
              description={
                search
                  ? 'Try adjusting your search terms or filter selection.'
                  : 'Add your first physical item to start managing inventory.'
              }
              actionTitle={search ? undefined : 'Add First Item'}
              onAction={() => navigation.navigate('AddItem')}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  headerAddBtnText: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  topFilterSection: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    height: 40,
    marginBottom: spacing.xs,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  clearSearch: {
    fontSize: 14,
    color: colors.textMuted,
    padding: spacing.xxs,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    padding: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    padding: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  brandText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  pillMargin: {
    marginLeft: spacing.xxs,
  },
  locationTag: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginLeft: spacing.xxs,
  },
  locationTagText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 5,
  },
  costText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  marketPriceText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
