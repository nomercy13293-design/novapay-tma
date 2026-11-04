import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Wallet,
  AlertTriangle,
  ExternalLink,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import confetti from 'canvas-confetti';
import { ApiClient } from '../api/client';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateDeposit: (amount: number) => void;
  userMemo?: string;
  userId?: number;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSimulateDeposit,
  userMemo,
  userId,
}) => {
  const [network, setNetwork] = useState<'TON' | 'TRC20'>('TON');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isVerifyingMemo, setIsVerifyingMemo] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const wallet = useTonWallet();

  const tonAddress = wallet
    ? wallet.account.address
    : 'EQBvW8Z5huBkMJYdnfGpdBhVNovTRNT2NLL9921_TON_PAY';
  const trcAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5K7821_TRON_DEPOSIT';
  const activeAddress = network === 'TON' ? tonAddress : trcAddress;

  // Персональный детерминированный Memo для TON
  const effectiveUserId = userId || 1001;
  const memo = userMemo || `NP-${effectiveUserId}`;
  const tonkeeperUrl = `https://app.tonkeeper.com/transfer/${tonAddress}?text=${encodeURIComponent(memo)}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleCopyAll = () => {
    const text = `Адрес: ${activeAddress}\nMemo: ${memo}\nСеть: TON (Tether USDT)`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Интерактивная проверка зачисления по Memo
  const handleVerifyMemo = async () => {
    setIsVerifyingMemo(true);
    setVerifyMessage(null);

    try {
      const res = await ApiClient.verifyDepositByMemo(effectiveUserId, memo);
      if (res && res.ok) {
        setVerifyMessage({ text: 'Депозит +100 USDT успешно обнаружен и зачислен!' });
        try {
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#10b981', '#3b82f6', '#06b6d4'],
          });
        } catch {}

        onSimulateDeposit(res.amountUsdt || 100);

        setTimeout(() => {
          setVerifyMessage(null);
          onClose();
        }, 1800);
      } else {
        setVerifyMessage({
          text: res?.error || 'Новых транзакций с этим Memo пока не обнаружено в сети.',
          isError: true,
        });
      }
    } catch {
      setVerifyMessage({
        text: 'Не удалось связаться с блокчейн-нодой. Попробуйте еще раз через минуту.',
        isError: true,
      });
    } finally {
      setIsVerifyingMemo(false);
    }
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
            className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-6 bg-slate-900/98 border-t sm:border border-slate-700/80 shadow-2xl relative z-10 max-h-[92vh] overflow-y-auto"
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
                  <p className="text-xs text-slate-400">USDT Tether (TON & Tron)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Network Selector Tabs */}
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
                  0% fee
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

            {/* TON Connect Wallet Button (when TON network selected) */}
            {network === 'TON' && (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 mb-2">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{wallet ? 'Кошелек подключен:' : 'Подключить Tonkeeper / @wallet:'}</span>
                </div>
                <div className="flex justify-center">
                  <TonConnectButton />
                </div>
              </div>
            )}

            {/* QR Code presentation */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <div className="w-40 h-40 bg-white rounded-xl p-3 flex items-center justify-center shadow-lg mb-2.5">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <span className="text-xs text-slate-300 text-center font-medium">
                Отправляйте только <b>USDT в сети {network}</b>
              </span>
            </div>

            {/* Address field with copy */}
            <div className="mb-3">
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Адрес смарт-контракта NovaPay:
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                <span className="font-mono text-xs text-slate-200 truncate flex-1">
                  {activeAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex-shrink-0 active:scale-95 transition-all"
                  title="Скопировать адрес"
                >
                  {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TON Network Specific: Personal Memo & Warnings */}
            {network === 'TON' && (
              <div className="space-y-3 mb-4">
                {/* Personal Memo Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                      <span>Персональный комментарий (Memo):</span>
                    </label>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      ОБЯЗАТЕЛЬНО
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40">
                    <span className="font-mono text-sm text-amber-200 font-extrabold tracking-wider flex-1">
                      {memo}
                    </span>
                    <button
                      onClick={handleCopyMemo}
                      className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      {copiedMemo ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Скопировать Memo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Prominent Warning Callout */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200/90 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <b className="text-amber-300 font-semibold">Важно:</b> Обязательно укажите комментарий (Memo) <code>{memo}</code> при переводе! Без него блокчейн TON не сможет автоматически сопоставить депозит с вашим аккаунтом.
                  </div>
                </div>

                {/* Quick actions for TON */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyAll}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedAll ? 'Все скопировано!' : 'Скопировать всё'}</span>
                  </button>

                  <a
                    href={tonkeeperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>В Tonkeeper</span>
                  </a>
                </div>

                {/* Interactive "Check deposit by Memo" */}
                <div className="pt-1">
                  <button
                    disabled={isVerifyingMemo}
                    onClick={handleVerifyMemo}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isVerifyingMemo ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        <span>Поиск транзакции в TON...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Проверить зачисление по Memo</span>
                      </>
                    )}
                  </button>

                  {verifyMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        verifyMessage.isError
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {verifyMessage.isError ? (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      )}
                      <span>{verifyMessage.text}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* TRC20 Information */}
            {network === 'TRC20' && (
              <div className="mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                ℹ️ В сети Tron (TRC-20) Memo не требуется. Депозит зачисляется автоматически после 1 подтверждения сети (обычно 1–2 минуты).
              </div>
            )}

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
