// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from './admin.service';
import { UserRole, SubscriptionTier } from '@prisma/client';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../shared/errors';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  item: {
    count: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
  sale: {
    count: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  marketplaceListing: {
    count: vi.fn(),
  },
  subscription: {
    groupBy: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = mockPrisma.user;
    item = mockPrisma.item;
    sale = mockPrisma.sale;
    marketplaceListing = mockPrisma.marketplaceListing;
    subscription = mockPrisma.subscription;
  },
  UserRole: {
    USER: 'USER',
    ADMIN: 'ADMIN',
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

describe('AdminService (Phase 25 Admin Dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assertAdmin', () => {
    it('throws UnauthorizedError if user is not found or not ADMIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-regular', role: 'USER' });

      await expect(AdminService.assertAdmin('user-regular')).rejects.toThrow(UnauthorizedError);
    });

    it('resolves silently if user has ADMIN role', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });

      await expect(AdminService.assertAdmin('admin-1')).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('aggregates system statistics for admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.count.mockResolvedValueOnce(45);
      mockPrisma.item.count.mockResolvedValueOnce(320);
      mockPrisma.sale.count.mockResolvedValueOnce(110);
      mockPrisma.marketplaceListing.count.mockResolvedValueOnce(250);
      mockPrisma.sale.aggregate.mockResolvedValueOnce({ _sum: { salePrice: 450000 } });
      mockPrisma.subscription.groupBy.mockResolvedValueOnce([
        { tier: 'FREE', _count: 35 },
        { tier: 'PRO', _count: 10 },
      ]);
      mockPrisma.item.groupBy.mockResolvedValueOnce([
        { status: 'INVENTORY', _count: 200 },
        { status: 'SOLD', _count: 120 },
      ]);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        { id: 'u1', email: 'test@example.com', createdAt: new Date() },
      ]);
      mockPrisma.item.findMany.mockResolvedValueOnce([
        { id: 'i1', title: 'Test Item', createdAt: new Date() },
      ]);
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        {
          id: 's1',
          salePrice: 5000,
          soldAt: new Date(),
          marketplaceListing: { marketplace: { name: 'eBay' } },
        },
      ]);

      const stats = await AdminService.getStats('admin-1');

      expect(stats.totalUsers).toBe(45);
      expect(stats.totalItems).toBe(320);
      expect(stats.totalSales).toBe(110);
      expect(stats.totalRevenueCents).toBe(450000);
      expect(stats.subscriptionsByTier.FREE).toBe(35);
      expect(stats.subscriptionsByTier.PRO).toBe(10);
      expect(stats.itemsByStatus.INVENTORY).toBe(200);
      expect(stats.recentActivity.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('listUsers', () => {
    it('returns paginated users with counts and subscriptions', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.count.mockResolvedValueOnce(1);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'reseller@domain.com',
          role: 'USER',
          subscription: { tier: 'FREE', status: 'ACTIVE' },
          _count: { items: 8, marketplaceAccounts: 2 },
        },
      ]);

      const res = await AdminService.listUsers('admin-1', { page: 1, limit: 10 });

      expect(res.users.length).toBe(1);
      expect(res.pagination.total).toBe(1);
      expect(res.users[0].email).toBe('reseller@domain.com');
    });
  });

  describe('updateUserRole', () => {
    it('promotes user to ADMIN', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' }) // assertAdmin
        .mockResolvedValueOnce({ id: 'user-2', role: 'USER' }); // find target user

      mockPrisma.user.update.mockResolvedValueOnce({
        id: 'user-2',
        role: 'ADMIN',
      });

      const updated = await AdminService.updateUserRole('admin-1', 'user-2', { role: 'ADMIN' });
      expect(updated.role).toBe('ADMIN');
    });

    it('prevents sole admin from self-demoting', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });

      mockPrisma.user.count.mockResolvedValueOnce(1); // sole admin

      await expect(
        AdminService.updateUserRole('admin-1', 'admin-1', { role: 'USER' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateUserSubscription', () => {
    it('updates user subscription to ENTERPRISE', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'user-3' });

      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        id: 'sub-3',
        userId: 'user-3',
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
      });

      const res = await AdminService.updateUserSubscription('admin-1', 'user-3', {
        tier: 'ENTERPRISE',
      });

      expect(res.subscription.tier).toBe('ENTERPRISE');
      expect(res.message).toContain('ENTERPRISE');
    });
  });
});
