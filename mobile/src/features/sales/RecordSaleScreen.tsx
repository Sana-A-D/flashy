import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useItem } from '../../hooks/useItems';
import { useRecordSale } from '../../hooks/useSales';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { currencyToCents, centsToCurrency } from '../../utils/currency';
import {
  AppCard,
  AppButton,
  AppInput,
  AppHeader,
  SectionHeader,
  LoadingState,
  ErrorState,
} from '../../components';

export const RecordSaleScreen = ({ route, navigation }: any) => {
  const { itemId } = route.params;
  const { data: item, isLoading, error, refetch } = useItem(itemId);
  const recordSaleMutation = useRecordSale(itemId);

  const [marketplace, setMarketplace] = useState('EBAY');
  const [salePrice, setSalePrice] = useState('');
  const [platformFees, setPlatformFees] = useState('');
  const [shippingCost, setShippingCost] = useState('');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading item details..." />
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message="Could not load item to record sale." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const salePriceInCents = currencyToCents(salePrice);
  const feesInCents = currencyToCents(platformFees);
  const shippingInCents = currencyToCents(shippingCost);
  const purchaseCostInCents = Number(item.purchasePrice || 0);

  // Profit calculation preview in cents
  const estimatedProfitInCents = salePriceInCents - feesInCents - shippingInCents - purchaseCostInCents;

  const handleSave = async () => {
    if (!salePrice.trim() || salePriceInCents <= 0) {
      Alert.alert('Required', 'Please enter a valid sale price.');
      return;
    }

    try {
      const res = await recordSaleMutation.mutateAsync({
        salePrice: salePriceInCents,
        marketplaceFees: feesInCents > 0 ? feesInCents : undefined,
        shippingCost: shippingInCents > 0 ? shippingInCents : undefined,
      });

      // Clear sync report alert
      const profitDisplay = res.financials?.profit !== undefined
        ? centsToCurrency(res.financials.profit)
        : centsToCurrency(estimatedProfitInCents);

      let message = `Sale recorded successfully! Profit: $${profitDisplay}.`;
      if (res.syncResults?.failed && res.syncResults.failed.length > 0) {
        message += `\n\nNotice: Could not automatically delist from: ${res.syncResults.failed.map((f: any) => f.marketplace).join(', ')}. Please manually close those listings.`;
      }

      Alert.alert('Sale Completed', message, [
        {
          text: 'Done',
          onPress: () => {
            navigation.navigate('ItemDetail', { id: item.id });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Record Sale Error', err.response?.data?.error?.message || err.message || 'Failed to record sale');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Record Item Sale"
        subtitle={`Closing out: ${item.title}`}
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* Sold Channel Selector */}
          <AppCard variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Selling Channel</Text>
            <View style={styles.channelsRow}>
              {['EBAY', 'POSHMARK', 'MERCARI', 'DEPOP', 'LOCAL', 'OTHER'].map((mp) => (
                <Text
                  key={mp}
                  onPress={() => setMarketplace(mp)}
                  style={[
                    styles.channelChip,
                    marketplace === mp && styles.channelChipActive,
                  ]}
                >
                  {mp}
                </Text>
              ))}
            </View>

            <AppInput
              label="Final Sale Price ($) *"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={salePrice}
              onChangeText={setSalePrice}
            />

            <View style={styles.twoColumn}>
              <AppInput
                label="Platform Fees ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={platformFees}
                onChangeText={setPlatformFees}
                containerStyle={styles.columnItem}
              />
              <AppInput
                label="Shipping Cost ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={shippingCost}
                onChangeText={setShippingCost}
                containerStyle={styles.columnItem}
              />
            </View>
          </AppCard>

          {/* Real-time Profit Calculation */}
          <AppCard variant="muted" style={styles.card}>
            <Text style={styles.profitHeader}>Financial Summary</Text>

            <View style={styles.profitBreakdown}>
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Gross Sale Price</Text>
                <Text style={styles.profitVal}>+${centsToCurrency(salePriceInCents) || '0.00'}</Text>
              </View>
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Purchase Cost</Text>
                <Text style={styles.profitVal}>-${centsToCurrency(purchaseCostInCents) || '0.00'}</Text>
              </View>
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Platform Fees</Text>
                <Text style={styles.profitVal}>-${centsToCurrency(feesInCents) || '0.00'}</Text>
              </View>
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Shipping / Packing</Text>
                <Text style={styles.profitVal}>-${centsToCurrency(shippingInCents) || '0.00'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.profitRow}>
                <Text style={styles.netProfitLabel}>Estimated Net Profit</Text>
                <Text
                  style={[
                    styles.netProfitVal,
                    { color: estimatedProfitInCents >= 0 ? colors.success : colors.error },
                  ]}
                >
                  ${centsToCurrency(estimatedProfitInCents) || '0.00'}
                </Text>
              </View>
            </View>
          </AppCard>

          <AppButton
            title="Confirm Sale & Delist Channels"
            onPress={handleSave}
            loading={recordSaleMutation.isPending}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  channelChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    overflow: 'hidden',
  },
  channelChipActive: {
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  columnItem: {
    flex: 1,
  },
  profitHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  profitBreakdown: {
    gap: spacing.xxs,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  profitLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  profitVal: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  netProfitLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  netProfitVal: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
