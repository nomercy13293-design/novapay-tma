import { pool, initDb } from '../db/index.js';

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

// In-memory fallback хранилище (если DATABASE_URL не подключен)
const walletsStore = new Map<number, UserWallet>();

export class WalletService {
  /**
   * Получение или создание кошелька (PostgreSQL + in-memory fallback)
   */
  public static async getOrCreateWallet(userId: number, initialUsername?: string): Promise<UserWallet> {
    if (pool) {
      await initDb();
      try {
        const uRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (uRes.rowCount === 0) {
          await pool.query(
            'INSERT INTO users (id, username, first_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
            [userId, initialUsername || `user_${userId}`, initialUsername || 'User']
          );
          await pool.query(
            'INSERT INTO wallets (user_id, balance_usdt) VALUES ($1, 1420.50) ON CONFLICT (user_id) DO NOTHING',
            [userId]
          );
          await pool.query(
            'INSERT INTO cards (user_id, holder) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
            [userId, (initialUsername || 'NOVAPAY CLIENT').toUpperCase()]
          );
        }

        const wRes = await pool.query('SELECT balance_usdt FROM wallets WHERE user_id = $1', [userId]);
        const balanceUsdt = wRes.rows[0] ? parseFloat(wRes.rows[0].balance_usdt) : 1420.50;

        const cRes = await pool.query('SELECT * FROM cards WHERE user_id = $1', [userId]);
        const cardRow = cRes.rows[0] || {};
        let currentHolder = cardRow.holder || (initialUsername || 'NOVAPAY CLIENT').toUpperCase();
        if (currentHolder === 'ALEX MIRONOV') {
          currentHolder = (initialUsername || 'NOVAPAY CLIENT').toUpperCase();
          await pool.query('UPDATE cards SET holder = $1 WHERE user_id = $2', [currentHolder, userId]);
        }

        const card = {
          pan: cardRow.pan || '4242 8491 2049 8831',
          exp: cardRow.exp || '09/29',
          cvv: cardRow.cvv || '849',
          holder: currentHolder,
          isFrozen: Boolean(cardRow.is_frozen),
          monthlyLimitUsd: cardRow.monthly_limit_usd ? parseFloat(cardRow.monthly_limit_usd) : 10000,
          spentThisMonthUsd: cardRow.spent_this_month_usd ? parseFloat(cardRow.spent_this_month_usd) : 3450,
        };

        const tRes = await pool.query(
          'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
          [userId]
        );
        const transactions: Transaction[] = tRes.rows.map((row) => ({
          id: row.id,
          userId: Number(row.user_id),
          type: row.type,
          title: row.title,
          category: row.category,
          amountUsdt: parseFloat(row.amount_usdt),
          amountRub: row.amount_rub ? parseFloat(row.amount_rub) : undefined,
          rate: row.rate ? parseFloat(row.rate) : undefined,
          timestamp: row.timestamp_str,
          status: row.status,
          icon: row.icon,
        }));

        return { userId, balanceUsdt, card, transactions };
      } catch (err) {
        console.error('[DB Error] fallback to in-memory:', err);
      }
    }

    // Fallback: in-memory
    if (!walletsStore.has(userId)) {
      walletsStore.set(userId, {
        userId,
        balanceUsdt: 1420.50,
        card: {
          pan: '4242 8491 2049 8831',
          exp: '09/29',
          cvv: '849',
          holder: (initialUsername || 'NOVAPAY CLIENT').toUpperCase(),
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
  public static async processSbpPayment(
    userId: number,
    merchant: string,
    category: string,
    amountRub: number,
    amountUsdt: number,
    rate: number
  ): Promise<{ success: boolean; error?: string; tx?: Transaction; newBalance?: number }> {
    const txId = `tx-${Date.now()}`;
    const timestampStr = 'Только что';

    if (pool) {
      await initDb();
      try {
        const updateRes = await pool.query(
          `UPDATE wallets
           SET balance_usdt = balance_usdt - $1, updated_at = NOW()
           WHERE user_id = $2 AND balance_usdt >= $1
           RETURNING balance_usdt`,
          [amountUsdt, userId]
        );

        if (updateRes.rowCount === 0) {
          return { success: false, error: 'Недостаточно средств на балансе USDT' };
        }

        const newBalance = parseFloat(updateRes.rows[0].balance_usdt);

        await pool.query(
          `INSERT INTO transactions (id, user_id, type, title, category, amount_usdt, amount_rub, rate, status, icon, timestamp_str)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [txId, userId, 'sbp', merchant, category, amountUsdt, amountRub, rate, 'completed', '🛍️', timestampStr]
        );

        const newTx: Transaction = {
          id: txId,
          userId,
          type: 'sbp',
          title: merchant,
          category,
          amountRub,
          amountUsdt,
          rate,
          timestamp: timestampStr,
          status: 'completed',
          icon: '🛍️',
        };

        return { success: true, tx: newTx, newBalance };
      } catch (err) {
        console.error('[DB Error in processSbpPayment]:', err);
      }
    }

    // In-memory fallback
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balanceUsdt < amountUsdt) {
      return { success: false, error: 'Недостаточно средств на балансе USDT' };
    }

    wallet.balanceUsdt = parseFloat((wallet.balanceUsdt - amountUsdt).toFixed(2));
    const newTx: Transaction = {
      id: txId,
      userId,
      type: 'sbp',
      title: merchant,
      category,
      amountRub,
      amountUsdt,
      rate,
      timestamp: timestampStr,
      status: 'completed',
      icon: '🛍️',
    };

    wallet.transactions.unshift(newTx);
    return { success: true, tx: newTx, newBalance: wallet.balanceUsdt };
  }

  /**
   * Пополнение баланса (USDT)
   */
  public static async processDeposit(userId: number, amountUsdt: number): Promise<{ tx: Transaction; newBalance: number }> {
    const txId = `tx-${Date.now()}`;
    const timestampStr = 'Только что';

    // Гарантируем, что кошелек и пользователь созданы в БД
    await this.getOrCreateWallet(userId);

    if (pool) {
      await initDb();
      try {
        const updateRes = await pool.query(
          `UPDATE wallets
           SET balance_usdt = balance_usdt + $1, updated_at = NOW()
           WHERE user_id = $2
           RETURNING balance_usdt`,
          [amountUsdt, userId]
        );

        const newBalance = updateRes.rows[0] ? parseFloat(updateRes.rows[0].balance_usdt) : 1420.50 + amountUsdt;

        await pool.query(
          `INSERT INTO transactions (id, user_id, type, title, category, amount_usdt, status, icon, timestamp_str)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [txId, userId, 'deposit', 'Пополнение USDT (TON)', 'Криптовалюта', amountUsdt, 'completed', '💎', timestampStr]
        );

        return {
          tx: {
            id: txId,
            userId,
            type: 'deposit',
            title: 'Пополнение USDT (TON)',
            category: 'Криптовалюта',
            amountUsdt,
            timestamp: timestampStr,
            status: 'completed',
            icon: '💎',
          },
          newBalance,
        };
      } catch (err) {
        console.error('[DB Error in processDeposit]:', err);
      }
    }

    const wallet = await this.getOrCreateWallet(userId);
    wallet.balanceUsdt = parseFloat((wallet.balanceUsdt + amountUsdt).toFixed(2));

    const newTx: Transaction = {
      id: txId,
      userId,
      type: 'deposit',
      title: 'Пополнение USDT (TON)',
      category: 'Криптовалюта',
      amountUsdt,
      timestamp: timestampStr,
      status: 'completed',
      icon: '💎',
    };

    wallet.transactions.unshift(newTx);
    return { tx: newTx, newBalance: wallet.balanceUsdt };
  }

  /**
   * Перевод средств
   */
  public static async processTransfer(
    userId: number,
    recipient: string,
    method: string,
    amountUsdt: number,
    rate: number
  ): Promise<{ success: boolean; error?: string; tx?: Transaction; newBalance?: number }> {
    const txId = `tx-${Date.now()}`;
    const timestampStr = 'Только что';
    const amountRub = method === 'sbp' ? parseFloat((amountUsdt * rate).toFixed(0)) : undefined;

    const methodTitle =
      method === 'telegram'
        ? `Перевод в Telegram (${recipient})`
        : method === 'crypto'
        ? `Перевод на кошелек (${recipient.slice(0, 6)}...)`
        : `Вывод на карту СБП (${recipient})`;

    // Гарантируем, что кошелек и пользователь созданы в БД с начальным балансом
    const currentWallet = await this.getOrCreateWallet(userId);

    if (pool) {
      await initDb();
      try {
        const updateRes = await pool.query(
          `UPDATE wallets
           SET balance_usdt = balance_usdt - $1, updated_at = NOW()
           WHERE user_id = $2 AND balance_usdt >= $1
           RETURNING balance_usdt`,
          [amountUsdt, userId]
        );

        if (updateRes.rowCount === 0) {
          // Если не хватило баланса в строке БД, синхронизируем с currentWallet
          if (currentWallet.balanceUsdt >= amountUsdt) {
            await pool.query(
              `UPDATE wallets SET balance_usdt = $1 WHERE user_id = $2`,
              [currentWallet.balanceUsdt - amountUsdt, userId]
            );
          } else {
            return { success: false, error: 'Недостаточно средств для перевода' };
          }
        }

        const newBalance = updateRes.rows[0] ? parseFloat(updateRes.rows[0].balance_usdt) : currentWallet.balanceUsdt - amountUsdt;

        await pool.query(
          `INSERT INTO transactions (id, user_id, type, title, category, amount_usdt, amount_rub, status, icon, timestamp_str)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [txId, userId, 'withdraw', methodTitle, 'Переводы', amountUsdt, amountRub, 'completed', '📤', timestampStr]
        );

        const newTx: Transaction = {
          id: txId,
          userId,
          type: 'withdraw',
          title: methodTitle,
          category: 'Переводы',
          amountUsdt,
          amountRub,
          timestamp: timestampStr,
          status: 'completed',
          icon: '📤',
        };

        return { success: true, tx: newTx, newBalance };
      } catch (err) {
        console.error('[DB Error in processTransfer]:', err);
      }
    }

    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balanceUsdt < amountUsdt) {
      return { success: false, error: 'Недостаточно средств для перевода' };
    }

    wallet.balanceUsdt = parseFloat((wallet.balanceUsdt - amountUsdt).toFixed(2));
    const newTx: Transaction = {
      id: txId,
      userId,
      type: 'withdraw',
      title: methodTitle,
      category: 'Переводы',
      amountUsdt,
      amountRub,
      timestamp: timestampStr,
      status: 'completed',
      icon: '📤',
    };

    wallet.transactions.unshift(newTx);
    return { success: true, tx: newTx, newBalance: wallet.balanceUsdt };
  }

  /**
   * Заморозка / разморозка карты Visa
   */
  public static async toggleCardFreeze(userId: number): Promise<boolean> {
    if (pool) {
      await initDb();
      try {
        const res = await pool.query(
          'UPDATE cards SET is_frozen = NOT is_frozen WHERE user_id = $1 RETURNING is_frozen',
          [userId]
        );
        if (res.rowCount && res.rowCount > 0) {
          return Boolean(res.rows[0].is_frozen);
        }
      } catch (err) {
        console.error('[DB Error in toggleCardFreeze]:', err);
      }
    }

    const wallet = await this.getOrCreateWallet(userId);
    wallet.card.isFrozen = !wallet.card.isFrozen;
    return wallet.card.isFrozen;
  }
}
