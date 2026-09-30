import { FastifyRequest, FastifyReply } from 'fastify';
import { listingGenerationService } from './listing-generation.service';
import { ListingDraftSchema } from './listing-generation.schema';

export class ListingGenerationController {
  static async startGeneration(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const { itemId } = request.params;
    const userId = (request.user as any).id;

    try {
      const draft = await listingGenerationService.startGeneration(itemId, userId);
      return reply.send(draft);
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) {
        return reply.status(404).send({ error: 'Item not found' });
      }
      if (error.message.includes('UNAUTHORIZED')) {
        return reply.status(403).send({ error: 'Unauthorized' });
      }
      if (error.message.includes('RECOGNITION_NOT_COMPLETED')) {
         return reply.status(400).send({ error: 'Item recognition is not complete' });
      }
      if (error.message.includes('ALREADY_PROCESSING')) {
          return reply.status(409).send({ error: 'Generation already in progress' });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getGeneration(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const { itemId } = request.params;
    const userId = (request.user as any).id;

    try {
      const draft = await listingGenerationService.getDraft(itemId, userId);
      if (!draft) {
        return reply.status(404).send({ error: 'Draft not found' });
      }
      return reply.send(draft);
    } catch (error: any) {
      if (error.message.includes('UNAUTHORIZED')) {
        return reply.status(403).send({ error: 'Unauthorized' });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateGeneration(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const { itemId } = request.params;
    const userId = (request.user as any).id;

    try {
      const parsedData = ListingDraftSchema.parse(request.body);
      const draft = await listingGenerationService.updateDraft(itemId, userId, parsedData);
      return reply.send(draft);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid input data', details: error.errors });
      }
      if (error.message.includes('NOT_FOUND')) {
        return reply.status(404).send({ error: 'Item not found' });
      }
      if (error.message.includes('UNAUTHORIZED')) {
        return reply.status(403).send({ error: 'Unauthorized' });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
