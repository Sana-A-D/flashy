import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useEbay } from '../../hooks/useEbay';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { ScreenContainer, AppCard, AppButton, StatusBadge } from '../../components';
import { colors, spacing, typography, radii } from '../../constants/theme';

export function EbaySettingsScreen() {
  const {
    connection,
    isLoading,
    isAuthenticating,
    isDisconnecting,
    disconnectError,
    isSubmittingLocation,
    connect,
    disconnect,
    submitLocation,
    error,
  } = useEbay();
  const navigation = useNavigation();

  const [addressLine1, setAddressLine1] = React.useState('');
  const [addressLine2, setAddressLine2] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateOrProvince, setStateOrProvince] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [country, setCountry] = React.useState('US');

  const handleLocationSubmit = () => {
    if (!addressLine1 || !city || !stateOrProvince || !postalCode || !country) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    submitLocation({ addressLine1, addressLine2, city, stateOrProvince, postalCode, country });
  };

  if (isLoading) {
    return (
      <ScreenContainer title="eBay Integration" showBack onBack={() => navigation.goBack()}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="eBay Integration"
      subtitle="Direct API connection & sync policies"
      showBack
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error fetching status. Please try again later.</Text>
          </View>
        ) : null}

        {disconnectError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to disconnect from eBay. Please check your connection and try again.
            </Text>
          </View>
        ) : null}

        {connection?.connected ? (
          <AppCard variant="elevated" style={styles.card}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusConnected}>✓ Connected to eBay ({connection.environment})</Text>
              <StatusBadge status={connection.status || 'CONNECTED'} />
            </View>
            <Text style={styles.detailText}>Marketplace: {connection.marketplaceId}</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Policies</Text>
              <Text style={styles.detailText}>
                Fulfillment: {connection.fulfillmentPolicyId || 'Missing / Setup Required'}
              </Text>
              <Text style={styles.detailText}>
                Payment: {connection.paymentPolicyId || 'Missing / Setup Required'}
              </Text>
              <Text style={styles.detailText}>
                Return: {connection.returnPolicyId || 'Missing / Setup Required'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory</Text>
              <Text style={styles.detailText}>
                Location Key: {connection.merchantLocationKey || 'Missing'}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <AppButton
                title="Disconnect Account"
                variant="danger"
                size="sm"
                onPress={() => disconnect()}
                loading={isDisconnecting}
              />
            </View>
          </AppCard>
        ) : connection?.status === 'LOCATION_SETUP_REQUIRED' ? (
          <AppCard variant="elevated" style={styles.card}>
            <Text style={styles.statusPending}>Location Setup Required</Text>
            <Text style={styles.description}>
              eBay requires a physical location to list items. Please provide your business or shipping address.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} placeholder="123 Main St" placeholderTextColor={colors.textMuted} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput style={styles.input} value={addressLine2} onChangeText={setAddressLine2} placeholder="Apt, Suite, etc." placeholderTextColor={colors.textMuted} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="San Jose" placeholderTextColor={colors.textMuted} />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>State/Province *</Text>
                <TextInput style={styles.input} value={stateOrProvince} onChangeText={setStateOrProvince} placeholder="CA" placeholderTextColor={colors.textMuted} />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Postal Code *</Text>
                <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="95125" placeholderTextColor={colors.textMuted} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Country Code *</Text>
              <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="US" maxLength={2} placeholderTextColor={colors.textMuted} />
            </View>

            <View style={styles.actionRow}>
              <AppButton
                title="Complete eBay Setup"
                variant="primary"
                onPress={handleLocationSubmit}
                loading={isSubmittingLocation}
              />
            </View>
          </AppCard>
        ) : (
          <AppCard variant="elevated" style={styles.card}>
            <Text style={styles.statusDisconnected}>Not Connected</Text>
            <Text style={styles.description}>
              Connect your eBay seller account to publish listings directly from Flashy.
            </Text>
            <View style={styles.actionRow}>
              <AppButton
                title="Connect eBay Sandbox"
                variant="primary"
                onPress={() => connect()}
                loading={isAuthenticating}
              />
            </View>
          </AppCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusConnected: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  statusPending: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  statusDisconnected: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.md,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionRow: {
    marginTop: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  errorContainer: {
    backgroundColor: colors.errorBg,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
  },
});
