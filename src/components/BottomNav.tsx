import React from 'react';
import { motion } from 'framer-motion';
import { Home, CreditCard, QrCode, TrendingUp, User } from 'lucide-react';

export type TabType = 'home' | 'cards' | 'sbp' | 'rates' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Главная', icon: Home },
    { id: 'cards' as TabType, label: 'Карты', icon: CreditCard },
    { id: 'sbp' as TabType, label: 'СБП Pay', icon: QrCode, isHero: true },
    { id: 'rates' as TabType, label: 'Курсы', icon: TrendingUp },
    { id: 'profile' as TabType, label: 'Профиль', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto glass-dock px-3 py-2">
      <div className="flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isHero) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-4 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 p-3 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-[#080a0f]">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="relative py-1 px-3 flex flex-col items-center justify-center transition-colors text-slate-400 hover:text-slate-200 active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'text-emerald-400 scale-110' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] mt-1 transition-colors ${
                  isActive ? 'font-bold text-emerald-400' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
