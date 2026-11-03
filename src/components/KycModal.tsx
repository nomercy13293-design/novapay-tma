import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../types';

interface KycModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({ isOpen, user, onClose }) => {
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

          {/* Modal Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-sm glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Верификация (KYC)</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-bold">Верификация пройдена</div>
                  <div className="text-[11px] text-emerald-400/80">Загранпаспорт РФ подтвержден</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Уровень:</span>
                  <span className="font-semibold text-white">{user.kycTier}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Лимит на платеж СБП:</span>
                  <span className="font-mono font-semibold text-white">300 000 ₽ / чек</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Лимит карты Visa:</span>
                  <span className="font-mono font-semibold text-white">$10 000 / месяц</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Эмитент карты:</span>
                  <span className="font-semibold text-white">BaaS Partner (Hong Kong)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold mt-2 active:scale-98 transition-all"
            >
              Понятно
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
