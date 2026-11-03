import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Sparkles } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateDeposit: (amount: number) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSimulateDeposit,
}) => {
  const [network, setNetwork] = useState<'TON' | 'TRC20'>('TON');
  const [copied, setCopied] = useState(false);

  const tonAddress = 'EQBvW8Z5huBkMJYdnfGpdBhVNovTRNT2NLL9921_TON_PAY';
  const trcAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5K7821_TRON_DEPOSIT';
  const activeAddress = network === 'TON' ? tonAddress : trcAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  ₮
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Пополнение счета</h3>
                  <p className="text-xs text-slate-400">USDT Tether</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Crisp, stable Network Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl my-4 border border-slate-700/60">
              <button
                onClick={() => setNetwork('TON')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 ${
                  network === 'TON'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span>TON (Tether)</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-black font-bold">
                  0% комиссия
                </span>
              </button>

              <button
                onClick={() => setNetwork('TRC20')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 ${
                  network === 'TRC20'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span>Tron (TRC-20)</span>
              </button>
            </div>

            {/* QR Code presentation */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <div className="w-44 h-44 bg-white rounded-xl p-3 flex items-center justify-center shadow-lg mb-3">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <span className="text-xs text-slate-400 text-center">
                Отправляйте только <b>USDT в сети {network}</b>
              </span>
            </div>

            {/* Address field with copy */}
            <div className="mb-4">
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Ваш персональный адрес для пополнения:
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                <span className="font-mono text-xs text-slate-200 truncate flex-1">
                  {activeAddress}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Simulation action for instant test */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onSimulateDeposit(100);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Тестовая симуляция: Пополнить на +100 USDT</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
