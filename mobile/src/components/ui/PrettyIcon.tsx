import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useFashionTheme, radii } from '../../constants/theme';

export type IconName =
  | 'home'
  | 'explore'
  | 'inventory'
  | 'saved'
  | 'bookmark'
  | 'bookmarkCheck'
  | 'heart'
  | 'hanger'
  | 'profile'
  | 'add'
  | 'settings'
  | 'marketplace'
  | 'ebay'
  | 'storage'
  | 'subscription'
  | 'privacy'
  | 'admin'
  | 'roadmap'
  | 'camera'
  | 'check'
  | 'chevronRight'
  | 'chevronBack'
  | 'search'
  | 'tag'
  | 'clock'
  | 'refresh'
  | 'trash'
  | 'sparkle'
  | 'arrowUpRight';

export interface PrettyIconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'coral' | 'gold' | 'silk' | 'cream' | 'neutral' | 'success' | 'danger' | 'denim';
  containerStyle?: ViewStyle;
}

// Clean, functional typography glyphs only — NO robot, AI sparkle, or decorative clutter
const ICON_SYMBOLS: Record<IconName, string> = {
  home: '⌂',
  explore: '◎',
  inventory: '▤',
  saved: '🔖',
  bookmark: '🔖',
  bookmarkCheck: '★',
  heart: '♥',
  hanger: '☖',
  profile: '👤',
  add: '＋',
  settings: '⚙',
  marketplace: '🌐',
  ebay: '⚡',
  storage: '🗄',
  subscription: '❖',
  privacy: '🔒',
  admin: '✦',
  roadmap: '⚑',
  camera: '📷',
  check: '✓',
  chevronRight: '›',
  chevronBack: '‹',
  search: '🔍',
  tag: '🏷',
  clock: '⏱',
  refresh: '↻',
  trash: '✕',
  sparkle: '✦',
  arrowUpRight: '↗',
};

export const PrettyIcon: React.FC<PrettyIconProps> = ({
  name,
  size = 'md',
  variant = 'neutral',
  containerStyle,
}) => {
  const { colors, isDark } = useFashionTheme();
  const symbol = ICON_SYMBOLS[name] || '•';

  const getVariantStyles = () => {
    switch (variant) {
      case 'coral':
        return {
          bg: colors.burgundyLight,
          border: colors.borderSubtle,
          text: colors.burgundy,
        };
      case 'gold':
        return {
          bg: colors.leatherLight,
          border: colors.borderSubtle,
          text: colors.leather,
        };
      case 'silk':
      case 'denim':
        return {
          bg: isDark ? colors.denimDark : colors.denimLight,
          border: colors.borderSubtle,
          text: colors.denim,
        };
      case 'cream':
        return {
          bg: colors.surfaceCream,
          border: colors.borderSubtle,
          text: colors.textSecondary,
        };
      case 'neutral':
        return {
          bg: colors.surfaceMuted,
          border: colors.borderSubtle,
          text: colors.textSecondary,
        };
      case 'success':
        return {
          bg: colors.successBg,
          border: colors.borderSubtle,
          text: colors.success,
        };
      case 'danger':
        return {
          bg: colors.errorBg,
          border: colors.borderSubtle,
          text: colors.error,
        };
      default:
        return {
          bg: colors.surfaceMuted,
          border: colors.borderSubtle,
          text: colors.textSecondary,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.baseBadge,
        styles[`size_${size}`],
        {
          backgroundColor: vStyles.bg,
          borderColor: vStyles.border,
        },
        containerStyle,
      ]}
    >
      <Text style={[styles.symbol, styles[`symbol_${size}`], { color: vStyles.text }]}>
        {symbol}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  size_xs: {
    width: 22,
    height: 22,
    borderRadius: radii.xs + 2,
  },
  size_sm: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
  },
  size_md: {
    width: 36,
    height: 36,
    borderRadius: radii.sm + 2,
  },
  size_lg: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
  },
  symbol: {
    fontWeight: '600',
    textAlign: 'center',
  },
  symbol_xs: {
    fontSize: 11,
  },
  symbol_sm: {
    fontSize: 14,
  },
  symbol_md: {
    fontSize: 17,
  },
  symbol_lg: {
    fontSize: 22,
  },
});
