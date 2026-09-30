import { FastifyReply, FastifyRequest } from 'fastify';
import { StorageLocationsService } from './storage-locations.service';
import { 
  CreateStorageLocationDto, 
  UpdateStorageLocationDto,
  createStorageLocationSchema,
  updateStorageLocationSchema 
} from './storage-locations.schema';
import { z } from 'zod';

export class StorageLocationsController {
  static async create(req: FastifyRequest<{ Body: CreateStorageLocationDto }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const parseResult = createStorageLocationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: parseResult.error.issues[0]?.message || 'Validation failed',
          details: parseResult.error.issues,
        });
      }
      const location = await StorageLocationsService.create(userId, parseResult.data);
      return reply.status(201).send(location);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async list(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const locations = await StorageLocationsService.list(userId);
      return reply.send(locations);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const location = await StorageLocationsService.getById(userId, req.params.id);
      return reply.send(location);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async update(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateStorageLocationDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user?.id;
      const parseResult = updateStorageLocationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: parseResult.error.issues[0]?.message || 'Validation failed',
          details: parseResult.error.issues,
        });
      }
      const location = await StorageLocationsService.update(userId, req.params.id, parseResult.data);
      return reply.send(location);
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      await StorageLocationsService.delete(userId, req.params.id);
      return reply.status(204).send();
    } catch (error: any) {
      if (error.statusCode) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

