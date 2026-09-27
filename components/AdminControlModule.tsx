'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { 
  Shield, 
  Users, 
  HardDrive, 
  Mail, 
  UserCheck, 
  Check, 
  AlertTriangle, 
  Key, 
  Settings,
  Plus,
  Bell,
  BellRing,
  Volume2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export function AdminControlModule() {
  const { teamMember, isAdmin, whitelist, updateWhitelistMember } = useAuth();
  const { 
    webNotificationsEnabled, 
    permissionStatus, 
    toggleWebNotifications, 
    testNotificationSound 
  } = useNotification();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditName(whitelist[idx].displayName);
    setEditEmail(whitelist[idx].email);
    setEditTitle(whitelist[idx].title || '');
  };

  const handleSaveMember = (idx: number) => {
    updateWhitelistMember(idx, {
      displayName: editName.trim(),
      email: editEmail.trim(),
      title: editTitle.trim(),
    });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Admin Control & Team Whitelist Security
        </h2>
        <p className="text-sm text-slate-400">
          Strict security perimeter: Only authorized team accounts can enter Trio INC. All storage is charged exclusively to Admin Sachin Barman&apos;s 5 TB Google Drive quota.
        </p>
      </div>

      {/* 5 TB Storage Architecture Card */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-md">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  SERVER-SIDE ROUTED
                </span>
                <span className="text-xs text-slate-400">Google Drive API v3</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Admin 5 TB Google Drive Infrastructure</h3>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Team Storage Cost:</div>
            <div className="text-lg font-black text-emerald-400">0.00 ₹ / $ (Free Tier)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Voice Messaging:</span>
            <p className="text-xs text-slate-200">
              Browser WebM audio streams to <code className="text-sky-300 text-[11px]">/api/drive/upload</code> &bull; Saved in Admin Drive &bull; Synced to Firestore
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Ad Video & Creatives:</span>
            <p className="text-xs text-slate-200">
              High-res MP4/WebM reels up to 50MB routed to Admin 5 TB Drive folder with direct stream & download links.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Bug & Doubt Media:</span>
            <p className="text-xs text-slate-200">
              Screenshots and screen recordings stored directly in Admin Drive without impacting member Google quotas.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Notifications & Web Notification API (PWA Background Support) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-md">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">In-App & PWA Real-time Notifications</h3>
                {webNotificationsEnabled && permissionStatus === 'granted' ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Background Active
                  </span>
                ) : permissionStatus === 'denied' ? (
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                    Browser Blocked
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded-full border border-slate-700">
                    In-App Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Material 3 glassmorphism floating toasts, dynamic tab badges, and native Web Notifications when tab is backgrounded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={testNotificationSound}
              className="cursor-pointer min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors flex items-center gap-1.5"
              title="Test synthesized Web Audio chime"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Test Chime</span>
            </button>

            <button
              type="button"
              onClick={toggleWebNotifications}
              className={`cursor-pointer min-h-[38px] px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                webNotificationsEnabled && permissionStatus === 'granted'
                  ? 'bg-rose-600/80 hover:bg-rose-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {webNotificationsEnabled && permissionStatus === 'granted'
                  ? 'Disable Web Push'
                  : 'Enable Notifications'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Chat & Voice Alerts
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triggers a floating toast and audio chime when a teammate posts while you are in another tab or view.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Doubts & Priority Updates
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time alert chime whenever a member posts a design doubt, bug report, or priority task update.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Sales Milestones
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triumphant celebratory chime and milestone toast whenever a new sale is logged in the POD profit engine.
            </p>
          </div>
        </div>
      </div>

      {/* Authorized Team Whitelist Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Designated Team Whitelist
            </h3>
            <p className="text-xs text-slate-400">
              Any Google account outside these designated Gmail addresses is automatically rejected with an Access Denied barrier.
            </p>
          </div>

          <div className="text-xs bg-amber-500/10 text-amber-400 font-semibold px-3 py-1 rounded-full border border-amber-500/20">
            Capacity: {whitelist.length} Authorized Accounts
          </div>
        </div>

        <div className="space-y-4">
          {whitelist.map((member, idx) => {
            const isEditing = editingIndex === idx;
            const isRootAdmin = member.role === 'admin';

            return (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                    isRootAdmin 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  }`}>
                    {member.displayName.substring(0, 2).toUpperCase()}
                  </div>

                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Gmail Address"
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title / Responsibilities"
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{member.displayName}</h4>
                        {isRootAdmin ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Root Admin (5 TB Owner)
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            Partner Member
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-mono mt-0.5 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {member.email}
                      </p>
                      {member.title && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{member.title}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveMember(idx)}
                        className="cursor-pointer min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-md transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="cursor-pointer min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    isAdmin && (
                      <button
                        onClick={() => startEdit(idx)}
                        className="cursor-pointer min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                      >
                        Configure Slot
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
