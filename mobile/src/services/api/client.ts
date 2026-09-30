import { Storage } from '../../utils/storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve the API base URL correctly for each platform
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const debuggerHost = Constants.expoConfig?.hostUri;

function resolveApiUrl(): string {
  const isWeb = Platform.OS === 'web';
  const hasWindow = typeof window !== 'undefined' && Boolean(window.location?.hostname);
  const webHost = hasWindow ? window.location.hostname : '';
  const isWebLocalhost = webHost === 'localhost' || webHost === '127.0.0.1';
  const isWebLan = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(webHost);
  const isWebPublic = hasWindow && !isWebLocalhost && !isWebLan;

  const rawUrl = (envApiUrl || '').trim().replace(/\/+$/, '');
  const isEnvLocalOrLan =
    !rawUrl ||
    /localhost|127\.0\.0\.1|^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(rawUrl);

  const normalizeUrl = (url: string) => {
    const clean = url.replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  };

  // 1. Web on Public Domain (e.g. Vercel deployment)
  if (isWeb && isWebPublic) {
    if (rawUrl && !isEnvLocalOrLan) {
      return normalizeUrl(rawUrl);
    }
    return normalizeUrl(window.location.origin);
  }

  // 2. Web on Localhost (Browser dev on the same machine)
  if (isWeb && isWebLocalhost) {
    return 'http://localhost:3001/api/v1';
  }

  // 3. Web accessed via LAN IP from another machine/device
  if (isWeb && isWebLan) {
    return `http://${webHost}:3001/api/v1`;
  }

  // 4. Native (Expo Go / Android / iOS)
  // Production / standalone app with public backend
  if (rawUrl && !isEnvLocalOrLan) {
    return normalizeUrl(rawUrl);
  }

  // Expo Go development: automatically uses the Metro server's actual LAN IP
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3001/api/v1`;
  }

  // Explicit local development environment variable
  if (rawUrl) {
    return normalizeUrl(rawUrl);
  }

  // Android emulator default gateway
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/v1';
  }

  return 'http://localhost:3001/api/v1';
}

export const ACTUAL_API_URL = resolveApiUrl();

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

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cleanBase = ACTUAL_API_URL.replace(/\/+$/, '');
    const requestUrl = `${cleanBase}${cleanEndpoint}`;

    let response: Response;
    try {
      response = await fetch(requestUrl, {
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
