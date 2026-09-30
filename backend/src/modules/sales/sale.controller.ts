import { FastifyRequest, FastifyReply } from 'fastify';
import { SaleService } from './sale.service';
import { recordSaleSchema } from './sale.schema';
import { z } from 'zod';

export class SaleController {
  static async getSale(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId } = request.params;

    const sale = await SaleService.getSale(userId, itemId);
    return sale || { message: 'No sale record found' };
  }

  static async recordSale(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId } = request.params;

    try {
      const input = recordSaleSchema.parse(request.body);
      const result = await SaleService.recordSale(userId, itemId, input);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          details: (error as any).errors,
        });
      }

      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
