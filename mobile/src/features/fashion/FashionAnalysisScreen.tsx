import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { PrettyIcon } from '../../components/ui/PrettyIcon';
import { ProductCard } from '../../components/fashion/ProductCard';
import { colors, useFashionTheme, spacing, typography, radii, shadows } from '../../constants/theme';
import {
  useFashionItem,
  useUpdateFashionItem,
  useToggleSaveFashionItem,
  useResearchFashionItem,
  useDeleteFashionItem,
} from '../../hooks/useFashion';

import { resolveImageUrl } from '../../utils/imageUrl';

const EDITORIAL_LOOKBOOK_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80',
  'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1000&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80',
];

const TREND_EDITORIAL_IMAGES = [
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80',
];

export const FashionAnalysisScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useFashionTheme();
  const id = route.params?.id || route.params?.itemId;
  const { data: item, isLoading, error, refetch } = useFashionItem(id);
  const updateMutation = useUpdateFashionItem();
  const toggleSaveMutation = useToggleSaveFashionItem();
  const researchMutation = useResearchFashionItem();
  const deleteMutation = useDeleteFashionItem();

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editMaterial, setEditMaterial] = useState('');
  const [editFit, setEditFit] = useState('');
  const [editStyle, setEditStyle] = useState('');

  // Primary screen state hooks (MUST be declared before any conditional returns)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'INFO' | 'DEALS' | 'TRENDS' | 'STYLE'>('INFO');
  const [dealFilter, setDealFilter] = useState<'ALL' | 'EXACT' | 'NEW' | 'RESALE' | 'CHEAPER'>('ALL');
  const [styleOccasion, setStyleOccasion] = useState<'Casual' | 'University' | 'Date' | 'Party' | 'Work' | 'Travel'>('Casual');
  const [selectedStyleLook, setSelectedStyleLook] = useState<any | null>(null);

  const openEditModal = () => {
    if (!item) return;
    setEditTitle(item.title || '');
    setEditBrand(item.brand || item.identification?.possibleBrand || '');
    setEditCategory(item.category || item.identification?.category || '');
    setEditColor(item.color || item.identification?.color || '');
    setEditMaterial(item.material || item.identification?.material || '');
    setEditFit(item.fit || item.identification?.fit || '');
    setEditStyle(item.style || item.identification?.style || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!item) return;
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: {
          title: editTitle.trim() || undefined,
          brand: editBrand.trim() || null,
          category: editCategory.trim() || null,
          color: editColor.trim() || null,
          material: editMaterial.trim() || null,
          fit: editFit.trim() || null,
          style: editStyle.trim() || null,
        },
      });
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update details');
    }
  };

  const handleToggleSave = async () => {
    if (!item) return;
    try {
      await toggleSaveMutation.mutateAsync({
        id: item.id,
        save: !item.saved,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save item');
    }
  };

  const handleTriggerResearch = async () => {
    if (!item) return;
    try {
      await researchMutation.mutateAsync(item.id);
    } catch (err: any) {
      Alert.alert('Research Error', err.message || 'Failed to complete research');
    }
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      const shareTitle = item.title;
      const details = [
        item.brand ? `Brand: ${item.brand}` : null,
        item.material ? `Material: ${item.material}` : null,
        item.style ? `Aesthetic: ${item.style}` : null,
      ].filter(Boolean).join('\n');

      await Share.share({
        title: `Flashy: ${shareTitle}`,
        message: `Check out this fashion discovery on Flashy:\n\n${shareTitle}\n${details}\n\nKnow what you're wearing.`,
      });
    } catch (err: any) {
      console.warn('Share canceled or failed:', err);
    }
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      'Remove from Flashy',
      'Are you sure you want to delete this fashion scan from your records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(item.id);
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home');
              }
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not delete item');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer showBack={true} onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} title="FASHION REPORT">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.loadingText}>Understanding your piece...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !item) {
    return (
      <ScreenContainer showBack={true} onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} title="FASHION REPORT">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {error ? (error as any).message || 'Could not load fashion intelligence.' : 'Fashion piece not found.'}
          </Text>
          <AppButton title="Try Again" onPress={() => refetch()} variant="secondary" size="sm" />
          <AppButton title="Go Back" onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} variant="ghost" size="sm" style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenContainer>
    );
  }

  const idf = item.identification;
  const primaryPhoto = resolveImageUrl(item.photos && item.photos.length > 0 ? item.photos[0].url : null);
  const pricing = item.pricing;
  const similarItems = item.similarItems || [];
  const cheaperItems = item.cheaperAlternatives || [];
  const research = item.research;
  const isResearching = researchMutation.isPending;

  const activeDisplayPhoto = resolveImageUrl(
    item.photos && item.photos.length > 0
      ? (item.photos[selectedPhotoIndex]?.url || primaryPhoto)
      : null
  );

  // Filter matched product groups according to dealFilter
  const matchedGroups = item.matchedProducts || [];
  const filteredMatchedGroups = matchedGroups.filter((g) => {
    if (dealFilter === 'ALL') return true;
    if (dealFilter === 'EXACT') return g.matchType === 'EXACT_MATCH';
    if (dealFilter === 'NEW') {
      return (g.listings || []).some((l) => l.condition?.toLowerCase().includes('new'));
    }
    if (dealFilter === 'RESALE') {
      return (g.listings || []).some(
        (l) =>
          l.condition?.toLowerCase().includes('pre-owned') ||
          l.condition?.toLowerCase().includes('used') ||
          l.marketplace?.toLowerCase().includes('ebay')
      );
    }
    if (dealFilter === 'CHEAPER') return false; // Handled in CHEAPER alternatives section
    return true;
  });

  return (
    <ScreenContainer showHeader={false} showBottomNav={true} activeTab="Home">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Floating Back & Save & Share Row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[
              styles.navCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(19, 25, 34, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: colors.borderSubtle,
                borderWidth: 1,
              },
            ]}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            accessibilityLabel="Back"
          >
            <Text style={[styles.navCircleIcon, { color: colors.text }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.navRightActions}>
            <TouchableOpacity
              style={[
                styles.navCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(19, 25, 34, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: colors.borderSubtle,
                  borderWidth: 1,
                },
              ]}
              onPress={handleShare}
              accessibilityLabel="Share item"
            >
              <Text style={[styles.navCircleIconSmall, { color: colors.text }]}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(19, 25, 34, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: colors.borderSubtle,
                  borderWidth: 1,
                },
                item.saved && { backgroundColor: colors.burgundyLight },
              ]}
              onPress={handleToggleSave}
              accessibilityLabel="Save to wardrobe"
            >
              <Text
                style={[
                  styles.navCircleIcon,
                  { color: item.saved ? colors.burgundy : colors.text },
                ]}
              >
                {item.saved ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(19, 25, 34, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: colors.borderSubtle,
                  borderWidth: 1,
                },
              ]}
              onPress={handleDelete}
              accessibilityLabel="Delete item"
            >
              <Text style={[styles.navCircleIconSmall, { color: colors.error }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Photo Presentation with multi-view support */}
        <View style={styles.photoContainer}>
          {activeDisplayPhoto ? (
            <Image source={{ uri: activeDisplayPhoto }} style={styles.heroImage} />
          ) : (
            <View style={styles.placeholderHero}>
              <PrettyIcon name="camera" size="lg" variant="cream" />
            </View>
          )}

          {item.photos && item.photos.length > 1 && (
            <View style={styles.multiPhotoBadge}>
              <Text style={styles.multiPhotoBadgeText}>
                {selectedPhotoIndex + 1} of {item.photos.length} views analyzed together
              </Text>
            </View>
          )}
        </View>

        {/* Multi-Photo Thumbnail Bar if multiple angles were uploaded */}
        {item.photos && item.photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.galleryThumbScroll}
            contentContainerStyle={styles.galleryThumbContainer}
          >
            {item.photos.map((p, pIdx) => (
              <TouchableOpacity
                key={p.id || pIdx}
                onPress={() => setSelectedPhotoIndex(pIdx)}
                style={[
                  styles.galleryThumbItem,
                  selectedPhotoIndex === pIdx && styles.galleryThumbItemActive,
                ]}
              >
                {p.url ? (
                  <Image source={{ uri: resolveImageUrl(p.url) || '' }} style={styles.galleryThumbImg} />
                ) : (
                  <View style={styles.galleryThumbPlaceholder} />
                )}
                <View style={styles.galleryThumbRole}>
                  <Text style={styles.galleryThumbRoleText}>Angle #{pIdx + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Editorial Title & Summary Block */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>{item.title}</Text>
            <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.attributeSubtitle}>
            {[idf?.material || item.material, idf?.color || item.color].filter(Boolean).join(' · ') ||
              'Unspecified fabric'}
          </Text>
          <Text style={styles.attributeDetail}>
            {[idf?.fit || item.fit, idf?.style || item.style, idf?.pattern].filter(Boolean).join(' · ') ||
              'Classic silhouette'}
          </Text>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>
              {idf?.confidence ? `${Math.round(idf.confidence * 100)}% visual confidence` : 'Visual recognition'}
            </Text>
            {idf?.brandBasis === 'UNKNOWN' && <Text style={styles.basisNotice}>• Unverified brand</Text>}
          </View>
        </View>

        <View style={styles.divider} />

        {/* PRIMARY 4-TAB NAVIGATION: INFO | DEALS | TRENDS | STYLE */}
        <View style={[styles.primaryTabsContainer, { borderBottomColor: colors.borderSubtle }]}>
          {(['INFO', 'DEALS', 'TRENDS', 'STYLE'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.primaryTabBtn,
                activeTab === t && [styles.primaryTabBtnActive, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[
                  styles.primaryTabBtnText,
                  { color: activeTab === t ? colors.text : colors.textMuted },
                  activeTab === t && { fontWeight: '700' },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ========================================================= */}
        {/* TAB 1: INFO ("What is this?") */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* TAB 1: INFO ("What is this?") */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* TAB 1: INFO ("What is this?") - EDITORIAL SPECIFICATION   */}
        {/* ========================================================= */}
        {activeTab === 'INFO' && (
          <View style={styles.tabContent}>
            {/* Editorial Dossier Masthead */}
            <View style={[styles.editorialDossierHeader, { borderColor: colors.borderSubtle }]}>
              <View style={styles.dossierMetaRow}>
                <View style={[styles.idLevelPill, { backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.idLevelPillText, { color: colors.textSecondary }]}>
                    {idf?.identificationLevel ? idf.identificationLevel.replace('_', ' ') : 'OBSERVED SPECIMEN'}
                  </Text>
                </View>
                <Text style={[styles.dossierCertaintyText, { color: colors.textMuted }]}>
                  {idf?.confidence ? `${Math.round(idf.confidence * 100)}% CERTAINTY` : 'ARCHIVAL OBSERVED'}
                </Text>
              </View>

              <Text style={[styles.dossierGarmentTitle, { color: colors.text }]}>
                {idf?.verifiedProductName || idf?.garmentType || item.title}
              </Text>

              {idf?.possibleBrand ? (
                <Text style={[styles.dossierBrandText, { color: colors.textSecondary }]}>
                  PROVENANCE: <Text style={{ color: colors.text, fontWeight: '700' }}>{idf.possibleBrand}</Text>
                  {idf.brandEvidence ? ` · ${idf.brandEvidence}` : ''}
                </Text>
              ) : null}

              {idf?.productCode && (
                <View style={[styles.dossierSkuBox, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.dossierSkuLabel, { color: colors.textMuted }]}>SKU / PRODUCTION CODE</Text>
                  <Text style={[styles.dossierSkuValue, { color: colors.text }]}>{idf.productCode}</Text>
                </View>
              )}
            </View>

            {/* ITEM DNA: Editorial Tags */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>ITEM DNA & SILHOUETTE</Text>
              <View style={styles.editorialDnaRow}>
                {[
                  idf?.pattern && idf.pattern !== 'Solid' ? idf.pattern : null,
                  idf?.fit,
                  idf?.style,
                  idf?.silhouette,
                  [idf?.color, idf?.secondaryColors?.[0]].filter(Boolean).join('/'),
                  idf?.material,
                ]
                  .filter(Boolean)
                  .map((trait, idx) => (
                    <View key={idx} style={[styles.editorialDnaPill, { backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                      <Text style={[styles.editorialDnaPillText, { color: colors.text }]}>{trait}</Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* VERIFIED SPECIFICATIONS */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>VERIFIED SPECIFICATIONS</Text>
              <View style={[styles.editorialSpecTable, { borderColor: colors.borderSubtle }]}>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>BRAND EVIDENCE</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {idf?.brandEvidence || (idf?.possibleBrand ? 'Visible emblem / markings' : 'Unverified specimen')}
                  </Text>
                </View>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>IDENTIFICATION TIER</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {idf?.identificationLevel ? idf.identificationLevel.replace('_', ' ') : 'Visual Categorization'}
                  </Text>
                </View>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>LABELS & TAGS</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {idf?.visibleLabels && idf.visibleLabels.length > 0 ? idf.visibleLabels.join(', ') : 'None visible'}
                  </Text>
                </View>
                <View style={styles.editorialSpecRow}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>MANUFACTURE</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {idf?.countryOfManufacture || 'Unspecified in scan'}
                  </Text>
                </View>
              </View>

              {idf?.extractedText && idf.extractedText.length > 0 && (
                <View style={[styles.extractedBox, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.extractedBoxLabel, { color: colors.textMuted }]}>READABLE MARKINGS</Text>
                  <View style={styles.extractedChips}>
                    {idf.extractedText.map((txt, tIdx) => (
                      <View key={tIdx} style={[styles.extractedChip, { backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF', borderColor: colors.borderSubtle }]}>
                        <Text style={[styles.extractedChipText, { color: colors.text }]}>"{txt}"</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* OBSERVED PHYSICAL DETAILS */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>OBSERVED PHYSICAL DETAILS</Text>
              <View style={[styles.editorialSpecTable, { borderColor: colors.borderSubtle }]}>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>CATEGORY</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>{idf?.category || item.category || 'Apparel'}</Text>
                </View>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>COLOR</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>{idf?.color || '—'}</Text>
                </View>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>FABRIC & WEAVE</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {idf?.material ? `${idf.material} (${idf.materialBasis.toLowerCase()})` : 'Undisclosed'}
                  </Text>
                </View>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>FIT & SILHOUETTE</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>{[idf?.fit, idf?.silhouette].filter(Boolean).join(', ') || 'Standard'}</Text>
                </View>
                <View style={[styles.editorialSpecRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>COLLAR & SLEEVES</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {[idf?.collarNeckline, idf?.sleeveType].filter(Boolean).join(' · ') || 'Standard'}
                  </Text>
                </View>
                <View style={styles.editorialSpecRow}>
                  <Text style={[styles.editorialSpecLabel, { color: colors.textMuted }]}>HARDWARE & FINISH</Text>
                  <Text style={[styles.editorialSpecVal, { color: colors.text }]}>
                    {[idf?.closureType, idf?.hardware, idf?.stitching].filter(Boolean).join(' · ') || 'Clean finish'}
                  </Text>
                </View>
              </View>

              {idf?.distinctiveFeatures && idf.distinctiveFeatures.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>DISTINCTIVE CHARACTERISTICS</Text>
                  <View style={styles.editorialDnaRow}>
                    {idf.distinctiveFeatures.map((feat, idx) => (
                      <View key={idx} style={[styles.editorialDnaPill, { backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                        <Text style={[styles.editorialDnaPillText, { color: colors.text }]}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* HONEST APP REPORT */}
            <View style={[styles.editorialNoteCard, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.editorialNoteEyebrow, { color: colors.burgundy }]}>CAUTIONARY INTELLIGENCE</Text>
              <Text style={[styles.editorialNoteTitle, { color: colors.text }]}>
                {!idf?.exactModelVerified ? 'Exact production batch unconfirmed' : 'Verified exact production specimen'}
              </Text>
              <Text style={[styles.editorialNoteDesc, { color: colors.textSecondary }]}>
                {!idf?.exactModelVerified
                  ? 'Unless a readable care tag SKU, verifiable model code, or authenticated provenance is observed, Flashy labels model identity as unverified rather than guessing.'
                  : 'Verified based on matching product code and distinctive physical evidence.'}
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DEALS (IMAGE-FIRST MARKETPLACE SOURCING)            */}
        {/* ========================================================= */}
        {activeTab === 'DEALS' && (
          <View style={styles.tabContent}>
            {/* Live Market Sourcing Bar */}
            <View style={[styles.marketHeaderBox, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={[styles.marketHeaderTitle, { color: colors.text }]}>MARKETPLACE RESEARCH</Text>
                  <Text style={[styles.marketHeaderSub, { color: colors.textMuted }]}>
                    {research?.status === 'COMPLETE'
                      ? `Updated ${new Date(research.researchedAt || Date.now()).toLocaleDateString()} · ${research.sources?.length || 1} live sources`
                      : 'Real seller listings from verified fashion resale marketplaces'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleTriggerResearch}
                  disabled={isResearching}
                  style={[styles.marketRefreshBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.marketRefreshBtnText}>
                    {isResearching ? 'Searching...' : research?.status === 'COMPLETE' ? 'Refresh' : 'Find Deals'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isResearching && (
                <View style={styles.researchProgressRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.researchProgressText, { color: colors.textSecondary }]}>Querying live marketplace feeds...</Text>
                </View>
              )}
            </View>

            {/* Filter Chips */}
            <View style={styles.dealFiltersRow}>
              {(['ALL', 'EXACT', 'NEW', 'RESALE', 'CHEAPER'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.dealFilterChip,
                    { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.surface : colors.surfaceCream },
                    dealFilter === f && { backgroundColor: colors.text, borderColor: colors.text },
                  ]}
                  onPress={() => setDealFilter(f)}
                >
                  <Text
                    style={[
                      styles.dealFilterText,
                      { color: colors.textMuted },
                      dealFilter === f && { color: isDark ? '#0D1117' : '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Intelligence Range Banner */}
            {pricing && (pricing.status === 'AVAILABLE' || pricing.resale || pricing.newPrice) && (
              <View style={[styles.dealsPriceBanner, { backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.dealsPriceBannerLabel, { color: colors.textMuted }]}>OBSERVED RESALE RANGE</Text>
                <Text style={[styles.dealsPriceBannerValue, { color: colors.text }]}>
                  ${pricing.resale?.min ?? pricing.newPrice?.min ?? 0} – ${pricing.resale?.max ?? pricing.newPrice?.max ?? 0}
                </Text>
                <Text style={[styles.dealsPriceBannerSub, { color: colors.textSecondary }]}>
                  Median: ${pricing.resale?.median ?? pricing.newPrice?.median ?? 0} · Based on {pricing.unbranded?.sampleSize || pricing.resale?.sampleSize || 0} verified listings
                </Text>
              </View>
            )}

            {/* IMAGE-FIRST MATCHED PRODUCT MODELS */}
            {filteredMatchedGroups.length > 0 ? (
              <View style={styles.editorialSection}>
                <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>VERIFIED PRODUCT MODELS</Text>
                <Text style={[styles.editorialSectionNote, { color: colors.textSecondary }]}>
                  Matched pieces across leading resale platforms and brand stores.
                </Text>

                <View style={{ gap: spacing.md }}>
                  {filteredMatchedGroups.map((group) => {
                    const firstListing = group.listings[0];
                    const displayImg = firstListing?.imageUrl || activeDisplayPhoto;
                    const medianPrice = group.priceSummary.median != null ? group.priceSummary.median : group.priceSummary.min;

                    return (
                      <View
                        key={group.productId}
                        style={[
                          styles.dealProductCard,
                          { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle },
                        ]}
                      >
                        {/* Large Editorial Product Image Header */}
                        <View style={styles.dealProductImageFrame}>
                          {displayImg ? (
                            <Image source={{ uri: displayImg }} style={styles.dealProductImage} resizeMode="cover" />
                          ) : (
                            <View style={[styles.dealProductPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
                              <Text style={[styles.dealProductPlaceholderText, { color: colors.textMuted }]}>PRODUCT SPECIMEN</Text>
                            </View>
                          )}

                          <View style={styles.dealProductScrim} />

                          {/* Top Badges */}
                          <View style={styles.dealTopBadges}>
                            <View style={[styles.dealStoreBadge, { backgroundColor: 'rgba(13, 17, 23, 0.85)' }]}>
                              <Text style={styles.dealStoreBadgeText}>
                                {firstListing?.marketplace?.toUpperCase() || 'MARKET'}
                              </Text>
                            </View>
                            <View style={[styles.dealMatchBadge, { backgroundColor: colors.burgundy }]}>
                              <Text style={styles.dealMatchBadgeText}>
                                {group.matchType === 'EXACT_MATCH' ? 'EXACT PIECE' : 'CURATED MATCH'}
                              </Text>
                            </View>
                          </View>

                          {/* Price Tag Overlay */}
                          <View style={styles.dealPriceOverlay}>
                            <Text style={styles.dealPriceOverlayAmount}>
                              {medianPrice != null ? `$${medianPrice}` : 'Price unlisted'}
                            </Text>
                            {group.listings.length > 1 && (
                              <Text style={styles.dealPriceOverlaySellers}>
                                {group.listings.length} available sellers
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Product Info & Clear Action */}
                        <View style={styles.dealProductBody}>
                          <Text style={[styles.dealProductTitle, { color: colors.text }]}>{group.name}</Text>
                          {group.brand ? (
                            <Text style={[styles.dealProductBrand, { color: colors.textSecondary }]}>{group.brand}</Text>
                          ) : null}

                          {/* Seller Listings List */}
                          <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                            {group.listings.map((l) => (
                              <View
                                key={l.id}
                                style={[
                                  styles.dealListingRow,
                                  { borderTopColor: colors.borderSubtle },
                                ]}
                              >
                                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.dealSellerName, { color: colors.text }]}>{l.seller}</Text>
                                    <Text style={[styles.dealSellerPlatform, { color: colors.textMuted }]}> · {l.marketplace}</Text>
                                  </View>
                                  <Text style={[styles.dealSellerCondition, { color: colors.textSecondary }]}>
                                    {l.condition || 'Pre-owned / Excellent'}
                                  </Text>
                                </View>

                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                  <Text style={[styles.dealListingPrice, { color: colors.text }]}>
                                    {l.price != null ? `$${l.price}` : '—'}
                                  </Text>
                                  {l.url ? (
                                    <TouchableOpacity
                                      onPress={() => {
                                        if (l.url) Linking.openURL(l.url).catch(() => Alert.alert('Could not open link'));
                                      }}
                                      style={[styles.dealActionBtn, { backgroundColor: colors.primary }]}
                                    >
                                      <Text style={styles.dealActionBtnText}>VIEW DEAL ↗</Text>
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* CHEAPER ALTERNATIVES */}
            {(dealFilter === 'ALL' || dealFilter === 'CHEAPER') && cheaperItems.length > 0 && (
              <View style={styles.editorialSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>FIND THE LOOK FOR LESS</Text>
                  <View style={[styles.countBadge, { backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceCream }]}>
                    <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>{cheaperItems.length} options</Text>
                  </View>
                </View>
                <Text style={[styles.editorialSectionNote, { color: colors.textSecondary }]}>
                  Verified pieces under market baseline with matching silhouette and tone.
                </Text>
                <View style={{ gap: spacing.md }}>
                  {cheaperItems.map((cItem) => (
                    <ProductCard key={cItem.id} item={cItem} badge="Budget Alternative" badgeVariant="success" />
                  ))}
                </View>
              </View>
            )}

            {filteredMatchedGroups.length === 0 && cheaperItems.length === 0 && (
              <View style={[styles.editorialNoteCard, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.editorialNoteTitle, { color: colors.text }]}>
                  {research?.status === 'COMPLETE' ? "No reliable current listings found." : 'Marketplace search pending'}
                </Text>
                <Text style={[styles.editorialNoteDesc, { color: colors.textSecondary }]}>
                  {research?.status === 'COMPLETE'
                    ? 'No matching listings met the selected filter right now. Try selecting "ALL" or refreshing marketplace data.'
                    : 'Tap "Find Deals" above to retrieve live seller listings, eBay comps, and retail prices.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TRENDS (EDITORIAL FASHION MAGAZINE SPREAD)         */}
        {/* ========================================================= */}
        {activeTab === 'TRENDS' && (
          <View style={styles.tabContent}>
            {/* Editorial Fashion Trend Hero Banner */}
            <View style={[styles.trendEditorialHeroFrame, { borderColor: colors.borderSubtle }]}>
              <Image
                source={{ uri: TREND_EDITORIAL_IMAGES[0] }}
                style={styles.trendEditorialHeroPhoto}
                resizeMode="cover"
              />
              <View style={styles.trendEditorialScrim} />

              <View style={styles.trendHeroContent}>
                <View style={styles.trendHeroPill}>
                  <Text style={styles.trendHeroPillText}>RUNWAY & STREET DIRECTION · AW26</Text>
                </View>
                <Text style={styles.trendHeroTitle}>
                  {idf?.pattern && idf.pattern !== 'Solid' ? `${idf.pattern} & ` : ''}{idf?.style || 'Classic'} Silhouettes
                </Text>
                <Text style={styles.trendHeroDesc}>
                  Heavy tactile weaves, relaxed proportions, and raw craftsmanship have superseded hyper-tailored micro-trends.
                  Styles featuring {idf?.fit?.toLowerCase() || 'relaxed'} cuts and {idf?.color?.toLowerCase() || 'neutral'} tones anchor current seasonal collections.
                </Text>
                <View style={styles.trendTagsRow}>
                  {[
                    idf?.style ? `#${idf.style}` : null,
                    idf?.fit ? `#${idf.fit}Fit` : null,
                    idf?.color ? `#${idf.color}` : null,
                    idf?.pattern && idf.pattern !== 'Solid' ? `#${idf.pattern}` : null,
                    '#QuietLuxury',
                    '#ContemporaryDenim',
                  ]
                    .filter(Boolean)
                    .map((t, idx) => (
                      <View key={idx} style={styles.trendTagPill}>
                        <Text style={styles.trendTagPillText}>{t}</Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>

            {/* Editorial Magazine Dispatch */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>THE EDITORIAL DISPATCH</Text>

              <View style={[styles.trendDispatchCard, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                <View style={styles.trendDispatchItem}>
                  <Text style={[styles.trendDispatchNum, { color: colors.burgundy }]}>01</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trendDispatchHeading, { color: colors.text }]}>PROPORTION & DRAPE</Text>
                    <Text style={[styles.trendDispatchBody, { color: colors.textSecondary }]}>
                      Contemporary styling favors architectural drape over tight silhouettes. Pairing this piece with understated, structured layers creates an effortlessly grounded look.
                    </Text>
                  </View>
                </View>

                <View style={[styles.trendDispatchDivider, { backgroundColor: colors.borderSubtle }]} />

                <View style={styles.trendDispatchItem}>
                  <Text style={[styles.trendDispatchNum, { color: colors.burgundy }]}>02</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trendDispatchHeading, { color: colors.text }]}>TEXTURE & WEAVE PROVENANCE</Text>
                    <Text style={[styles.trendDispatchBody, { color: colors.textSecondary }]}>
                      Garments displaying visible grain and tactile materials maintain higher retention in secondary markets as durable investment pieces.
                    </Text>
                  </View>
                </View>

                <View style={[styles.trendDispatchDivider, { backgroundColor: colors.borderSubtle }]} />

                <View style={styles.trendDispatchItem}>
                  <Text style={[styles.trendDispatchNum, { color: colors.burgundy }]}>03</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trendDispatchHeading, { color: colors.text }]}>SEASONLESS ROTATION</Text>
                    <Text style={[styles.trendDispatchBody, { color: colors.textSecondary }]}>
                      The palette of {idf?.color?.toLowerCase() || 'neutral'} lends itself to seamless multi-season layering across wool, linen, and leather.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Visual Runway Reference Spread */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>RUNWAY & STREET INSPIRATION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs }}>
                <View style={[styles.trendLookbookCard, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                  <Image source={{ uri: TREND_EDITORIAL_IMAGES[1] }} style={styles.trendLookbookImg} resizeMode="cover" />
                  <View style={styles.trendLookbookBody}>
                    <Text style={[styles.trendLookbookLabel, { color: colors.burgundy }]}>DIRECTION 01</Text>
                    <Text style={[styles.trendLookbookTitle, { color: colors.text }]}>Monochrome Minimalist</Text>
                    <Text style={[styles.trendLookbookNote, { color: colors.textSecondary }]}>Tonal layering with brushed cashmere</Text>
                  </View>
                </View>

                <View style={[styles.trendLookbookCard, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                  <Image source={{ uri: TREND_EDITORIAL_IMAGES[2] }} style={styles.trendLookbookImg} resizeMode="cover" />
                  <View style={styles.trendLookbookBody}>
                    <Text style={[styles.trendLookbookLabel, { color: colors.burgundy }]}>DIRECTION 02</Text>
                    <Text style={[styles.trendLookbookTitle, { color: colors.text }]}>Utilitarian Contrast</Text>
                    <Text style={[styles.trendLookbookNote, { color: colors.textSecondary }]}>Heavy leather loafers & boxy wool</Text>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Honest Trend Data Integrity */}
            <View style={[styles.editorialNoteCard, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.editorialNoteEyebrow, { color: colors.burgundy }]}>VERIFIED SIGNALS ONLY</Text>
              <Text style={[styles.editorialNoteTitle, { color: colors.text }]}>
                {item.trendSignals?.message || 'True search frequency & runway appearances verified.'}
              </Text>
              <Text style={[styles.editorialNoteDesc, { color: colors.textSecondary }]}>
                Flashy delivers curated editorial analysis rather than fabricated percentage meters. We observe true fabric movements, designer collections, and secondary market demand.
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: STYLE (IMAGE-FIRST EDITORIAL OUTFIT RECOMMENDATIONS) */}
        {/* ========================================================= */}
        {activeTab === 'STYLE' && (
          <View style={styles.tabContent}>
            {/* Occasion Selector */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>STYLE FOR OCCASION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.occasionRow}>
                {(['Casual', 'University', 'Date', 'Party', 'Work', 'Travel'] as const).map((occ) => (
                  <TouchableOpacity
                    key={occ}
                    style={[
                      styles.occasionChip,
                      { borderColor: colors.borderSubtle, backgroundColor: isDark ? colors.surface : colors.surfaceCream },
                      styleOccasion === occ && { backgroundColor: colors.text, borderColor: colors.text },
                    ]}
                    onPress={() => setStyleOccasion(occ)}
                  >
                    <Text
                      style={[
                        styles.occasionChipText,
                        { color: colors.textMuted },
                        styleOccasion === occ && { color: isDark ? '#0D1117' : '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {occ}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Curated Visual Editorial Outfits - Image-First */}
            <View style={styles.editorialSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>EDITORIAL OUTFIT LOOKS</Text>
                <View style={[styles.countBadge, { backgroundColor: isDark ? colors.surfaceElevated : colors.surfaceCream }]}>
                  <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>{item.styleIdeas.length} curated looks</Text>
                </View>
              </View>
              <Text style={[styles.editorialSectionNote, { color: colors.textSecondary }]}>
                Curated around your scanned {idf?.color ? idf.color.toLowerCase() + ' ' : ''}{idf?.category ? idf.category.toLowerCase() : 'garment'}.
              </Text>

              <View style={{ gap: spacing.xl }}>
                {item.styleIdeas.map((look, lIdx) => {
                  const piecesList = look.breakdown && look.breakdown.length > 0
                    ? look.breakdown
                    : look.pieces.map((p, idx) => ({
                        category: idx === 0 ? 'Top' : idx === 1 ? 'Bottom' : idx === 2 ? 'Shoes' : 'Accessories',
                        label: p,
                        isScannedItem: idx === 0 || p.toLowerCase().includes('scanned') || p.toLowerCase().includes('jeans') || p.toLowerCase().includes('polo') || p.toLowerCase().includes('shirt') || p.toLowerCase().includes('jacket') || p.toLowerCase().includes('dress'),
                      }));

                  const lookPhoto = look.imageUrl || EDITORIAL_LOOKBOOK_IMAGES[lIdx % EDITORIAL_LOOKBOOK_IMAGES.length];

                  return (
                    <TouchableOpacity
                      key={look.id || lIdx}
                      style={[
                        styles.styleEditorialCard,
                        { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle },
                      ]}
                      activeOpacity={0.92}
                      onPress={() => setSelectedStyleLook(look)}
                    >
                      {/* Large Outfit Imagery Frame */}
                      <View style={styles.styleEditorialImageFrame}>
                        <Image
                          source={{ uri: lookPhoto }}
                          style={styles.styleEditorialPhoto}
                          resizeMode="cover"
                        />

                        {/* Scrim Gradient */}
                        <View style={styles.styleEditorialScrim} />

                        {/* Top Inset: Your Scanned Piece floating badge */}
                        <View style={styles.styleTopBar}>
                          <View style={styles.stylePieceFloatingBadge}>
                            {activeDisplayPhoto ? (
                              <Image source={{ uri: activeDisplayPhoto }} style={styles.stylePieceFloatingThumb} />
                            ) : null}
                            <Text style={styles.stylePieceFloatingText}>★ YOUR PIECE</Text>
                          </View>
                          <View style={[styles.styleAestheticBadge, { backgroundColor: 'rgba(13, 17, 23, 0.85)' }]}>
                            <Text style={styles.styleAestheticBadgeText}>{look.aesthetic?.toUpperCase() || 'EDITORIAL'}</Text>
                          </View>
                        </View>

                        {/* Bottom Hero Overlay */}
                        <View style={styles.styleHeroOverlay}>
                          <Text style={styles.styleLookNumber}>LOOK 0{lIdx + 1} · {styleOccasion.toUpperCase()}</Text>
                          <Text style={styles.styleLookTitle}>{look.title.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Editorial Explanation & Breakdown */}
                      <View style={styles.styleEditorialBody}>
                        {/* Stylist Explanation */}
                        <Text style={[styles.styleStylistQuote, { color: colors.textSecondary }]}>
                          "{look.whyItWorks || look.description}"
                        </Text>

                        {/* Pieces Capsule Breakdown */}
                        <View style={styles.stylePiecesCapsules}>
                          {piecesList.map((piece, pIdx) => (
                            <View
                              key={pIdx}
                              style={[
                                styles.stylePieceCapsule,
                                { backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF', borderColor: colors.borderSubtle },
                                piece.isScannedItem && { backgroundColor: colors.burgundyLight, borderColor: colors.burgundy },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stylePieceCapsuleCat,
                                  { color: colors.textMuted },
                                  piece.isScannedItem && { color: colors.burgundy, fontWeight: '700' },
                                ]}
                              >
                                {piece.isScannedItem ? '★ YOUR PIECE' : piece.category.toUpperCase()}
                              </Text>
                              <Text
                                style={[
                                  styles.stylePieceCapsuleLabel,
                                  { color: colors.text },
                                  piece.isScannedItem && { color: colors.text, fontWeight: '700' },
                                ]}
                                numberOfLines={1}
                              >
                                {piece.label}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Complementary Palette Swatches */}
                        {look.colors && look.colors.length > 0 && (
                          <View style={styles.stylePaletteRow}>
                            <Text style={[styles.stylePaletteLabel, { color: colors.textMuted }]}>PALETTE:</Text>
                            {look.colors.map((c, cIdx) => (
                              <View key={cIdx} style={[styles.stylePaletteChip, { backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF', borderColor: colors.borderSubtle }]}>
                                <View style={[styles.stylePaletteDot, { backgroundColor: c.toLowerCase() }]} />
                                <Text style={[styles.stylePaletteText, { color: colors.textSecondary }]}>{c}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Action Link to Full Formula */}
                        <View style={[styles.styleCardAction, { borderTopColor: colors.borderSubtle }]}>
                          <Text style={[styles.styleCardActionText, { color: colors.text }]}>Inspect Full Formula & Shop Pieces</Text>
                          <Text style={[styles.styleCardActionArrow, { color: colors.burgundy }]}>→</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quick Styling Coordinates: Shoes, Accessories, Colors */}
            <View style={styles.editorialSection}>
              <Text style={[styles.editorialSubhead, { color: colors.textMuted }]}>STYLING FORMULA</Text>
              <View style={[styles.formulaGrid, { backgroundColor: isDark ? colors.surface : colors.surfaceCream, borderColor: colors.borderSubtle }]}>
                <View style={[styles.formulaCard, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>SHOES</Text>
                  <Text style={[styles.formulaValue, { color: colors.text }]}>Low-profile sneakers · Leather loafers · Desert boots</Text>
                </View>
                <View style={[styles.formulaCard, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>ACCESSORIES</Text>
                  <Text style={[styles.formulaValue, { color: colors.text }]}>Leather belt · Minimal wrist watch · Canvas tote</Text>
                </View>
                <View style={styles.formulaCard}>
                  <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>COMPLEMENTARY COLORS</Text>
                  <Text style={[styles.formulaValue, { color: colors.text }]}>Off-white · Deep navy · Light khaki · Washed denim</Text>
                </View>
              </View>
            </View>
          </View>
        )}


        <View style={styles.divider} />


        {/* Bottom Save Action */}
        <View style={styles.bottomActionSection}>
          <AppButton
            title={item.saved ? 'Saved in your wardrobe ★' : 'Save this look'}
            onPress={handleToggleSave}
            variant={item.saved ? 'secondary' : 'primary'}
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>

      {/* Edit Attributes Modal */}
      <Modal visible={isEditing} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Looks right?</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Correct any AI observations. You know your garment best.</Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Title / Garment</Text>
              <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />

              <Text style={styles.inputLabel}>Brand (leave blank if unverified)</Text>
              <TextInput
                style={styles.input}
                value={editBrand}
                onChangeText={setEditBrand}
                placeholder="Unbranded / Unknown"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} />

              <Text style={styles.inputLabel}>Dominant Color</Text>
              <TextInput style={styles.input} value={editColor} onChangeText={setEditColor} />

              <Text style={styles.inputLabel}>Material</Text>
              <TextInput style={styles.input} value={editMaterial} onChangeText={setEditMaterial} />

              <Text style={styles.inputLabel}>Fit</Text>
              <TextInput style={styles.input} value={editFit} onChangeText={setEditFit} />

              <Text style={styles.inputLabel}>Style Aesthetic</Text>
              <TextInput style={styles.input} value={editStyle} onChangeText={setEditStyle} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title="Save corrections"
                onPress={handleSaveEdit}
                variant="primary"
                size="md"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Style Detail Modal (Editorial Outfit Inspection) */}
      <Modal visible={!!selectedStyleLook} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.styleDetailModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.styleDetailModalCategory}>EDITORIAL OUTFIT</Text>
                <Text style={styles.styleDetailModalTitle}>
                  {selectedStyleLook?.title ? selectedStyleLook.title.toUpperCase() : 'OUTFIT LOOK'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedStyleLook(null)}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close look"
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.styleDetailScroll} showsVerticalScrollIndicator={false}>
              {/* Large Visual Representation featuring the scanned item */}
              <View style={styles.styleDetailVisualContainer}>
                {activeDisplayPhoto ? (
                  <Image
                    source={{ uri: activeDisplayPhoto }}
                    style={styles.styleDetailHeroPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.editorialHeroPlaceholder}>
                    <Text style={styles.editorialHeroPlaceholderText}>
                      {idf?.color || ''} {idf?.category || 'GARMENT'}
                    </Text>
                  </View>
                )}
                <View style={styles.styleDetailHeroOverlay}>
                  <View style={styles.editorialScanPill}>
                    <Text style={styles.editorialScanPillText}>★ YOUR SCANNED ITEM</Text>
                  </View>
                  <Text style={styles.styleDetailHeroPieceName}>
                    {idf?.possibleBrand ? `${idf.possibleBrand} ` : ''}
                    {idf?.color ? `${idf.color} ` : ''}
                    {idf?.pattern && idf.pattern !== 'Solid' ? `${idf.pattern} ` : ''}
                    {idf?.category || 'Garment'}
                  </Text>
                </View>
              </View>

              {/* The Look & Why It Works */}
              <View style={styles.styleDetailSection}>
                <Text style={styles.styleDetailSectionHeader}>THE LOOK</Text>
                <Text style={styles.styleDetailDesc}>{selectedStyleLook?.description}</Text>

                {selectedStyleLook?.whyItWorks && (
                  <View style={styles.whyItWorksBox}>
                    <Text style={styles.whyItWorksLabel}>WHY IT WORKS</Text>
                    <Text style={styles.whyItWorksQuote}>"{selectedStyleLook.whyItWorks}"</Text>
                  </View>
                )}
              </View>

              {/* Pieces Breakdown */}
              <View style={styles.styleDetailSection}>
                <Text style={styles.styleDetailSectionHeader}>PIECES</Text>
                <View style={styles.styleDetailPiecesList}>
                  {(selectedStyleLook?.breakdown && selectedStyleLook.breakdown.length > 0
                    ? selectedStyleLook.breakdown
                    : (selectedStyleLook?.pieces || []).map((p: string, idx: number) => ({
                        category: idx === 0 ? 'Top' : idx === 1 ? 'Bottom' : idx === 2 ? 'Shoes' : 'Accessories',
                        label: p,
                        isScannedItem: idx === 0 || p.toLowerCase().includes('scanned') || p.toLowerCase().includes('polo') || p.toLowerCase().includes('shirt') || p.toLowerCase().includes('jacket') || p.toLowerCase().includes('dress'),
                      }))
                  ).map((piece: any, pIdx: number) => (
                    <View
                      key={pIdx}
                      style={[
                        styles.styleDetailPieceRow,
                        piece.isScannedItem && styles.styleDetailPieceRowScanned,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text
                            style={[
                              styles.styleDetailPieceCategory,
                              piece.isScannedItem && styles.styleDetailPieceCategoryScanned,
                            ]}
                          >
                            {piece.category.toUpperCase()}
                          </Text>
                          {piece.isScannedItem && (
                            <View style={styles.yourScannedItemBadge}>
                              <Text style={styles.yourScannedItemBadgeText}>YOUR SCANNED ITEM</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.styleDetailPieceLabel,
                            piece.isScannedItem && styles.styleDetailPieceLabelScanned,
                          ]}
                        >
                          {piece.label}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Complementary Colors Palette */}
              {selectedStyleLook?.colors && selectedStyleLook.colors.length > 0 && (
                <View style={styles.styleDetailSection}>
                  <Text style={styles.styleDetailSectionHeader}>COLORS</Text>
                  <View style={styles.styleDetailColorsRow}>
                    {selectedStyleLook.colors.map((c: string, cIdx: number) => (
                      <View key={cIdx} style={styles.colorPillLarge}>
                        <View style={[styles.colorDot, { backgroundColor: c.toLowerCase() }]} />
                        <Text style={styles.colorPillLargeText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Occasions */}
              <View style={styles.styleDetailSection}>
                <Text style={styles.styleDetailSectionHeader}>OCCASION</Text>
                <View style={styles.styleDetailOccasionsRow}>
                  {[
                    selectedStyleLook?.aesthetic,
                    styleOccasion,
                    'Weekend',
                    'Everyday Rotation',
                  ]
                    .filter(Boolean)
                    .map((occ: string, oIdx: number) => (
                      <View key={oIdx} style={styles.occasionBadge}>
                        <Text style={styles.occasionBadgeText}>{occ}</Text>
                      </View>
                    ))}
                </View>
              </View>

              {/* SHOP THIS LOOK (Real Products vs AI Inspiration) */}
              <View style={[styles.styleDetailSection, { marginBottom: spacing.xl }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={styles.styleDetailSectionHeader}>SHOP THIS LOOK</Text>
                  <View style={styles.inspirationBadge}>
                    <Text style={styles.inspirationBadgeText}>VERIFIED DATA ONLY</Text>
                  </View>
                </View>
                <Text style={styles.styleDetailNotice}>
                  Visual outfit is AI style inspiration around your locked item. Companion pieces are discovered via live real-world market intelligence.
                </Text>

                {matchedGroups.length > 0 ? (
                  <View style={{ gap: spacing.xs + 2, marginTop: spacing.xs }}>
                    {matchedGroups.slice(0, 3).map((group) => {
                      const firstListing = group.listings[0];
                      return (
                        <View key={group.productId} style={styles.shopPieceRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.shopPieceTitle} numberOfLines={1}>{group.name}</Text>
                            <Text style={styles.shopPieceStore}>
                              {firstListing ? `${firstListing.seller} · ${firstListing.marketplace}` : 'Verified Market'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', marginLeft: spacing.sm }}>
                            <Text style={styles.shopPiecePrice}>
                              {group.priceSummary.median ? `$${group.priceSummary.median}` : group.priceSummary.min ? `$${group.priceSummary.min}` : 'Market Price'}
                            </Text>
                            {firstListing?.url && (
                              <TouchableOpacity
                                onPress={() => firstListing.url && Linking.openURL(firstListing.url).catch(() => Alert.alert('Could not open link'))}
                                style={styles.shopPieceBtn}
                              >
                                <Text style={styles.shopPieceBtnText}>View →</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <AppButton
                    title="Find Matching Companion Pieces in DEALS →"
                    onPress={() => {
                      setSelectedStyleLook(null);
                      setActiveTab('DEALS');
                    }}
                    variant="primary"
                    size="md"
                    style={{ width: '100%', marginTop: spacing.xs }}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl * 3,
  },
  centerContainer: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  navRow: {
    position: 'absolute',
    top: 50,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  savedCircleActive: {
    backgroundColor: colors.primaryLight,
  },
  navCircleIcon: {
    fontSize: 22,
    color: colors.text,
  },
  navCircleIconSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  savedCircleIconActive: {
    color: colors.primaryDark,
  },
  photoContainer: {
    width: '100%',
    height: 380,
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  mainTitle: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceHover,
    marginLeft: spacing.sm,
  },
  editBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  attributeSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginTop: 2,
  },
  attributeDetail: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  confidenceLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  basisNotice: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.lg,
    marginHorizontal: spacing.screenPadding,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  countBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionNotice: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  researchActionBox: {
    backgroundColor: colors.surfaceCream,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  researchActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  researchActionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryDark,
    letterSpacing: 0.8,
  },
  researchActionSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  researchProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  researchProgressText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  priceContainer: {
    marginTop: spacing.xs,
  },
  priceStatsGrid: {
    gap: spacing.sm,
  },
  priceStatCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  priceStatValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 4,
  },
  priceStatSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  priceDataNotice: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.md,
  },
  factItem: {
    width: '45%',
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  factValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  featuresBox: {
    marginTop: spacing.md,
  },
  featuresTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  featurePill: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  featurePillText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  editorialLooksContainer: {
    gap: spacing.lg,
  },
  editorialCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    ...shadows.card,
  },
  editorialVisualFrame: {
    width: '100%',
    height: 240,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
    overflow: 'hidden',
  },
  editorialHeroPhoto: {
    width: '100%',
    height: '100%',
  },
  editorialHeroPlaceholder: {
    flex: 1,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  editorialHeroPlaceholderText: {
    color: '#F8FAFC',
    fontSize: typography.sizes.base,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  editorialVisualOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  editorialBadgeRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editorialScanPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  editorialScanPillText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  editorialAestheticPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  editorialAestheticPillText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editorialHeroCaption: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  editorialLookName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  editorialHeroSub: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  editorialCardBody: {
    padding: spacing.md + 2,
  },
  editorialLookDesc: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  whyItWorksBox: {
    backgroundColor: colors.surfaceCream,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryDark,
    marginBottom: spacing.md,
  },
  whyItWorksLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 1,
    marginBottom: 2,
  },
  whyItWorksQuote: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  editorialPiecesGrid: {
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  editorialPieceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  editorialPieceTagScanned: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  editorialPieceCat: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    width: 80,
    letterSpacing: 0.5,
  },
  editorialPieceCatScanned: {
    color: '#15803D',
    fontWeight: '800',
  },
  editorialPieceName: {
    flex: 1,
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    color: colors.text,
  },
  editorialPieceNameScanned: {
    color: '#166534',
    fontWeight: '700',
  },
  editorialColorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  editorialColorsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  colorPill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  colorPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  editorialFooterAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  editorialFooterActionText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  editorialFooterActionArrow: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  // Style Detail Modal Styles
  styleDetailModalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  styleDetailModalCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primaryDark,
  },
  styleDetailModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  styleDetailScroll: {
    marginTop: spacing.md,
  },
  styleDetailVisualContainer: {
    width: '100%',
    height: 260,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.md,
  },
  styleDetailHeroPhoto: {
    width: '100%',
    height: '100%',
  },
  styleDetailHeroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  styleDetailHeroPieceName: {
    color: '#FFF',
    fontSize: typography.sizes.sm + 1,
    fontWeight: '700',
    marginTop: 4,
  },
  styleDetailSection: {
    marginBottom: spacing.md + 2,
  },
  styleDetailSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  styleDetailDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  styleDetailPiecesList: {
    gap: spacing.xs + 2,
  },
  styleDetailPieceRow: {
    backgroundColor: colors.surfaceHover,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  styleDetailPieceRowScanned: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  styleDetailPieceCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginRight: 6,
  },
  styleDetailPieceCategoryScanned: {
    color: '#15803D',
  },
  yourScannedItemBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  yourScannedItemBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  styleDetailPieceLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  styleDetailPieceLabelScanned: {
    color: '#14532D',
    fontWeight: '700',
  },
  styleDetailColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  colorPillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorPillLargeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.text,
  },
  styleDetailOccasionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  occasionBadge: {
    backgroundColor: colors.surfaceCream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  occasionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  styleDetailNotice: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  honestCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  honestNoticePill: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
  },
  honestNoticeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  honestNoticeDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    color: colors.textMuted,
  },
  sourcesList: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceItemName: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.text,
  },
  sourceItemCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bottomActionSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalForm: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  modalFooter: {
    paddingTop: spacing.xs,
  },
  listingDraftCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  listingDraftLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  listingDraftTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text,
  },
  listingDraftDesc: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tagsContainer: {
    marginTop: spacing.sm,
  },
  tagPill: {
    backgroundColor: colors.surfaceCream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  tagPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.secondaryDark,
  },
  openEditorBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openEditorBtnText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  terminologyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  termLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  termPrimaryText: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: '700',
    color: colors.text,
  },
  termAltText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  marketplacesGrid: {
    gap: spacing.sm,
  },
  marketplaceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  mpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mpName: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: '700',
    color: colors.text,
  },
  relevanceBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  relevanceHigh: {
    backgroundColor: '#E8F5E9',
  },
  relevanceMed: {
    backgroundColor: colors.surfaceMuted,
  },
  relevanceText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  mpFitReason: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  mpPositioning: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  buyerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  buyerUseCasesText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text,
  },
  soldNoticeBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  soldNoticeTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  soldNoticeDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  multiPhotoBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  multiPhotoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  galleryThumbScroll: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  galleryThumbContainer: {
    gap: spacing.xs + 2,
  },
  galleryThumbItem: {
    width: 64,
    height: 80,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryThumbItemActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  galleryThumbPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  galleryThumbRole: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  galleryThumbRoleText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
  matchedProductCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  matchedProductHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  matchedProductTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  matchedProductBrand: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  matchedProductRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  matchedProductRangeLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  matchedProductMedianText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  matchedProductRangePrice: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sellerListingsList: {
    gap: spacing.xs + 2,
  },
  sellerListingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sellerNameText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: colors.text,
  },
  sellerPlatformText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sellerConditionText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sellerPriceCol: {
    alignItems: 'flex-end',
  },
  sellerPriceText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  sellerViewBtn: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.xs,
  },
  sellerViewBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  matchPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
    marginLeft: 6,
  },
  matchExact: {
    backgroundColor: '#DCFCE7',
  },
  matchClose: {
    backgroundColor: '#FEF3C7',
  },
  matchStyle: {
    backgroundColor: colors.surfaceMuted,
  },
  matchPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text,
  },
  // 4-Tab Navigation Bar
  primaryTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  primaryTabBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  primaryTabBtnActive: {},
  primaryTabBtnText: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  tabContent: {
    paddingBottom: spacing.lg,
  },
  // Item DNA Card
  dnaCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dnaHeaderRow: {
    marginBottom: spacing.xs,
  },
  dnaHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primaryDark,
  },
  dnaSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  dnaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dnaPill: {
    backgroundColor: colors.surfaceCream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dnaPillText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    color: colors.secondaryDark,
  },
  // Deals Tab Styling
  dealFiltersRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.md,
    flexWrap: 'wrap',
  },
  dealFilterChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dealFilterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  dealFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dealFilterTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  dealsPriceBanner: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dealsPriceBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  dealsPriceBannerValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
    marginVertical: 4,
  },
  dealsPriceBannerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  // Trends Context Card
  trendsContextCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  trendTimeBadge: {
    backgroundColor: colors.surfaceCream,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  trendTimeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.6,
  },
  trendContextTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  trendContextDesc: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  trendTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  trendTag: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  trendTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  // Style Tab Occasion Selector & Formula Grid
  occasionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  occasionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  occasionChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  occasionChipText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  occasionChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  formulaGrid: {
    gap: spacing.sm,
  },
  formulaCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 4,
  },
  formulaValue: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text,
    lineHeight: 18,
  },
  // Evidence-based Identification Level Styles
  identificationLevelCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.lg,
    ...shadows.subtle,
  },
  idLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  idLevelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  idLevelExact: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  idLevelStrong: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  idLevelClose: {
    backgroundColor: colors.surfaceCream,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  idLevelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.6,
  },
  idConfidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  idGarmentHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  idBrandSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    marginTop: 3,
  },
  verifiedCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  verifiedCodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.8,
    marginRight: 6,
  },
  verifiedCodeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  extractedTextBox: {
    backgroundColor: colors.surfaceHover,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  extractedTextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  extractedTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  extractedTextChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  extractedTextChipText: {
    fontSize: 10,
    color: colors.text,
    fontStyle: 'italic',
  },
  inspirationBadge: {
    backgroundColor: colors.surfaceCream,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  inspirationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.6,
  },
  shopPieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHover,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  shopPieceTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: colors.text,
  },
  shopPieceStore: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shopPiecePrice: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  shopPieceBtn: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xs,
  },
  shopPieceBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  // --- Editorial Magazine Redesign Styles ---
  editorialDossierHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
  },
  dossierMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  idLevelPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  idLevelPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dossierCertaintyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dossierGarmentTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
    lineHeight: 28,
  },
  dossierBrandText: {
    fontSize: typography.sizes.xs + 1,
    letterSpacing: 0.6,
    marginTop: spacing.xs,
  },
  dossierSkuBox: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dossierSkuLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dossierSkuValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editorialSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  editorialSubhead: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  editorialSectionNote: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  editorialDnaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  editorialDnaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  editorialDnaPillText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  editorialSpecTable: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  editorialSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  editorialSpecLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    width: '40%',
  },
  editorialSpecVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    width: '58%',
    textAlign: 'right',
  },
  extractedBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  extractedBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  extractedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  extractedChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  extractedChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  editorialNoteCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  editorialNoteEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  editorialNoteTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  editorialNoteDesc: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
  },
  marketHeaderBox: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  marketHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  marketHeaderSub: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  marketRefreshBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.xs,
  },
  marketRefreshBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dealProductCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dealProductImageFrame: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#0D1117',
  },
  dealProductImage: {
    width: '100%',
    height: '100%',
  },
  dealProductPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealProductPlaceholderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  dealProductScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dealTopBadges: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealStoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  dealStoreBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  dealMatchBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  dealMatchBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  dealPriceOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
  },
  dealPriceOverlayAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dealPriceOverlaySellers: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  dealProductBody: {
    padding: spacing.md,
  },
  dealProductTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    lineHeight: 20,
  },
  dealProductBrand: {
    fontSize: typography.sizes.xs + 1,
    marginTop: 2,
    fontWeight: '600',
  },
  dealListingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  dealSellerName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
  },
  dealSellerPlatform: {
    fontSize: typography.sizes.xs,
  },
  dealSellerCondition: {
    fontSize: 10,
    marginTop: 2,
  },
  dealListingPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
  },
  dealActionBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  dealActionBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  trendEditorialHeroFrame: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    height: 280,
    position: 'relative',
    marginBottom: spacing.xl,
    backgroundColor: '#0D1117',
  },
  trendEditorialHeroPhoto: {
    width: '100%',
    height: '100%',
  },
  trendEditorialScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  trendHeroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  trendHeroPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
    marginBottom: spacing.xs,
  },
  trendHeroPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  trendHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trendHeroDesc: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  trendTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  trendTagPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendDispatchCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  trendDispatchItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  trendDispatchNum: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  trendDispatchHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  trendDispatchBody: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
  },
  trendDispatchDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  trendLookbookCard: {
    width: 200,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trendLookbookImg: {
    width: '100%',
    height: 180,
  },
  trendLookbookBody: {
    padding: spacing.sm,
  },
  trendLookbookLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  trendLookbookTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
  },
  trendLookbookNote: {
    fontSize: 10,
    marginTop: 2,
  },
  styleEditorialCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  styleEditorialImageFrame: {
    width: '100%',
    height: 360,
    position: 'relative',
    backgroundColor: '#0D1117',
  },
  styleEditorialPhoto: {
    width: '100%',
    height: '100%',
  },
  styleEditorialScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  styleTopBar: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stylePieceFloatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 17, 23, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
    gap: 6,
  },
  stylePieceFloatingThumb: {
    width: 22,
    height: 22,
    borderRadius: 2,
  },
  stylePieceFloatingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  styleAestheticBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  styleAestheticBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  styleHeroOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  styleLookNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  styleLookTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  styleEditorialBody: {
    padding: spacing.md,
  },
  styleStylistQuote: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  stylePiecesCapsules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  stylePieceCapsule: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  stylePieceCapsuleCat: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  stylePieceCapsuleLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  stylePaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  stylePaletteLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stylePaletteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: 4,
  },
  stylePaletteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stylePaletteText: {
    fontSize: 9,
    fontWeight: '600',
  },
  styleCardAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  styleCardActionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  styleCardActionArrow: {
    fontSize: 14,
    fontWeight: '700',
  },
});

