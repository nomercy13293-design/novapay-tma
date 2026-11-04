import { config } from '../config/env.js';

export interface SbpReceiptPayload {
  chatId: number | string;
  merchant: string;
  amountRub: number;
  amountUsdt: number;
  rate: number;
  txId: string;
}

export interface TransferNoticePayload {
  chatId: number | string;
  amountUsdt: number;
  recipient: string;
  method: string;
  txId: string;
}

export interface DepositNoticePayload {
  chatId: number | string;
  amountUsdt: number;
  newBalance: number;
  network?: string;
  txId: string;
}

export interface SecurityCodePayload {
  chatId: number | string;
  code: string;
  amountUsd: number;
  merchant: string;
}

export interface TwoFactorOtpPayload {
  chatId: number | string;
  code: string;
  action: string;
  amountUsdt: number;
  recipient: string;
  method?: string;
  expiresInMinutes?: number;
}

export class TelegramService {
  public static async makeRequest(method: string, body: Record<string, any>): Promise<any> {
    if (!config.botToken || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
      console.log(`[Simulated Telegram Bot] ${method}:`, JSON.stringify(body, null, 2));
      return { ok: true, simulated: true };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as any;
      if (!data.ok) {
        console.error(`[Telegram API Error] ${method}:`, data.description);
      }
      return data;
    } catch (err) {
      console.error(`[Telegram Network Error] ${method}:`, err);
      return { ok: false, error: err };
    }
  }

