import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { PrettyIcon } from '../../components/ui/PrettyIcon';
import { useFashionTheme, spacing, typography, radii } from '../../constants/theme';
import { useCreateFashionItem, useAnalyzeFashionItem } from '../../hooks/useFashion';
import { fashionApi } from '../../services/api/fashion';

interface PhotoAsset {
  uri: string;
  base64?: string;
  label?: string;
}

export const ScanScreen = ({ navigation }: any) => {
  const { colors, isDark } = useFashionTheme();
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  const createItemMutation = useCreateFashionItem();
  const analyzeItemMutation = useAnalyzeFashionItem();

  const handleTakePhoto = async (labelPrompt?: string) => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Permission',
          'Flashy requires camera access to photograph and identify garments.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const roles = ['Front', 'Back', 'Label', 'Fabric / Material', 'Detail', 'Side', 'Tag'];
        const assignedRole = labelPrompt || roles[photos.length] || `Photo ${photos.length + 1}`;
        const newPhoto: PhotoAsset = {
          uri: asset.uri,
          base64: asset.base64 || undefined,
          label: assignedRole,
        };
        setPhotos((prev) => [...prev, newPhoto]);
        setActivePhotoIndex(photos.length);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo Library Access',
          'Flashy needs photo library access to analyze your selected images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
        base64: true,
        allowsMultipleSelection: true,
        selectionLimit: 8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const roles = ['Front', 'Back', 'Label', 'Fabric / Material', 'Detail', 'Side', 'Tag'];
        const newPhotos: PhotoAsset[] = result.assets.map((asset, idx) => {
          const roleIndex = photos.length + idx;
          const assignedLabel = roles[roleIndex] || `Photo ${roleIndex + 1}`;
          return {
            uri: asset.uri,
            base64: asset.base64 || undefined,
            label: assignedLabel,
          };
        });
        setPhotos((prev) => [...prev, ...newPhotos]);
        setActivePhotoIndex(photos.length);
      }
    } catch (err: any) {
      Alert.alert('Library Error', err.message || 'Could not open library.');
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (activePhotoIndex >= updated.length) {
        setActivePhotoIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleStartAnalysis = async () => {
    if (photos.length === 0) return;

    try {
      setIsProcessing(true);
      setProcessingStage('Creating fashion item record...');

      // 1. Create canonical FashionItem
      const item = await createItemMutation.mutateAsync();

      // 2. Upload all photos belonging to this single canonical fashion item
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        let base64Data = p.base64;
        if (!base64Data && p.uri) {
          try {
            const resp = await fetch(p.uri);
            const blob = await resp.blob();
            base64Data = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const res = (reader.result as string) || '';
                resolve(res.includes(',') ? res.split(',')[1] : res);
              };
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn('Failed to convert photo uri to base64:', e);
          }
        }

        if (base64Data) {
          setProcessingStage(`Uploading photo ${i + 1} of ${photos.length}...`);
          await fashionApi.uploadPhotoDirect(item.id, base64Data, 'image/jpeg');
        }
      }

      setProcessingStage('Understanding item with visual reasoning...');

      // 3. Trigger visual understanding & styling engine across all angles
      const analyzed = await analyzeItemMutation.mutateAsync(item.id);

      setProcessingStage('Preparing fashion report...');

      // Navigate to Editorial Fashion Analysis Screen
      navigation.replace('FashionAnalysis', { id: analyzed.id });
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert(
        'Identification Notice',
        err.message || 'Flashy could not complete analysis. You can try again with a clearer photo.'
      );
    }
  };

  const currentPhoto = photos[activePhotoIndex] || null;

  return (
    <ScreenContainer
      activeTab="Scan"
      title="GARMENT SCAN"
      subtitle="Visual fashion recognition & provenance"
      showBack={true}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Main Viewfinder / Photo Selection Area */}
        <View
          style={[
            styles.viewfinderCard,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {currentPhoto ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: currentPhoto.uri }} style={styles.previewImage} />

              {/* Angle / Multi-Photo Strip Header Overlay */}
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>
                  {photos.length} {photos.length === 1 ? 'view' : 'views'} selected
                </Text>
              </View>

              {/* Action row at bottom of preview */}
              <View
                style={[
                  styles.previewActionRow,
                  {
                    backgroundColor: isDark ? 'rgba(13, 17, 23, 0.85)' : 'rgba(250, 248, 245, 0.9)',
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.previewActionBtn, { borderColor: colors.border }]}
                  onPress={() => handleRemovePhoto(activePhotoIndex)}
                  disabled={isProcessing}
                >
                  <Text style={[styles.previewActionBtnText, { color: colors.error }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.previewActionBtn,
                    { backgroundColor: colors.burgundy },
                  ]}
                  onPress={() => handleTakePhoto()}
                  disabled={isProcessing || photos.length >= 8}
                >
                  <Text style={styles.previewActionBtnPrimaryText}>
                    + Add angle/tag
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyViewfinder}>
              <View style={styles.cameraIconCircle}>
                <PrettyIcon name="camera" size="lg" variant="coral" />
              </View>
              <Text style={[styles.viewfinderTitle, { color: colors.text }]}>
                Photograph any fashion piece
              </Text>
              <Text style={[styles.viewfinderSubtitle, { color: colors.textSecondary }]}>
                Denim, knitwear, tailoring, chore jackets, or accessories. Flashy identifies the silhouette, fabric weave, and resale pricing.
              </Text>

              <View style={styles.intakeActionsRow}>
                <AppButton
                  title="Take Photo"
                  onPress={() => handleTakePhoto('Front')}
                  variant="primary"
                  size="md"
                  style={styles.intakeActionBtn}
                />
                <AppButton
                  title="Choose from Library"
                  onPress={handlePickPhoto}
                  variant="secondary"
                  size="md"
                  style={styles.intakeActionBtn}
                />
              </View>
            </View>
          )}
        </View>

        {/* Thumbnail Selector Strip if multiple photos */}
        {photos.length > 1 && (
          <View style={styles.thumbStrip}>
            {photos.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActivePhotoIndex(idx)}
                style={[
                  styles.thumbCard,
                  {
                    borderColor:
                      activePhotoIndex === idx ? colors.primary : colors.borderSubtle,
                  },
                ]}
              >
                <Image source={{ uri: p.uri }} style={styles.thumbImg} />
                <View style={[styles.thumbPill, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                  <Text style={styles.thumbPillText}>{p.label || `#${idx + 1}`}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Processing Indicator or Analyze Trigger */}
        {photos.length > 0 && (
          <View style={styles.bottomBar}>
            {isProcessing ? (
              <View
                style={[
                  styles.progressBox,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginBottom: 8 }}
                />
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {processingStage}
                </Text>
              </View>
            ) : (
              <AppButton
                title={
                  photos.length > 1
                    ? `Analyze Garment (${photos.length} views)`
                    : 'Analyze Garment'
                }
                onPress={handleStartAnalysis}
                variant="primary"
                size="lg"
                style={{ width: '100%' }}
              />
            )}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.screenPadding,
    justifyContent: 'space-between',
  },
  viewfinderCard: {
    flex: 1,
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyViewfinder: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  cameraIconCircle: {
    marginBottom: spacing.md,
  },
  viewfinderTitle: {
    fontSize: typography.sizes.base + 2,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  viewfinderSubtitle: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  intakeActionsRow: {
    width: '100%',
    gap: spacing.sm,
  },
  intakeActionBtn: {
    width: '100%',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoCountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  previewActionRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  previewActionBtn: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  previewActionBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  previewActionBtnPrimaryText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  thumbCard: {
    width: 60,
    height: 72,
    borderRadius: radii.xs,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbPill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: 'center',
  },
  thumbPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  bottomBar: {
    marginTop: spacing.sm,
  },
  progressBox: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
  },
});
