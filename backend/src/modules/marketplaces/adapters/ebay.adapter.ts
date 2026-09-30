import {
  MarketplaceAdapter,
  MarketplaceCapabilities,
  MarketplaceListingInput,
  MarketplaceOperationResult,
  MarketplaceOperationStatus,
  MarketplaceErrorCategory,
  MarketplaceId,
} from '../marketplace.types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EbayAdapter implements MarketplaceAdapter {
  private environment: string;
  private apiUrl: string;

  constructor() {
    this.environment = process.env.EBAY_ENVIRONMENT || 'SANDBOX';
    this.apiUrl =
      this.environment === 'PRODUCTION'
        ? 'https://api.ebay.com'
        : 'https://api.sandbox.ebay.com';
  }

  getMarketplaceId(): string {
    return MarketplaceId.EBAY;
  }

  getCapabilities(): MarketplaceCapabilities {
    return {
      connect: true,
      disconnect: true,
      createListing: true,
      updateListing: false,
      endListing: true,
      getListing: false,
      getOrders: false,
      manualOnly: false,
    };
  }

  supportsCreateListing(): boolean {
    return true;
  }

  supportsUpdateListing(): boolean {
    return false; // Not implemented yet
  }

  supportsEndListing(): boolean {
    return true;
  }

  private async refreshAccessToken(
    account: any
  ): Promise<string> {
    if (account.expiresAt && account.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      const tokens = JSON.parse(account.encryptedTokens);
      if (tokens.accessToken) {
        return tokens.accessToken;
      }
    }

    const tokens = JSON.parse(account.encryptedTokens);
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const authHeader = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch(`${this.apiUrl}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw {
        category: MarketplaceErrorCategory.AUTHENTICATION,
        message: 'Failed to refresh eBay token',
        details: err,
      };
    }

    const data = await response.json();
    
    // Save new tokens
    const newTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
    };
    
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    
    await prisma.marketplaceAccount.update({
      where: { id: account.id },
      data: {
        encryptedTokens: JSON.stringify(newTokens),
        expiresAt,
      },
    });

    return data.access_token;
  }

  private getConditionMap(condition?: string): string {
    // Maps ListingMate conditions to eBay Condition IDs
    // https://developer.ebay.com/devzone/rest/api-ref/inventory/enums/ConditionEnum.html
    const mapping: Record<string, string> = {
      NEW: 'NEW',
      NEW_OTHER: 'NEW_OTHER',
      NEW_WITH_DEFECTS: 'NEW_WITH_DEFECTS',
      MANUFACTURER_REFURBISHED: 'MANUFACTURER_REFURBISHED',
      EXCELLENT: 'USED_EXCELLENT',
      VERY_GOOD: 'USED_VERY_GOOD',
      GOOD: 'USED_GOOD',
      ACCEPTABLE: 'USED_ACCEPTABLE',
      FOR_PARTS: 'FOR_PARTS_OR_NOT_WORKING',
    };
    // Default to USED_GOOD if recognized or missing, or return error if strict.
    if (!condition) return 'USED_GOOD';
    return mapping[condition.toUpperCase()] || 'USED_GOOD';
  }

  async createListing(
    userId: string,
    accountId: string,
    input: MarketplaceListingInput
  ): Promise<MarketplaceOperationResult> {
    // In Phase 13, token management handles fetching the DB account, getting tokens.
    // For this adapter we just need the credentials via context or DB.
    // Actually, accountId is passed, we should fetch it from DB in a real app or it should be passed here.
    // We will assume the service passes the raw tokens, or we fetch them here.
    const account = await prisma.marketplaceAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.encryptedTokens) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.AUTHENTICATION,
          message: 'eBay account is not properly connected.',
        },
      };
    }

    const ebayAccount = await prisma.ebayAccount.findFirst({
      where: {
        userId: userId,
        environment: this.environment.toLowerCase(),
      }
    });

    if (!ebayAccount || ebayAccount.connectionStatus !== 'READY') {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.VALIDATION,
          message: 'eBay account setup is not complete. Please finish configuration.',
        },
      };
    }

    let accessToken: string;
    try {
      // Refresh token if expired or close to expiry
      accessToken = await this.refreshAccessToken(account);
    } catch (e: any) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: e.category ? e : {
          category: MarketplaceErrorCategory.AUTHENTICATION,
          message: 'eBay authentication failed.',
          details: e.message,
        },
      };
    }

    try {
      // 1. Create Inventory Item
      const sku = `LM-${Date.now()}`;
      const inventoryPayload = {
        product: {
          title: input.title,
          description: input.description,
          aspects: {
            Brand: [input.brand || 'Unbranded'],
            ...(input.color ? { Color: [input.color] } : {}),
            ...(input.size ? { Size: [input.size] } : {}),
          },
          imageUrls: input.imageUrls.length ? input.imageUrls : undefined,
        },
        condition: this.getConditionMap(input.condition),
        availability: {
          shipToLocationAvailability: {
            quantity: 1,
          },
        },
      };

      const invResponse = await fetch(`${this.apiUrl}/sell/inventory/v1/inventory_item/${sku}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Language': 'en-US',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryPayload),
      });

      if (!invResponse.ok) {
        const errorData = await invResponse.json();
        return {
          status: MarketplaceOperationStatus.FAILED,
          error: {
            category: MarketplaceErrorCategory.VALIDATION,
            message: 'Failed to create inventory item on eBay.',
            details: errorData,
          },
        };
      }

      // 2. Create Offer
      const offerPayload = {
        sku: sku,
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE',
        availableQuantity: 1,
        categoryId: input.category || 'OTHER', // This typically needs real category mapping -> MANUAL_REQUIRED if missing
        pricingSummary: {
          price: {
            value: (input.price / 100).toFixed(2), // Convert cents to dollars
            currency: 'USD',
          },
        },
        listingPolicies: {
          // Use policies from the authenticated seller's DB record
          fulfillmentPolicyId: ebayAccount.fulfillmentPolicyId,
          paymentPolicyId: ebayAccount.paymentPolicyId,
          returnPolicyId: ebayAccount.returnPolicyId,
        },
        merchantLocationKey: ebayAccount.merchantLocationKey,
      };

      if (!input.category) {
        return {
          status: MarketplaceOperationStatus.MANUAL_REQUIRED,
          error: {
            category: MarketplaceErrorCategory.VALIDATION,
            message: 'An eBay category must be selected before publishing.',
          },
        };
      }

      const offerResponse = await fetch(`${this.apiUrl}/sell/inventory/v1/offer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Language': 'en-US',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerPayload),
      });

      if (!offerResponse.ok) {
        const errorData = await offerResponse.json();
        return {
          status: MarketplaceOperationStatus.FAILED,
          error: {
            category: MarketplaceErrorCategory.VALIDATION,
            message: 'Failed to create offer on eBay. Policies or category may be invalid.',
            details: errorData,
          },
        };
      }

      const offerData = await offerResponse.json();
      const offerId = offerData.offerId;

      // 3. Publish Offer
      const publishResponse = await fetch(`${this.apiUrl}/sell/inventory/v1/offer/${offerId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Language': 'en-US',
          'Content-Type': 'application/json',
        },
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        return {
          status: MarketplaceOperationStatus.FAILED,
          error: {
            category: MarketplaceErrorCategory.VALIDATION,
            message: 'Failed to publish offer on eBay.',
            details: errorData,
          },
        };
      }

      const publishData = await publishResponse.json();
      const listingId = publishData.listingId;

      // We serialize listingId, offerId, and sku in a structured composite format:
      // "listingId:offerId:sku" so later operations (such as endListing / withdraw)
      // have the exact required eBay inventory identifiers.
      const compositeExternalId = `${listingId}:${offerId}:${sku}`;

      return {
        status: MarketplaceOperationStatus.SUCCESS,
        externalListingId: compositeExternalId,
        externalListingUrl: `https://www.ebay.com/itm/${listingId}`,
        externalOfferId: offerId,
        sku: sku,
      };

    } catch (e: any) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.NETWORK,
          message: 'Network error communicating with eBay',
          details: e.message,
        },
      };
    }
  }

  async updateListing(
    userId: string,
    accountId: string,
    externalListingId: string,
    input: Partial<MarketplaceListingInput>
  ): Promise<MarketplaceOperationResult> {
    return {
      status: MarketplaceOperationStatus.MANUAL_REQUIRED,
      requiresManualAction: true,
      error: {
        category: MarketplaceErrorCategory.UNSUPPORTED,
        message: 'Direct listing updates via eBay Inventory API are not yet enabled. Please edit the listing directly in eBay Seller Hub.',
      },
    };
  }

  async endListing(
    userId: string,
    accountId: string,
    externalListingId: string
  ): Promise<MarketplaceOperationResult> {
    // Parse composite identifier: format can be "listingId:offerId:sku" or raw listingId/offerId
    let offerId: string | null = null;
    let listingId: string = externalListingId;

    if (externalListingId.includes(':')) {
      const parts = externalListingId.split(':');
      listingId = parts[0];
      offerId = parts[1] || null;
    }

    // If we do not have an offerId stored, withdrawal via the Inventory API is not possible directly
    if (!offerId) {
      return {
        status: MarketplaceOperationStatus.MANUAL_REQUIRED,
        requiresManualAction: true,
        error: {
          category: MarketplaceErrorCategory.UNSUPPORTED,
          message: `eBay delisting requires the offerId which is not present for listing ${listingId}. Please end the listing manually in eBay Seller Hub.`,
        },
      };
    }

    const account = await prisma.marketplaceAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.encryptedTokens) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.AUTHENTICATION,
          message: 'eBay account is not properly connected.',
        },
      };
    }

    let accessToken: string;
    try {
      accessToken = await this.refreshAccessToken(account);
    } catch (e: any) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: e.category ? e : {
          category: MarketplaceErrorCategory.AUTHENTICATION,
          message: 'eBay authentication failed during delist.',
          details: e.message,
        },
      };
    }

    try {
      // Call eBay Inventory API withdraw offer endpoint:
      // POST /sell/inventory/v1/offer/{offerId}/withdraw
      const response = await fetch(`${this.apiUrl}/sell/inventory/v1/offer/${offerId}/withdraw`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Language': 'en-US',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          status: MarketplaceOperationStatus.FAILED,
          error: {
            category: MarketplaceErrorCategory.PROVIDER,
            message: `eBay rejected the withdrawal request for offer ${offerId}.`,
            details: errorData,
          },
        };
      }

      const withdrawData = await response.json().catch(() => ({}));
      return {
        status: MarketplaceOperationStatus.SUCCESS,
        externalListingId: externalListingId,
      };
    } catch (err: any) {
      return {
        status: MarketplaceOperationStatus.FAILED,
        error: {
          category: MarketplaceErrorCategory.NETWORK,
          message: 'Network error withdrawing offer from eBay.',
          details: err.message,
        },
      };
    }
  }
}

