import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AtSign, Wallet, Phone, Check, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransferModalProps {
  isOpen: boolean;
  balanceUsdt: number;
  rate: number;
  onClose: () => void;
  onSuccessTransfer: (recipient: string, method: string, amountUsdt: number) => void;
}

type TransferMethod = 'telegram' | 'crypto' | 'sbp';

const RECENT_CONTACTS = [
  { name: 'Михаил Ковалев', handle: '@mikhail_k', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
  { name: 'Анна Смирнова', handle: '@anna_sm', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' },
  { name: 'Артем Дронов', handle: '@artem_dev', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
];

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  balanceUsdt,
  rate,
  onClose,
  onSuccessTransfer,
}) => {
  const [method, setMethod] = useState<TransferMethod>('telegram');
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isSufficient = numAmount > 0 && numAmount <= balanceUsdt;
  const rubEquivalent = (numAmount * rate).toFixed(0);

  const methodTabs = [
    { id: 'telegram' as TransferMethod, label: 'В Telegram', icon: AtSign },
    { id: 'crypto' as TransferMethod, label: 'Крипта', icon: Wallet },
    { id: 'sbp' as TransferMethod, label: 'Карта РФ', icon: Phone },
  ];

  // Quick percent fill
  const handleQuickPercent = (pct: number) => {
    const calculated = (balanceUsdt * (pct / 100)).toFixed(2);
    setAmount(calculated);
  };

  const handleSend = () => {
    if (!recipient || !isSufficient) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (e) {
        console.error(e);
      }

      onSuccessTransfer(recipient, method, numAmount);

      setTimeout(() => {
        setIsSuccess(false);
        setRecipient('');
        setAmount('');
        onClose();
      }, 1800);
    }, 1200);
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

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

            {isSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 animate-bounce">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Перевод отправлен!</h3>
                <p className="text-sm text-slate-300">
                  ${numAmount.toFixed(2)} USDT отправлено получателю
                </p>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {recipient}
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Перевод средств</h3>
                      <p className="text-xs text-slate-400">Внутри сети, крипта или на карту РФ</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Crisp, stable Method Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-2xl my-4 border border-slate-700/60">
                  {methodTabs.map((tab) => {
                    const isActive = method === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setMethod(tab.id);
                          setRecipient('');
                        }}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Recipient Input */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {method === 'telegram' && 'Юзернейм получателя в Telegram:'}
                    {method === 'crypto' && 'Адрес кошелька (TON или Tron):'}
                    {method === 'sbp' && 'Номер телефона получателя в РФ (СБП):'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder={
                        method === 'telegram'
                          ? '@username'
                          : method === 'crypto'
                          ? 'EQBv... или TQn9...'
                          : '+7 (999) 000-00-00'
                      }
                      className="w-full py-3 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {recipient && (
                      <button
                        onClick={() => setRecipient('')}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Method-specific shortcuts - Keeps modal height stable across all 3 tabs */}
                <div className="mb-4 min-h-[58px]">
                  {method === 'telegram' && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Недавние контакты:
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {RECENT_CONTACTS.map((c) => (
                          <button
                            key={c.handle}
                            onClick={() => setRecipient(c.handle)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left flex-shrink-0 transition-all ${
                              recipient === c.handle
                                ? 'bg-blue-600/20 border-blue-500/60 text-white'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <img
                              src={c.avatar}
                              alt={c.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="text-[11px]">
                              <div className="font-semibold text-white">{c.name}</div>
                              <div className="text-slate-400 font-mono text-[10px]">{c.handle}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {method === 'crypto' && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Сеть перевода:
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { name: 'TON (The Open Network)', tag: '0% fee', ex: 'EQBvW8Z5huBkMJYdn3PBRnKK' },
                          { name: 'Tron (TRC-20)', tag: 'Быстро', ex: 'TQn9Y2khEsLJW1ChVWFMS' },
                          { name: 'Arbitrum (One)', tag: 'L2', ex: '0x71C...b97' },
                        ].map((net) => (
                          <button
                            key={net.name}
                            type="button"
                            onClick={() => setRecipient(net.ex)}
                            className="flex items-center gap-2 p-2 rounded-xl border bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 flex-shrink-0 text-left transition-all"
                          >
                            <div className="text-[11px]">
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{net.name}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  {net.tag}
                                </span>
                              </div>
                              <div className="text-slate-500 font-mono text-[10px] truncate max-w-[140px]">{net.ex}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {method === 'sbp' && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        Банк получателя (СБП РФ):
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { name: 'Т-Банк', badge: '0% до 100k' },
                          { name: 'Сбербанк', badge: 'СБП' },
                          { name: 'Альфа-Банк', badge: 'СБП' },
                          { name: 'ВТБ', badge: 'СБП' },
                        ].map((bank) => (
                          <div
                            key={bank.name}
                            className="p-2 rounded-xl border bg-slate-800/60 border-slate-700/60 text-slate-300 flex-shrink-0 text-left"
                          >
                            <div className="text-[11px] font-semibold text-white">{bank.name}</div>
                            <div className="text-[10px] text-blue-400">{bank.badge}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Сумма перевода:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Доступно: <b className="text-emerald-400">${balanceUsdt.toFixed(2)} USDT</b>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full py-3 px-3.5 pr-20 rounded-xl bg-slate-800 border border-slate-700 text-white text-base font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <div className="absolute right-3 top-3 text-xs font-bold text-emerald-400 font-mono">
                      USDT
                    </div>
                  </div>

                  {numAmount > 0 && (
                    <div className="text-[11px] text-slate-400 font-mono mt-1 text-right">
                      ≈ {parseInt(rubEquivalent).toLocaleString('ru-RU')} ₽
                    </div>
                  )}

                  {/* Percentage buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleQuickPercent(pct)}
                        className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-300 font-semibold active:scale-95 transition-all"
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commission / Summary breakdown */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 mb-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Комиссия сети:</span>
                    <span className="font-semibold text-emerald-400">
                      {method === 'telegram' ? '0% (Бесплатно внутри NovaPay)' : method === 'crypto' ? '1.00 USDT' : '1.5%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Скорость зачисления:</span>
                    <span className="font-semibold text-slate-200">Мгновенно (0.5 сек)</span>
                  </div>
                </div>

                {/* Balance warning */}
                {numAmount > balanceUsdt && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-4">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>Сумма превышает ваш текущий баланс (${balanceUsdt} USDT)</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  disabled={!recipient || !isSufficient || isProcessing}
                  onClick={handleSend}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Отправка транзакции...
                    </span>
                  ) : (
                    <>
                      <span>Отправить {numAmount > 0 ? `${numAmount.toFixed(2)} USDT` : ''}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
