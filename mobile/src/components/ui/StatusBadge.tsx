import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useFashionTheme, radii, spacing, typography } from '../../constants/theme';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, style }) => {
  const { colors, isDark } = useFashionTheme();
  const normalized = status.toUpperCase();

  let bg = colors.surfaceMuted;
  let text = colors.textSecondary;
  let display = label || normalized.replace(/_/g, ' ');

  switch (normalized) {
    case 'READY_TO_LIST':
    case 'SAVED':
      bg = colors.burgundyLight;
      text = colors.burgundy;
      break;
    case 'SOLD':
    case 'CONNECTED':
    case 'ACTIVE':
      bg = colors.successBg;
      text = colors.success;
      break;
    case 'LISTED':
    case 'PREPARED':
    case 'EXACT_MATCH':
      bg = isDark ? colors.denimDark : colors.denimLight;
      text = colors.denim;
      break;
    case 'INVENTORY':
    case 'DRAFT':
    case 'UNPREPARED':
      bg = colors.surfaceCream;
      text = colors.textSecondary;
      break;
    case 'ERROR':
    case 'DISCONNECTED':
      bg = colors.errorBg;
      text = colors.error;
      break;
    case 'ARCHIVED':
    case 'ENDED':
      bg = colors.disabledBg;
      text = colors.textMuted;
      break;
    default:
      bg = colors.surfaceMuted;
      text = colors.textSecondary;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: text }]}>{display}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
