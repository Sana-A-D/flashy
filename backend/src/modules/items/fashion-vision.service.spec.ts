import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FashionVisionService } from './fashion-vision.service';

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

describe('FashionVisionService (Gemini Integration & Anti-Hallucination)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws an error if GEMINI_API_KEY is missing or dummy', async () => {
    delete process.env.GEMINI_API_KEY;
    const service = new FashionVisionService();

    await expect(
      service.analyzeFashionImages([{ buffer: Buffer.from('fake'), mimeType: 'image/jpeg' }])
    ).rejects.toThrow('PROVIDER_CONFIG_ERROR');
  });

  it('correctly cleans markdown json fences and returns structured fashion analysis', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-test';

    const mockAnalysisOutput = {
      identification: {
        category: 'Tops',
        garmentType: 'Cable-knit Wool Sweater',
        color: 'Oatmeal',
        secondaryColors: [],
        material: 'Wool',
        materialBasis: 'INFERRED',
        possibleBrand: null,
        brandBasis: 'UNKNOWN',
        brandConfidence: 'LOW',
        confidence: 0.92,
      },
      terminology: {
        primarySearchPhrase: 'oatmeal cable knit wool sweater',
        alternativeSearchPhrases: ['cream chunky knit crewneck', 'cableknit winter sweater'],
        fashionTerminology: ['cable-knit', 'chunky knit', 'ribbed cuffs'],
        marketplaceKeywords: ['sweater', 'wool', 'winter', 'knitwear'],
        tags: ['knitwear', 'cozy', 'minimalist'],
      },
      buyerProfile: {
        buyerTypes: ['Winter fashion shoppers', 'Minimalist wardrobe builders'],
        useCases: ['Cold weather layering', 'Casual weekend wear'],
        searchIntent: ['Looking for warm wool knitwear'],
        stylePreferences: ['Neutral earth tones', 'Quality knits'],
      },
      marketplaces: [
        {
          marketplace: 'eBay',
          relevance: 'HIGH',
          fitReason: 'High demand for wool knitwear in autumn/winter seasons',
          recommendedPositioning: 'Emphasize cable pattern and fabric texture in title',
          keywords: ['wool', 'sweater', 'cableknit'],
        },
      ],
      listing: {
        title: 'Cable-Knit Wool Crewneck Sweater Oatmeal Neutral',
        description: 'Chunky cable-knit wool sweater in versatile oatmeal shade with ribbed collar and cuffs.',
        keywords: ['wool sweater', 'cable knit', 'winter top'],
        tags: ['wool', 'cableknit', 'sweater'],
        attributeFields: {
          Category: 'Tops',
          Material: 'Wool',
          Color: 'Oatmeal',
        },
      },
      styleIdeas: [],
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: '```json\n' + JSON.stringify(mockAnalysisOutput) + '\n```',
    });

    const service = new FashionVisionService();
    const result = await service.analyzeFashionImages([
      { buffer: Buffer.from('test-image-bytes'), mimeType: 'image/jpeg' },
    ]);

    expect(result.identification.garmentType).toBe('Cable-knit Wool Sweater');
    expect(result.identification.possibleBrand).toBeNull();
    expect(result.identification.brandBasis).toBe('UNKNOWN');
    expect(result.terminology.primarySearchPhrase).toBe('oatmeal cable knit wool sweater');
    expect(result.marketplaces[0]?.marketplace).toBe('eBay');
    expect(result.listing.title).toContain('Cable-Knit Wool Crewneck');
  });
});
