import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../auth/store/useAuthStore';
import { useDataPrivacy } from '../../hooks/useDataPrivacy';
import { colors, spacing, typography, radii } from '../../constants/theme';
import {
  ScreenContainer,
  AppCard,
  AppButton,
  AppInput,
  SectionHeader,
} from '../../components';

export const DataPrivacyScreen = ({ navigation }: any) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { exportData, isExporting, deleteAccount, isDeleting } = useDataPrivacy();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = async () => {
    try {
      const data = await exportData();
      Alert.alert(
        'Export Generated',
        `Your inventory data has been packaged successfully.\n\nTotal Items: ${data?.items?.length || 0}\nTotal Sales: ${data?.summary?.totalSales || 0}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Export Failed',
        err.response?.data?.error?.message || err.message || 'Could not export data.'
      );
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in the confirmation box below to confirm account deletion.');
      return;
    }

    Alert.alert(
      'Permanent Deletion',
      'This will permanently delete your account, inventory records, and sales history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(deleteConfirmation.trim());
              await logout();
            } catch (err: any) {
              Alert.alert(
                'Delete Failed',
                err.response?.data?.error?.message || err.message || 'Could not delete account.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer
      title="Data & Privacy"
      subtitle="Export wardrobe archive or manage account"
      showBack
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Info Card */}
        <AppCard variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Account Identity</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Membership</Text>
            <Text style={styles.value}>Flashy Member</Text>
          </View>
        </AppCard>

        {/* Export Data */}
        <AppCard variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Export Your Fashion Data</Text>
          <Text style={styles.cardSubtitle}>
            Download a portable copy of your scanned fashion items, photo library, visual identifications, and wardrobe archive.
          </Text>

          <AppButton
            title="Download Fashion Data Export"
            onPress={handleExportData}
            loading={isExporting}
            variant="outline"
            size="md"
            style={{ marginTop: spacing.sm }}
          />
        </AppCard>

        {/* Delete Account (Destructive) */}
        <AppCard variant="elevated" style={styles.card}>
          <Text style={styles.dangerTitle}>Delete Account</Text>
          <Text style={styles.dangerSubtitle}>
            Permanently delete your user account and wipe all stored inventory items, listings, and financial history.
          </Text>

          <AppInput
            label='Type "DELETE" to confirm:'
            placeholder="DELETE"
            value={deleteConfirmation}
            onChangeText={setDeleteConfirmation}
            autoCapitalize="characters"
            containerStyle={{ marginTop: spacing.xs }}
          />

          <AppButton
            title="Permanently Delete Account"
            onPress={handleDeleteAccount}
            loading={isDeleting}
            variant="danger"
            size="md"
            style={{ marginTop: spacing.xs }}
          />
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  dangerCard: {
    borderColor: colors.error + '40',
    backgroundColor: colors.surface,
  },
  dangerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  dangerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.sm,
  },
});
