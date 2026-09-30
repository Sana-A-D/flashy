import { FastifyReply, FastifyRequest } from 'fastify';
import { AdminService } from './admin.service';
import { listUsersQuerySchema, updateUserRoleSchema, updateUserSubscriptionSchema } from './admin.schema';
import { z } from 'zod';

export class AdminController {
  static async getStats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const stats = await AdminService.getStats(userId);
      return reply.send({ success: true, data: stats });
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async listUsers(
    req: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const query = listUsersQuerySchema.parse(req.query);
      const result = await AdminService.listUsers(userId, query);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.issues });
      }
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateUserRole(
    req: FastifyRequest<{ Params: { id: string }; Body: any }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const targetUserId = req.params.id;
      const parsed = updateUserRoleSchema.parse(req.body);
      const user = await AdminService.updateUserRole(userId, targetUserId, parsed);
      return reply.send({ success: true, data: user });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.issues });
      }
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateUserSubscription(
    req: FastifyRequest<{ Params: { id: string }; Body: any }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const targetUserId = req.params.id;
      const parsed = updateUserSubscriptionSchema.parse(req.body);
      const result = await AdminService.updateUserSubscription(userId, targetUserId, parsed);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.issues });
      }
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
