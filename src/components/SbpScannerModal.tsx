import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flashlight, QrCode, ArrowRight, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SbpScannerModalProps {
  isOpen: boolean;
  rate: number;
  balanceUsdt: number;
  onClose: () => void;
  onSuccessPayment: (merchant: string, category: string, amountRub: number, amountUsdt: number) => void;
}

interface TestMerchant {
  name: string;
  category: string;
  amountRub: number;
  icon: string;
}

const PRESET_MERCHANTS: TestMerchant[] = [
  { name: 'ВкусВилл', category: 'Продукты', amountRub: 1240, icon: '🛒' },
  { name: 'Surf Coffee', category: 'Кофейня', amountRub: 450, icon: '☕' },
  { name: 'АЗС Газпромнефть', category: 'Заправки', amountRub: 2800, icon: '⛽' },
  { name: 'Аптека Ригла', category: 'Здоровье', amountRub: 890, icon: '💊' },
];

export const SbpScannerModal: React.FC<SbpScannerModalProps> = ({
  isOpen,
  rate,
  balanceUsdt,
  onClose,
  onSuccessPayment,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<TestMerchant | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calculate USDT for selected merchant
  const amountRub = selectedMerchant ? selectedMerchant.amountRub : 0;
  const amountUsdt = amountRub > 0 ? parseFloat((amountRub / rate).toFixed(2)) : 0;
  const isSufficientBalance = balanceUsdt >= amountUsdt;

  const handleConfirmPay = () => {
    if (!selectedMerchant || amountRub <= 0) return;
    if (!isSufficientBalance) return;

    setIsProcessing(true);

    // Simulate fast 1.2s SBP settlement
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);

      // Trigger celebratory confetti fireworks!
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.75 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (e) {
        console.error(e);
      }

      const merchantName = selectedMerchant.name;
      const merchantCat = selectedMerchant.category;

      onSuccessPayment(merchantName, merchantCat, amountRub, amountUsdt);

      setTimeout(() => {
        setPaymentSuccess(false);
        setSelectedMerchant(null);
        onClose();
      }, 1900);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Scanner Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative z-10 flex flex-col h-full justify-between"
          >
            {/* Top action bar: close & flashlight */}
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700/80 text-white flex items-center justify-center active:scale-95 transition-all shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600/90 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/25">
                <QrCode className="w-3.5 h-3.5" /> СБП Сканер РФ
              </span>

              <button
                onClick={() => setFlashlightOn(!flashlightOn)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-lg ${
                  flashlightOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900/80 border-slate-700/80 text-white'
                }`}
              >
                <Flashlight className="w-5 h-5" />
              </button>
            </div>

            {/* Camera viewfinder simulation */}
            {!selectedMerchant && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="w-64 h-64 border-2 border-dashed border-blue-400/70 rounded-3xl relative flex items-center justify-center overflow-hidden bg-slate-900/40">
                  {/* Corner brackets */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                  {/* Laser scanning line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_#3b82f6] animate-bounce" />

                  <div className="text-center p-4">
                    <QrCode className="w-12 h-12 text-slate-500/60 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">
                      Наведите камеру на QR-код терминала на кассе
                    </p>
                  </div>
                </div>

                {/* Quick presets picker */}
                <div className="w-full max-w-sm mt-6">
                  <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Или выберите тестовый чек для симуляции:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_MERCHANTS.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setSelectedMerchant(m)}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-left active:scale-98 transition-all"
                      >
                        <span className="text-xl">{m.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{m.name}</div>
                          <div className="text-[11px] text-emerald-400 font-mono font-bold">
                            {m.amountRub} ₽
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Sheet / Success Screen */}
            {selectedMerchant && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="glass-panel rounded-t-3xl p-6 border-t border-slate-700 bg-slate-900/98 shadow-2xl"
              >
                {/* Drag indicator */}
                <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3" />

                {paymentSuccess ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 animate-bounce">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Оплачено успешно!</h3>
                    <p className="text-sm text-slate-300">
                      {amountRub} ₽ списано в {selectedMerchant.name}
                    </p>
                    <div className="text-xs text-emerald-400 font-mono mt-1">
                      -{amountUsdt} USDT
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SBP Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                          СБП
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{selectedMerchant.name}</h3>
                          <p className="text-xs text-slate-400">{selectedMerchant.category} • Оплата по QR</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMerchant(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Изменить
                      </button>
                    </div>

                    {/* Price conversion breakdown */}
                    <div className="py-5 text-center">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Сумма в чеке
                      </div>
                      <div className="text-3xl font-black text-white tracking-tight">
                        {amountRub.toLocaleString('ru-RU')}{' '}
                        <span className="text-lg font-bold text-slate-400">₽</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-3">
                        <span>К списанию:</span>
                        <span className="font-mono text-sm font-bold">${amountUsdt} USDT</span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-2 font-mono">
                        Курс конвертации: 1 USDT = {rate.toFixed(2)} ₽ (включая спред 1.5%)
                      </div>
                    </div>

                    {/* Balance warning if insufficient */}
                    {!isSufficientBalance && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-4">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span>Недостаточно средств. Ваш баланс: ${balanceUsdt} USDT</span>
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      disabled={!isSufficientBalance || isProcessing}
                      onClick={handleConfirmPay}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Авторизация СБП...
                        </span>
                      ) : (
                        <>
                          <span>Подтвердить оплату {amountUsdt} USDT</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
