import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  useMarketplaceConnections,
  useConnectMarketplace,
  useDisconnectMarketplace,
} from '../../hooks/useMarketplaces';
import { colors, spacing, typography, radii } from '../../constants/theme';
import {
  ScreenContainer,
  AppCard,
  AppButton,
  StatusBadge,
  SectionHeader,
  LoadingState,
  ErrorState,
} from '../../components';

export const MarketplacesScreen = ({ navigation }: any) => {
  const { data: marketplaces = [], isLoading, error, refetch } = useMarketplaceConnections();
  const connectMutation = useConnectMarketplace();
  const disconnectMutation = useDisconnectMarketplace();

  const handleToggleConnect = (mp: any) => {
    if (mp.status === 'CONNECTED') {
      disconnectMutation.mutate(mp.name);
    } else {
      if (mp.name.toLowerCase() === 'ebay') {
        navigation.navigate('EbaySettings');
      } else {
        connectMutation.mutate(mp.name);
      }
    }
  };

  return (
    <ScreenContainer
      title="Marketplace Channels"
      subtitle="Connect selling accounts or configure manual listing channels"
      showBack
      onBack={() => navigation.goBack()}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {error ? (
          <ErrorState message="Could not load marketplace channels." onRetry={refetch} />
        ) : null}

        {isLoading && marketplaces.length === 0 ? (
          <LoadingState message="Loading marketplace connections..." />
        ) : (
          marketplaces.map((mp: any) => {
            const isEbay = mp.name.toLowerCase() === 'ebay';
            const isConnected = mp.status === 'CONNECTED';

            return (
              <AppCard key={mp.name} variant="elevated" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Text style={styles.marketplaceName}>{mp.name}</Text>
                    <StatusBadge status={mp.status} />
                  </View>
                  {isEbay && isConnected && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EbaySettings')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.settingsLink}>Settings</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.channelTypeBadge}>
                  {isEbay ? '⚡ Automated API Sync' : '📝 Manual Resale Channel'}
                </Text>

                <Text style={styles.channelDesc}>
                  {isEbay
                    ? 'Automated API sync. Publish listings directly to eBay and auto-delist when sold.'
                    : 'Manual resale channel. SellPort formats photos, details, and price for quick manual posting.'}
                </Text>

                <View style={styles.actionRow}>
                  <AppButton
                    title={isConnected ? 'Disconnect' : isEbay ? 'Configure eBay' : 'Enable Channel'}
                    onPress={() => handleToggleConnect(mp)}
                    variant={isConnected ? 'outline' : 'primary'}
                    size="sm"
                    loading={
                      connectMutation.isPending || disconnectMutation.isPending
                    }
                  />
                </View>
              </AppCard>
            );
          })
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
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  marketplaceName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  settingsLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  channelTypeBadge: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  channelDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
