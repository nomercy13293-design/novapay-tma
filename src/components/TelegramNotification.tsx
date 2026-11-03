import React from 'react';
import { Bot, X } from 'lucide-react';

interface TelegramNotificationProps {
  message: string | null;
  onDismiss: () => void;
}

export const TelegramNotification: React.FC<TelegramNotificationProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div className="fixed top-2 inset-x-3 z-50 animate-slide-down">
      <div className="glass-panel rounded-2xl p-3.5 bg-slate-900/95 border border-blue-500/30 shadow-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">NovaPay Bot</span>
            <span className="text-[10px] text-slate-400">сейчас</span>
          </div>
          <p className="text-xs text-slate-200 mt-0.5 leading-snug">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
