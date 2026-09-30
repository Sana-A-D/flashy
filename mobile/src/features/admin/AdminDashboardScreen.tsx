import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAdminStats, useAdminUsers, useUpdateUserRole, useUpdateUserSubscription } from '../../hooks/useAdmin';
import { AdminUserListItem, UserRole, SubscriptionTier } from '../../types/admin';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { ScreenContainer, AppCard, AppButton, SectionHeader, LoadingState, ErrorState } from '../../components';

export function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useAdminUsers({
    search: searchQuery || undefined,
    role: roleFilter,
    limit: 50,
  });

  const updateRoleMutation = useUpdateUserRole();
  const updateSubMutation = useUpdateUserSubscription();

  const handleToggleRole = (user: AdminUserListItem) => {
    const newRole: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    Alert.alert(
      'Confirm Role Change',
      `Change role for ${user.email} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateRoleMutation.mutateAsync({ userId: user.id, role: newRole });
              Alert.alert('Success', `Updated role to ${newRole}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update role');
            }
          },
        },
      ]
    );
  };

  const handleUpdateSubscription = (user: AdminUserListItem) => {
    const tiers: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    Alert.alert(
      'Update Subscription Tier',
      `Select a new tier for ${user.email}:`,
      [
        ...tiers.map((tier) => ({
          text: tier,
          onPress: async () => {
            try {
              await updateSubMutation.mutateAsync({ userId: user.id, tier });
              Alert.alert('Success', `Updated subscription to ${tier}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update subscription');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScreenContainer
      title="Admin Control Center"
      subtitle="System oversight, subscriber management, and inventory statistics"
      showBack
      onBack={() => navigation.goBack()}
    >
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
            System Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'users' && styles.activeTabButtonText]}>
            Reseller Accounts
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {statsLoading ? (
            <LoadingState message="Loading platform overview..." />
          ) : statsError ? (
            <ErrorState
              message={
                statsError.message?.includes('Forbidden') || statsError.message?.includes('401')
                  ? 'Access Denied: Admin role required.'
                  : 'Failed to load admin statistics.'
              }
              onRetry={refetchStats}
            />
          ) : stats ? (
            <>
              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <AppCard variant="elevated" style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Total Resellers</Text>
                  <Text style={styles.metricValue}>{stats.totalUsers}</Text>
                </AppCard>
                <AppCard variant="elevated" style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Total Items</Text>
                  <Text style={styles.metricValue}>{stats.totalItems}</Text>
                </AppCard>
                <AppCard variant="elevated" style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Total Sales</Text>
                  <Text style={styles.metricValue}>{stats.totalSales}</Text>
                </AppCard>
                <AppCard variant="elevated" style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Gross Volume</Text>
                  <Text style={[styles.metricValue, { color: colors.success }]}>
                    ${(stats.totalRevenueCents / 100).toFixed(2)}
                  </Text>
                </AppCard>
              </View>

              {/* Subscription Breakdown */}
              <AppCard variant="elevated" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Subscriptions Breakdown</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Free Tier:</Text>
                  <Text style={styles.breakdownVal}>{stats.subscriptionsByTier.FREE || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Starter Tier:</Text>
                  <Text style={styles.breakdownVal}>{stats.subscriptionsByTier.STARTER || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Pro Reseller:</Text>
                  <Text style={styles.breakdownVal}>{stats.subscriptionsByTier.PRO || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Enterprise:</Text>
                  <Text style={styles.breakdownVal}>{stats.subscriptionsByTier.ENTERPRISE || 0}</Text>
                </View>
              </AppCard>

              {/* Inventory Status Breakdown */}
              <AppCard variant="elevated" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Physical Inventory Status</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Drafts:</Text>
                  <Text style={styles.breakdownVal}>{stats.itemsByStatus.DRAFT || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>In Inventory:</Text>
                  <Text style={styles.breakdownVal}>{stats.itemsByStatus.INVENTORY || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Active Listed:</Text>
                  <Text style={styles.breakdownVal}>{stats.itemsByStatus.LISTED || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Sold:</Text>
                  <Text style={styles.breakdownVal}>{stats.itemsByStatus.SOLD || 0}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>Archived:</Text>
                  <Text style={styles.breakdownVal}>{stats.itemsByStatus.ARCHIVED || 0}</Text>
                </View>
              </AppCard>

              {/* Recent Activity Log */}
              <AppCard variant="elevated" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>System Activity Stream</Text>
                {stats.recentActivity.length === 0 ? (
                  <Text style={styles.emptyText}>No recent activity</Text>
                ) : (
                  stats.recentActivity.map((act, i) => (
                    <View key={i} style={styles.activityItem}>
                      <Text style={styles.activityDesc}>{act.description}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))
                )}
              </AppCard>
            </>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Filter Bar */}
          <View style={styles.filterContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search user email or name..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            <View style={styles.roleFilterRow}>
              <TouchableOpacity
                style={[styles.filterChip, roleFilter === undefined && styles.filterChipActive]}
                onPress={() => setRoleFilter(undefined)}
              >
                <Text style={[styles.filterChipText, roleFilter === undefined && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, roleFilter === 'ADMIN' && styles.filterChipActive]}
                onPress={() => setRoleFilter('ADMIN')}
              >
                <Text style={[styles.filterChipText, roleFilter === 'ADMIN' && styles.filterChipTextActive]}>
                  Admins
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, roleFilter === 'USER' && styles.filterChipActive]}
                onPress={() => setRoleFilter('USER')}
              >
                <Text style={[styles.filterChipText, roleFilter === 'USER' && styles.filterChipTextActive]}>
                  Resellers
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {usersLoading ? (
            <LoadingState message="Loading accounts..." />
          ) : usersError ? (
            <ErrorState
              message={
                usersError.message?.includes('Forbidden') || usersError.message?.includes('401')
                  ? 'Access Denied: Admin role required.'
                  : 'Failed to load user accounts.'
              }
              onRetry={refetchUsers}
            />
          ) : usersData?.users.length === 0 ? (
            <AppCard variant="muted" style={{ padding: spacing.md, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No users found matching query</Text>
            </AppCard>
          ) : (
            usersData?.users.map((u) => (
              <AppCard key={u.id} variant="flat" style={styles.userCard}>
                <View style={styles.userCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    {u.name && <Text style={styles.userName}>{u.name}</Text>}
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      u.role === 'ADMIN' ? styles.adminBadge : styles.userBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        u.role === 'ADMIN' ? styles.adminBadgeText : styles.userBadgeText,
                      ]}
                    >
                      {u.role}
                    </Text>
                  </View>
                </View>

                <View style={styles.userDetailsRow}>
                  <Text style={styles.userDetailText}>
                    Tier: <Text style={styles.boldText}>{u.subscription?.tier || 'FREE'}</Text>
                  </Text>
                  <Text style={styles.userDetailText}>
                    Items: <Text style={styles.boldText}>{u._count.items}</Text>
                  </Text>
                  <Text style={styles.userDetailText}>
                    Channels: <Text style={styles.boldText}>{u._count.marketplaceAccounts}</Text>
                  </Text>
                </View>

                <View style={styles.userActionsRow}>
                  <AppButton
                    title={u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                    onPress={() => handleToggleRole(u)}
                    variant="outline"
                    size="sm"
                  />
                  <AppButton
                    title="Change Tier"
                    onPress={() => handleUpdateSubscription(u)}
                    variant="secondary"
                    size="sm"
                  />
                </View>
              </AppCard>
            ))
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topPadding: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  breakdownKey: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  breakdownVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  activityItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  activityDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  activityTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: colors.text,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  userCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userName: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  adminBadge: {
    backgroundColor: colors.errorBg,
  },
  userBadge: {
    backgroundColor: colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  adminBadgeText: {
    color: colors.error,
  },
  userBadgeText: {
    color: colors.primaryDark,
  },
  userDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  userDetailText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
