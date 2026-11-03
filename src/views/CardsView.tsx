import React from 'react';
import { motion } from 'framer-motion';
import { VisaCard } from '../components/VisaCard';
import type { CardInfo, Transaction } from '../types';
import { Sliders, Smartphone, PlusCircle, RefreshCw } from 'lucide-react';

interface CardsViewProps {
  card: CardInfo;
  transactions: Transaction[];
  onToggleFreeze: () => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  card,
  transactions,
  onToggleFreeze,
}) => {
  const visaTxs = transactions.filter((t) => t.type === 'visa');

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-24 pt-2"
    >
      <div className="px-4">
        <h1 className="text-xl font-bold text-white mb-1">Управление картами</h1>
        <p className="text-xs text-slate-400">
          Международная Visa Platinum для оплат онлайн и Apple Pay
        </p>
      </div>

      {/* The 3D Visa Card */}
      <VisaCard card={card} onToggleFreeze={onToggleFreeze} />

      {/* Apple Wallet Connect Banner */}
      <div className="px-4">
        <button
          onClick={() => alert('Карта добавлена в Apple Wallet!')}
          className="w-full py-3 px-4 rounded-2xl bg-black border border-slate-700/80 hover:border-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-2.5 active:scale-98 transition-all shadow-lg"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Добавить в Apple Wallet / Google Pay</span>
        </button>
      </div>

      {/* Spending Limits Slider */}
      <div className="px-4">
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Лимит трат в месяц</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">$3,450 / $10,000</span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden my-3">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[34%]" />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Потрачено: $3,450</span>
            <span>Остаток: $6,550</span>
          </div>
        </div>
      </div>

      {/* Reissue button */}
      <div className="px-4 flex gap-2">
        <button
          onClick={() => alert('Перевыпуск виртуальной карты (Sandbox)')}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Перевыпустить карту</span>
        </button>

        <button
          onClick={() => alert('Заказ физического пластика будет доступен во 2 этапе!')}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Заказать пластик</span>
        </button>
      </div>

      {/* Visa Transactions */}
      <div className="px-4 pt-2">
        <h3 className="text-xs font-bold text-slate-300 mb-2">Траты по карте Visa</h3>
        <div className="space-y-2">
          {visaTxs.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{tx.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-white">{tx.title}</div>
                  <div className="text-[10px] text-slate-400">{tx.timestamp}</div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-slate-200">
                -${tx.amountUsdt.toFixed(2)} USDT
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
