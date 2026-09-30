import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FashionService } from '../items/fashion.service';

interface FashionAnalysisBody {
  itemId: string;
}

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate);

  /**
   * POST /api/v1/ai/fashion-analysis
   * Analyzes an item's uploaded photos with Gemini Fashion Intelligence.
   */
  fastify.post(
    '/fashion-analysis',
    async (req: FastifyRequest<{ Body: FashionAnalysisBody }>, reply: FastifyReply) => {
      try {
        const userId = (req as any).user.id;
        const itemId = req.body?.itemId;

        if (!itemId || typeof itemId !== 'string') {
          return reply.status(400).send({
            error: 'Missing required field: itemId in request body',
          });
        }

        const result = await FashionService.analyzeFashionItem(userId, itemId);
        return reply.send(result);
      } catch (err: any) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        return reply.status(500).send({
          error: err.message || 'Internal Server Error during fashion analysis',
        });
      }
    }
  );
}
