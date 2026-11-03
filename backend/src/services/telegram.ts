import { config } from '../config/env.js';

export interface SbpReceiptPayload {
  chatId: number | string;
  merchant: string;
  amountRub: number;
  amountUsdt: number;
  rate: number;
  txId: string;
}

export interface TransferNoticePayload {
  chatId: number | string;
  amountUsdt: number;
  recipient: string;
  method: string;
  txId: string;
}

export interface SecurityCodePayload {
  chatId: number | string;
  code: string;
  amountUsd: number;
  merchant: string;
}

export class TelegramService {
  private static async makeRequest(method: string, body: Record<string, any>): Promise<any> {
    if (!config.botToken || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
      console.log(`[Simulated Telegram Bot] ${method}:`, JSON.stringify(body, null, 2));
      return { ok: true, simulated: true };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as any;
      if (!data.ok) {
        console.error(`[Telegram API Error] ${method}:`, data.description);
      }
      return data;
    } catch (err) {
      console.error(`[Telegram Network Error] ${method}:`, err);
      return { ok: false, error: err };
    }
  }

  /**
   * Отправка мгновенного фискального чека после оплаты СБП
   */
  public static async sendSbpReceipt(payload: SbpReceiptPayload): Promise<boolean> {
    const text = [
      `🛍️ <b>Успешная оплата по СБП (НСПК)</b>`,
      ``,
      `🏪 <b>Магазин:</b> ${payload.merchant}`,
      `💵 <b>Сумма в чеке:</b> ${payload.amountRub.toLocaleString('ru-RU')} ₽`,
      `₮ <b>Списано с баланса:</b> ${payload.amountUsdt.toFixed(2)} USDT`,
      `📊 <b>Курс обмена:</b> 1 USDT = ${payload.rate.toFixed(2)} ₽`,
      `🧾 <b>ID транзакции:</b> <code>${payload.txId}</code>`,
      ``,
      `⚡ <i>Оплата проведена мгновенно через шлюз NovaPay.</i>`,
    ].join('\n');

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
    });

    return res.ok;
  }

  /**
   * Уведомление о переводе средств
   */
  public static async sendTransferNotice(payload: TransferNoticePayload): Promise<boolean> {
    const text = [
      `📤 <b>Перевод средств выполнен</b>`,
      ``,
      `₮ <b>Сумма:</b> ${payload.amountUsdt.toFixed(2)} USDT`,
      `👤 <b>Получатель:</b> <code>${payload.recipient}</code>`,
      `⚙️ <b>Метод:</b> ${payload.method}`,
      `🧾 <b>ID:</b> <code>${payload.txId}</code>`,
      ``,
      `✅ <i>Средства успешно отправлены.</i>`,
    ].join('\n');

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
    });

    return res.ok;
  }

  /**
   * Одноразовый 3D Secure код для оплаты картой Visa
   */
  public static async sendSecurityCode(payload: SecurityCodePayload): Promise<boolean> {
    const text = [
      `🛡️ <b>Одноразовый код 3D Secure (Visa)</b>`,
      ``,
      `Покупка в: <b>${payload.merchant}</b>`,
      `Сумма: <b>$${payload.amountUsd.toFixed(2)}</b>`,
      ``,
      `Ваш код подтверждения: <code>${payload.code}</code>`,
      ``,
      `⚠️ <i>Никому не сообщайте этот код, даже сотрудникам банка.</i>`,
    ].join('\n');

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
    });

    return res.ok;
  }
}
