import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useItemHistory } from '../../hooks/useItemHistory';
import { colors, spacing, typography, radii } from '../../constants/theme';
import {
  AppCard,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../../components';

export const ItemHistoryScreen = ({ route }: any) => {
  const { itemId } = route.params;
  const { data: history = [], isLoading, error, refetch } = useItemHistory(itemId);

  const getActionBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ITEM_CREATED':
        return colors.primaryLight;
      case 'PREPARATION_UPDATED':
        return colors.surfaceMuted;
      case 'LISTING_PUBLISHED':
        return colors.infoBg;
      case 'SALE_RECORDED':
        return colors.successBg;
      case 'DELISTED':
        return colors.disabledBg;
      default:
        return colors.surfaceMuted;
    }
  };

  const getActionTextColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ITEM_CREATED':
        return colors.primaryDark;
      case 'LISTING_PUBLISHED':
        return colors.info;
      case 'SALE_RECORDED':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <SectionHeader
            title="Item Lifecycle Timeline"
            subtitle="Complete audit trail of physical changes, listings, and sales"
          />
        }
        renderItem={({ item, index }) => {
          const isLast = index === history.length - 1;

          return (
            <View style={styles.timelineItem}>
              {/* Vertical line indicator */}
              <View style={styles.indicatorCol}>
                <View style={styles.dot} />
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Event card */}
              <AppCard variant="flat" style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.actionBadge,
                      { backgroundColor: getActionBadgeColor(item.type) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBadgeText,
                        { color: getActionTextColor(item.type) },
                      ]}
                    >
                      {item.type?.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                  </Text>
                </View>

                {item.title && <Text style={styles.eventTitle}>{item.title}</Text>}

                {item.details && (
                  <Text style={styles.detailsText}>
                    {typeof item.details === 'string'
                      ? item.details
                      : JSON.stringify(item.details, null, 2)}
                  </Text>
                )}
              </AppCard>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState message="Loading lifecycle timeline..." />
          ) : error ? (
            <ErrorState message="Could not load item timeline." onRetry={refetch} />
          ) : (
            <EmptyState
              title="No events recorded"
              description="Events like creation, preparation updates, listings, and sales will appear here automatically."
            />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  indicatorCol: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 12,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  eventCard: {
    flex: 1,
    marginLeft: spacing.xs,
    padding: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  actionBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  eventTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: 2,
  },
  detailsText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: typography.lineHeights.xs,
  },
});
