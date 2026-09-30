import { FastifyReply, FastifyRequest } from 'fastify';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ListItemsQueryDto, ChangeItemStatusDto, UpdateItemPreparationDto, updateItemPreparationSchema } from './items.schema';
import { ItemRecognitionService } from './item-recognition.service';
import { ListingGenerationService } from './listing-generation.service';
import { BillingService } from '../billing/billing.service';

export class ItemsController {
  static async create(req: FastifyRequest<{ Body: CreateItemDto }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      await BillingService.assertCanCreateItem(userId);
      const item = await ItemsService.create(userId, req.body);
      return reply.status(201).send(item);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async list(req: FastifyRequest<{ Querystring: ListItemsQueryDto }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await ItemsService.list(userId, req.query);
      return reply.send(result);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const item = await ItemsService.getById(userId, req.params.id);
      return reply.send(item);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async update(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateItemDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const item = await ItemsService.update(userId, req.params.id, req.body);
      return reply.send(item);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async changeStatus(
    req: FastifyRequest<{ Params: { id: string }; Body: ChangeItemStatusDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const item = await ItemsService.changeStatus(userId, req.params.id, req.body);
      return reply.send(item);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async archive(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const item = await ItemsService.archive(userId, req.params.id);
      return reply.send(item);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updatePreparation(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateItemPreparationDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const parseResult = updateItemPreparationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.issues[0]?.message || 'Invalid preparation status' });
      }
      const item = await ItemsService.updatePreparation(userId, req.params.id, parseResult.data);
      return reply.send(item);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
