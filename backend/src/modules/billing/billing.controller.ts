import { FastifyReply, FastifyRequest } from 'fastify';
import { BillingService } from './billing.service';
import { upgradePlanSchema } from './billing.schema';
import { z } from 'zod';

export class BillingController {
  static async getSubscription(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const data = await BillingService.getSubscription(userId);
      return reply.send({ success: true, data });
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updatePlan(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const parsed = upgradePlanSchema.parse(req.body);
      const result = await BillingService.updatePlan(userId, parsed);
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

  static async cancelSubscription(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.id;
      const result = await BillingService.cancelSubscription(userId);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
