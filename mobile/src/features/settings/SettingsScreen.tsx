import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../auth/store/useAuthStore';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';
import {
  ScreenContainer,
  ListRow,
  AppButton,
  PrettyIcon,
} from '../../components';

export const SettingsScreen = ({ navigation }: any) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { colors, isDark, toggleTheme, mode } = useFashionTheme();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Flashy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScreenContainer
      title="SETTINGS & CHANNELS"
      subtitle="Account preferences, channels, and physical storage"
      activeTab="Profile"
      showBack={true}
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Banner */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isDark ? colors.burgundyLight : colors.burgundyLight,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Text style={[styles.avatarLetter, { color: colors.burgundy }]}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Flashy User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || '—'}
            </Text>
            <View style={[styles.rolePill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                {user?.role || 'USER'} ACCOUNT
              </Text>
            </View>
          </View>
        </View>

        {/* Fashion Theme & Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          PALETTE & APPEARANCE
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.themeToggleRow}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={styles.themeLeft}>
              <PrettyIcon name="sparkle" size="sm" variant={isDark ? 'coral' : 'denim'} />
              <View style={styles.themeTextCol}>
                <Text style={[styles.themeTitle, { color: colors.text }]}>
                  {isDark ? 'Dark Denim & Charcoal' : 'Ivory & Warm Cream'}
                </Text>
                <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'Deep navy, washed black, deep burgundy' : 'Ivory, cream, denim blue, muted maroon'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.modePill,
                { backgroundColor: isDark ? colors.burgundy : colors.denim },
              ]}
            >
              <Text style={styles.modePillText}>
                {mode === 'dark' ? 'DARK' : 'LIGHT'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Selling & Channels Section */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          SELLING CHANNELS & INVENTORY
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <ListRow
            leftIcon={<PrettyIcon name="marketplace" size="sm" variant="neutral" />}
            title="Marketplace Channels"
            subtitle="Connect eBay and view manual channel copy tools"
            onPress={() => navigation.navigate('Marketplaces')}
          />
          <ListRow
            leftIcon={<PrettyIcon name="ebay" size="sm" variant="neutral" />}
            title="eBay Settings"
            subtitle="Manage eBay API sync, locations, and business policies"
            onPress={() => navigation.navigate('EbaySettings')}
          />
          <ListRow
            leftIcon={<PrettyIcon name="storage" size="sm" variant="neutral" />}
            title="Storage Locations"
            subtitle="Organize bins, totes, shelves, and physical racks"
            onPress={() => navigation.navigate('StorageLocations')}
          />
        </View>

        {/* Account & Platform Section */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          ACCOUNT & PREFERENCES
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <ListRow
            leftIcon={<PrettyIcon name="subscription" size="sm" variant="neutral" />}
            title="Subscription & Billing"
            subtitle="View item limits, tier quotas, and billing cycle"
            onPress={() => navigation.navigate('Subscription')}
          />
          <ListRow
            leftIcon={<PrettyIcon name="privacy" size="sm" variant="neutral" />}
            title="Data & Privacy"
            subtitle="Export inventory records or manage account data"
            onPress={() => navigation.navigate('DataPrivacy')}
          />
          {user?.role === 'ADMIN' && (
            <ListRow
              leftIcon={<PrettyIcon name="admin" size="sm" variant="neutral" />}
              title="Admin Control Center"
              subtitle="System statistics and reseller account management"
              onPress={() => navigation.navigate('AdminDashboard')}
            />
          )}
          <ListRow
            leftIcon={<PrettyIcon name="roadmap" size="sm" variant="neutral" />}
            title="System Status & Roadmap"
            subtitle="View Flashy releases and roadmap milestones"
            onPress={() => navigation.navigate('Progress')}
          />
        </View>

        {/* Sign Out Action */}
        <AppButton
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          size="md"
          style={styles.logoutBtn}
          textStyle={{ color: colors.error }}
        />

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          FLASHY v1.0.0 • Know what you're wearing.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl * 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.base + 1,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.xs,
    marginTop: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: spacing.xs + 2,
  },
  menuCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeTextCol: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  themeTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  themeSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  modePill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  versionText: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '600',
  },
});
