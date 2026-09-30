import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export function useMarketplaceConnections() {
  return useQuery({
    queryKey: ['marketplace_connections'],
    queryFn: async () => {
      const data = await apiClient.fetch('/marketplaces/connections');
      return data;
    },
  });
}

export function useConnectMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketplace: string) => {
      const data = await apiClient.fetch(`/marketplaces/${marketplace}/auth-url`);
      const redirectUrl = Linking.createURL('marketplace/callback');
      
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success') {
        return true;
      } else {
        throw new Error('Authentication was cancelled or failed.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_connections'] });
    },
    onError: (error: any) => {
      Alert.alert('Connection Error', error.message || 'Failed to connect marketplace');
    }
  });
}

export function useDisconnectMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketplace: string) => {
      const data = await apiClient.fetch(`/marketplaces/${marketplace}/disconnect`, {
        method: 'POST'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_connections'] });
    },
    onError: (error: any) => {
      Alert.alert('Disconnect Error', error.message || 'Failed to disconnect marketplace');
    }
  });
}

export function usePublishToMarketplace(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketplace: string) => {
      const data = await apiClient.fetch(`/marketplaces/${marketplace}/items/${itemId}/publish`, {
        method: 'POST'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item_marketplaces', itemId] });
      Alert.alert('Success', 'Listing published successfully!');
    },
    onError: (error: any) => {
      const msg = error.message || 'Unknown error';
      Alert.alert('Publish Error', msg);
    }
  });
}

export interface MarketplaceItemInfo {
  id: string;
  name: string;
  type: string;
  isConnected: boolean;
  isListed: boolean;
  capabilities?: {
    connect: boolean;
    disconnect: boolean;
    createListing: boolean;
    updateListing: boolean;
    endListing: boolean;
    manualOnly: boolean;
  };
  listing: any;
}

export function useItemMarketplaces(itemId: string) {
  return useQuery({
    queryKey: ['item_marketplaces', itemId],
    queryFn: async () => {
      const data = await apiClient.fetch(`/items/${itemId}/marketplaces`);
      return data as MarketplaceItemInfo[];
    },
    enabled: !!itemId,
  });
}

export function useDelistFromMarketplace(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketplace: string) => {
      const data = await apiClient.fetch(`/marketplaces/${marketplace}/items/${itemId}/delist`, {
        method: 'POST'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item_marketplaces', itemId] });
    },
    onError: (error: any) => {
      const msg = error.message || 'Unknown error';
      Alert.alert('Delist Error', msg);
    }
  });
}

export function useDelistEverywhere(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await apiClient.fetch(`/marketplaces/items/${itemId}/delist-everywhere`, {
        method: 'POST'
      });
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item_marketplaces', itemId] });
      
      // Let's check if there were partial failures
      if (data && data.results) {
        const failedMarketplaces = Object.keys(data.results).filter(
          (key) => data.results[key].status === 'FAILED'
        );
        if (failedMarketplaces.length > 0) {
          Alert.alert('Partial Success', `Delisted from some marketplaces, but failed on: ${failedMarketplaces.join(', ')}`);
        } else {
          Alert.alert('Success', 'Item delisted from all active marketplaces.');
        }
      }
    },
    onError: (error: any) => {
      const msg = error.message || 'Unknown error';
      Alert.alert('Delist Error', msg);
    }
  });
}
