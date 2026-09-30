import { prisma } from '../../app/server';
import { encrypt, decrypt } from '../../shared/security/encryption';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getEnvOrThrow = (key: string) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

export class EbayService {
  private get baseUrl() {
    return process.env.EBAY_ENVIRONMENT === 'production'
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';
  }

  private get authBaseUrl() {
    return process.env.EBAY_ENVIRONMENT === 'production'
      ? 'https://auth.ebay.com/oauth2/authorize'
      : 'https://auth.sandbox.ebay.com/oauth2/authorize';
  }

  generateOAuthUrl(userId: string, returnUrl?: string): string {
    const clientId = getEnvOrThrow('EBAY_CLIENT_ID');
    const ruName = getEnvOrThrow('EBAY_RU_NAME');
    const scopes = getEnvOrThrow('EBAY_OAUTH_SCOPES');
    
    // IMPORTANT NOTE FOR SANDBOX TESTING:
    // When logging into the eBay Sandbox OAuth popup, you cannot use a real eBay account.
    // You MUST use a pre-created Sandbox Test Account (seller) generated from the eBay Developer Portal
    // (https://developer.ebay.com/my/trading/default.html). Regular eBay credentials will show "incorrect password".
    // Creating new sandbox accounts directly within the OAuth popup flow is also known to fail.

    // Generate stateless OAuth state using JWT signed by our app secret
    // It will expire in 10 minutes to prevent replay over a long time
    const jwtSecret = getEnvOrThrow('JWT_SECRET');
    const state = jwt.sign({ 
      userId, 
      nonce: crypto.randomBytes(16).toString('hex'),
      returnUrl 
    }, jwtSecret, { expiresIn: '10m' });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: ruName,
      scope: scopes,
      state: state,
      prompt: 'login'
    });

    const finalUrl = `${this.authBaseUrl}?${params.toString().replace(/\+/g, '%20')}`;

    console.log(`
EBAY OAUTH START
environment: ${process.env.EBAY_ENVIRONMENT?.toUpperCase()}
authorization endpoint: ${this.authBaseUrl}
clientId present: ${!!clientId}
RuName present: ${!!ruName}
RuName value: ${ruName.substring(0, 4)}...${ruName.substring(ruName.length - 4)}
scope count: ${scopes.split(' ').length}
state present: ${!!state}
    `.trim());

    return finalUrl;
  }

  async handleOAuthCallback(code: string, state: string, logger?: any) {
    const jwtSecret = getEnvOrThrow('JWT_SECRET');
    
    let decodedState: { userId: string, returnUrl?: string };
    try {
      decodedState = jwt.verify(state, jwtSecret) as { userId: string, returnUrl?: string };
      logger?.info({ userId: decodedState.userId }, 'State validation successful');
    } catch (err) {
      logger?.error('State validation failed');
      throw new Error('Invalid or expired state parameter');
    }

    const { userId, returnUrl } = decodedState;

    // Exchange code for tokens
    logger?.info('Exchanging authorization code for tokens...');
    const tokens = await this.exchangeAuthCode(code);
    logger?.info('Token exchange successful');
    
    // Identify seller (optional but good, though Sandbox doesn't always have a great endpoint for just "who am I" without a token, we might skip it or use the token to fetch something)
    // Actually, OAuth doesn't directly return userId, but we can store it.
    
    // Update or create EbayAccount
    const environment = getEnvOrThrow('EBAY_ENVIRONMENT');
    const marketplaceId = 'EBAY_US'; // Defaulting for now

    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + tokens.refresh_token_expires_in * 1000);

    const account = await prisma.ebayAccount.upsert({
      where: {
        userId_environment_marketplaceId: {
          userId,
          environment,
          marketplaceId,
        }
      },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        connectionStatus: 'CONFIGURING',
      },
      create: {
        userId,
        environment,
        marketplaceId,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        connectionStatus: 'CONFIGURING',
      }
    });

    // Run background setup tasks asynchronously
    this.setupSellerConfiguration(account.id).catch(err => {
      console.error('Background setup configuration failed:', err);
    });

    return { account, returnUrl };
  }

  private async exchangeAuthCode(code: string) {
    const clientId = getEnvOrThrow('EBAY_CLIENT_ID');
    const clientSecret = getEnvOrThrow('EBAY_CLIENT_SECRET');
    const ruName = getEnvOrThrow('EBAY_RU_NAME');

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: ruName,
    });

    const response = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('eBay Token Exchange Error:', errBody);
      throw new Error(`Failed to exchange authorization code: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<{
      access_token: string;
      expires_in: number;
      refresh_token: string;
      refresh_token_expires_in: number;
      token_type: string;
    }>;
  }

  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await prisma.ebayAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    const validStatuses = [
      'CONNECTED',
      'CONFIGURING',
      'LOCATION_SETUP_REQUIRED',
      'POLICIES_SETUP_REQUIRED',
      'REAUTHORIZATION_REQUIRED'
    ];

    if (!validStatuses.includes(account.connectionStatus)) {
      throw new Error('eBay account is not in a valid state for API access');
    }

    // Check if access token is still valid (with a 5-minute buffer)
    const now = new Date();
    const bufferTime = new Date(now.getTime() + 5 * 60000);

    if (account.accessTokenExpiresAt > bufferTime) {
      return decrypt(account.accessToken);
    }

    // Check if refresh token is valid
    if (account.refreshTokenExpiresAt <= now) {
      // Mark as requiring re-auth
      await prisma.ebayAccount.update({
        where: { id: accountId },
        data: { connectionStatus: 'REAUTHORIZATION_REQUIRED' }
      });
      throw new Error('Refresh token expired, reauthorization required');
    }

    // Refresh token
    const refreshToken = decrypt(account.refreshToken);
    const newTokens = await this.refreshTokens(refreshToken);

    const accessTokenExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    
    await prisma.ebayAccount.update({
      where: { id: accountId },
      data: {
        accessToken: encrypt(newTokens.access_token),
        accessTokenExpiresAt,
      }
    });

    return newTokens.access_token;
  }

  private async refreshTokens(refreshToken: string) {
    const clientId = getEnvOrThrow('EBAY_CLIENT_ID');
    const clientSecret = getEnvOrThrow('EBAY_CLIENT_SECRET');
    const scopes = getEnvOrThrow('EBAY_OAUTH_SCOPES');

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: scopes,
    });

    const response = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh eBay token');
    }

    return response.json() as Promise<{
      access_token: string;
      expires_in: number;
    }>;
  }

  private async setupSellerConfiguration(accountId: string) {
    const token = await this.getValidAccessToken(accountId);
    const account = await prisma.ebayAccount.findUnique({ where: { id: accountId }});
    if (!account) return;

    try {
      const marketplaceId = account.marketplaceId;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      let status = 'READY';

      // Opt-in check
      const optInRes = await fetch(`${this.baseUrl}/sell/account/v1/program/get_opted_in_programs`, { headers });
      let optedIn = false;
      if (optInRes.ok) {
        const data = await optInRes.json() as any;
        if (data.programs && data.programs.some((p: any) => p.programType === 'SELLING_POLICY_MANAGEMENT')) {
          optedIn = true;
        }
      }

      if (!optedIn) {
        const optInPost = await fetch(`${this.baseUrl}/sell/account/v1/program/SELLING_POLICY_MANAGEMENT/opt_in`, { method: 'POST', headers });
        if (!optInPost.ok) {
          if (optInPost.status === 404) {
            console.warn('Opt-in endpoint returned 404 (common in sandbox). Continuing execution without returning early.');
          } else {
            console.error('Failed to opt in to SELLING_POLICY_MANAGEMENT:', await optInPost.text());
            // If we fail here, eBay won't let us create policies
            await prisma.ebayAccount.update({
              where: { id: accountId },
              data: { connectionStatus: 'CONFIGURATION_FAILED' }
            });
            return;
          }
        }
      }

      // 1. Merchant Location
      const merchantLocationKey = account.merchantLocationKey || `lm-${account.id.substring(0, 20)}-main`.toLowerCase();
      const locRes = await fetch(`${this.baseUrl}/sell/inventory/v1/location/${merchantLocationKey}`, { headers });
      const locResText = await locRes.text();
      console.log('[EBAY API] Merchant Location GET Response:', locRes.status, locResText);
      
      let locationCreated = locRes.ok;
      if (locRes.status === 404) {
        // We do not fabricate location data. We return LOCATION_SETUP_REQUIRED so the frontend can capture it
        status = 'LOCATION_SETUP_REQUIRED';
      }

      let fulfillmentPolicyId = account.fulfillmentPolicyId;
      let paymentPolicyId = account.paymentPolicyId;
      let returnPolicyId = account.returnPolicyId;

      const isSandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';

      if (isSandbox) {
        console.log('[EBAY API] Sandbox environment detected. Bypassing Business Policy creation.');
        fulfillmentPolicyId = fulfillmentPolicyId || 'SANDBOX_BYPASS';
        paymentPolicyId = paymentPolicyId || 'SANDBOX_BYPASS';
        returnPolicyId = returnPolicyId || 'SANDBOX_BYPASS';
      } else {
        // 2. Fulfillment Policy
        if (!fulfillmentPolicyId) {
          const fulfillRes = await fetch(`${this.baseUrl}/sell/account/v1/fulfillment_policy?marketplace_id=${marketplaceId}`, { headers });
          const fulfillResText = await fulfillRes.text();
          console.log('[EBAY API] Fulfillment Policy GET Response:', fulfillRes.status, fulfillResText);
          
          if (fulfillRes.ok) {
            try {
              const data = JSON.parse(fulfillResText);
              if (data.fulfillmentPolicies && data.fulfillmentPolicies.length > 0) {
                fulfillmentPolicyId = data.fulfillmentPolicies[0].fulfillmentPolicyId;
              }
            } catch (e) {
              console.error('[EBAY API] Failed to parse Fulfillment Policy GET response:', e);
            }
          }
          
          if (!fulfillmentPolicyId) {
            // Attempt creation of a basic fulfillment policy
            const createFulfillPayload = {
              name: 'ListingMate Standard Shipping',
              description: 'Standard flat rate shipping',
              marketplaceId,
              categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES' }],
              handlingTime: { unit: 'DAY', value: 3 },
              shippingOptions: [{
                optionType: 'DOMESTIC',
                costType: 'FLAT_RATE',
                shippingServices: [{
                  shippingServiceCode: 'USPSPriority', // Sandbox often allows this
                  shippingCost: { value: '5.00', currency: 'USD' },
                }]
              }]
            };
            const createFulfillRes = await fetch(`${this.baseUrl}/sell/account/v1/fulfillment_policy`, {
              method: 'POST',
              headers,
              body: JSON.stringify(createFulfillPayload)
            });
            const createFulfillResText = await createFulfillRes.text();
            console.log('[EBAY API] Fulfillment Policy POST Response:', createFulfillRes.status, createFulfillResText);
            
            if (createFulfillRes.ok) {
              try {
                const data = JSON.parse(createFulfillResText);
                fulfillmentPolicyId = data.fulfillmentPolicyId;
              } catch (e) {
                console.error('[EBAY API] Failed to parse Fulfillment Policy POST response:', e);
              }
            }
          }
        }

        // 3. Payment Policy
        if (!paymentPolicyId) {
          const payRes = await fetch(`${this.baseUrl}/sell/account/v1/payment_policy?marketplace_id=${marketplaceId}`, { headers });
          const payResText = await payRes.text();
          console.log('[EBAY API] Payment Policy GET Response:', payRes.status, payResText);
          
          if (payRes.ok) {
            try {
              const data = JSON.parse(payResText);
              if (data.paymentPolicies && data.paymentPolicies.length > 0) {
                paymentPolicyId = data.paymentPolicies[0].paymentPolicyId;
              }
            } catch (e) {
               console.error('[EBAY API] Failed to parse Payment Policy GET response:', e);
            }
          }

          if (!paymentPolicyId) {
            // Attempt creation of a basic payment policy
            const createPayPayload = {
              name: 'ListingMate Payment Policy',
              marketplaceId,
              categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES' }],
              paymentMethods: [{
                paymentMethodType: 'CREDIT_CARD',
                brands: ['VISA', 'MASTERCARD']
              }]
            };
            const createPayRes = await fetch(`${this.baseUrl}/sell/account/v1/payment_policy`, {
              method: 'POST',
              headers,
              body: JSON.stringify(createPayPayload)
            });
            const createPayResText = await createPayRes.text();
            console.log('[EBAY API] Payment Policy POST Response:', createPayRes.status, createPayResText);
            
            if (createPayRes.ok) {
              try {
                const data = JSON.parse(createPayResText);
                paymentPolicyId = data.paymentPolicyId;
              } catch (e) {
                console.error('[EBAY API] Failed to parse Payment Policy POST response:', e);
              }
            }
          }
        }

        // 4. Return Policy
        if (!returnPolicyId) {
          const returnRes = await fetch(`${this.baseUrl}/sell/account/v1/return_policy?marketplace_id=${marketplaceId}`, { headers });
          const returnResText = await returnRes.text();
          console.log('[EBAY API] Return Policy GET Response:', returnRes.status, returnResText);
          
          if (returnRes.ok) {
            try {
               const data = JSON.parse(returnResText);
               if (data.returnPolicies && data.returnPolicies.length > 0) {
                 returnPolicyId = data.returnPolicies[0].returnPolicyId;
               }
            } catch (e) {
               console.error('[EBAY API] Failed to parse Return Policy GET response:', e);
            }
          }

          if (!returnPolicyId) {
            // Attempt creation of a basic return policy
            const createReturnPayload = {
              name: 'ListingMate Return Policy',
              marketplaceId,
              returnsAccepted: true,
              returnPeriod: { value: 30, unit: 'DAY' },
              returnShippingCostPayer: 'BUYER'
            };
            const createReturnRes = await fetch(`${this.baseUrl}/sell/account/v1/return_policy`, {
              method: 'POST',
              headers,
              body: JSON.stringify(createReturnPayload)
            });
            const createReturnResText = await createReturnRes.text();
            console.log('[EBAY API] Return Policy POST Response:', createReturnRes.status, createReturnResText);
            
            if (createReturnRes.ok) {
              try {
                 const data = JSON.parse(createReturnResText);
                 returnPolicyId = data.returnPolicyId;
              } catch (e) {
                 console.error('[EBAY API] Failed to parse Return Policy POST response:', e);
              }
            }
          }
        }
      }

      if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
        if (status === 'READY') {
          status = 'POLICIES_SETUP_REQUIRED';
        }
      }

      const updateData: any = {
        fulfillmentPolicyId,
        paymentPolicyId,
        returnPolicyId,
        connectionStatus: status,
      };
      
      if (locationCreated) {
        updateData.merchantLocationKey = merchantLocationKey;
      }

      await prisma.ebayAccount.update({
        where: { id: accountId },
        data: updateData
      });
      
    } catch (err) {
      console.error('Error in setupSellerConfiguration:', err);
      await prisma.ebayAccount.update({
        where: { id: accountId },
        data: { connectionStatus: 'ERROR' }
      });
    }
  }

  async setupLocation(userId: string, locationData: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  }) {
    const environment = getEnvOrThrow('EBAY_ENVIRONMENT');
    const account = await prisma.ebayAccount.findFirst({
      where: { userId, environment }
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    const token = await this.getValidAccessToken(account.id);
    const merchantLocationKey = account.merchantLocationKey || `lm-${account.id.substring(0, 20)}-main`.toLowerCase();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const createLocBody = {
      location: {
        address: {
          addressLine1: locationData.addressLine1,
          addressLine2: locationData.addressLine2,
          city: locationData.city,
          stateOrProvince: locationData.stateOrProvince,
          postalCode: locationData.postalCode,
          country: locationData.country
        }
      },
      name: "ListingMate Main Location",
      merchantLocationStatus: "ENABLED",
      locationTypes: ["STORE"]
    };

    const locRes = await fetch(`${this.baseUrl}/sell/inventory/v1/location/${merchantLocationKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createLocBody)
    });

    if (!locRes.ok && locRes.status !== 204) {
      const errorText = await locRes.text();
      console.error('Failed to create inventory location:', errorText);
      throw new Error('Failed to create eBay inventory location');
    }

    // Save location details in DB and set location key
    await prisma.ebayAccount.update({
      where: { id: account.id },
      data: {
        merchantLocationKey,
        addressLine1: locationData.addressLine1,
        addressLine2: locationData.addressLine2 || null,
        city: locationData.city,
        stateOrProvince: locationData.stateOrProvince,
        postalCode: locationData.postalCode,
        country: locationData.country
      }
    });

    // Re-run setup configuration to check if everything is READY
    await this.setupSellerConfiguration(account.id);
  }

  async disconnect(userId: string) {
    console.log(`[EBAY SERVICE] Disconnecting eBay account for user: ${userId}`);
    try {
      // Delete the connection from the DB securely
      const result = await prisma.ebayAccount.deleteMany({
        where: { userId }
      });
      console.log(`[EBAY SERVICE] Successfully deleted ${result.count} eBay accounts for user ${userId}`);
    } catch (err: any) {
      console.error(`[EBAY SERVICE] Failed to execute prisma.ebayAccount.deleteMany for user ${userId}`, {
        message: err.message,
        code: err.code,
        meta: err.meta,
        stack: err.stack
      });
      throw err;
    }
  }

  async getConnectionStatus(userId: string) {
    const environment = getEnvOrThrow('EBAY_ENVIRONMENT');
    const account = await prisma.ebayAccount.findFirst({
      where: { userId, environment }
    });

    if (!account) return { connected: false };

    return {
      connected: account.connectionStatus === 'READY' || account.connectionStatus === 'CONNECTED' || account.connectionStatus === 'CONFIGURING' || account.connectionStatus === 'LOCATION_SETUP_REQUIRED' || account.connectionStatus === 'POLICIES_SETUP_REQUIRED',
      environment: account.environment,
      marketplaceId: account.marketplaceId,
      merchantLocationKey: account.merchantLocationKey,
      fulfillmentPolicyId: account.fulfillmentPolicyId,
      paymentPolicyId: account.paymentPolicyId,
      returnPolicyId: account.returnPolicyId,
      status: account.connectionStatus,
    };
  }

  async verifyConfiguration(userId: string) {
    const environment = getEnvOrThrow('EBAY_ENVIRONMENT');
    const account = await prisma.ebayAccount.findFirst({
      where: { userId, environment }
    });

    if (!account) {
      return { status: 'OAUTH_REQUIRED', locationConfigured: false, policiesConfigured: false };
    }

    try {
      // Just check if we can get a valid token
      await this.getValidAccessToken(account.id);

      const locationConfigured = !!account.merchantLocationKey;
      const policiesConfigured = !!(account.fulfillmentPolicyId && account.paymentPolicyId && account.returnPolicyId);

      return {
        status: account.connectionStatus,
        merchantLocationKey: account.merchantLocationKey,
        fulfillmentPolicyId: account.fulfillmentPolicyId,
        paymentPolicyId: account.paymentPolicyId,
        returnPolicyId: account.returnPolicyId,
        locationConfigured,
        policiesConfigured
      };
    } catch (err: any) {
      return { status: 'CONFIGURATION_FAILED', error: err.message, locationConfigured: false, policiesConfigured: false };
    }
  }
}

export const ebayService = new EbayService();
