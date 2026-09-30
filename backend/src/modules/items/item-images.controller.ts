import { FastifyReply, FastifyRequest } from 'fastify';
import { ItemImagesService } from './item-images.service';
import { RequestUploadDto, ConfirmUploadDto, ReorderImagesDto, DirectUploadDto } from './item-images.schema';


export class ItemImagesController {
  static async uploadDirect(
    req: FastifyRequest<{ Params: { id: string }; Body: DirectUploadDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const result = await ItemImagesService.uploadDirect(userId, req.params.id, req.body);
      return reply.send(result);
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: (error as any).message || 'Internal Server Error' });
    }
  }

  static async requestUploadUrl(
    req: FastifyRequest<{ Params: { id: string }; Body: RequestUploadDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const result = await ItemImagesService.requestUploadUrl(userId, req.params.id, req.body);
      return reply.send(result);
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async confirmUpload(
    req: FastifyRequest<{ Params: { id: string }; Body: ConfirmUploadDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const image = await ItemImagesService.confirmUpload(userId, req.params.id, req.body);
      return reply.send(image);
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async listImages(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const images = await ItemImagesService.listImages(userId, req.params.id);
      return reply.send(images);
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async setPrimary(
    req: FastifyRequest<{ Params: { id: string; imageId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const images = await ItemImagesService.setPrimaryImage(userId, req.params.id, req.params.imageId);
      return reply.send(images);
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async reorder(
    req: FastifyRequest<{ Params: { id: string }; Body: ReorderImagesDto }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (req as any).user.id;
      const images = await ItemImagesService.reorderImages(userId, req.params.id, req.body);
      return reply.send(images);
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async delete(request: FastifyRequest<{ Params: { id: string; imageId: string } }>, reply: FastifyReply) {
    try {
      const { id: itemId, imageId } = request.params;
      const images = await ItemImagesService.deleteImage((request as any).user.id, itemId, imageId);
      return reply.send({ images });
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async processImage(request: FastifyRequest<{ Params: { id: string; imageId: string } }>, reply: FastifyReply) {
    try {
      const { id: itemId, imageId } = request.params;
      const { ImageProcessingService } = require('./image-processing.service');
      const image = await ImageProcessingService.requestBackgroundRemoval((request as any).user.id, itemId, imageId);
      return reply.send({ image });
    } catch (error) {
      if ((error as any).statusCode) return reply.status((error as any).statusCode).send({ error: (error as any).message }); return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
