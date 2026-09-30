import { describe, it, expect, vi } from 'vitest';
import { ResearchQueryBuilder } from './query-builder';
import { ProductDeduplicator } from './product-deduplicator';
import { PriceAnalyzer } from './price-analyzer';
import { SimilarItemEngine } from './similar-engine';
import { FashionResearchEngine } from './research-engine';
import { ProductGrouper } from './product-grouper';
import { FashionResearchProvider, ExternalProductResult } from './provider.interface';

describe('Fashion Research Engine & Real-World Intelligence', () => {
  describe('ResearchQueryBuilder', () => {
    it('constructs concise, natural queries without null, undefined, or unknown tokens', () => {
      const queries = ResearchQueryBuilder.buildQueries({
        title: 'Striped T-shirt',
        category: 'T-shirt',
        garmentType: 'T-shirt',
        color: 'navy',
        secondaryColors: ['white'],
        pattern: 'horizontal stripes',
        material: 'cotton',
        fit: 'relaxed',
        style: 'casual',
      });

      expect(queries.primaryQuery).toBe('navy white horizontal stripes cotton T-shirt');
      expect(queries.primaryQuery).not.toContain('null');
      expect(queries.primaryQuery).not.toContain('undefined');
      expect(queries.primaryQuery).not.toContain('unknown');
      expect(queries.specificQuery).toBeDefined();
      expect(queries.broadQuery).toBeDefined();
    });

    it('gracefully handles missing attributes and omits unknown brand / materials', () => {
      const queries = ResearchQueryBuilder.buildQueries({
        category: 'Dress',
        color: 'black',
        material: 'unknown',
        brand: null,
      });

      expect(queries.primaryQuery).toBe('black Dress');
      expect(queries.primaryQuery).not.toContain('unknown');
      expect(queries.primaryQuery).not.toContain('null');
    });
  });

  describe('ProductDeduplicator', () => {
    it('removes duplicate listings by canonical URL (stripping tracking query params)', () => {
      const rawProducts: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Navy Striped T-Shirt Casual',
          price: 28,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/12345?mkevt=1&mkcid=28',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Navy Striped T-Shirt Casual',
          price: 28,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/12345?custom_tracking=abc',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const deduplicated = ProductDeduplicator.deduplicate(rawProducts);
      expect(deduplicated).toHaveLength(1);
    });

    it('preserves distinct products that have different titles or prices', () => {
      const rawProducts: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Navy Striped T-Shirt Casual',
          price: 28,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/12345',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Vintage Cotton Striped Tee',
          price: 45,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/67890',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const deduplicated = ProductDeduplicator.deduplicate(rawProducts);
      expect(deduplicated).toHaveLength(2);
    });
  });

  describe('PriceAnalyzer (Data Integrity Rule)', () => {
    it('returns UNAVAILABLE or INSUFFICIENT_DATA when sample size is below threshold (< 3)', () => {
      const fewProducts: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Sample Item 1',
          price: 30,
          currency: 'USD',
          productUrl: 'https://example.com/1',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const analysis = PriceAnalyzer.analyze(fewProducts);
      expect(analysis.status).toBe('INSUFFICIENT_DATA');
      expect(analysis.message).toContain('Limited data');
    });

    it('computes accurate min, max, median, and average when verified sample is sufficient', () => {
      const products: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Item A',
          price: 20,
          currency: 'USD',
          productUrl: 'https://example.com/1',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Item B',
          price: 30,
          currency: 'USD',
          productUrl: 'https://example.com/2',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Item C',
          price: 40,
          currency: 'USD',
          productUrl: 'https://example.com/3',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const analysis = PriceAnalyzer.analyze(products);
      expect(analysis.status).toBe('AVAILABLE');
      expect(analysis.resale?.min).toBe(20);
      expect(analysis.resale?.max).toBe(40);
      expect(analysis.resale?.median).toBe(30);
      expect(analysis.resale?.average).toBe(30);
      expect(analysis.resale?.sampleSize).toBe(3);
    });
  });

  describe('SimilarItemEngine & Cheaper Classification', () => {
    it('classifies items as CHEAPER strictly when price is below 0.8x baseline', () => {
      const items: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Budget Navy Striped Tee',
          price: 15,
          currency: 'USD',
          productUrl: 'https://example.com/cheap',
          source: 'EBAY',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Comparable Navy Striped Tee',
          price: 32,
          currency: 'USD',
          productUrl: 'https://example.com/comp',
          source: 'EBAY',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Luxury Designer Striped Tee',
          price: 95,
          currency: 'USD',
          productUrl: 'https://example.com/prem',
          source: 'EBAY',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const baseline = 30; // $30 baseline
      const processed = SimilarItemEngine.processSimilarItems(
        items,
        { color: 'navy', pattern: 'striped', category: 't-shirt' },
        baseline
      );

      const cheapItem = processed.find((i) => i.id === '1');
      const compItem = processed.find((i) => i.id === '2');
      const premItem = processed.find((i) => i.id === '3');

      expect(cheapItem?.tier).toBe('CHEAPER');
      expect(compItem?.tier).toBe('COMPARABLE');
      expect(premItem?.tier).toBe('PREMIUM');
    });

    it('does not label any item as CHEAPER if there is no trustworthy baseline price', () => {
      const items: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Budget Striped Tee',
          price: 10,
          currency: 'USD',
          productUrl: 'https://example.com/1',
          source: 'EBAY',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const processed = SimilarItemEngine.processSimilarItems(
        items,
        { color: 'navy' },
        null // No baseline
      );

      expect(processed[0]?.tier).toBe('COMPARABLE');
    });
  });

  describe('FashionResearchEngine Provider Isolation', () => {
    it('isolates failures: when one provider errors, surviving providers still return results', () => {
      const failingProvider: FashionResearchProvider = {
        name: 'Failing Provider',
        providerId: 'FAILING_PROV',
        supportsProductSearch: true,
        supportsPriceComps: false,
        supportsTrendSignals: false,
        searchProducts: vi.fn().mockRejectedValue(new Error('Network timeout')),
        searchMarketComps: vi.fn().mockResolvedValue([]),
      };

      const workingProvider: FashionResearchProvider = {
        name: 'Working Provider',
        providerId: 'WORKING_PROV',
        supportsProductSearch: true,
        supportsPriceComps: true,
        supportsTrendSignals: false,
        searchProducts: vi.fn().mockResolvedValue([
          {
            id: 'item-w1',
            title: 'Working Provider Item 1',
            price: 25,
            currency: 'USD',
            productUrl: 'https://working.example.com/1',
            source: 'WORKING_PROV',
            sourceName: 'Working Provider',
            retrievedAt: new Date().toISOString(),
          },
          {
            id: 'item-w2',
            title: 'Working Provider Item 2',
            price: 35,
            currency: 'USD',
            productUrl: 'https://working.example.com/2',
            source: 'WORKING_PROV',
            sourceName: 'Working Provider',
            retrievedAt: new Date().toISOString(),
          },
          {
            id: 'item-w3',
            title: 'Working Provider Item 3',
            price: 45,
            currency: 'USD',
            productUrl: 'https://working.example.com/3',
            source: 'WORKING_PROV',
            sourceName: 'Working Provider',
            retrievedAt: new Date().toISOString(),
          },
        ]),
        searchMarketComps: vi.fn().mockResolvedValue([]),
      };

      const engine = new FashionResearchEngine();
      // Replace providers with test instances
      (engine as any).providers = [failingProvider, workingProvider];

      return engine
        .performResearch({
          category: 'shirt',
          color: 'blue',
        })
        .then((result) => {
          expect(result.similarItems.length).toBeGreaterThan(0);
          expect(result.sources).toHaveLength(1);
          expect(result.sources[0]?.name).toBe('Working Provider');
          // Honest trend representation
          expect(result.trendSignals.status).toBe('UNAVAILABLE');
          expect(result.trendSignals.message).toContain('No synthetic trend percentages');
        });
    });
  });

  describe('ProductGrouper (Same Item from Many Sellers)', () => {
    it('groups multiple seller listings of the same product model and calculates price range', () => {
      const mockListings: ExternalProductResult[] = [
        {
          id: 'list-1',
          title: 'Levi 501 Original Fit Jeans',
          brand: "Levi's",
          category: 'Jeans',
          price: 49.00,
          currency: 'USD',
          condition: 'Pre-owned / Resale',
          productUrl: 'https://www.ebay.com/itm/1',
          retailer: 'Seller A',
          source: 'EBAY',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
          matchType: 'EXACT_MATCH',
        },
        {
          id: 'list-2',
          title: 'Levi 501 Original Fit Jeans',
          brand: "Levi's",
          category: 'Jeans',
          price: 55.00,
          currency: 'USD',
          condition: 'Pre-owned / Resale',
          productUrl: 'https://poshmark.com/listing/2',
          retailer: 'Seller B',
          source: 'POSHMARK',
          sourceName: 'Poshmark',
          retrievedAt: new Date().toISOString(),
          matchType: 'EXACT_MATCH',
        },
        {
          id: 'list-3',
          title: 'Levi 501 Original Fit Jeans',
          brand: "Levi's",
          category: 'Jeans',
          price: 62.00,
          currency: 'USD',
          condition: 'New / Retail',
          productUrl: 'https://nordstrom.com/3',
          retailer: 'Nordstrom Retail',
          source: 'NORDSTROM',
          sourceName: 'Nordstrom',
          retrievedAt: new Date().toISOString(),
          matchType: 'EXACT_MATCH',
        },
      ];

      const grouped = ProductGrouper.groupProducts(mockListings, {
        brand: "Levi's",
        category: 'Jeans',
        garmentType: '501 Original Fit Jeans',
      });

      expect(grouped).toHaveLength(1);
      const group = grouped[0]!;
      expect(group.name).toContain('Levi 501');
      expect(group.listings).toHaveLength(3);
      expect(group.priceSummary.min).toBe(49.00);
      expect(group.priceSummary.max).toBe(62.00);
      expect(group.priceSummary.median).toBe(55.00);
      expect(group.priceSummary.sampleSize).toBe(3);
    });

    it('filters out listings with missing or non-positive prices and preserves individual seller prices', () => {
      const mockListings: ExternalProductResult[] = [
        {
          id: 'list-1',
          title: 'Nike Dri-FIT Polo Shirt Blue',
          brand: 'Nike',
          price: 15.00,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/1',
          retailer: 'Seller A',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: 'list-2',
          title: 'Nike Dri-FIT Polo Shirt Blue',
          brand: 'Nike',
          price: 18.00,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/2',
          retailer: 'Seller B',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: 'list-3',
          title: 'Nike Dri-FIT Polo Shirt Blue',
          brand: 'Nike',
          price: 21.00,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/3',
          retailer: 'Seller C',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: 'list-4',
          title: 'Nike Dri-FIT Polo Shirt Blue',
          brand: 'Nike',
          price: 24.00,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/4',
          retailer: 'Seller D',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: 'list-5',
          title: 'Nike Dri-FIT Polo Shirt Blue',
          brand: 'Nike',
          price: 29.00,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/5',
          retailer: 'Seller E',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: 'list-bad',
          title: 'Nike Dri-FIT Polo Shirt Blue',
          brand: 'Nike',
          price: null,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/bad',
          retailer: 'Bad Seller',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const grouped = ProductGrouper.groupProducts(mockListings, {
        brand: 'Nike',
        garmentType: 'Polo Shirt',
      });

      expect(grouped).toHaveLength(1);
      const group = grouped[0]!;
      expect(group.listings).toHaveLength(5); // Bad listing excluded
      expect(group.priceSummary.min).toBe(15.00);
      expect(group.priceSummary.max).toBe(29.00);
      expect(group.priceSummary.median).toBe(21.00);
      expect(group.priceSummary.sampleSize).toBe(5);

      // Verify each seller's distinct price is preserved intact
      expect(group.listings[0]?.price).toBe(15.00);
      expect(group.listings[1]?.price).toBe(18.00);
      expect(group.listings[2]?.price).toBe(21.00);
      expect(group.listings[3]?.price).toBe(24.00);
      expect(group.listings[4]?.price).toBe(29.00);
    });

    it('requires exact productCode match or confirmed brand + model for EXACT_MATCH classification', () => {
      const candidates: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Nike Air Max 90 CW2288-111 Triple White',
          brand: 'Nike',
          price: 110,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/1',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'White Sport Sneakers Casual Shoes',
          brand: null,
          price: 45,
          currency: 'USD',
          productUrl: 'https://www.ebay.com/itm/2',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
        },
      ];

      const groupedWithCode = ProductGrouper.groupProducts(candidates, {
        brand: 'Nike',
        garmentType: 'Sneakers',
        productCode: 'CW2288-111',
      });

      const matchedCodeGroup = groupedWithCode.find((g) => g.listings.some((l) => l.id === '1'));
      expect(matchedCodeGroup?.matchType).toBe('EXACT_MATCH');

      const genericGroup = groupedWithCode.find((g) => g.listings.some((l) => l.id === '2'));
      expect(genericGroup?.matchType).toBe('STYLE_MATCH');
    });
  });

  describe('Evidence-Based Query & Exact Matching Architecture', () => {
    it('prioritizes exact style code / SKU in queries when present', () => {
      const queries = ResearchQueryBuilder.buildQueries({
        brand: 'Arc\'teryx',
        garmentType: 'Beta AR Jacket',
        color: 'black',
        productCode: '29921',
      });

      expect(queries.primaryQuery).toBe("Arc'teryx 29921 Beta AR Jacket");
      expect(queries.queryVariations).toContain("Arc'teryx 29921");
      expect(queries.queryVariations).toContain('29921');
    });

    it('separates active resale listings from verified sold transactions without mixing', () => {
      const mixedListings: ExternalProductResult[] = [
        {
          id: '1',
          title: 'Stussy 8 Ball Fleece',
          price: 180,
          currency: 'USD',
          productUrl: 'https://ebay.com/1',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
          isSoldPrice: false,
        },
        {
          id: '2',
          title: 'Stussy 8 Ball Fleece Sold Comp',
          price: 150,
          currency: 'USD',
          productUrl: 'https://ebay.com/2',
          source: 'EBAY_MARKETPLACE',
          sourceName: 'eBay',
          retrievedAt: new Date().toISOString(),
          isSoldPrice: true,
        },
        {
          id: '3',
          title: 'Stussy 8 Ball Fleece Retail Store',
          price: 210,
          currency: 'USD',
          productUrl: 'https://stussy.com/3',
          source: 'RETAIL_STORE',
          sourceName: 'Official Retail',
          retrievedAt: new Date().toISOString(),
          isSoldPrice: false,
          condition: 'NEW',
        },
      ];

      const priceIntel = PriceAnalyzer.analyze(mixedListings);
      expect(priceIntel.status).toBe('AVAILABLE');
      // Sold transactions are strictly preserved in premium tier without corrupting resale
      expect(priceIntel.premium?.source).toContain('Verified sold transactions');
      expect(priceIntel.premium?.min).toBe(150);
      expect(priceIntel.resale?.source).toContain('Active resale listings');
      expect(priceIntel.resale?.min).toBe(180);
      expect(priceIntel.branded?.source).toContain('Verified retail sources');
      expect(priceIntel.branded?.min).toBe(210);
    });
  });
});

