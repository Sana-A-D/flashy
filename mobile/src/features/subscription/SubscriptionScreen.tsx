import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscription, useUpgradePlan, useCancelSubscription } from '../../hooks/useSubscription';
import { PlanFeatureLimits, SubscriptionTier } from '../../types/subscription';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { ScreenContainer, AppCard, AppButton, SectionHeader, LoadingState, ErrorState } from '../../components';

export function SubscriptionScreen() {
  const navigation = useNavigation();
  const { data, isLoading, error, refetch } = useSubscription();
  const upgradeMutation = useUpgradePlan();
  const cancelMutation = useCancelSubscription();
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const handleUpgrade = async (plan: PlanFeatureLimits) => {
    if (data?.subscription.tier === plan.tier) {
      Alert.alert('Current Plan', `You are already on the ${plan.displayName} plan.`);
      return;
    }

    Alert.alert(
      'Confirm Subscription Change',
      `Would you like to switch to the ${plan.displayName} plan (${plan.pricePerMonth === 0 ? 'Free' : `$${(plan.pricePerMonth / 100).toFixed(2)}/mo`})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessingTier(plan.tier);
            try {
              await upgradeMutation.mutateAsync(plan.tier as SubscriptionTier);
              Alert.alert('Success', `Your subscription is now updated to ${plan.displayName}!`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update subscription');
            } finally {
              setProcessingTier(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Renewal',
      'Are you sure you want to cancel automatic renewal for your subscription?',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Renewal',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync();
              Alert.alert('Updated', 'Your subscription will not renew after the current billing period.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel subscription renewal');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Subscription" showBack onBack={() => navigation.goBack()}>
        <LoadingState message="Loading subscription details..." />
      </ScreenContainer>
    );
  }

  if (error || !data) {
    return (
      <ScreenContainer title="Subscription" showBack onBack={() => navigation.goBack()}>
        <ErrorState message="Unable to load subscription data." onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const { subscription, plan, usage, availablePlans } = data;
  const isCanceledAtEnd = subscription.cancelAtPeriodEnd;

  return (
    <ScreenContainer
      title="Subscription & Billing"
      subtitle="Manage your plan limits, active items, and billing cycle"
      showBack
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active Plan Overview Card */}
        <AppCard variant="elevated" style={styles.card}>
          <View style={styles.planHeaderRow}>
            <View>
              <Text style={styles.planSubheader}>CURRENT PLAN</Text>
              <Text style={styles.planTitle}>{plan.displayName}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {isCanceledAtEnd ? 'CANCELING' : subscription.status}
              </Text>
            </View>
          </View>

          <Text style={styles.planPrice}>
            {plan.pricePerMonth === 0
              ? 'Free Tier'
              : `$${(plan.pricePerMonth / 100).toFixed(2)} / month`}
          </Text>

          {subscription.currentPeriodEnd && (
            <Text style={styles.renewalDate}>
              {isCanceledAtEnd
                ? `Expires on: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </Text>
          )}

          {/* Usage Stats */}
          <View style={styles.usageBox}>
            <Text style={styles.usageHeader}>Inventory Quota & Limits</Text>

            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Active Inventory Items:</Text>
              <Text style={styles.usageVal}>
                {usage.activeItems} / {usage.maxItems}
              </Text>
            </View>
            {usage.isItemsLimitReached && (
              <Text style={styles.warningText}>
                Item limit reached. Upgrade to add more items.
              </Text>
            )}

            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Marketplace Connections:</Text>
              <Text style={styles.usageVal}>
                {usage.activeMarketplaces} / {usage.maxMarketplaces}
              </Text>
            </View>
            {usage.isMarketplacesLimitReached && (
              <Text style={styles.warningText}>
                Marketplace limit reached. Upgrade for more channels.
              </Text>
            )}
          </View>

          {subscription.tier !== 'FREE' && !isCanceledAtEnd && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancel renewal at period end</Text>
            </TouchableOpacity>
          )}
        </AppCard>

        {/* Available Plans Section */}
        <SectionHeader
          title="Available Plans"
          subtitle="Choose the inventory tier that fits your resale volume"
          style={{ marginTop: spacing.md }}
        />

        {availablePlans.map((item) => {
          const isCurrent = subscription.tier === item.tier;
          const isActionLoading = processingTier === item.tier;

          return (
            <AppCard
              key={item.tier}
              variant={isCurrent ? 'elevated' : 'flat'}
              style={StyleSheet.flatten([styles.tierCard, isCurrent && styles.tierCardActive])}
            >
              <View style={styles.tierHeader}>
                <View>
                  <Text style={styles.tierName}>{item.displayName}</Text>
                  <Text style={styles.tierPrice}>
                    {item.pricePerMonth === 0
                      ? 'Free'
                      : `$${(item.pricePerMonth / 100).toFixed(2)} / mo`}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.featuresWrap}>
                {item.features.map((feature, idx) => (
                  <Text key={idx} style={styles.featureText}>
                    • {feature}
                  </Text>
                ))}
              </View>

              <AppButton
                title={isCurrent ? 'Current Plan' : 'Select Plan'}
                onPress={() => handleUpgrade(item)}
                disabled={isCurrent || isActionLoading}
                loading={isActionLoading}
                variant={isCurrent ? 'secondary' : 'primary'}
                size="md"
              />
            </AppCard>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

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
    marginBottom: spacing.md,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planSubheader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  planTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  statusBadgeText: {
    color: colors.primaryDark,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  planPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  renewalDate: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  usageBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  usageHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  usageLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  usageVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  warningText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: 2,
    fontWeight: typography.weights.medium,
  },
  cancelLink: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  cancelLinkText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    textDecorationLine: 'underline',
  },
  tierCard: {
    marginBottom: spacing.sm,
  },
  tierCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  tierName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tierPrice: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  activePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  activePillText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  featuresWrap: {
    marginVertical: spacing.xs,
  },
  featureText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
});
