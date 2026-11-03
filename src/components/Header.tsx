import React from 'react';
import { Bell } from 'lucide-react';
import type { UserProfile } from '../types';
import { getFallbackAvatar } from '../data/mockData';

interface HeaderProps {
  user: UserProfile;
  hasUnreadNotifications?: boolean;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasUnreadNotifications = false,
  onOpenProfile,
  onOpenNotifications,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#080a0f]/85 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Compact User Pill */}
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 active:scale-95 transition-all shadow-sm"
      >
        <img
          src={user.avatar}
          alt={user.name}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(user.name);
          }}
          className="w-7 h-7 rounded-full object-cover"
        />
        <span className="text-xs font-semibold text-slate-200">
          {user.username}
        </span>
      </button>

      {/* Right: Only Notification Bell with active click */}
      <button
        aria-label="Уведомления"
        onClick={onOpenNotifications}
        className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center relative active:scale-95 transition-all shadow-sm"
      >
        <Bell className="w-4 h-4" />
        {hasUnreadNotifications && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </button>
    </header>
  );
};
