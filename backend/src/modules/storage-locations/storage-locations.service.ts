import { PrismaClient } from '@prisma/client';
import { CreateStorageLocationDto, UpdateStorageLocationDto } from './storage-locations.schema';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

const prisma = new PrismaClient();

export class StorageLocationsService {
  static async create(userId: string, data: CreateStorageLocationDto) {
    return prisma.storageLocation.create({
      data: {
        userId,
        name: data.name,
      },
    });
  }

  static async list(userId: string) {
    return prisma.storageLocation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(userId: string, id: string) {
    const location = await prisma.storageLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundError('Storage location not found');
    }

    if (location.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this storage location');
    }

    return location;
  }

  static async update(userId: string, id: string, data: UpdateStorageLocationDto) {
    const location = await this.getById(userId, id);

    return prisma.storageLocation.update({
      where: { id: location.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {})
      },
    });
  }

  static async delete(userId: string, id: string) {
    const location = await this.getById(userId, id);

    await prisma.storageLocation.delete({
      where: { id: location.id },
    });
  }
}
