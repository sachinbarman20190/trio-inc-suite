'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { MeetingItem, DEFAULT_ADMIN_EMAIL } from '@/lib/types';
import { 
  Video, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  Trash2,
  Users,
  Shield,
  PowerOff,
  Link2,
  Copy,
  Check,
  Edit3,
  Flame,
  AlertCircle
} from 'lucide-react';

export function MeetingHubModule() {
  const { teamMember, isAdmin } = useAuth();
  const { activeMeeting, broadcastMeeting, endActiveMeeting } = useNotification();

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPermanentSettingsModal, setShowPermanentSettingsModal] = useState(false);

  // Active meeting creation state
  const [meetMode, setMeetMode] = useState<'instant' | 'permanent'>('instant');
  const [broadcastTitle, setBroadcastTitle] = useState('Trio Operations Sync');
  const [pastedMeetUrl, setPastedMeetUrl] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Permanent Room Settings (stored in system/meeting_settings)
  const [permanentMeetUrl, setPermanentMeetUrl] = useState('https://meet.google.com/trio-pod-sync');
  const [permanentTitle, setPermanentTitle] = useState('Trio Operations Sync');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Schedule Modal State
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleAgenda, setScheduleAgenda] = useState('');
  const [scheduleMeetLink, setScheduleMeetLink] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const instantInputRef = useRef<HTMLInputElement>(null);

  // Check if current user is Admin (Sachin Barman)
  const isUserAdmin = 
    isAdmin || 
    teamMember?.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
    teamMember?.role === 'admin';

  // Real-time listener for scheduled meetings
  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('scheduledTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: MeetingItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          agenda: data.agenda || '',
          meetLink: data.meetLink || '',
          scheduledTime: data.scheduledTime || new Date().toISOString(),
          status: data.status || 'upcoming',
          createdBy: data.createdBy || '',
          creatorName: data.creatorName || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setMeetings(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'meetings');
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for Permanent Room Settings (system/meeting_settings)
  useEffect(() => {
    const settingsDocRef = doc(db, 'system', 'meeting_settings');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.permanentMeetUrl) {
          setPermanentMeetUrl(data.permanentMeetUrl);
        }
        if (data.defaultTitle) {
          setPermanentTitle(data.defaultTitle);
        }
      }
    }, (error) => {
      console.debug('Meeting settings doc init:', error);
    });

    return () => unsubscribe();
  }, []);

  // Auto-focus input when instant mode is selected in Start Modal
  useEffect(() => {
    if (showStartModal && meetMode === 'instant') {
      setTimeout(() => {
        instantInputRef.current?.focus();
      }, 150);
    }
  }, [showStartModal, meetMode]);

  // Mode A: Launch instant room on Google Meet
  const handleLaunchInstantRoom = () => {
    window.open('https://meet.google.com/new', '_blank');
    // Ensure modal is open with auto-focused input
    setShowStartModal(true);
    setMeetMode('instant');
  };

  // Broadcast Meeting to Firestore (Mode A or Mode B)
  const handleBroadcast = async (urlToBroadcast: string, titleToBroadcast: string) => {
    if (!urlToBroadcast.trim() || !teamMember) return;

    let formattedUrl = urlToBroadcast.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      setIsBroadcasting(true);

      // 1. Broadcast via Notification Context (updates system/active_meeting & posts to chat)
      await broadcastMeeting(formattedUrl, titleToBroadcast);

      // 2. Also record in meetings collection for history
      await addDoc(collection(db, 'meetings'), {
        title: titleToBroadcast.trim() || 'Trio Operations Sync',
        agenda: 'Live meeting broadcast initiated by Admin',
        meetLink: formattedUrl,
        scheduledTime: new Date().toISOString(),
        status: 'in-progress',
        createdBy: teamMember.uid || teamMember.email,
        creatorName: teamMember.displayName || 'Sachin Barman',
        createdAt: new Date().toISOString(),
      });

      setShowStartModal(false);
      setPastedMeetUrl('');
    } catch (err) {
      console.error('Failed to broadcast meeting:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Mode B: Launch & Broadcast Permanent Room with single tap
  const handleLaunchAndBroadcastPermanent = async () => {
    if (!permanentMeetUrl) return;
    window.open(permanentMeetUrl, '_blank');
    await handleBroadcast(permanentMeetUrl, permanentTitle);
  };

  // Save Permanent Room Settings to Firestore
  const handleSavePermanentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permanentMeetUrl.trim() || !teamMember) return;

    let cleanUrl = permanentMeetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      setIsSavingSettings(true);
      await setDoc(doc(db, 'system', 'meeting_settings'), {
        permanentMeetUrl: cleanUrl,
        defaultTitle: permanentTitle.trim() || 'Trio Operations Sync',
        updatedAt: serverTimestamp(),
        updatedBy: teamMember.displayName || 'Sachin Barman',
      }, { merge: true });
      setShowPermanentSettingsModal(false);
    } catch (err) {
      console.error('Failed to save meeting settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // End Meeting for All
  const handleEndMeeting = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to conclude this live Google Meet for all 3 members?'
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

  // Create Scheduled Meeting (For future standup)
  const handleCreateScheduledMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim() || !scheduleMeetLink.trim() || !teamMember) return;

    try {
      setScheduleLoading(true);
      let formattedLink = scheduleMeetLink.trim();
      if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
        formattedLink = `https://${formattedLink}`;
      }

      await addDoc(collection(db, 'meetings'), {
        title: scheduleTitle.trim(),
        agenda: scheduleAgenda.trim(),
        meetLink: formattedLink,
        scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
        status: 'upcoming',
        createdBy: teamMember.uid || teamMember.email,
        creatorName: teamMember.displayName || 'Sachin Barman',
        createdAt: new Date().toISOString(),
      });

      setScheduleTitle('');
      setScheduleAgenda('');
      setScheduleMeetLink('');
      setScheduledTime('');
      setShowScheduleModal(false);
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!isUserAdmin) return;
    if (!window.confirm('Delete this meeting record?')) return;
    try {
      await deleteDoc(doc(db, 'meetings', id));
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ADMIN MEET CONTROL SECTION */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Video className="w-3 h-3" /> Google Meet Hub
              </span>
              {isUserAdmin ? (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Shield className="w-3 h-3" /> Admin Host Authorized
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Team Member View
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Automated Google Meet Generator & Broadcast
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              One-click meeting generator for POD print syncs, supplier reviews, and ad discussions. Broadcasts instantly across all 3 members with audio chimes and chat integration.
            </p>
          </div>

          {/* Action Button: Start Team Meeting (Admin Restricted) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {isUserAdmin ? (
              <>
                <button
                  onClick={() => setShowStartModal(true)}
                  className="cursor-pointer min-h-[46px] w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-sky-600/30 transition-all active:scale-95 touch-manipulation"
                >
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>Start Team Meeting</span>
                </button>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="cursor-pointer min-h-[46px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl border border-slate-700 transition-all active:scale-95 touch-manipulation"
                  title="Schedule future calendar sync"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Schedule</span>
                </button>
              </>
            ) : (
              <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Host Controls restricted to Admin (Sachin Barman).</span>
              </div>
            )}
          </div>
        </div>

        {/* Mode B Quick Permanent Room Card (if Admin) */}
        {isUserAdmin && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Permanent Trio Room:</span>
                  <span className="text-slate-400 font-mono truncate max-w-[200px] sm:max-w-xs">{permanentMeetUrl}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Recurring team Meet link saved in Firestore. Launch & broadcast with a single tap.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowPermanentSettingsModal(true)}
                className="cursor-pointer min-h-[36px] px-2.5 py-1 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1"
                title="Edit saved permanent room URL"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>

              <button
                onClick={handleLaunchAndBroadcastPermanent}
                className="cursor-pointer min-h-[36px] px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 active:scale-95 touch-manipulation"
              >
                <Video className="w-3.5 h-3.5" /> Launch Permanent Room
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. REAL-TIME ACTIVE MEETING CARD (Shown whenever activeMeeting.isActive is true) */}
      {activeMeeting && activeMeeting.isActive && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900/95 to-emerald-950/80 border-2 border-red-500/60 p-5 sm:p-6 shadow-2xl shadow-red-950/40 animate-in fade-in zoom-in-95">
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500 text-red-400 shrink-0 shadow-lg shadow-red-600/30">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <Video className="w-6 h-6 relative z-10" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-red-600 text-white shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    LIVE MEETING IN PROGRESS
                  </span>
                  <span className="text-xs text-slate-300">
                    Host: <strong className="text-white">{activeMeeting.startedBy}</strong>
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white mt-1">
                  {activeMeeting.title || 'Trio Operations Sync'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {activeMeeting.meetUrl}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
              <button
                onClick={() => handleCopyLink(activeMeeting.meetUrl)}
                className="cursor-pointer min-h-[44px] px-3.5 py-2 text-xs text-slate-300 hover:text-white bg-slate-800/90 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                title="Copy meeting link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={activeMeeting.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 touch-manipulation"
              >
                <Video className="w-4 h-4 fill-slate-950" />
                <span>Join Google Meet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* End Meeting for All (Admin Only) */}
              {isUserAdmin && (
                <button
                  onClick={handleEndMeeting}
                  disabled={isEnding}
                  className="cursor-pointer min-h-[44px] inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
                  title="Conclude meeting and dismiss live banner for all members"
                >
                  <PowerOff className="w-4 h-4" />
                  <span>{isEnding ? 'Concluding...' : 'End for All'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SCHEDULED & PAST MEETINGS */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            Meeting History & Scheduled Standups
          </h3>
          <span className="text-xs text-slate-400">
            {meetings.length} recorded
          </span>
        </div>

        {meetings.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <Video className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-300">No scheduled meetings yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Start an instant Google Meet room or schedule upcoming design and supplier reviews.
            </p>
            {isUserAdmin && (
              <button
                onClick={() => setShowStartModal(true)}
                className="cursor-pointer min-h-[44px] mt-4 inline-flex items-center gap-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" /> Start First Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => {
              const isUpcoming = meeting.status === 'upcoming';
              const isInProgress = meeting.status === 'in-progress';
              const isCompleted = meeting.status === 'completed';
              const meetingDate = new Date(meeting.scheduledTime);

              return (
                <div
                  key={meeting.id}
                  className={`flex flex-col justify-between bg-slate-900/90 border rounded-2xl p-5 transition-all shadow-md hover:border-slate-700 ${
                    isInProgress
                      ? 'border-emerald-500/50 bg-slate-900/95 ring-1 ring-emerald-500/20'
                      : isUpcoming
                      ? 'border-slate-800 hover:border-sky-500/40'
                      : 'border-slate-850 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          isInProgress
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isUpcoming
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isInProgress ? 'In Progress' : isUpcoming ? 'Upcoming' : 'Completed'}
                      </span>

                      {isUserAdmin && (
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="cursor-pointer p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete meeting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white mb-1.5">{meeting.title}</h4>
                    {meeting.agenda && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {meeting.agenda}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{meetingDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Host: {meeting.creatorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors shadow-sm active:scale-95 touch-manipulation"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {isUpcoming && isUserAdmin && (
                      <button
                        onClick={() => handleBroadcast(meeting.meetLink, meeting.title)}
                        className="cursor-pointer min-h-[44px] px-3.5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95 touch-manipulation"
                        title="Broadcast as active live meeting to team now"
                      >
                        Go Live
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: START TEAM MEETING (ADMIN CONTROLS) */}
      {showStartModal && isUserAdmin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Start Team Meeting</h3>
                  <p className="text-xs text-slate-400">Broadcasts live across all 3 members with sound chime</p>
                </div>
              </div>
              <button
                onClick={() => setShowStartModal(false)}
                className="cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs (Mode A vs Mode B) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMeetMode('instant')}
                className={`cursor-pointer min-h-[40px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  meetMode === 'instant'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mode A: Instant Room</span>
              </button>
              <button
                type="button"
                onClick={() => setMeetMode('permanent')}
                className={`cursor-pointer min-h-[40px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  meetMode === 'permanent'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Mode B: Permanent Room</span>
              </button>
            </div>

            {/* Mode A Details */}
            {meetMode === 'instant' && (
              <div className="space-y-4">
                <div className="bg-sky-950/40 border border-sky-800/40 p-3.5 rounded-xl text-xs text-sky-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">Step 1: Open Google Meet Room</span>
                    <button
                      type="button"
                      onClick={handleLaunchInstantRoom}
                      className="cursor-pointer px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" /> Launch meet.google.com/new
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Step 2: Meeting Title
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Trio Operations Sync / POD Review"
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Step 3: Paste Meet Link to Broadcast
                    </label>
                    <input
                      ref={instantInputRef}
                      type="text"
                      autoFocus
                      required
                      value={pastedMeetUrl}
                      onChange={(e) => setPastedMeetUrl(e.target.value)}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm font-mono rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="cursor-pointer min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!pastedMeetUrl.trim() || isBroadcasting}
                    onClick={() => handleBroadcast(pastedMeetUrl, broadcastTitle)}
                    className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to Team'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode B Details */}
            {meetMode === 'permanent' && (
              <div className="space-y-4">
                <div className="bg-indigo-950/40 border border-indigo-800/40 p-3.5 rounded-xl text-xs text-indigo-200">
                  <p className="font-semibold">Mode B: 1-Tap Permanent Room Launch</p>
                  <p className="text-[11px] text-indigo-300/80 mt-1">
                    Launches your recurring room and broadcasts live to Suraj, Sachin, and team immediately.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={permanentTitle}
                      onChange={(e) => setPermanentTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Configured Permanent Link
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPermanentSettingsModal(true)}
                        className="cursor-pointer text-[11px] text-indigo-400 hover:underline"
                      >
                        Change Link
                      </button>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={permanentMeetUrl}
                      className="w-full bg-slate-950 border border-slate-800 text-indigo-300 text-sm font-mono rounded-xl px-3.5 py-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="cursor-pointer min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!permanentMeetUrl.trim() || isBroadcasting}
                    onClick={handleLaunchAndBroadcastPermanent}
                    className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isBroadcasting ? 'Broadcasting...' : 'Launch & Broadcast to Team'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT PERMANENT ROOM SETTINGS */}
      {showPermanentSettingsModal && isUserAdmin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-400" />
                Permanent Room Settings
              </h3>
              <button
                onClick={() => setShowPermanentSettingsModal(false)}
                className="cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePermanentSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Recurring Google Meet URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={permanentMeetUrl}
                  onChange={(e) => setPermanentMeetUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm font-mono rounded-xl px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Broadcast Title
                </label>
                <input
                  type="text"
                  value={permanentTitle}
                  onChange={(e) => setPermanentTitle(e.target.value)}
                  placeholder="Trio Operations Sync"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPermanentSettingsModal(false)}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE FUTURE MEETING */}
      {showScheduleModal && isUserAdmin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                Schedule Future Meet
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScheduledMeeting} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POD Daily Sync / Design Review"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Discuss DTF printing samples, Instagram ad budget, supplier delays..."
                  value={scheduleAgenda}
                  onChange={(e) => setScheduleAgenda(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2 focus:border-sky-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Google Meet URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={scheduleMeetLink}
                  onChange={(e) => setScheduleMeetLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md"
                >
                  {scheduleLoading ? 'Saving...' : 'Save & Publish Meet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
