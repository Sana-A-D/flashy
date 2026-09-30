import { z } from 'zod';

export const VisualAttributeBasisSchema = z.enum(['OBSERVED', 'INFERRED', 'UNKNOWN']);
export type VisualAttributeBasis = z.infer<typeof VisualAttributeBasisSchema>;

export const ConfidenceScoreSchema = z.number().min(0).max(1).nullable().optional();
export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const IdentificationLevelSchema = z.enum([
  'EXACT_MATCH',
  'STRONG_MATCH',
  'CLOSE_MATCH',
  'CATEGORY_ONLY',
  'UNKNOWN',
]);
export type IdentificationLevel = z.infer<typeof IdentificationLevelSchema>;

// Detailed visual evidence & extracted attributes
export const VisualIdentificationSchema = z.object({
  category: z.string().nullable().optional(),
  garmentType: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  intendedUse: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  secondaryColors: z.array(z.string()).default([]),
  colorFamily: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  materialBasis: VisualAttributeBasisSchema.default('UNKNOWN'),
  fit: z.string().nullable().optional(),
  silhouette: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  aesthetics: z.array(z.string()).default([]),
  season: z.string().nullable().optional(),
  genderPresentation: z.string().nullable().optional(),
  
  // Specific brand, model and verifiable identification evidence
  possibleBrand: z.string().nullable().optional(),
  brandEvidence: z.string().nullable().optional(),
  brandBasis: VisualAttributeBasisSchema.default('UNKNOWN'),
  brandConfidence: ConfidenceLevelSchema.default('LOW'),
  
  // Extracted identifiers & codes
  productCode: z.string().nullable().optional(),      // SKU / style code / model number
  styleCode: z.string().nullable().optional(),        // e.g. "501-0115" or "CW2288-111"
  modelNumber: z.string().nullable().optional(),
  extractedText: z.array(z.string()).default([]),      // Any OCR / readable text on garment, tags, care labels
  visibleLabels: z.array(z.string()).default([]),     // Neck label, care label, flag tags observed
  distinctiveGraphics: z.array(z.string()).default([]),// Logos, screenprints, embroidery
  hardware: z.string().nullable().optional(),         // e.g. "YKK zip", "brass branded rivets"
  collarNeckline: z.string().nullable().optional(),   // e.g. "Ribbed crewneck", "Spread collar"
  sleeveType: z.string().nullable().optional(),       // e.g. "Raglan long sleeves", "Short sleeve"
  closureType: z.string().nullable().optional(),      // e.g. "Button placket", "Full zip", "Pullover"
  pockets: z.string().nullable().optional(),          // e.g. "Dual chest patch pockets", "Kangaroo pocket"
  stitching: z.string().nullable().optional(),        // e.g. "Contrast chain-stitching", "Single-stitch hem"
  countryOfManufacture: z.string().nullable().optional(), // From care/neck tag if visible
  
  // Identification evaluation & confidence tiering
  identificationLevel: IdentificationLevelSchema.default('CATEGORY_ONLY'),
  exactModelVerified: z.boolean().default(false),
  verifiedProductName: z.string().nullable().optional(),
  identificationNotes: z.string().nullable().optional(),
  
  possibleEra: z.string().nullable().optional(),
  eraConfidence: ConfidenceLevelSchema.default('LOW'),
  condition: z.string().nullable().optional(),
  conditionAssessment: z.string().nullable().optional(),
  visibleFlaws: z.array(z.string()).default([]),
  distinctiveFeatures: z.array(z.string()).default([]),
  constructionDetails: z.array(z.string()).default([]),
  confidence: ConfidenceScoreSchema,
  notes: z.string().nullable().optional(),
});
export type VisualIdentification = z.infer<typeof VisualIdentificationSchema>;

// Searchable terminology (Phase 5)
export const FashionTerminologySchema = z.object({
  primarySearchPhrase: z.string().default(''),
  alternativeSearchPhrases: z.array(z.string()).default([]),
  fashionTerminology: z.array(z.string()).default([]),
  buyerFacingTerminology: z.array(z.string()).default([]),
  resellerTerminology: z.array(z.string()).default([]),
  marketplaceKeywords: z.array(z.string()).default([]),
  longTailKeywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});
