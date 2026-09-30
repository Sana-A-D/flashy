import { MarketplaceAdapter, MarketplaceCapabilities, MarketplaceErrorCategory } from './marketplace.types';

export class MarketplaceRegistry {
  private adapters: Map<string, MarketplaceAdapter> = new Map();

  register(adapter: MarketplaceAdapter): void {
    this.adapters.set(adapter.getMarketplaceId().toUpperCase(), adapter);
  }

  hasAdapter(marketplaceId: string): boolean {
    return this.adapters.has(marketplaceId.toUpperCase());
  }

  getAdapter(marketplaceId: string): MarketplaceAdapter {
    const adapter = this.adapters.get(marketplaceId.toUpperCase());
    if (!adapter) {
      throw {
        category: MarketplaceErrorCategory.UNSUPPORTED,
        message: `Marketplace adapter for ${marketplaceId} is not supported.`,
      };
    }
    return adapter;
  }

  getCapabilities(marketplaceId: string): MarketplaceCapabilities {
    const adapter = this.adapters.get(marketplaceId.toUpperCase());
    if (!adapter) {
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
    return adapter.getCapabilities();
  }

  getSupportedMarketplaces(): string[] {
    return Array.from(this.adapters.keys());
  }
}

