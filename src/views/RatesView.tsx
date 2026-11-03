import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, RefreshCw, Zap } from 'lucide-react';
import type { LiveRates } from '../api/client';

interface RatesViewProps {
  ratesData?: LiveRates | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const RatesView: React.FC<RatesViewProps> = ({ ratesData, isLoading = false, onRefresh }) => {
  const [selectedPair, setSelectedPair] = useState<'TON/USD' | 'USDT/RUB' | 'TON/RUB'>('USDT/RUB');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

  // Форматирование значений с fallback
  const tonUsd = ratesData?.tonUsd ? `$${ratesData.tonUsd.toFixed(3)}` : '$1.170';
  const tonRub = ratesData?.tonRub ? `${ratesData.tonRub.toFixed(2)} ₽` : '95.00 ₽';
  const usdtRub = ratesData?.usdtRub ? `${ratesData.usdtRub.toFixed(2)} ₽` : '81.10 ₽';
  const tonUsdt = ratesData?.tonUsdt ? `${ratesData.tonUsdt.toFixed(3)} USDT` : '1.171 USDT';
  const usdtEur = ratesData?.usdtEur ? `${ratesData.usdtEur.toFixed(3)} €` : '0.892 €';

  const diffTonUsd = ratesData?.diff24h?.tonUsd || '−2.45%';
  const diffTonRub = ratesData?.diff24h?.tonRub || '−1.85%';
  const diffUsdtRub = ratesData?.diff24h?.usdtRub || '+0.59%';
  const diffUsdtEur = ratesData?.diff24h?.usdtEur || '+0.11%';

  const ratesList = [
    {
      id: 'USDT/RUB',
      pair: 'USDT / RUB',
      value: usdtRub,
      change: diffUsdtRub,
      sub: 'Курс конвертации СБП (НСПК)',
      tag: 'СБП РФ',
    },
    {
      id: 'TON/USD',
      pair: 'TON / USD',
      value: tonUsd,
      change: diffTonUsd,
      sub: 'The Open Network (CoinGecko / TonAPI)',
      tag: 'TON Core',
    },
    {
      id: 'TON/RUB',
      pair: 'TON / RUB',
      value: tonRub,
      change: diffTonRub,
      sub: 'Курс TON в российских рублях',
      tag: 'Рынок РФ',
    },
    {
      id: 'TON/USDT',
      pair: 'TON / USDT',
      value: tonUsdt,
      change: diffTonUsd,
      sub: 'DEX DeDust & STON.fi оракул',
      tag: 'TON DEX',
    },
    {
      id: 'USDT/EUR',
      pair: 'USDT / EUR',
      value: usdtEur,
      change: diffUsdtEur,
      sub: 'Курс европейской карты Visa',
      tag: 'Visa EU',
    },
  ];

  const renderBadge = (change: string) => {
    const isNegative = change.startsWith('-') || change.startsWith('−');
    return (
      <span
        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
          isNegative
            ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
            : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
        }`}
      >
        {change}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-24 pt-2"
    >
      {/* Header with TonAPI Live badge and Refresh Button */}
      <div className="px-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Курсы валют</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TON Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Прямые котировки из блокчейна TON (TonAPI & DEX)
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="Обновить котировки"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Live TON Status Banner */}
      <div className="px-4">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900/60 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
              💎
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Блокчейн The Open Network</span>
                <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              </div>
              <div className="text-[10px] text-slate-400">
                1 TON ≈ {tonUsd} • Оракул STON.fi & DeDust
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono">Обновлено</div>
            <div className="text-[11px] font-bold text-emerald-400 font-mono">В реальном времени</div>
          </div>
        </div>
      </div>

      {/* Currency Rate Cards */}
      <div className="px-4 space-y-2.5">
        {ratesList.map((r) => {
          const isSelected = selectedPair === r.id;
          return (
            <div
              key={r.pair}
              onClick={() => {
                if (r.id === 'TON/USD' || r.id === 'USDT/RUB' || r.id === 'TON/RUB') {
                  setSelectedPair(r.id);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/95 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{r.pair}</span>
                    {renderBadge(r.change)}
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                      {r.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{r.sub}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono font-black text-white">{r.value}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Спред: 0.8–1.5%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Chart Container */}
      <div className="px-4">
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">График {selectedPair}</span>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl text-[10px] font-bold">
              {(['1D', '1W', '1M', '1Y'] as const).map((t) => {
                const isActive = timeframe === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2 py-0.5 rounded-lg active:scale-95 transition-all duration-150 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated SVG Sparkline chart simulation with dynamic path based on selected pair */}
          <div className="h-36 w-full flex items-end overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.svg
                key={`${selectedPair}-${timeframe}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                viewBox="0 0 300 100"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={
                    selectedPair === 'TON/USD'
                      ? 'M 0,50 Q 50,20 100,45 T 200,25 T 300,10 L 300,100 L 0,100 Z'
                      : selectedPair === 'TON/RUB'
                      ? 'M 0,60 Q 60,30 120,50 T 220,20 T 300,15 L 300,100 L 0,100 Z'
                      : 'M 0,70 Q 50,40 100,55 T 200,30 T 300,15 L 300,100 L 0,100 Z'
                  }
                  fill="url(#chartGradient)"
                />
                <path
                  d={
                    selectedPair === 'TON/USD'
                      ? 'M 0,50 Q 50,20 100,45 T 200,25 T 300,10'
                      : selectedPair === 'TON/RUB'
                      ? 'M 0,60 Q 60,30 120,50 T 220,20 T 300,15'
                      : 'M 0,70 Q 50,40 100,55 T 200,30 T 300,15'
                  }
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="15" r="4" fill="#06b6d4" />
              </motion.svg>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
