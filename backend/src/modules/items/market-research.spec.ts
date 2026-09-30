import { describe, it, expect } from 'vitest';
import { DefaultMarketResearchProvider } from './providers/market-research.provider';

describe('DefaultMarketResearchProvider', () => {
  const provider = new DefaultMarketResearchProvider();

  it('reports soldPriceStatus as UNAVAILABLE and does not fabricate prices when real comps are missing', async () => {
    const research = await provider.researchMarket({
      title: 'Nike Air Jordan 1 Retro High OG Size 10',
      brand: 'Nike',
      category: 'Sneakers',
      condition: 'GOOD',
    });

    expect(research).toBeDefined();
    expect(research.status).toBe('NO_COMPS_FOUND');
    expect(research.originalRetailPrice).toBeNull();
    expect(research.resaleMedian).toBeNull();
    expect(research.resaleLow).toBeNull();
    expect(research.resaleHigh).toBeNull();
    expect(research.soldPriceStatus).toBe('UNAVAILABLE');
    expect(research.queryTerms).toContain('Nike');
    expect(research.factors.length).toBeGreaterThan(0);
    expect(research.factors.some(f => f.includes('unavailable'))).toBe(true);
  });

  it('constructs accurate search query terms from item attributes', async () => {
    const res = await provider.researchMarket({
      title: 'Sony WH-1000XM5 Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Electronics',
      condition: 'NEW',
    });

    expect(res.queryTerms).toBe('Sony WH-1000XM5 Electronics');
    expect(res.soldPriceStatus).toBe('UNAVAILABLE');
  });
});


