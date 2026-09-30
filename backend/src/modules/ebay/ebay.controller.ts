import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ebayService } from './ebay.service';

export class EbayController {
  async startOAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: userId } = request.user as { id: string };
      const { returnUrl } = request.query as any;
      const url = ebayService.generateOAuthUrl(userId, returnUrl);
      
      const parsedUrl = new URL(url);
      request.log.info({ 
        userId, 
        returnUrl,
        oauthEndpoint: parsedUrl.origin + parsedUrl.pathname,
        clientId: parsedUrl.searchParams.get('client_id'),
        redirectUri: parsedUrl.searchParams.get('redirect_uri'),
        scope: parsedUrl.searchParams.get('scope'),
        state: parsedUrl.searchParams.get('state') ? 'present' : 'missing',
        fullUrlRedacted: url.replace(/client_id=[^&]+/, 'client_id=REDACTED')
      }, 'EBAY OAUTH START DIAGNOSTICS');

      request.log.info({ userId, returnUrl, url }, 'OAuth start');
      return reply.send({ success: true, url });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: { message: 'Failed to start eBay OAuth' } });
    }
  }

  async oauthCallback(request: FastifyRequest, reply: FastifyReply) {
    const { code, state, error } = request.query as any;

    request.log.info({
      protocol: request.protocol,
      host: request.hostname,
      path: request.url,
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error
    }, 'EBAY CALLBACK RECEIVED');

    if (error) {
      return reply.redirect('listingmate://ebay-oauth-result?status=error&message=' + encodeURIComponent(error));
    }

    if (!code || !state) {
      return reply.redirect('listingmate://ebay-oauth-result?status=error&message=missing_params');
    }

    try {
      const { returnUrl } = await ebayService.handleOAuthCallback(code, state, request.log);
      request.log.info({ returnUrl }, 'OAuth callback completed successfully, redirecting to app');

      const finalRedirect = returnUrl || 'listingmate://ebay-oauth-result?status=success';
      return reply.redirect(finalRedirect);
    } catch (err: any) {
      request.log.error({ errMessage: err.message }, 'OAuth callback token exchange or persistence failed');
      return reply.redirect('listingmate://ebay-oauth-result?status=error&message=internal_error');
    }
  }

  async getConnection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: userId } = request.user as { id: string };
      const status = await ebayService.getConnectionStatus(userId);
      return reply.send({ success: true, data: status });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: { message: 'Failed to fetch connection status' } });
    }
  }

  async disconnect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: userId } = request.user as { id: string };
      request.log.info({ userId }, 'Initiating disconnect request for user');
      await ebayService.disconnect(userId);
      request.log.info({ userId }, 'Successfully disconnected eBay account');
      return reply.send({ success: true });
    } catch (err: any) {
      request.log.error({
        errMessage: err.message,
        errStack: err.stack,
        statusCode: err.statusCode || err.code || 500,
        originalError: err
      }, 'Error in ebayController.disconnect');
      return reply.code(500).send({ success: false, error: { message: 'Failed to disconnect eBay', details: err.message } });
    }
  }

  async verifyConnection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: userId } = request.user as { id: string };
      const status = await ebayService.verifyConfiguration(userId);
      return reply.send({ success: true, data: status });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: { message: err.message || 'Failed to verify eBay connection' } });
    }
  }

  async setupLocation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: userId } = request.user as { id: string };

      const locationSchema = z.object({
        addressLine1: z.string().min(1),
        addressLine2: z.string().optional(),
        city: z.string().min(1),
        stateOrProvince: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().length(2)
      });

      const locationData = locationSchema.parse(request.body);
      await ebayService.setupLocation(userId, locationData as any);

      const status = await ebayService.getConnectionStatus(userId);
      return reply.send({ success: true, data: status });

    } catch (err: any) {
      request.log.error(err);
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { message: 'Invalid location data', details: err.issues } });
      }
      return reply.code(500).send({ success: false, error: { message: err.message || 'Failed to setup location' } });
    }
  }
}

export const ebayController = new EbayController();
