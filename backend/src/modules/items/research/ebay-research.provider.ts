import { ExternalProductResult, FashionResearchProvider } from './provider.interface';

export class EbayMarketplaceResearchProvider implements FashionResearchProvider {
  readonly name = 'eBay Marketplace (Active Listings)';
  readonly providerId = 'EBAY_MARKETPLACE';
  readonly supportsProductSearch = true;
  readonly supportsPriceComps = true;
  readonly supportsTrendSignals = false;

  private cachedToken: { token: string; expiresAt: number } | null = null;

  private get baseUrl() {
    return process.env.EBAY_ENVIRONMENT === 'production'
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';
  }

  private async getAppToken(clientId: string, clientSecret: string): Promise<string | null> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken.token;
    }

    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenRes = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
      });

      if (!tokenRes.ok) {
        console.warn(`[eBay Auth] Token request failed with HTTP ${tokenRes.status}`);
        return null;
      }

      const tokenData = (await tokenRes.json()) as any;
      if (tokenData?.access_token) {
        const expiresInSec = typeof tokenData.expires_in === 'number' ? tokenData.expires_in : 7200;
        this.cachedToken = {
          token: tokenData.access_token,
          expiresAt: Date.now() + expiresInSec * 1000,
        };
        return tokenData.access_token;
      }
      return null;
    } catch (err: any) {
      console.warn('[eBay Auth] Failed to fetch access token:', err.message);
      return null;
    }
  }

  private parseEbayItem(item: any): ExternalProductResult | null {
    if (!item || !item.itemId) return null;

    // Price extraction: eBay Buy Browse returns item.price.value and item.price.currency
    const rawVal = item.price?.value;
    const priceVal = rawVal != null ? parseFloat(rawVal) : null;
    if (priceVal == null || isNaN(priceVal) || priceVal <= 0) {
      return null; // Skip invalid prices
    }

    const currency = item.price?.currency || 'USD';

    // Shipping extraction
    let shippingPrice: number | null = null;
    const firstShipping = item.shippingOptions?.[0];
    if (firstShipping?.shippingCost?.value != null) {
      const shipVal = parseFloat(firstShipping.shippingCost.value);
      if (!isNaN(shipVal)) {
        shippingPrice = shipVal;
      }
    }

    const totalPrice = shippingPrice != null ? Math.round((priceVal + shippingPrice) * 100) / 100 : priceVal;

    // Condition extraction
    const rawCondition = item.condition || item.conditionId || 'Pre-owned';

    return {
      id: `ebay-${item.itemId}`,
      marketplaceItemId: item.itemId,
      title: item.title || 'eBay Item',
      brand: null,
      category: item.categories?.[0]?.categoryName || null,
      price: priceVal,
      currency,
      shippingPrice,
      totalPrice,
      condition: rawCondition,
      imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null,
      productUrl: item.itemWebUrl || `https://www.ebay.com/itm/${item.itemId}`,
      retailer: item.seller?.username || 'eBay Seller',
      source: 'EBAY_MARKETPLACE',
      sourceName: 'eBay Marketplace',
      retrievedAt: new Date().toISOString(),
      isSoldPrice: false, // Active asking price
    };
  }

  async searchProducts(
    query: string,
    options?: { limit?: number; category?: string; queryVariations?: string[] }
  ): Promise<ExternalProductResult[]> {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.includes('dummy')) {
      console.warn('[eBay Provider] Missing or dummy credentials. Skipping.');
      return [];
    }

    const appToken = await this.getAppToken(clientId, clientSecret);
    if (!appToken) {
      return [];
    }

    const limit = Math.min(options?.limit || 10, 20);
    const queriesToExecute: string[] = [];

    if (query) queriesToExecute.push(query);
    if (options?.queryVariations && Array.isArray(options.queryVariations)) {
      for (const qv of options.queryVariations) {
        if (qv && !queriesToExecute.includes(qv)) {
          queriesToExecute.push(qv);
        }
      }
    }

    const allResults: ExternalProductResult[] = [];
    const seenIds = new Set<string>();

    for (const q of queriesToExecute) {
      if (allResults.length >= limit * 2) break; // Have enough candidates

      console.log(`EBAY SEARCH START\nQuery: "${q}"\nEBAY REQUEST SENT`);
      try {
        const encodedQuery = encodeURIComponent(q);
        const searchRes = await fetch(
          `${this.baseUrl}/buy/browse/v1/item_summary/search?q=${encodedQuery}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${appToken}`,
              'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            },
          }
        );

        console.log(`HTTP STATUS: ${searchRes.status}`);

        if (!searchRes.ok) {
          const errText = await searchRes.text();
          console.warn(`[eBay Provider] Search failed with status ${searchRes.status}: ${errText.slice(0, 150)}`);
          continue;
        }

        const searchData = (await searchRes.json()) as any;
        const rawSummaries = searchData.itemSummaries || [];
        console.log(`RAW RESULT COUNT: ${rawSummaries.length}`);

        let parsedCount = 0;
        let validPriceCount = 0;

        for (const raw of rawSummaries) {
          parsedCount++;
          const parsed = this.parseEbayItem(raw);
          if (parsed) {
            validPriceCount++;
            if (!seenIds.has(parsed.id)) {
              seenIds.add(parsed.id);
              allResults.push(parsed);
            }
          }
        }

        console.log(`PARSED RESULT COUNT: ${parsedCount}\nVALID PRICE RESULTS: ${validPriceCount}\nFINAL MATCHES: ${allResults.length}`);

        // If we found good results on the primary/specific query, break early
        if (allResults.length >= 5) {
          break;
        }
      } catch (err: any) {
        console.warn(`[eBay Provider] Search error for query "${q}":`, err.message);
      }
    }

    return allResults;
  }

  async searchMarketComps(
    query: string,
    options?: { brand?: string; category?: string; queryVariations?: string[] }
  ): Promise<ExternalProductResult[]> {
    const searchOpts: { limit: number; category?: string; queryVariations?: string[] } = {
      limit: 15,
    };
    if (options?.category) searchOpts.category = options.category;
    if (options?.queryVariations) searchOpts.queryVariations = options.queryVariations;
    return this.searchProducts(query, searchOpts);
  }
}

export const ebayMarketplaceResearchProvider = new EbayMarketplaceResearchProvider();

