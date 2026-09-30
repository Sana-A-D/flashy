import { FastifyInstance } from 'fastify';
import { AnalyticsController } from './analytics.controller';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate);

  fastify.get('/metrics', AnalyticsController.getMetrics);
  fastify.get('/sales-history', AnalyticsController.getSalesHistory);
}
