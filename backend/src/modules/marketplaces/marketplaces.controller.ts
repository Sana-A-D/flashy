import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { defaultMarketplaceRegistry } from './marketplace.service';
import { EbayAdapter } from './adapters/ebay.adapter';
import { ManualMarketplaceAdapter } from './adapters/manual.adapter';
import { MarketplaceId } from './marketplace.types';

const prisma = new PrismaClient();

// Register the eBay adapter
defaultMarketplaceRegistry.register(new EbayAdapter());

// Register standardized manual adapters for non-API platforms
defaultMarketplaceRegistry.register(new ManualMarketplaceAdapter(MarketplaceId.POSHMARK, 'Poshmark'));
defaultMarketplaceRegistry.register(new ManualMarketplaceAdapter(MarketplaceId.MERCARI, 'Mercari'));
defaultMarketplaceRegistry.register(new ManualMarketplaceAdapter(MarketplaceId.DEPOP, 'Depop'));
defaultMarketplaceRegistry.register(new ManualMarketplaceAdapter(MarketplaceId.FACEBOOK, 'Facebook Marketplace'));
defaultMarketplaceRegistry.register(new ManualMarketplaceAdapter(MarketplaceId.OFFERUP, 'OfferUp'));


export class MarketplacesController {
  static async getAuthUrl(request: FastifyRequest<{ Params: { marketplace: string } }>, reply: FastifyReply) {
    const { marketplace } = request.params;

    if (marketplace !== 'ebay') {
      return reply.status(400).send({ error: 'Unsupported marketplace' });
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const ruName = process.env.EBAY_RU_NAME;
    const isProd = process.env.EBAY_ENVIRONMENT === 'PRODUCTION';

    if (!clientId || !ruName) {
      return reply.status(500).send({ error: 'eBay integration is not configured correctly' });
    }

    const baseUrl = isProd
      ? 'https://auth.ebay.com/oauth2/authorize'
      : 'https://auth.sandbox.ebay.com/oauth2/authorize';

    const userId = (request as any).user.id;
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(userId)
      .digest('hex');
    
    const state = `uid=${userId}&sig=${signature}`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: ruName,
      response_type: 'code',
      state: state,
      scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory'
    });

    const url = `${baseUrl}?${params.toString().replace(/\\+/g, '%20')}`;

