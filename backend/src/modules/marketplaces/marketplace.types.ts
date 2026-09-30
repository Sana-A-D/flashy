export enum MarketplaceId {
  EBAY = 'EBAY',
  POSHMARK = 'POSHMARK',
  DEPOP = 'DEPOP',
  MERCARI = 'MERCARI',
  FACEBOOK = 'FACEBOOK',
  OFFERUP = 'OFFERUP',
  VINTED = 'VINTED',
}

export enum MarketplaceOperationStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  MANUAL_REQUIRED = 'MANUAL_REQUIRED',
}

export interface MarketplaceListingInput {
  title: string;
  description: string;
  price: number;
  condition?: string;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  imageUrls: string[];
}

export interface MarketplaceCapabilities {
  connect: boolean;
  disconnect: boolean;
  createListing: boolean;
  updateListing: boolean;
  endListing: boolean;
  getListing: boolean;
  getOrders: boolean;
  manualOnly: boolean;
}

export interface MarketplaceOperationResult {
  status: MarketplaceOperationStatus;
  externalListingId?: string;
  externalListingUrl?: string;
  externalOfferId?: string;
  sku?: string;
  error?: MarketplaceError;
  requiresManualAction?: boolean;
}

export enum MarketplaceErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  UNSUPPORTED = 'UNSUPPORTED',
  NOT_FOUND = 'NOT_FOUND',
  PROVIDER = 'PROVIDER',
  UNKNOWN = 'UNKNOWN',
}

export interface MarketplaceError {
  category: MarketplaceErrorCategory;
  message: string;
  providerCode?: string;
  details?: any;
}

export interface MarketplaceAdapter {
  getMarketplaceId(): string;
  getCapabilities(): MarketplaceCapabilities;
  supportsCreateListing(): boolean;
  supportsUpdateListing(): boolean;
  supportsEndListing(): boolean;
  
  createListing(
    userId: string,
    accountId: string,
    input: MarketplaceListingInput
  ): Promise<MarketplaceOperationResult>;
  
  updateListing(
    userId: string,
    accountId: string,
    externalListingId: string,
    input: Partial<MarketplaceListingInput>
  ): Promise<MarketplaceOperationResult>;
  
  endListing(
    userId: string,
    accountId: string,
    externalListingId: string
  ): Promise<MarketplaceOperationResult>;
}

