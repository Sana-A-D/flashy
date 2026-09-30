import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import {
  useStorageLocations,
  useCreateStorageLocation,
  useDeleteStorageLocation,
} from '../../hooks/useStorageLocations';
import { colors, spacing, typography, radii } from '../../constants/theme';
import {
  ScreenContainer,
  AppCard,
  AppButton,
  AppInput,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
  PrettyIcon,
} from '../../components';

export const StorageLocationsScreen = ({ navigation }: any) => {
  const { data: locations = [], isLoading, error, refetch } = useStorageLocations();
  const createMutation = useCreateStorageLocation();
  const deleteMutation = useDeleteStorageLocation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for the storage location or bin.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || err.message || 'Failed to create location');
    }
  };

  const handleDelete = (loc: any) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${loc.name}"? Items currently assigned to this bin will become unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(loc.id),
        },
      ]
    );
  };

  return (
    <ScreenContainer
      title="Storage Locations"
      subtitle="Organize physical bins, shelves, and totes"
      showBack
      onBack={() => navigation.goBack()}
    >
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <View>
            {/* Quick Add Form */}
            <AppCard variant="elevated" style={styles.formCard}>
              <Text style={styles.formTitle}>Add New Storage Location</Text>

              <AppInput
                label="Bin / Shelf Name *"
                placeholder="e.g., Bin A3, Closet Shelf 2, Tote Blue #1"
                value={name}
                onChangeText={setName}
              />

              <AppInput
                label="Description / Location notes"
                placeholder="e.g., Top shelf in garage, vintage tees"
                value={description}
                onChangeText={setDescription}
              />

              <AppButton
                title="Create Location"
                onPress={handleCreate}
                loading={createMutation.isPending}
                variant="primary"
                size="md"
              />
            </AppCard>

            <SectionHeader
              title={`Active Locations (${locations.length})`}
              style={{ marginTop: spacing.md }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <AppCard variant="flat" style={styles.locationRowCard}>
            <View style={styles.locationInfo}>
              <View style={styles.locationTitleRow}>
                <PrettyIcon name="storage" size="sm" variant="gold" containerStyle={{ marginRight: spacing.sm }} />
                <Text style={styles.locationName}>{item.name}</Text>
              </View>
              {item.description && (
                <Text style={styles.locationDesc}>{item.description}</Text>
              )}
            </View>

            <AppButton
              title="Delete"
              onPress={() => handleDelete(item)}
              variant="ghost"
              size="sm"
              textStyle={{ color: colors.error }}
            />
          </AppCard>
        )}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState message="Loading storage locations..." />
          ) : error ? (
            <ErrorState message="Could not load storage locations." onRetry={refetch} />
          ) : (
            <EmptyState
              title="No Storage Locations"
              description="Create your first storage bin or shelf above to track where items are physically stored."
            />
          )
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    marginBottom: spacing.sm,
  },
  formTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  locationRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
  },
  locationInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  binIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  locationName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  locationDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    marginLeft: 26,
  },
});
