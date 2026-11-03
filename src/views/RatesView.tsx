import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export const RatesView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

  const rates = [
    { pair: 'USDT / RUB', value: '93.00 ₽', change: '+0.45%', sub: 'Курс конвертации СБП' },
    { pair: 'USDT / EUR', value: '0.922 €', change: '+0.12%', sub: 'Курс европейской Visa' },
    { pair: 'USDT / USD', value: '$1.0001', change: '0.00%', sub: 'Стейблкоин Tether' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-24 pt-2"
    >
      <div className="px-4">
        <h1 className="text-xl font-bold text-white mb-1">Курсы валют</h1>
        <p className="text-xs text-slate-400">
          Актуальные курсы конвертации и динамика рынка
        </p>
      </div>

      {/* Currency Rate Cards */}
      <div className="px-4 space-y-2.5">
        {rates.map((r) => (
          <div
            key={r.pair}
            className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{r.pair}</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  {r.change}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{r.sub}</div>
            </div>

            <div className="text-right">
              <div className="text-sm font-mono font-bold text-white">{r.value}</div>
              <div className="text-[10px] text-slate-400 font-mono">Спред: 1.5%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Chart Container */}
      <div className="px-4">
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">График курса USDT / RUB</span>
            </div>

            {/* Crisp, stable Timeframe Selector */}
            <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl text-[10px] font-bold">
              {(['1D', '1W', '1M', '1Y'] as const).map((t) => {
                const isActive = timeframe === t;

                return (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2 py-0.5 rounded-lg active:scale-95 transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated SVG Sparkline chart simulation */}
          <div className="h-36 w-full flex items-end overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.svg
                key={timeframe}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                viewBox="0 0 300 100"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,70 Q 50,40 100,55 T 200,30 T 300,15 L 300,100 L 0,100 Z"
                  fill="url(#chartGradient)"
                />
                <path
                  d="M 0,70 Q 50,40 100,55 T 200,30 T 300,15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="15" r="4" fill="#10b981" />
              </motion.svg>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
