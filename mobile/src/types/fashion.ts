export type VisualAttributeBasis = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type IdentificationLevel =
  | 'EXACT_MATCH'
  | 'STRONG_MATCH'
  | 'CLOSE_MATCH'
  | 'CATEGORY_ONLY'
  | 'UNKNOWN';

export interface VisualIdentification {
  category: string | null;
  garmentType: string | null;
  subcategory?: string | null;
  itemType?: string | null;
  intendedUse?: string | null;
  color: string | null;
  secondaryColors: string[];
  colorFamily?: string | null;
  pattern: string | null;
  material: string | null;
  materialBasis: VisualAttributeBasis;
  fit: string | null;
  silhouette?: string | null;
  style: string | null;
  aesthetics?: string[];
  season?: string | null;
  genderPresentation?: string | null;
  
  // Brand, Model and Evidence
  possibleBrand: string | null;
  brandEvidence?: string | null;
  brandBasis: VisualAttributeBasis;
  brandConfidence?: ConfidenceLevel;
  
  // Specific identifiers
  productCode?: string | null;
  styleCode?: string | null;
  modelNumber?: string | null;
  extractedText?: string[];
  visibleLabels?: string[];
  distinctiveGraphics?: string[];
  hardware?: string | null;
  collarNeckline?: string | null;
  sleeveType?: string | null;
  closureType?: string | null;
  pockets?: string | null;
  stitching?: string | null;
  countryOfManufacture?: string | null;
  
  // Identification level & verification status
  identificationLevel?: IdentificationLevel;
  exactModelVerified?: boolean;
  verifiedProductName?: string | null;
  identificationNotes?: string | null;

  possibleEra?: string | null;
  eraConfidence?: ConfidenceLevel;
  condition?: string | null;
  conditionAssessment?: string | null;
  visibleFlaws?: string[];
  distinctiveFeatures: string[];
  constructionDetails?: string[];
  confidence: number | null;
  notes?: string | null;
}

export interface FashionTerminology {
  primarySearchPhrase: string;
  alternativeSearchPhrases: string[];
  fashionTerminology: string[];
  buyerFacingTerminology: string[];
  resellerTerminology: string[];
  marketplaceKeywords: string[];
  longTailKeywords: string[];
  tags: string[];
}

export interface BuyerProfile {
  buyerTypes: string[];
  useCases: string[];
  searchIntent: string[];
  stylePreferences: string[];
  seasonalDemand?: string | null;
}

export interface MarketplaceSuitability {
  marketplace: string;
  relevance: ConfidenceLevel;
  fitReason: string;
  recommendedPositioning: string;
  keywords: string[];
  pricingConsiderations?: string | null;
}

export interface FashionListingDraft {
  title: string;
  description: string;
  keywords: string[];
  tags: string[];
  attributeFields: Record<string, string>;
}

export interface StylePieceBreakdown {
  category: string;
  label: string;
  isScannedItem?: boolean;
  searchQuery?: string;
}

export interface ShopLookPiece {
  category: string;
  title: string;
  price?: number | null;
  currency: string;
  store?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  isScannedItem?: boolean;
}

export interface StyleIdea {
  id: string;
  title: string;
  aesthetic: string;
  description: string;
  whyItWorks?: string;
  pieces: string[];
  breakdown?: StylePieceBreakdown[];
  colors?: string[];
  occasion?: string;
  season?: string;
  imageUrl?: string | null;
  scannedItemAnchor?: {
    category: string;
    color: string;
    pattern?: string | null;
    silhouette?: string | null;
    distinctiveDetails: string[];
    isLocked: boolean;
  };
  imagePrompt?: string;
  visualizationQuality?: 'GROUNDED_VERIFIED' | 'INSPIRATION' | 'UNAVAILABLE';
  shopPieces?: ShopLookPiece[];
}

export interface TrendSignal {
  type: string;
  signal: string;
  evidence?: string | null;
  trendStrength?: string | null;
  trendDirection?: 'RISING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
  sourcesCount: number;
}

export interface PriceTier {
  min: number | null;
  max: number | null;
  median: number | null;
  average: number | null;
  currency: string;
  sampleSize: number;
  source?: string | null;
  retrievedAt?: string | null;
}

export interface PriceIntelligence {
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
  unbranded?: PriceTier | null;
  branded?: PriceTier | null;
  premium?: PriceTier | null;
  resale?: PriceTier | null;
  newPrice?: PriceTier | null;
  suggestedListingPrice?: PriceTier | null;
  quickSalePrice?: PriceTier | null;
  highEndPrice?: PriceTier | null;
  message: string;
}

export interface SimilarItem {
  id: string;
  title: string;
  brand?: string | null;
  price?: number | null;
  currency: string;
  condition?: string | null;
  source: string;
  sourceName: string;
  url?: string | null;
  imageUrl?: string | null;
  tier: 'CHEAPER' | 'COMPARABLE' | 'PREMIUM';
  matchType?: 'EXACT_MATCH' | 'CLOSE_MATCH' | 'STYLE_MATCH';
  relevanceReason?: string | null;
  retrievedAt: string;
}

export interface FashionPhoto {
  id: string;
  url?: string | null;
  isPrimary?: boolean;
  storageKey?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
}

export interface MatchedProductListing {
  id: string;
  seller: string;
  marketplace: string;
  price?: number | null;
  currency: string;
  condition?: string | null;
  url?: string | null;
  imageUrl?: string | null;
}

export interface MatchedProduct {
  productId: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  matchType: 'EXACT_MATCH' | 'CLOSE_MATCH' | 'STYLE_MATCH';
  listings: MatchedProductListing[];
  priceSummary: {
    min?: number | null;
    max?: number | null;
    median?: number | null;
    average?: number | null;
    currency: string;
    sampleSize: number;
  };
}

export interface FashionItem {
  id: string;
  userId: string;
  title: string;
  brand?: string | null;
  category?: string | null;
  color?: string | null;
  pattern?: string | null;
  material?: string | null;
  fit?: string | null;
  style?: string | null;
  era?: string | null;
  status: string;
  photos: FashionPhoto[];
  images?: FashionPhoto[];
  
  // Rich intelligence fields
  identification?: VisualIdentification | null;
  terminology?: FashionTerminology;
  buyerProfile?: BuyerProfile;
  marketplaces?: MarketplaceSuitability[];
  listing?: FashionListingDraft;

  trendSignals: {
    status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
    message: string;
    signals: TrendSignal[];
  };
  styleIdeas: StyleIdea[];
  matchedProducts?: MatchedProduct[];
  pricing: PriceIntelligence;
  similarItems: SimilarItem[];
  cheaperAlternatives?: SimilarItem[];
  research?: {
    status: 'NOT_STARTED' | 'RESEARCHING' | 'PARTIAL' | 'COMPLETE' | 'FAILED';
    researchedAt?: string | null;
    sources: Array<{ name: string; type: string; count: number }>;
    queries?: {
      primaryQuery: string;
      specificQuery: string;
      broadQuery: string;
    } | null;
  };
  saved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFashionItemPayload {
  title?: string;
  brand?: string | null;
  category?: string | null;
  garmentType?: string | null;
  color?: string | null;
  secondaryColors?: string[];
  pattern?: string | null;
  material?: string | null;
  fit?: string | null;
  silhouette?: string | null;
  style?: string | null;
  season?: string | null;
  era?: string | null;
  distinctiveFeatures?: string[];
  notes?: string | null;
}
