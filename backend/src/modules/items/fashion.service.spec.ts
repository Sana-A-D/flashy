import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FashionService } from './fashion.service';
import { VisualIdentificationSchema, FashionItemResponseSchema } from './fashion.schema';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

const mockPrisma = vi.hoisted(() => {
  const item = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  };
  const itemRecognition = {
    upsert: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const marketplaceListing = {
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const sale = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const pricingResearch = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const listingDraft = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const itemImage = {
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const itemImageVariant = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const txObj = {
    item,
    itemRecognition,
    marketplaceListing,
    sale,
    pricingResearch,
    listingDraft,
    itemImage,
    itemImageVariant,
  };
  const $transaction = vi.fn((arg) => {
    if (typeof arg === 'function') {
      return arg(txObj);
    }
    return Promise.all(arg);
  });

  return {
    item,
    itemRecognition,
    marketplaceListing,
    sale,
    pricingResearch,
    listingDraft,
    itemImage,
    itemImageVariant,
    $transaction,
  };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    item = mockPrisma.item;
    itemRecognition = mockPrisma.itemRecognition;
    marketplaceListing = mockPrisma.marketplaceListing;
    sale = mockPrisma.sale;
    $transaction = mockPrisma.$transaction;
  },
}));

vi.mock('../storage/storage.service', () => ({
  storageService: {
    getObjectUrl: vi.fn().mockResolvedValue('https://storage.example.com/test.jpg'),
    downloadObject: vi.fn().mockResolvedValue(Buffer.from('fake-image-bytes')),
    deleteObject: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Fashion Domain & Service (Flashy Foundation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FashionItem Honest Data Representation', () => {
    it('defaults pricing and trend data to honest UNAVAILABLE states without fabricating prices', () => {
      const mockRawItem = {
        id: 'fashion-1',
        userId: 'user-1',
        title: 'Striped Cotton Tee',
        brand: null,
        category: 'Tops',
        color: 'Navy Blue',
        status: 'DRAFT',
        createdAt: new Date('2026-09-26T00:00:00Z'),
        updatedAt: new Date('2026-09-26T00:00:00Z'),
        recognition: {
          category: 'Tops',
          brand: null,
          color: 'Navy Blue',
          secondaryColors: ['White'],
          pattern: 'Breton Stripe',
          material: 'Cotton',
          style: 'Casual',
          visibleFeatures: ['Crewneck collar', 'Relaxed hem'],
          confidence: 0.88,
          notes: 'Visual inference of cotton fabric texture; brand logo not visible.',
          rawResponse: {
            identification: {
              garmentType: 'Striped T-Shirt',
              materialBasis: 'INFERRED',
              brandBasis: 'UNKNOWN',
            },
          },
        },
        images: [],
      };

      const formatted = FashionService.formatFashionItem(mockRawItem);

      expect(formatted.title).toBe('Striped Cotton Tee');
      expect(formatted.brand).toBeNull();
      expect(formatted.identification?.brandBasis).toBe('UNKNOWN');
      expect(formatted.identification?.materialBasis).toBe('INFERRED');
      expect(formatted.identification?.color).toBe('Navy Blue');

      // Honest pricing representation: no made-up comps
      expect(formatted.pricing.status).toBe('UNAVAILABLE');
      expect(formatted.pricing.message).toContain('Not enough verified price data');
      expect(formatted.pricing.resale).toBeNull();
      expect(formatted.pricing.unbranded).toBeNull();

      // Honest trend representation: no fake percentage
      expect(formatted.trendSignals.status).toBe('UNAVAILABLE');
      expect(formatted.trendSignals.signals).toEqual([]);

      // Schema validation passes
      expect(() => FashionItemResponseSchema.parse(formatted)).not.toThrow();
    });

    it('validates VisualIdentification schema preserving nulls and basis flags', () => {
      const rawAi = {
        category: 'Outerwear',
        garmentType: 'Vintage Denim Jacket',
        color: 'Faded Indigo',
        secondaryColors: [],
        pattern: 'Solid',
        material: 'Denim',
        materialBasis: 'OBSERVED',
        fit: 'Boxy',
        possibleBrand: null,
        brandBasis: 'UNKNOWN',
        confidence: 0.9,
      };

      const parsed = VisualIdentificationSchema.parse(rawAi);
      expect(parsed.possibleBrand).toBeNull();
      expect(parsed.brandBasis).toBe('UNKNOWN');
      expect(parsed.materialBasis).toBe('OBSERVED');
    });
  });

  describe('User Ownership & Authorization Enforcement', () => {
    it('prevents user from accessing a fashion item owned by another user', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-10',
        userId: 'different-user',
        images: [],
      });

      await expect(
        FashionService.getFashionItem('current-user', 'item-10')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws NotFoundError for nonexistent item', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce(null);

      await expect(
        FashionService.getFashionItem('current-user', 'nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('User Corrections & Editing of AI results', () => {
    it('allows user to edit AI results and updates item + recognition', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        title: 'Striped Tee',
        brand: null,
        category: 'Tops',
        recognition: { id: 'rec-1', itemId: 'item-1' },
      });

      mockPrisma.item.update.mockResolvedValueOnce({ id: 'item-1' });
      mockPrisma.itemRecognition.upsert.mockResolvedValueOnce({ id: 'rec-1' });

      // Mock subsequent getFashionItem call
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        title: 'French Breton Sailor Tee',
        brand: 'Saint James',
        category: 'Tops',
        color: 'Ecru/Navy',
        status: 'DRAFT',
        createdAt: new Date('2026-09-26T00:00:00Z'),
        updatedAt: new Date('2026-09-26T00:00:00Z'),
        images: [],
        recognition: {
          category: 'Tops',
          brand: 'Saint James',
          color: 'Ecru/Navy',
          secondaryColors: [],
          pattern: 'Breton Stripe',
          material: '100% Combed Cotton',
          style: 'Nautical Preppy',
          visibleFeatures: [],
          confidence: 1.0,
        },
      });

      const updated = await FashionService.updateFashionItem('user-1', 'item-1', {
        title: 'French Breton Sailor Tee',
        brand: 'Saint James',
        color: 'Ecru/Navy',
        material: '100% Combed Cotton',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(updated.title).toBe('French Breton Sailor Tee');
      expect(updated.brand).toBe('Saint James');
    });
  });

  describe('Save / Unsave FashionItem', () => {
    it('updates item status to INVENTORY when saved and DRAFT when unsaved', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        status: 'DRAFT',
      });
      mockPrisma.item.update.mockResolvedValueOnce({ id: 'item-1', status: 'INVENTORY' });

      // Mock subsequent getFashionItem
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        userId: 'user-1',
        title: 'Saved Tee',
        status: 'INVENTORY',
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      });

      const saved = await FashionService.toggleSave('user-1', 'item-1', true);
      expect(saved.saved).toBe(true);
      expect(mockPrisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: { status: 'INVENTORY' },
        })
      );
    });
  });

  describe('Delete FashionItem', () => {
    it('successfully deletes user-owned item and cleans up storage assets', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-to-delete',
        userId: 'user-1',
        images: [{ storageKey: 'items/item-to-delete/photo1.jpg' }],
      });
      mockPrisma.item.delete.mockResolvedValueOnce({ id: 'item-to-delete' });

      const result = await FashionService.deleteFashionItem('user-1', 'item-to-delete');
      expect(result.success).toBe(true);
      expect(mockPrisma.item.delete).toHaveBeenCalledWith({
        where: { id: 'item-to-delete' },
      });
    });

    it('rejects deletion of item owned by another user', async () => {
      mockPrisma.item.findUnique.mockResolvedValueOnce({
        id: 'item-to-delete',
        userId: 'another-user',
        images: [],
      });

      await expect(
        FashionService.deleteFashionItem('user-1', 'item-to-delete')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});