    return { url };
  }

  static async oauthCallback(request: FastifyRequest<{ Querystring: { code: string; state: string } }>, reply: FastifyReply) {
    const { code, state } = request.query;

    if (!code || !state) {
      return reply.status(400).send({ error: 'Missing code or state' });
    }

    // Extract user ID and signature from state
    const userIdMatch = state.match(/uid=([^&]+)/);
    const sigMatch = state.match(/sig=([^&]+)/);
    
    const userId = userIdMatch ? userIdMatch[1] : null;
    const sig = sigMatch ? sigMatch[1] : null;

    if (!userId || !sig) {
      return reply.status(400).send({ error: 'Invalid state parameter format' });
    }

    const crypto = require('crypto');
    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(userId)
      .digest('hex');

    if (sig !== expectedSig) {
      return reply.status(403).send({ error: 'State validation failed, CSRF attempt detected' });
    }

    // Exchange code for token
    const isProd = process.env.EBAY_ENVIRONMENT === 'PRODUCTION';
    const tokenUrl = isProd
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const ruName = process.env.EBAY_RU_NAME;

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: ruName as string,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay Token Exchange Failed:', errorText);
      return reply.status(400).send({ error: 'Failed to exchange authorization code' });
    }

    const data = await response.json();

    // Find or create eBay Marketplace in DB
    let ebayMarketplace = await prisma.marketplace.findFirst({
      where: { type: 'EBAY' },
    });

    if (!ebayMarketplace) {
      ebayMarketplace = await prisma.marketplace.create({
        data: {
          name: 'eBay',
          type: 'EBAY',
        },
      });
    }

    // Store tokens in MarketplaceAccount
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    let account = await prisma.marketplaceAccount.findFirst({
      where: {
        userId,
        marketplaceId: ebayMarketplace.id,
      },
    });

    if (account) {
      await prisma.marketplaceAccount.update({
        where: { id: account.id },
        data: {
          encryptedTokens: JSON.stringify(tokens), // NOTE: Plain JSON for Phase 13, encryption infra pending
          expiresAt,
        },
      });
    } else {
      await prisma.marketplaceAccount.create({
        data: {
          userId,
          marketplaceId: ebayMarketplace.id,
          encryptedTokens: JSON.stringify(tokens),
          expiresAt,
        },
      });
    }

    return reply.redirect(`listingmate://marketplace/callback?status=success&marketplace=ebay`);
  }

  static async getConnections(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    
    const accounts = await prisma.marketplaceAccount.findMany({
      where: { userId },
      include: { marketplace: true },
    });

    const ebayAccount = await prisma.ebayAccount.findFirst({
      where: { userId },
    });

    return accounts.map(acc => {
      const type = acc.marketplace.type.toUpperCase();
      const capabilities = defaultMarketplaceRegistry.getCapabilities(type);
      
      let configurationStatus = 'CONFIGURED';
      if (type === 'EBAY') {
        if (!ebayAccount || !ebayAccount.merchantLocationKey || !ebayAccount.fulfillmentPolicyId) {
          configurationStatus = 'CONFIGURATION_REQUIRED';
        } else if (ebayAccount.connectionStatus !== 'READY') {
          configurationStatus = ebayAccount.connectionStatus;
        }
      }

      return {
        marketplace: acc.marketplace.type,
        connected: true,
        expiresAt: acc.expiresAt,
        configurationStatus,
        capabilities,
      };
    });
  }

  static async disconnect(request: FastifyRequest<{ Params: { marketplace: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { marketplace } = request.params;

    const mp = await prisma.marketplace.findFirst({
      where: { type: marketplace.toUpperCase() }
    });

    if (!mp) {
      return reply.status(404).send({ error: 'Marketplace not found' });
    }

    await prisma.marketplaceAccount.deleteMany({
      where: {
        userId,
        marketplaceId: mp.id,
      }
    });

    return { success: true };
  }

  static async publishItem(request: FastifyRequest<{ Params: { itemId: string, marketplace: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId, marketplace } = request.params;

    // Check if item has draft and get price
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        listingDraft: true,
        images: true
      }
    });

    if (!item) {
      return reply.status(404).send({ error: 'Item not found' });
    }

    if (item.userId !== userId) {
      return reply.status(403).send({ error: 'Forbidden: You do not own this item' });
    }

    if (!item.listingDraft) {
      return reply.status(400).send({ error: 'Item has no listing draft. Please create a draft first.' });
    }

    // Prevent duplicate publishing
    const mp = await prisma.marketplace.findFirst({
      where: { type: marketplace.toUpperCase() }
    });

    if (!mp) {
      return reply.status(404).send({ error: 'Marketplace not found' });
    }

    const existingListing = await prisma.marketplaceListing.findFirst({
      where: {
        itemId,
        marketplaceId: mp.id,
        status: 'ACTIVE'
      }
    });

    if (existingListing) {
      return reply.status(400).send({ error: 'Item is already published to this marketplace.' });
    }

    const { MarketplaceService } = require('./marketplace.service');
    const service = new MarketplaceService();

    const input = {
      title: item.listingDraft.title || item.title,
      description: item.listingDraft.description || item.description || '',
      price: item.listingDraft.price || 0,
      condition: item.listingDraft.condition || item.condition || undefined,
      category: item.listingDraft.category || item.category || undefined,
      brand: item.listingDraft.brand || item.brand || undefined,
      color: item.listingDraft.color || item.color || undefined,
      size: item.listingDraft.size || item.size || undefined,
      imageUrls: item.images.map((img: any) => img.storageKey) // In real app, convert storage keys to public URLs
    };

    const result = await service.publishListing(userId, itemId, mp.id, input);

    if (result.status === 'FAILED') {
      return reply.status(400).send(result);
    }

    return result;
  }

  static async getItemMarketplaces(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId } = request.params;

    // Verify item ownership
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    if (item.userId !== userId) {
      return reply.status(403).send({ error: 'Not authorized to access this item' });
    }

    // Get all marketplaces
    const marketplaces = await prisma.marketplace.findMany();

    // Get user connections
    const connections = await prisma.marketplaceAccount.findMany({
      where: { userId }
    });

    // Get item listings
    const listings = await prisma.marketplaceListing.findMany({
      where: { itemId }
    });

    const result = marketplaces.map(mp => {
      const connection = connections.find(c => c.marketplaceId === mp.id);
      const listing = listings.find(l => l.marketplaceId === mp.id);
      const capabilities = defaultMarketplaceRegistry.getCapabilities(mp.type);

      return {
        id: mp.id,
        name: mp.name,
        type: mp.type,
        capabilities,
        isConnected: !!connection,
        isListed: !!listing,
        listing: listing ? {
          id: listing.id,
          status: listing.status,
          externalListingId: listing.externalListingId,
          listingUrl: listing.listingUrl,
          listedPrice: listing.listedPrice,
          listedAt: listing.listedAt
        } : null
      };
    });

    return result;
  }

  static async delistItem(request: FastifyRequest<{ Params: { itemId: string, marketplace: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId, marketplace } = request.params;

    const mp = await prisma.marketplace.findFirst({
      where: { type: marketplace.toUpperCase() }
    });

    if (!mp) {
      return reply.status(404).send({ error: 'Marketplace not found' });
    }

    const { MarketplaceService } = require('./marketplace.service');
    const service = new MarketplaceService();
    const result = await service.delistListing(userId, itemId, mp.id);
    
    // We don't change HTTP status to 400 for failures in delist Everywhere usually,
    // but for single item delist, if it fails, maybe return 400.
    if (result.status === 'FAILED') {
      return reply.status(400).send(result);
    }
    
    return result;
  }

  static async delistEverywhere(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { itemId } = request.params;

    const { MarketplaceService } = require('./marketplace.service');
    const service = new MarketplaceService();
    const result = await service.delistEverywhere(userId, itemId);
    
    return result;
  }
}
