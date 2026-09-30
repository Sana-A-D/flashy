import { FastifyInstance } from 'fastify';
import { ItemsController } from './items.controller';
import { ItemImagesController } from './item-images.controller';
import { ItemRecognitionController } from './item-recognition.controller';
import { ListingGenerationController } from './listing-generation.controller';
import { PricingController } from './pricing.controller';
import { SaleController } from '../sales/sale.controller';
import { DelistingController } from '../marketplaces/delisting.controller';
import { ItemHistoryController } from './item-history.controller';

export async function itemsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', ItemsController.create);
  fastify.get('/', ItemsController.list);
  fastify.get('/:id', ItemsController.getById);
  fastify.patch('/:id', ItemsController.update);
  fastify.post('/:id/archive', ItemsController.archive);
  fastify.patch('/:id/status', ItemsController.changeStatus);
  fastify.patch('/:id/preparation', ItemsController.updatePreparation);
  fastify.post('/:id/images/direct', ItemImagesController.uploadDirect);
  fastify.post('/:id/images/upload-url', ItemImagesController.requestUploadUrl);
  fastify.post('/:id/images/confirm', ItemImagesController.confirmUpload);
  fastify.get('/:id/images', ItemImagesController.listImages);
  fastify.patch('/:id/images/:imageId/primary', ItemImagesController.setPrimary);
  fastify.patch('/:id/images/reorder', ItemImagesController.reorder);
  fastify.delete('/:id/images/:imageId', ItemImagesController.delete);
  fastify.post('/:id/images/:imageId/process', ItemImagesController.processImage);

  // Recognition Routes
  fastify.post('/:itemId/recognition', ItemRecognitionController.startRecognition);
  fastify.get('/:itemId/recognition', ItemRecognitionController.getRecognition);
  fastify.patch('/:itemId/recognition', ItemRecognitionController.updateRecognition);

  // Listing Generation Routes
  fastify.post('/:itemId/listing-generation', ListingGenerationController.startGeneration);
  fastify.get('/:itemId/listing-generation', ListingGenerationController.getGeneration);
  fastify.patch('/:itemId/listing-generation', ListingGenerationController.updateGeneration);

  // Pricing Routes
  fastify.get('/:itemId/pricing', PricingController.getPricing);
  fastify.post('/:itemId/pricing/research', PricingController.performResearch);

  // Sales Routes
  fastify.get('/:itemId/sale', SaleController.getSale);
  fastify.post('/:itemId/sale', SaleController.recordSale);

  // Delisting Routes
  fastify.get('/:itemId/delisting', DelistingController.getDelistingStatus);
  fastify.post('/:itemId/delisting', DelistingController.performDelisting);

  // History Routes
  fastify.get('/:itemId/history', ItemHistoryController.getHistory);
}
