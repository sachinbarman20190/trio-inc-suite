'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { DoubtItem, DoubtComment } from '@/lib/types';
import { 
  HelpCircle, 
  Upload, 
  Image as ImageIcon, 
  Film, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  HardDrive, 
  Tag, 
  Send, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';

export function DoubtsAndUpdatesModule() {
  const { teamMember } = useAuth();
  const [items, setItems] = useState<DoubtItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DoubtItem | null>(null);
  const [comments, setComments] = useState<DoubtComment[]>([]);
  const [commentText, setCommentText] = useState('');

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'doubt' | 'update' | 'bug' | 'design'>('doubt');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Firestore real-time listener for doubts and updates
  useEffect(() => {
    const q = query(collection(db, 'doubts_and_updates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DoubtItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'doubt',
          status: data.status || 'open',
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType || 'none',
          fileName: data.fileName,
          driveFileId: data.driveFileId,
          createdBy: data.createdBy || '',
          creatorName: data.creatorName || 'Team Member',
          creatorEmail: data.creatorEmail || '',
          createdAt: data.createdAt || new Date().toISOString(),
          commentsCount: data.commentsCount || 0,
        });
      });
      setItems(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'doubts_and_updates');
    });

    return () => unsubscribe();
  }, []);

  // Comments listener when an item is selected
  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const q = query(
      collection(db, 'doubts_comments'),
      where('doubtId', '==', selectedItem.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DoubtComment[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          doubtId: data.doubtId,
          authorUid: data.authorUid,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          content: data.content,
          createdAt: data.createdAt,
        });
      });
      setComments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'doubts_comments');
    });

    return () => unsubscribe();
  }, [selectedItem]);

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teamMember) return;

    setIsUploading(true);
    try {
      let mediaUrl = '';
      let mediaType: 'image' | 'video' | 'none' = 'none';
      let driveFileId = '';
      let fileName = '';

      // If file selected, route to Admin 5 TB Google Drive
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('category', 'doubts_and_updates');

        const res = await fetch('/api/drive/upload', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        mediaUrl = json.data.previewUrl;
        driveFileId = json.data.fileId;
        fileName = fileToUpload.name;
        mediaType = fileToUpload.type.startsWith('video') ? 'video' : 'image';
      }

      await addDoc(collection(db, 'doubts_and_updates'), {
        title: title.trim(),
        description: description.trim(),
        category,
        status: 'open',
        mediaUrl: mediaUrl || null,
        mediaType,
        fileName: fileName || null,
        driveFileId: driveFileId || null,
        createdBy: teamMember.uid || teamMember.email,
        creatorName: teamMember.displayName,
        creatorEmail: teamMember.email,
        createdAt: new Date().toISOString(),
        commentsCount: 0,
      });

      setTitle('');
      setDescription('');
      setCategory('doubt');
      setFileToUpload(null);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(`Error creating update: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedItem || !teamMember) return;

    try {
      await addDoc(collection(db, 'doubts_comments'), {
        doubtId: selectedItem.id,
        authorUid: teamMember.uid || teamMember.email,
        authorName: teamMember.displayName,
        authorEmail: teamMember.email,
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
      });

      // Increment comment count on parent
      await updateDoc(doc(db, 'doubts_and_updates', selectedItem.id), {
        commentsCount: (selectedItem.commentsCount || 0) + 1,
      });

      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'open' | 'in-review' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'doubts_and_updates', id), { status: newStatus });
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update doubt status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Doubt Clearing & Work Updates
          </h2>
          <p className="text-sm text-slate-400">
            Post print file bugs, design queries, and work progress with screenshots & screen recordings uploaded straight to the Admin 5 TB Drive.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="cursor-pointer min-h-[44px] inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 z-20"
        >
          <Upload className="w-4 h-4" />
          Post Query / Update
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Feed list */}
        <div className={`space-y-3.5 ${selectedItem ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {items.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">No doubts or work updates posted yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload garment mockup issues, DTF printing questions, or ad footage queries with media attachments.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const categoryColors = {
                doubt: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                update: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
                bug: 'bg-red-500/10 text-red-400 border-red-500/30',
                design: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
              }[item.category];

              const statusColors = {
                open: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                'in-review': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              }[item.status];

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`cursor-pointer bg-slate-900 border rounded-xl p-4 transition-all hover:border-slate-700 ${
                    isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${categoryColors}`}>
                        {item.category.toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors}`}>
                        {item.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                    <span className="font-medium text-slate-300">By {item.creatorName}</span>

                    <div className="flex items-center gap-3">
                      {item.mediaUrl && (
                        <span className="flex items-center gap-1 text-[11px] text-sky-400">
                          {item.mediaType === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          Media
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        {item.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Doubt Detail & Comment Thread */}
        {selectedItem && (
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[650px] shadow-xl">
            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Header and status toggles */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">
                    {selectedItem.category} Thread
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedItem.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Posted by {selectedItem.creatorName} ({selectedItem.creatorEmail})
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedItem.status}
                    onChange={(e) => handleStatusChange(selectedItem.id, e.target.value as any)}
                    className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in-review">In Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setComments([]);
                    }}
                    className="text-slate-500 hover:text-white p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Description body */}
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedItem.description}
              </p>

              {/* Media Preview if attached */}
              {selectedItem.mediaUrl && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                    <span className="flex items-center gap-1 text-[11px] text-sky-400">
                      <HardDrive className="w-3 h-3" /> Admin 5 TB Drive Media
                    </span>
                    <a
                      href={selectedItem.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white inline-flex items-center gap-1 text-[11px]"
                    >
                      Open Link <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {selectedItem.mediaType === 'video' ? (
                    <video
                      src={selectedItem.mediaUrl}
                      controls
                      className="w-full max-h-56 rounded-lg bg-black"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedItem.mediaUrl}
                      alt="Doubt Attachment"
                      className="w-full max-h-56 object-contain rounded-lg bg-black/40"
                    />
                  )}
                </div>
              )}

              {/* Comments list */}
              <div className="border-t border-slate-800 pt-3 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Team Discussion ({comments.length})
                </h4>

                {comments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No replies yet. Advise on next steps below.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-indigo-300">{c.authorName}</span>
                        <span className="text-slate-500">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a solution or team note..."
                className="flex-1 min-h-[44px] bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Post New Query or Work Update
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Color mismatch on Oversized Hoodie DTF print"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="doubt">Doubt / Question</option>
                    <option value="update">Progress Update</option>
                    <option value="bug">Print / Technical Bug</option>
                    <option value="design">Design Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Media Storage Quota</label>
                  <div className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                    <span>Admin 5 TB Drive</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Explain the doubt, print specifications, supplier query, or update in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Attach Screenshot / Screen Recording (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md"
                >
                  {isUploading ? 'Uploading to 5TB Drive...' : 'Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
