import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Bell, Globe, CreditCard, KeyRound, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [allowOnline, setAllowOnline] = useState(true);
  const [allowAtm, setAllowAtm] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 900);
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

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto"
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Настройки безопасности</h3>
                  <p className="text-xs text-slate-400">Управление картой и приложением</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Card Security */}
            <div className="py-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Карта Visa Platinum</span>
              </h4>

              {/* 3D Secure Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Оплата в интернете (3D Secure)</div>
                    <div className="text-[10px] text-slate-400">Подписки, Steam, зарубежные сайты</div>
                  </div>
                </div>
                <button
                  onClick={() => setAllowOnline(!allowOnline)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    allowOnline ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      allowOnline ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* ATM Cash Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Снятие в банкоматах за границей</div>
                    <div className="text-[10px] text-slate-400">Бесконтактные банкоматы NFC</div>
                  </div>
                </div>
                <button
                  onClick={() => setAllowAtm(!allowAtm)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    allowAtm ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      allowAtm ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* PIN Code button */}
              <button
                onClick={() => alert('Смена PIN-кода карты (Sandbox)')}
                className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Сменить PIN-код карты</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">••••</span>
              </button>
            </div>

            {/* Section 2: App & SBP Security */}
            <div className="py-2 space-y-3 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pt-2">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Приложение и СБП</span>
              </h4>

              {/* Face ID Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Face ID для оплаты СБП</div>
                    <div className="text-[10px] text-slate-400">Подтверждать списания биометрией</div>
                  </div>
                </div>
                <button
                  onClick={() => setFaceIdEnabled(!faceIdEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    faceIdEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      faceIdEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Bot Notifications Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Чеки в Telegram-бот</div>
                    <div className="text-[10px] text-slate-400">Мгновенный пуш при каждой транзакции</div>
                  </div>
                </div>
                <button
                  onClick={() => setNotifsEnabled(!notifsEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    notifsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      notifsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {savedToast ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Настройки сохранены!</span>
                  </>
                ) : (
                  <span>Готово</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
