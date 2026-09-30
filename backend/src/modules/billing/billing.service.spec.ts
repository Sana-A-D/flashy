// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from './billing.service';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { ValidationError, NotFoundError } from '../../shared/errors';

const mockPrisma = vi.hoisted(() => ({
  subscription: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  item: {
    count: vi.fn(),
  },
  marketplaceAccount: {
    count: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    subscription = mockPrisma.subscription;
    item = mockPrisma.item;
    marketplaceAccount = mockPrisma.marketplaceAccount;
  },
  SubscriptionTier: {
    FREE: 'FREE',
    STARTER: 'STARTER',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
  },
  SubscriptionStatus: {
    ACTIVE: 'ACTIVE',
    PAST_DUE: 'PAST_DUE',
    CANCELED: 'CANCELED',
    TRIALING: 'TRIALING',
  },
}));

describe('BillingService (Phase 24 Payments & Monetization)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscription', () => {
    it('creates default FREE subscription if none exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);
      mockPrisma.subscription.create.mockResolvedValueOnce({
        id: 'sub-new',
        userId: 'user-123',
        tier: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
      mockPrisma.item.count.mockResolvedValueOnce(3);
      mockPrisma.marketplaceAccount.count.mockResolvedValueOnce(1);

      const result = await BillingService.getSubscription('user-123');

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          tier: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: expect.any(Date),
        },
      });
      expect(result.subscription.tier).toBe('FREE');
      expect(result.usage.activeItems).toBe(3);
      expect(result.usage.maxItems).toBe(10);
      expect(result.usage.isItemsLimitReached).toBe(false);
      expect(result.availablePlans.length).toBe(4);
    });

    it('flags limit reached when user has maximum allowed items', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'sub-free',
        userId: 'user-123',
        tier: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
      mockPrisma.item.count.mockResolvedValueOnce(10);
      mockPrisma.marketplaceAccount.count.mockResolvedValueOnce(1);

      const result = await BillingService.getSubscription('user-123');

      expect(result.usage.activeItems).toBe(10);
      expect(result.usage.isItemsLimitReached).toBe(true);
    });
  });

  describe('updatePlan', () => {
    it('upgrades user plan to PRO and calculates expiration', async () => {
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        id: 'sub-pro',
        userId: 'user-123',
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      });

      const result = await BillingService.updatePlan('user-123', { tier: 'PRO' });

      expect(result.subscription.tier).toBe('PRO');
      expect(result.plan.maxActiveListings).toBe(500);
      expect(result.plan.displayName).toBe('Pro Power Reseller');
      expect(result.message).toContain('Pro Power Reseller');
    });

    it('throws validation error if tier is invalid', async () => {
      await expect(
        BillingService.updatePlan('user-123', { tier: 'NON_EXISTENT' as any })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('cancelSubscription', () => {
    it('sets cancelAtPeriodEnd to true for active subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'sub-active',
        userId: 'user-123',
      });
      mockPrisma.subscription.update.mockResolvedValueOnce({
        id: 'sub-active',
        userId: 'user-123',
        cancelAtPeriodEnd: true,
      });

      const result = await BillingService.cancelSubscription('user-123');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { cancelAtPeriodEnd: true },
      });
      expect(result.subscription.cancelAtPeriodEnd).toBe(true);
    });

    it('throws NotFoundError when cancelling non-existent subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      await expect(BillingService.cancelSubscription('user-none')).rejects.toThrow(NotFoundError);
    });
  });

  describe('assertCanCreateItem', () => {
    it('allows creation when user is within quota', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'sub-free',
        userId: 'user-123',
        tier: 'FREE',
      });
      mockPrisma.item.count.mockResolvedValueOnce(2);
      mockPrisma.marketplaceAccount.count.mockResolvedValueOnce(0);

      const allowed = await BillingService.assertCanCreateItem('user-123');
      expect(allowed).toBe(true);
    });

    it('throws ValidationError when quota is exceeded', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'sub-free',
        userId: 'user-123',
        tier: 'FREE',
      });
      mockPrisma.item.count.mockResolvedValueOnce(10);
      mockPrisma.marketplaceAccount.count.mockResolvedValueOnce(0);

      await expect(BillingService.assertCanCreateItem('user-123')).rejects.toThrow(ValidationError);
    });
  });
});
