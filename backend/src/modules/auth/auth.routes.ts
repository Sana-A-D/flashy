import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';

export async function authRoutes(server: FastifyInstance) {
  server.post('/register', authController.register);
  server.post('/login', authController.login);
  server.post('/refresh', authController.refresh);
  server.post('/logout', authController.logout);
  
  server.get('/me', { preValidation: [server.authenticate] }, authController.me);
}
