import { FastifyInstance } from 'fastify';
import { MarketplacesController } from './marketplaces.controller';

export async function marketplacesRoutes(fastify: FastifyInstance) {
  // Public route for OAuth callback
  fastify.get('/callback', MarketplacesController.oauthCallback);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('onRequest', fastify.authenticate);
    
    protectedRoutes.get('/:marketplace/auth-url', MarketplacesController.getAuthUrl);
    protectedRoutes.get('/connections', MarketplacesController.getConnections);
    protectedRoutes.delete('/:marketplace/disconnect', MarketplacesController.disconnect);
    protectedRoutes.post('/:marketplace/items/:itemId/publish', MarketplacesController.publishItem);
    protectedRoutes.post('/:marketplace/items/:itemId/delist', MarketplacesController.delistItem);
    protectedRoutes.post('/items/:itemId/delist-everywhere', MarketplacesController.delistEverywhere);
    protectedRoutes.get('/items/:itemId/marketplaces', MarketplacesController.getItemMarketplaces);
  });
}
