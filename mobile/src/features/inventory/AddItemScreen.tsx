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
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateItem, useUpdateItem } from '../../hooks/useItems';
import { useStorageLocations } from '../../hooks/useStorageLocations';
import { useMarketplaceConnections, useConnectMarketplace } from '../../hooks/useMarketplaces';
import { itemImagesApi } from '../../services/api/itemImages';
import { itemRecognitionApi } from '../../services/api/itemRecognition';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { currencyToCents } from '../../utils/currency';
import {
  AppButton,
  AppInput,
  AppCard,
  AppHeader,
  PrettyIcon,
} from '../../components';

export interface PhotoAsset {
  uri: string;
  base64?: string;
  fileName?: string;
  mimeType?: string;
}

export const AddItemScreen = ({ navigation }: any) => {
  // Mode selection: 'SELECT' | 'AI_REVIEW' | 'MANUAL'
  const [mode, setMode] = useState<'SELECT' | 'AI_REVIEW' | 'MANUAL'>('SELECT');

  // Multi-photo state
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  // AI Pipeline State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [isUploadingToEbay, setIsUploadingToEbay] = useState(false);

  // AI Inference & Confidence
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [era, setEra] = useState<string | null>(null);
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<string[]>([]);
  const [researchStatus, setResearchStatus] = useState<'NOT_VERIFIED' | 'UNAVAILABLE' | 'COMPLETED'>('UNAVAILABLE');
  const [researchData, setResearchData] = useState<{
    queryTerms?: string;
    originalRetailPrice?: number | null;
    resaleLow?: number | null;
    resaleHigh?: number | null;
    sampleSize?: number;
    sources?: string[];
    soldPriceStatus?: string;
    factors?: string[];
  } | null>(null);
  const [fieldConfidence, setFieldConfidence] = useState<{
    brand?: 'high' | 'medium' | 'low';
    category?: 'high' | 'medium' | 'low';
    model?: 'high' | 'medium' | 'low';
    color?: 'high' | 'medium' | 'low';
    size?: 'high' | 'medium' | 'low';
    era?: 'high' | 'medium' | 'low';
  }>({});

  // Form Fields (Comprehensive item representation)
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [model, setModel] = useState('');
  const [styleCode, setStyleCode] = useState('');
  const [sku, setSku] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [storageLocationId, setStorageLocationId] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const { data: locations = [] } = useStorageLocations();
  const { data: marketplaceConnections = [] } = useMarketplaceConnections();
  const connectMarketplaceMutation = useConnectMarketplace();

  const scanSteps = [
    'Uploading item photos to secure storage',
    'Analyzing visual features with Gemini 2.5 Flash',
    'Identifying brand, model, and physical attributes',
    'Researching resale market and pricing comps',
    'Drafting complete editable listing',
  ];

  const extractId = (res: any): string => {
    if (!res) return '';
    return res.id || res.data?.id || '';
  };

  // --- Photo Capture & Multi-Selection Handlers ---
  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Flashy needs camera access to photograph your fashion items.',
          [
            { text: 'Add Manually', onPress: () => setMode('MANUAL') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhoto: PhotoAsset = {
          uri: asset.uri,
          base64: asset.base64 || undefined,
          fileName: asset.fileName || `capture-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        };
        const updated = [...photos, newPhoto];
        setPhotos(updated);
        await runAiPipeline(updated);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  const handlePickPhotos = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access to select item pictures.',
          [{ text: 'Add Manually', onPress: () => setMode('MANUAL') }, { text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos: PhotoAsset[] = result.assets.map((asset) => ({
          uri: asset.uri,
          base64: asset.base64 || undefined,
          fileName: asset.fileName || `gallery-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        const updated = [...photos, ...newPhotos];
        setPhotos(updated);
        await runAiPipeline(updated);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not select photo.');
    }
  };

  const handleAddSupplementaryPhoto = async () => {
    Alert.alert('Add Supplementary Photo', 'Take an additional photo (e.g., label, tag, or defect) or pick from gallery:', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            base64: true,
          });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const asset = res.assets[0];
            const added: PhotoAsset = {
              uri: asset.uri,
              base64: asset.base64 || undefined,
              fileName: asset.fileName || `supplementary-${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
            };
            const updated = [...photos, added];
            setPhotos(updated);
            if (createdItemId && asset.base64) {
              try {
                await itemImagesApi.uploadDirect(createdItemId, {
                  base64Data: asset.base64,
                  mimeType: asset.mimeType || 'image/jpeg',
                  originalFilename: asset.fileName || 'supplementary.jpg',
                });
              } catch (e) {
                console.warn('Failed to upload supplementary image:', e);
              }
            }
          }
        },
      },
      {
        text: 'From Gallery',
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.85,
            base64: true,
          });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const added = res.assets.map((asset) => ({
              uri: asset.uri,
              base64: asset.base64 || undefined,
              fileName: asset.fileName || `supplementary-${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
            }));
            const updated = [...photos, ...added];
            setPhotos(updated);
            if (createdItemId) {
              for (const a of added) {
                if (a.base64) {
                  try {
                    await itemImagesApi.uploadDirect(createdItemId, {
                      base64Data: a.base64,
                      mimeType: a.mimeType || 'image/jpeg',
                      originalFilename: a.fileName || 'supplementary.jpg',
                    });
                  } catch (e) {
                    console.warn('Failed to upload supplementary image:', e);
                  }
                }
              }
            }
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    Alert.alert('Remove Photo', 'Remove this photo from item analysis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        },
      },
    ]);
  };

  // --- Step: Run 5-Stage Multi-Image AI Pipeline ---
  const runAiPipeline = async (photoList: PhotoAsset[]) => {
    setIsAnalyzing(true);
    setMode('AI_REVIEW');

    try {
      // Stage 1: Uploading item photos
      setScanStepIndex(0);
      setScanStatusText(scanSteps[0]);

      let itemId = createdItemId;
      if (!itemId) {
        const initialTitle = 'Uncategorized Physical Item';
        const createdResponse = await createItemMutation.mutateAsync({
          title: initialTitle,
          condition: 'GOOD',
        });
        itemId = extractId(createdResponse);
        if (!itemId) throw new Error('Failed to initialize canonical item record.');
        setCreatedItemId(itemId);
      }

      for (let i = 0; i < photoList.length; i++) {
        const p = photoList[i];
        if (p.base64) {
          try {
            await itemImagesApi.uploadDirect(itemId, {
              base64Data: p.base64,
              mimeType: p.mimeType || 'image/jpeg',
              originalFilename: p.fileName || `photo-${i + 1}.jpg`,
            });
          } catch (uploadErr) {
            console.warn(`Direct upload warning for image ${i + 1}:`, uploadErr);
          }
        }
      }

      // Stage 2: Multimodal Gemini Analysis
      setScanStepIndex(1);
      setScanStatusText(scanSteps[1]);
      await new Promise((r) => setTimeout(r, 400));

      // Stage 3: Product Facts Extraction
      setScanStepIndex(2);
      setScanStatusText(scanSteps[2]);
      const recognitionResult = await itemRecognitionApi.startRecognition(itemId, true);

      // Stage 4: Resale Market Research
      setScanStepIndex(3);
      setScanStatusText(scanSteps[3]);
      try {
        const { apiClient } = await import('../../services/api/client');
        const pricingRes = await apiClient.fetch(`/items/${itemId}/pricing/research`, {
          method: 'POST',
        });
        setResearchData({
          queryTerms: pricingRes?.queryTerms,
          originalRetailPrice: pricingRes?.originalRetailPrice,
          resaleLow: pricingRes?.resaleLow,
          resaleHigh: pricingRes?.resaleHigh,
          sampleSize: pricingRes?.sampleSize,
          sources: pricingRes?.sources,
          soldPriceStatus: pricingRes?.soldPriceStatus,
          factors: pricingRes?.factors,
        });
        if (pricingRes?.soldPriceStatus === 'UNAVAILABLE') {
          setResearchStatus('UNAVAILABLE');
        } else if (pricingRes?.status === 'COMPLETED') {
          setResearchStatus('COMPLETED');
        } else {
          setResearchStatus('NOT_VERIFIED');
        }
      } catch (researchErr) {
        console.warn('Market research notice:', researchErr);
        setResearchStatus('UNAVAILABLE');
      }

      // Stage 5: Listing Draft Preparation
      setScanStepIndex(4);
      setScanStatusText(scanSteps[4]);

      if (recognitionResult) {
        const suggestedTitle =
          recognitionResult.productName ||
          [recognitionResult.brand, recognitionResult.category, recognitionResult.model].filter(Boolean).join(' ') ||
          'Physical Item';

        setTitle(suggestedTitle);
        if (recognitionResult.brand) setBrand(recognitionResult.brand);
        if (recognitionResult.category) setCategory(recognitionResult.category);
        if (recognitionResult.model) setModel(recognitionResult.model);
        if (recognitionResult.color) setColor(recognitionResult.color);
        if (recognitionResult.size) setSize(recognitionResult.size);
        if (recognitionResult.material) setMaterial(recognitionResult.material);
        if (recognitionResult.era) setEra(recognitionResult.era);
        if (Array.isArray(recognitionResult.distinctiveFeatures)) {
          setDistinctiveFeatures(recognitionResult.distinctiveFeatures);
        }

        const conf = recognitionResult.confidence ?? 0.85;
        setAiConfidence(conf);
        if (recognitionResult.notes) setAiNotes(recognitionResult.notes);

        const rating: 'high' | 'medium' | 'low' =
          conf >= 0.85 ? 'high' : conf >= 0.65 ? 'medium' : 'low';
        setFieldConfidence({
          brand: recognitionResult.brand ? rating : 'low',
          category: recognitionResult.category ? rating : 'low',
          model: recognitionResult.model ? rating : 'low',
          color: recognitionResult.color ? rating : 'low',
          size: recognitionResult.size ? rating : 'low',
          era: recognitionResult.era ? rating : 'low',
        });

        // Trigger real listing draft generation
        try {
          const { apiClient } = await import('../../services/api/client');
          const genRes = await apiClient.fetch(`/items/${itemId}/listing-generation`, {
            method: 'POST',
          });
          if (genRes?.description && !notes) {
            setNotes(genRes.description);
          }
        } catch (draftGenErr) {
          console.warn('Listing draft generation notice:', draftGenErr);
        }
      }
    } catch (aiErr: any) {
      console.warn('Gemini recognition error:', aiErr);
      Alert.alert(
        'AI Intake Notice',
        aiErr?.message || 'Could not automatically identify the item from these photos.',
        [
          {
            text: 'Retry AI Scan',
            onPress: () => {
              if (photos.length > 0) {
                runAiPipeline(photos);
              }
            },
          },
          {
            text: 'Add Manually',
            onPress: () => setMode('MANUAL'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Save Handler (Single Canonical Item Lifecycle) ---
  const persistItem = async (): Promise<string> => {
    if (!title.trim()) {
      throw new Error('Please enter an item title.');
    }

    const payload: any = {
      title: title.trim(),
      brand: brand.trim() || undefined,
      category: category.trim() || undefined,
      subcategory: subcategory.trim() || undefined,
      condition,
      color: color.trim() || undefined,
      size: size.trim() || undefined,
      description: notes.trim() || undefined,
      storageLocationId: storageLocationId || undefined,
    };

    if (purchasePrice.trim()) {
      payload.purchasePrice = currencyToCents(purchasePrice);
    }
    if (marketPrice.trim()) {
      payload.marketPrice = currencyToCents(marketPrice);
    }

    let finalItemId = createdItemId;
    if (finalItemId) {
      await updateItemMutation.mutateAsync({
        id: finalItemId,
        data: payload,
      });
    } else {
      const created = await createItemMutation.mutateAsync(payload);
      finalItemId = extractId(created);
      setCreatedItemId(finalItemId);
    }

    // Sync listing draft with latest user edits
    if (finalItemId) {
      try {
        const { apiClient } = await import('../../services/api/client');
        const draftPriceInCents = marketPrice.trim()
          ? currencyToCents(marketPrice)
          : purchasePrice.trim()
          ? currencyToCents(purchasePrice)
          : undefined;

        await apiClient.fetch(`/items/${finalItemId}/listing-generation`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            description: notes.trim() || title.trim(),
            category: category.trim() || undefined,
            brand: brand.trim() || undefined,
            condition: condition || undefined,
            color: color.trim() || undefined,
            size: size.trim() || undefined,
            price: draftPriceInCents,
          }),
        });
      } catch (draftErr) {
        console.warn('Listing draft sync notice:', draftErr);
      }

      // Invalidate relevant TanStack Query keys
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', finalItemId] });
      queryClient.invalidateQueries({ queryKey: ['listing-draft', finalItemId] });
      queryClient.invalidateQueries({ queryKey: ['pricing', finalItemId] });
    }

    return finalItemId;
  };

  const handleSave = async () => {
    try {
      const finalItemId = await persistItem();
      Alert.alert('Success', 'Item saved to inventory successfully!');
      navigation.replace('ItemDetail', { id: finalItemId });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || err.message || 'Failed to save item');
    }
  };

  const handleDirectUploadToEbay = async () => {
    try {
      setIsUploadingToEbay(true);
      const finalItemId = await persistItem();

      const draftPriceInCents = marketPrice.trim()
        ? currencyToCents(marketPrice)
        : purchasePrice.trim()
        ? currencyToCents(purchasePrice)
        : 1000;

      try {
        const { apiClient } = await import('../../services/api/client');
        await apiClient.fetch(`/items/${finalItemId}/listing-generation`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            description: notes.trim() || title.trim(),
            category: category.trim() || undefined,
            brand: brand.trim() || undefined,
            condition: condition || undefined,
            color: color.trim() || undefined,
            size: size.trim() || undefined,
            price: draftPriceInCents,
          }),
        });
      } catch (draftErr) {
        console.warn('Listing draft patch notice:', draftErr);
      }

      const ebayConn = Array.isArray(marketplaceConnections)
        ? marketplaceConnections.find((c: any) => c.marketplace === 'EBAY' && c.connected)
        : null;

      if (!ebayConn) {
        Alert.alert(
          'Connect eBay Account',
          'Your item is saved to inventory! Connect your eBay seller account to publish.',
          [
            { text: 'View Item', onPress: () => navigation.replace('ItemDetail', { id: finalItemId }) },
            {
              text: 'Connect eBay Now',
              onPress: async () => {
                try {
                  await connectMarketplaceMutation.mutateAsync('ebay');
                  navigation.replace('ListingEditor', { itemId: finalItemId });
                } catch (e: any) {
                  Alert.alert('eBay Connect', e.message || 'Could not launch eBay connection.');
                }
              },
            },
          ]
        );
        return;
      }

      const { apiClient } = await import('../../services/api/client');
      const publishRes = await apiClient.fetch(`/marketplaces/ebay/items/${finalItemId}/publish`, {
        method: 'POST',
      });

      Alert.alert(
        'Published to eBay!',
        `Your item was successfully uploaded to eBay for selling${publishRes?.externalListingId ? ` (ID: ${publishRes.externalListingId})` : ''}!`,
        [{ text: 'OK', onPress: () => navigation.replace('ItemDetail', { id: finalItemId }) }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to upload to eBay';
      Alert.alert('eBay Upload Notice', msg, [
        {
          text: 'Open Listing Editor',
          onPress: () => {
            if (createdItemId) {
              navigation.replace('ListingEditor', { itemId: createdItemId });
            }
          },
        },
        { text: 'OK' },
      ]);
    } finally {
      setIsUploadingToEbay(false);
    }
  };

  const renderConfidencePill = (field: keyof typeof fieldConfidence) => {
    if (mode !== 'AI_REVIEW') return null;
    const rating = fieldConfidence[field];
    if (!rating) return null;

    let badgeText = 'Needs review';
    let badgeColor = colors.warning;
    let badgeBg = '#FEF3C7';

    if (rating === 'high') {
      badgeText = 'High confidence';
      badgeColor = colors.success;
      badgeBg = '#D1FAE5';
    } else if (rating === 'medium') {
      badgeText = 'Medium confidence';
      badgeColor = colors.primary;
      badgeBg = colors.primaryLight;
    }

    return (
      <View style={[styles.confidenceBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.confidenceBadgeText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={
          mode === 'SELECT'
            ? 'Add Physical Item'
            : mode === 'AI_REVIEW'
            ? 'Review Item Details'
            : 'Add Item Manually'
        }
        subtitle={
          mode === 'SELECT'
            ? 'Choose intake method'
            : mode === 'AI_REVIEW'
            ? 'Gemini suggestions — edit as needed'
            : 'Enter item properties'
        }
        showBack={true}
        onBack={() => {
          if (mode === 'AI_REVIEW' || mode === 'MANUAL') {
            setMode('SELECT');
          } else {
            navigation.goBack();
          }
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* CHOICE SCREEN */}
          {mode === 'SELECT' && (
            <View style={styles.choiceContainer}>
              <View style={styles.choiceIntro}>
                <Text style={styles.choiceHeaderTitle}>How would you like to add this item?</Text>
                <Text style={styles.choiceHeaderSub}>
                  One physical item is the source of truth across all marketplaces.
                </Text>
              </View>

              {/* OPTION A: SCAN WITH AI */}
              <AppCard variant="elevated" style={styles.choiceCard}>
                <View style={styles.choiceIconBadge}>
                  <PrettyIcon name="camera" size="md" variant="coral" />
                </View>
                <Text style={styles.choiceCardTitle}>Option A: Scan with AI</Text>
                <Text style={styles.choiceCardDesc}>
                  Photograph key views of your item. More useful photos (front, back, tags, labels, soles, defects) = better identification. Gemini cross-references the complete gallery to extract verified facts and comps.
                </Text>

                <View style={styles.choiceActionRow}>
                  <AppButton
                    title="Take Photo & Scan"
                    onPress={handleTakePhoto}
                    variant="primary"
                    size="md"
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    title="Pick Photos"
                    onPress={handlePickPhotos}
                    variant="outline"
                    size="md"
                    style={{ marginLeft: spacing.xs }}
                  />
                </View>
              </AppCard>

              {/* OPTION B: ADD MANUALLY */}
              <AppCard variant="flat" style={styles.choiceCard}>
                <View style={styles.choiceIconBadge}>
                  <PrettyIcon name="tag" size="md" variant="silk" />
                </View>
                <Text style={styles.choiceCardTitle}>Option B: Add Manually</Text>
                <Text style={styles.choiceCardDesc}>
                  Type title, brand, model, SKU, condition, costs, and storage location directly without AI.
                </Text>

                <AppButton
                  title="Add Manually"
                  onPress={() => setMode('MANUAL')}
                  variant="secondary"
                  size="md"
                  style={{ marginTop: spacing.xs }}
                />
              </AppCard>
            </View>
          )}

          {/* AI REVIEW & MANUAL SCREENS */}
          {(mode === 'AI_REVIEW' || mode === 'MANUAL') && (
            <View>
              {/* Sequential AI Progress Banner */}
              {isAnalyzing && (
                <AppCard variant="elevated" style={styles.pipelineBannerCard}>
                  <View style={styles.pipelineHeader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.pipelineStepCounter}>
                      Step {scanStepIndex + 1} of {scanSteps.length}
                    </Text>
                  </View>
                  <Text style={styles.pipelineStatusTitle}>{scanStatusText}</Text>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${((scanStepIndex + 1) / scanSteps.length) * 100}%` },
                      ]}
                    />
                  </View>
                </AppCard>
              )}

              {/* Multi-Photo Gallery & Supplementary Intake Banner */}
              <AppCard variant="elevated" style={styles.photoBannerCard}>
                <View style={styles.photoBannerHeader}>
                  <Text style={styles.photoBannerTitle}>
                    Physical Item Photos ({photos.length})
                  </Text>
                  <TouchableOpacity onPress={handleAddSupplementaryPhoto} style={styles.addPhotoBtn}>
                    <Text style={styles.addPhotoBtnText}>+ Add Photo</Text>
                  </TouchableOpacity>
                </View>

                {photos.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScrollRow}>
                    {photos.map((p, idx) => (
                      <View key={idx} style={styles.thumbWrapper}>
                        <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                        <View style={styles.photoBadge}>
                          <Text style={styles.photoBadgeText}>#{idx + 1}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemovePhoto(idx)}
                          style={styles.photoRemoveBtn}
                          accessibilityLabel={`Remove photo ${idx + 1}`}
                        >
                          <Text style={styles.photoRemoveBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noPhotosText}>No photos attached yet.</Text>
                )}

                {aiNotes ? <Text style={styles.aiNotesText}>Visual Observations: {aiNotes}</Text> : null}
              </AppCard>

              {/* DEDICATED REVIEW STATE: AI IDENTIFICATION & MARKET RESEARCH SUMMARY */}
              {mode === 'AI_REVIEW' && (
                <View style={styles.reviewSummarySection}>
                  <AppCard variant="elevated" style={styles.reviewCard}>
                    <View style={styles.reviewHeaderRow}>
                      <Text style={styles.reviewSectionTitle}>AI IDENTIFICATION SUMMARY</Text>
                      {aiConfidence !== null ? (
                        <View style={[styles.confidenceBadge, { backgroundColor: aiConfidence >= 0.8 ? '#D1FAE5' : '#FEF3C7' }]}>
                          <Text style={[styles.confidenceBadgeText, { color: aiConfidence >= 0.8 ? colors.success : colors.warning }]}>
                            {aiConfidence >= 0.8 ? 'High Confidence' : 'Review Suggested'} ({Math.round(aiConfidence * 100)}%)
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.reviewFactsGrid}>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Item / Title:</Text>
                        <Text style={styles.reviewFactValue}>{title || 'Unverified'}</Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Brand & Model:</Text>
                        <Text style={styles.reviewFactValue}>{[brand, model].filter(Boolean).join(' • ') || 'Unverified'}</Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Category:</Text>
                        <Text style={styles.reviewFactValue}>{[category, subcategory].filter(Boolean).join(' / ') || 'Unverified'}</Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Condition Clues:</Text>
                        <Text style={styles.reviewFactValue}>{condition.replace('_', ' ')}</Text>
                      </View>
                      {era ? (
                        <View style={styles.reviewFactRow}>
                          <Text style={styles.reviewFactLabel}>Estimated Era:</Text>
                          <Text style={styles.reviewFactValue}>{era}</Text>
                        </View>
                      ) : null}
                      {distinctiveFeatures.length > 0 ? (
                        <View style={styles.reviewFactRow}>
                          <Text style={styles.reviewFactLabel}>Distinctive Features:</Text>
                          <Text style={styles.reviewFactValue}>{distinctiveFeatures.join(', ')}</Text>
                        </View>
                      ) : null}
                    </View>
                  </AppCard>

                  <AppCard variant="elevated" style={styles.reviewCard}>
                    <View style={styles.reviewHeaderRow}>
                      <Text style={styles.reviewSectionTitle}>MARKET INTELLIGENCE</Text>
                      <View style={[styles.confidenceBadge, { backgroundColor: researchStatus === 'COMPLETED' ? '#D1FAE5' : '#F3F4F6' }]}>
                        <Text style={[styles.confidenceBadgeText, { color: researchStatus === 'COMPLETED' ? colors.success : colors.textSecondary }]}>
                          {researchStatus === 'COMPLETED' ? 'LIVE DATA' : researchStatus === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'NOT VERIFIED'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reviewFactsGrid}>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Search Terms:</Text>
                        <Text style={styles.reviewFactValue}>{researchData?.queryTerms || [brand, model, category].filter(Boolean).join(' ') || title || 'Item'}</Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Original / Retail Price:</Text>
                        <Text style={researchData?.originalRetailPrice ? styles.reviewFactValue : styles.reviewFactValueMuted}>
                          {researchData?.originalRetailPrice ? `$${(researchData.originalRetailPrice / 100).toFixed(2)}` : 'Unavailable (no public comps)'}
                        </Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Current Resale Range:</Text>
                        <Text style={researchData?.resaleLow && researchData?.resaleHigh ? styles.reviewFactValue : styles.reviewFactValueMuted}>
                          {researchData?.resaleLow && researchData?.resaleHigh 
                            ? `$${(researchData.resaleLow / 100).toFixed(2)} – $${(researchData.resaleHigh / 100).toFixed(2)}`
                            : 'Unavailable (zero simulated data)'}
                        </Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Comparable Sample:</Text>
                        <Text style={researchData?.sampleSize ? styles.reviewFactValue : styles.reviewFactValueMuted}>
                          {researchData?.sampleSize ? `${researchData.sampleSize} listings` : '0 listings verified'}
                        </Text>
                      </View>
                      <View style={styles.reviewFactRow}>
                        <Text style={styles.reviewFactLabel}>Sold-Price Data:</Text>
                        <Text style={styles.reviewFactValueMuted}>
                          {researchData?.soldPriceStatus || 'UNAVAILABLE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.transparencyNote}>
                      ℹ️ SellPort adheres to honest research: asking and sold comps are never fabricated or simulated. All editable fields can be refined below.
                    </Text>
                  </AppCard>
                </View>
              )}

              {/* Form: Editable Item Properties */}
              <AppCard variant="elevated" style={styles.formCard}>
                <Text style={styles.groupTitle}>Edit & Confirm Item Details</Text>

                <AppInput
                  label="Title *"
                  placeholder="e.g., Nike Air Max 90 Infrared Size 10.5"
                  value={title}
                  onChangeText={setTitle}
                  hint={mode === 'AI_REVIEW' ? 'Review or edit title' : undefined}
                />

                <View style={styles.fieldWithConfidence}>
                  <View style={styles.twoColumn}>
                    <View style={styles.columnItem}>
                      <View style={styles.labelConfidenceRow}>
                        <Text style={styles.miniLabel}>Brand</Text>
                        {renderConfidencePill('brand')}
                      </View>
                      <AppInput
                        placeholder="e.g., Nike"
                        value={brand}
                        onChangeText={setBrand}
                      />
                    </View>
                    <View style={styles.columnItem}>
                      <View style={styles.labelConfidenceRow}>
                        <Text style={styles.miniLabel}>Category</Text>
                        {renderConfidencePill('category')}
                      </View>
                      <AppInput
                        placeholder="e.g., Sneakers"
                        value={category}
                        onChangeText={setCategory}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoColumn}>
                  <AppInput
                    label="Subcategory"
                    placeholder="e.g., Running Shoes"
                    value={subcategory}
                    onChangeText={setSubcategory}
                    containerStyle={styles.columnItem}
                  />
                  <View style={styles.columnItem}>
                    <View style={styles.labelConfidenceRow}>
                      <Text style={styles.miniLabel}>Model</Text>
                      {renderConfidencePill('model')}
                    </View>
                    <AppInput
                      placeholder="e.g., Air Max 90"
                      value={model}
                      onChangeText={setModel}
                    />
                  </View>
                </View>

                <View style={styles.twoColumn}>
                  <View style={styles.columnItem}>
                    <View style={styles.labelConfidenceRow}>
                      <Text style={styles.miniLabel}>Color</Text>
                      {renderConfidencePill('color')}
                    </View>
                    <AppInput
                      placeholder="e.g., White / Infrared"
                      value={color}
                      onChangeText={setColor}
                    />
                  </View>
                  <View style={styles.columnItem}>
                    <View style={styles.labelConfidenceRow}>
                      <Text style={styles.miniLabel}>Size</Text>
                      {renderConfidencePill('size')}
                    </View>
                    <AppInput
                      placeholder="e.g., 10.5 US"
                      value={size}
                      onChangeText={setSize}
                    />
                  </View>
                </View>

                <View style={styles.twoColumn}>
                  <AppInput
                    label="Style Code / MPN"
                    placeholder="e.g., CT1685-100"
                    value={styleCode}
                    onChangeText={setStyleCode}
                    containerStyle={styles.columnItem}
                  />
                  <AppInput
                    label="Material"
                    placeholder="e.g., Mesh / Leather"
                    value={material}
                    onChangeText={setMaterial}
                    containerStyle={styles.columnItem}
                  />
                </View>

                {/* Condition Selection */}
                <Text style={styles.inputLabel}>Condition</Text>
                <View style={styles.conditionRow}>
                  {['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCondition(c)}
                      style={[
                        styles.conditionChip,
                        condition === c && styles.conditionChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.conditionChipText,
                          condition === c && styles.conditionChipTextActive,
                        ]}
                      >
                        {c.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </AppCard>

              {/* Financials & Storage Location */}
              <AppCard variant="elevated" style={styles.formCard}>
                <Text style={styles.groupTitle}>Pricing & Storage</Text>

                <View style={styles.twoColumn}>
                  <AppInput
                    label="Cost / Purchase Price ($)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                    containerStyle={styles.columnItem}
                  />
                  <AppInput
                    label="Target / Resale Price ($)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={marketPrice}
                    onChangeText={setMarketPrice}
                    containerStyle={styles.columnItem}
                  />
                </View>

                <AppInput
                  label="Internal SKU / Barcode"
                  placeholder="e.g., LM-2026-0041"
                  value={sku}
                  onChangeText={setSku}
                  containerStyle={{ marginBottom: spacing.sm }}
                />

                {/* Storage Location Picker */}
                <Text style={styles.inputLabel}>Storage Bin / Shelf</Text>
                <View style={styles.locationWrap}>
                  <TouchableOpacity
                    onPress={() => setStorageLocationId(undefined)}
                    style={[
                      styles.locationChip,
                      !storageLocationId && styles.locationChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.locationChipText,
                        !storageLocationId && styles.locationChipTextActive,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>
                  {locations.map((loc: any) => (
                    <TouchableOpacity
                      key={loc.id}
                      onPress={() => setStorageLocationId(loc.id)}
                      style={[
                        styles.locationChip,
                        storageLocationId === loc.id && styles.locationChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.locationChipText,
                          storageLocationId === loc.id && styles.locationChipTextActive,
                        ]}
                      >
                        📍 {loc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <AppInput
                  label="Private Notes"
                  placeholder="Flaws, provenance notes, tag details..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  inputStyle={styles.textArea}
                  containerStyle={{ marginTop: spacing.md }}
                />
              </AppCard>

              {/* Action Buttons */}
              <View style={styles.actionButtonsCol}>
                <AppButton
                  title="Upload to eBay for Selling"
                  onPress={handleDirectUploadToEbay}
                  loading={isUploadingToEbay || createItemMutation.isPending || updateItemMutation.isPending}
                  variant="secondary"
                  size="lg"
                  style={styles.ebayDirectBtn}
                />

                <AppButton
                  title="Review & Customize Listing Draft"
                  onPress={async () => {
                    try {
                      const finalItemId = await persistItem();
                      navigation.replace('ListingEditor', { itemId: finalItemId });
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to prepare item for listing.');
                    }
                  }}
                  variant="outline"
                  size="lg"
                  style={{ marginBottom: spacing.sm }}
                />

                <AppButton
                  title="Save Item to Inventory"
                  onPress={handleSave}
                  loading={createItemMutation.isPending || updateItemMutation.isPending}
                  variant="primary"
                  size="lg"
                  style={styles.submitBtn}
                />
              </View>
            </View>
          )}
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
  choiceContainer: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  choiceIntro: {
    marginBottom: spacing.xs,
  },
  choiceHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  choiceHeaderSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  choiceCard: {
    padding: spacing.md,
  },
  choiceIconBadge: {
    marginBottom: spacing.xs,
  },
  choiceCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  choiceCardDesc: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.md,
  },
  choiceActionRow: {
    flexDirection: 'row',
  },
  pipelineBannerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
  },
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pipelineStepCounter: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  pipelineStatusTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  photoBannerCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  photoBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  photoBannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  addPhotoBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  addPhotoBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
  },
  photoScrollRow: {
    flexDirection: 'row',
    marginVertical: spacing.xxs,
  },
  thumbWrapper: {
    position: 'relative',
    marginRight: spacing.xs,
  },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  photoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  photoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  noPhotosText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  aiNotesText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 4,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  columnItem: {
    flex: 1,
  },
  fieldWithConfidence: {
    marginBottom: 0,
  },
  labelConfidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  confidenceBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  conditionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  conditionChipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  conditionChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  conditionChipTextActive: {
    color: colors.primaryDark,
  },
  locationWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  locationChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  locationChipActive: {
    backgroundColor: colors.text,
  },
  locationChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  locationChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  actionButtonsCol: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  ebayDirectBtn: {
    backgroundColor: '#0064D2',
  },
  submitBtn: {
    marginTop: 0,
  },
  reviewSummarySection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  reviewCard: {
    padding: spacing.md,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.xxs,
  },
  reviewSectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  reviewFactsGrid: {
    gap: 4,
  },
  reviewFactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  reviewFactLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    width: '38%',
  },
  reviewFactValue: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
    width: '62%',
    textAlign: 'right',
  },
  reviewFactValueMuted: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    width: '62%',
    textAlign: 'right',
  },
  transparencyNote: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 4,
  },
});

