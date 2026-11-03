import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  initialTransactions,
  getInitialTelegramUser,
  getInitialCard,
  transliterateToLatin,
  getFallbackAvatar,
} from './data/mockData';
import type { Transaction, UserProfile, CardInfo } from './types';
import { Header } from './components/Header';
import { BottomNav, type TabType } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { CardsView } from './views/CardsView';
import { SbpView } from './views/SbpView';
import { RatesView } from './views/RatesView';
import { ProfileView } from './views/ProfileView';
import { SbpScannerModal } from './components/SbpScannerModal';
import { DepositModal } from './components/DepositModal';
import { TransferModal } from './components/TransferModal';
import {
  NotificationsModal,
  INITIAL_NOTIFICATIONS,
  type NotificationItem,
} from './components/NotificationsModal';
import { KycModal } from './components/KycModal';
import { TelegramNotification } from './components/TelegramNotification';
import { ApiClient, type LiveRates } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [user, setUser] = useState<UserProfile>(() => getInitialTelegramUser());
  const [card, setCard] = useState<CardInfo>(() => getInitialCard(getInitialTelegramUser()));
  const [balanceUsdt, setBalanceUsdt] = useState<number>(1420.50);
  const [rate, setRate] = useState<number>(93.00);
  const [liveRates, setLiveRates] = useState<LiveRates | null>(null);
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // Modals state
  const [isSbpOpen, setIsSbpOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);

  // Persistent notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('novapay_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const unreadNotificationsCount = notifications.filter((n) => n.isUnread).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isUnread: false }));
      try {
        localStorage.setItem('novapay_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem('novapay_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isUnread: !n.isUnread } : n));
      try {
        localStorage.setItem('novapay_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Telegram bot notification toast
  const [notification, setNotification] = useState<string | null>(null);

  // Получение актуальных курсов валют из блокчейна TON
  const refreshRates = async () => {
    setIsRatesLoading(true);
    try {
      const data = await ApiClient.getRates();
      if (data && data.ok) {
        setLiveRates(data);
        if (data.usdtRub) {
          setRate(data.usdtRub);
        }
      }
    } finally {
      setIsRatesLoading(false);
    }
  };

  // Telegram Web App auto-expand & auth & live rates
  useEffect(() => {
    refreshRates();
    const ratesTimer = setInterval(refreshRates, 45000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Немедленное синхронное применение профиля из Telegram
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Пользователь';
        const username = u.username ? `@${u.username}` : `@id${u.id}`;
        const avatar = u.photo_url || getFallbackAvatar(name);

        setUser((prev) => {
          const updated: UserProfile = {
            ...prev,
            name,
            username,
            avatar: u.photo_url || prev.avatar || avatar,
          };
          try {
            localStorage.setItem('novapay_user', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        setCard((prev) => ({
          ...prev,
          cardholder: transliterateToLatin(name) || prev.cardholder,
        }));
      }

      // Авторизация и подгрузка кошелька с бэкенда
      if (tg.initData) {
        ApiClient.authTelegram(tg.initData).then((res) => {
          if (res?.ok && res.user) {
            const u = res.user;
            const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Пользователь';
            const username = u.username ? `@${u.username}` : `@id${u.id}`;

            setUser((prev) => {
              const updated: UserProfile = {
                ...prev,
                name: name || prev.name,
                username: username || prev.username,
                avatar: u.photo_url || prev.avatar,
              };
              try {
                localStorage.setItem('novapay_user', JSON.stringify(updated));
              } catch {}
              return updated;
            });

            setCard((prev) => ({
              ...prev,
              cardholder: transliterateToLatin(name) || prev.cardholder,
            }));

            if (res.wallet?.balance_usdt !== undefined) {
              setBalanceUsdt(parseFloat(res.wallet.balance_usdt));
            }
          }
        });
      }
    }

    return () => {
      clearInterval(ratesTimer);
    };
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // SBP payment completed
  const handleSbpSuccess = (
    merchant: string,
    category: string,
    amountRub: number,
    amountUsdt: number
  ) => {
    const newBalance = parseFloat((balanceUsdt - amountUsdt).toFixed(2));
    setBalanceUsdt(newBalance);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = tgUser?.id || 1001;

    // Вызываем бэкенд для создания чека в Telegram
    ApiClient.paySbp({
      userId,
      merchant,
      category,
      amountRub,
      amountUsdt,
      rate,
    });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
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

    setTransactions([newTx, ...transactions]);

    showNotification(
      `✅ Оплата ${amountRub.toLocaleString('ru-RU')} ₽ в «${merchant}» проведена! Списано ${amountUsdt} USDT. Баланс: $${newBalance} USDT`
    );
  };

  // Deposit completed
  const handleSimulateDeposit = (amount: number) => {
    const newBalance = parseFloat((balanceUsdt + amount).toFixed(2));
    setBalanceUsdt(newBalance);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      title: 'Пополнение USDT (TON)',
      category: 'Криптовалюта',
      amountUsdt: amount,
      timestamp: 'Только что',
      status: 'completed',
      icon: '💎',
    };

    setTransactions([newTx, ...transactions]);

    showNotification(
      `📥 Пополнение счета на +${amount} USDT зачислено! Новый баланс: $${newBalance} USDT`
    );
  };

  // Transfer completed
  const handleTransferSuccess = (recipient: string, method: string, amountUsdt: number) => {
    const newBalance = parseFloat((balanceUsdt - amountUsdt).toFixed(2));
    setBalanceUsdt(newBalance);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = tgUser?.id || 1001;

    // Вызываем бэкенд для отправки уведомления в Telegram
    ApiClient.transfer({
      userId,
      recipient,
      method,
      amountUsdt,
      rate,
    });

    const methodTitle =
      method === 'telegram'
        ? `Перевод в Telegram (${recipient})`
        : method === 'crypto'
        ? `Перевод на кошелек (${recipient.slice(0, 6)}...)`
        : `Вывод на карту СБП (${recipient})`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdraw',
      title: methodTitle,
      category: 'Переводы',
      amountUsdt,
      amountRub: method === 'sbp' ? parseFloat((amountUsdt * rate).toFixed(0)) : undefined,
      timestamp: 'Только что',
      status: 'completed',
      icon: '📤',
    };

    setTransactions([newTx, ...transactions]);

    showNotification(
      `📤 Перевод на $${amountUsdt.toFixed(2)} USDT отправлен (${recipient})! Новый баланс: $${newBalance} USDT`
    );
  };

  // Freeze/unfreeze card
  const handleToggleFreeze = () => {
    const nextState = !card.isFrozen;
    setCard({ ...card, isFrozen: nextState });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = tgUser?.id || 1001;
    ApiClient.toggleCardFreeze(userId);

    showNotification(
      nextState
        ? '🔒 Карта Visa временно заморожена. Онлайн-списания заблокированы.'
        : '🔓 Карта Visa разморожена и готова к оплате!'
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#080a0f] text-slate-100 flex flex-col relative selection:bg-emerald-500 selection:text-black">
      {/* Bot Notification Banner */}
      <TelegramNotification
        message={notification}
        onDismiss={() => setNotification(null)}
      />

      {/* Clean Header (User on left, Bell on right) */}
      <Header
        user={user}
        hasUnreadNotifications={unreadNotificationsCount > 0}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Tab Views with smooth transitions */}
      <main className="flex-1 overflow-x-hidden pt-1">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeView
              key="home"
              balanceUsdt={balanceUsdt}
              rate={rate}
              transactions={transactions}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenTransfer={() => setIsTransferOpen(true)}
              onOpenSbpScanner={() => setIsSbpOpen(true)}
            />
          )}

          {activeTab === 'cards' && (
            <CardsView
              key="cards"
              card={card}
              transactions={transactions}
              onToggleFreeze={handleToggleFreeze}
            />
          )}

          {activeTab === 'sbp' && (
            <SbpView
              key="sbp"
              rate={rate}
              balanceUsdt={balanceUsdt}
              transactions={transactions}
              onOpenSbpScanner={() => setIsSbpOpen(true)}
            />
          )}

          {activeTab === 'rates' && (
            <RatesView
              key="rates"
              ratesData={liveRates}
              isLoading={isRatesLoading}
              onRefresh={refreshRates}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              key="profile"
              user={user}
              onOpenKyc={() => setIsKycOpen(true)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* SBP Camera Scanner Modal */}
      <SbpScannerModal
        isOpen={isSbpOpen}
        rate={rate}
        balanceUsdt={balanceUsdt}
        onClose={() => setIsSbpOpen(false)}
        onSuccessPayment={handleSbpSuccess}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSimulateDeposit={handleSimulateDeposit}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        balanceUsdt={balanceUsdt}
        rate={rate}
        onClose={() => setIsTransferOpen(false)}
        onSuccessTransfer={handleTransferSuccess}
      />

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
        onToggleRead={handleToggleNotificationRead}
      />

      {/* KYC Modal */}
      <KycModal
        isOpen={isKycOpen}
        user={user}
        onClose={() => setIsKycOpen(false)}
      />
    </div>
  );
}
