import { FastifyReply, FastifyRequest } from 'fastify';
import { ItemHistoryService } from './item-history.service';

export class ItemHistoryController {
  static async getHistory(req: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const history = await ItemHistoryService.getHistory(userId, req.params.itemId);
      return reply.send(history);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
