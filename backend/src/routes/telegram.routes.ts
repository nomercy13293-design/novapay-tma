import type { FastifyPluginAsync } from 'fastify';
import { TelegramService } from '../services/telegram.js';

export const telegramRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Webhook endpoint: принимает события от Telegram (сообщения, команды, клики по кнопкам)
   */
  fastify.post('/webhook', async (request, reply) => {
    const update = request.body as any;

    // Telegram требует быстрый ответ HTTP 200, поэтому логируем и обрабатываем
    try {
      if (update) {
        // Запуск обработки события
        TelegramService.handleWebhookUpdate(update).catch((err) => {
          console.error('[Telegram Webhook Processing Error]:', err);
        });
      }
    } catch (err) {
      console.error('[Telegram Webhook Error]:', err);
    }

    return reply.status(200).send({ ok: true });
  });

  /**
   * Настройка бота: регистрация webhook, списка команд в меню, описания и кнопки открытия приложения
   */
  fastify.get('/setup', async (request, reply) => {
    const query = request.query as { url?: string };
    const setupResult = await TelegramService.setupWebhookAndCommands(query?.url);
    return reply.send(setupResult);
  });

  fastify.post('/setup', async (request, reply) => {
    const body = (request.body as { url?: string }) || {};
    const setupResult = await TelegramService.setupWebhookAndCommands(body.url);
    return reply.send(setupResult);
  });

  /**
   * Проверка статуса вебхука и данных бота
   */
  fastify.get('/info', async (_request, reply) => {
    const bot = await TelegramService.getMe();
    const webhook = await TelegramService.getWebhookInfo();
    return reply.send({
      ok: true,
      bot: bot.result || bot,
      webhook: webhook.result || webhook,
    });
  });
};