export type FashionTerminology = z.infer<typeof FashionTerminologySchema>;

// Buyer profile & audience context (Phase 10)
export const BuyerProfileSchema = z.object({
  buyerTypes: z.array(z.string()).default([]),
  useCases: z.array(z.string()).default([]),
  searchIntent: z.array(z.string()).default([]),
  stylePreferences: z.array(z.string()).default([]),
  seasonalDemand: z.string().nullable().optional(),
});
export type BuyerProfile = z.infer<typeof BuyerProfileSchema>;

// Marketplace suitability analysis (Phase 9)
export const MarketplaceSuitabilitySchema = z.object({
  marketplace: z.string(), // eBay, Poshmark, Mercari, Depop, Etsy, etc.
  relevance: ConfidenceLevelSchema.default('MEDIUM'),
  fitReason: z.string(),
  recommendedPositioning: z.string(),
  keywords: z.array(z.string()).default([]),
  pricingConsiderations: z.string().nullable().optional(),
});
export type MarketplaceSuitability = z.infer<typeof MarketplaceSuitabilitySchema>;

// Listing draft recommendations (Phase 11)
export const FashionListingDraftSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  attributeFields: z.record(z.string(), z.string()).default({}),
});
export type FashionListingDraft = z.infer<typeof FashionListingDraftSchema>;

// Style ideas & outfits
export const StylePieceBreakdownSchema = z.object({
  category: z.string(), // 'Scanned Item' | 'Bottom' | 'Top' | 'Layer' | 'Shoes' | 'Accessories'
  label: z.string(),    // e.g. 'YOUR ITEM (Striped Polo)' or 'Relaxed Straight Denim'
  isScannedItem: z.boolean().default(false),
  searchQuery: z.string().optional(),
});
export const ShopLookPieceSchema = z.object({
  category: z.string(),
  title: z.string(),
  price: z.number().nullable().optional(),
  currency: z.string().default('USD'),
  store: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isScannedItem: z.boolean().default(false),
});
export type ShopLookPiece = z.infer<typeof ShopLookPieceSchema>;

export const StyleIdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  aesthetic: z.string(),
  description: z.string(),
  whyItWorks: z.string().optional(),
  pieces: z.array(z.string()),
  breakdown: z.array(StylePieceBreakdownSchema).default([]),
  colors: z.array(z.string()).default([]),
  occasion: z.string().optional(),
  season: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  
  // Grounded Outfit Architecture & Scanned Item Lock
  scannedItemAnchor: z.object({
    category: z.string(),
    color: z.string(),
    pattern: z.string().nullable().optional(),
    silhouette: z.string().nullable().optional(),
    distinctiveDetails: z.array(z.string()).default([]),
    isLocked: z.boolean().default(true),
  }).optional(),
  imagePrompt: z.string().optional(),
  visualizationQuality: z.enum(['GROUNDED_VERIFIED', 'INSPIRATION', 'UNAVAILABLE']).default('INSPIRATION'),
  shopPieces: z.array(ShopLookPieceSchema).default([]),
});
export type StyleIdea = z.infer<typeof StyleIdeaSchema>;

// Trend signals
export const TrendSignalSchema = z.object({
  type: z.string(),
  signal: z.string(),
  evidence: z.string().nullable().optional(),
  trendStrength: z.string().nullable().optional(),
  trendDirection: z.enum(['RISING', 'STABLE', 'DECLINING', 'UNKNOWN']).default('UNKNOWN'),
  sourcesCount: z.number().default(0),
});
export type TrendSignal = z.infer<typeof TrendSignalSchema>;

// Price tiers
export const PriceTierSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  median: z.number().nullable(),
  average: z.number().nullable(),
  currency: z.string().default('USD'),
  sampleSize: z.number().default(0),
  source: z.string().nullable().optional(),
  retrievedAt: z.string().nullable().optional(),
});
export type PriceTier = z.infer<typeof PriceTierSchema>;

