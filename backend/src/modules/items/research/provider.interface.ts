export interface ExternalProductResult {
  id: string;
  title: string;
  brand?: string | null;
  category?: string | null;
  price?: number | null; // In dollars/units e.g. 48.00
  currency: string;      // e.g. 'USD'
  shippingPrice?: number | null;
  totalPrice?: number | null;
  marketplaceItemId?: string | null;
  condition?: string | null;
  imageUrl?: string | null;
  productUrl: string;    // Direct link to the retailer or marketplace listing
  retailer?: string | null;
  source: string;        // Identifier e.g. 'EBAY_ACTIVE', 'GOOGLE_SHOPPING', 'PARTNER_FEED'
  sourceName: string;    // Human-friendly e.g. 'eBay Marketplace', 'Nordstrom'
  retrievedAt: string;
  isSoldPrice?: boolean; // True ONLY if verified completed sale, otherwise false
  matchType?: 'EXACT_MATCH' | 'CLOSE_MATCH' | 'STYLE_MATCH';
}

export interface ExternalTrendResult {
  signalType: 'SEARCH_INTEREST' | 'LISTING_VOLUME' | 'EDITORIAL_MENTIONS' | 'MARKETPLACE_ACTIVITY';
  signal: string;
  direction: 'RISING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
  evidence?: string | null;
  sourcesCount: number;
  retrievedAt: string;
  timePeriod?: string | null;
}

export interface FashionResearchProvider {
  readonly name: string;
  readonly providerId: string;
  readonly supportsProductSearch: boolean;
  readonly supportsPriceComps: boolean;
  readonly supportsTrendSignals: boolean;

  searchProducts(query: string, options?: { limit?: number; category?: string }): Promise<ExternalProductResult[]>;

  searchMarketComps(query: string, options?: { brand?: string; category?: string }): Promise<ExternalProductResult[]>;

  getTrendSignals?(query: string): Promise<ExternalTrendResult[]>;
}
