import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';
import { SimilarItem } from '../../types/fashion';

interface ProductCardProps {
  item: SimilarItem;
  badge?: string;
  badgeVariant?: 'accent' | 'success' | 'muted';
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, badge, badgeVariant = 'muted' }) => {
  const { colors, isDark } = useFashionTheme();

  const handleOpenSource = async () => {
    if (!item.url) {
      Alert.alert('Link Unavailable', 'No direct URL is available for this external listing.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(item.url);
      if (supported) {
        await Linking.openURL(item.url);
      } else {
        Alert.alert('Unable to Open Link', 'The link could not be opened on your device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open source URL.');
    }
  };

  const formattedPrice =
    item.price != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: item.currency || 'USD',
          maximumFractionDigits: 0,
        }).format(item.price)
      : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceMuted }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.noImage}>
            <Text style={[styles.noImageText, { color: colors.textMuted }]}>NO PHOTO</Text>
          </View>
        )}
        {badge ? (
          <View
            style={[
              styles.badge,
              badgeVariant === 'accent' && { backgroundColor: colors.primary },
              badgeVariant === 'success' && { backgroundColor: colors.success },
              badgeVariant === 'muted' && {
                backgroundColor: isDark ? colors.surface : colors.surfaceCream,
                borderColor: colors.borderSubtle,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                (badgeVariant === 'accent' || badgeVariant === 'success') && { color: '#FFFFFF' },
                badgeVariant === 'muted' && { color: colors.textSecondary },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.sourceRow}>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.sourceName || item.source}
          </Text>
          {item.condition ? (
            <Text style={[styles.conditionText, { color: colors.textMuted }]}>
              · {item.condition}
            </Text>
          ) : null}
          {item.matchType ? (
            <View
              style={[
                styles.matchPill,
                {
                  backgroundColor:
                    item.matchType === 'EXACT_MATCH'
                      ? colors.denimLight
                      : isDark
                      ? colors.surfaceMuted
                      : colors.surfaceCream,
                },
              ]}
            >
              <Text
                style={[
                  styles.matchPillText,
                  {
                    color: item.matchType === 'EXACT_MATCH' ? colors.denim : colors.textSecondary,
                  },
                ]}
              >
                {item.matchType === 'EXACT_MATCH'
                  ? 'EXACT'
                  : item.matchType === 'CLOSE_MATCH'
                  ? 'SIMILAR'
                  : 'STYLE'}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.brand ? (
          <Text style={[styles.brand, { color: colors.textMuted }]}>{item.brand}</Text>
        ) : null}

        <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.price, { color: colors.text }]}>
            {formattedPrice || 'Price unlisted'}
          </Text>
          {item.url ? (
            <TouchableOpacity
              onPress={handleOpenSource}
              style={[styles.viewBtn, { backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceMuted }]}
            >
              <Text style={[styles.viewBtnText, { color: colors.text }]}>View piece ↗</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs + 2,
    left: spacing.xs + 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing.md,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  conditionText: {
    fontSize: 11,
    marginLeft: 4,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    marginBottom: 4,
  },
  brand: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
  },
  price: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.2,
  },
  viewBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xs,
  },
  viewBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
  },
  matchPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.xs,
    marginLeft: 6,
  },
  matchPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
