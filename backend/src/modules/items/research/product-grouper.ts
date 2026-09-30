import { ExternalProductResult } from './provider.interface';

export interface MatchedProductGroup {
  productId: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  matchType: 'EXACT_MATCH' | 'CLOSE_MATCH' | 'STYLE_MATCH';
  listings: Array<{
    id: string;
    seller: string;
    marketplace: string;
    price?: number | null;
    currency: string;
    condition?: string | null;
    url?: string | null;
    imageUrl?: string | null;
  }>;
  priceSummary: {
    min?: number | null;
    max?: number | null;
    median?: number | null;
    average?: number | null;
    currency: string;
    sampleSize: number;
  };
}

export class ProductGrouper {
  /**
   * Groups search results from different sellers and marketplaces into cohesive canonical products.
   * e.g., Seller A, Seller B, Seller C selling "Levi's 501 Original Jeans" are grouped together
   * so the user sees:
   * LEVI'S 501 ORIGINAL
   * 5 sellers found · $48 – $62
   * Seller A ($49) | Seller B ($55) | Seller C ($59) ...
   */
  static groupProducts(
    products: ExternalProductResult[],
    itemTarget: {
      brand?: string | null;
      category?: string | null;
      garmentType?: string | null;
      productCode?: string | null;
    }
  ): MatchedProductGroup[] {
    const groupsMap = new Map<string, MatchedProductGroup>();

    // Clean stop words from title for canonical naming
    const cleanTitleTokens = (title: string): string[] => {
      const stopWords = new Set([
        'a', 'an', 'the', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'of',
        'mens', 'womens', 'men', 'women', 'size', 's', 'm', 'l', 'xl', 'xxl',
        'nib', 'nwt', 'nwot', 'vtg', 'vintage', 'used', 'preowned', 'authentic',
        'rare', 'y2k', 'oem', 'condition', 'look', 'free', 'shipping', 'fast'
      ]);
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));
    };

    for (const prod of products) {
      // Must have valid title and valid positive price
      if (!prod.title || typeof prod.price !== 'number' || isNaN(prod.price) || prod.price <= 0) {
        continue;
      }

      // Currency normalization check (default USD)
      const currency = prod.currency || 'USD';

      const normTitle = (prod.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Check category/garment relevance if provided
      const targetBrandLower = (itemTarget.brand || '').trim().toLowerCase();
      const targetGarmentLower = (itemTarget.garmentType || '').trim().toLowerCase();
      const targetCodeLower = (itemTarget.productCode || '').trim().toLowerCase();

      // Rigorous match classification:
      // EXACT_MATCH requires matching exact product code OR confirmed brand with specific garment model
      let matchType: 'EXACT_MATCH' | 'CLOSE_MATCH' | 'STYLE_MATCH' = 'STYLE_MATCH';
      const rawTitleLower = (prod.title || '').toLowerCase();
      const cleanTargetCode = targetCodeLower.replace(/[^a-z0-9]/g, '');
      const cleanTitle = rawTitleLower.replace(/[^a-z0-9]/g, '');
      const hasCodeMatch = Boolean(
        targetCodeLower &&
          (rawTitleLower.includes(targetCodeLower) || (cleanTargetCode && cleanTitle.includes(cleanTargetCode)))
      );
      const hasTargetBrand = Boolean(targetBrandLower && normTitle.includes(targetBrandLower));
      const hasTargetGarment = Boolean(targetGarmentLower && normTitle.includes(targetGarmentLower));

      if (hasCodeMatch) {
        matchType = 'EXACT_MATCH';
      } else if (hasTargetBrand && hasTargetGarment) {
        matchType = prod.matchType === 'EXACT_MATCH' ? 'EXACT_MATCH' : 'CLOSE_MATCH';
      } else if (targetBrandLower && !hasTargetBrand) {
        // Different or missing brand is a style match, never presented as the same brand
        matchType = 'STYLE_MATCH';
      } else if (hasTargetBrand || hasTargetGarment) {
        matchType = 'CLOSE_MATCH';
      }

      // Group key based on brand and top 3 meaningful tokens
      const meaningfulTokens = cleanTitleTokens(prod.title);
      const brandKey = (prod.brand || itemTarget.brand || meaningfulTokens[0] || 'Apparel').trim().toLowerCase();
      const topTokens = meaningfulTokens.slice(0, 3).join('_');
      const groupKey = `${currency}_${brandKey}_${topTokens}`;

      // Canonical product name: clean, high-readability name
      const titleWords = prod.title.split(/\s+/).slice(0, 6).join(' ');
      const canonicalName = titleWords.replace(/\s+-\s*$/, '');

      const listing = {
        id: prod.id,
        seller: prod.retailer || prod.sourceName || 'Online Seller',
        marketplace: prod.sourceName || 'Marketplace',
        price: prod.price,
        currency,
        condition: prod.condition || 'Pre-owned / Resale',
        url: prod.productUrl,
        imageUrl: prod.imageUrl || null,
      };

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          productId: `prod-group-${groupsMap.size + 1}`,
          name: canonicalName,
          brand: prod.brand || itemTarget.brand || null,
          category: prod.category || itemTarget.category || null,
          matchType,
          listings: [listing],
          priceSummary: {
            min: prod.price,
            max: prod.price,
            median: prod.price,
            average: prod.price,
            currency,
            sampleSize: 1,
          },
        });
      } else {
        const group = groupsMap.get(groupKey)!;
        // Avoid duplicate listing IDs in the same group
        if (!group.listings.some((l) => l.id === listing.id)) {
          group.listings.push(listing);
        }

        // Keep highest fidelity matchType
        if (matchType === 'EXACT_MATCH') {
          group.matchType = 'EXACT_MATCH';
        } else if (matchType === 'CLOSE_MATCH' && group.matchType !== 'EXACT_MATCH') {
          group.matchType = 'CLOSE_MATCH';
        }

        // Recalculate price summary strictly from valid numbers
        const validPrices = group.listings
          .map((l) => l.price)
          .filter((p): p is number => typeof p === 'number' && p > 0)
          .sort((a, b) => a - b);

        if (validPrices.length > 0) {
          const min = validPrices[0]!;
          const max = validPrices[validPrices.length - 1]!;
          const midIdx = Math.floor(validPrices.length / 2);
          const median =
            validPrices.length % 2 === 0
              ? Math.round(((validPrices[midIdx - 1]! + validPrices[midIdx]!) / 2) * 100) / 100
              : validPrices[midIdx]!;
          const sum = validPrices.reduce((acc, p) => acc + p, 0);
          const average = Math.round((sum / validPrices.length) * 100) / 100;

          group.priceSummary = {
            min,
            max,
            median,
            average,
            currency,
            sampleSize: validPrices.length,
          };
        }
      }
    }

    // Sort groups so that EXACT_MATCH comes first, followed by CLOSE_MATCH, then by number of sellers found
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
      const matchOrder = { EXACT_MATCH: 1, CLOSE_MATCH: 2, STYLE_MATCH: 3 };
      const diff = matchOrder[a.matchType] - matchOrder[b.matchType];
      if (diff !== 0) return diff;
      return b.listings.length - a.listings.length;
    });

    return sortedGroups;
  }
}

