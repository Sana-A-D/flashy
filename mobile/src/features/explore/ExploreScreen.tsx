import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';

export const ExploreScreen = ({ navigation }: any) => {
  const { colors, isDark } = useFashionTheme();

  const aesthetics = [
    {
      name: 'Selvedge & Raw Denim',
      fabric: '13-16oz Indigo · Japanese Shuttle Loom',
      desc: 'Rigid raw denim, copper rivet construction, honeycombs and natural fade progression.',
      pieces: 'Straight-leg jeans, Type III trucker jackets, denim overshirts',
    },
    {
      name: 'Heritage Workwear',
      fabric: 'Heavy Duck Canvas · Moleskin · Twill',
      desc: 'Built for durability and utilitarian silhouettes. Reinforced pockets and triple-needle stitching.',
      pieces: 'French chore coats, double-knee trousers, carpenter pants',
    },
    {
      name: 'Tailored Minimalist',
      fabric: 'Tropical Wool · Crisp Poplin · Linen',
      desc: 'Clean drapery, subtle textures, monochromatic palettes and intentional proportions.',
      pieces: 'Single-breasted blazers, pleated wide trousers, banded collar shirts',
    },
    {
      name: 'Modern Streetwear',
      fabric: 'Heavyweight Loopback Terry · Nylon Ripstop',
      desc: 'Boxy silhouettes, dropped shoulders, technical outerwear layered with retro runners.',
      pieces: 'Oversized heavyweight hoodies, relaxed cargo pants, shell windbreakers',
    },
  ];

  const fabrics = [
    { name: 'Selvedge Denim', origin: 'Kojima, Japan', badge: 'DENIM' },
    { name: 'Ventile Cotton', origin: 'Manchester, UK', badge: 'FABRIC' },
    { name: 'Harris Tweed', origin: 'Outer Hebrides, Scotland', badge: 'WOOL' },
    { name: 'Bridle Leather', origin: 'Walsall, UK', badge: 'LEATHER' },
  ];

  return (
    <ScreenContainer
      activeTab="Explore"
      title="EXPLORE"
      subtitle="Style directions, silhouettes, and fabric archives"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Editorial Architecture Header */}
        <View
          style={[
            styles.bannerBox,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceMuted,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <Text style={[styles.bannerPill, { color: colors.burgundy }]}>
              FASHION INTELLIGENCE
            </Text>
            <Text style={[styles.bannerSeason, { color: colors.textMuted }]}>
              EDITORIAL ARCHIVE
            </Text>
          </View>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            Fabrics, silhouettes & tailoring
          </Text>
          <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
            Flashy connects real garment attributes—weave, fiber composition, and silhouettes—to current market resale values and verified provenance.
          </Text>
        </View>

        {/* Curated Silhouettes */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            CURATED SILHOUETTES
          </Text>
          <View style={styles.silhouettesGrid}>
            {[
              'Straight-Leg Selvedge',
              'French Chore Jacket',
              'Pleated Wide Trousers',
              'Boxy Heavyweight Tee',
              'Oversized Oxford Shirt',
              'Chunky Commando Loafer',
              'Double-Breasted Wool Coat',
              'Waxed Field Jacket',
            ].map((sil) => (
              <TouchableOpacity
                key={sil}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Scan')}
                style={[
                  styles.silhouetteChip,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.silhouetteText, { color: colors.text }]}>{sil}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Style Directions */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            STYLE DIRECTIONS & ARCHETYPES
          </Text>
          <View style={styles.aestheticsList}>
            {aesthetics.map((item) => (
              <View
                key={item.name}
                style={[
                  styles.aestheticCard,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.aestheticTop}>
                  <Text style={[styles.aestheticTitle, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.aestheticFabricPill, { color: colors.denim }]}>
                    {item.fabric}
                  </Text>
                </View>
                <Text style={[styles.aestheticDesc, { color: colors.textSecondary }]}>
                  {item.desc}
                </Text>
                <View style={[styles.aestheticPiecesRow, { borderTopColor: colors.borderSubtle }]}>
                  <Text style={[styles.aestheticPiecesLabel, { color: colors.textMuted }]}>
                    KEY PIECES:
                  </Text>
                  <Text style={[styles.aestheticPiecesValue, { color: colors.text }]}>
                    {item.pieces}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Fabric & Provenance Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            MATERIAL PROVENANCE
          </Text>
          <View style={styles.fabricsGrid}>
            {fabrics.map((fab) => (
              <View
                key={fab.name}
                style={[
                  styles.fabricCard,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.fabricTop}>
                  <Text style={[styles.fabricName, { color: colors.text }]}>{fab.name}</Text>
                  <Text style={[styles.fabricBadge, { color: colors.burgundy }]}>
                    {fab.badge}
                  </Text>
                </View>
                <Text style={[styles.fabricOrigin, { color: colors.textSecondary }]}>
                  Origin: {fab.origin}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl * 2,
  },
  bannerBox: {
    padding: spacing.md + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bannerPill: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  bannerSeason: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: typography.sizes.base + 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  silhouettesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  silhouetteChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  silhouetteText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '500',
  },
  aestheticsList: {
    gap: spacing.sm + 2,
  },
  aestheticCard: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  aestheticTop: {
    marginBottom: 4,
  },
  aestheticTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aestheticFabricPill: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  aestheticDesc: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  aestheticPiecesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderTopWidth: 1,
    paddingTop: spacing.xs + 2,
    gap: 6,
  },
  aestheticPiecesLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  aestheticPiecesValue: {
    fontSize: typography.sizes.xs,
    flex: 1,
  },
  fabricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  fabricCard: {
    width: '48%',
    padding: spacing.sm + 2,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  fabricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  fabricName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    flex: 1,
  },
  fabricBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  fabricOrigin: {
    fontSize: 10,
    marginTop: 2,
  },
});
