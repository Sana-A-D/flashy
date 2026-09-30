export type SubscriptionTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export interface PlanFeatureLimits {
  tier: SubscriptionTier;
  displayName: string;
  pricePerMonth: number;
  maxActiveListings: number;
  maxMarketplaceConnections: number;
  aiGenerationPerMonth: number;
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionUsage {
  activeItems: number;
  maxItems: number;
  isItemsLimitReached: boolean;
  activeMarketplaces: number;
  maxMarketplaces: number;
  isMarketplacesLimitReached: boolean;
}

export interface SubscriptionResponse {
  subscription: UserSubscription;
  plan: PlanFeatureLimits;
  usage: SubscriptionUsage;
  availablePlans: PlanFeatureLimits[];
}
