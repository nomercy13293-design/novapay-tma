import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  botToken: process.env.BOT_TOKEN || '',
  corsOrigins: (process.env.CORS_ORIGIN || 'https://novapay-tma.vercel.app,http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
  usdtRubRate: parseFloat(process.env.USDT_RUB_RATE || '93.00'),
  sbpSpreadPercent: parseFloat(process.env.SBP_SPREAD_PERCENT || '1.5'),
};

if (!config.botToken || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  console.warn(
    '⚠️ ВНИМАНИЕ: BOT_TOKEN не заполнен в backend/.env. Уведомления в Telegram будут работать в симуляционном режиме.'
  );
}
