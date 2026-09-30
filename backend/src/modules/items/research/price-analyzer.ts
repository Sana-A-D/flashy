import { ExternalProductResult } from './provider.interface';
import { PriceIntelligence, PriceTier } from '../fashion.schema';

export class PriceAnalyzer {
  /**
   * Deterministically analyzes retrieved market observations into normalized price tiers.
   * If there are no verified observations or insufficient data, returns explicit UNAVAILABLE status.
   */
  static analyze(observations: ExternalProductResult[]): PriceIntelligence {
    const validPrices = observations
      .map((p) => p.price)
      .filter((price): price is number => typeof price === 'number' && !isNaN(price) && price > 0);

    if (validPrices.length === 0) {
      return {
        status: 'UNAVAILABLE',
        unbranded: null,
        branded: null,
        premium: null,
        resale: null,
        newPrice: null,
        message: 'Not enough verified price data.',
      };
    }

    const currency = observations[0]?.currency || 'USD';
    const sampleSize = validPrices.length;

    // Helper to calculate statistics
    const computeTier = (prices: number[], sourceLabel: string): PriceTier => {
      const sorted = [...prices].sort((a, b) => a - b);
      const min = sorted[0] ?? null;
      const max = sorted[sorted.length - 1] ?? null;
      const midIdx = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? ((sorted[midIdx - 1] ?? 0) + (sorted[midIdx] ?? 0)) / 2
          : sorted[midIdx] ?? null;
      const sum = sorted.reduce((acc, p) => acc + p, 0);
      const average = Math.round((sum / sorted.length) * 100) / 100;

      return {
        min,
        max,
        median,
        average,
        currency,
        sampleSize: sorted.length,
        source: sourceLabel,
        retrievedAt: new Date().toISOString(),
      };
    };

    // Partition observations into NEW retail, ACTIVE resale, and VERIFIED sold
    const soldObs = observations.filter((o) => o.isSoldPrice === true);
    const resaleObs = observations.filter(
      (o) =>
        !o.isSoldPrice &&
        (o.condition?.toLowerCase().includes('pre-owned') ||
          o.condition?.toLowerCase().includes('used') ||
          o.source === 'EBAY_MARKETPLACE' ||
          o.source.includes('RESALE'))
    );
    const newObs = observations.filter(
      (o) =>
        !o.isSoldPrice &&
        (o.condition?.toLowerCase().includes('new') ||
          (!o.condition && o.source !== 'EBAY_MARKETPLACE' && !o.source.includes('RESALE')))
    );

    const soldPrices = soldObs
      .map((o) => o.price)
      .filter((p): p is number => typeof p === 'number' && p > 0);

    const resalePrices = resaleObs
      .map((o) => o.price)
      .filter((p): p is number => typeof p === 'number' && p > 0);

    const newPrices = newObs
      .map((o) => o.price)
      .filter((p): p is number => typeof p === 'number' && p > 0);

    const soldTier = soldPrices.length > 0 ? computeTier(soldPrices, 'Verified sold transactions') : null;
    const resaleTier = resalePrices.length > 0 ? computeTier(resalePrices, 'Active resale listings') : null;
    const newTier = newPrices.length > 0 ? computeTier(newPrices, 'Verified retail sources') : null;

    // Overall summary tier
    const overallTier = computeTier(validPrices, `${sampleSize} retrieved products`);

    const status = sampleSize >= 3 ? 'AVAILABLE' : 'INSUFFICIENT_DATA';
    const message =
      status === 'AVAILABLE'
        ? `Based on ${sampleSize} verified market observation(s).`
        : `Limited data: only ${sampleSize} observation(s) available.`;

    return {
      status,
      unbranded: overallTier,
      branded: newTier,
      premium: soldTier, // Maps to sold tier if present
      resale: resaleTier,
      newPrice: newTier,
      suggestedListingPrice: resaleTier ? {
        min: resaleTier.min,
        max: resaleTier.max,
        median: resaleTier.median,
        average: resaleTier.average,
        currency: resaleTier.currency,
        sampleSize: resaleTier.sampleSize,
        source: 'Calculated from active resale listings',
        retrievedAt: resaleTier.retrievedAt,
      } : null,
      quickSalePrice: resaleTier && resaleTier.min ? {
        min: resaleTier.min,
        max: resaleTier.median,
        median: Math.round(resaleTier.min * 0.9),
        average: Math.round(resaleTier.min * 0.9),
        currency: resaleTier.currency,
        sampleSize: resaleTier.sampleSize,
        source: 'Quick-sale pricing below active market low',
        retrievedAt: resaleTier.retrievedAt,
      } : null,
      message,
    };
  }
}
