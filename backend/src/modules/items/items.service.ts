import { PrismaClient, ItemStatus, Prisma } from '@prisma/client';
import { CreateItemDto, UpdateItemDto, ListItemsQueryDto, ChangeItemStatusDto, UpdateItemPreparationDto } from './items.schema';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors';

import { storageService } from '../storage/storage.service';

const prisma = new PrismaClient();

export class ItemsService {
  static async create(userId: string, data: CreateItemDto) {
    const createData = { ...data } as any;
    Object.keys(createData).forEach(key => createData[key] === undefined && delete createData[key]);
    
    return prisma.item.create({
      data: {
        userId,
        ...createData,
        status: ItemStatus.DRAFT,
      },
    });
  }

  static async list(userId: string, query: ListItemsQueryDto) {
    const { page, limit, search, status, storageLocationId, sortBy } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {
      userId,
      ...(status && { status }),
      ...(storageLocationId && { storageLocationId }),
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ItemOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest_price':
        orderBy = { purchasePrice: 'desc' };
        break;
      case 'lowest_price':
        orderBy = { purchasePrice: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          storageLocation: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          listings: {
            include: {
              marketplace: true,
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    const hydratedItems = await Promise.all(
      items.map(async (item) => {
        const rawImages = item.images || [];
        const hydratedImages = await Promise.all(
          rawImages.map(async (img: any) => {
            try {
              const url = await storageService.getObjectUrl(img.storageKey);
              return { ...img, url };
            } catch (err) {
              console.warn(`Failed to resolve URL for image ${img.id}:`, err);
              return { ...img, url: null };
            }
          })
        );
        return {
          ...item,
          images: hydratedImages,
          photos: hydratedImages, // alias for mobile UI compatibility
        };
      })
    );

    return {
      data: hydratedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(userId: string, id: string) {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        storageLocation: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        listings: {
          include: {
            marketplace: true,
          },
        },
        recognition: true,
        listingDraft: true,
        pricingResearch: true,
        sale: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    if (item.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this item');
    }

    const rawImages = item.images || [];
    const hydratedImages = await Promise.all(
      rawImages.map(async (img: any) => {
        try {
          const url = await storageService.getObjectUrl(img.storageKey);
          return { ...img, url };
        } catch (err) {
          console.warn(`Failed to resolve URL for image ${img.id}:`, err);
          return { ...img, url: null };
        }
      })
    );

    return {
      ...item,
      images: hydratedImages,
      photos: hydratedImages, // alias for mobile UI compatibility
    };
  }

  static async update(userId: string, id: string, data: UpdateItemDto) {
    const item = await this.getById(userId, id);

    const updateData = { ...data } as any;
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    return prisma.item.update({
      where: { id: item.id },
      data: updateData,
    });
  }

  static async changeStatus(userId: string, id: string, data: ChangeItemStatusDto) {
    const item = await this.getById(userId, id);
    const currentStatus = item.status;
    const newStatus = data.status;

    // Define valid transitions
    const validTransitions: Record<ItemStatus, ItemStatus[]> = {
      DRAFT: [ItemStatus.INVENTORY, ItemStatus.ARCHIVED],
      INVENTORY: [ItemStatus.DRAFT, ItemStatus.LISTED, ItemStatus.SOLD, ItemStatus.ARCHIVED],
      LISTED: [ItemStatus.INVENTORY, ItemStatus.SOLD, ItemStatus.ARCHIVED],
      SOLD: [ItemStatus.INVENTORY, ItemStatus.ARCHIVED], // e.g. return
      ARCHIVED: [ItemStatus.DRAFT, ItemStatus.INVENTORY],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(`Cannot transition item status from ${currentStatus} to ${newStatus}`);
    }

    return prisma.item.update({
      where: { id: item.id },
      data: { status: newStatus },
    });
  }

  static async archive(userId: string, id: string) {
    const item = await this.getById(userId, id);

    return prisma.item.update({
      where: { id: item.id },
      data: { status: ItemStatus.ARCHIVED },
    });
  }

  static async updatePreparation(userId: string, id: string, data: UpdateItemPreparationDto) {
    const item = await this.getById(userId, id);
    const targetStatus = data.status;

    if (item.status === ItemStatus.ARCHIVED || item.status === ItemStatus.SOLD) {
      throw new ValidationError(`Cannot update preparation status for an item that is ${item.status}`);
    }

    const now = new Date();
    const updateData: {
      preparationStatus: string;
      preparedAt?: Date | null;
      readyToListAt?: Date | null;
    } = {
      preparationStatus: targetStatus,
    };

    if (targetStatus === 'PREPARED') {
      updateData.preparedAt = item.preparedAt || now;
    } else if (targetStatus === 'READY_TO_LIST') {
      updateData.preparedAt = item.preparedAt || now;
      updateData.readyToListAt = item.readyToListAt || now;
    } else if (targetStatus === 'UNPREPARED') {
      updateData.preparedAt = null;
      updateData.readyToListAt = null;
    }

    return prisma.item.update({
      where: { id: item.id },
      data: updateData,
    });
  }
}
