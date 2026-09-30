import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiClient } from '../services/api/client';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface EbayConnectionStatus {
  connected: boolean;
  environment?: string;
  marketplaceId?: string;
  merchantLocationKey?: string;
  fulfillmentPolicyId?: string;
  paymentPolicyId?: string;
  returnPolicyId?: string;
  status?: string;
}

export function useEbay() {
  const queryClient = useQueryClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Deep linking listener for the redirect
  useEffect(() => {
    const handleUrl = (event: Linking.EventType) => {
      if (event.url && event.url.includes('ebay-oauth-result')) {
        WebBrowser.dismissBrowser();
        setIsAuthenticating(false);
        queryClient.invalidateQueries({ queryKey: ['ebay-connection'] });
      }
    };
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [queryClient]);

  const connectionQuery = useQuery({
    queryKey: ['ebay-connection'],
    queryFn: async () => {
      const data = await apiClient.fetch('/ebay/connection');
      return data.data as EbayConnectionStatus;
    }
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsAuthenticating(true);
      
      const redirectUrl = Platform.OS === 'web'
        ? 'http://localhost:8081/ebay-oauth-result'
        : Linking.createURL('ebay-oauth-result');
      const data = await apiClient.fetch(`/ebay/oauth/start?returnUrl=${encodeURIComponent(redirectUrl)}`);
      
      if (Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'cancel') {
          setIsAuthenticating(false);
        } else if (result.type === 'success') {
          setIsAuthenticating(false);
          queryClient.invalidateQueries({ queryKey: ['ebay-connection'] });
        }
      } else {
        window.open(data.url, '_blank');
        setIsAuthenticating(false);
      }
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      console.log('Initiating POST request to /ebay/disconnect...');
      const response = await apiClient.fetch('/ebay/disconnect', { 
        method: 'POST',
        body: JSON.stringify({})
      });
      console.log('Disconnect request successful:', response);
      return response;
    },
    onSuccess: () => {
      console.log('Disconnect mutation onSuccess, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['ebay-connection'] });
    },
    onError: (err) => {
      console.error('Disconnect mutation failed:', err);
    }
  });

  const submitLocationMutation = useMutation({
    mutationFn: async (locationData: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      stateOrProvince: string;
      postalCode: string;
      country: string;
    }) => {
      return await apiClient.fetch('/ebay/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ebay-connection'] });
    }
  });

  return {
    connection: connectionQuery.data,
    isLoading: connectionQuery.isLoading,
    isAuthenticating,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    disconnectError: disconnectMutation.error,
    isDisconnecting: disconnectMutation.isPending,
    submitLocation: submitLocationMutation.mutate,
    isSubmittingLocation: submitLocationMutation.isPending,
    error: connectionQuery.error || connectMutation.error || submitLocationMutation.error,
  };
}
