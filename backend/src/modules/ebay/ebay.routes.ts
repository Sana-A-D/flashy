import { FastifyInstance } from 'fastify';
import { ebayController } from './ebay.controller';

export async function ebayRoutes(server: FastifyInstance) {
  // Public route for OAuth callback (handled by eBay browser redirect)
  server.get('/oauth/callback', ebayController.oauthCallback);

  server.get('/oauth/start', { preValidation: [server.authenticate] }, ebayController.startOAuth);
  server.get('/connection', { preValidation: [server.authenticate] }, ebayController.getConnection);
  server.get('/verification', { preValidation: [server.authenticate] }, ebayController.verifyConnection);
  server.delete('/connection', { preValidation: [server.authenticate] }, ebayController.disconnect);
  server.post('/disconnect', { preValidation: [server.authenticate] }, ebayController.disconnect);
  server.post('/location', { preValidation: [server.authenticate] }, ebayController.setupLocation);
}
