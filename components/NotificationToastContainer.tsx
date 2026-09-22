'use client';

import React from 'react';
import { useNotification } from '@/lib/notification-context';
import { 
  MessageSquare, 
  HelpCircle, 
  Sparkles, 
  X, 
  ArrowRight, 
  Mic, 
  Info,
  DollarSign
} from 'lucide-react';
import { DashboardModuleId } from '@/components/QuickNavigationCommandPalette';

export function NotificationToastContainer() {
  const { activeToasts, dismissToast, setActiveTab } = useNotification();

  if (activeToasts.length === 0) return null;

  const handleOpen = (targetTab: DashboardModuleId, toastId: string) => {
    setActiveTab(targetTab);
    dismissToast(toastId);
  };

  return (
    <aside 
      aria-label="Real-time Team Notifications"
      className="fixed top-3 sm:top-4 inset-x-3 sm:inset-x-auto sm:right-4 z-50 flex flex-col items-center sm:items-end gap-2.5 pointer-events-none"
    >
      {activeToasts.map((toast) => {
        const isSales = toast.type === 'sales';
        const isDoubt = toast.type === 'doubt' || toast.type === 'update';
        const isVoice = toast.type === 'voice';

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto w-full max-w-sm sm:max-w-md bg-slate-900/95 border border-white/10 shadow-2xl p-3 rounded-2xl backdrop-blur-xl flex items-start gap-3 text-slate-100 transition-all duration-200 hover:border-white/20 hover:shadow-sky-500/10"
          >
            {/* Sender Avatar / Category Badge */}
            <div className="shrink-0 mt-0.5">
              {isSales ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/30">
                  <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
                </div>
              ) : isDoubt ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <HelpCircle className="w-5 h-5" />
                </div>
              ) : isVoice ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
                  <Mic className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-xs shadow-md">
                  {toast.senderAvatar || <MessageSquare className="w-5 h-5 text-sky-400" />}
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  Just now
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug line-clamp-2">
                {toast.snippet}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleOpen(toast.targetTab, toast.id)}
                  className={`cursor-pointer px-3 py-1 min-h-[28px] rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                    isSales
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : isDoubt
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="cursor-pointer min-h-[28px] px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg text-xs font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Close Cross */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
