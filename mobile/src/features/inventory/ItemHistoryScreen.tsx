import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useItemHistory } from '../../hooks/useItemHistory';
import { ScreenContainer, AppCard, LoadingState, ErrorState, EmptyState } from '../../components';
import { colors, spacing, typography, radii } from '../../constants/theme';

export function ItemHistoryScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const id = route.params?.id || route.params?.itemId;

  const { data: events, isLoading, isError, refetch } = useItemHistory(id);

  if (isLoading) {
    return (
      <ScreenContainer title="Item History" showBack onBack={() => navigation.goBack()}>
        <LoadingState message="Loading lifecycle history..." />
      </ScreenContainer>
    );
  }

  if (isError || !events) {
    return (
      <ScreenContainer title="Item History" showBack onBack={() => navigation.goBack()}>
        <ErrorState message="Could not load item history." onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Item History"
      subtitle="Audit log of state transitions & actions"
      showBack
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {events.length === 0 ? (
          <EmptyState
            title="No History Yet"
            description="Events and lifecycle actions will appear here as the item progresses."
          />
        ) : (
          <View style={styles.timeline}>
            {events.map((event, index) => {
              const isLast = index === events.length - 1;
              return (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.timelineLineContainer}>
                    <View style={styles.dot} />
                    {!isLast && <View style={styles.line} />}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventDate}>
                      {new Date(event.timestamp).toLocaleString()}
                    </Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    
                    {event.type === 'RECOGNIZED' && event.details && (
                      <AppCard variant="muted" style={styles.detailsCard}>
                        {event.details.brand && <Text style={styles.detailText}>Brand: {event.details.brand}</Text>}
                        {event.details.category && <Text style={styles.detailText}>Category: {event.details.category}</Text>}
                      </AppCard>
                    )}
                    
                    {event.type === 'PRICE_RESEARCHED' && event.details && event.details.recommendedPrice && (
                      <AppCard variant="muted" style={styles.detailsCard}>
                        <Text style={styles.detailText}>
                          Suggested Price: ${(event.details.recommendedPrice / 100).toFixed(2)}
                        </Text>
                      </AppCard>
                    )}
                    
                    {event.type === 'SALE_RECORDED' && event.details && event.details.salePrice && (
                      <AppCard variant="muted" style={styles.detailsCard}>
                        <Text style={[styles.detailText, { color: colors.success, fontWeight: typography.weights.bold }]}>
                          Sale Amount: ${(event.details.salePrice / 100).toFixed(2)}
                        </Text>
                      </AppCard>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  timeline: {
    marginTop: spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLineContainer: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: -4,
    marginBottom: -8,
    zIndex: 0,
  },
  eventContent: {
    flex: 1,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.sm,
  },
  eventDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  detailsCard: {
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
});
