import type { FastifyPluginAsync } from 'fastify';
import { WalletService } from '../services/wallet.js';
import { TelegramService } from '../services/telegram.js';

export const walletRoutes: FastifyPluginAsync = async (fastify) => {
  // Получение данных кошелька и баланса
  fastify.get('/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const uid = parseInt(userId, 10);
    if (!uid) {
      return reply.status(400).send({ ok: false, error: 'Неверный userId' });
    }

    const wallet = await WalletService.getOrCreateWallet(uid);
    return { ok: true, wallet };
  });

  // Депозит
  fastify.post('/deposit', async (request, reply) => {
    const { userId, amountUsdt } = request.body as { userId: number; amountUsdt: number };
    if (!userId || !amountUsdt) {
      return reply.status(400).send({ ok: false, error: 'Неверные параметры депозита' });
    }

    const result = await WalletService.processDeposit(userId, amountUsdt);
    return { ok: true, ...result };
  });

  // Перевод средств
  fastify.post('/transfer', async (request, reply) => {
    const {
      userId,
      recipient,
      method,
      amountUsdt,
      rate,
    } = request.body as {
      userId: number;
      recipient: string;
      method: string;
      amountUsdt: number;
      rate?: number;
    };

    if (!userId || !recipient || !amountUsdt) {
      return reply.status(400).send({ ok: false, error: 'Заполните все поля перевода' });
    }

    const result = await WalletService.processTransfer(userId, recipient, method || 'telegram', amountUsdt, rate || 93.0);
    if (!result.success) {
      return reply.status(400).send({ ok: false, error: result.error });
    }

    // Отправка уведомления в Telegram-бот
    if (result.tx) {
      await TelegramService.sendTransferNotice({
        chatId: userId,
        amountUsdt,
        recipient,
        method: method || 'telegram',
        txId: result.tx.id,
      });
    }

    return { ok: true, tx: result.tx, newBalance: result.newBalance };
  });

  // Заморозка / разморозка карты Visa
  fastify.post('/card/freeze', async (request, reply) => {
    const { userId } = request.body as { userId: number };
    if (!userId) {
      return reply.status(400).send({ ok: false, error: 'userId обязателен' });
    }

    const isFrozen = await WalletService.toggleCardFreeze(userId);
    return { ok: true, isFrozen };
  });
};
