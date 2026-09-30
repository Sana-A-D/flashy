import { create } from 'zustand';
import { Storage } from '../../../utils/storage';
import { apiClient } from '../../../services/api/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role?: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  initialize: () => Promise<void>;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrating: true,

  initialize: async () => {
    try {
      const token = await Storage.getItemAsync('accessToken');
      if (token) {
        const response = await apiClient.fetch('/auth/me');
        set({ user: response.data.user, isAuthenticated: true });
      }
    } catch (error) {
      // Invalid token or failed to fetch
      await Storage.deleteItemAsync('accessToken');
      await Storage.deleteItemAsync('refreshToken');
    } finally {
      set({ isHydrating: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      await Storage.setItemAsync('accessToken', response.data.accessToken);
      await Storage.setItemAsync('refreshToken', response.data.refreshToken);

      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.fetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      await Storage.setItemAsync('accessToken', response.data.accessToken);
      await Storage.setItemAsync('refreshToken', response.data.refreshToken);

      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await Storage.getItemAsync('refreshToken');
      if (refreshToken) {
        await apiClient.fetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      await Storage.deleteItemAsync('accessToken');
      await Storage.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  }
}));
