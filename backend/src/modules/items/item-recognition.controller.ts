import { FastifyReply, FastifyRequest } from 'fastify';
import { itemRecognitionService } from './item-recognition.service';
import { UpdateItemRecognitionSchema } from './item-recognition.schema';
import { NotFoundError } from '../../shared/errors';

export class ItemRecognitionController {
  static async startRecognition(
    req: FastifyRequest<{ Params: { itemId: string }; Querystring: { sync?: string } }>,
    reply: FastifyReply
  ) {
    const userId = (req as any).user.id;
    const { itemId } = req.params;
    const isSync = req.query.sync === 'true';

    try {
      if (isSync) {
        const result = await itemRecognitionService.runRecognitionSync(userId, itemId);
        return reply.code(200).send(result);
      }
      const result = await itemRecognitionService.startRecognition(userId, itemId);
      return reply.code(200).send(result);
    } catch (error: any) {
      if (error.message.startsWith('NOT_FOUND')) {
        throw new NotFoundError('Item not found');
      }
      throw error;
    }
  }

  static async getRecognition(req: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const { itemId } = req.params;

    try {
      const result = await itemRecognitionService.getRecognition(userId, itemId);
      return reply.code(200).send(result || null);
    } catch (error: any) {
      if (error.message.startsWith('NOT_FOUND')) {
        throw new NotFoundError('Item not found');
      }
      throw error;
    }
  }

  static async updateRecognition(req: FastifyRequest<{ Params: { itemId: string }, Body: any }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const { itemId } = req.params;
    
    // Zod validation is handled by route schema config, but we can double check
    const data = req.body as any;

    try {
      const result = await itemRecognitionService.updateRecognition(userId, itemId, data);
      return reply.code(200).send(result);
    } catch (error: any) {
      if (error.message.startsWith('NOT_FOUND')) {
        throw new NotFoundError('Item or recognition not found');
      }
      throw error;
    }
  }
}
