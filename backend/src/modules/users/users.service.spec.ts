// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../shared/errors';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  item: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  itemImage: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  itemImageVariant: {
    deleteMany: vi.fn(),
  },
  itemRecognition: {
    deleteMany: vi.fn(),
  },
  listingDraft: {
    deleteMany: vi.fn(),
  },
  pricingResearch: {
    deleteMany: vi.fn(),
  },
  marketplaceListing: {
    deleteMany: vi.fn(),
  },
  sale: {
    deleteMany: vi.fn(),
  },
  storageLocation: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  marketplaceAccount: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  ebayAccount: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  refreshToken: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = mockPrisma.user;
    item = mockPrisma.item;
    itemImage = mockPrisma.itemImage;
    itemImageVariant = mockPrisma.itemImageVariant;
    itemRecognition = mockPrisma.itemRecognition;
    listingDraft = mockPrisma.listingDraft;
    pricingResearch = mockPrisma.pricingResearch;
    marketplaceListing = mockPrisma.marketplaceListing;
    sale = mockPrisma.sale;
    storageLocation = mockPrisma.storageLocation;
    marketplaceAccount = mockPrisma.marketplaceAccount;
    ebayAccount = mockPrisma.ebayAccount;
    subscription = mockPrisma.subscription;
    refreshToken = mockPrisma.refreshToken;
    $transaction = mockPrisma.$transaction;
  },
  UserRole: {
    USER: 'USER',
    ADMIN: 'ADMIN',
  },
}));

