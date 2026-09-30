import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useFashionTheme, radii, spacing, typography } from '../../constants/theme';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'denim' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const { colors, isDark } = useFashionTheme();
  const isInteractive = !disabled && !loading;

  // Compute theme-aware button styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'denim':
        return {
          container: {
            backgroundColor: colors.denim,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceMuted,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          },
          text: {
            color: colors.text,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.error,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: colors.primary,
          },
        };
      default:
        return {
          container: {
            backgroundColor: colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      disabled={!isInteractive}
      style={[
        styles.base,
        vStyles.container,
        styles[`size_${size}`],
        disabled && { backgroundColor: colors.disabledBg, borderColor: 'transparent' },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            vStyles.text,
            styles[`textSize_${size}`],
            disabled && { color: colors.disabled },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  baseText: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Sizes
  size_sm: {
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    minHeight: 34,
  },
  size_md: {
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  size_lg: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  textSize_sm: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  textSize_md: {
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.base,
  },
  textSize_lg: {
    fontSize: typography.sizes.base + 1,
    lineHeight: typography.lineHeights.md,
    letterSpacing: 0.5,
  },
});
