import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sliders, HelpCircle, ChevronRight, ExternalLink } from 'lucide-react';
import type { UserProfile } from '../types';
import { SettingsModal } from '../components/SettingsModal';

interface ProfileViewProps {
  user: UserProfile;
  onOpenKyc: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onOpenKyc }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-24 pt-2"
    >
      <div className="px-4">
        <h1 className="text-xl font-bold text-white mb-1">Профиль</h1>
        <p className="text-xs text-slate-400">
          Аккаунт, статус верификации и параметры
        </p>
      </div>

      {/* User Card */}
      <div className="px-4">
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/60 shadow-lg"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{user.name}</h2>
            <p className="text-xs text-slate-400">{user.username}</p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold mt-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KYC Верифицирован</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plashki / Action Plates */}
      <div className="px-4 space-y-2.5">
        {/* Plate 1: KYC & Limits */}
        <div
          onClick={onOpenKyc}
          className="glass-panel rounded-2xl p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer active:scale-98 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Уровень верификации</div>
              <div className="text-[11px] text-slate-400">{user.kycTier}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Plate 2: Dedicated Settings Plate! */}
        <div
          onClick={() => setIsSettingsOpen(true)}
          className="glass-panel rounded-2xl p-4 bg-slate-900/90 border border-slate-800 hover:border-blue-500/30 cursor-pointer active:scale-98 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Настройки безопасности</div>
              <div className="text-[11px] text-slate-400">3D Secure, банкоматы, Face ID, чеки</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Plate 3: Support & Community */}
        <a
          href="https://t.me"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200 active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Служба заботы и поддержки</div>
              <div className="text-[11px] text-slate-400">Отвечаем круглосуточно 24/7</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </a>
      </div>

      <div className="text-center pt-2 text-[10px] text-slate-500 font-mono">
        NovaPay TMA v1.2.0 • Sandbox Protocol
      </div>

      {/* Settings Modal Sheet */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </motion.div>
  );
};
