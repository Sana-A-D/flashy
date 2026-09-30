import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { PLAN_CONFIGS, SubscriptionTierType, UpgradePlanDto } from './billing.schema';
import { NotFoundError, ValidationError } from '../../shared/errors';

const prisma = new PrismaClient();

export class BillingService {
  /**
   * Get or initialize the subscription for the authenticated user
   */
  static async getSubscription(userId: string) {
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Auto-initialize free subscription
      subscription = await prisma.subscription.create({
        data: {
          userId,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
        },
      });
    }

    // Calculate live usage against limits
    const [totalItems, activeMarketplaces] = await Promise.all([
      prisma.item.count({
        where: {
          userId,
          status: { in: ['INVENTORY', 'LISTED'] },
        },
      }),
      prisma.marketplaceAccount.count({
        where: {
          userId,
          status: 'CONNECTED',
        },
      }),
    ]);

    const planLimits = PLAN_CONFIGS[subscription.tier as SubscriptionTierType] || PLAN_CONFIGS.FREE;

    return {
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      plan: planLimits,
      usage: {
        activeItems: totalItems,
        maxItems: planLimits.maxActiveListings,
        isItemsLimitReached: totalItems >= planLimits.maxActiveListings,
        activeMarketplaces,
        maxMarketplaces: planLimits.maxMarketplaceConnections,
        isMarketplacesLimitReached: activeMarketplaces >= planLimits.maxMarketplaceConnections,
      },
      availablePlans: Object.values(PLAN_CONFIGS),
    };
  }

  /**
   * Upgrade or change user subscription plan
   */
  static async updatePlan(userId: string, data: UpgradePlanDto) {
    const targetTier = data.tier as SubscriptionTier;

    if (!Object.values(SubscriptionTier).includes(targetTier)) {
      throw new ValidationError(`Invalid subscription tier: ${data.tier}`);
    }

    const currentPeriodStart = new Date();
    // 30 days billing period
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier: targetTier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart,
        currentPeriodEnd: targetTier === SubscriptionTier.FREE ? null : currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      update: {
        tier: targetTier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart,
        currentPeriodEnd: targetTier === SubscriptionTier.FREE ? null : currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    const planLimits = PLAN_CONFIGS[subscription.tier as SubscriptionTierType] || PLAN_CONFIGS.FREE;

    return {
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      plan: planLimits,
      message: `Successfully updated subscription to ${planLimits.displayName}`,
    };
  }

  /**
   * Cancel subscription at period end or revert to free tier
   */
  static async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return {
      subscription: updated,
      message: 'Subscription will be canceled at the end of the current billing period',
    };
  }

  /**
   * Check if user is allowed to add more items under their current plan
   */
  static async assertCanCreateItem(userId: string): Promise<boolean> {
    const subInfo = await this.getSubscription(userId);
    if (subInfo.usage.isItemsLimitReached) {
      throw new ValidationError(
        `Your current plan (${subInfo.plan.displayName}) limit of ${subInfo.plan.maxActiveListings} items has been reached. Please upgrade to add more items.`
      );
    }
    return true;
  }
}
