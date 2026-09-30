import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';
import { useFashionItems } from '../../hooks/useFashion';
import { useAuthStore } from '../auth/store/useAuthStore';
import { resolveImageUrl } from '../../utils/imageUrl';

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80';

const EDITORIAL_STORIES = [
  {
    id: 'story-1',
    tag: 'FABRIC DOSSIER',
    title: '14.5oz Japanese Selvedge & Natural Fades',
    subtitle: 'Shuttle-loomed in Kojima. Rigid indigo with copper rivets.',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'story-2',
    tag: 'SILHOUETTE ARCHIVE',
    title: 'The French Moleskin Chore Jacket',
    subtitle: 'Utilitarian workwear tailored with clean, boxy proportions.',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'story-3',
    tag: 'SEASONAL MOOD',
    title: 'Deconstructed Tailoring & Heavy Poplin',
    subtitle: 'Wide pleated trousers paired with relaxed shirting.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
];

export const HomeScreen = ({ navigation }: any) => {
  const user = useAuthStore((state) => state.user);
  const { colors, isDark, toggleTheme } = useFashionTheme();
  const { data: recentItems = [], isLoading, refetch } = useFashionItems('RECENT');
  const { data: savedItems = [] } = useFashionItems('SAVED');

  const latestScan = recentItems.length > 0 ? recentItems[0] : null;
  const latestScanPhoto = resolveImageUrl(latestScan?.photos?.[0]?.url);
  const heroImageUri = latestScanPhoto || FALLBACK_HERO_IMAGE;

  return (
    <ScreenContainer activeTab="Home" showHeader={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Editorial Fashion Magazine Masthead */}
        <View style={styles.masthead}>
          <View style={styles.mastheadMetaRow}>
            <Text style={[styles.issueTag, { color: colors.textMuted }]}>
              VOL. IV · SS26 ISSUE
            </Text>
            <View style={styles.mastheadActions}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.circleActionBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceMuted,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                accessibilityLabel="Toggle Theme Mode"
              >
                <Text style={{ fontSize: 13 }}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={[
                  styles.circleActionBtn,
                  {
                    backgroundColor: colors.burgundyLight,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                accessibilityLabel="View Profile"
              >
                <Text style={[styles.avatarLetter, { color: colors.burgundy }]}>
                  {user?.name ? user.name[0].toUpperCase() : 'F'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.brandTitle, { color: colors.text }]}>FLASHY</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            THE VISUAL WARDROBE ARCHIVE
          </Text>
        </View>

        {/* Lead Hero Editorial Spread (Layered & Asymmetric) */}
        <View
          style={[
            styles.heroFrame,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceMuted,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <ImageBackground
            source={{ uri: heroImageUri }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
          >
            {/* Scrim overlay for dramatic fashion contrast */}
            <View style={styles.heroScrim} />

            <View style={styles.heroContentLayer}>
              <View style={styles.heroTagRow}>
                <View
                  style={[
                    styles.heroTagPill,
                    { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
                  ]}
                >
                  <Text style={styles.heroTagText}>
                    {latestScan ? 'LATEST SCAN DOSSIER' : 'EDITORIAL FEATURE'}
                  </Text>
                </View>
                {latestScan && (
                  <Text style={styles.heroMetaDate}>
                    {new Date(latestScan.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </View>

              <Text style={styles.heroHeadline} numberOfLines={2}>
                {latestScan ? latestScan.title : 'Raw Selvedge & Deconstructed Tailoring.'}
              </Text>

              <Text style={styles.heroSummary} numberOfLines={2}>
                {latestScan
                  ? [latestScan.brand, latestScan.category, latestScan.material].filter(Boolean).join(' · ')
                  : 'Identify weave composition, real resale valuations, and tailored outfit coordinates.'}
              </Text>

              <View style={styles.heroActionsRow}>
                <AppButton
                  title="Scan a Garment"
                  onPress={() => navigation.navigate('Scan')}
                  variant="primary"
                  size="md"
                  style={styles.heroPrimaryBtn}
                />
                {latestScan && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FashionAnalysis', { id: latestScan.id })}
                    style={styles.heroInspectBtn}
                  >
                    <Text style={styles.heroInspectBtnText}>Inspect Piece →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Horizontal Visual Browsing: User's Scanned Discoveries */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                VISUAL DISCOVERIES
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Photographed pieces and verified breakdowns
              </Text>
            </View>
            {recentItems.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
                <Text style={[styles.sectionActionText, { color: colors.burgundy }]}>
                  View all ({recentItems.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentItems.length === 0 ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Scan')}
              style={[
                styles.emptyEditorialBanner,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.emptyLeft}>
                <Text style={[styles.emptyLabel, { color: colors.burgundy }]}>
                  BEGIN YOUR ARCHIVE
                </Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Photograph your first piece
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  Capture any garment to reveal fabric DNA, current resale comps, and complete outfit formulas.
                </Text>
                <View style={[styles.emptyBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.emptyBtnText, { color: colors.text }]}>
                    Open Scanner →
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lookbookScroll}
            >
              {recentItems.map((item) => {
                const photoUri = resolveImageUrl(item.photos?.[0]?.url);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.88}
                    style={[
                      styles.lookbookCard,
                      {
                        backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    onPress={() => navigation.navigate('FashionAnalysis', { id: item.id })}
                  >
                    <View style={[styles.lookbookPhotoFrame, { backgroundColor: colors.surfaceMuted }]}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.lookbookPhoto} />
                      ) : (
                        <View style={styles.placeholderBox}>
                          <Text style={styles.placeholderIcon}>📷</Text>
                        </View>
                      )}
                      {item.saved && (
                        <View style={[styles.savedBadge, { backgroundColor: colors.burgundy }]}>
                          <Text style={styles.savedBadgeText}>SAVED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.lookbookMetaBox}>
                      <Text style={[styles.lookbookBrand, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.brand || 'ARCHIVE SPECIMEN'}
                      </Text>
                      <Text style={[styles.lookbookTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.lookbookAttributes, { color: colors.textSecondary }]} numberOfLines={1}>
                        {[item.category, item.color, item.material].filter(Boolean).join(' · ') || 'Garment'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Editorial Stories & Style Directions (Magazine Layered Spread) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                EDITORIAL LOOKBOOK
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Curated directions, silhouettes, and fabric essays
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
              <Text style={[styles.sectionActionText, { color: colors.burgundy }]}>
                Explore all
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.storiesContainer}>
            {EDITORIAL_STORIES.map((story) => (
              <TouchableOpacity
                key={story.id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Explore')}
                style={[
                  styles.storyCard,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Image source={{ uri: story.image }} style={styles.storyImage} />
                <View style={styles.storyScrim} />
                <View style={styles.storyContent}>
                  <Text style={styles.storyTag}>{story.tag}</Text>
                  <Text style={styles.storyTitle}>{story.title}</Text>
                  <Text style={styles.storySubtitle}>{story.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Curated Silhouettes Pills */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.xs }]}>
            CURATED SILHOUETTES
          </Text>
          <View style={styles.silhouettesWrap}>
            {[
              'Straight-Leg Selvedge',
              'French Chore Jacket',
              'Boxy Heavyweight Tee',
              'Pleated Wide Trousers',
              'Oversized Oxford Poplin',
              'Chunky Commando Loafer',
            ].map((sil) => (
              <TouchableOpacity
                key={sil}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Explore')}
                style={[
                  styles.silhouettePill,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.silhouettePillText, { color: colors.text }]}>{sil}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  masthead: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  mastheadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  issueTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  mastheadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    lineHeight: 40,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  heroFrame: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    minHeight: 330,
  },
  heroBackground: {
    width: '100%',
    height: 330,
    justifyContent: 'flex-end',
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 14, 20, 0.65)',
  },
  heroContentLayer: {
    padding: spacing.lg,
  },
  heroTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  heroTagText: {
    color: '#F4F1EA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroMetaDate: {
    color: '#D4CFC4',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  heroSummary: {
    fontSize: 12,
    color: '#E0DDD5',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroPrimaryBtn: {
    flex: 1,
  },
  heroInspectBtn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroInspectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionActionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyEditorialBanner: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  emptyLeft: {
    alignItems: 'flex-start',
  },
  emptyLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: typography.sizes.base + 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  emptyBtn: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  emptyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  lookbookScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  lookbookCard: {
    width: 175,
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lookbookPhotoFrame: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  lookbookPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  savedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  savedBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  lookbookMetaBox: {
    padding: spacing.xs + 2,
  },
  lookbookBrand: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  lookbookTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  lookbookAttributes: {
    fontSize: 10,
    marginTop: 2,
  },
  storiesContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm + 2,
  },
  storyCard: {
    height: 180,
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  storyImage: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  storyScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 16, 22, 0.6)',
  },
  storyContent: {
    padding: spacing.md,
  },
  storyTag: {
    color: '#D4A853',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  storyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  storySubtitle: {
    color: '#DDD9D0',
    fontSize: 11,
    marginTop: 2,
  },
  silhouettesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.screenPadding,
  },
  silhouettePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  silhouettePillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
