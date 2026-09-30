// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemsService } from './items.service';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors';
import { ItemStatus } from '@prisma/client';

const mockPrisma = vi.hoisted(() => ({
  item: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    item = mockPrisma.item;
  },
  ItemStatus: {
    DRAFT: 'DRAFT',
    INVENTORY: 'INVENTORY',
    LISTED: 'LISTED',
    SOLD: 'SOLD',
    ARCHIVED: 'ARCHIVED',
  },
}));

describe('ItemsService (Phase 23 Item Management & Inventory)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('filters items by user, search, status, and storage location', async () => {
      mockPrisma.item.findMany.mockResolvedValueOnce([
        { id: 'item-1', title: 'Vintage Jacket', status: 'INVENTORY' },
      ]);
      mockPrisma.item.count.mockResolvedValueOnce(1);

      const result = await ItemsService.list('user-1', {
        page: 1,
        limit: 20,
        search: 'Vintage',
        status: ItemStatus.INVENTORY,
        storageLocationId: 'loc-1',
        sortBy: 'highest_price',
      });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            status: 'INVENTORY',
            storageLocationId: 'loc-1',
            OR: expect.any(Array),
          }),
          orderBy: { purchasePrice: 'desc' },
        })
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('archive', () => {
    it('sets item status to ARCHIVED when authorized', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
      });
      mockPrisma.item.update.mockResolvedValueOnce({
        id: 'item-1',
        status: ItemStatus.ARCHIVED,
      });

      const updated = await ItemsService.archive('user-1', 'item-1');
      expect(updated.status).toBe(ItemStatus.ARCHIVED);
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: ItemStatus.ARCHIVED },
      });
    });

    it('rejects archiving an item owned by another user', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-other',
        status: ItemStatus.INVENTORY,
      });

      await expect(ItemsService.archive('user-1', 'item-1')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('rejects archiving nonexistent item', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce(null);

      await expect(ItemsService.archive('user-1', 'item-unknown')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('changeStatus', () => {
    it('allows valid status transitions', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.DRAFT,
      });
      mockPrisma.item.update.mockResolvedValueOnce({
        id: 'item-1',
        status: ItemStatus.INVENTORY,
      });

      const updated = await ItemsService.changeStatus('user-1', 'item-1', {
        status: ItemStatus.INVENTORY,
      });
      expect(updated.status).toBe(ItemStatus.INVENTORY);
    });

    it('rejects invalid status transitions', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.DRAFT,
      });

      await expect(
        ItemsService.changeStatus('user-1', 'item-1', {
          status: ItemStatus.SOLD,
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
