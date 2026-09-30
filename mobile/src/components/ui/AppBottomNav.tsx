import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFashionTheme, spacing, typography } from '../../constants/theme';
import { PrettyIcon, IconName } from './PrettyIcon';

export type TabKey =
  | 'Home'
  | 'Explore'
  | 'Scan'
  | 'Saved'
  | 'Profile'
  | 'Dashboard'
  | 'Inventory'
  | 'AddItem'
  | 'Analytics'
  | 'Marketplaces'
  | 'Settings';

export interface AppBottomNavProps {
  activeTab: TabKey;
}

interface NavItem {
  key: TabKey;
  label: string;
  iconName: IconName;
  route: string;
  isSpecial?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'Home', label: 'Home', iconName: 'home', route: 'Home' },
  { key: 'Explore', label: 'Explore', iconName: 'explore', route: 'Explore' },
  { key: 'Scan', label: 'Scan', iconName: 'camera', route: 'Scan', isSpecial: true },
  { key: 'Saved', label: 'Wardrobe', iconName: 'saved', route: 'Saved' },
  { key: 'Profile', label: 'Profile', iconName: 'profile', route: 'Profile' },
];

export const AppBottomNav: React.FC<AppBottomNavProps> = ({ activeTab }) => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useFashionTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
          borderTopColor: colors.borderSubtle,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.key;

        if (item.isSpecial) {
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.85}
              style={styles.specialTabButton}
              accessibilityRole="button"
              accessibilityLabel="Scan Garment"
            >
              <View
                style={[
                  styles.specialBadge,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.specialIconText}>📷</Text>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: colors.primary,
                    fontWeight: typography.weights.bold,
                  },
                ]}
              >
                Scan
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={styles.iconWrapper}>
              <PrettyIcon
                name={item.iconName}
                size="xs"
                variant={isActive ? (isDark ? 'coral' : 'gold') : 'neutral'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.text : colors.textMuted,
                  fontWeight: isActive ? typography.weights.bold : typography.weights.medium,
                },
              ]}
            >
              {item.label}
            </Text>
            {isActive && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    minHeight: 58,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrapper: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: typography.sizes.xs - 1,
    letterSpacing: 0.3,
  },
  activeIndicator: {
    width: 14,
    height: 2,
    borderRadius: 1,
    marginTop: 3,
  },
  specialTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  specialBadge: {
    width: 38,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  specialIconText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
