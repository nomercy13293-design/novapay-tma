import pg from 'pg';
const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_POSTGRES_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Поддержка SSL для Supabase / Neon / Vercel Postgres
      max: 10,
    })
  : null;

let isInitialized = false;

/**
 * Автоматическая инициализация структуры таблиц PostgreSQL
 */
export async function initDb(): Promise<boolean> {
  if (!pool) {
    console.log('ℹ️ DATABASE_URL не задан. Бэкенд работает в устойчивом in-memory режиме.');
    return false;
  }

  if (isInitialized) return true;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGINT PRIMARY KEY,
          username VARCHAR(255),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          photo_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wallets (
          user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          balance_usdt NUMERIC(18, 2) NOT NULL DEFAULT 1420.50,
          memo VARCHAR(30),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Авто-миграция для существующих баз
        ALTER TABLE wallets ADD COLUMN IF NOT EXISTS memo VARCHAR(30);

        CREATE TABLE IF NOT EXISTS cards (
          user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          pan VARCHAR(30) NOT NULL DEFAULT '4242 8491 2049 8831',
          exp VARCHAR(10) NOT NULL DEFAULT '09/29',
          cvv VARCHAR(10) NOT NULL DEFAULT '849',
          holder VARCHAR(255) NOT NULL DEFAULT 'NOVAPAY CLIENT',
          is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
          monthly_limit_usd NUMERIC(18, 2) NOT NULL DEFAULT 10000,
          spent_this_month_usd NUMERIC(18, 2) NOT NULL DEFAULT 3450
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(100) PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          amount_usdt NUMERIC(18, 2) NOT NULL,
          amount_rub NUMERIC(18, 2),
          rate NUMERIC(10, 2),
          status VARCHAR(50) NOT NULL DEFAULT 'completed',
          icon VARCHAR(20) NOT NULL DEFAULT '🛍️',
          timestamp_str VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS referrals (
          id SERIAL PRIMARY KEY,
          referrer_id BIGINT NOT NULL,
          referee_id BIGINT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS otp_challenges (
          challenge_id VARCHAR(100) PRIMARY KEY,
          user_id BIGINT NOT NULL,
          code VARCHAR(10) NOT NULL,
          action VARCHAR(50) NOT NULL,
          payload JSONB NOT NULL,
          attempts INT NOT NULL DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_tx_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_challenges(user_id);
      `);

      console.log('✅ PostgreSQL таблицы успешно синхронизированы!');
      isInitialized = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Ошибка инициализации PostgreSQL:', err);
    return false;
  }
}
