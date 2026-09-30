import {
  MarketplaceAdapter,
  MarketplaceCapabilities,
  MarketplaceListingInput,
  MarketplaceOperationResult,
  MarketplaceOperationStatus,
  MarketplaceErrorCategory,
} from '../marketplace.types';

export class ManualMarketplaceAdapter implements MarketplaceAdapter {
  constructor(
    private readonly marketplaceId: string,
    private readonly displayName: string
  ) {}

  getMarketplaceId(): string {
    return this.marketplaceId;
  }

  getCapabilities(): MarketplaceCapabilities {
    return {
      connect: false,
      disconnect: false,
      createListing: false,
      updateListing: false,
      endListing: false,
      getListing: false,
      getOrders: false,
      manualOnly: true,
    };
  }

  supportsCreateListing(): boolean {
    return false;
  }

  supportsUpdateListing(): boolean {
    return false;
  }

  supportsEndListing(): boolean {
    return false;
  }

  async createListing(
    _userId: string,
    _accountId: string,
    _input: MarketplaceListingInput
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.MANUAL_REQUIRED,
      requiresManualAction: true,
      error: {
        category: MarketplaceErrorCategory.UNSUPPORTED,
        message: `${this.displayName} does not support automated API listing creation. Please use manual cross-listing or copy listing details to ${this.displayName}.`,
      },
    };
  }

  async updateListing(
    _userId: string,
    _accountId: string,
    _externalListingId: string,
    _input: Partial<MarketplaceListingInput>
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.MANUAL_REQUIRED,
      requiresManualAction: true,
      error: {
        category: MarketplaceErrorCategory.UNSUPPORTED,
        message: `${this.displayName} does not support automated listing updates. Please update manually on ${this.displayName}.`,
      },
    };
  }

  async endListing(
    _userId: string,
    _accountId: string,
    _externalListingId: string
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.MANUAL_REQUIRED,
      requiresManualAction: true,
      error: {
        category: MarketplaceErrorCategory.UNSUPPORTED,
        message: `${this.displayName} does not provide a public API for automated delisting. Please delist or mark this item as sold manually on ${this.displayName}.`,
      },
    };
  }
}
