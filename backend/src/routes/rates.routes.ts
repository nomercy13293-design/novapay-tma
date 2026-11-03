import type { FastifyPluginAsync } from 'fastify';
import { RatesService } from '../services/rates.js';

export const ratesRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Получение актуальных курсов валют из блокчейна TON (TonAPI)
   */
  fastify.get('/', async (_request, reply) => {
    const rates = await RatesService.getLiveRates();
    return reply.send(rates);
  });

  /**
   * Получение реальных свечных данных и графика для выбранного инструмента
   */
  fastify.get('/chart', async (request, reply) => {
    const query = request.query as { symbol?: string; timeframe?: string };
    const symbol = query.symbol || 'USDT/RUB';
    const timeframe = query.timeframe || '1D';

    const chart = await RatesService.getRealChart(symbol, timeframe);
    return reply.send({ ok: true, chart });
  });
};
