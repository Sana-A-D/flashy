import { PrismaClient, ConfidenceLevel, PricingSource } from '@prisma/client';
import { marketResearchProvider } from './providers/market-research.provider';

const prisma = new PrismaClient();

export class PricingService {
  static async performResearch(itemId: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        recognition: true,
        listingDraft: true,
      },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    const title = item.listingDraft?.title || item.title;
    const brand = item.listingDraft?.brand || item.recognition?.brand || item.brand;
    const category = item.listingDraft?.category || item.recognition?.category || item.category;
    const model = item.recognition?.model || null;
    const condition = item.listingDraft?.condition || item.condition;

    // Use MarketResearchProvider
    const researchResult = await marketResearchProvider.researchMarket({
      title,
      brand,
      category,
      model,
      condition,
    });

    const confidenceMap: Record<string, ConfidenceLevel> = {
      HIGH: ConfidenceLevel.HIGH,
      MEDIUM: ConfidenceLevel.MEDIUM,
      LOW: ConfidenceLevel.LOW,
    };

    const confidence = confidenceMap[researchResult.confidence] || ConfidenceLevel.LOW;
    const source = researchResult.comparables.length > 0 ? PricingSource.MARKET_COMPS : PricingSource.ESTIMATE;

    const research = await prisma.pricingResearch.upsert({
      where: { itemId },
      update: {
        status: 'COMPLETED',
        recommendedPrice: researchResult.recommendedPrice,
        lowPrice: researchResult.resaleLow,
        highPrice: researchResult.resaleHigh,
        confidence,
        source,
        currency: researchResult.currency,
        factors: researchResult.factors,
      },
      create: {
        itemId,
        status: 'COMPLETED',
        recommendedPrice: researchResult.recommendedPrice,
        lowPrice: researchResult.resaleLow,
        highPrice: researchResult.resaleHigh,
        confidence,
        source,
        currency: researchResult.currency,
        factors: researchResult.factors,
      },
    });

    return {
      ...research,
      originalRetailPrice: researchResult.originalRetailPrice,
      resaleMedian: researchResult.resaleMedian,
      sampleSize: researchResult.sampleSize,
      sources: researchResult.sources,
      comparables: researchResult.comparables,
      soldPriceStatus: researchResult.soldPriceStatus,
      researchedAt: researchResult.researchedAt,
    };
  }

  static async getResearch(itemId: string) {
    return prisma.pricingResearch.findUnique({
      where: { itemId },
    });
  }
}
