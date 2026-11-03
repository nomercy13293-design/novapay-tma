import React, { useState } from 'react';
import type { CardInfo } from '../types';
import { Eye, EyeOff, Lock, Unlock, Wifi, CheckCircle2 } from 'lucide-react';

interface VisaCardProps {
  card: CardInfo;
  onToggleFreeze: () => void;
}

export const VisaCard: React.FC<VisaCardProps> = ({ card, onToggleFreeze }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPan = () => {
    navigator.clipboard.writeText(card.panFull.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Международная карта (Visa Platinum)
        </h2>
        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> В Apple Pay
        </span>
      </div>

      {/* Card Body with 3D feel */}
      <div
        className={`glass-card-visa rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${
          card.isFrozen ? 'opacity-60 saturate-50 ring-2 ring-cyan-500/40' : ''
        }`}
      >
        {/* Frost overlay when frozen */}
        {card.isFrozen && (
          <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-cyan-200">
            <Lock className="w-8 h-8 mb-1" />
            <span className="text-xs font-bold uppercase tracking-widest">Карта заморожена</span>
          </div>
        )}

        {/* Card Header: Chip & Visa Logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Golden Chip */}
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border border-amber-200/40 shadow-inner flex flex-col justify-around p-1">
              <div className="h-[1px] bg-amber-900/40 w-full" />
              <div className="h-[1px] bg-amber-900/40 w-full" />
            </div>
            <Wifi className="w-5 h-5 text-slate-400/80 rotate-90" />
          </div>

          <div className="text-right">
            <span className="text-xl font-black italic tracking-wider text-slate-100">
              VISA
            </span>
            <div className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase -mt-1">
              Platinum
            </div>
          </div>
        </div>

        {/* Card Number */}
        <div 
          onClick={handleCopyPan}
          className="cursor-pointer group relative mb-4 py-1 select-none flex items-center justify-between"
          title="Нажмите, чтобы скопировать"
        >
          <span className="font-mono text-sm sm:text-base font-bold tracking-widest text-slate-100 group-hover:text-emerald-300 transition-colors whitespace-nowrap">
            {showDetails ? card.panFull : card.panMasked}
          </span>

          <span
            className={`text-[10px] px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-bold whitespace-nowrap transition-all duration-200 shadow-md ${
              copied ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
          >
            Скопировано!
          </span>
        </div>

        {/* Card Footer: Holder, Expiry, CVV */}
        <div className="flex items-end justify-between text-xs text-slate-300">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Владелец</div>
            <div className="font-medium tracking-wide">{card.cardholder}</div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Срок</div>
              <div className="font-mono font-medium">{card.expiry}</div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">CVV</div>
              <div className="font-mono font-bold text-emerald-400">
                {showDetails ? card.cvv : '•••'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card action controls */}
      <div className="flex items-center justify-between mt-2.5 px-1">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {showDetails ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Скрыть реквизиты</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Показать реквизиты</span>
            </>
          )}
        </button>

        <button
          onClick={onToggleFreeze}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {card.isFrozen ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400">Разморозить</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Заморозить карту</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
