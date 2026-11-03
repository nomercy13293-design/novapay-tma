import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, QrCode, ShieldCheck, CreditCard, Sparkles, Trash2, BellOff } from 'lucide-react';

export interface NotificationItem {
  id: string;
  category: 'payment' | 'security' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  icon: 'payment' | 'security' | 'crypto' | 'card';
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'payment',
    title: 'Оплата по СБП прошла успешно',
    description: 'ВкусВилл: списано 15.91 USDT (1 480 ₽). Чек подтвержден банком.',
    timestamp: '15 мин назад',
    isUnread: true,
    icon: 'payment',
  },
  {
    id: 'notif-2',
    category: 'security',
    title: 'Код подтверждения 3D Secure',
    description: 'Код для оплаты в Steam Games ($14.50): 849-102. Никому не сообщайте.',
    timestamp: '2 часа назад',
    isUnread: true,
    icon: 'security',
  },
  {
    id: 'notif-3',
    category: 'payment',
    title: 'Депозит USDT подтвержден',
    description: '+500.00 USDT в сети TON успешно зачислены на ваш баланс счета.',
    timestamp: 'Вчера, 14:10',
    isUnread: false,
    icon: 'crypto',
  },
  {
    id: 'notif-4',
    category: 'security',
    title: 'Вход в Telegram Mini App',
    description: 'Безопасная авторизация через Telegram WebApp подтверждена.',
    timestamp: 'Сегодня, 11:20',
    isUnread: false,
    icon: 'security',
  },
  {
    id: 'notif-5',
    category: 'system',
    title: 'Лимиты карты Visa обновлены',
    description: 'Месячный лимит международных покупок повышен до $10,000 USDT.',
    timestamp: '28 Окт, 18:30',
    isUnread: false,
    icon: 'card',
  },
];

interface NotificationsModalProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onToggleRead?: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
  onDeleteNotification,
  onToggleRead,
}) => {
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const handleMarkAllRead = () => {
    onMarkAllRead();
  };

  const handleDelete = (id: string) => {
    onDeleteNotification(id);
  };

  const getIcon = (type: NotificationItem['icon']) => {
    switch (type) {
      case 'payment':
        return <QrCode className="w-4 h-4 text-emerald-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-sky-400" />;
      case 'crypto':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container with FIXED stable height (no height shrinkage or jumps) */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10 h-[72vh] max-h-[620px] min-h-[460px] flex flex-col"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Уведомления</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold">
                        {unreadCount} новых
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">События, безопасность и чеки</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    title="Прочитать все"
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Items List - Constant container height, smooth layout */}
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3 border border-slate-700/60">
                      <BellOff className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mb-1">Нет новых уведомлений</div>
                    <p className="text-[11px] text-slate-500">Все события и чеки будут отображаться здесь</p>
                  </motion.div>
                ) : (
                  notifications.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      onClick={() => onToggleRead?.(item.id)}
                      className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 group relative cursor-pointer ${
                        item.isUnread
                          ? 'bg-slate-800/80 border-emerald-500/30 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getIcon(item.icon)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-bold text-white truncate">
                            {item.title}
                          </span>
                          {item.isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                          {item.timestamp}
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Удалить"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-all absolute top-2 right-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
