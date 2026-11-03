const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
    ? 'http://localhost:3001'
    : '';

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
}
