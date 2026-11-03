import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Sparkles, ArrowRight } from 'lucide-react';
import type { Transaction } from '../types';

interface SbpViewProps {
  rate: number;
  balanceUsdt: number;
  transactions: Transaction[];
  onOpenSbpScanner: () => void;
}

export const SbpView: React.FC<SbpViewProps> = ({
  rate,
  balanceUsdt,
  transactions,
  onOpenSbpScanner,
}) => {
  const [rubInput, setRubInput] = useState<string>('1500');
  const sbpTxs = transactions.filter((t) => t.type === 'sbp');

  const calculatedUsdt = (parseFloat(rubInput) || 0) > 0
    ? ((parseFloat(rubInput) || 0) / rate).toFixed(2)
    : '0.00';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-24 pt-2"
    >
      <div className="px-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-black text-white text-[10px]">
            СБП
          </div>
          <h1 className="text-xl font-bold text-white">Оплата по СБП в РФ</h1>
        </div>
        <p className="text-xs text-slate-400">
          Мгновенная оплата по QR-коду на кассах магазинов со списанием в USDT (Доступно: ${balanceUsdt} USDT)
        </p>
      </div>

      {/* Hero Scanner Launch Card */}
      <div className="px-4">
        <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30 animate-pulse-glow">
            <QrCode className="w-10 h-10" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">
            Сканировать QR на кассе
          </h2>
          <p className="text-xs text-slate-300 max-w-xs mx-auto mb-5 leading-relaxed">
            Поднесите камеру к экрану терминала или статическому QR-коду СБП в любом магазине
          </p>

          <button
            onClick={onOpenSbpScanner}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/40 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>Открыть сканер камеры</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Calculator */}
      <div className="px-4">
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Калькулятор списания</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              1 USDT = {rate.toFixed(2)} ₽
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">Сумма в рублях</label>
              <div className="relative">
                <input
                  type="number"
                  value={rubInput}
                  onChange={(e) => setRubInput(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono font-bold focus:outline-none focus:border-blue-500"
                  placeholder="1000"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">₽</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">Спишется с баланса</label>
              <div className="py-2.5 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-emerald-400 text-sm font-mono font-bold">
                ${calculatedUsdt} <span className="text-xs font-normal text-slate-400">USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SBP Specific History */}
      <div className="px-4 pt-1">
        <h3 className="text-xs font-bold text-slate-300 mb-2">История оплат по СБП</h3>
        <div className="space-y-2">
          {sbpTxs.map((tx) => (
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
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-200">
                  {tx.amountRub?.toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  -${tx.amountUsdt.toFixed(2)} USDT
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
