import crypto from 'crypto';
import { pool, initDb } from '../db/index.js';
import { TelegramService } from './telegram.js';

export interface OtpChallenge {
  challengeId: string;
  userId: number;
  code: string;
  action: 'transfer' | 'withdraw' | 'card_action';
  payload: Record<string, any>;
  attempts: number;
  expiresAt: number; // Unix timestamp ms
  createdAt: number;
}

// In-memory fallback
const memoryOtpStore = new Map<string, OtpChallenge>();

// Очистка устаревших вызовов каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [id, challenge] of memoryOtpStore.entries()) {
    if (now > challenge.expiresAt) {
      memoryOtpStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

export class TwoFactorService {
  /**
   * Генерация криптографически безопасного 6-значного цифрового кода
   */
  public static generateCode(): string {
    const randomBuffer = crypto.randomBytes(4);
    const num = randomBuffer.readUInt32BE(0) % 900000 + 100000;
    return num.toString();
  }

  /**
   * Создание нового вызова 2FA и отправка кода в Telegram-бот
   */
  public static async createTransferChallenge(
    userId: number,
    payload: {
      recipient: string;
      method: string;
      amountUsdt: number;
      rate?: number;
    }
  ): Promise<{ challengeId: string; expiresInSeconds: number; simulatedCode?: string }> {
    const challengeId = `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const code = this.generateCode();
    const expiresInSeconds = 180; // 3 минуты
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    const challenge: OtpChallenge = {
      challengeId,
      userId,
      code,
      action: 'transfer',
      payload,
      attempts: 0,
      expiresAt,
      createdAt: Date.now(),
    };

    // Сохраняем в памяти (быстрый доступ)
    memoryOtpStore.set(challengeId, challenge);

    // Сохраняем в PostgreSQL (если доступен)
    if (pool) {
      await initDb();
      try {
        await pool.query(
          `INSERT INTO otp_challenges (challenge_id, user_id, code, action, payload, expires_at)
           VALUES ($1, $2, $3, $4, $5, TO_TIMESTAMP($6 / 1000.0))`,
          [challengeId, userId, code, 'transfer', JSON.stringify(payload), expiresAt]
        );
      } catch (err) {
        console.error('[DB Error in createTransferChallenge]:', err);
      }
    }

    // Отправляем код в Telegram
    await TelegramService.sendTwoFactorCode({
      chatId: userId,
      code,
      action: 'Перевод средств',
      amountUsdt: payload.amountUsdt,
      recipient: payload.recipient,
      method: payload.method,
      expiresInMinutes: 3,
    });

    console.log(`[2FA Generated] User ${userId}, challenge ${challengeId}, code: ${code}`);

    return {
      challengeId,
      expiresInSeconds,
      simulatedCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  /**
   * Проверка введенного кода 2FA
   */
  public static async verifyChallenge(
    userId: number,
    challengeId: string,
    inputCode: string
  ): Promise<{ valid: boolean; error?: string; payload?: any }> {
    const cleanCode = inputCode.trim().replace(/\s+/g, '');
    const now = Date.now();

    // 1. Проверяем в in-memory
    let challenge = memoryOtpStore.get(challengeId);

    // 2. Если нет в памяти, проверяем в БД
    if (!challenge && pool) {
      await initDb();
      try {
        const res = await pool.query(
          `SELECT * FROM otp_challenges WHERE challenge_id = $1 AND user_id = $2`,
          [challengeId, userId]
        );
        if (res.rowCount && res.rows[0]) {
          const row = res.rows[0];
          challenge = {
            challengeId: row.challenge_id,
            userId: Number(row.user_id),
            code: row.code,
            action: row.action,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            attempts: row.attempts,
            expiresAt: new Date(row.expires_at).getTime(),
            createdAt: new Date(row.created_at).getTime(),
          };
        }
      } catch (err) {
        console.error('[DB Error in verifyChallenge]:', err);
      }
    }

    if (!challenge) {
      return { valid: false, error: 'Код подтверждения не найден или устарел. Запросите код заново.' };
    }

    if (challenge.userId !== userId) {
      return { valid: false, error: 'Ошибка доступа к вызову 2FA.' };
    }

    if (now > challenge.expiresAt) {
      memoryOtpStore.delete(challengeId);
      if (pool) {
        await pool.query('DELETE FROM otp_challenges WHERE challenge_id = $1', [challengeId]).catch(() => {});
      }
      return { valid: false, error: 'Срок действия кода истек (3 мин). Запросите новый код.' };
    }

    if (challenge.attempts >= 3) {
      memoryOtpStore.delete(challengeId);
      if (pool) {
        await pool.query('DELETE FROM otp_challenges WHERE challenge_id = $1', [challengeId]).catch(() => {});
      }
      return { valid: false, error: 'Превышено максимальное число попыток ввода. Запросите перевод повторно.' };
    }

    // Сверка кода
    if (challenge.code !== cleanCode) {
      challenge.attempts += 1;
      const remainingAttempts = 3 - challenge.attempts;

      if (pool) {
        await pool.query(
          'UPDATE otp_challenges SET attempts = attempts + 1 WHERE challenge_id = $1',
          [challengeId]
        ).catch(() => {});
      }

      return {
        valid: false,
        error: `Неверный код безопасности. Осталось попыток: ${remainingAttempts}`,
      };
    }

    // Код верный! Удаляем использованный вызов
    memoryOtpStore.delete(challengeId);
    if (pool) {
      await pool.query('DELETE FROM otp_challenges WHERE challenge_id = $1', [challengeId]).catch(() => {});
    }

    return { valid: true, payload: challenge.payload };
  }
}
