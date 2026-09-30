import { FastifyInstance } from 'fastify';
import { UsersController } from './users.controller';

export async function usersRoutes(fastify: FastifyInstance) {
  // All user data & privacy endpoints strictly require authentication
  fastify.addHook('onRequest', (fastify as any).authenticate);

  fastify.get('/export', UsersController.exportData);
  fastify.delete('/account', UsersController.deleteAccount);
}
