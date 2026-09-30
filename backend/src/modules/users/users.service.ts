import { PrismaClient, UserRole } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../shared/errors';

const prisma = new PrismaClient();

export class UsersService {
  /**
   * Export all user-owned records in structured JSON format.
   * Excludes passwords, tokens, hashes, and sensitive API secrets.
   */
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [
      items,
      storageLocations,
      marketplaceAccounts,
      ebayAccounts,
      subscription,
    ] = await Promise.all([
      // Items with full user-owned relational context (images, recognition, draft, pricing, listings, sales)
      prisma.item.findMany({
        where: { userId },
        include: {
          images: {
            select: {
              id: true,
              storageKey: true,
              originalFilename: true,
              mimeType: true,
              fileSize: true,
              width: true,
              height: true,
              sortOrder: true,
              isPrimary: true,
              processingStatus: true,
              createdAt: true,
            },
          },
          recognition: {
            select: {
              id: true,
              status: true,
              confidence: true,
              category: true,
              brand: true,
              model: true,
              productName: true,
              color: true,
              secondaryColors: true,
              material: true,
              style: true,
              audience: true,
              size: true,
              pattern: true,
              conditionClues: true,
              visibleFeatures: true,
              modelNumber: true,
              sku: true,
              upc: true,
              notes: true,
              createdAt: true,
            },
          },
          listingDraft: {
            select: {
              id: true,
              status: true,
              title: true,
              description: true,
              category: true,
              brand: true,
              condition: true,
              color: true,
              size: true,
              attributes: true,
              keywords: true,
              price: true,
              createdAt: true,
            },
          },
          pricingResearch: {
            select: {
              id: true,
              status: true,
              recommendedPrice: true,
              lowPrice: true,
              highPrice: true,
              confidence: true,
              currency: true,
              source: true,
              factors: true,
              createdAt: true,
            },
          },
          listings: {
            select: {
              id: true,
              marketplaceId: true,
              externalListingId: true,
              status: true,
              listingUrl: true,
              listedPrice: true,
              listedAt: true,
              soldAt: true,
              marketplace: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
          },
          sale: {
            select: {
              id: true,
              salePrice: true,
              marketplaceFees: true,
              shippingCost: true,
              otherExpenses: true,
              soldAt: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Storage locations
      prisma.storageLocation.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Marketplace accounts - safe metadata only, NO encryptedTokens
      prisma.marketplaceAccount.findMany({
        where: { userId },
        select: {
          id: true,
          marketplaceId: true,
          externalAccountId: true,
          expiresAt: true,
          marketplace: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      }),

      // Ebay accounts - safe metadata only, NO accessToken or refreshToken
      prisma.ebayAccount.findMany({
        where: { userId },
        select: {
          id: true,
          environment: true,
          ebayUserId: true,
          ebayUsername: true,
          marketplaceId: true,
          merchantLocationKey: true,
          connectionStatus: true,
          city: true,
          stateOrProvince: true,
          postalCode: true,
          country: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Subscription
      prisma.subscription.findUnique({
        where: { userId },
        select: {
          id: true,
          tier: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: '1.0',
      profile: user,
      subscription: subscription || {
        tier: 'FREE',
        status: 'ACTIVE',
      },
      summary: {
        totalItems: items.length,
        totalStorageLocations: storageLocations.length,
        totalMarketplaceConnections: marketplaceAccounts.length + ebayAccounts.length,
        totalSales: items.filter((i) => !!i.sale).length,
      },
      items,
      storageLocations,
      marketplaceAccounts,
      ebayAccounts,
    };
  }

  /**
   * Permanently delete user account and all user-owned data transactionally.
   * Preserves admin safeguard (cannot delete sole administrator).
   */
  static async deleteUserAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Protect sole administrator
    if (user.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ValidationError(
          'Cannot delete your account as you are the sole administrator of Flashy.'
        );
      }
    }

    // Execute safe multi-step deletion transaction
    await prisma.$transaction(async (tx) => {
      // 1. Gather all user's item IDs
      const userItems = await tx.item.findMany({
        where: { userId },
        select: { id: true },
      });
      const itemIds = userItems.map((it) => it.id);

      if (itemIds.length > 0) {
        // 2. Delete sales linked to user's items
        await tx.sale.deleteMany({
          where: { itemId: { in: itemIds } },
        });

        // 3. Delete marketplace listings for user's items
        await tx.marketplaceListing.deleteMany({
          where: { itemId: { in: itemIds } },
        });

        // 4. Delete image variants and item images
        const userImages = await tx.itemImage.findMany({
          where: { itemId: { in: itemIds } },
          select: { id: true },
        });
        const imageIds = userImages.map((img) => img.id);

        if (imageIds.length > 0) {
          await tx.itemImageVariant.deleteMany({
            where: { itemImageId: { in: imageIds } },
          });
          await tx.itemImage.deleteMany({
            where: { id: { in: imageIds } },
          });
        }

        // 5. Delete recognition, draft, and pricing research
        await tx.itemRecognition.deleteMany({
          where: { itemId: { in: itemIds } },
        });
        await tx.listingDraft.deleteMany({
          where: { itemId: { in: itemIds } },
        });
        await tx.pricingResearch.deleteMany({
          where: { itemId: { in: itemIds } },
        });

        // 6. Delete items
        await tx.item.deleteMany({
          where: { id: { in: itemIds } },
        });
      }

      // 7. Delete storage locations
      await tx.storageLocation.deleteMany({
        where: { userId },
      });

      // 8. Delete marketplace listings directly connected to user's marketplace accounts (if any remained)
      const userMpAccounts = await tx.marketplaceAccount.findMany({
        where: { userId },
        select: { id: true },
      });
      const mpAccountIds = userMpAccounts.map((a) => a.id);
      if (mpAccountIds.length > 0) {
        await tx.marketplaceListing.deleteMany({
          where: { marketplaceAccountId: { in: mpAccountIds } },
        });
      }

      // 9. Delete marketplace accounts and ebay accounts
      await tx.marketplaceAccount.deleteMany({
        where: { userId },
      });
      await tx.ebayAccount.deleteMany({
        where: { userId },
      });

      // 10. Delete subscription
      await tx.subscription.deleteMany({
        where: { userId },
      });

      // 11. Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // 12. Delete user record
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return {
      success: true,
      message: 'Account and all associated personal data have been permanently deleted.',
      externalMarketplaces: {
        localScrubbed: true,
        note: 'Local marketplace tokens and connections were purged. To revoke third-party app permissions on eBay or external channels, visit their respective account security settings.',
      },
    };
  }
}
