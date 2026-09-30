import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from './analytics.service';
import { analyticsQuerySchema } from './analytics.schema';
import { z } from 'zod';

export class AnalyticsController {
  static async getMetrics(request: FastifyRequest<{ Querystring: { period?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    try {
      const query = analyticsQuerySchema.parse(request.query);
      const metrics = await AnalyticsService.getProfitMetrics(userId, query);
      return reply.send({ data: metrics });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: (error as any).errors });
      }
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getSalesHistory(request: FastifyRequest<{ Querystring: { period?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    try {
      const query = analyticsQuerySchema.parse(request.query);
      const history = await AnalyticsService.getSalesHistory(userId, query);
      return reply.send({ data: history });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: (error as any).errors });
      }
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
