import { PrismaClient } from '@prisma/client';
import { storageService } from '../storage/storage.service';
import { fashionVisionService } from './fashion-vision.service';
import {
  FashionItemResponse,
  UpdateFashionItemDto,
  VisualIdentification,
  PriceIntelligence,
} from './fashion.schema';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';
import { fashionResearchEngine } from './research/research-engine';

const prisma = new PrismaClient();

export class FashionService {
  /**
   * Helper to map Prisma Item + ItemRecognition + PricingResearch into a clean FashionItemResponse
   */
  static formatFashionItem(item: any): FashionItemResponse {
    const rec = item.recognition;
    const rawAi = rec?.rawResponse as any;

    const identification: VisualIdentification | null = rec
      ? {
          category: rec.category || item.category || null,
          garmentType: rawAi?.identification?.garmentType || item.title || null,
          subcategory: rawAi?.identification?.subcategory || null,
          itemType: rawAi?.identification?.itemType || null,
          intendedUse: rawAi?.identification?.intendedUse || null,
          color: rec.color || item.color || null,
          secondaryColors: rec.secondaryColors || [],
          colorFamily: rawAi?.identification?.colorFamily || null,
          pattern: rec.pattern || null,
          material: rec.material || null,
          fit: rawAi?.identification?.fit || null,
          silhouette: rawAi?.identification?.silhouette || null,
          style: rec.style || null,
          aesthetics: rawAi?.identification?.aesthetics || [],
          season: rawAi?.identification?.season || null,
          genderPresentation: rec.audience || rawAi?.identification?.genderPresentation || null,
          possibleBrand: rec.brand || item.brand || null,
          brandEvidence: rawAi?.identification?.brandEvidence || null,
          brandBasis: rawAi?.identification?.brandBasis || (rec.brand ? 'OBSERVED' : 'UNKNOWN'),
          brandConfidence: rawAi?.identification?.brandConfidence || 'LOW',

          // Exact Identifiers & Evidence
          productCode: rawAi?.identification?.productCode || null,
          styleCode: rawAi?.identification?.styleCode || null,
          modelNumber: rawAi?.identification?.modelNumber || null,
          extractedText: rawAi?.identification?.extractedText || [],
          visibleLabels: rawAi?.identification?.visibleLabels || [],
          distinctiveGraphics: rawAi?.identification?.distinctiveGraphics || [],
          hardware: rawAi?.identification?.hardware || null,
          collarNeckline: rawAi?.identification?.collarNeckline || null,
          sleeveType: rawAi?.identification?.sleeveType || null,
          closureType: rawAi?.identification?.closureType || null,
          pockets: rawAi?.identification?.pockets || null,
          stitching: rawAi?.identification?.stitching || null,
          countryOfManufacture: rawAi?.identification?.countryOfManufacture || null,

          // Identification Confidence & Verification
          identificationLevel: rawAi?.identification?.identificationLevel || (rec.brand ? 'STRONG_MATCH' : 'CATEGORY_ONLY'),
          exactModelVerified: Boolean(rawAi?.identification?.exactModelVerified),
          verifiedProductName: rawAi?.identification?.verifiedProductName || null,
          identificationNotes: rawAi?.identification?.identificationNotes || null,

          possibleEra: rec.notes?.includes('Era:') ? rec.notes : rawAi?.identification?.possibleEra || null,
          eraConfidence: rawAi?.identification?.eraConfidence || 'LOW',
          condition: rawAi?.identification?.condition || item.condition || null,
          conditionAssessment: rawAi?.identification?.conditionAssessment || null,
          visibleFlaws: rawAi?.identification?.visibleFlaws || [],
          distinctiveFeatures: rec.visibleFeatures || rawAi?.identification?.distinctiveFeatures || [],
          constructionDetails: rawAi?.identification?.constructionDetails || [],
          confidence: rec.confidence ?? null,
          materialBasis: rawAi?.identification?.materialBasis || (rec.material ? 'INFERRED' : 'UNKNOWN'),
          notes: rec.notes || null,
        }
      : null;

    const idf = identification;

    const styleIdeas = rawAi?.styleIdeas || [
      {
        id: 'look-casual',
        title: 'Casual',
        aesthetic: 'Everyday Relaxed',
        description: `Scanned ${idf?.garmentType || item.title || 'piece'} paired with relaxed straight-leg blue jeans and clean white sneakers.`,
        whyItWorks: 'The relaxed denim balances the piece while keeping the color palette effortless and neutral.',
        pieces: [
          `YOUR ITEM: ${idf?.garmentType || item.title || 'Scanned Piece'}`,
          'Relaxed straight-leg blue jeans',
          'Clean low-profile white sneakers',
          'Minimal silver wrist watch',
        ],
        breakdown: [
          { category: 'Scanned Item', label: `YOUR ITEM (${idf?.garmentType || 'Piece'})`, isScannedItem: true },
          { category: 'Bottom', label: 'Relaxed straight-leg blue jeans', isScannedItem: false, searchQuery: 'relaxed straight leg denim jeans' },
          { category: 'Shoes', label: 'Clean low-profile white sneakers', isScannedItem: false, searchQuery: 'white low profile sneakers' },
          { category: 'Accessories', label: 'Minimal silver wrist watch', isScannedItem: false, searchQuery: 'minimalist silver watch' },
        ],
        colors: [idf?.color || 'Neutral', 'White', 'Light Denim'],
        occasion: 'Casual',
        season: 'All season',
      },
      {
        id: 'look-smart',
        title: 'Clean / Smart Casual',
        aesthetic: 'Refined Tailoring',
        description: `Scanned ${idf?.garmentType || item.title || 'piece'} paired with pleated neutral trousers and classic leather loafers.`,
        whyItWorks: 'Structured trousers elevate the silhouette for dinner, social events, or a polished workplace.',
        pieces: [
          `YOUR ITEM: ${idf?.garmentType || item.title || 'Scanned Piece'}`,
          'Pleated beige neutral trousers',
          'Classic leather penny loafers',
          'Cognac leather dress belt',
        ],
        breakdown: [
          { category: 'Scanned Item', label: `YOUR ITEM (${idf?.garmentType || 'Piece'})`, isScannedItem: true },
          { category: 'Bottom', label: 'Pleated beige trousers', isScannedItem: false, searchQuery: 'pleated beige neutral trousers' },
          { category: 'Shoes', label: 'Classic leather penny loafers', isScannedItem: false, searchQuery: 'leather penny loafers' },
          { category: 'Accessories', label: 'Cognac leather dress belt', isScannedItem: false, searchQuery: 'cognac leather belt' },
        ],
        colors: ['Beige', idf?.color || 'Navy', 'Cognac Brown'],
        occasion: 'Work',
        season: 'All season',
      },
      {
        id: 'look-street',
        title: 'Streetwear',
        aesthetic: 'Modern Urban',
        description: `Scanned ${idf?.garmentType || item.title || 'piece'} layered with wide-leg utility pants and retro runner sneakers.`,
        whyItWorks: 'Exaggerated proportions and functional technical accessories lend an effortless contemporary edge.',
        pieces: [
          `YOUR ITEM: ${idf?.garmentType || item.title || 'Scanned Piece'}`,
          'Wide-leg black utility trousers',
          'Chunky retro runner sneakers',
          'Nylon crossbody sling bag',
        ],
        breakdown: [
          { category: 'Scanned Item', label: `YOUR ITEM (${idf?.garmentType || 'Piece'})`, isScannedItem: true },
          { category: 'Bottom', label: 'Wide-leg black utility trousers', isScannedItem: false, searchQuery: 'wide leg black utility pants' },
          { category: 'Shoes', label: 'Chunky retro runner sneakers', isScannedItem: false, searchQuery: 'retro runner sneakers' },
          { category: 'Accessories', label: 'Nylon crossbody sling bag', isScannedItem: false, searchQuery: 'nylon crossbody sling bag' },
        ],
        colors: ['Black', 'Graphite', 'White'],
        occasion: 'Weekend',
        season: 'All season',
      },
      {
        id: 'look-summer',
        title: 'Summer / Warm Weather',
        aesthetic: 'Resort Casual',
        description: `Scanned ${idf?.garmentType || item.title || 'piece'} paired with crisp cream linen-blend shorts and canvas deck shoes.`,
        whyItWorks: 'Breathable lightweight fabrics and light neutral tones highlight the item for warm days and travel.',
        pieces: [
          `YOUR ITEM: ${idf?.garmentType || item.title || 'Scanned Piece'}`,
          'Cream linen-blend relaxed shorts',
          'Clean canvas deck sneakers',
          'Tortoiseshell acetate sunglasses',
        ],
        breakdown: [
          { category: 'Scanned Item', label: `YOUR ITEM (${idf?.garmentType || 'Piece'})`, isScannedItem: true },
          { category: 'Bottom', label: 'Cream linen-blend shorts', isScannedItem: false, searchQuery: 'cream linen blend shorts' },
          { category: 'Shoes', label: 'Clean canvas deck sneakers', isScannedItem: false, searchQuery: 'canvas deck sneakers' },
          { category: 'Accessories', label: 'Tortoiseshell acetate sunglasses', isScannedItem: false, searchQuery: 'tortoise acetate sunglasses' },
        ],
        colors: ['Cream', 'Off-White', 'Tan'],
        occasion: 'Travel',
        season: 'Summer',
      },
    ];

    // Hydrate research results from rawAi?.research or pricingResearch if previously executed
    const cachedResearch = rawAi?.research;

    // HONEST DATA COMPLIANCE:
    // If research was run, use the verified aggregated prices; otherwise return honest UNAVAILABLE
    const pricing: PriceIntelligence = cachedResearch?.pricing || {
      status: 'UNAVAILABLE',
      unbranded: null,
      branded: null,
      premium: null,
      resale: null,
      newPrice: null,
      message: 'Not enough verified price data.',
    };

    const photos = (item.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      storageKey: img.storageKey,
      mimeType: img.mimeType,
      fileSize: img.fileSize,
      width: img.width,
      height: img.height,
    }));

    // Use item status: if INVENTORY or DRAFT with recognition, user has scanned or saved it
    const isSaved = item.status === 'INVENTORY';

    return {
      id: item.id,
      userId: item.userId,
      title: item.title || identification?.garmentType || 'Fashion Item',
      brand: item.brand || identification?.possibleBrand || null,
      category: item.category || identification?.category || null,
      color: item.color || identification?.color || null,
      pattern: identification?.pattern || null,
      material: identification?.material || null,
      fit: identification?.fit || null,
      style: identification?.style || null,
      era: identification?.possibleEra || null,
      status: item.status,
      photos,
      images: photos,
      identification,
      terminology: rawAi?.terminology || {
        primarySearchPhrase: [item.brand || identification?.possibleBrand, idf?.color || item.color, idf?.material, idf?.garmentType || item.title].filter(Boolean).join(' '),
        alternativeSearchPhrases: [],
        fashionTerminology: [],
        buyerFacingTerminology: [],
        resellerTerminology: [],
        marketplaceKeywords: [],
        longTailKeywords: [],
        tags: [],
      },
      buyerProfile: rawAi?.buyerProfile || {
        buyerTypes: [],
        useCases: [],
        searchIntent: [],
        stylePreferences: [],
        seasonalDemand: null,
      },
      marketplaces: rawAi?.marketplaces || [
        {
          marketplace: 'eBay',
          relevance: 'HIGH',
          fitReason: 'Active demand across apparel categories with high search intent',
          recommendedPositioning: 'Include key visual attributes in listing title and item specifics',
          keywords: ['fashion', 'apparel'],
          pricingConsiderations: 'Competitive resale pricing',
        },
        {
          marketplace: 'Poshmark',
          relevance: 'MEDIUM',
          fitReason: 'Social shopping community searching for trending styles and brand labels',
          recommendedPositioning: 'Style in cover photo with clean aesthetic',
          keywords: ['stylish', 'chic'],
          pricingConsiderations: 'Factor in offer room and bundle discounts',
        },
      ],
      listing: rawAi?.listing || {
        title: item.title || idf?.garmentType || 'Fashion Item',
        description: idf?.notes || item.description || '',
        keywords: [],
        tags: [],
        attributeFields: {},
      },
      trendSignals: cachedResearch?.trendSignals || {
        status: 'UNAVAILABLE',
        message: 'Trend data is currently unavailable. No synthetic trend percentages are generated.',
        signals: [],
      },
      styleIdeas: identification ? styleIdeas : [],
      matchedProducts: cachedResearch?.matchedProducts || [],
      pricing,
      similarItems: cachedResearch?.similarItems || [],
      cheaperAlternatives: cachedResearch?.cheaperAlternatives || [],
      research: cachedResearch
        ? {
            status: 'COMPLETE',
            researchedAt: cachedResearch.researchedAt,
            sources: cachedResearch.sources || [],
            queries: cachedResearch.queries || null,
          }
        : {
            status: 'NOT_STARTED',
            researchedAt: null,
            sources: [],
            queries: null,
          },
      saved: isSaved,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  /**
   * Create a new FashionItem container (authenticated user owned)
   */
  static async createFashionItem(userId: string, data?: { title?: string }) {
    const item = await prisma.item.create({
      data: {
        userId,
        title: data?.title || 'Unanalyzed Fashion Item',
        status: 'DRAFT',
      },
      include: {
        images: true,
        recognition: true,
      },
    });

    return this.getFashionItem(userId, item.id);
  }

  /**
   * Retrieve a single FashionItem with all hydrated image URLs
   */
  static async getFashionItem(userId: string, itemId: string): Promise<FashionItemResponse> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        recognition: true,
        pricingResearch: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Fashion item not found');
    }

    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this fashion item');
    }

    // Hydrate signed/public URLs for images
    const hydratedImages = await Promise.all(
      item.images.map(async (img) => {
        try {
          const url = await storageService.getObjectUrl(img.storageKey);
          return { ...img, url };
        } catch (err) {
          console.warn(`Failed to resolve URL for image ${img.id}:`, err);
          return { ...img, url: null };
        }
      })
    );

    return this.formatFashionItem({ ...item, images: hydratedImages });
  }

  /**
   * Run Gemini visual identification & style reasoning on the item's photos
   */
  static async analyzeFashionItem(userId: string, itemId: string): Promise<FashionItemResponse> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        images: { include: { variants: true } },
        recognition: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Fashion item not found');
    }
    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized');
    }

    if (item.images.length === 0) {
      throw new Error('Please upload at least one photo before analyzing.');
    }

    // Download image buffers
    const imageBuffers: { buffer: Buffer; mimeType: string }[] = [];
    for (const img of item.images) {
      try {
        const buffer = await storageService.downloadObject(img.storageKey);
        imageBuffers.push({ buffer, mimeType: img.mimeType });
      } catch (err) {
        console.warn(`Failed to download image ${img.id}:`, err);
      }
    }

    if (imageBuffers.length === 0) {
      throw new Error('Could not retrieve image data for analysis');
    }

    // Run Gemini analysis
    const analysis = await fashionVisionService.analyzeFashionImages(imageBuffers);
    const idf = analysis.identification;

    const recData: any = {
      status: 'COMPLETED',
      confidence: idf.confidence ?? null,
      category: idf.category ?? null,
      brand: idf.possibleBrand ?? null,
      productName: idf.garmentType ?? null,
      color: idf.color ?? null,
      secondaryColors: idf.secondaryColors ?? [],
      material: idf.material ?? null,
      style: idf.style ?? null,
      audience: idf.genderPresentation ?? null,
      pattern: idf.pattern ?? null,
      visibleFeatures: idf.distinctiveFeatures ?? [],
      notes: idf.notes ?? null,
      rawResponse: JSON.parse(JSON.stringify(analysis)),
    };
    Object.keys(recData).forEach((k) => recData[k] === undefined && delete recData[k]);

    // Update item and itemRecognition atomically
    await prisma.$transaction([
      prisma.item.update({
        where: { id: itemId },
        data: {
          title: idf.garmentType || item.title || 'Fashion Item',
          brand: idf.possibleBrand || null,
          category: idf.category || null,
          color: idf.color || null,
        },
      }),
      prisma.itemRecognition.upsert({
        where: { itemId },
        update: recData,
        create: {
          itemId,
          ...recData,
        },
      }),
    ]);

    return this.getFashionItem(userId, itemId);
  }

  /**
   * User editing of AI visual results (Never force user to blindly trust AI)
   */
  static async updateFashionItem(
    userId: string,
    itemId: string,
    dto: UpdateFashionItemDto
  ): Promise<FashionItemResponse> {
    const existing = await prisma.item.findUnique({
      where: { id: itemId },
      include: { recognition: true },
    });

    if (!existing) throw new NotFoundError('Fashion item not found');
    if (existing.userId !== userId) throw new UnauthorizedError('Not authorized');

    const itemUpdate: any = {};
    if (dto.title !== undefined) itemUpdate.title = dto.title;
    if (dto.brand !== undefined) itemUpdate.brand = dto.brand;
    if (dto.category !== undefined) itemUpdate.category = dto.category;
    if (dto.color !== undefined) itemUpdate.color = dto.color;

    const recognitionUpdate: any = {};
    if (dto.brand !== undefined) recognitionUpdate.brand = dto.brand;
    if (dto.category !== undefined) recognitionUpdate.category = dto.category;
    if (dto.garmentType !== undefined) recognitionUpdate.productName = dto.garmentType;
    if (dto.color !== undefined) recognitionUpdate.color = dto.color;
    if (dto.secondaryColors !== undefined) recognitionUpdate.secondaryColors = dto.secondaryColors;
    if (dto.pattern !== undefined) recognitionUpdate.pattern = dto.pattern;
    if (dto.material !== undefined) recognitionUpdate.material = dto.material;
    if (dto.style !== undefined) recognitionUpdate.style = dto.style;
    if (dto.distinctiveFeatures !== undefined) recognitionUpdate.visibleFeatures = dto.distinctiveFeatures;
    if (dto.notes !== undefined) recognitionUpdate.notes = dto.notes;

    await prisma.$transaction([
      prisma.item.update({
        where: { id: itemId },
        data: itemUpdate,
      }),
      prisma.itemRecognition.upsert({
        where: { itemId },
        update: recognitionUpdate,
        create: {
          itemId,
          status: 'COMPLETED',
          ...recognitionUpdate,
        },
      }),
    ]);

    return this.getFashionItem(userId, itemId);
  }

  /**
   * Toggle save state for a fashion item
   */
  static async toggleSave(userId: string, itemId: string, save: boolean): Promise<FashionItemResponse> {
    const existing = await prisma.item.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundError('Fashion item not found');
    if (existing.userId !== userId) throw new UnauthorizedError('Not authorized');

    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: save ? 'INVENTORY' : 'DRAFT',
      },
    });

    return this.getFashionItem(userId, itemId);
  }

  /**
   * List fashion items for user (Saved or Recently Scanned)
   */
  static async listFashionItems(
    userId: string,
    filter: 'SAVED' | 'RECENT' | 'ALL' = 'ALL'
  ): Promise<FashionItemResponse[]> {
    const where: any = { userId };
    if (filter === 'SAVED') {
      where.status = 'INVENTORY';
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        recognition: true,
      },
    });

    return Promise.all(
      items.map(async (item) => {
        const rawImages = item.images || [];
        const hydratedImages = await Promise.all(
          rawImages.map(async (img) => {
            try {
              const url = await storageService.getObjectUrl(img.storageKey);
              return { ...img, url };
            } catch {
              return { ...img, url: null };
            }
          })
        );
        return this.formatFashionItem({ ...item, images: hydratedImages });
      })
    );
  }

  /**
   * Run real-world market research, external comps, price intelligence, and similar items
   * Keeps AI visual reasoning separate from real external data.
   */
  static async researchFashionItem(userId: string, itemId: string): Promise<FashionItemResponse> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        recognition: true,
        pricingResearch: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Fashion item not found');
    }
    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized');
    }

    const rec = item.recognition;
    const rawAi = (rec?.rawResponse as any) || {};
    const idf = rawAi?.identification || {};

    // Build item attributes for research with verified codes & evidence
    const itemInfo = {
      title: item.title,
      brand: rec?.brand || item.brand || idf.possibleBrand || null,
      category: rec?.category || item.category || idf.category || null,
      garmentType: idf.garmentType || item.title || null,
      color: rec?.color || item.color || idf.color || null,
      secondaryColors: rec?.secondaryColors || idf.secondaryColors || [],
      pattern: rec?.pattern || idf.pattern || null,
      material: rec?.material || idf.material || null,
      fit: idf.fit || null,
      style: rec?.style || idf.style || null,
      era: idf.possibleEra || null,
      productCode: idf.productCode || null,
      styleCode: idf.styleCode || null,
      modelNumber: idf.modelNumber || null,
      distinctiveGraphics: idf.distinctiveGraphics || [],
    };

    // Execute research engine (orchestrates providers, deduplication, price analysis, similar item scoring)
    const researchResult = await fashionResearchEngine.performResearch(itemInfo);

    // Evaluate candidate verification against evidence:
    // Only EXACT_MATCH candidates can promote identification to EXACT_MATCH with verifiedProductName
    const exactCandidateGroup = researchResult.matchedProducts.find((p) => p.matchType === 'EXACT_MATCH');
    const updatedIdentification = { ...idf };
    if (exactCandidateGroup && (idf.productCode || idf.possibleBrand)) {
      updatedIdentification.identificationLevel = 'EXACT_MATCH';
      updatedIdentification.exactModelVerified = true;
      updatedIdentification.verifiedProductName = exactCandidateGroup.name;
    }

    // Persist research into rawResponse.research
    const updatedRawResponse = {
      ...rawAi,
      identification: updatedIdentification,
      research: {
        status: 'COMPLETE',
        researchedAt: researchResult.researchedAt,
        queries: researchResult.queries,
        matchedProducts: researchResult.matchedProducts,
        pricing: researchResult.pricing,
        similarItems: researchResult.similarItems,
        cheaperAlternatives: researchResult.cheaperAlternatives,
        trendSignals: researchResult.trendSignals,
        sources: researchResult.sources,
      },
    };

    // Upsert pricing research record in Prisma for relational queries/caching
    const low = researchResult.pricing.resale?.min ?? researchResult.pricing.unbranded?.min ?? null;
    const high = researchResult.pricing.resale?.max ?? researchResult.pricing.unbranded?.max ?? null;
    const recPrice = researchResult.pricing.resale?.median ?? researchResult.pricing.unbranded?.median ?? null;

    await prisma.$transaction([
      prisma.itemRecognition.upsert({
        where: { itemId },
        update: {
          rawResponse: JSON.parse(JSON.stringify(updatedRawResponse)),
        },
        create: {
          itemId,
          status: 'COMPLETED',
          rawResponse: JSON.parse(JSON.stringify(updatedRawResponse)),
        },
      }),
      prisma.pricingResearch.upsert({
        where: { itemId },
        update: {
          recommendedPrice: recPrice != null ? Math.round(recPrice) : null,
          lowPrice: low != null ? Math.round(low) : null,
          highPrice: high != null ? Math.round(high) : null,
          currency: 'USD',
          source: 'MARKET_COMPS',
        },
        create: {
          itemId,
          recommendedPrice: recPrice != null ? Math.round(recPrice) : null,
          lowPrice: low != null ? Math.round(low) : null,
          highPrice: high != null ? Math.round(high) : null,
          currency: 'USD',
          source: 'MARKET_COMPS',
        },
      }),
    ]);

    return this.getFashionItem(userId, itemId);
  }

  /**
   * Delete a fashion item and cleanup its associated image assets cleanly
   */
  static async deleteFashionItem(userId: string, itemId: string): Promise<{ success: boolean }> {
    const existing = await prisma.item.findUnique({
      where: { id: itemId },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundError('Fashion item not found');
    }
    if (existing.userId !== userId) {
      throw new UnauthorizedError('Not authorized');
    }

    // Clean up S3 / storage assets
    for (const img of existing.images) {
      try {
        await storageService.deleteObject(img.storageKey);
      } catch (err) {
        console.warn(`Failed to delete storage asset ${img.storageKey}:`, err);
      }
    }

    // Clean up any MarketplaceListing records, sales, pricing, draft, recognition and images
    await prisma.$transaction(async (tx) => {
      // Find all listings for this item
      const listings = await tx.marketplaceListing.findMany({
        where: { itemId },
        select: { id: true },
      });
      if (listings.length > 0) {
        const listingIds = listings.map((l) => l.id);
        await tx.sale.deleteMany({
          where: { marketplaceListingId: { in: listingIds } },
        });
        await tx.marketplaceListing.deleteMany({
          where: { id: { in: listingIds } },
        });
      }

      // Explicitly delete all child records to avoid database foreign key constraint errors
      await (tx as any).sale?.deleteMany?.({ where: { itemId } });
      await (tx as any).pricingResearch?.deleteMany?.({ where: { itemId } });
      await (tx as any).listingDraft?.deleteMany?.({ where: { itemId } });
      await (tx as any).itemRecognition?.deleteMany?.({ where: { itemId } });

      const images = (tx as any).itemImage?.findMany ? await (tx as any).itemImage.findMany({
        where: { itemId },
        select: { id: true },
      }) : [];
      if (images.length > 0) {
        const imageIds = images.map((img: any) => img.id);
        await (tx as any).itemImageVariant?.deleteMany?.({
          where: { itemImageId: { in: imageIds } },
        });
        await (tx as any).itemImage?.deleteMany?.({
          where: { itemId },
        });
      }

      // Delete item record
      await tx.item.delete({
        where: { id: itemId },
      });
    });

    return { success: true };
  }

  /**
   * Batch delete multiple fashion items owned by the authenticated user
   */
  static async batchDeleteFashionItems(userId: string, itemIds: string[]): Promise<{ count: number }> {
    if (!itemIds || itemIds.length === 0) return { count: 0 };

    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        userId,
      },
      include: { images: true },
    });

    for (const item of items) {
      for (const img of item.images) {
        try {
          await storageService.deleteObject(img.storageKey);
        } catch (err) {
          console.warn(`Failed to delete storage asset ${img.storageKey}:`, err);
        }
      }
    }

    const idsToDelete = items.map((i) => i.id);
    if (idsToDelete.length === 0) return { count: 0 };

    await prisma.$transaction(async (tx) => {
      const listings = await tx.marketplaceListing.findMany({
        where: { itemId: { in: idsToDelete } },
        select: { id: true },
      });
      if (listings.length > 0) {
        const listingIds = listings.map((l) => l.id);
        await tx.sale.deleteMany({
          where: { marketplaceListingId: { in: listingIds } },
        });
        await tx.marketplaceListing.deleteMany({
          where: { id: { in: listingIds } },
        });
      }

      await tx.sale.deleteMany({ where: { itemId: { in: idsToDelete } } });
      await tx.pricingResearch.deleteMany({ where: { itemId: { in: idsToDelete } } });
      await tx.listingDraft.deleteMany({ where: { itemId: { in: idsToDelete } } });
      await tx.itemRecognition.deleteMany({ where: { itemId: { in: idsToDelete } } });

      const images = await tx.itemImage.findMany({
        where: { itemId: { in: idsToDelete } },
        select: { id: true },
      });
      if (images.length > 0) {
        const imageIds = images.map((img) => img.id);
        await tx.itemImageVariant.deleteMany({
          where: { itemImageId: { in: imageIds } },
        });
        await tx.itemImage.deleteMany({
          where: { itemId: { in: idsToDelete } },
        });
      }

      await tx.item.deleteMany({
        where: {
          id: { in: idsToDelete },
          userId,
        },
      });
    });

    return { count: idsToDelete.length };
  }

  /**
   * Clear all scan history for the authenticated user (removes DRAFT / un-saved scan items)
   */
  static async clearScanHistory(userId: string): Promise<{ count: number }> {
    const historyItems = await prisma.item.findMany({
      where: {
        userId,
        status: 'DRAFT',
      },
      include: { images: true },
    });

    for (const item of historyItems) {
      for (const img of item.images) {
        try {
          await storageService.deleteObject(img.storageKey);
        } catch (err) {
          console.warn(`Failed to delete storage asset ${img.storageKey}:`, err);
        }
      }
    }

    const idsToDelete = historyItems.map((i) => i.id);

    if (idsToDelete.length > 0) {
      await prisma.$transaction(async (tx) => {
        const listings = await tx.marketplaceListing.findMany({
          where: { itemId: { in: idsToDelete } },
          select: { id: true },
        });
        if (listings.length > 0) {
          const listingIds = listings.map((l) => l.id);
          await tx.sale.deleteMany({
            where: { marketplaceListingId: { in: listingIds } },
          });
          await tx.marketplaceListing.deleteMany({
            where: { id: { in: listingIds } },
          });
        }

        await tx.sale.deleteMany({ where: { itemId: { in: idsToDelete } } });
        await tx.pricingResearch.deleteMany({ where: { itemId: { in: idsToDelete } } });
        await tx.listingDraft.deleteMany({ where: { itemId: { in: idsToDelete } } });
        await tx.itemRecognition.deleteMany({ where: { itemId: { in: idsToDelete } } });

        const images = await tx.itemImage.findMany({
          where: { itemId: { in: idsToDelete } },
          select: { id: true },
        });
        if (images.length > 0) {
          const imageIds = images.map((img) => img.id);
          await tx.itemImageVariant.deleteMany({
            where: { itemImageId: { in: imageIds } },
          });
          await tx.itemImage.deleteMany({
            where: { itemId: { in: idsToDelete } },
          });
        }

        await tx.item.deleteMany({
          where: {
            id: { in: idsToDelete },
            userId,
          },
        });
      });
    }

    return { count: idsToDelete.length };
  }
}


