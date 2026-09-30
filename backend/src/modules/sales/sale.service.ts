import { PrismaClient } from '@prisma/client';
import { RecordSaleInput } from './sale.schema';
import { AppError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { DelistingService } from '../marketplaces/delisting.service';

const prisma = new PrismaClient();

export class SaleService {
  /**
   * Calculates net profit in cents based on the core formula.
   */
  static calculateProfit(
    salePrice: number,
    purchasePrice: number,
    marketplaceFees: number,
    shippingCost: number,
    otherExpenses: number
  ): number {
    return salePrice - purchasePrice - marketplaceFees - shippingCost - otherExpenses;
  }

  static async getSale(userId: string, itemId: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { sale: true }
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to view this item');
    }

    return item.sale;
  }

  static async recordSale(userId: string, itemId: string, input: RecordSaleInput) {
    const recordResult = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { sale: true }
      });

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      if (item.userId !== userId) {
        throw new UnauthorizedError('Not authorized to modify this item');
      }

      if (item.status === 'SOLD') {
        throw new AppError(400, 'Item is already sold');
      }

      if (item.status === 'ARCHIVED') {
        throw new AppError(400, 'Cannot sell an archived item');
      }

      if (item.sale) {
        throw new AppError(400, 'A sale record already exists for this item');
      }

      if (input.marketplaceListingId) {
        const listing = await tx.marketplaceListing.findUnique({
          where: { id: input.marketplaceListingId },
          include: { item: true }
        });

        if (!listing) {
          throw new NotFoundError('Marketplace listing not found');
        }

        if (listing.itemId !== itemId) {
          throw new AppError(400, 'Marketplace listing does not belong to this item');
        }

        if (listing.item.userId !== userId) {
          throw new UnauthorizedError('Marketplace listing does not belong to user');
        }
      }

      const purchaseCost = item.purchasePrice || 0;

      const profit = SaleService.calculateProfit(
        input.salePrice,
        purchaseCost,
        input.marketplaceFees,
        input.shippingCost,
        input.otherExpenses
      );

      const soldAt = input.soldAt ? new Date(input.soldAt) : new Date();

      const sale = await tx.sale.create({
        data: {
          itemId,
          ...(input.marketplaceListingId ? { marketplaceListingId: input.marketplaceListingId } : {}),
          salePrice: input.salePrice,
          marketplaceFees: input.marketplaceFees,
          shippingCost: input.shippingCost,
          otherExpenses: input.otherExpenses,
          soldAt,
        }
      });

      await tx.item.update({
        where: { id: itemId },
        data: { status: 'SOLD' }
      });

      if (input.marketplaceListingId) {
        await tx.marketplaceListing.update({
          where: { id: input.marketplaceListingId },
          data: {
            status: 'SOLD',
            soldAt,
          }
        });
      }

      return {
        sale,
        financials: {
          purchaseCost,
          profit,
        }
      };
    });

    // Cross-listing synchronization: Delist any other active listings for this item
    const delistingService = new DelistingService();
    const syncResults = await delistingService.performDelisting(userId, itemId);

    return {
      ...recordResult,
      syncResults,
    };
  }
}
