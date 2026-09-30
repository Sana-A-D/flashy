import { FastifyReply, FastifyRequest } from 'fastify';
import { FashionService } from './fashion.service';
import { UpdateFashionItemDto, UpdateFashionItemSchema } from './fashion.schema';

export class FashionController {
  static async create(req: FastifyRequest<{ Body?: { title?: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await FashionService.createFashionItem(userId, req.body);
      return reply.status(201).send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await FashionService.getFashionItem(userId, req.params.id);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async analyze(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await FashionService.analyzeFashionItem(userId, req.params.id);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async update(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateFashionItemDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const parseResult = UpdateFashionItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.issues[0]?.message || 'Invalid input' });
      }
      const result = await FashionService.updateFashionItem(userId, req.params.id, parseResult.data);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async toggleSave(
    req: FastifyRequest<{ Params: { id: string }; Body: { save: boolean } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const save = Boolean(req.body?.save);
      const result = await FashionService.toggleSave(userId, req.params.id, save);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async list(
    req: FastifyRequest<{ Querystring: { filter?: 'SAVED' | 'RECENT' | 'ALL' } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const filter = req.query.filter || 'ALL';
      const result = await FashionService.listFashionItems(userId, filter);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async research(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await FashionService.researchFashionItem(userId, req.params.id);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await FashionService.deleteFashionItem(userId, req.params.id);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async batchDelete(req: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const result = await FashionService.batchDeleteFashionItems(userId, ids);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }

  static async clearHistory(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await FashionService.clearScanHistory(userId);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.status(err.statusCode).send({ error: err.message });
      return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
  }
}

