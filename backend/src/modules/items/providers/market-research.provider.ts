export interface MarketComparable {
  title: string;
  source: string; // e.g., 'eBay Active', 'Poshmark', 'Mercari', 'Retail Reference'
  url?: string;
  price: number; // in cents
  currency: string;
  condition?: string;
  seller?: string;
  imageUrl?: string;
  timestamp: string;
  relevanceConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MarketResearchResult {
  status: 'COMPLETED' | 'FAILED' | 'NO_COMPS_FOUND';
  queryTerms: string;
  originalRetailPrice: number | null; // in cents
  resaleLow: number | null; // in cents
  resaleHigh: number | null; // in cents
  resaleMedian: number | null; // in cents
  recommendedPrice: number; // in cents
  currency: string;
  sampleSize: number;
  sources: string[];
  comparables: MarketComparable[];
  soldPriceStatus: 'AVAILABLE' | 'UNAVAILABLE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
  researchedAt: string;
}

export interface MarketResearchProvider {
  researchMarket(itemInfo: {
    title: string;
    brand?: string | null;
    category?: string | null;
    model?: string | null;
    condition?: string | null;
  }): Promise<MarketResearchResult>;
}

export class DefaultMarketResearchProvider implements MarketResearchProvider {
  async researchMarket(itemInfo: {
    title: string;
    brand?: string | null;
    category?: string | null;
    model?: string | null;
    condition?: string | null;
  }): Promise<MarketResearchResult> {
    const { title, brand, category, model, condition } = itemInfo;
    const queryTerms = [brand, model || title, category].filter(Boolean).join(' ');

    const factors: string[] = [];
    const sources: string[] = [];
    const comparables: MarketComparable[] = [];

    if (brand) factors.push(`Brand query factor: ${brand}`);
    if (category) factors.push(`Category query factor: ${category}`);
    if (model) factors.push(`Model identifier: ${model}`);
    if (condition) factors.push(`Condition constraint: ${condition}`);

    // HONEST DATA COMPLIANCE:
    // Do NOT invent baseline prices or simulated multipliers.
    // When live marketplace scraping or external completed comps APIs are not connected,
    // explicitly report that price and sold-comps data are UNAVAILABLE.
    const originalRetailPrice: number | null = null;
    const resaleLow: number | null = null;
    const resaleHigh: number | null = null;
    const resaleMedian: number | null = null;
    const recommendedPrice = 0; // 0 indicates no verified price comps available

    factors.push('Live sold & active marketplace comps currently unavailable; requires marketplace search provider.');

    return {
      status: 'NO_COMPS_FOUND',
      queryTerms: queryTerms || title,
      originalRetailPrice,
      resaleLow,
      resaleHigh,
      resaleMedian,
      recommendedPrice,
      currency: 'USD',
      sampleSize: 0,
      sources,
      comparables,
      soldPriceStatus: 'UNAVAILABLE',
      confidence: 'LOW',
      factors,
      researchedAt: new Date().toISOString(),
    };
  }
}

export const marketResearchProvider = new DefaultMarketResearchProvider();

