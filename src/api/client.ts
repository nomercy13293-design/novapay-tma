const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
    ? 'http://localhost:3001'
    : '';

export interface RealChartPoint {
  time: number;
  price: number;
}

export interface RealChartResult {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  changePercent: string;
  high: number;
  low: number;
  points: RealChartPoint[];
}

export interface CurrencyItem {
  id: string;
  name: string;
  symbol: string;
  pair: string;
  price: number;
  priceFormatted: string;
  change24h: string;
  isPositive: boolean;
  category: 'ton' | 'crypto' | 'fiat';
  tag: string;
  icon: string;
  sub: string;
  history: {
    '1D': number[];
    '1W': number[];
    '1M': number[];
    '1Y': number[];
  };
}

export interface LiveRates {
  ok: boolean;
  source: 'tonapi' | 'cache' | 'fallback';
  timestamp: string;
  usdtRub: number;
  usdtUsd: number;
  usdtEur: number;
  tonUsd: number;
  tonRub: number;
  tonEur: number;
  tonUsdt: number;
  diff24h: {
    tonUsd: string;
    tonRub: string;
    usdtRub: string;
    usdtEur: string;
    usdtUsd: string;
  };
  items?: CurrencyItem[];
}

export interface AuthResponse {
  ok: boolean;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  wallet?: any;
  error?: string;
}

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!res.ok) {
        console.warn(`[API] ${endpoint} returned status ${res.status}`);
        return null;
      }

      return (await res.json()) as T;
    } catch (err) {
      console.warn(`[API Offline/Fallback] Could not reach backend at ${API_URL}${endpoint}`);
      return null;
    }
  }

  /**
   * Авторизация через Telegram initData
   */
  public static async authTelegram(initData: string): Promise<AuthResponse | null> {
    return this.request<AuthResponse>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  }

  /**
   * Проведение платежа по СБП и отправка чека в Telegram
   */
  public static async paySbp(payload: {
    userId: number;
    merchant: string;
    category: string;
    amountRub: number;
    amountUsdt: number;
    rate: number;
  }) {
    return this.request<{ ok: boolean; tx?: any; newBalance?: number }>('/api/sbp/pay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Расшифровка QR-кода СБП
   */
  public static async decodeSbpQr(qrUrl: string) {
    return this.request<{ ok: boolean; data?: any }>('/api/sbp/decode', {
      method: 'POST',
      body: JSON.stringify({ qrUrl }),
    });
  }

  /**
   * Пополнение счета (USDT)
   */
  public static async deposit(payload: {
    userId: number;
    amountUsdt: number;
    network?: string;
  }) {
    return this.request<{ ok: boolean; tx?: any; newBalance?: number }>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Перевод средств (Telegram / Крипта / СБП)
   */
  public static async transfer(payload: {
    userId: number;
    recipient: string;
    method: string;
    amountUsdt: number;
    rate?: number;
  }) {
    return this.request<{ ok: boolean; tx?: any; newBalance?: number }>('/api/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Заморозка / разморозка карты Visa
   */
  public static async toggleCardFreeze(userId: number) {
    return this.request<{ ok: boolean; isFrozen?: boolean }>('/api/wallet/card/freeze', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Получение актуальных курсов валют из блокчейна TON (TonAPI)
   */
  public static async getRates(): Promise<LiveRates | null> {
    const data = await this.request<LiveRates>('/api/rates');
    if (data && data.ok) return data;

    // Прямой резервный запрос к TonAPI
    try {
      const res = await fetch('https://tonapi.io/v2/rates?tokens=ton,usdt&currencies=usd,rub,eur');
      if (res.ok) {
        const json = await res.json();
        const tonRates = json?.rates?.TON;
        const usdtRates = json?.rates?.USDT;
        const tonUsd = parseFloat(tonRates?.prices?.USD || '1.17');
        const tonRub = parseFloat(tonRates?.prices?.RUB || '95.0');
        const tonEur = parseFloat(tonRates?.prices?.EUR || '1.05');
        const usdtUsd = parseFloat(usdtRates?.prices?.USD || '1.0');
        const usdtRub = parseFloat(usdtRates?.prices?.RUB || '81.1');
        const usdtEur = parseFloat(usdtRates?.prices?.EUR || '0.89');

        return {
          ok: true,
          source: 'tonapi',
          timestamp: new Date().toISOString(),
          usdtRub: parseFloat(usdtRub.toFixed(2)),
          usdtUsd: parseFloat(usdtUsd.toFixed(4)),
          usdtEur: parseFloat(usdtEur.toFixed(4)),
          tonUsd: parseFloat(tonUsd.toFixed(4)),
          tonRub: parseFloat(tonRub.toFixed(2)),
          tonEur: parseFloat(tonEur.toFixed(4)),
          tonUsdt: parseFloat((tonUsd / (usdtUsd || 1)).toFixed(4)),
          diff24h: {
            tonUsd: tonRates?.diff_24h?.USD || '-0.00%',
            tonRub: tonRates?.diff_24h?.RUB || '-0.00%',
            usdtRub: usdtRates?.diff_24h?.RUB || '+0.00%',
            usdtEur: usdtRates?.diff_24h?.EUR || '+0.00%',
            usdtUsd: usdtRates?.diff_24h?.USD || '+0.00%',
          },
        };
      }
    } catch {}

    return null;
  }

  /**
   * Получение реальных свечных данных графика из Binance / TonAPI
   */
  public static async getRealChart(symbol: string, timeframe: string): Promise<RealChartResult | null> {
    const data = await this.request<{ ok: boolean; chart: RealChartResult }>(
      `/api/rates/chart?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`
    );
    if (data && data.ok && data.chart) {
      return data.chart;
    }
    return null;
  }

  /**
   * Отправить тестовое push-уведомление в Telegram
   */
  public static async sendTestNotification(chatId: number | string): Promise<{ ok: boolean } | null> {
    return this.request<{ ok: boolean }>('/api/telegram/test-notification', {
      method: 'POST',
      body: JSON.stringify({ chatId }),
    });
  }
}
