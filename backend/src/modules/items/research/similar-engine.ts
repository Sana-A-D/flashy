import { ExternalProductResult } from './provider.interface';
import { SimilarItem } from '../fashion.schema';

export class SimilarItemEngine {
  /**
   * Deterministically scores, ranks, and classifies retrieved products into
   * CHEAPER, COMPARABLE, and PREMIUM tiers relative to a real observed baseline price.
   */
  static processSimilarItems(
    products: ExternalProductResult[],
    itemAttributes: {
      category?: string | null;
      brand?: string | null;
      color?: string | null;
      pattern?: string | null;
      material?: string | null;
      fit?: string | null;
    },
    baselinePrice?: number | null
  ): SimilarItem[] {
    const scored = products.map((prod) => {
      let score = 0;
      const titleLower = (prod.title || '').toLowerCase();

      // Check category match
      if (itemAttributes.category && titleLower.includes(itemAttributes.category.toLowerCase())) {
        score += 30;
      }

      // Check color match
      if (itemAttributes.color && titleLower.includes(itemAttributes.color.toLowerCase())) {
        score += 25;
      }

      // Check pattern match
      if (itemAttributes.pattern && itemAttributes.pattern !== 'Solid' && titleLower.includes(itemAttributes.pattern.toLowerCase())) {
        score += 20;
      }

      // Check material match
      if (itemAttributes.material && titleLower.includes(itemAttributes.material.toLowerCase())) {
        score += 15;
      }

      // Check brand match
      if (itemAttributes.brand && titleLower.includes(itemAttributes.brand.toLowerCase())) {
        score += 20;
      }

      return { prod, score };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.score - a.score);

    // Compute baseline price if none provided (use median price of top results)
    const validPrices = scored
      .map((s) => s.prod.price)
      .filter((p): p is number => typeof p === 'number' && p > 0);

    const effectiveBaseline =
      baselinePrice && baselinePrice > 0
        ? baselinePrice
        : validPrices.length > 0
        ? validPrices[Math.floor(validPrices.length / 2)]!
        : null;

    return scored.map(({ prod }): SimilarItem => {
      let tier: 'CHEAPER' | 'COMPARABLE' | 'PREMIUM' = 'COMPARABLE';

      if (effectiveBaseline && prod.price && prod.price > 0) {
        if (prod.price < effectiveBaseline * 0.8) {
          tier = 'CHEAPER';
        } else if (prod.price > effectiveBaseline * 1.3) {
          tier = 'PREMIUM';
        }
      }

      let matchType: 'EXACT_MATCH' | 'CLOSE_MATCH' | 'STYLE_MATCH' = 'STYLE_MATCH';
      if (itemAttributes.brand && prod.brand && prod.brand.toLowerCase() === itemAttributes.brand.toLowerCase()) {
        if (itemAttributes.category && prod.title.toLowerCase().includes(itemAttributes.category.toLowerCase())) {
          matchType = 'EXACT_MATCH';
        } else {
          matchType = 'CLOSE_MATCH';
        }
      } else if (itemAttributes.category && prod.title.toLowerCase().includes(itemAttributes.category.toLowerCase())) {
        matchType = 'CLOSE_MATCH';
      }

      return {
        id: prod.id,
        title: prod.title,
        brand: prod.brand || null,
        price: prod.price ?? null,
        currency: prod.currency || 'USD',
        condition: prod.condition || null,
        source: prod.source,
        sourceName: prod.sourceName,
        url: prod.productUrl,
        imageUrl: prod.imageUrl || null,
        tier,
        matchType: prod.matchType || matchType,
        retrievedAt: prod.retrievedAt,
      };
    });
  }
}
