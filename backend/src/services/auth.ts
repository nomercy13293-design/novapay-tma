import crypto from 'node:crypto';
import { config } from '../config/env.js';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface ValidationResult {
  isValid: boolean;
  user?: TelegramUser;
  authDate?: number;
  error?: string;
}

/**
 * Валидация Telegram WebApp initData по стандарту Telegram Mini App Security.
 * Проверяет криптографическую подпись HMAC-SHA256.
 */
export function validateTelegramInitData(initData: string): ValidationResult {
  if (!initData) {
    return { isValid: false, error: 'initData is empty' };
  }

  // Если токен еще не задан разработчиком в .env, разрешаем dev-режим
  if (!config.botToken || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    try {
      const params = new URLSearchParams(initData);
      const userRaw = params.get('user');
      const user = userRaw ? JSON.parse(userRaw) : undefined;
      return { isValid: true, user, authDate: Date.now() / 1000 };
    } catch {
      return { isValid: true };
    }
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return { isValid: false, error: 'Hash parameter is missing' };
    }

    params.delete('hash');

    // Сортировка ключей по алфавиту в формате key=value
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n');

    // Секретный ключ: HMAC-SHA256('WebAppData', BOT_TOKEN)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.botToken)
      .digest();

    // Вычисление хеша строки данных
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false, error: 'Invalid HMAC signature' };
    }

    // Проверка срока давности auth_date (защита от replay-атак: не старше 24 часов)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (authDate && now - authDate > 86400) {
      return { isValid: false, error: 'initData has expired' };
    }

    const userRaw = params.get('user');
    const user: TelegramUser | undefined = userRaw ? JSON.parse(userRaw) : undefined;

    return { isValid: true, user, authDate };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Validation error' };
  }
}
