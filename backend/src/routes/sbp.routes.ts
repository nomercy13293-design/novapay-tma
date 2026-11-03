import type { FastifyPluginAsync } from 'fastify';
import { SbpService } from '../services/sbp.js';
import { WalletService } from '../services/wallet.js';
import { TelegramService } from '../services/telegram.js';

export const sbpRoutes: FastifyPluginAsync = async (fastify) => {
  // Расшифровка QR-кода СБП
  fastify.post('/decode', async (request, reply) => {
    const { qrUrl } = request.body as { qrUrl?: string };
    if (!qrUrl) {
      return reply.status(400).send({ ok: false, error: 'qrUrl обязателен' });
    }

    const decoded = SbpService.decodeQr(qrUrl);
    return { ok: true, data: decoded };
  });

  // Проведение платежа по СБП
  fastify.post('/pay', async (request, reply) => {
    const {
      userId,
      merchant,
      category,
      amountRub,
      amountUsdt,
      rate,
    } = request.body as {
      userId: number;
      merchant: string;
      category: string;
      amountRub: number;
      amountUsdt: number;
      rate: number;
    };

    if (!userId || !merchant || !amountRub || !amountUsdt) {
      return reply.status(400).send({ ok: false, error: 'Не все поля заполнены' });
    }

    const result = await WalletService.processSbpPayment(
      userId,
      merchant,
      category || 'Покупки',
      amountRub,
      amountUsdt,
      rate || 93.0
    );

    if (!result.success) {
      return reply.status(400).send({ ok: false, error: result.error });
    }

    // Отправка чека пользователю в Telegram-бот
    if (result.tx) {
      await TelegramService.sendSbpReceipt({
        chatId: userId,
        merchant,
        amountRub,
        amountUsdt,
        rate: rate || 93.0,
        txId: result.tx.id,
      });
    }

    return {
      ok: true,
      tx: result.tx,
      newBalance: result.newBalance,
    };
  });
};
