import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useFashionTheme, spacing, typography, radii } from '../../../constants/theme';
import { AppButton, AppInput } from '../../../components';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();
  const { colors, isDark, toggleTheme } = useFashionTheme();

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    try {
      await login({ email, password });
    } catch (error: any) {
      const message =
        error.error?.message || error.message || 'Login failed. Please check your credentials.';
      setErrorMsg(message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Quick Theme Switcher */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeBtn,
                {
                  backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceMuted,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text style={{ fontSize: 13 }}>{isDark ? '☀️ Light' : '🌙 Dark'}</Text>
            </TouchableOpacity>
          </View>

          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <Text style={[styles.brandWordmark, { color: colors.text }]}>FLASHY</Text>
            <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
              Know what you're wearing.
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Visual garment recognition, real market resale values & styling formulas.
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>SIGN IN</Text>

            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            <AppInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.footerLink, { color: colors.primary }]}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  themeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandWordmark: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 3.5,
  },
  brandTagline: {
    fontSize: typography.sizes.sm,
    letterSpacing: 0.5,
    marginTop: 4,
    fontWeight: '600',
  },
  brandSubtitle: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 290,
  },
  card: {
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  errorBox: {
    padding: spacing.sm,
    borderRadius: radii.xs,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
  },
  footerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
});
