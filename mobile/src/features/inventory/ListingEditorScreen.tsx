import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useListingGeneration, useUpdateListingDraft } from '../../hooks/useListingGeneration';
import { usePricingResearch } from '../../hooks/usePricing';
import { currencyToCents, centsToCurrency } from '../../utils/currency';
import { useMarketplaceConnections, useConnectMarketplace, usePublishToMarketplace, useItemMarketplaces, useDelistFromMarketplace, useDelistEverywhere } from '../../hooks/useMarketplaces';
import { useItem } from '../../hooks/useItems';

export function ListingEditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id || route.params?.itemId;

  const { data: itemData } = useItem(id);
  const item = itemData?.data || itemData;
  const { draft, isLoading, isGenerating, startGeneration } = useListingGeneration(id);
  const { mutateAsync: updateDraft, isPending: isUpdating } = useUpdateListingDraft(id);
  
  const { research, isResearching, startResearch } = usePricingResearch(id);

  const { data: connections = [] } = useMarketplaceConnections();
  const { data: itemMarketplaces = [], refetch: refetchItemMarketplaces } = useItemMarketplaces(id);
  const { mutateAsync: connectMarketplace, isPending: isConnecting } = useConnectMarketplace();
  const { mutateAsync: publishToMarketplace, isPending: isPublishing } = usePublishToMarketplace(id);
  const { mutateAsync: delistFromMarketplace, isPending: isDelisting } = useDelistFromMarketplace(id);
  const { mutateAsync: delistEverywhere, isPending: isDelistingEverywhere } = useDelistEverywhere(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    condition: '',
    size: '',
    color: '',
    keywords: '',
    price: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (draft && draft.status === 'COMPLETED') {
      setForm({
        title: draft.title || '',
        description: draft.description || '',
        category: draft.category || '',
        brand: draft.brand || '',
        condition: draft.condition || '',
        size: draft.size || '',
        color: draft.color || '',
        keywords: draft.keywords ? draft.keywords.join(', ') : '',
        price: draft.price ? centsToCurrency(draft.price) : '',
      });
    } else if (item && !draft) {
      setForm((prev) => ({
        ...prev,
        title: prev.title || item.title || '',
        description: prev.description || item.description || '',
        category: prev.category || item.category || '',
        brand: prev.brand || item.brand || '',
        condition: prev.condition || item.condition || '',
        size: prev.size || item.size || '',
        color: prev.color || item.color || '',
        price: prev.price || (item.marketPrice ? centsToCurrency(item.marketPrice) : ''),
      }));
    }
  }, [draft, item]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');

    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      brand: form.brand || null,
      condition: form.condition || null,
      size: form.size || null,
      color: form.color || null,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      price: form.price ? currencyToCents(form.price) : null,
    };

    try {
      await updateDraft(payload);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to save draft');
    }
  };

  const handleRegenerate = () => {
    Alert.alert('Regenerate listing?', 'Your current listing edits will be replaced by a new AI draft.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Regenerate', 
        style: 'destructive', 
        onPress: () => {
          startGeneration();
        }
      }
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </SafeAreaView>
    );
  }

  const isPending = isUpdating || isGenerating;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listing Draft</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} style={[styles.saveButton, isPending && styles.disabled]}>
          <Text style={styles.saveText}>{isUpdating ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.form}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        {isGenerating && (
           <View style={styles.aiLoading}>
              <ActivityIndicator color="#10b981" />
              <Text style={styles.aiLoadingText}>Writing listing...</Text>
           </View>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput 
          style={styles.input} 
          value={form.title} 
          onChangeText={(t) => setForm({ ...form, title: t })} 
          placeholder="Listing title" 
        />

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={form.description} 
          onChangeText={(t) => setForm({ ...form, description: t })} 
          placeholder="Detailed description..." 
          multiline 
        />

        <Text style={styles.label}>Brand</Text>
        <TextInput 
          style={styles.input} 
          value={form.brand} 
          onChangeText={(t) => setForm({ ...form, brand: t })} 
          placeholder="Brand" 
        />

        <Text style={styles.label}>Category</Text>
        <TextInput 
          style={styles.input} 
          value={form.category} 
          onChangeText={(t) => setForm({ ...form, category: t })} 
          placeholder="Category" 
        />
        
        <Text style={styles.label}>Condition</Text>
        <TextInput 
          style={styles.input} 
          value={form.condition} 
          onChangeText={(t) => setForm({ ...form, condition: t })} 
          placeholder="Condition" 
        />

        <View style={styles.rowLayout}>
            <View style={styles.halfWidth}>
                <Text style={styles.label}>Size</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.size} 
                  onChangeText={(t) => setForm({ ...form, size: t })} 
                  placeholder="Size" 
                />
            </View>
            <View style={styles.halfWidth}>
                <Text style={styles.label}>Color</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.color} 
                  onChangeText={(t) => setForm({ ...form, color: t })} 
                  placeholder="Color" 
                />
            </View>
        </View>

        <Text style={styles.label}>Keywords (comma separated)</Text>
        <TextInput 
          style={styles.input} 
          value={form.keywords} 
          onChangeText={(t) => setForm({ ...form, keywords: t })} 
          placeholder="vintage, y2k, rare..." 
        />

        <TouchableOpacity 
          style={styles.regenerateButton} 
          onPress={handleRegenerate}
          disabled={isPending}
        >
          <Text style={styles.regenerateButtonText}>Regenerate with AI</Text>
        </TouchableOpacity>

        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Pricing & Market Research</Text>
          
          <Text style={styles.label}>Listing Price ($)</Text>
          <TextInput 
            style={styles.input} 
            value={form.price} 
            onChangeText={(t) => setForm({ ...form, price: t })} 
            placeholder="0.00" 
            keyboardType="numeric"
          />

          {!research && !isResearching && (
            <TouchableOpacity style={styles.researchButton} onPress={() => startResearch()}>
              <Text style={styles.researchButtonText}>Get Pricing Suggestion</Text>
            </TouchableOpacity>
          )}

          {isResearching && (
            <View style={styles.aiLoading}>
              <ActivityIndicator color="#0066cc" />
              <Text style={styles.aiLoadingText}>Researching market...</Text>
            </View>
          )}

          {research && research.status === 'COMPLETED' && (
            <View style={styles.researchCard}>
              <Text style={styles.researchTitle}>
                {research.source === 'ESTIMATE' ? 'Estimated Resale Value' : 'Market Price Research'}
              </Text>
              
              <Text style={styles.recommendedPrice}>
                ${centsToCurrency(research.recommendedPrice)}
              </Text>
              
              {(research.lowPrice !== null && research.highPrice !== null) && (
                <Text style={styles.priceRange}>
                  Observed Range: ${centsToCurrency(research.lowPrice)} – ${centsToCurrency(research.highPrice)}
                </Text>
              )}

              {research.originalRetailPrice && (
                <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  Original Retail Reference: ~${centsToCurrency(research.originalRetailPrice)}
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <Text style={styles.confidence}>Confidence: {research.confidence}</Text>
                {research.soldPriceStatus && (
                  <Text style={{ fontSize: 11, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    {research.soldPriceStatus === 'AVAILABLE' ? '✓ Sold-price verified' : 'Sold-price data unavailable'}
                  </Text>
                )}
              </View>
              
              {research.factors && research.factors.length > 0 && (
                <View style={styles.factorsContainer}>
                  <Text style={styles.factorsTitle}>Evidence & Analysis:</Text>
                  {research.factors.map((f, i) => (
                    <Text key={i} style={styles.factorText}>• {f}</Text>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setForm({ ...form, price: centsToCurrency(research.recommendedPrice) })}
              >
                <Text style={styles.applyButtonText}>Apply Suggestion</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reResearchButton} onPress={() => startResearch()}>
                <Text style={styles.reResearchText}>Refresh Research</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.marketplaceSection}>
          <Text style={styles.sectionTitle}>Marketplaces</Text>
          
          {item && item.preparationStatus !== 'READY_TO_LIST' && (
            <View style={styles.readinessWarningBanner}>
              <Text style={styles.readinessWarningIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.readinessWarningTitle}>Item Not Marked Ready to List</Text>
                <Text style={styles.readinessWarningText}>
                  Current status: {item.preparationStatus === 'PREPARED' ? 'Prepared (Needs Final Readiness Check)' : 'Unprepared'}. You can still publish, but make sure the item is inspected.
                </Text>
              </View>
            </View>
          )}

          {itemMarketplaces.length > 0 ? (
            itemMarketplaces.map((mp: any) => {
              const isManualOnly = mp.capabilities?.manualOnly || ['POSHMARK', 'MERCARI', 'DEPOP', 'FACEBOOK', 'OFFERUP'].includes(mp.type);

              return (
                <View key={mp.id} style={styles.marketplaceCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.marketplaceName}>{mp.name}</Text>
                    {isManualOnly && (
                      <Text style={{ fontSize: 12, color: '#4338ca', backgroundColor: '#e0e7ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }}>
                        Manual Channel
                      </Text>
                    )}
                  </View>
                  
                  {isManualOnly ? (
                    <View>
                      <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                        No direct seller API. Copy listing details or mark as listed manually once posted.
                      </Text>
                      <TouchableOpacity
                        style={[styles.publishButton, { backgroundColor: '#475569' }]}
                        onPress={() => {
                          Alert.alert(
                            `${mp.name} Manual Listing`,
                            `Use the title, description, and price above to create your listing on ${mp.name}. Direct API posting is not provided by ${mp.name}.`
                          );
                        }}
                      >
                        <Text style={styles.publishButtonText}>View Details for {mp.name}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : mp.isConnected ? (
                    <View>
                      <Text style={styles.connectedText}>✓ Account Connected</Text>
                      {mp.isListed && mp.listing ? (
                        <View style={styles.listingStatusContainer}>
                          <Text style={styles.listingStatusLabel}>Status:</Text>
                          <Text style={styles.listingStatusValue}>{mp.listing.status}</Text>
                          {mp.listing.externalListingId && (
                             <Text style={styles.listingExtId}>ID: {mp.listing.externalListingId}</Text>
                          )}
                          {mp.listing.status === 'ACTIVE' && (
                            <TouchableOpacity 
                              style={[styles.delistButton, isDelisting && styles.disabled]}
                              onPress={() => {
                                Alert.alert('Delist Item', `Are you sure you want to delist this item from ${mp.name}?`, [
                                  { text: 'Cancel', style: 'cancel' },
                                  { 
                                    text: 'Delist', 
                                    style: 'destructive',
                                    onPress: async () => {
                                      await delistFromMarketplace(mp.type.toLowerCase());
                                      refetchItemMarketplaces();
                                    }
                                  }
                                ]);
                              }}
                              disabled={isDelisting || isPublishing || isUpdating}
                            >
                              <Text style={styles.delistButtonText}>
                                {isDelisting ? 'Delisting...' : `Delist from ${mp.name}`}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={[styles.publishButton, isPublishing && styles.disabled]} 
                          onPress={() => {
                            if (item && item.preparationStatus !== 'READY_TO_LIST') {
                              Alert.alert(
                                'Item Not Ready to List',
                                'This item has not been marked as "Ready to List". Do you want to proceed with publishing anyway?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Publish Anyway',
                                    onPress: async () => {
                                      await publishToMarketplace(mp.type.toLowerCase());
                                      refetchItemMarketplaces();
                                    },
                                  },
                                ]
                              );
                            } else {
                              publishToMarketplace(mp.type.toLowerCase()).then(() => refetchItemMarketplaces());
                            }
                          }}
                          disabled={isPublishing || isUpdating}
                        >
                          <Text style={styles.publishButtonText}>
                            {isPublishing ? 'Publishing...' : `Publish to ${mp.name}`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.connectButton, isConnecting && styles.disabled]} 
                      onPress={() => connectMarketplace(mp.type.toLowerCase())}
                      disabled={isConnecting}
                    >
                      <Text style={styles.connectButtonText}>
                        {isConnecting ? 'Connecting...' : `Connect ${mp.name}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={{color: '#666'}}>No marketplaces available.</Text>
          )}

          {itemMarketplaces.some((mp: any) => mp.isListed && mp.listing?.status === 'ACTIVE') && (
            <TouchableOpacity 
              style={[styles.delistEverywhereButton, isDelistingEverywhere && styles.disabled]}
              onPress={() => {
                Alert.alert('Delist Everywhere', 'Are you sure you want to delist this item from all active marketplaces?', [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delist Everywhere', 
                    style: 'destructive',
                    onPress: async () => {
                      await delistEverywhere();
                      refetchItemMarketplaces();
                    }
                  }
                ]);
              }}
              disabled={isDelistingEverywhere || isPublishing || isUpdating}
            >
              <Text style={styles.delistEverywhereButtonText}>
                {isDelistingEverywhere ? 'Delisting...' : 'Delist Everywhere'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F8F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2DB',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1917', letterSpacing: -0.2 },
  backButton: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { color: '#57534E', fontSize: 14, fontWeight: '600' },
  saveButton: { paddingVertical: 7, paddingHorizontal: 14, backgroundColor: '#C85A32', borderRadius: 6 },
  disabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  form: { padding: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#57534E', marginBottom: 5, marginTop: 12, letterSpacing: 0.2 },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7E2DB',
    fontSize: 15,
    color: '#1C1917',
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  errorText: { color: '#B91C1C', marginBottom: 12, fontSize: 13, fontWeight: '600' },
  rowLayout: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  regenerateButton: { 
      marginTop: 20, 
      backgroundColor: '#FAEDE8', 
      paddingVertical: 12, 
      borderRadius: 8, 
      alignItems: 'center' 
  },
  regenerateButtonText: { color: '#A84520', fontWeight: '700', fontSize: 14 },
  aiLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#EAF5EE', borderRadius: 8, marginBottom: 12 },
  aiLoadingText: { marginLeft: 8, color: '#2B7A4B', fontWeight: '600', fontSize: 13 },
  pricingSection: { marginTop: 24, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#E7E2DB', paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 12, letterSpacing: -0.1 },
  researchButton: { marginTop: 12, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E7E2DB' },
  researchButtonText: { color: '#1C1917', fontWeight: '600', fontSize: 14 },
  researchCard: { marginTop: 14, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E7E2DB' },
  researchTitle: { fontSize: 11, color: '#C85A32', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  recommendedPrice: { fontSize: 28, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  priceRange: { fontSize: 13, color: '#57534E', marginBottom: 4 },
  confidence: { fontSize: 12, color: '#8C857E', fontWeight: '600', marginBottom: 10 },
  factorsContainer: { marginTop: 6, marginBottom: 14, padding: 10, backgroundColor: '#F2EFEB', borderRadius: 6 },
  factorsTitle: { fontSize: 12, fontWeight: '700', color: '#1C1917', marginBottom: 4 },
  factorText: { fontSize: 12, color: '#57534E', marginBottom: 2 },
  applyButton: { backgroundColor: '#C85A32', paddingVertical: 11, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  reResearchButton: { padding: 8, alignItems: 'center', marginTop: 4 },
  reResearchText: { color: '#C85A32', fontSize: 12, fontWeight: '600' },
  marketplaceSection: { marginTop: 24, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#E7E2DB', paddingTop: 20 },
  marketplaceCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E7E2DB', marginTop: 8 },
  marketplaceName: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 8 },
  connectButton: { backgroundColor: '#F2EFEB', paddingVertical: 11, borderRadius: 6, alignItems: 'center' },
  connectButtonText: { color: '#1C1917', fontWeight: '600', fontSize: 13 },
  connectedText: { color: '#2B7A4B', fontWeight: '700', marginBottom: 8, fontSize: 13 },
  publishButton: { backgroundColor: '#C85A32', paddingVertical: 11, borderRadius: 6, alignItems: 'center' },
  publishButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  listingStatusContainer: { marginTop: 8, padding: 12, backgroundColor: '#FAF8F5', borderRadius: 6, borderWidth: 1, borderColor: '#E7E2DB' },
  listingStatusLabel: { fontSize: 11, color: '#8C857E', fontWeight: '700' },
  listingStatusValue: { fontSize: 14, color: '#1C1917', fontWeight: '700', marginBottom: 2 },
  listingExtId: { fontSize: 11, color: '#57534E' },
  delistButton: { backgroundColor: '#B91C1C', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  delistButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  delistEverywhereButton: { backgroundColor: '#B91C1C', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  delistEverywhereButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  readinessWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#B4530940',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  readinessWarningIcon: { fontSize: 18 },
  readinessWarningTitle: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  readinessWarningText: { fontSize: 12, color: '#57534E', marginTop: 2, lineHeight: 16 },
  bottomSpacer: { height: 40 },
});
