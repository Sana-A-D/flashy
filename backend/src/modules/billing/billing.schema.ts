import { z } from 'zod';

export const subscriptionTierEnum = z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']);
export type SubscriptionTierType = z.infer<typeof subscriptionTierEnum>;

export const subscriptionStatusEnum = z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']);
export type SubscriptionStatusType = z.infer<typeof subscriptionStatusEnum>;

export const upgradePlanSchema = z.object({
  tier: subscriptionTierEnum,
  paymentMethodId: z.string().optional(),
});

export type UpgradePlanDto = z.infer<typeof upgradePlanSchema>;

export interface PlanFeatureLimits {
  tier: SubscriptionTierType;
  displayName: string;
  pricePerMonth: number;
  maxActiveListings: number;
  maxMarketplaceConnections: number;
  aiGenerationPerMonth: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<SubscriptionTierType, PlanFeatureLimits> = {
  FREE: {
    tier: 'FREE',
    displayName: 'Free Tier',
    pricePerMonth: 0,
    maxActiveListings: 10,
    maxMarketplaceConnections: 1,
    aiGenerationPerMonth: 5,
    features: [
      'Up to 10 active items',
      '1 Connected marketplace',
      'Standard image recognition',
      'Community support',
    ],
  },
  STARTER: {
    tier: 'STARTER',
    displayName: 'Starter Reseller',
    pricePerMonth: 999, // $9.99 in cents
    maxActiveListings: 50,
    maxMarketplaceConnections: 2,
    aiGenerationPerMonth: 50,
    features: [
      'Up to 50 active items',
      '2 Connected marketplaces',
      'Auto-delisting sync',
      'Inventory bin tracking',
      'Standard support',
    ],
  },
  PRO: {
    tier: 'PRO',
    displayName: 'Pro Power Reseller',
    pricePerMonth: 2499, // $24.99 in cents
    maxActiveListings: 500,
    maxMarketplaceConnections: 10,
    aiGenerationPerMonth: 500,
    features: [
      'Up to 500 active items',
      'Unlimited marketplace connections',
      'Instant cross-listing & delist-everywhere',
      'Advanced profit & sales analytics',
      'Priority AI listing generation',
      'Priority email & chat support',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    displayName: 'Enterprise Scale',
    pricePerMonth: 7999, // $79.99 in cents
    maxActiveListings: 10000,
    maxMarketplaceConnections: 50,
    aiGenerationPerMonth: 5000,
    features: [
      'Unlimited active items',
      'All marketplaces supported',
      'Multi-user warehouse bin management',
      'Custom webhook exports',
      'Dedicated account manager',
    ],
  },
};
