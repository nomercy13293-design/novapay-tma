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
};
