// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { BillingService } from '../billing/billing.service';
import { ValidationError } from '../../shared/errors';

vi.mock('./items.service', () => ({
  ItemsService: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
    archive: vi.fn(),
  },
}));

vi.mock('../billing/billing.service', () => ({
  BillingService: {
    assertCanCreateItem: vi.fn(),
  },
}));

describe('Phase 27 Production Readiness & Reliability (ItemsController Quota & Security)', () => {
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('rejects item creation when subscription limit has been reached on the backend', async () => {
    const mockReq = {
      user: { id: 'user-quota-exceeded' },
      body: { title: 'Designer Handbag' },
    };

    vi.mocked(BillingService.assertCanCreateItem).mockRejectedValueOnce(
      new ValidationError('Your current plan limit of 10 items has been reached.')
    );

    await ItemsController.create(mockReq as any, mockReply);

    expect(BillingService.assertCanCreateItem).toHaveBeenCalledWith('user-quota-exceeded');
    expect(ItemsService.create).not.toHaveBeenCalled();
    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Your current plan limit of 10 items has been reached.',
    });
  });

  it('allows item creation when user is within quota', async () => {
    const mockReq = {
      user: { id: 'user-valid' },
      body: { title: 'Wool Sweater' },
    };

    vi.mocked(BillingService.assertCanCreateItem).mockResolvedValueOnce(true);
    vi.mocked(ItemsService.create).mockResolvedValueOnce({
      id: 'item-new',
      userId: 'user-valid',
      title: 'Wool Sweater',
    } as any);

    await ItemsController.create(mockReq as any, mockReply);

    expect(BillingService.assertCanCreateItem).toHaveBeenCalledWith('user-valid');
    expect(ItemsService.create).toHaveBeenCalledWith('user-valid', { title: 'Wool Sweater' });
    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-new', title: 'Wool Sweater' })
    );
  });
});
