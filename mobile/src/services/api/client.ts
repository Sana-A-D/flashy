import { Storage } from '../../utils/storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically resolve the host IP address where the Expo bundler or device is running
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const debuggerHost = Constants.expoConfig?.hostUri;
let defaultHost = 'localhost';
if (Platform.OS === 'android' && !debuggerHost) {
  defaultHost = '10.0.2.2';
}
let webHost = 'localhost';
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
  webHost = window.location.hostname;
}
const localhost = Platform.OS === 'web' ? webHost : (debuggerHost?.split(':')[0] || defaultHost);

// Port 3001 is the insecure HTTP port started by backend for mobile/LAN/web access
export const ACTUAL_API_URL = Platform.OS === 'web'
  ? `http://${webHost}:3001/api/v1`
  : debuggerHost?.split(':')[0]
  ? `http://${debuggerHost.split(':')[0]}:3001/api/v1`
  : envApiUrl
  ? envApiUrl.replace(':3000', ':3001')
  : `http://${localhost}:3001/api/v1`;



export const apiClient = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const accessToken = await Storage.getItemAsync('accessToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!options.body) {
      delete headers['Content-Type'];
    }

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(`${ACTUAL_API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (netErr: any) {
      console.error(`[API Network Error] ${options.method || 'GET'} ${ACTUAL_API_URL}${endpoint}:`, netErr);
      const hostMsg = ACTUAL_API_URL.includes('localhost')
        ? 'Cannot reach localhost from mobile/browser. Make sure the backend server is running and accessible.'
        : `Cannot connect to server at ${ACTUAL_API_URL}. Check your network connection.`;
      const err = new Error(netErr.message === 'Failed to fetch' ? `Network error: ${hostMsg}` : (netErr.message || 'Network connection failed')) as any;
      err.status = 0;
      throw err;
    }

    if (response.status === 401 && accessToken) {
      // Try to refresh token
      const refreshToken = await Storage.getItemAsync('refreshToken');
      if (refreshToken) {
        const refreshResponse = await fetch(`${ACTUAL_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const { data } = await refreshResponse.json();
          await Storage.setItemAsync('accessToken', data.accessToken);
          await Storage.setItemAsync('refreshToken', data.refreshToken);
          
          // Retry original request
          headers.Authorization = `Bearer ${data.accessToken}`;
          response = await fetch(`${ACTUAL_API_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed, clear tokens
          await Storage.deleteItemAsync('accessToken');
          await Storage.deleteItemAsync('refreshToken');
        }
      }
    }

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage =
        (typeof json?.error === 'string' ? json.error : null) ||
        json?.error?.message ||
        json?.message ||
        (Array.isArray(json?.details) ? json.details.map((d: any) => d.message).join(', ') : null) ||
        `Request failed with status ${response.status}`;

      const err = new Error(errorMessage) as any;
      err.status = response.status;
      if (json) {
        Object.assign(err, json);
      }
      throw err;
    }

    return json;
  }
};
