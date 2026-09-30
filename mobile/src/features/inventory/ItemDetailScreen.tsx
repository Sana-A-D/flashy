import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useItem, useUpdateItem, useArchiveItem } from '../../hooks/useItems';
import { useStorageLocations } from '../../hooks/useStorageLocations';
import { useMarketplaceConnections, useConnectMarketplace, usePublishToMarketplace } from '../../hooks/useMarketplaces';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { centsToCurrency } from '../../utils/currency';
import {
  ScreenContainer,
  AppCard,
  AppButton,
  StatusBadge,
  SectionHeader,
  LoadingState,
  ErrorState,
  PrettyIcon,
} from '../../components';

export const ItemDetailScreen = ({ route, navigation }: any) => {
  const id = route.params?.id || route.params?.itemId;
  const { data: item, isLoading, error, refetch } = useItem(id);
  const updateItemMutation = useUpdateItem();
  const archiveItemMutation = useArchiveItem();
  const { data: marketplaceConnections = [] } = useMarketplaceConnections();
  const connectMarketplaceMutation = useConnectMarketplace();
  const publishToMarketplaceMutation = usePublishToMarketplace(id);
  const [isPublishingEbay, setIsPublishingEbay] = useState(false);

  const { data: locations = [] } = useStorageLocations();
  const [isChangingBin, setIsChangingBin] = useState(false);

  if (isLoading) {
    return (
      <ScreenContainer title="Item Details" showBack={true} onBack={() => navigation.goBack()}>
        <LoadingState message="Loading item details..." />
      </ScreenContainer>
    );
  }

  if (error || !item) {
    return (
      <ScreenContainer title="Item Details" showBack={true} onBack={() => navigation.goBack()}>
        <ErrorState
          message="Could not load this item."
          onRetry={refetch}
        />
      </ScreenContainer>
    );
  }

  const photos = item.photos || [];
  const listings = item.listings || [];
  const sale = item.sale;

  // Preparation Step Transitions
  const handleSetPrep = async (newPrepStatus: 'UNPREPARED' | 'PREPARED' | 'READY_TO_LIST') => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: { preparationStatus: newPrepStatus },
      });
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update preparation status');
    }
  };

  const handleAssignLocation = async (locationId?: string) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: { storageLocationId: locationId || null },
      });
      setIsChangingBin(false);
    } catch (err: any) {
      Alert.alert('Error', 'Could not assign storage location');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Archive Physical Item',
      'Are you sure you want to archive this item from inventory? It will be marked as archived.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await archiveItemMutation.mutateAsync(item.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Archive Failed', err.message || 'Could not archive item');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer
      title={item.title || 'Item Details'}
      subtitle={item.sku ? `SKU: ${item.sku}` : `ID: ${item.id.slice(0, 8)}`}
      showBack={true}
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large Item Photography Showcase */}
        <View style={styles.photoSection}>
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {photos.map((p: any, idx: number) => (
                <Image key={p.id || idx} source={{ uri: p.url }} style={styles.photoItem} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoPlaceholder}>
              <PrettyIcon name="camera" size="md" variant="neutral" />
              <Text style={styles.photoPlaceholderText}>No photos attached to this item</Text>
            </View>
          )}
        </View>

        {/* 1. Item Header & Attributes */}
        <View style={styles.detailSection}>
          <View style={styles.headerStatusRow}>
            <StatusBadge status={item.status} />
            <Text style={styles.skuText}>{item.sku ? `SKU: ${item.sku}` : `ID: ${item.id.slice(0, 8)}`}</Text>
          </View>

          <Text style={styles.itemTitle}>{item.title}</Text>

          <View style={styles.metaRow}>
            {item.brand && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Brand </Text>
                <Text style={styles.metaChipVal}>{item.brand}</Text>
              </View>
            )}
            {item.category && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Category </Text>
                <Text style={styles.metaChipVal}>{item.category}</Text>
              </View>
            )}
            {item.condition && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Condition </Text>
                <Text style={styles.metaChipVal}>{item.condition}</Text>
              </View>
            )}
            {item.size && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Size </Text>
                <Text style={styles.metaChipVal}>{item.size}</Text>
              </View>
            )}
            {item.color && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Color </Text>
                <Text style={styles.metaChipVal}>{item.color}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* 2. Physical Preparation Lifecycle */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>PREPARATION LIFECYCLE</Text>
          <Text style={styles.sectionSubtitle}>
            Track physical readiness before generating marketplace listings
          </Text>

          <View style={styles.prepFlow}>
            {/* Step 1: UNPREPARED */}
            <TouchableOpacity
              onPress={() => handleSetPrep('UNPREPARED')}
              style={[
                styles.prepStep,
                item.preparationStatus === 'UNPREPARED' && styles.prepStepActive,
              ]}
            >
              <Text style={styles.stepNumber}>1</Text>
              <Text
                style={[
                  styles.stepText,
                  item.preparationStatus === 'UNPREPARED' && styles.stepTextActive,
                ]}
              >
                Unprepared
              </Text>
            </TouchableOpacity>

            <Text style={styles.stepArrow}>→</Text>

            {/* Step 2: PREPARED */}
            <TouchableOpacity
              onPress={() => handleSetPrep('PREPARED')}
              style={[
                styles.prepStep,
                item.preparationStatus === 'PREPARED' && styles.prepStepActive,
              ]}
            >
              <Text style={styles.stepNumber}>2</Text>
              <Text
                style={[
                  styles.stepText,
                  item.preparationStatus === 'PREPARED' && styles.stepTextActive,
                ]}
              >
                Prepared
              </Text>
            </TouchableOpacity>

            <Text style={styles.stepArrow}>→</Text>

            {/* Step 3: READY TO LIST */}
            <TouchableOpacity
              onPress={() => handleSetPrep('READY_TO_LIST')}
              style={[
                styles.prepStep,
                item.preparationStatus === 'READY_TO_LIST' && styles.prepStepActive,
              ]}
            >
              <Text style={styles.stepNumber}>3</Text>
              <Text
                style={[
                  styles.stepText,
                  item.preparationStatus === 'READY_TO_LIST' && styles.stepTextActive,
                ]}
              >
                Ready to List
              </Text>
            </TouchableOpacity>
          </View>

          {item.preparationStatus === 'READY_TO_LIST' && item.status !== 'SOLD' && (
            <AppButton
              title="Create / Edit Marketplace Listing"
              onPress={() => navigation.navigate('ListingEditor', { itemId: item.id })}
              variant="primary"
              size="md"
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* 3. Physical Storage Location */}
        <View style={styles.detailSection}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>STORAGE LOCATION</Text>
              <Text style={styles.sectionSubtitle}>Physical bin or shelf assignment</Text>
            </View>
            <TouchableOpacity onPress={() => setIsChangingBin(!isChangingBin)}>
              <Text style={styles.linkText}>{isChangingBin ? 'Done' : 'Change'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationDisplayRow}>
            <PrettyIcon name="storage" size="xs" variant="neutral" containerStyle={{ marginRight: spacing.xs }} />
            <Text style={styles.binName}>
              {item.storageLocation ? item.storageLocation.name : 'Unassigned (No storage bin)'}
            </Text>
          </View>

          {isChangingBin && (
            <View style={styles.binSelectionWrap}>
              <TouchableOpacity
                onPress={() => handleAssignLocation(undefined)}
                style={[styles.binChoice, !item.storageLocation && styles.binChoiceActive]}
              >
                <Text style={[styles.binChoiceText, !item.storageLocation && styles.binChoiceTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {locations.map((loc: any) => (
                <TouchableOpacity
                  key={loc.id}
                  onPress={() => handleAssignLocation(loc.id)}
                  style={[
                    styles.binChoice,
                    item.storageLocation?.id === loc.id && styles.binChoiceActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.binChoiceText,
                      item.storageLocation?.id === loc.id && styles.binChoiceTextActive,
                    ]}
                  >
                    📍 {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* 4. Marketplace Listings for this Physical Item */}
        <View style={styles.detailSection}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>MARKETPLACE LISTINGS</Text>
              <Text style={styles.sectionSubtitle}>Channels connected to this physical item</Text>
            </View>
            {item.status !== 'SOLD' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ListingEditor', { itemId: item.id })}
              >
                <Text style={styles.linkText}>Listing Editor</Text>
              </TouchableOpacity>
            )}
          </View>

          {listings.length > 0 ? (
            listings.map((l: any) => (
              <View key={l.id} style={styles.listingRow}>
                <View>
                  <Text style={styles.listingMarketplace}>{l.marketplace}</Text>
                  <Text style={styles.listingPrice}>
                    {l.price ? `$${centsToCurrency(l.price)}` : 'No price set'}
                  </Text>
                </View>
                <StatusBadge status={l.status} />
              </View>
            ))
          ) : (
            <Text style={styles.noListingsText}>
              No listings published yet. Prepare your listing draft to upload.
            </Text>
          )}

          {item.status !== 'SOLD' && (
            <View style={{ marginTop: spacing.sm }}>
              <AppButton
                title={isPublishingEbay ? "Uploading to eBay..." : "Upload to eBay for Selling"}
                onPress={async () => {
                  try {
                    setIsPublishingEbay(true);
                    const ebayConn = Array.isArray(marketplaceConnections)
                      ? marketplaceConnections.find((c: any) => c.marketplace === 'EBAY' && c.connected)
                      : null;

                    if (!ebayConn) {
                      Alert.alert(
                        'Connect eBay Account',
                        'To publish this item to eBay for selling, please connect your eBay seller account.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Connect eBay Now',
                            onPress: async () => {
                              try {
                                await connectMarketplaceMutation.mutateAsync('ebay');
                                navigation.navigate('ListingEditor', { itemId: item.id });
                              } catch (e: any) {
                                Alert.alert('eBay Connect', e.message || 'Could not connect eBay.');
                              }
                            }
                          }
                        ]
                      );
                      return;
                    }

                    // Direct publish
                    await publishToMarketplaceMutation.mutateAsync('ebay');
                    refetch();
                  } catch (e: any) {
                    Alert.alert('eBay Upload', e.message || 'Could not upload to eBay. Open Listing Editor to check details.', [
                      { text: 'Edit Listing', onPress: () => navigation.navigate('ListingEditor', { itemId: item.id }) },
                      { text: 'OK' }
                    ]);
                  } finally {
                    setIsPublishingEbay(false);
                  }
                }}
                loading={isPublishingEbay || publishToMarketplaceMutation.isPending}
                variant="outline"
                size="md"
              />
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* 5. Financial Overview & Sale Record */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>FINANCIALS</Text>
          <View style={styles.financialRow}>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>Purchase Cost</Text>
              <Text style={styles.finValue}>
                {item.purchasePrice !== null && item.purchasePrice !== undefined ? `$${centsToCurrency(item.purchasePrice)}` : '—'}
              </Text>
            </View>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>Target Price</Text>
              <Text style={styles.finValue}>
                {item.marketPrice !== null && item.marketPrice !== undefined ? `$${centsToCurrency(item.marketPrice)}` : '—'}
              </Text>
            </View>
            {sale && (
              <View style={styles.finCol}>
                <Text style={styles.finLabel}>Sold Profit</Text>
                <Text style={[styles.finValue, { color: colors.success }]}>
                  ${centsToCurrency(sale.salePrice - (item.purchasePrice || 0) - (sale.marketplaceFees || 0) - (sale.shippingCost || 0) - (sale.otherExpenses || 0))}
                </Text>
              </View>
            )}
          </View>

          {item.status !== 'SOLD' ? (
            <AppButton
              title="Record Sale"
              onPress={() => navigation.navigate('RecordSale', { itemId: item.id })}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          ) : (
            <View style={styles.soldBanner}>
              <Text style={styles.soldBannerText}>
                ✓ Item marked as SOLD on {new Date(sale?.soldAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* 6. Item History & Danger Actions */}
        <View style={styles.bottomActions}>
          <AppButton
            title="View Lifecycle History"
            onPress={() => navigation.navigate('ItemHistory', { itemId: item.id })}
            variant="secondary"
            size="md"
          />

          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>Archive Physical Item</Text>
          </TouchableOpacity>
        </View>
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
  photoSection: {
    marginBottom: spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoItem: {
    width: 200,
    height: 160,
    borderRadius: radii.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  photoPlaceholder: {
    height: 140,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 28,
  },
  photoPlaceholderText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    marginBottom: spacing.md,
  },
  detailSection: {
    paddingVertical: spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  headerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  skuText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  itemTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  metaChipLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  metaChipVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  linkText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  prepFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  prepStep: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  prepStepActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  stepText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  stepTextActive: {
    color: colors.primaryDark,
  },
  stepArrow: {
    marginHorizontal: spacing.xxs,
    color: colors.textMuted,
  },
  locationDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  binName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  binSelectionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  binChoice: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  binChoiceActive: {
    backgroundColor: colors.text,
  },
  binChoiceText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  binChoiceTextActive: {
    color: colors.textInverse,
  },
  listingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  listingMarketplace: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  listingPrice: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  noListingsText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xs,
  },
  finCol: {
    alignItems: 'center',
  },
  finLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  finValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 2,
  },
  soldBanner: {
    backgroundColor: colors.successBg,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  soldBannerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.success,
  },
  bottomActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  deleteBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },
});
