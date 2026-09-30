// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemsService } from './items.service';
import { ItemHistoryService } from './item-history.service';
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

describe('Phase 28 — Item Preparation & Listing Readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePreparation', () => {
    it('successfully transitions an item from UNPREPARED to PREPARED', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
        preparationStatus: 'UNPREPARED',
        preparedAt: null,
        readyToListAt: null,
      });

      mockPrisma.item.update.mockImplementationOnce(async ({ data }) => ({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
        ...data,
      }));

      const updated = await ItemsService.updatePreparation('user-1', 'item-1', {
        status: 'PREPARED',
      });

      expect(updated.preparationStatus).toBe('PREPARED');
      expect(updated.preparedAt).toBeInstanceOf(Date);
      expect(mockPrisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: expect.objectContaining({
            preparationStatus: 'PREPARED',
            preparedAt: expect.any(Date),
          }),
        })
      );
    });

    it('successfully marks an item READY_TO_LIST', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
        preparationStatus: 'PREPARED',
        preparedAt: new Date('2026-09-01T10:00:00Z'),
        readyToListAt: null,
      });

      mockPrisma.item.update.mockImplementationOnce(async ({ data }) => ({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
        ...data,
      }));

      const updated = await ItemsService.updatePreparation('user-1', 'item-1', {
        status: 'READY_TO_LIST',
      });

      expect(updated.preparationStatus).toBe('READY_TO_LIST');
      expect(updated.readyToListAt).toBeInstanceOf(Date);
      expect(mockPrisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: expect.objectContaining({
            preparationStatus: 'READY_TO_LIST',
            readyToListAt: expect.any(Date),
          }),
        })
      );
    });

    it('reverts item preparation back to UNPREPARED', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
        preparationStatus: 'READY_TO_LIST',
        preparedAt: new Date('2026-09-01T10:00:00Z'),
        readyToListAt: new Date('2026-09-01T11:00:00Z'),
      });

      mockPrisma.item.update.mockImplementationOnce(async ({ data }) => ({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.INVENTORY,
        ...data,
      }));

      const updated = await ItemsService.updatePreparation('user-1', 'item-1', {
        status: 'UNPREPARED',
      });

      expect(updated.preparationStatus).toBe('UNPREPARED');
      expect(updated.preparedAt).toBeNull();
      expect(updated.readyToListAt).toBeNull();
    });

    it('rejects modification if the item belongs to another user (ownership enforcement)', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-attacker',
        status: ItemStatus.INVENTORY,
        preparationStatus: 'UNPREPARED',
      });

      await expect(
        ItemsService.updatePreparation('user-victim', 'item-1', {
          status: 'PREPARED',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects preparation change for ARCHIVED or SOLD items', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: ItemStatus.ARCHIVED,
        preparationStatus: 'UNPREPARED',
      });

      await expect(
        ItemsService.updatePreparation('user-1', 'item-1', {
          status: 'PREPARED',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('ItemHistoryService preparation events', () => {
    it('synthesizes ITEM_PREPARED and ITEM_READY_TO_LIST history events', async () => {
      const preparedAt = new Date('2026-09-01T10:00:00Z');
      const readyToListAt = new Date('2026-09-01T12:00:00Z');

      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2026-09-01T08:00:00Z'),
        updatedAt: new Date('2026-09-01T12:00:00Z'),
        status: ItemStatus.INVENTORY,
        preparationStatus: 'READY_TO_LIST',
        preparedAt,
        readyToListAt,
        images: [],
        recognition: null,
        listingDraft: null,
        listings: [],
        sale: null,
        pricingResearch: null,
      });

      const events = await ItemHistoryService.getHistory('user-1', 'item-1');

      const preparedEvent = events.find((e) => e.type === 'ITEM_PREPARED');
      const readyEvent = events.find((e) => e.type === 'ITEM_READY_TO_LIST');

      expect(preparedEvent).toBeDefined();
      expect(preparedEvent?.title).toBe('Item Prepared (Cleaned & Inspected)');
      expect(preparedEvent?.timestamp).toEqual(preparedAt);

      expect(readyEvent).toBeDefined();
      expect(readyEvent?.title).toBe('Item Marked Ready to List');
      expect(readyEvent?.timestamp).toEqual(readyToListAt);
    });
  });
});
