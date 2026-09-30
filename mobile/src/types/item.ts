export enum ItemStatus {
  DRAFT = 'DRAFT',
  INVENTORY = 'INVENTORY',
  LISTED = 'LISTED',
  SOLD = 'SOLD',
  ARCHIVED = 'ARCHIVED',
}

export enum ItemPreparationStatus {
  UNPREPARED = 'UNPREPARED',
  PREPARED = 'PREPARED',
  READY_TO_LIST = 'READY_TO_LIST',
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  brand: string | null;
  category: string | null;
  condition: string | null;
  color: string | null;
  size: string | null;
  sku: string | null;
  purchasePrice: number | null; // Cents
  purchaseDate: string | null;
  description: string | null;
  status: ItemStatus;
  preparationStatus?: ItemPreparationStatus | 'UNPREPARED' | 'PREPARED' | 'READY_TO_LIST';
  preparedAt?: string | null;
  readyToListAt?: string | null;
  storageLocationId: string | null;
  storageLocation?: { id: string; name: string } | null;
  listings?: Array<{
    id: string;
    marketplaceId: string;
    status: string;
    marketplace?: { id: string; name: string };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LocalPhoto {
  id: string;
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  fileSize?: number;
  mimeType?: string;
  fileName?: string;
  isPrimary: boolean;
}

export type ImageProcessingStatus = 'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ItemImageVariant {
  id: string;
  itemImageId: string;
  type: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  url?: string;
}

export interface ItemImage {
  id: string;
  itemId: string;
  storageKey: string;
  originalFilename?: string | null;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  sortOrder: number;
  isPrimary: boolean;
  processingStatus: ImageProcessingStatus;
  createdAt: string;
  updatedAt: string;
  url?: string; // Hydrated with presigned URL
  variants?: ItemImageVariant[];
}
