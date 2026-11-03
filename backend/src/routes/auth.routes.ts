import type { FastifyPluginAsync } from 'fastify';
import { validateTelegramInitData } from '../services/auth.js';
import { WalletService } from '../services/wallet.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/telegram', async (request, reply) => {
    const { initData } = request.body as { initData?: string };

    if (!initData) {
      return reply.status(400).send({ ok: false, error: 'initData обязателен' });
    }

    const validation = validateTelegramInitData(initData);
    if (!validation.isValid) {
      return reply.status(401).send({ ok: false, error: validation.error || 'Неверная подпись Telegram' });
    }

    const userId = validation.user?.id || 1001;
    const username = validation.user?.username || validation.user?.first_name || 'User';

    const wallet = await WalletService.getOrCreateWallet(userId, username);

    return {
      ok: true,
      user: validation.user,
      wallet,
    };
  });
};
