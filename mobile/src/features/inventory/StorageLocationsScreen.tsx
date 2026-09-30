import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStorageLocations, useCreateStorageLocation, useDeleteStorageLocation } from '../../hooks/useStorageLocations';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { ScreenContainer, AppButton, PrettyIcon } from '../../components';

export function StorageLocationsScreen() {
  const navigation = useNavigation<any>();
  const { data: locations = [], isLoading } = useStorageLocations();
  const { mutateAsync: createLocation, isPending: isCreating } = useCreateStorageLocation();
  const { mutateAsync: deleteLocation, isPending: isDeleting } = useDeleteStorageLocation();

  const [newLocationName, setNewLocationName] = useState('');

  const handleCreate = async () => {
    if (!newLocationName.trim()) return;
    try {
      await createLocation({ name: newLocationName.trim() });
      setNewLocationName('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create location');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Location', `Are you sure you want to delete "${name}"? Items in this location will no longer have a storage location assigned.`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLocation(id);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete location');
          }
        }
      }
    ]);
  };

  return (
    <ScreenContainer
      title="Storage Bins & Shelves"
      subtitle="Physical inventory organization"
      showBack
      onBack={() => navigation.goBack()}
    >
      <View style={styles.createSection}>
        <TextInput
          style={styles.input}
          placeholder="New storage bin (e.g. Bin A1, Shelf 3)"
          placeholderTextColor={colors.textMuted}
          value={newLocationName}
          onChangeText={setNewLocationName}
        />
        <AppButton
          title={isCreating ? "Adding..." : "Add"}
          onPress={handleCreate}
          disabled={!newLocationName.trim() || isCreating}
          loading={isCreating}
          variant="primary"
          size="md"
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PrettyIcon name="storage" size="md" variant="neutral" containerStyle={{ marginBottom: spacing.xs }} />
              <Text style={styles.emptyText}>No storage bins or shelves added yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.locationRow}>
              <View style={styles.locationLeft}>
                <PrettyIcon name="storage" size="xs" variant="neutral" containerStyle={{ marginRight: spacing.sm }} />
                <Text style={styles.locationName}>{item.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                disabled={isDeleting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  createSection: {
    flexDirection: 'row',
    padding: spacing.screenPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  list: {
    padding: spacing.screenPadding,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  deleteText: {
    color: colors.error,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.xs,
  },
});
