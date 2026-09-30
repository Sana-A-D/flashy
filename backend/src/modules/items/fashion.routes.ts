import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { FashionController } from './fashion.controller';
import { ItemImagesController } from './item-images.controller';
import { storageService } from '../storage/storage.service';

export async function fashionRoutes(fastify: FastifyInstance) {
  // Allow public access to view scanned photos without auth header and skip auth for OPTIONS preflight
  fastify.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS' || req.url.includes('/images/file')) {
      return;
    }
    return (fastify as any).authenticate(req, reply);
  });

  // Public image serving for FashionItem scanned photos
  fastify.get('/images/file', async (req: FastifyRequest<{ Querystring: { key: string } }>, reply: FastifyReply) => {
    const key = req.query.key;
    if (!key) {
      return reply.status(400).send({ error: 'Missing key parameter' });
    }
    const item = storageService.getLocalObject(key);
    if (!item) {
      return reply.status(404).send({ error: 'Image not found' });
    }
    return reply
      .header('Content-Type', item.mimeType)
      .header('Cache-Control', 'public, max-age=86400')
      .send(item.buffer);
  });

  // Core FashionItem management
  fastify.post('/items', FashionController.create);
  fastify.get('/items', FashionController.list);
  fastify.get('/items/:id', FashionController.getById);
  fastify.patch('/items/:id', FashionController.update);
  fastify.post('/items/:id/analyze', FashionController.analyze);
  fastify.post('/items/:id/research', FashionController.research);
  fastify.post('/items/:id/save', FashionController.toggleSave);
  fastify.delete('/items/batch', FashionController.batchDelete);
  fastify.delete('/items/history', FashionController.clearHistory);
  fastify.delete('/items/:id', FashionController.delete);

  // Image uploads for FashionItem (reusing robust image storage controller)
  fastify.post('/items/:id/images/direct', ItemImagesController.uploadDirect);
  fastify.post('/items/:id/images/upload-url', ItemImagesController.requestUploadUrl);
  fastify.post('/items/:id/images/confirm', ItemImagesController.confirmUpload);
  fastify.get('/items/:id/images', ItemImagesController.listImages);
  fastify.delete('/items/:id/images/:imageId', ItemImagesController.delete);
}
