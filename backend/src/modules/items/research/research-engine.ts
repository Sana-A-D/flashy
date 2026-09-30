import { ExternalProductResult, FashionResearchProvider } from './provider.interface';
import { ebayMarketplaceResearchProvider } from './ebay-research.provider';
import { webMarketplaceResearchProvider } from './web-search.provider';
import { geminiMarketplaceResearchProvider } from './gemini-search.provider';
import { ResearchQueryBuilder } from './query-builder';
import { ProductDeduplicator } from './product-deduplicator';
import { PriceAnalyzer } from './price-analyzer';
import { SimilarItemEngine } from './similar-engine';
import { ProductGrouper, MatchedProductGroup } from './product-grouper';
import { PriceIntelligence, SimilarItem, TrendSignal } from '../fashion.schema';

export interface FashionResearchExecutionResult {
  queries: {
    primaryQuery: string;
    specificQuery: string;
    broadQuery: string;
  };
  matchedProducts: MatchedProductGroup[];
  pricing: PriceIntelligence;
  similarItems: SimilarItem[];
  cheaperAlternatives: SimilarItem[];
  trendSignals: {
    status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
    message: string;
    signals: TrendSignal[];
  };
  sources: Array<{ name: string; type: string; count: number }>;
  researchedAt: string;
}

export class FashionResearchEngine {
  private providers: FashionResearchProvider[] = [];

  constructor() {
    // Register available real providers:
    // 1. Gemini Live Marketplace Intelligence (queries real market comps, diverse stores & sellers)
    this.registerProvider(geminiMarketplaceResearchProvider);
    // 2. Web Marketplace provider (real live online web search)
    this.registerProvider(webMarketplaceResearchProvider);
    // 3. Direct eBay Marketplace OAuth provider
    this.registerProvider(ebayMarketplaceResearchProvider);
  }

  registerProvider(provider: FashionResearchProvider) {
    this.providers.push(provider);
  }

  async performResearch(itemInfo: {
    title?: string | null;
    brand?: string | null;
    category?: string | null;
    garmentType?: string | null;
    color?: string | null;
    secondaryColors?: string[];
    pattern?: string | null;
    material?: string | null;
    fit?: string | null;
    style?: string | null;
    era?: string | null;
    productCode?: string | null;
    styleCode?: string | null;
    modelNumber?: string | null;
    distinctiveGraphics?: string[];
  }): Promise<FashionResearchExecutionResult> {
    // 1. Build queries
    const queries = ResearchQueryBuilder.buildQueries(itemInfo);

    // 2. Query registered providers in parallel with error isolation
    const rawResults: ExternalProductResult[] = [];
    const sourceMap = new Map<string, { name: string; type: string; count: number }>();

    const searchPromises = this.providers.map(async (provider) => {
      try {
        if (provider.supportsProductSearch) {
          const searchOpts: {
            limit: number;
            category?: string;
            brand?: string;
            queryVariations?: string[];
          } = {
            limit: 15,
            queryVariations: queries.queryVariations,
          };
          if (itemInfo.category) searchOpts.category = itemInfo.category;
          if (itemInfo.brand) searchOpts.brand = itemInfo.brand;

          const items = await provider.searchProducts(queries.primaryQuery, searchOpts);

          if (items.length > 0) {
            rawResults.push(...items);
            const existing = sourceMap.get(provider.providerId);
            if (existing) {
              existing.count += items.length;
            } else {
              sourceMap.set(provider.providerId, {
                name: provider.name,
                type: 'MARKETPLACE',
                count: items.length,
              });
            }
          }
        }
      } catch (providerError) {
        console.warn(`[FashionResearchEngine] Provider ${provider.name} failed:`, providerError);
        // Error isolation: do not fail entire research job if one provider fails
      }
    });

    await Promise.allSettled(searchPromises);

    // 3. Deduplicate retrieved products
    const uniqueProducts = ProductDeduplicator.deduplicate(rawResults);

    // 4. Run deterministic price analysis
    const pricing = PriceAnalyzer.analyze(uniqueProducts);

    // 5. Run similar product ranking and alternative classification
    const baselinePrice = pricing.unbranded?.median || pricing.resale?.median || null;
    const similarTarget: {
      category?: string | null;
      brand?: string | null;
      color?: string | null;
      pattern?: string | null;
      material?: string | null;
      fit?: string | null;
    } = {};
    if (itemInfo.category !== undefined) similarTarget.category = itemInfo.category;
    if (itemInfo.brand !== undefined) similarTarget.brand = itemInfo.brand;
    if (itemInfo.color !== undefined) similarTarget.color = itemInfo.color;
    if (itemInfo.pattern !== undefined) similarTarget.pattern = itemInfo.pattern;
    if (itemInfo.material !== undefined) similarTarget.material = itemInfo.material;
    if (itemInfo.fit !== undefined) similarTarget.fit = itemInfo.fit;

    const similarItems = SimilarItemEngine.processSimilarItems(
      uniqueProducts,
      similarTarget,
      baselinePrice
    );

    const cheaperAlternatives = similarItems.filter((i) => i.tier === 'CHEAPER');

    // 6. Group same-item marketplace listings across sellers
    const groupTarget: {
      brand?: string | null;
      category?: string | null;
      garmentType?: string | null;
      productCode?: string | null;
    } = {};
    if (itemInfo.brand !== undefined) groupTarget.brand = itemInfo.brand;
    if (itemInfo.category !== undefined) groupTarget.category = itemInfo.category;
    if (itemInfo.garmentType !== undefined) groupTarget.garmentType = itemInfo.garmentType;
    if (itemInfo.productCode !== undefined) groupTarget.productCode = itemInfo.productCode;

    const matchedProducts = ProductGrouper.groupProducts(uniqueProducts, groupTarget);

    // 7. Trend Signals: Honest representation
    // If no verifiable publication/search frequency provider is configured, report honest UNAVAILABLE status.
    const trendSignals = {
      status: 'UNAVAILABLE' as const,
      message: 'Trend data is currently unavailable. No synthetic trend percentages are generated.',
      signals: [] as TrendSignal[],
    };

    return {
      queries: {
        primaryQuery: queries.primaryQuery,
        specificQuery: queries.specificQuery,
        broadQuery: queries.broadQuery,
      },
      matchedProducts,
      pricing,
      similarItems,
      cheaperAlternatives,
      trendSignals,
      sources: Array.from(sourceMap.values()),
      researchedAt: new Date().toISOString(),
    };
  }
}

export const fashionResearchEngine = new FashionResearchEngine();
