import { FastifyInstance } from 'fastify';
import { StorageLocationsController } from './storage-locations.controller';

export async function storageLocationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', StorageLocationsController.create);
  fastify.get('/', StorageLocationsController.list);
  fastify.get('/:id', StorageLocationsController.getById);
  fastify.patch('/:id', StorageLocationsController.update);
  fastify.delete('/:id', StorageLocationsController.delete);
}
