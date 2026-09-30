import { ExternalProductResult } from './provider.interface';

export class ProductDeduplicator {
  /**
   * Deterministically deduplicates external products using canonical URLs and normalized title+price
   */
  static deduplicate(products: ExternalProductResult[]): ExternalProductResult[] {
    const seenUrls = new Set<string>();
    const seenSignatures = new Set<string>();
    const unique: ExternalProductResult[] = [];

    for (const item of products) {
      if (!item.productUrl && !item.title) continue;

      // 1. Check canonical URL without query tracking params
      let cleanUrl = '';
      if (item.productUrl) {
        try {
          const parsed = new URL(item.productUrl);
          // Drop tracking parameters
          parsed.searchParams.delete('utm_source');
          parsed.searchParams.delete('utm_medium');
          parsed.searchParams.delete('utm_campaign');
          parsed.searchParams.delete('_trksid');
          parsed.searchParams.delete('_trkparms');
          cleanUrl = parsed.toString().toLowerCase();
        } catch {
          cleanUrl = item.productUrl.toLowerCase();
        }
      }

      if (cleanUrl && seenUrls.has(cleanUrl)) {
        continue;
      }

      // 2. Check title + price signature
      const normTitle = (item.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 40);
      const signature = `${normTitle}_${item.price ?? 'no-price'}_${item.currency}`;

      if (seenSignatures.has(signature)) {
        continue;
      }

      if (cleanUrl) seenUrls.add(cleanUrl);
      seenSignatures.add(signature);
      unique.push(item);
    }

    return unique;
  }
}
