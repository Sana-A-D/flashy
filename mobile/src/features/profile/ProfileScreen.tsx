import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ListRow } from '../../components/ui/ListRow';
import { PrettyIcon } from '../../components/ui/PrettyIcon';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';
import { useAuthStore } from '../auth/store/useAuthStore';

export const ProfileScreen = ({ navigation }: any) => {
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
      activeTab="Profile"
      title="PROFILE & ACCOUNT"
      subtitle="Your Flashy identity, preferences, and theme"
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
              {user?.name ? user.name[0].toUpperCase() : 'F'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Fashion Explorer'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || 'member@flashy.fashion'}
            </Text>
            <View style={[styles.rolePill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                FLASHY MEMBER ARCHIVE
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

        {/* Fashion Discovery Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          FASHION PREFERENCES
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
            leftIcon={<PrettyIcon name="saved" size="sm" variant="neutral" />}
            title="Saved Wardrobe"
            subtitle="View looks and pieces you have bookmarked"
            onPress={() => navigation.navigate('Saved')}
          />
          <ListRow
            leftIcon={<PrettyIcon name="privacy" size="sm" variant="neutral" />}
            title="Data & Privacy"
            subtitle="Manage your personal fashion data and history"
            onPress={() => navigation.navigate('DataPrivacy')}
          />
          <ListRow
            leftIcon={<PrettyIcon name="settings" size="sm" variant="neutral" />}
            title="All Settings & Channels"
            subtitle="eBay, storage locations, subscription"
            onPress={() => navigation.navigate('Settings')}
          />
          {user?.role === 'ADMIN' && (
            <ListRow
              leftIcon={<PrettyIcon name="admin" size="sm" variant="neutral" />}
              title="Admin Control Center"
              subtitle="System diagnostics and administrative controls"
              onPress={() => navigation.navigate('AdminDashboard')}
            />
          )}
        </View>

        {/* Account Session Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SESSION</Text>
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
            leftIcon={<PrettyIcon name="refresh" size="sm" variant="danger" />}
            title="Sign Out"
            subtitle="Securely sign out of your Flashy session"
            onPress={handleLogout}
          />
        </View>

        <View style={styles.footerNote}>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>
            FLASHY · THE FASHION INTELLIGENCE ARCHIVE
          </Text>
        </View>
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
    padding: spacing.md + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.base + 2,
    fontWeight: '700',
    letterSpacing: 0.1,
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
  footerNote: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerVersion: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
});
