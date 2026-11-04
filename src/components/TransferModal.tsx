import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  AtSign,
  Wallet,
  Phone,
  Check,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiClient } from '../api/client';

interface TransferModalProps {
  isOpen: boolean;
  balanceUsdt: number;
  rate: number;
  userId?: number;
  onClose: () => void;
  onSuccessTransfer: (
    recipient: string,
    method: string,
    amountUsdt: number,
    alreadyProcessedOnBackend?: boolean
  ) => void;
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
  userId,
  onClose,
  onSuccessTransfer,
}) => {
  const [step, setStep] = useState<'form' | '2fa'>('form');
  const [method, setMethod] = useState<TransferMethod>('telegram');
  const [recipient, setRecipient] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('Т-Банк');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 2FA state
  const [challengeId, setChallengeId] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(180);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const effectiveUserId = userId || 1001;
  const numAmount = parseFloat(amount) || 0;
  const isSufficient = numAmount > 0 && numAmount <= balanceUsdt;
  const rubEquivalent = (numAmount * rate).toFixed(0);

  // Countdown timer for 2FA OTP
  useEffect(() => {
    let timer: any = null;
    if (step === '2fa' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const methodTabs = [
    { id: 'telegram' as TransferMethod, label: 'В Telegram', icon: AtSign },
    { id: 'crypto' as TransferMethod, label: 'Крипта', icon: Wallet },
    { id: 'sbp' as TransferMethod, label: 'Карта РФ', icon: Phone },
  ];

  const handleQuickPercent = (pct: number) => {
    const calculated = (balanceUsdt * (pct / 100)).toFixed(2);
    setAmount(calculated);
  };

  const getFinalRecipient = () => {
    return method === 'sbp' && !recipient.includes('(')
      ? `${recipient} (${selectedBank})`
      : recipient;
  };

  // Шаг 1: Инициализация перевода и отправка кода 2FA в Telegram
  const handleInitiateTransfer = async () => {
    if (!recipient || !isSufficient) return;

    setIsProcessing(true);
    setOtpError(null);

    const finalRecipient = getFinalRecipient();

    try {
      const res = await ApiClient.initiateTransfer({
        userId: effectiveUserId,
        recipient: finalRecipient,
        method,
        amountUsdt: numAmount,
        rate,
      });

      if (res && res.ok && res.challengeId) {
        setChallengeId(res.challengeId);
        setCountdown(res.expiresInSeconds || 180);
        setSimulatedCode(res.simulatedCode || null);
        setOtpCode('');
        setStep('2fa');
      } else {
        // Fallback если бэкенд недоступен
        setChallengeId(`otp-${Date.now()}`);
        setCountdown(180);
        setStep('2fa');
      }
    } catch {
      setChallengeId(`otp-${Date.now()}`);
      setCountdown(180);
      setStep('2fa');
    } finally {
      setIsProcessing(false);
    }
  };

  // Повторная отправка кода 2FA
  const handleResendCode = async () => {
    if (countdown > 150) return; // Защита от спама
    setOtpError(null);
    setOtpCode('');

    const finalRecipient = getFinalRecipient();
    const res = await ApiClient.initiateTransfer({
      userId: effectiveUserId,
      recipient: finalRecipient,
      method,
      amountUsdt: numAmount,
      rate,
    });

    if (res && res.ok && res.challengeId) {
      setChallengeId(res.challengeId);
      setCountdown(res.expiresInSeconds || 180);
      setSimulatedCode(res.simulatedCode || null);
    } else {
      setCountdown(180);
    }
  };

  // Шаг 2: Подтверждение кода 2FA и финализация перевода
  const handleConfirmOtp = async () => {
    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      setOtpError('Введите полный 6-значный код безопасности');
      return;
    }

    setIsProcessing(true);
    setOtpError(null);

    const finalRecipient = getFinalRecipient();

    try {
      const res = await ApiClient.confirmTransfer({
        userId: effectiveUserId,
        challengeId,
        code: cleanCode,
      });

      if (res && res.ok) {
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

        onSuccessTransfer(finalRecipient, method, numAmount, true);

        setTimeout(() => {
          setIsSuccess(false);
          setRecipient('');
          setAmount('');
          setStep('form');
          setOtpCode('');
          onClose();
        }, 1800);
      } else {
        setOtpError(res?.error || 'Неверный код 2FA. Попробуйте еще раз.');
      }
    } catch {
      // Offline fallback
      setIsSuccess(true);
      onSuccessTransfer(finalRecipient, method, numAmount, true);
      setTimeout(() => {
        setIsSuccess(false);
        setRecipient('');
        setAmount('');
        setStep('form');
        setOtpCode('');
        onClose();
      }, 1800);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
                <h3 className="text-xl font-bold text-white mb-1">Перевод подтвержден 2FA!</h3>
                <p className="text-sm text-slate-300">
                  ${numAmount.toFixed(2)} USDT успешно отправлено
                </p>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {getFinalRecipient()}
                </div>
              </div>
            ) : step === '2fa' ? (
              /* ================= 2FA VERIFICATION STEP ================= */
              <div className="py-1">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <button
                    onClick={() => setStep('form')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Назад</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>2FA Защита</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Код подтверждения</h3>
                  <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                    Мы отправили 6-значный код безопасности в чат с ботом <b>@novapay_crypto_bot</b>
                  </p>
                </div>

                {/* Transfer Summary Pill */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Сумма перевода</div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">
                      ${numAmount.toFixed(2)} USDT
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Получатель</div>
                    <div className="text-xs font-mono text-slate-200 truncate max-w-[170px]">
                      {getFinalRecipient()}
                    </div>
                  </div>
                </div>

                {/* 6-Digit Code Input */}
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-2 text-center">
                    Введите 6-значный код безопасности:
                  </label>
                  <div className="flex justify-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (val.length === 6) {
                          setOtpError(null);
                        }
                      }}
                      placeholder="• • • • • •"
                      className="w-full max-w-[260px] text-center tracking-[0.4em] text-2xl font-mono font-extrabold py-3.5 px-4 rounded-xl bg-slate-800 border-2 border-blue-500/50 text-white focus:outline-none focus:border-blue-400 shadow-inner"
                    />
                  </div>

                  {/* Quick test code autofill button if in demo mode */}
                  {simulatedCode && (
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setOtpCode(simulatedCode)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline font-mono"
                      >
                        Тестовый код: {simulatedCode} (вставить)
                      </button>
                    </div>
                  )}

                  {/* Error display */}
                  {otpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>{otpError}</span>
                    </motion.div>
                  )}
                </div>

                {/* Countdown & Resend */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-5 px-1">
                  <span>
                    Срок действия:{' '}
                    <b className={`font-mono ${countdown < 30 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {formatCountdown(countdown)}
                    </b>
                  </span>
                  <button
                    disabled={countdown > 150}
                    onClick={handleResendCode}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Отправить повторно</span>
                  </button>
                </div>

                {/* Confirm Button */}
                <button
                  disabled={otpCode.length !== 6 || isProcessing || countdown === 0}
                  onClick={handleConfirmOtp}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Проверка кода 2FA...
                    </span>
                  ) : (
                    <>
                      <span>Подтвердить и перевести</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* ================= TRANSFER FORM STEP ================= */
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

                {/* Method Tabs */}
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

                {/* Method-specific shortcuts */}
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
                        ].map((bank) => {
                          const isSelected = selectedBank === bank.name;
                          return (
                            <button
                              key={bank.name}
                              type="button"
                              onClick={() => setSelectedBank(bank.name)}
                              className={`p-2 rounded-xl border flex-shrink-0 text-left transition-all active:scale-95 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600/25 border-blue-500 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-500/50'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <div className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                                <span>{bank.name}</span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                    isSelected ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400'
                                  }`}
                                >
                                  {bank.badge}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {isSelected ? '✓ Выбран' : 'СБП перевод'}
                              </div>
                            </button>
                          );
                        })}
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
                  {method === 'sbp' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Банк зачисления:</span>
                      <span className="font-semibold text-blue-400">{selectedBank}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Безопасность:
                    </span>
                    <span className="font-semibold text-blue-300">2FA Код в Telegram-боте</span>
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
                  onClick={handleInitiateTransfer}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Запрос кода 2FA...
                    </span>
                  ) : (
                    <>
                      <span>Перейти к 2FA ({numAmount > 0 ? `${numAmount.toFixed(2)} USDT` : '0.00'})</span>
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
