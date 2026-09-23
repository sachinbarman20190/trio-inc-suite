'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '@/lib/notification-context';
import { useAuth } from '@/lib/auth-context';
import { Video, ExternalLink, PowerOff, Sparkles } from 'lucide-react';
import { DEFAULT_ADMIN_EMAIL } from '@/lib/types';

export function LiveMeetingBanner() {
  const { activeMeeting, endActiveMeeting, setActiveTab } = useNotification();
  const { teamMember, isAdmin } = useAuth();
  const [isEnding, setIsEnding] = useState(false);

  if (!activeMeeting || !activeMeeting.isActive || !activeMeeting.meetUrl) {
    return null;
  }

  const isUserAdmin = 
    isAdmin || 
    teamMember?.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
    teamMember?.role === 'admin';

  const handleEndMeeting = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to end this Google Meet for all team members? This will dismiss the live broadcast across all screens.'
    );
    if (!confirmed) return;

    try {
      setIsEnding(true);
      await endActiveMeeting();
    } catch (err) {
      console.error('Failed to end meeting:', err);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl mx-auto px-2 sm:px-6 pt-2 pb-1 shrink-0 z-30"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900/95 to-emerald-950/80 border border-red-500/50 p-3 sm:p-4 shadow-xl shadow-red-950/30 backdrop-blur-xl">
          {/* Animated subtle glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-emerald-500/10 pointer-events-none animate-pulse" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
            {/* Left: Pulsing status indicator and details */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Radar pulse beacon */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shrink-0 shadow-lg shadow-red-500/20">
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <Video className="w-5 h-5 animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    Live Meeting in Progress
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {activeMeeting.startedBy || 'Sachin'} started a sync meeting
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {activeMeeting.title || 'Trio Operations Sync'}
                  </h4>
                  <span className="text-[11px] text-slate-400 sm:hidden">
                    &bull; {activeMeeting.startedBy?.split(' ')[0] || 'Sachin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick action buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
              {/* Hub shortcut */}
              <button
                onClick={() => setActiveTab('meetings')}
                className="cursor-pointer min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all hidden lg:inline-flex items-center gap-1.5"
                title="Open Google Meet Hub"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Meet Hub</span>
              </button>

              {/* Join Meet Now CTA button */}
              <a
                href={activeMeeting.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer min-h-[40px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 touch-manipulation"
              >
                <Video className="w-4 h-4 fill-slate-950" />
                <span>Join Meet Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Admin End Meeting Button */}
              {isUserAdmin && (
                <button
                  onClick={handleEndMeeting}
                  disabled={isEnding}
                  className="cursor-pointer min-h-[40px] inline-flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 text-xs font-bold px-3 sm:px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 touch-manipulation shadow-md"
                  title="Conclude sync and dismiss banner for all 3 members"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>{isEnding ? 'Ending...' : 'End for All'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
