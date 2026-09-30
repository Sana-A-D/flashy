import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { ListUsersQueryDto, UpdateUserRoleDto, UpdateUserSubscriptionDto, AdminSystemStats } from './admin.schema';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors';

const prisma = new PrismaClient();

export class AdminService {
  /**
   * Enforce that the requesting user has the ADMIN role
   */
  static async assertAdmin(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedError('Forbidden: Admin privilege required');
    }
  }

  /**
   * Aggregate high-level platform health & business metrics for the admin dashboard
   */
  static async getStats(requestingUserId: string): Promise<AdminSystemStats> {
    await this.assertAdmin(requestingUserId);

    const [
      totalUsers,
      totalItems,
      totalSales,
      totalMarketplaceListings,
      salesRevenue,
      subscriptions,
      itemStatuses,
      recentUsers,
      recentItems,
      recentSales,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.sale.count(),
      prisma.marketplaceListing.count(),
      prisma.sale.aggregate({
        _sum: { salePrice: true },
      }),
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
      }),
      prisma.item.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, createdAt: true },
      }),
      prisma.item.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true },
      }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { soldAt: 'desc' },
        select: {
          id: true,
          salePrice: true,
          soldAt: true,
          marketplaceListing: {
            select: {
              marketplace: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    const subscriptionsByTier: Record<string, number> = {
      FREE: 0,
      STARTER: 0,
      PRO: 0,
      ENTERPRISE: 0,
    };
    subscriptions.forEach((s) => {
      subscriptionsByTier[s.tier] = s._count;
    });

    const itemsByStatus: Record<string, number> = {
      DRAFT: 0,
      INVENTORY: 0,
      LISTED: 0,
      SOLD: 0,
      ARCHIVED: 0,
    };
    itemStatuses.forEach((st) => {
      itemsByStatus[st.status] = st._count;
    });

    // Synthesize chronological recent system activity
    const activity: Array<{
      type: 'USER_REGISTERED' | 'ITEM_CREATED' | 'SALE_RECORDED' | 'SUBSCRIPTION_UPGRADED';
      description: string;
      timestamp: Date;
    }> = [];

    recentUsers.forEach((u) => {
      activity.push({
        type: 'USER_REGISTERED',
        description: `New reseller registered: ${u.email}`,
        timestamp: u.createdAt,
      });
    });

    recentItems.forEach((it) => {
      activity.push({
        type: 'ITEM_CREATED',
        description: `Item added: "${it.title}"`,
        timestamp: it.createdAt,
      });
    });

    recentSales.forEach((s) => {
      const channel = s.marketplaceListing?.marketplace?.name || 'Marketplace';
      activity.push({
        type: 'SALE_RECORDED',
        description: `Sale recorded on ${channel} for $${(s.salePrice / 100).toFixed(2)}`,
        timestamp: s.soldAt,
      });
    });

    activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      totalUsers,
      totalItems,
      totalSales,
      totalRevenueCents: salesRevenue._sum.salePrice || 0,
      totalMarketplaceListings,
      subscriptionsByTier,
      itemsByStatus,
      recentActivity: activity.slice(0, 10),
    };
  }

  /**
   * Paginated user search, filter, and management for admins
   */
  static async listUsers(requestingUserId: string, query: ListUsersQueryDto) {
    await this.assertAdmin(requestingUserId);

    const { page, limit, search, role, subscriptionTier } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (subscriptionTier) {
      whereClause.subscription = {
        tier: subscriptionTier,
      };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
          subscription: {
            select: {
              tier: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
          _count: {
            select: {
              items: true,
              marketplaceAccounts: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Change user role (e.g. promote to ADMIN or revoke to USER)
   */
  static async updateUserRole(requestingUserId: string, targetUserId: string, data: UpdateUserRoleDto) {
    await this.assertAdmin(requestingUserId);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('Target user not found');
    }

    // Protect against self-demoting the active admin if they are the only admin
    if (requestingUserId === targetUserId && data.role === UserRole.USER) {
      const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new ValidationError('Cannot revoke your own admin rights as the sole administrator');
      }
    }

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Force update a user's subscription tier/status directly from admin panel
   */
  static async updateUserSubscription(
    requestingUserId: string,
    targetUserId: string,
    data: UpdateUserSubscriptionDto
  ) {
    await this.assertAdmin(requestingUserId);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('Target user not found');
    }

    const updated = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        tier: data.tier,
        status: data.status || SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd:
          data.tier === SubscriptionTier.FREE
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        tier: data.tier,
        status: data.status || SubscriptionStatus.ACTIVE,
      },
    });

    return {
      subscription: updated,
      message: `User subscription updated to ${data.tier}`,
    };
  }
}
