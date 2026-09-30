import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';

export default fp(async (server, opts) => {
  server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production'
  });

  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }
  });
});

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any;
  }
  export interface FastifyRequest {
    user?: any;
  }
}
