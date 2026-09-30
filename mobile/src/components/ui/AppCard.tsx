import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useFashionTheme, radii, spacing } from '../../constants/theme';

export interface AppCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'muted' | 'outline';
  style?: ViewStyle;
  onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'flat',
  style,
  onPress,
  ...props
}) => {
  const { colors, isDark } = useFashionTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        };
      case 'flat':
        return {
          backgroundColor: isDark ? colors.surface : colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        };
      case 'muted':
        return {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        };
    }
  };

  const cardStyle = [
    styles.base,
    getVariantStyles(),
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={cardStyle}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    padding: spacing.md,
  },
});