// Price intelligence (Phase 7 & 12)
export const PriceIntelligenceSchema = z.object({
  status: z.enum(['AVAILABLE', 'INSUFFICIENT_DATA', 'UNAVAILABLE']).default('UNAVAILABLE'),
  unbranded: PriceTierSchema.nullable().optional(),
  branded: PriceTierSchema.nullable().optional(),
  premium: PriceTierSchema.nullable().optional(),
  resale: PriceTierSchema.nullable().optional(),
  newPrice: PriceTierSchema.nullable().optional(),
  suggestedListingPrice: PriceTierSchema.nullable().optional(),
  quickSalePrice: PriceTierSchema.nullable().optional(),
  highEndPrice: PriceTierSchema.nullable().optional(),
  message: z.string().default('Not enough verified price data.'),
});
export type PriceIntelligence = z.infer<typeof PriceIntelligenceSchema>;

// Comparable product (Phase 8)
export const SimilarItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  brand: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().default('USD'),
  condition: z.string().nullable().optional(),
  source: z.string(),
  sourceName: z.string(),
  url: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  tier: z.enum(['CHEAPER', 'COMPARABLE', 'PREMIUM']).default('COMPARABLE'),
  matchType: z.enum(['EXACT_MATCH', 'CLOSE_MATCH', 'STYLE_MATCH']).default('STYLE_MATCH'),
  relevanceReason: z.string().nullable().optional(),
  retrievedAt: z.string(),
});
export type SimilarItem = z.infer<typeof SimilarItemSchema>;

// Complete Unified Fashion Intelligence Response Schema (Phase 15)
export const FashionItemResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  fit: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  status: z.string(),
  photos: z.array(z.any()).default([]),
  images: z.array(z.any()).default([]),
  
  // Intelligence sections
  identification: VisualIdentificationSchema.nullable().optional(),
  terminology: FashionTerminologySchema.optional(),
  buyerProfile: BuyerProfileSchema.optional(),
  marketplaces: z.array(MarketplaceSuitabilitySchema).default([]),
  listing: FashionListingDraftSchema.optional(),
  
  trendSignals: z.object({
    status: z.enum(['AVAILABLE', 'INSUFFICIENT_DATA', 'UNAVAILABLE']).default('UNAVAILABLE'),
    message: z.string().default('Not enough current trend data to verify.'),
    signals: z.array(TrendSignalSchema).default([]),
  }),
  styleIdeas: z.array(StyleIdeaSchema).default([]),
  // Same-item Multi-Seller Market Comparison Grouping
  matchedProducts: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    brand: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    matchType: z.enum(['EXACT_MATCH', 'CLOSE_MATCH', 'STYLE_MATCH']).default('EXACT_MATCH'),
    listings: z.array(z.object({
      id: z.string(),
      seller: z.string(),
      marketplace: z.string(),
      price: z.number().nullable().optional(),
      currency: z.string().default('USD'),
      condition: z.string().nullable().optional(),
      url: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
    })),
    priceSummary: z.object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      median: z.number().nullable().optional(),
      average: z.number().nullable().optional(),
      currency: z.string().default('USD'),
      sampleSize: z.number().default(0),
    }),
  })).default([]),
  
  pricing: PriceIntelligenceSchema,
  similarItems: z.array(SimilarItemSchema).default([]),
  cheaperAlternatives: z.array(SimilarItemSchema).default([]),
  research: z.object({
    status: z.enum(['NOT_STARTED', 'RESEARCHING', 'PARTIAL', 'COMPLETE', 'FAILED']).default('NOT_STARTED'),
    researchedAt: z.string().nullable().optional(),
    sources: z.array(z.object({
      name: z.string(),
      type: z.string(),
      count: z.number(),
    })).default([]),
    queries: z.object({
      primaryQuery: z.string(),
      specificQuery: z.string(),
      broadQuery: z.string(),
    }).nullable().optional(),
  }).optional(),
  saved: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FashionItemResponse = z.infer<typeof FashionItemResponseSchema>;

export const UpdateFashionItemSchema = z.object({
  title: z.string().optional(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  garmentType: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  secondaryColors: z.array(z.string()).optional(),
  pattern: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  fit: z.string().nullable().optional(),
  silhouette: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  distinctiveFeatures: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});
export type UpdateFashionItemDto = z.infer<typeof UpdateFashionItemSchema>;
