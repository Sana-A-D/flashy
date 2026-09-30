import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';

export interface UserExportData {
  exportedAt: string;
  schemaVersion: string;
  profile: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    tier: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string | null;
  };
  summary: {
    totalItems: number;
    totalStorageLocations: number;
    totalMarketplaceConnections: number;
    totalSales: number;
  };
  items: any[];
  storageLocations: any[];
  marketplaceAccounts: any[];
  ebayAccounts: any[];
}

export function useDataPrivacy() {
  const exportMutation = useMutation({
    mutationFn: async (): Promise<UserExportData> => {
      const response = await apiClient.fetch('/users/export');
      return response.data;
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (confirmation: string): Promise<any> => {
      const response = await apiClient.fetch('/users/account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation }),
      });
      return response;
    },
  });

  return {
    exportData: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error,
    exportResult: exportMutation.data,

    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeleting: deleteAccountMutation.isPending,
    deleteError: deleteAccountMutation.error,
  };
}
