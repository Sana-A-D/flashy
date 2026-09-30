import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { PrettyIcon } from '../../components/ui/PrettyIcon';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';
import {
  useFashionItems,
  useToggleSaveFashionItem,
  useDeleteFashionItem,
  useBatchDeleteFashionItems,
  useClearHistoryFashionItems,
} from '../../hooks/useFashion';
import { FashionItem } from '../../types/fashion';
import { resolveImageUrl } from '../../utils/imageUrl';

export const SavedScreen = ({ navigation }: any) => {
  const { colors, isDark } = useFashionTheme();
  const [tab, setTab] = useState<'SAVED' | 'RECENT'>('SAVED');
  const { data: savedItems = [], isLoading: isSavedLoading, refetch: refetchSaved } = useFashionItems('SAVED');
  const { data: recentItems = [], isLoading: isRecentLoading, refetch: refetchRecent } = useFashionItems('RECENT');

  const items = tab === 'SAVED' ? savedItems : recentItems;
  const isLoading = tab === 'SAVED' ? isSavedLoading : isRecentLoading;
  const refetch = tab === 'SAVED' ? refetchSaved : refetchRecent;

  const toggleSaveMutation = useToggleSaveFashionItem();
  const deleteMutation = useDeleteFashionItem();
  const batchDeleteMutation = useBatchDeleteFashionItems();
  const clearHistoryMutation = useClearHistoryFashionItems();

  // Track item currently being deleted to show indicator and prevent duplicate taps
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Selection mode for batch actions
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const confirmAction = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void | Promise<void>
  ) => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (ok) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: confirmLabel, style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    confirmAction(
      'Delete Selected Items',
      `Are you sure you want to permanently delete ${selectedIds.length} item(s)?`,
      'Delete',
      async () => {
        try {
          await batchDeleteMutation.mutateAsync(selectedIds);
          setSelectedIds([]);
          setIsSelectionMode(false);
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Could not delete selected items.');
        }
      }
    );
  };

  const handleClearHistory = () => {
    confirmAction(
      'Clear All Scan History?',
      'This will remove all recent unsaved scans from your history. Saved items in your wardrobe will remain safe.',
      'Clear History',
      async () => {
        try {
          await clearHistoryMutation.mutateAsync();
          setSelectedIds([]);
          setIsSelectionMode(false);
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Could not clear scan history.');
        }
      }
    );
  };

  const handleDeleteSingle = async (item: FashionItem, e?: any) => {
    e?.stopPropagation?.();
    if (deletingId) return;

    setDeletingId(item.id);
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err: any) {
      const errorMsg = err?.message || 'Could not delete item.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Delete Failed: ${errorMsg}`);
      } else {
        Alert.alert('Delete Failed', errorMsg);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSave = (item: FashionItem, e?: any) => {
    e?.stopPropagation?.();
    toggleSaveMutation.mutate({ id: item.id, save: !item.saved });
  };

  const renderItem = ({ item }: { item: FashionItem }) => {
    const photoUrl = resolveImageUrl(item.photos && item.photos.length > 0 ? item.photos[0].url : null);
    const isSelected = selectedIds.includes(item.id);
    const isDeletingThisItem = deletingId === item.id;
    const dateFormatted = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return (
      <View
        style={[
          styles.garmentLookbookCard,
          {
            backgroundColor: isSelected
              ? isDark
                ? colors.surfaceHover
                : colors.surfaceCream
              : isDark
              ? colors.surface
              : colors.surfaceElevated,
            borderColor: isSelected ? colors.denim : colors.borderSubtle,
          },
          isDeletingThisItem && { opacity: 0.5 },
        ]}
      >
        <TouchableOpacity
          style={styles.garmentCardTouchable}
          activeOpacity={0.85}
          onPress={() => {
            if (isSelectionMode) {
              handleToggleSelect(item.id);
            } else {
              navigation.navigate('FashionAnalysis', { id: item.id });
            }
          }}
        >
          {/* Prominent Fashion Photography Frame */}
          <View style={[styles.largePhotoFrame, { backgroundColor: colors.surfaceMuted }]}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.largePhotoImage} />
            ) : (
              <View style={styles.placeholderFrame}>
                <PrettyIcon name="camera" size="md" variant="neutral" />
                <Text style={[styles.placeholderText, { color: colors.textMuted }]}>NO PHOTO AVAILABLE</Text>
              </View>
            )}

            {/* Selection Checkbox */}
            {isSelectionMode && (
              <View
                style={[
                  styles.checkboxOverlay,
                  {
                    borderColor: isSelected ? colors.denim : '#FFFFFF',
                    backgroundColor: isSelected ? colors.denim : 'rgba(0, 0, 0, 0.4)',
                  },
                ]}
              >
                {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
            )}

            {/* Quick Actions Overlay (Save Star & Delete) */}
            {!isSelectionMode && (
              <View style={styles.photoActionsOverlay}>
                <TouchableOpacity
                  onPress={(e) => handleToggleSave(item, e)}
                  hitSlop={{ top: 12, bottom: 12, left: 10, right: 8 }}
                  activeOpacity={0.7}
                  style={[styles.floatingActionCircle, { backgroundColor: 'rgba(15, 20, 26, 0.75)' }]}
                  accessibilityLabel={item.saved ? 'Unsave item' : 'Save item'}
                >
                  <Text
                    style={[
                      styles.floatingStarIcon,
                      { color: item.saved ? colors.burgundy : '#FFFFFF' },
                    ]}
                  >
                    {item.saved ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={(e) => handleDeleteSingle(item, e)}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
                  activeOpacity={0.6}
                  disabled={isDeletingThisItem}
                  style={[styles.floatingActionCircle, { backgroundColor: 'rgba(15, 20, 26, 0.75)' }]}
                  accessibilityLabel="Delete item"
                >
                  <Text style={[styles.floatingDeleteIcon, { color: colors.error }]}>
                    {isDeletingThisItem ? '…' : '✕'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Editorial Garment Metadata */}
          <View style={styles.garmentEditorialMeta}>
            <View style={styles.brandDateRow}>
              <Text style={[styles.garmentBrandTracked, { color: colors.textMuted }]} numberOfLines={1}>
                {item.brand || 'ARCHIVE SPECIMEN'}
              </Text>
              <Text style={[styles.garmentDateText, { color: colors.textMuted }]}>
                {dateFormatted}
              </Text>
            </View>

            <Text style={[styles.garmentHeadline, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={[styles.garmentFabricDetails, { color: colors.textSecondary }]} numberOfLines={1}>
              {[item.category, item.color, item.material].filter(Boolean).join(' · ') || 'Fashion item'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer
      activeTab="Saved"
      title="WARDROBE & HISTORY"
      subtitle={tab === 'SAVED' ? 'Curated wardrobe collection' : 'Complete record of visual scans'}
    >
      <View style={styles.container}>
        {/* Editorial Segment Switcher */}
        <View style={[styles.switcherContainer, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[
              styles.switcherTab,
              tab === 'SAVED' && [styles.switcherTabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => {
              setTab('SAVED');
              setIsSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <Text
              style={[
                styles.switcherLabel,
                { color: tab === 'SAVED' ? colors.text : colors.textMuted },
                tab === 'SAVED' && { fontWeight: '700' },
              ]}
            >
              WARDROBE ({savedItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switcherTab,
              tab === 'RECENT' && [styles.switcherTabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => {
              setTab('RECENT');
              setIsSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <Text
              style={[
                styles.switcherLabel,
                { color: tab === 'RECENT' ? colors.text : colors.textMuted },
                tab === 'RECENT' && { fontWeight: '700' },
              ]}
            >
              SCAN HISTORY ({recentItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Minimal Toolbar when items exist */}
        {items.length > 0 && (
          <View style={[styles.toolbar, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds([]);
              }}
            >
              <Text style={[styles.toolbarBtnText, { color: colors.textSecondary }]}>
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>

            {isSelectionMode ? (
              <View style={styles.toolbarBatchGroup}>
                <TouchableOpacity style={styles.toolbarBtn} onPress={handleSelectAll}>
                  <Text style={[styles.toolbarBtnText, { color: colors.textSecondary }]}>
                    {selectedIds.length === items.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toolbarDeleteBtn,
                    { backgroundColor: colors.burgundy },
                    selectedIds.length === 0 && { opacity: 0.4 },
                  ]}
                  disabled={selectedIds.length === 0}
                  onPress={handleBatchDelete}
                >
                  <Text style={styles.toolbarDeleteText}>
                    Delete ({selectedIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            ) : tab === 'RECENT' ? (
              <TouchableOpacity style={styles.toolbarBtn} onPress={handleClearHistory}>
                <Text style={[styles.clearHistoryBtnText, { color: colors.error }]}>
                  Clear History
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{tab === 'SAVED' ? '★' : '📷'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {tab === 'SAVED' ? 'Wardrobe is empty' : 'No scans recorded'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {tab === 'SAVED'
                ? 'Save your favorite pieces from your scans to build your personal wardrobe archive.'
                : 'Every piece you photograph appears here so you can revisit fabric breakdowns, real prices, and styling.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Scan')}
              style={[styles.emptyActionBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.emptyActionText, { color: colors.text }]}>
                Scan a Garment
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switcherContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    borderBottomWidth: 1,
  },
  switcherTab: {
    paddingVertical: spacing.sm + 2,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  switcherTabActive: {},
  switcherLabel: {
    fontSize: 12,
    letterSpacing: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
  },
  toolbarBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  toolbarBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  toolbarBatchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolbarDeleteBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.xs,
  },
  toolbarDeleteText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  clearHistoryBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xs + 2,
  },
  garmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xs,
    borderWidth: 1,
    padding: spacing.xs + 2,
  },
  garmentMainArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  garmentLookbookCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  garmentCardTouchable: {
    width: '100%',
  },
  largePhotoFrame: {
    width: '100%',
    height: 260,
    position: 'relative',
    overflow: 'hidden',
  },
  largePhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoActionsOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  floatingActionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingStarIcon: {
    fontSize: 18,
  },
  floatingDeleteIcon: {
    fontSize: 15,
    fontWeight: '700',
  },
  garmentEditorialMeta: {
    padding: spacing.md,
  },
  brandDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  garmentBrandTracked: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  garmentDateText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  garmentHeadline: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 20,
    marginBottom: 4,
  },
  garmentFabricDetails: {
    fontSize: typography.sizes.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.base + 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  emptyActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  emptyActionText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
