import {
  MarketplaceAdapter,
  MarketplaceCapabilities,
  MarketplaceListingInput,
  MarketplaceOperationResult,
  MarketplaceOperationStatus,
} from '../marketplace.types';

export class TestMarketplaceAdapter implements MarketplaceAdapter {
  constructor(private mockId: string = 'TEST_MARKETPLACE') {}

  getMarketplaceId(): string {
    return this.mockId;
  }

  getCapabilities(): MarketplaceCapabilities {
    return {
      connect: true,
      disconnect: true,
      createListing: true,
      updateListing: true,
      endListing: true,
      getListing: false,
      getOrders: false,
      manualOnly: false,
    };
  }

  supportsCreateListing(): boolean {
    return true;
  }

  supportsUpdateListing(): boolean {
    return true;
  }

  supportsEndListing(): boolean {
    return true;
  }

  async createListing(
    userId: string,
    accountId: string,
    input: MarketplaceListingInput
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.SUCCESS,
      externalListingId: `test-list-${Date.now()}`,
      externalListingUrl: `https://test.marketplace.com/item/test-list-${Date.now()}`,
    };
  }

  async updateListing(
    userId: string,
    accountId: string,
    externalListingId: string,
    input: Partial<MarketplaceListingInput>
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.SUCCESS,
    };
  }

  async endListing(
    userId: string,
    accountId: string,
    externalListingId: string
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.SUCCESS,
    };
  }
}
