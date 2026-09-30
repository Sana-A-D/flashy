import { FastifyInstance } from 'fastify';
import { AdminController } from './admin.controller';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate);

  fastify.get('/stats', AdminController.getStats);
  fastify.get('/users', AdminController.listUsers);
  fastify.patch('/users/:id/role', AdminController.updateUserRole);
  fastify.patch('/users/:id/subscription', AdminController.updateUserSubscription);
}