describe('UsersService (Phase 26 Data Export & Account Deletion)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('throws NotFoundError if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(UsersService.exportUserData('non-existent-user')).rejects.toThrow(
        NotFoundError
      );
    });

    it('exports all user-owned data and excludes secrets/passwords/tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'seller@example.com',
        name: 'Jane Reseller',
        emailVerified: true,
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const mockItems = [
        {
          id: 'item-1',
          title: 'Vintage Leather Jacket',
          images: [
            {
              id: 'img-1',
              storageKey: 'keys/jacket.jpg',
              originalFilename: 'jacket.jpg',
              mimeType: 'image/jpeg',
              fileSize: 10240,
              width: 800,
              height: 600,
              sortOrder: 0,
              isPrimary: true,
              processingStatus: 'COMPLETED',
              createdAt: new Date(),
            },
          ],
          recognition: { id: 'rec-1', status: 'COMPLETED', brand: 'Schott' },
          listingDraft: { id: 'draft-1', status: 'COMPLETED', price: 15000 },
          pricingResearch: { id: 'pr-1', recommendedPrice: 15000, confidence: 'HIGH' },
          listings: [
            {
              id: 'mpl-1',
              marketplaceId: 'mp-ebay',
              externalListingId: 'ebay-123',
              status: 'ACTIVE',
              listingUrl: 'https://ebay.com/itm/123',
              listedPrice: 150.0,
              marketplace: { name: 'eBay', type: 'EBAY' },
            },
          ],
          sale: null,
        },
      ];

      const mockLocations = [
        {
          id: 'loc-1',
          name: 'Bin A-12',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { items: 1 },
        },
      ];

      const mockMarketplaceAccounts = [
        {
          id: 'mpa-1',
          marketplaceId: 'mp-ebay',
          externalAccountId: 'ebay-seller-jane',
          expiresAt: new Date('2027-01-01'),
          marketplace: { name: 'eBay', type: 'EBAY' },
        },
      ];

      const mockEbayAccounts = [
        {
          id: 'ebay-acc-1',
          environment: 'production',
          ebayUserId: 'jane_ebay',
          ebayUsername: 'jane_ebay',
          marketplaceId: 'EBAY_US',
          merchantLocationKey: 'lm-loc-1',
          connectionStatus: 'READY',
          city: 'Austin',
          stateOrProvince: 'TX',
          postalCode: '78701',
          country: 'US',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockSubscription = {
        id: 'sub-1',
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.item.findMany.mockResolvedValueOnce(mockItems);
      mockPrisma.storageLocation.findMany.mockResolvedValueOnce(mockLocations);
      mockPrisma.marketplaceAccount.findMany.mockResolvedValueOnce(mockMarketplaceAccounts);
      mockPrisma.ebayAccount.findMany.mockResolvedValueOnce(mockEbayAccounts);
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(mockSubscription);

      const exported = await UsersService.exportUserData('user-123');

      expect(exported.schemaVersion).toBe('1.0');
      expect(exported.profile.email).toBe('seller@example.com');
      // Verify no sensitive tokens or password fields are leaked
      expect(exported.profile).not.toHaveProperty('password');
      expect(exported.marketplaceAccounts[0]).not.toHaveProperty('encryptedTokens');
      expect(exported.ebayAccounts[0]).not.toHaveProperty('accessToken');
      expect(exported.ebayAccounts[0]).not.toHaveProperty('refreshToken');

      // Verify relational completeness
      expect(exported.items.length).toBe(1);
      expect(exported.items[0].images.length).toBe(1);
      expect(exported.storageLocations.length).toBe(1);
      expect(exported.subscription.tier).toBe('PRO');
      expect(exported.summary.totalItems).toBe(1);
      expect(exported.summary.totalStorageLocations).toBe(1);
      expect(exported.summary.totalMarketplaceConnections).toBe(2);
    });
  });

  describe('deleteUserAccount', () => {
    it('throws NotFoundError if target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(UsersService.deleteUserAccount('user-unknown')).rejects.toThrow(
        NotFoundError
      );
    });

    it('blocks deletion of sole administrator to preserve system safety', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'admin-sole',
        role: UserRole.ADMIN,
        email: 'soleadmin@listingmate.app',
      });
      mockPrisma.user.count.mockResolvedValueOnce(1); // Only 1 admin in system

      await expect(UsersService.deleteUserAccount('admin-sole')).rejects.toThrow(
        ValidationError
      );
    });

    it('successfully deletes user account and cascade cleans up relational data transactionally', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-to-delete',
        role: UserRole.USER,
        email: 'delete_me@example.com',
      });

      mockPrisma.item.findMany.mockResolvedValueOnce([{ id: 'it-1' }, { id: 'it-2' }]);
      mockPrisma.itemImage.findMany.mockResolvedValueOnce([{ id: 'img-1' }]);
      mockPrisma.marketplaceAccount.findMany.mockResolvedValueOnce([{ id: 'mpa-1' }]);

      mockPrisma.user.delete.mockResolvedValueOnce({ id: 'user-to-delete' });

      const result = await UsersService.deleteUserAccount('user-to-delete');

      expect(result.success).toBe(true);
      expect(result.externalMarketplaces.localScrubbed).toBe(true);

      // Verify deletion sequence called
      expect(mockPrisma.sale.deleteMany).toHaveBeenCalledWith({
        where: { itemId: { in: ['it-1', 'it-2'] } },
      });
      expect(mockPrisma.marketplaceListing.deleteMany).toHaveBeenCalledWith({
        where: { itemId: { in: ['it-1', 'it-2'] } },
      });
      expect(mockPrisma.itemImageVariant.deleteMany).toHaveBeenCalledWith({
        where: { itemImageId: { in: ['img-1'] } },
      });
      expect(mockPrisma.itemImage.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['img-1'] } },
      });
      expect(mockPrisma.item.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['it-1', 'it-2'] } },
      });
      expect(mockPrisma.storageLocation.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-to-delete' },
      });
      expect(mockPrisma.marketplaceAccount.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-to-delete' },
      });
      expect(mockPrisma.ebayAccount.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-to-delete' },
      });
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-to-delete' },
      });
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-to-delete' },
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-to-delete' },
      });
    });

    it('allows admin deletion if another administrator exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'admin-2',
        role: UserRole.ADMIN,
        email: 'admin2@listingmate.app',
      });
      mockPrisma.user.count.mockResolvedValueOnce(2); // 2 admins exist
      mockPrisma.item.findMany.mockResolvedValueOnce([]);
      mockPrisma.marketplaceAccount.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.delete.mockResolvedValueOnce({ id: 'admin-2' });

      const result = await UsersService.deleteUserAccount('admin-2');
      expect(result.success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'admin-2' },
      });
    });
  });
});
