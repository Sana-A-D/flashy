import { FastifyInstance } from 'fastify';
import { BillingController } from './billing.controller';

export async function billingRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate);

  fastify.get('/subscription', BillingController.getSubscription);
  fastify.post('/upgrade', BillingController.updatePlan);
  fastify.post('/cancel', BillingController.cancelSubscription);
}
