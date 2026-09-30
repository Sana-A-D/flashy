// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageLocationsService } from './storage-locations.service';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

const mockPrisma = vi.hoisted(() => ({
  storageLocation: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    storageLocation = mockPrisma.storageLocation;
  },
}));

describe('StorageLocationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates a storage location scoped to the user', async () => {
      mockPrisma.storageLocation.create.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-1',
        name: 'Bin A1',
      });

      const result = await StorageLocationsService.create('user-1', { name: 'Bin A1' });

      expect(mockPrisma.storageLocation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'Bin A1',
        },
      });
      expect(result.name).toBe('Bin A1');
    });
  });

  describe('list', () => {
    it('returns only storage locations for the authenticated user ordered by createdAt desc', async () => {
      mockPrisma.storageLocation.findMany.mockResolvedValueOnce([
        { id: 'loc-1', userId: 'user-1', name: 'Bin A1' },
      ]);

      const result = await StorageLocationsService.list('user-1');

      expect(mockPrisma.storageLocation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns storage location if owned by requesting user', async () => {
      mockPrisma.storageLocation.findUnique.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-1',
        name: 'Bin A1',
      });

      const result = await StorageLocationsService.getById('user-1', 'loc-1');
      expect(result.id).toBe('loc-1');
    });

    it('throws NotFoundError if location does not exist', async () => {
      mockPrisma.storageLocation.findUnique.mockResolvedValueOnce(null);

      await expect(StorageLocationsService.getById('user-1', 'loc-unknown')).rejects.toThrow(NotFoundError);
    });

    it('throws UnauthorizedError if location belongs to another user', async () => {
      mockPrisma.storageLocation.findUnique.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-other',
        name: 'Bin A1',
      });

      await expect(StorageLocationsService.getById('user-1', 'loc-1')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('update', () => {
    it('updates storage location name when authorized', async () => {
      mockPrisma.storageLocation.findUnique.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-1',
        name: 'Bin A1',
      });
      mockPrisma.storageLocation.update.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-1',
        name: 'Bin A2',
      });

      const result = await StorageLocationsService.update('user-1', 'loc-1', { name: 'Bin A2' });
      expect(mockPrisma.storageLocation.update).toHaveBeenCalledWith({
        where: { id: 'loc-1' },
        data: { name: 'Bin A2' },
      });
      expect(result.name).toBe('Bin A2');
    });
  });

  describe('delete', () => {
    it('deletes storage location when authorized', async () => {
      mockPrisma.storageLocation.findUnique.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-1',
        name: 'Bin A1',
      });
      mockPrisma.storageLocation.delete.mockResolvedValueOnce({
        id: 'loc-1',
      });

      await StorageLocationsService.delete('user-1', 'loc-1');
      expect(mockPrisma.storageLocation.delete).toHaveBeenCalledWith({
        where: { id: 'loc-1' },
      });
    });

    it('throws UnauthorizedError when attempting to delete another user location', async () => {
      mockPrisma.storageLocation.findUnique.mockResolvedValueOnce({
        id: 'loc-1',
        userId: 'user-other',
        name: 'Bin A1',
      });

      await expect(StorageLocationsService.delete('user-1', 'loc-1')).rejects.toThrow(UnauthorizedError);
    });
  });
});
