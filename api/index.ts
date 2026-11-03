import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from '../backend/src/routes/auth.routes.js';
import { sbpRoutes } from '../backend/src/routes/sbp.routes.js';
import { walletRoutes } from '../backend/src/routes/wallet.routes.js';

const app = Fastify({ logger: false });

let isReady = false;
async function init() {
  if (!isReady) {
    await app.register(cors, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    app.get('/api/health', async () => {
      return { status: 'ok', service: 'NovaPay Vercel Serverless API', timestamp: new Date().toISOString() };
    });

    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(sbpRoutes, { prefix: '/api/sbp' });
    await app.register(walletRoutes, { prefix: '/api/wallet' });

    await app.ready();
    isReady = true;
  }
}

export default async function handler(req: any, res: any) {
  await init();
  app.server.emit('request', req, res);
}
