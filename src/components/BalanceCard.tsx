import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, QrCode, RefreshCw } from 'lucide-react';

interface BalanceCardProps {
  balanceUsdt: number;
  rate: number;
  onOpenDeposit: () => void;
  onOpenTransfer: () => void;
  onOpenSbpScanner: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balanceUsdt,
  rate,
  onOpenDeposit,
  onOpenTransfer,
  onOpenSbpScanner,
}) => {
  const [showRubPrimary, setShowRubPrimary] = useState(false);
  const balanceRub = balanceUsdt * rate;

  return (
    <div className="px-4 pt-3 pb-2">
      {/* Hero Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="cyber-grid-card rounded-3xl p-6 relative overflow-hidden"
      >
        {/* Soft radial ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center justify-center gap-1.5">
            <span>ОБЩИЙ БАЛАНС</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Amount with toggle */}
          <div
            onClick={() => setShowRubPrimary(!showRubPrimary)}
            className="cursor-pointer select-none py-1 group inline-block"
            title="Нажмите, чтобы переключить валюту"
          >
            {showRubPrimary ? (
              <motion.div
                key="rub"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-baseline justify-center gap-1.5"
              >
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  {balanceRub.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xl font-bold text-emerald-400">₽</span>
              </motion.div>
            ) : (
              <motion.div
                key="usdt"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-baseline justify-center gap-1.5"
              >
                <span className="text-xl font-bold text-slate-400">$</span>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  {balanceUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-bold text-emerald-400 ml-0.5">USDT</span>
              </motion.div>
            )}

            <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1 font-medium">
              <span>{showRubPrimary ? `≈ $${balanceUsdt.toFixed(2)} USDT` : `≈ ${balanceRub.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`}</span>
              <RefreshCw className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3 Core Action Buttons: Пополнить / Перевести / СБП QR */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-3 gap-3 px-3 mt-5"
      >
        {/* 1: Receive / Пополнить */}
        <button
          onClick={onOpenDeposit}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-slate-800/90 group-hover:bg-slate-700/90 border border-slate-700 flex items-center justify-center text-slate-100 shadow-md">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.2] text-slate-200" />
          </div>
          <span className="text-xs font-medium text-slate-300">Пополнить</span>
        </button>

        {/* 2: Pay / Перевести */}
        <button
          onClick={onOpenTransfer}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-slate-800/90 group-hover:bg-slate-700/90 border border-slate-700 flex items-center justify-center text-slate-100 shadow-md">
            <ArrowUpRight className="w-6 h-6 stroke-[2.2] text-slate-200" />
          </div>
          <span className="text-xs font-medium text-slate-300">Перевести</span>
        </button>

        {/* 3: Scan / СБП QR */}
        <button
          onClick={onOpenSbpScanner}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 border border-blue-400/30 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <QrCode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-blue-400">СБП QR</span>
        </button>
      </motion.div>
    </div>
  );
};
