import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useEbay } from '../../hooks/useEbay';

export function EbayLocationSetupModal() {
  const { connection, submitLocation, isSubmittingLocation, error } = useEbay();

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateOrProvince, setStateOrProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');

  // The modal should automatically appear when the backend requires location setup
  const isVisible = connection?.status === 'LOCATION_SETUP_REQUIRED';

  const handleLocationSubmit = () => {
    if (!addressLine1 || !city || !stateOrProvince || !postalCode || !country) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    submitLocation({ addressLine1, addressLine2, city, stateOrProvince, postalCode, country });
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {}}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Location Setup Required</Text>
            <Text style={styles.description}>
              eBay requires a physical location to list items. Please provide your business or shipping address to complete the OAuth connection.
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to submit location. Please try again.</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} placeholder="123 Main St" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput style={styles.input} value={addressLine2} onChangeText={setAddressLine2} placeholder="Apt, Suite, etc." />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="San Jose" />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>State/Province *</Text>
                <TextInput style={styles.input} value={stateOrProvince} onChangeText={setStateOrProvince} placeholder="CA" />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Postal Code *</Text>
                <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="95125" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Country Code *</Text>
              <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="US" maxLength={2} autoCapitalize="characters" />
            </View>

            <TouchableOpacity 
              style={styles.connectButton} 
              onPress={handleLocationSubmit}
              disabled={isSubmittingLocation}
            >
              {isSubmittingLocation ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonTextWhite}>Complete eBay Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
  },
  connectButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonTextWhite: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
  },
});
