import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LocalPhoto } from '../../../types/item';

const MAX_ITEM_PHOTOS = 8;

interface ItemPhotoSectionProps {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
}

export function ItemPhotoSection({ photos, onChange }: ItemPhotoSectionProps) {
  const requestCameraPermission = async () => {
    const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to take photos of your inventory items.',
        canAskAgain 
          ? [{ text: 'Cancel', style: 'cancel' }, { text: 'Try Again', onPress: requestCameraPermission }]
          : [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to select existing photos.',
        canAskAgain
          ? [{ text: 'Cancel', style: 'cancel' }, { text: 'Try Again', onPress: requestGalleryPermission }]
          : [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType?.back || 'back',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addAssets(result.assets);
      }
    } catch (error) {
      console.error('Camera error', error);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handleChooseGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_ITEM_PHOTOS - photos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addAssets(result.assets);
      }
    } catch (error) {
      console.error('Gallery error', error);
      Alert.alert('Error', 'Failed to select photos.');
    }
  };

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const newPhotos: LocalPhoto[] = assets.map((asset, index) => ({
      id: asset.assetId || asset.uri, // Use URI as fallback for ID
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type === 'video' ? 'video' : 'image',
      fileSize: asset.fileSize,
      isPrimary: photos.length === 0 && index === 0, // First photo added becomes primary
    }));

    // Filter duplicates by URI
    const uniqueNew = newPhotos.filter(np => !photos.some(p => p.uri === np.uri));
    
    let combined = [...photos, ...uniqueNew];
    if (combined.length > MAX_ITEM_PHOTOS) {
      combined = combined.slice(0, MAX_ITEM_PHOTOS);
      Alert.alert('Limit Reached', `You can add up to ${MAX_ITEM_PHOTOS} photos.`);
    }
    onChange(combined);
  };

  const handleAddPress = () => {
    handleChooseGallery();
  };

  const removePhoto = (index: number) => {
    const updated = [...photos];
    const removed = updated.splice(index, 1)[0];
    
    // If we removed the primary, make the new first item primary
    if (removed.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const makePrimary = (index: number) => {
    if (index === 0) return; // already primary
    
    const updated = photos.map((p, i) => ({
      ...p,
      isPrimary: i === index
    }));
    
    // Reorder: move new primary to the front
    const primary = updated.splice(index, 1)[0];
    updated.unshift(primary);
    
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.counter}>{photos.length} / {MAX_ITEM_PHOTOS}</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.thumbnailContainer}>
            <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
            {photo.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
            <View style={styles.actions}>
              {!photo.isPrimary && (
                <TouchableOpacity onPress={() => makePrimary(index)} style={styles.actionBtn} accessibilityLabel="Make Primary">
                  <Text style={styles.actionText}>Make Pri</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removePhoto(index)} style={[styles.actionBtn, styles.removeBtn]} accessibilityLabel="Remove Photo">
                <Text style={styles.removeText}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {photos.length < MAX_ITEM_PHOTOS && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddPress} accessibilityLabel="Add Photos">
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add Photos</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  counter: {
    fontSize: 14,
    color: '#666',
  },
  scroll: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    marginRight: 12,
    position: 'relative',
    width: 100,
    height: 100,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actions: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    marginLeft: 'auto',
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  removeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  addIcon: {
    fontSize: 24,
    color: '#0066cc',
    marginBottom: 4,
  },
  addText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
});
