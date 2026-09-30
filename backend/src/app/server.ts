import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const prisma = new PrismaClient();

import jwtPlugin from '../shared/plugins/jwt';
import { authRoutes } from '../modules/auth/auth.routes';
import { itemsRoutes } from '../modules/items/items.routes';
import { storageLocationsRoutes } from '../modules/storage-locations/storage-locations.routes';
import { marketplacesRoutes } from '../modules/marketplaces/marketplaces.routes';
import { ebayRoutes } from '../modules/ebay/ebay.routes';
import { analyticsRoutes } from '../modules/analytics/analytics.routes';
import { billingRoutes } from '../modules/billing/billing.routes';
import { adminRoutes } from '../modules/admin/admin.routes';
import { usersRoutes } from '../modules/users/users.routes';
import { fashionRoutes } from '../modules/items/fashion.routes';
import { aiRoutes } from '../modules/ai/ai.routes';

export const buildServer = (httpsOptions?: any) => {
  const server = fastify({
    logger: true,
    https: httpsOptions
  });

  server.register(cors, {
    origin: (origin, cb) => {
      // Allow mobile apps, curl, and requests with no origin header
      if (!origin) return cb(null, true);

      const customOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : [];
      if (customOrigins.includes('*') || customOrigins.includes(origin)) {
        return cb(null, true);
      }

      // Allow localhost, LAN IPs, and Vercel deployment domains
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isLan = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+(:\d+)?$/.test(origin);
      const isVercel = /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin);

      if (isLocalhost || isLan || isVercel) {
        return cb(null, true);
      }

      return cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  });

  // Register plugins
  server.register(jwtPlugin);

  // Global structured error handler to prevent internal info leakage
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);
    const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
    let message = error.message;
    if (statusCode === 500) {
      message = 'An unexpected internal server error occurred';
    }

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR'),
        message,
      },
    });
  });

  // Health check and root ping routes
  server.get('/health', async () => {
    return { status: 'ok' };
  });

  server.get('/', async () => {
    return { status: 'ok' };
  });

  // Register routes
  server.register(authRoutes, { prefix: '/api/v1/auth' });
  server.register(fashionRoutes, { prefix: '/api/v1/fashion' });
  server.register(aiRoutes, { prefix: '/api/v1/ai' });
  server.register(itemsRoutes, { prefix: '/api/v1/items' });
  server.register(storageLocationsRoutes, { prefix: '/api/v1/storage-locations' });
  server.register(marketplacesRoutes, { prefix: '/api/v1/marketplaces' });
  server.register(ebayRoutes, { prefix: '/api/v1/ebay' });
  server.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  server.register(billingRoutes, { prefix: '/api/v1/billing' });
  server.register(adminRoutes, { prefix: '/api/v1/admin' });
  server.register(usersRoutes, { prefix: '/api/v1/users' });

  return server;
};

const start = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.PORT;
    const port = Number(process.env.PORT) || 3001;

    // In production or on hosted platforms (Render/Railway), run ONLY a single plain HTTP server on 0.0.0.0
    if (isProduction) {
      const server = buildServer();
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`[Production] HTTP Server listening on port ${port} on 0.0.0.0`);
      return;
    }

    // Local development HTTPS + HTTP setup (if HTTPS_ENABLED=true)
    const httpsEnabled = process.env.HTTPS_ENABLED === 'true';
    if (httpsEnabled) {
      const keyPath = process.env.HTTPS_KEY_PATH ? path.resolve(__dirname, '../../', process.env.HTTPS_KEY_PATH) : '';
      const certPath = process.env.HTTPS_CERT_PATH ? path.resolve(__dirname, '../../', process.env.HTTPS_CERT_PATH) : '';
      
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      
      const localHttpsPort = 3000;
      const secureServer = buildServer(httpsOptions);
      await secureServer.listen({ port: localHttpsPort, host: '0.0.0.0' });
      console.log(`[Dev] HTTPS Server listening at https://localhost:${localHttpsPort}`);

      const insecureServer = buildServer();
      const localHttpPort = 3001;
      await insecureServer.listen({ port: localHttpPort, host: '0.0.0.0' });
      console.log(`[Dev] HTTP Server listening at http://localhost:${localHttpPort}`);
    } else {
      const server = buildServer();
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`[Dev] HTTP Server listening at http://localhost:${port}`);
    }
  } catch (err: any) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}
