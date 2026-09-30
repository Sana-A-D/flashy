import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useFashionTheme, radii, spacing, typography } from '../../constants/theme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const { colors, isDark } = useFashionTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          error ? { backgroundColor: colors.errorBg } : null,
          inputStyle,
        ]}
        {...props}
      />
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      )}
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    minHeight: 46,
  },
  hint: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xxs,
  },
  error: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xxs,
    fontWeight: typography.weights.medium,
  },
});
