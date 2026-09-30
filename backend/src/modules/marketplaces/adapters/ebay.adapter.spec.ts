// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EbayAdapter } from './ebay.adapter';
import { MarketplaceErrorCategory, MarketplaceOperationStatus } from '../marketplace.types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Prisma
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      marketplaceAccount = {
        findUnique: vi.fn().mockResolvedValue({
          id: 'acc-1',
          userId: 'user-1',
          encryptedTokens: JSON.stringify({ refreshToken: 'valid-refresh-token' })
        }),
        update: vi.fn().mockResolvedValue({})
      };
      ebayAccount = {
        findFirst: vi.fn().mockResolvedValue({
          id: 'ebay-1',
          userId: 'user-1',
          connectionStatus: 'READY',
          merchantLocationKey: 'listingapp_main',
          fulfillmentPolicyId: '123',
          paymentPolicyId: '456',
          returnPolicyId: '789'
        }),
        update: vi.fn().mockResolvedValue({})
      };
    }
  };
});

describe('EbayAdapter', () => {
  let adapter: EbayAdapter;

  beforeEach(() => {
    adapter = new EbayAdapter();
    vi.clearAllMocks();
  });

  it('1. Returns correct marketplace ID', () => {
    expect(adapter.getMarketplaceId()).toBe('EBAY');
  });

  it('2. Maps condition correctly', async () => {
    const input = {
      title: 'Item',
      description: 'Desc',
      price: 1000,
      imageUrls: [],
      condition: 'NEW'
    };

    // Setup fetch mocks for success
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) }) // Refresh
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // Inventory
      .mockResolvedValueOnce({ ok: true, json: async () => ({ offerId: '123' }) }) // Offer
      .mockResolvedValueOnce({ ok: true, json: async () => ({ listingId: '456' }) }); // Publish

    await adapter.createListing('user-1', 'acc-1', input);

    // Verify inventory payload condition
    const invCall = mockFetch.mock.calls[1];
    expect(invCall[0]).toContain('/sell/inventory/v1/inventory_item/');
    const payload = JSON.parse(invCall[1].body);
    expect(payload.condition).toBe('NEW');
  });

  it('3. Prepares listing payload correctly using cents to dollars conversion', async () => {
    const input = {
      title: 'Cool Shirt',
      description: 'Very cool',
      price: 1550, // $15.50
      imageUrls: ['http://img.com/1.jpg'],
      category: '12345'
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ offerId: '123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ listingId: '456' }) });

    await adapter.createListing('user-1', 'acc-1', input);

    // Check Offer payload for price conversion
    const offerCall = mockFetch.mock.calls[2];
    expect(offerCall[0]).toContain('/sell/inventory/v1/offer');
    const offerPayload = JSON.parse(offerCall[1].body);
    
    expect(offerPayload.pricingSummary.price.value).toBe('15.50');
    expect(offerPayload.categoryId).toBe('12345');
  });

  it('4. Returns MANUAL_REQUIRED if category is missing', async () => {
    const input = {
      title: 'Cool Shirt',
      description: 'Very cool',
      price: 1550,
      imageUrls: []
      // No category
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const result = await adapter.createListing('user-1', 'acc-1', input);

    expect(result.status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.VALIDATION);
  });

  it('5. Normalizes eBay API errors', async () => {
    const input = {
      title: 'Cool Shirt',
      description: 'Very cool',
      price: 1550,
      imageUrls: [],
      category: '123'
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) }) // Refresh
      .mockResolvedValueOnce({ 
        ok: false, 
        json: async () => ({ errors: [{ message: 'Invalid item data' }] }) 
      }); // Inventory fails

    const result = await adapter.createListing('user-1', 'acc-1', input);

    expect(result.status).toBe(MarketplaceOperationStatus.FAILED);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.VALIDATION);
  });

  it('6. Normalizes successful result with composite externalListingId', async () => {
    const input = {
      title: 'Cool Shirt',
      description: 'Very cool',
      price: 1550,
      imageUrls: [],
      category: '123'
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ offerId: 'offer-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ listingId: 'ebay-list-789' }) });

    const result = await adapter.createListing('user-1', 'acc-1', input);

    expect(result.status).toBe(MarketplaceOperationStatus.SUCCESS);
    expect(result.externalListingId).toContain('ebay-list-789:offer-123:');
    expect(result.externalOfferId).toBe('offer-123');
    expect(result.externalListingUrl).toBe('https://www.ebay.com/itm/ebay-list-789');
  });

  it('7. Handles authentication refresh failure', async () => {
    const input = {
      title: 'Cool Shirt',
      description: 'Very cool',
      price: 1550,
      imageUrls: [],
      category: '123'
    };

    // Refresh fails
    mockFetch.mockResolvedValueOnce({ 
      ok: false, 
      json: async () => ({ error: 'invalid_grant' }) 
    });

    const result = await adapter.createListing('user-1', 'acc-1', input);

    expect(result.status).toBe(MarketplaceOperationStatus.FAILED);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.AUTHENTICATION);
  });

  it('8. Exposes accurate capabilities', () => {
    const caps = adapter.getCapabilities();
    expect(caps.createListing).toBe(true);
    expect(caps.endListing).toBe(true);
    expect(caps.manualOnly).toBe(false);
  });

  it('9. Ends listing successfully using withdraw offer API when offerId is present', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) }) // Refresh
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Withdraw

    const result = await adapter.endListing('user-1', 'acc-1', 'listing-789:offer-456:sku-1');

    expect(result.status).toBe(MarketplaceOperationStatus.SUCCESS);
    const withdrawCall = mockFetch.mock.calls[1];
    expect(withdrawCall[0]).toContain('/sell/inventory/v1/offer/offer-456/withdraw');
    expect(withdrawCall[1].method).toBe('POST');
  });

  it('10. Returns MANUAL_REQUIRED when delisting without offerId', async () => {
    const result = await adapter.endListing('user-1', 'acc-1', 'listing-789-raw-only');
    expect(result.status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
    expect(result.requiresManualAction).toBe(true);
  });
});
