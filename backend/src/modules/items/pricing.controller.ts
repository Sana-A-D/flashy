import { FastifyRequest, FastifyReply } from 'fastify';
import { PricingService } from './pricing.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PricingController {
  static async getPricing(req: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const { itemId } = req.params;
    const userId = (req.user as any).id;

    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      return reply.status(404).send({ message: 'Item not found' });
    }

    const research = await PricingService.getResearch(itemId);
    return reply.send(research || { status: 'NONE' });
  }

  static async performResearch(req: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const { itemId } = req.params;
    const userId = (req.user as any).id;

    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      return reply.status(404).send({ message: 'Item not found' });
    }

    try {
      const research = await PricingService.performResearch(itemId);
      return reply.send(research);
    } catch (error) {
      console.error('Pricing research error:', error);
      return reply.status(500).send({ message: 'Failed to perform pricing research' });
    }
  }
}
