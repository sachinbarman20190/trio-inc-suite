'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { MeetingItem } from '@/lib/types';
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
  Users
} from 'lucide-react';

export function MeetingHubModule() {
  const { teamMember, isAdmin } = useAuth();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Firestore real-time listener for meetings
  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('scheduledTime', 'asc'));
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

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetLink.trim() || !teamMember) return;

    setLoading(true);
    try {
      let formattedLink = meetLink.trim();
      if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
        formattedLink = `https://${formattedLink}`;
      }

      await addDoc(collection(db, 'meetings'), {
        title: title.trim(),
        agenda: agenda.trim(),
        meetLink: formattedLink,
        scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
        status: 'upcoming',
        createdBy: teamMember.email,
        creatorName: teamMember.displayName,
        createdAt: new Date().toISOString(),
      });

      setTitle('');
      setAgenda('');
      setMeetLink('');
      setScheduledTime('');
      setShowModal(false);
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'upcoming' | 'in-progress' | 'completed') => {
    try {
      await updateDoc(doc(db, 'meetings', id), { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to remove this meeting entry?')) return;
    try {
      await deleteDoc(doc(db, 'meetings', id));
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  // Generate an instant Google Meet URL for the 3 members
  const generateNewMeetLink = () => {
    setMeetLink('https://meet.google.com/new');
  };

  const activeMeeting = meetings.find((m) => m.status === 'in-progress');

  return (
    <div className="space-y-6">
      {/* Active Meeting Banner if any is in-progress */}
      {activeMeeting && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/80 via-teal-900/70 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    MEETING IN PROGRESS
                  </span>
                  <span className="text-xs text-slate-400">Scheduled by {activeMeeting.creatorName}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{activeMeeting.title}</h3>
                {activeMeeting.agenda && (
                  <p className="text-sm text-slate-300 line-clamp-1">{activeMeeting.agenda}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href={activeMeeting.meetLink}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <Video className="w-4 h-4" />
                Join Google Meet
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={() => handleUpdateStatus(activeMeeting.id, 'completed')}
                className="cursor-pointer min-h-[44px] px-3.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
                title="Mark meeting concluded"
              >
                Mark Finished
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-400" />
            Business Meeting & Google Meet Hub
          </h2>
          <p className="text-sm text-slate-400">
            One-click Google Meet synchronizer for daily design standups, supplier discussions, and POD reviews.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="cursor-pointer min-h-[44px] inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          Schedule Meet
        </button>
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <Video className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-300">No scheduled meetings</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Schedule your first Google Meet sync. Instant link creation and one-click team join are enabled.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="cursor-pointer min-h-[44px] mt-4 inline-flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Schedule Now
            </button>
          </div>
        ) : (
          meetings.map((meeting) => {
            const isUpcoming = meeting.status === 'upcoming';
            const isInProgress = meeting.status === 'in-progress';
            const isCompleted = meeting.status === 'completed';

            const meetingDate = new Date(meeting.scheduledTime);

            return (
              <div
                key={meeting.id}
                className={`flex flex-col justify-between bg-slate-900/90 border rounded-xl p-5 transition-all shadow-md hover:border-slate-700 ${
                  isInProgress
                    ? 'border-emerald-500/50 bg-slate-900/90'
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

                    <div className="flex items-center gap-1 text-slate-500">
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Delete meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1.5">{meeting.title}</h3>
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
                    className="cursor-pointer min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Meet
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {isUpcoming && (
                    <button
                      onClick={() => handleUpdateStatus(meeting.id, 'in-progress')}
                      className="cursor-pointer min-h-[44px] px-3 py-2 text-xs bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 border border-slate-700 rounded-xl transition-colors"
                      title="Set to In Progress"
                    >
                      Start
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => handleUpdateStatus(meeting.id, 'completed')}
                      className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors"
                      title="End Meeting"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-sky-400" />
                Schedule 3-Member Team Meet
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POD Daily Sync / Design Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Agenda & Topics</label>
                <textarea
                  rows={2}
                  placeholder="Discuss DTF printing samples, Instagram ad budget, supplier delays..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2 focus:border-sky-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Google Meet URL</label>
                  <button
                    type="button"
                    onClick={generateNewMeetLink}
                    className="cursor-pointer text-[11px] text-sky-400 hover:underline flex items-center gap-1 py-1"
                  >
                    <Sparkles className="w-3 h-3" /> Quick Meet Link
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md"
                >
                  {loading ? 'Creating...' : 'Save & Publish Meet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
