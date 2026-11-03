import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export const PromoCards: React.FC = () => {
  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Promo Card 1 */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="glass-panel rounded-2xl p-4 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                Активировать
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Кешбэк 3%
            </h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              При оплате по СБП от 5 000 ₽
            </p>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[65%]" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>3 250 ₽</span>
              <span>5 000 ₽</span>
            </div>
          </div>
        </motion.div>

        {/* Promo Card 2 */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="glass-panel rounded-2xl p-4 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                Активировать
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Бонус $15
            </h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Оплати 3 зарубежные подписки
            </p>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[33%]" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>1 из 3</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section Header: "Последние операции >" matching screenshot */}
      <div className="flex items-center justify-between p-3.5 mt-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:bg-slate-800/60 cursor-pointer active:scale-98 transition-all">
        <span className="text-sm font-semibold text-slate-200">
          Последние операции
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
};
