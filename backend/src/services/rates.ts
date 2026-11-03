export interface LiveRatesResponse {
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
}

let cachedRates: LiveRatesResponse | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 секунд кэш

export class RatesService {
  public static async getLiveRates(): Promise<LiveRatesResponse> {
    const now = Date.now();

    // Возврат из кэша, если прошло меньше 30 секунд
    if (cachedRates && now - lastFetchTime < CACHE_TTL_MS) {
      return { ...cachedRates, source: 'cache' };
    }

    try {
      const response = await fetch(
        'https://tonapi.io/v2/rates?tokens=ton,usdt&currencies=usd,rub,eur',
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error(`TonAPI returned status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const tonRates = data?.rates?.TON;
      const usdtRates = data?.rates?.USDT;

      const tonUsd = parseFloat(tonRates?.prices?.USD || '1.17');
      const tonRub = parseFloat(tonRates?.prices?.RUB || '95.0');
      const tonEur = parseFloat(tonRates?.prices?.EUR || '1.05');

      const usdtUsd = parseFloat(usdtRates?.prices?.USD || '1.0');
      const usdtRub = parseFloat(usdtRates?.prices?.RUB || '81.1');
      const usdtEur = parseFloat(usdtRates?.prices?.EUR || '0.89');

      const tonUsdt = parseFloat((tonUsd / (usdtUsd || 1)).toFixed(4));

      const rates: LiveRatesResponse = {
        ok: true,
        source: 'tonapi',
        timestamp: new Date().toISOString(),
        usdtRub: parseFloat(usdtRub.toFixed(2)),
        usdtUsd: parseFloat(usdtUsd.toFixed(4)),
        usdtEur: parseFloat(usdtEur.toFixed(4)),
        tonUsd: parseFloat(tonUsd.toFixed(4)),
        tonRub: parseFloat(tonRub.toFixed(2)),
        tonEur: parseFloat(tonEur.toFixed(4)),
        tonUsdt,
        diff24h: {
          tonUsd: tonRates?.diff_24h?.USD || '-0.00%',
          tonRub: tonRates?.diff_24h?.RUB || '-0.00%',
          usdtRub: usdtRates?.diff_24h?.RUB || '+0.00%',
          usdtEur: usdtRates?.diff_24h?.EUR || '+0.00%',
          usdtUsd: usdtRates?.diff_24h?.USD || '+0.00%',
        },
      };

      cachedRates = rates;
      lastFetchTime = now;
      return rates;
    } catch (err) {
      console.error('[RatesService] Failed to fetch live rates from TonAPI:', err);

      if (cachedRates) {
        return { ...cachedRates, source: 'cache' };
      }

      // Безопасный дефолтный ответ при сбое сети
      return {
        ok: true,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        usdtRub: 93.0,
        usdtUsd: 1.0,
        usdtEur: 0.92,
        tonUsd: 1.17,
        tonRub: 95.0,
        tonEur: 1.05,
        tonUsdt: 1.17,
        diff24h: {
          tonUsd: '-2.45%',
          tonRub: '-1.85%',
          usdtRub: '+0.50%',
          usdtEur: '+0.10%',
          usdtUsd: '+0.01%',
        },
      };
    }
  }
}
