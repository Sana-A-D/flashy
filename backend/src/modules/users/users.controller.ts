import { FastifyReply, FastifyRequest } from 'fastify';
import { UsersService } from './users.service';
import { deleteAccountSchema } from './users.schema';
import { z } from 'zod';

export class UsersController {
  /**
   * Export authenticated user's data
   */
  static async exportData(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const data = await UsersService.exportUserData(userId);
      return reply.send({ success: true, data });
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Delete authenticated user's account
   */
  static async deleteAccount(
    req: FastifyRequest<{ Body: any }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      deleteAccountSchema.parse(req.body);

      const result = await UsersService.deleteUserAccount(userId);
      return reply.send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.issues?.[0]?.message || 'Validation failed',
          details: error.issues,
        });
      }
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