  /**
   * Отправка произвольного сообщения в чат с поддержкой разметки и кнопок
   */
  public static async sendMessage(chatId: number | string, text: string, replyMarkup?: any): Promise<any> {
    return this.makeRequest('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
      disable_web_page_preview: true,
    });
  }

  /**
   * Подтверждение нажатия inline-кнопки (callback query)
   */
  public static async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<any> {
    return this.makeRequest('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  /**
   * Получение информации о боте
   */
  public static async getMe(): Promise<any> {
    return this.makeRequest('getMe', {});
  }

  /**
   * Получение текущего статуса вебхука
   */
  public static async getWebhookInfo(): Promise<any> {
    return this.makeRequest('getWebhookInfo', {});
  }

  /**
   * Установка Webhook для приема входящих обновлений
   */
  public static async setWebhook(url: string): Promise<any> {
    return this.makeRequest('setWebhook', {
      url,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    });
  }

  /**
   * Регистрация меню команд бота в Telegram
   */
  public static async setMyCommands(
    commands?: Array<{ command: string; description: string }>
  ): Promise<any> {
    const defaultCommands = [
      { command: 'start', description: '🚀 Главное меню и запуск NovaPay' },
      { command: 'card', description: '💳 Виртуальная карта Visa Platinum' },
      { command: 'sbp', description: '⚡ Оплата по QR-кодам СБП в РФ' },
      { command: 'help', description: 'ℹ️ Справка, FAQ и поддержка' },
    ];

    return this.makeRequest('setMyCommands', {
      commands: commands || defaultCommands,
    });
  }

  /**
   * Установка постоянной кнопки «Открыть NovaPay» в левом нижнем углу чата (Chat Menu Button)
   */
  public static async setChatMenuButton(webAppUrl?: string): Promise<any> {
    const url = webAppUrl || config.appUrl;
    return this.makeRequest('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🚀 Открыть NovaPay',
        web_app: {
          url,
        },
      },
    });
  }

  /**
   * Установка описания бота перед нажатием кнопки Старт
   */
  public static async setMyDescription(): Promise<any> {
    const description = [
      '⚡ NovaPay — твой персональный криптонеобанк прямо в Telegram.',
      '',
      '💳 Виртуальная карта Visa Platinum (Apple Pay / Google Pay)',
      '⚡ Оплата в магазинах РФ по QR-кодам СБП напрямую с баланса USDT',
      '💎 TON Connect и мультивалютный кошелек без блокировок 115-ФЗ',
      '',
      'Нажмите кнопку «Старт» ниже, чтобы открыть приложение!',
    ].join('\n');

    const shortDescription = 'Криптобанк в Telegram: карта Visa Platinum, оплата СБП в РФ с USDT и TON Connect.';

    const descRes = await this.makeRequest('setMyDescription', { description });
    const shortDescRes = await this.makeRequest('setMyShortDescription', { short_description: shortDescription });

    return { descRes, shortDescRes };
  }

  /**
   * Комплексная настройка бота: Webhook + Команды + Меню-кнопка + Описание
   */
  public static async setupWebhookAndCommands(webhookUrl?: string): Promise<any> {
    const targetWebhookUrl = webhookUrl || `${config.appUrl}/api/telegram/webhook`;
    console.log(`[Telegram Setup] Setting webhook to ${targetWebhookUrl}...`);

    const webhookRes = await this.setWebhook(targetWebhookUrl);
    const commandsRes = await this.setMyCommands();
    const menuBtnRes = await this.setChatMenuButton();
    const descRes = await this.setMyDescription();
    const botInfo = await this.getMe();

    return {
      success: webhookRes.ok,
      bot: botInfo.result,
      webhook: webhookRes,
      commands: commandsRes,
      menuButton: menuBtnRes,
      descriptions: descRes,
      webhookUrl: targetWebhookUrl,
    };
  }

  /**
   * Обработка входящего события от Telegram Webhook
   */
  public static async handleWebhookUpdate(update: any): Promise<void> {
    if (!update) return;

    const appUrl = config.appUrl;

    // 1. Обработка входящего сообщения
    if (update.message && update.message.text) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text.trim();
      const firstName = message.from?.first_name || 'клиент';

      if (text.startsWith('/start')) {
        await this.sendWelcomeMessage(chatId, firstName, appUrl);
        return;
      }

      if (text.startsWith('/card')) {
        await this.sendCardMessage(chatId, appUrl);
        return;
      }

      if (text.startsWith('/sbp')) {
        await this.sendSbpMessage(chatId, appUrl);
        return;
      }

      if (text.startsWith('/help')) {
        await this.sendHelpMessage(chatId, appUrl);
        return;
      }

      // Неизвестная команда / произвольный текст
      await this.sendDefaultMessage(chatId, appUrl);
      return;
    }

    // 2. Обработка нажатий на инлайн-кнопки (callback_query)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;

      await this.answerCallbackQuery(cb.id);

      if (!chatId) return;

      if (data === 'cmd_card') {
        await this.sendCardMessage(chatId, appUrl);
      } else if (data === 'cmd_sbp') {
        await this.sendSbpMessage(chatId, appUrl);
      } else if (data === 'cmd_help') {
        await this.sendHelpMessage(chatId, appUrl);
      }
    }
  }

  private static async sendWelcomeMessage(chatId: number | string, firstName: string, appUrl: string): Promise<void> {
    const text = [
      `👋 <b>Привет, ${firstName}! Добро пожаловать в NovaPay.</b>`,
      ``,
      `NovaPay — это твой персональный криптобанк нового поколения прямо в Telegram:`,
      ``,
      `💳 <b>Виртуальная карта Visa Platinum</b>`,
      `Мгновенный выпуск для Apple Pay и Google Pay. Оплачивайте любые зарубежные подписки, сервисы и покупки по всему миру (лимит до $10 000 в месяц).`,
      ``,
      `⚡ <b>Мгновенные платежи по СБП в РФ</b>`,
      `Сканируйте QR-коды СБП в любых магазинах России (кафе, супермаркеты, заправки). Оплата списывается напрямую с вашего USDT-баланса без риска 115-ФЗ!`,
      ``,
      `💎 <b>Мультивалютный кошелек</b>`,
      `Пополнение через TON Connect, USDT (TRC-20, TON) и мгновенный обмен по честному биржевому курсу.`,
      ``,
      `👇 <b>Нажмите кнопку ниже, чтобы открыть приложение:</b>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть NovaPay',
            web_app: { url: appUrl },
          },
        ],
        [
          { text: '💳 О карте Visa', callback_data: 'cmd_card' },
          { text: '⚡ Оплата по СБП', callback_data: 'cmd_sbp' },
        ],
        [
          { text: 'ℹ️ Справка и FAQ', callback_data: 'cmd_help' },
          { text: '💬 Поддержка', url: 'https://t.me/novapay_crypto_bot' },
        ],
      ],
    };

    await this.sendMessage(chatId, text, replyMarkup);
  }

  private static async sendCardMessage(chatId: number | string, appUrl: string): Promise<void> {
    const text = [
      `💳 <b>Виртуальная карта NovaPay Visa Platinum</b>`,
      ``,
      `Премиальная цифровая карта для безопасных покупок по всему миру:`,
      ``,
      `• <b>Лимит расходов:</b> до $10 000 в месяц`,
      `• <b>Бесконтактная оплата:</b> мгновенное добавление в Apple Pay и Google Pay`,
      `• <b>Принимается везде:</b> Booking, Airbnb, App Store, Google Play, ChatGPT, Spotify, Steam, зарубежные отели и рестораны`,
      `• <b>Безопасность:</b> одноразовые 3D Secure коды подтверждения приходят прямо в этот чат`,
      `• <b>Выпуск:</b> за 1 минуту прямо в приложении, без визитов в банк`,
      ``,
      `👉 <b>Нажмите ниже, чтобы выпустить или открыть карту:</b>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть карту в NovaPay',
            web_app: { url: appUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, text, replyMarkup);
  }

  private static async sendSbpMessage(chatId: number | string, appUrl: string): Promise<void> {
    const text = [
      `⚡ <b>Оплата по СБП в России с криптовалютного баланса</b>`,
      ``,
      `Платите в любых магазинах, кафе, ресторанах и АЗС России прямо со своего криптобаланса без P2P-обменников и риска блокировок по 115-ФЗ!`,
      ``,
      `<b>Как совершить покупку:</b>`,
      `1️⃣ Откройте NovaPay и перейдите во вкладку <b>«СБП»</b>`,
      `2️⃣ Наведите камеру на QR-код СБП (НСПК) на кассе или экране терминала`,
      `3️⃣ Подтвердите сумму платежа`,
      `4️⃣ NovaPay мгновенно переводит рубли магазину, а с вашего баланса списывается эквивалент в USDT по биржевому курсу.`,
      ``,
      `🧾 <i>Фискальный чек транзакции сразу же придет вам в этот чат!</i>`,
      ``,
      `👉 <b>Запустите сканер СБП в приложении:</b>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть сканер СБП',
            web_app: { url: appUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, text, replyMarkup);
  }

  private static async sendHelpMessage(chatId: number | string, appUrl: string): Promise<void> {
    const text = [
      `ℹ️ <b>Центр помощи и тарифы NovaPay</b>`,
      ``,
      `<b>Часто задаваемые вопросы:</b>`,
      ``,
      `❓ <b>Как пополнить баланс?</b>`,
      `В приложении нажмите кнопку «Пополнить». Вы можете мгновенно подключить свой кошелек через <b>TON Connect</b> (Tonkeeper, MyTonWallet) или отправить USDT по сети TON / TRC-20.`,
      ``,
      `❓ <b>Какие комиссии?</b>`,
      `• Выпуск и обслуживание виртуальной карты: <b>0 $</b>`,
      `• Переводы внутри экосистемы NovaPay: <b>0%</b>`,
      `• Оплата СБП в рублях: прозрачный курс конвертации со спредом от 1.5% без скрытых комиссий.`,
      ``,
      `❓ <b>Это безопасно и легально?</b>`,
      `Да, операции проводятся через лицензированные финансовые шлюзы в строгом соответствии со ст. 14 Федерального закона 259-ФЗ.`,
      ``,
      `📞 <b>Служба поддержки:</b> @novapay_support`,
      ``,
      `👉 <b>Нажмите ниже для входа в приложение:</b>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть NovaPay',
            web_app: { url: appUrl },
          },
        ],
        [
          {
            text: '💬 Написать в поддержку',
            url: 'https://t.me/novapay_crypto_bot',
          },
        ],
      ],
    };

    await this.sendMessage(chatId, text, replyMarkup);
  }

  private static async sendDefaultMessage(chatId: number | string, appUrl: string): Promise<void> {
    const text = [
      `🤖 <b>Ассистент NovaPay на связи!</b>`,
      ``,
      `Используйте команды в меню (кнопка слева внизу) или нажмите кнопку ниже, чтобы запустить приложение NovaPay:`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть NovaPay',
            web_app: { url: appUrl },
          },
        ],
        [
          { text: '💳 О карте Visa', callback_data: 'cmd_card' },
          { text: '⚡ Оплата СБП', callback_data: 'cmd_sbp' },
        ],
        [
          { text: 'ℹ️ Справка и FAQ', callback_data: 'cmd_help' },
        ],
      ],
    };

    await this.sendMessage(chatId, text, replyMarkup);
  }

  /**
   * Отправка мгновенного фискального чека после оплаты СБП
   */
  public static async sendSbpReceipt(payload: SbpReceiptPayload): Promise<boolean> {
    const text = [
      `🛍️ <b>Успешная оплата по СБП (НСПК)</b>`,
      ``,
      `🏪 <b>Магазин:</b> ${payload.merchant}`,
      `💵 <b>Сумма в чеке:</b> ${payload.amountRub.toLocaleString('ru-RU')} ₽`,
      `₮ <b>Списано с баланса:</b> ${payload.amountUsdt.toFixed(2)} USDT`,
      `📊 <b>Курс обмена:</b> 1 USDT = ${payload.rate.toFixed(2)} ₽`,
      `🧾 <b>ID транзакции:</b> <code>${payload.txId}</code>`,
      ``,
      `⚡ <i>Оплата проведена мгновенно через шлюз NovaPay.</i>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть NovaPay',
            web_app: { url: config.appUrl },
          },
        ],
      ],
    };

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    return res.ok;
  }

  /**
   * Уведомление о переводе средств
   */
  public static async sendTransferNotice(payload: TransferNoticePayload): Promise<boolean> {
    const text = [
      `📤 <b>Перевод средств выполнен</b>`,
      ``,
      `💰 <b>Сумма:</b> ${payload.amountUsdt.toFixed(2)} USDT`,
      `👤 <b>Получатель:</b> <code>${payload.recipient}</code>`,
      `⚙️ <b>Метод:</b> ${payload.method}`,
      `🧾 <b>ID:</b> <code>${payload.txId}</code>`,
      ``,
      `✅ <i>Средства успешно отправлены с вашего счета NovaPay.</i>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть NovaPay',
            web_app: { url: config.appUrl },
          },
        ],
      ],
    };

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    return res.ok;
  }

  /**
   * Уведомление о пополнении баланса
   */
  public static async sendDepositNotice(payload: DepositNoticePayload): Promise<boolean> {
    const text = [
      `💎 <b>Пополнение счета подтверждено!</b>`,
      ``,
      `💰 <b>Сумма:</b> +${payload.amountUsdt.toFixed(2)} USDT`,
      `🌐 <b>Сеть:</b> ${payload.network || 'TON (The Open Network)'}`,
      `💳 <b>Новый баланс:</b> $${payload.newBalance.toFixed(2)} USDT`,
      `🧾 <b>ID транзакции:</b> <code>${payload.txId}</code>`,
      ``,
      `<i>Средства успешно зачислены и готовы для покупок Visa и СБП.</i>`,
    ].join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть NovaPay',
            web_app: { url: config.appUrl },
          },
        ],
      ],
    };

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    return res.ok;
  }

  /**
   * Одноразовый 3D Secure код для оплаты картой Visa
   */
  public static async sendSecurityCode(payload: SecurityCodePayload): Promise<boolean> {
    const text = [
      `🛡️ <b>Одноразовый код 3D Secure (Visa)</b>`,
      ``,
      `Покупка в: <b>${payload.merchant}</b>`,
      `Сумма: <b>$${payload.amountUsd.toFixed(2)}</b>`,
      ``,
      `Ваш код подтверждения: <code>${payload.code}</code>`,
      ``,
      `⚠️ <i>Никому не сообщайте этот код, даже сотрудникам банка.</i>`,
    ].join('\n');

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
    });

    return res.ok;
  }

  /**
   * Одноразовый код 2FA для подтверждения переводов и критических операций
   */
  public static async sendTwoFactorCode(payload: TwoFactorOtpPayload): Promise<boolean> {
    const methodDesc =
      payload.method === 'sbp'
        ? 'Вывод на карту СБП РФ'
        : payload.method === 'crypto'
        ? 'Перевод в блокчейн-сеть'
        : 'Внутренний перевод NovaPay';

    const text = [
      `🔐 <b>Подтверждение операции (2FA)</b>`,
      ``,
      `Вы запросили отправку средств со счёта:`,
      `💰 <b>Сумма:</b> ${payload.amountUsdt.toFixed(2)} USDT`,
      `👤 <b>Получатель:</b> <code>${payload.recipient}</code>`,
      `⚙️ <b>Тип:</b> ${methodDesc}`,
      ``,
      `Ваш 6-значный код безопасности:`,
      `🔑 <code>${payload.code}</code>`,
      ``,
      `⏱ <i>Код действителен ${payload.expiresInMinutes || 3} мин. Нажмите на код, чтобы скопировать.</i>`,
      `⚠️ <b>Никому не сообщайте данный код!</b> Сотрудники поддержки NovaPay никогда не запрашивают код из сообщений.`,
    ].join('\n');

    const res = await this.makeRequest('sendMessage', {
      chat_id: payload.chatId,
      text,
      parse_mode: 'HTML',
    });

    return res.ok;
  }
}
