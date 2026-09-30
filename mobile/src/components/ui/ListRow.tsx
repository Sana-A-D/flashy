import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useFashionTheme, spacing, typography } from '../../constants/theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leftIcon,
  rightElement,
  onPress,
  showChevron = true,
  style,
}) => {
  const { colors, isDark } = useFashionTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
          borderBottomColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.rightContainer}>
        {rightElement}
        {showChevron && onPress && (
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  leftIconContainer: {
    marginRight: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    lineHeight: typography.lineHeights.xs + 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  chevron: {
    fontSize: 22,
    marginLeft: spacing.xs,
    fontWeight: '300',
  },
});
