import { describe, it, expect } from 'vitest';
import { ManualMarketplaceAdapter } from './manual.adapter';
import { MarketplaceErrorCategory, MarketplaceOperationStatus } from '../marketplace.types';

describe('ManualMarketplaceAdapter', () => {
  it('1. Reports correct marketplace id', () => {
    const adapter = new ManualMarketplaceAdapter('POSHMARK', 'Poshmark');
    expect(adapter.getMarketplaceId()).toBe('POSHMARK');
  });

  it('2. Reports manual-only capabilities honestly', () => {
    const adapter = new ManualMarketplaceAdapter('MERCARI', 'Mercari');
    const caps = adapter.getCapabilities();

    expect(caps.manualOnly).toBe(true);
    expect(caps.connect).toBe(false);
    expect(caps.createListing).toBe(false);
    expect(caps.updateListing).toBe(false);
    expect(caps.endListing).toBe(false);
    expect(adapter.supportsCreateListing()).toBe(false);
    expect(adapter.supportsEndListing()).toBe(false);
  });

  it('3. createListing returns MANUAL_REQUIRED with clear message', async () => {
    const adapter = new ManualMarketplaceAdapter('DEPOP', 'Depop');
    const result = await adapter.createListing('user-1', 'acc-1', {
      title: 'Vintage Jacket',
      description: 'Cool jacket',
      price: 2500,
      imageUrls: [],
    });

    expect(result.status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
    expect(result.requiresManualAction).toBe(true);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.UNSUPPORTED);
    expect(result.error?.message).toContain('Depop');
  });

  it('4. endListing returns MANUAL_REQUIRED with clear message', async () => {
    const adapter = new ManualMarketplaceAdapter('FACEBOOK', 'Facebook Marketplace');
    const result = await adapter.endListing('user-1', 'acc-1', 'ext-123');

    expect(result.status).toBe(MarketplaceOperationStatus.MANUAL_REQUIRED);
    expect(result.requiresManualAction).toBe(true);
    expect(result.error?.category).toBe(MarketplaceErrorCategory.UNSUPPORTED);
    expect(result.error?.message).toContain('Facebook Marketplace');
  });
});
