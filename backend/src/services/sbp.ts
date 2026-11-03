import { config } from '../config/env.js';

export interface DecodedSbpQr {
  rawUrl: string;
  isNspk: boolean;
  merchantName: string;
  amountRub?: number;
  amountUsdt?: number;
  rate: number;
  spreadPercent: number;
  paymentId: string;
}

export class SbpService {
  /**
   * Разбор и валидация QR-кода Системы быстрых платежей (НСПК РФ)
   */
  public static decodeQr(rawUrl: string): DecodedSbpQr {
    const isNspk = rawUrl.includes('qr.nspk.ru') || rawUrl.includes('sbp.nspk.ru');
    const paymentId = 'sbp-' + Math.random().toString(36).substring(2, 10);

    // Извлечение параметров суммы и мерчанта, если они присутствуют в URL
    let amountRub: number | undefined;
    let merchantName = 'Мерчант СБП (Россия)';

    try {
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        const urlObj = new URL(rawUrl);
        const sumParam = urlObj.searchParams.get('sum');
        if (sumParam) {
          // В СБП сумма часто передается в копейках
          const parsed = parseFloat(sumParam);
          amountRub = parsed > 1000 ? parsed / 100 : parsed;
        }

        const mName = urlObj.searchParams.get('merchant') || urlObj.searchParams.get('name');
        if (mName) {
          merchantName = decodeURIComponent(mName);
        }
      }
    } catch {
      // Игнорируем ошибки парсинга нестандартных строк
    }

    const rate = config.usdtRubRate;
    const spreadPercent = config.sbpSpreadPercent;

    let amountUsdt: number | undefined;
    if (amountRub) {
      // Сумма в USDT с учетом спреда конвертации
      amountUsdt = parseFloat(((amountRub / rate) * (1 + spreadPercent / 100)).toFixed(2));
    }

    return {
      rawUrl,
      isNspk,
      merchantName,
      amountRub,
      amountUsdt,
      rate,
      spreadPercent,
      paymentId,
    };
  }

  /**
   * Расчет эквивалента суммы в USDT по текущему курсу
   */
  public static calculateUsdt(amountRub: number): {
    amountRub: number;
    amountUsdt: number;
    rate: number;
    spread: number;
  } {
    const rate = config.usdtRubRate;
    const spread = config.sbpSpreadPercent;
    const amountUsdt = parseFloat(((amountRub / rate) * (1 + spread / 100)).toFixed(2));

    return {
      amountRub,
      amountUsdt,
      rate,
      spread,
    };
  }
}
