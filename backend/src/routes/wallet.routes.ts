import type { FastifyPluginAsync } from 'fastify';
import { WalletService } from '../services/wallet.js';
import { TelegramService } from '../services/telegram.js';
import { TwoFactorService } from '../services/twoFactor.js';

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

  // Получение персональных реквизитов депозита и Memo
  fastify.get('/deposit-info/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const uid = parseInt(userId, 10);
    if (!uid) {
      return reply.status(400).send({ ok: false, error: 'Неверный userId' });
    }

    const info = await WalletService.getDepositInfo(uid);
    return { ok: true, ...info };
  });

  // Проверка и зачисление депозита по Memo
  fastify.post('/deposit/verify', async (request, reply) => {
    const { userId, memo } = request.body as { userId: number; memo?: string };
    if (!userId) {
      return reply.status(400).send({ ok: false, error: 'userId обязателен' });
    }

    const result = await WalletService.verifyDepositByMemo(userId, memo);
    if (!result.success || !result.tx) {
      return reply.status(400).send({ ok: false, error: result.error || 'Депозит с данным Memo не найден' });
    }

    // Отправляем push-сообщение о зачислении в Telegram
    await TelegramService.sendDepositNotice({
      chatId: userId,
      amountUsdt: result.amountUsdt || 100,
      newBalance: result.newBalance!,
      network: 'TON (The Open Network)',
      txId: result.tx.id,
    });

    return { ok: true, ...result };
  });

  // Прямой депозит
  fastify.post('/deposit', async (request, reply) => {
    const { userId, amountUsdt, network } = request.body as {
      userId: number;
      amountUsdt: number;
      network?: string;
    };
    if (!userId || !amountUsdt) {
      return reply.status(400).send({ ok: false, error: 'Неверные параметры депозита' });
    }

    const result = await WalletService.processDeposit(userId, amountUsdt);

    // Отправляем push-сообщение в Telegram бот
    if (result.tx) {
      await TelegramService.sendDepositNotice({
        chatId: userId,
        amountUsdt,
        newBalance: result.newBalance,
        network: network || 'TON (The Open Network)',
        txId: result.tx.id,
      });
    }

    return { ok: true, ...result };
  });

  // 2FA: Инициализация перевода (генерация 6-значного кода и отправка в Telegram)
  fastify.post('/transfer/initiate', async (request, reply) => {
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

    // Проверяем баланс перед отправкой 2FA кода
    const wallet = await WalletService.getOrCreateWallet(userId);
    if (wallet.balanceUsdt < amountUsdt) {
      return reply.status(400).send({ ok: false, error: 'Недостаточно средств на балансе' });
    }

    // Создаем вызов 2FA и шлем код в бота
    const challenge = await TwoFactorService.createTransferChallenge(userId, {
      recipient,
      method: method || 'telegram',
      amountUsdt,
      rate: rate || 93.0,
    });

    return {
      ok: true,
      requires2fa: true,
      challengeId: challenge.challengeId,
      expiresInSeconds: challenge.expiresInSeconds,
      simulatedCode: challenge.simulatedCode,
    };
  });

  // 2FA: Подтверждение кода и выполнение перевода
  fastify.post('/transfer/confirm', async (request, reply) => {
    const { userId, challengeId, code } = request.body as {
      userId: number;
      challengeId: string;
      code: string;
    };

    if (!userId || !challengeId || !code) {
      return reply.status(400).send({ ok: false, error: 'Укажите challengeId и 6-значный код 2FA' });
    }

    const verification = await TwoFactorService.verifyChallenge(userId, challengeId, code);
    if (!verification.valid || !verification.payload) {
      return reply.status(400).send({ ok: false, error: verification.error || 'Неверный код 2FA' });
    }

    const payload = verification.payload;
    const result = await WalletService.processTransfer(
      userId,
      payload.recipient,
      payload.method,
      payload.amountUsdt,
      payload.rate || 93.0
    );

    if (!result.success || !result.tx) {
      return reply.status(400).send({ ok: false, error: result.error || 'Ошибка списания средств' });
    }

    // Отправляем итоговый чек в Telegram
    await TelegramService.sendTransferNotice({
      chatId: userId,
      amountUsdt: payload.amountUsdt,
      recipient: payload.recipient,
      method: payload.method,
      txId: result.tx.id,
    });

    return { ok: true, tx: result.tx, newBalance: result.newBalance };
  });

  // Прямой перевод (с обратной совместимостью)
  fastify.post('/transfer', async (request, reply) => {
    const {
      userId,
      recipient,
      method,
      amountUsdt,
      rate,
      challengeId,
      code,
    } = request.body as {
      userId: number;
      recipient: string;
      method: string;
      amountUsdt: number;
      rate?: number;
      challengeId?: string;
      code?: string;
    };

    if (!userId || !recipient || !amountUsdt) {
      return reply.status(400).send({ ok: false, error: 'Заполните все поля перевода' });
    }

    // Если передан 2FA код, проверяем
    if (challengeId && code) {
      const verification = await TwoFactorService.verifyChallenge(userId, challengeId, code);
      if (!verification.valid) {
        return reply.status(400).send({ ok: false, error: verification.error });
      }
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
