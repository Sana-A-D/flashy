import { FastifyRequest, FastifyReply } from 'fastify';
import { DelistingService } from './delisting.service';

const delistingService = new DelistingService();

export class DelistingController {
  static async getDelistingStatus(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId } = request.params;

    try {
      const activeListings = await delistingService.getDelistingStatus(userId, itemId);
      return reply.status(200).send({ listings: activeListings });
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async performDelisting(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId } = request.params;

    try {
      const results = await delistingService.performDelisting(userId, itemId);
      return reply.status(200).send({ results });
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
