import type { Transaction, UserProfile, CardInfo } from '../types';

const cyrillicToLatinMap: Record<string, string> = {
  а: 'A', б: 'B', в: 'V', г: 'G', д: 'D', е: 'E', ё: 'E', ж: 'ZH', з: 'Z',
  и: 'I', й: 'Y', к: 'K', л: 'L', м: 'M', н: 'N', о: 'O', п: 'P', р: 'R',
  с: 'S', т: 'T', у: 'U', ф: 'F', х: 'KH', ц: 'TS', ч: 'CH', ш: 'SH',
  щ: 'SHCH', ъ: '', ы: 'Y', ь: '', э: 'E', ю: 'YU', я: 'YA',
};

/**
 * Транслитерация имени на латиницу для выбивания на карте Visa
 */
export function transliterateToLatin(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      if (cyrillicToLatinMap[lower] !== undefined) {
        return cyrillicToLatinMap[lower];
      }
      return char.toUpperCase();
    })
    .join('')
    .replace(/[^A-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Генерация аккуратного персонализированного градиентного аватара с первой буквой имени
 */
export function getFallbackAvatar(name: string): string {
  const initial = (name.trim()[0] || 'N').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="npGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="50%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#npGrad)"/>
    <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Синхронное получение реального пользователя Telegram с первого кадра рендера
 */
export function getInitialTelegramUser(): UserProfile {
  if (typeof window !== 'undefined') {
    // 1. Telegram WebApp синхронный объект, доступный до старта React
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Пользователь';
      const username = tgUser.username ? `@${tgUser.username}` : `@id${tgUser.id}`;
      const avatar = tgUser.photo_url || getFallbackAvatar(fullName);
      const user: UserProfile = {
        id: tgUser.id,
        name: fullName,
        username,
        avatar,
        memo: `NP-${tgUser.id}`,
        isKycVerified: true,
        kycTier: 'Standard (До $15,000/мес)',
      };
      try {
        localStorage.setItem('novapay_user', JSON.stringify(user));
      } catch {}
      return user;
    }

    // 2. Локальный кэш пользователя (если Telegram временно не передал initDataUnsafe)
    try {
      const saved = localStorage.getItem('novapay_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.username) {
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Нейтральный брендовый профиль по умолчанию (БЕЗ чужих имён и чужих фотографий)
  return {
    name: 'Клиент NovaPay',
    username: '@novapay_client',
    avatar: getFallbackAvatar('NovaPay'),
    isKycVerified: true,
    kycTier: 'Standard (До $15,000/мес)',
  };
}

/**
 * Инициализация данных банковской карты с именем текущего пользователя
 */
export function getInitialCard(user?: UserProfile): CardInfo {
  const holder = user?.name ? transliterateToLatin(user.name) : 'CLIENT CARD';
  return {
    panMasked: '•••• •••• •••• 8492',
    panFull: '4258 9100 3482 8492',
    cardholder: holder || 'CLIENT CARD',
    expiry: '11/29',
    cvv: '624',
    isFrozen: false,
    type: 'visa_platinum',
  };
}

export const initialUser: UserProfile = getInitialTelegramUser();
export const initialCard: CardInfo = getInitialCard(initialUser);

export const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'sbp',
    title: 'ВкусВилл',
    category: 'Супермаркеты',
    amountRub: 1480,
    amountUsdt: 15.91,
    rate: 93.00,
    timestamp: 'Сегодня, 17:42',
    status: 'completed',
    icon: '🛒',
  },
  {
    id: 'tx-2',
    type: 'visa',
    title: 'OpenAI (ChatGPT Plus)',
    category: 'Подписки',
    amountUsdt: 20.00,
    timestamp: 'Вчера, 12:15',
    status: 'completed',
    icon: '🤖',
  },
  {
    id: 'tx-3',
    type: 'sbp',
    title: 'Даблби Кофе',
    category: 'Кафе и рестораны',
    amountRub: 390,
    amountUsdt: 4.19,
    rate: 93.00,
    timestamp: 'Вчера, 09:30',
    status: 'completed',
    icon: '☕',
  },
  {
    id: 'tx-4',
    type: 'deposit',
    title: 'Пополнение USDT (TON)',
    category: 'Криптовалюта',
    amountUsdt: 500.00,
    timestamp: '01 Ноя, 14:10',
    status: 'completed',
    icon: '💎',
  },
  {
    id: 'tx-5',
    type: 'sbp',
    title: 'Лукойл АЗС',
    category: 'Транспорт',
    amountRub: 2500,
    amountUsdt: 26.88,
    rate: 93.00,
    timestamp: '30 Окт, 19:20',
    status: 'completed',
    icon: '⛽',
  },
  {
    id: 'tx-6',
    type: 'visa',
    title: 'Steam Games',
    category: 'Игры',
    amountUsdt: 14.50,
    timestamp: '28 Окт, 21:04',
    status: 'completed',
    icon: '🎮',
  },
];
