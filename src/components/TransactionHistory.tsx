import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../types';
import { ArrowDownLeft, CreditCard, QrCode } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

type FilterType = 'all' | 'sbp' | 'visa' | 'deposit';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filterTabs = [
    { id: 'all' as FilterType, label: 'Все' },
    { id: 'sbp' as FilterType, label: 'СБП (РФ)', icon: QrCode },
    { id: 'visa' as FilterType, label: 'Visa (Мир)', icon: CreditCard },
    { id: 'deposit' as FilterType, label: 'Пополнения', icon: ArrowDownLeft },
  ];

  const filtered = transactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    return tx.type === activeFilter;
  });

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-100">История операций</h2>
        <span className="text-xs text-slate-400 font-mono">
          {filtered.length} операций
        </span>
      </div>

      {/* Crisp, bug-free Segmented Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Fast, clean animated list (no layout rubber-stretching) */}
      <div className="space-y-2 mt-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="py-10 text-center text-xs text-slate-500"
            >
              Нет операций в выбранной категории
            </motion.div>
          ) : (
            filtered.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setSelectedTx(tx)}
                className="flex items-center justify-between p-3 rounded-xl bg-fintech-card/80 hover:bg-slate-800/90 border border-fintech-border/50 cursor-pointer active:scale-98 transition-colors"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-700/60 flex-shrink-0">
                    {tx.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>{tx.title}</span>
                      {tx.type === 'sbp' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold">
                          СБП
                        </span>
                      )}
                      {tx.type === 'visa' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                          Visa
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {tx.timestamp} • {tx.category}
                    </div>
                  </div>
                </div>

                {/* Right: Amounts */}
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-xs font-mono font-bold ${
                      tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'deposit' ? '+' : '-'}${tx.amountUsdt.toFixed(2)} USDT
                  </div>
                  {tx.amountRub && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      {tx.amountRub.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Full receipt modal with crisp spring animation */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-sm glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10"
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

              <div className="text-center pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-2">
                  {selectedTx.icon}
                </div>
                <h3 className="text-base font-bold text-white">{selectedTx.title}</h3>
                <p className="text-xs text-slate-400">{selectedTx.timestamp}</p>
              </div>

              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Тип платежа:</span>
                  <span className="font-semibold text-slate-200 uppercase">
                    {selectedTx.type === 'sbp' ? 'СБП (Россия)' : selectedTx.type === 'visa' ? 'Visa (Apple Pay)' : 'Пополнение'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Статус:</span>
                  <span className="font-semibold text-emerald-400">Успешно проведен</span>
                </div>
                {selectedTx.amountRub && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Сумма в рублях:</span>
                    <span className="font-mono font-bold text-slate-100">{selectedTx.amountRub} ₽</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Списано в USDT:</span>
                  <span className="font-mono font-bold text-emerald-400">${selectedTx.amountUsdt.toFixed(2)} USDT</span>
                </div>
                {selectedTx.rate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Курс списания:</span>
                    <span className="font-mono text-slate-400">1 USDT = {selectedTx.rate.toFixed(2)} ₽</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold mt-2 active:scale-98 transition-all"
              >
                Закрыть чек
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
