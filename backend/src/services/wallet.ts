export interface Transaction {
  id: string;
  userId: number;
  type: 'sbp' | 'visa' | 'deposit' | 'withdraw';
  title: string;
  category: string;
  amountUsdt: number;
  amountRub?: number;
  rate?: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  icon: string;
}

export interface UserWallet {
  userId: number;
  balanceUsdt: number;
  card: {
    pan: string;
    exp: string;
    cvv: string;
    holder: string;
    isFrozen: boolean;
    monthlyLimitUsd: number;
    spentThisMonthUsd: number;
  };
  transactions: Transaction[];
}

// Хранилище сессий пользователей (в памяти / с возможностью легкой замены на PostgreSQL/Supabase)
const walletsStore = new Map<number, UserWallet>();

export class WalletService {
  public static getOrCreateWallet(userId: number, initialUsername?: string): UserWallet {
    if (!walletsStore.has(userId)) {
      walletsStore.set(userId, {
        userId,
        balanceUsdt: 1420.50,
        card: {
          pan: '4242 8491 2049 8831',
          exp: '09/29',
          cvv: '849',
          holder: (initialUsername || 'ALEX MIRONOV').toUpperCase(),
          isFrozen: false,
          monthlyLimitUsd: 10000,
          spentThisMonthUsd: 3450,
        },
        transactions: [
          {
            id: 'tx-1',
            userId,
            type: 'sbp',
            title: 'ВкусВилл',
            category: 'Продукты',
            amountRub: 1480,
            amountUsdt: 15.91,
            rate: 93.00,
            timestamp: 'Сегодня, 14:23',
            status: 'completed',
            icon: '🛍️',
          },
          {
            id: 'tx-2',
            userId,
            type: 'visa',
            title: 'OpenAI ChatGPT Plus',
            category: 'Подписки',
            amountUsdt: 20.00,
            timestamp: 'Вчера, 19:10',
            status: 'completed',
            icon: '🤖',
          },
          {
            id: 'tx-3',
            userId,
            type: 'deposit',
            title: 'Пополнение USDT (TON)',
            category: 'Депозит',
            amountUsdt: 500.00,
            timestamp: '28 Окт, 11:45',
            status: 'completed',
            icon: '💎',
          },
        ],
      });
    }

    return walletsStore.get(userId)!;
  }

  /**
   * Списание баланса при оплате по СБП
   */
  public static processSbpPayment(
    userId: number,
    merchant: string,
    category: string,
    amountRub: number,
    amountUsdt: number,
    rate: number
  ): { success: boolean; error?: string; tx?: Transaction; newBalance?: number } {
    const wallet = this.getOrCreateWallet(userId);

    if (wallet.balanceUsdt < amountUsdt) {
      return { success: false, error: 'Недостаточно средств на балансе USDT' };
    }

    wallet.balanceUsdt = parseFloat((wallet.balanceUsdt - amountUsdt).toFixed(2));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      type: 'sbp',
      title: merchant,
      category,
      amountRub,
      amountUsdt,
      rate,
      timestamp: 'Только что',
      status: 'completed',
      icon: '🛍️',
    };

    wallet.transactions.unshift(newTx);
    return { success: true, tx: newTx, newBalance: wallet.balanceUsdt };
  }

  /**
   * Пополнение баланса (USDT)
   */
  public static processDeposit(userId: number, amountUsdt: number): { tx: Transaction; newBalance: number } {
    const wallet = this.getOrCreateWallet(userId);
    wallet.balanceUsdt = parseFloat((wallet.balanceUsdt + amountUsdt).toFixed(2));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      type: 'deposit',
      title: 'Пополнение USDT (TON)',
      category: 'Криптовалюта',
      amountUsdt,
      timestamp: 'Только что',
      status: 'completed',
      icon: '💎',
    };

    wallet.transactions.unshift(newTx);
    return { tx: newTx, newBalance: wallet.balanceUsdt };
  }

  /**
   * Перевод средств (Telegram, Крипта, СБП)
   */
  public static processTransfer(
    userId: number,
    recipient: string,
    method: string,
    amountUsdt: number,
    rate: number
  ): { success: boolean; error?: string; tx?: Transaction; newBalance?: number } {
    const wallet = this.getOrCreateWallet(userId);

    if (wallet.balanceUsdt < amountUsdt) {
      return { success: false, error: 'Недостаточно средств для перевода' };
    }

    wallet.balanceUsdt = parseFloat((wallet.balanceUsdt - amountUsdt).toFixed(2));

    const methodTitle =
      method === 'telegram'
        ? `Перевод в Telegram (${recipient})`
        : method === 'crypto'
        ? `Перевод на кошелек (${recipient.slice(0, 6)}...)`
        : `Вывод на карту СБП (${recipient})`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      type: 'withdraw',
      title: methodTitle,
      category: 'Переводы',
      amountUsdt,
      amountRub: method === 'sbp' ? parseFloat((amountUsdt * rate).toFixed(0)) : undefined,
      timestamp: 'Только что',
      status: 'completed',
      icon: '📤',
    };

    wallet.transactions.unshift(newTx);
    return { success: true, tx: newTx, newBalance: wallet.balanceUsdt };
  }

  /**
   * Заморозка / разморозка карты Visa
   */
  public static toggleCardFreeze(userId: number): boolean {
    const wallet = this.getOrCreateWallet(userId);
    wallet.card.isFrozen = !wallet.card.isFrozen;
    return wallet.card.isFrozen;
  }
}
