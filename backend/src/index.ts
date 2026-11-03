import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { sbpRoutes } from './routes/sbp.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
import { telegramRoutes } from './routes/telegram.routes.js';

const fastify = Fastify({
  logger: true,
});

async function main() {
  try {
    // Регистрация CORS
    await fastify.register(cors, {
      origin: (origin, cb) => {
        // Разрешаем запросы без origin (например curl/сервер-к-серверу) или из разрешенных доменов
        if (!origin || config.corsOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          cb(null, true);
          return;
        }
        cb(null, true); // В dev-режиме открыто
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', service: 'NovaPay Core API', timestamp: new Date().toISOString() };
    });

    // Регистрация роутов API
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(sbpRoutes, { prefix: '/api/sbp' });
    await fastify.register(walletRoutes, { prefix: '/api/wallet' });
    await fastify.register(telegramRoutes, { prefix: '/api/telegram' });

    // Запуск сервера
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`\n🚀 NovaPay Backend успешно запущен на http://localhost:${config.port}`);
    console.log(`📡 Health Check: http://localhost:${config.port}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
