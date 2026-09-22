'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { AdCreative } from '@/lib/types';
import { 
  FolderGit2, 
  UploadCloud, 
  Film, 
  Image as ImageIcon, 
  Download, 
  ExternalLink, 
  HardDrive, 
  Trash2, 
  Filter, 
  Sparkles,
  Share2
} from 'lucide-react';

export function AdVideoRepositoryModule() {
  const { teamMember } = useAuth();
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [campaign, setCampaign] = useState('');
  const [platform, setPlatform] = useState<'Instagram' | 'Facebook' | 'TikTok' | 'YouTube' | 'Other'>('Instagram');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Firestore listener for ad creatives
  useEffect(() => {
    const q = query(collection(db, 'ad_creatives'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AdCreative[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title || '',
          campaign: data.campaign || 'General POD Ads',
          platform: data.platform || 'Instagram',
          mediaType: data.mediaType || 'video',
          driveFileId: data.driveFileId || '',
          previewUrl: data.previewUrl || '',
          downloadUrl: data.downloadUrl || data.previewUrl || '',
          fileSize: data.fileSize || 'HD File',
          uploadedBy: data.uploadedBy || '',
          uploaderName: data.uploaderName || 'Team Member',
          createdAt: data.createdAt || new Date().toISOString(),
          tags: data.tags || [],
        });
      });
      setCreatives(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'ad_creatives');
    });

    return () => unsubscribe();
  }, []);

  const handleUploadCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileToUpload || !teamMember) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('category', 'ad_creatives');

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const uploaded = json.data;
      const mediaType = fileToUpload.type.startsWith('video') ? 'video' : 'image';

      await addDoc(collection(db, 'ad_creatives'), {
        title: title.trim(),
        campaign: campaign.trim() || 'General Ads',
        platform,
        mediaType,
        driveFileId: uploaded.fileId,
        previewUrl: uploaded.previewUrl,
        downloadUrl: uploaded.downloadUrl,
        fileSize: uploaded.size || 'HD',
        uploadedBy: teamMember.email,
        uploaderName: teamMember.displayName,
        createdAt: new Date().toISOString(),
        tags: [platform, campaign.trim() || 'Ad'],
      });

      setTitle('');
      setCampaign('');
      setFileToUpload(null);
      setShowUploadModal(false);
    } catch (err: any) {
      alert(`Upload to Admin Drive failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this creative from repository?')) return;
    try {
      await deleteDoc(doc(db, 'ad_creatives', id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filtered = filterPlatform === 'All'
    ? creatives
    : creatives.filter((c) => c.platform === filterPlatform);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-rose-400" />
            Centralized Ad Video & Creative Repository
          </h2>
          <p className="text-sm text-slate-400">
            Dedicated asset vault for all 3 members to upload and pull high-res Reels, TikToks, and mockups from Sachin&apos;s 5 TB Drive quota.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="cursor-pointer min-h-[44px] inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20 z-20"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Ad Asset to 5TB Drive
        </button>
      </div>

      {/* Filter Tabs & Storage Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full sm:w-auto touch-pan-x">
          {['All', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Other'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterPlatform(tab)}
              className={`cursor-pointer min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterPlatform === tab
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 self-start sm:self-auto shrink-0">
          <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Storage Source: <strong className="text-white">Admin 5 TB Drive</strong></span>
        </div>
      </div>

      {/* Creatives Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No ad creatives found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your high-definition Reels, MP4 ad mockups, or ad copies. All team members can preview and download directly.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all"
            >
              {/* Media Preview Player/Thumbnail */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-slate-800">
                {item.mediaType === 'video' ? (
                  <video
                    src={item.previewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="bg-black/70 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                    {item.mediaType === 'video' ? <Film className="w-2.5 h-2.5 text-rose-400" /> : <ImageIcon className="w-2.5 h-2.5 text-sky-400" />}
                    {item.platform}
                  </span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-400">{item.campaign}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Delete creative"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Uploaded by: <strong className="text-slate-300 font-medium">{item.uploaderName}</strong></span>
                  <span className="font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded text-slate-300">{item.fileSize}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <a
                  href={item.downloadUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors shadow-md z-10"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Media
                </a>

                <a
                  href={item.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors z-10"
                  title="Open in Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-rose-400" />
                Upload Marketing Asset to Admin 5TB Drive
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadCreative} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acid Wash Drop Reel - Version 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Drop 2026"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Instagram">Instagram (Reels)</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook Ads</option>
                    <option value="YouTube">YouTube Shorts</option>
                    <option value="Other">Other Media</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Video or Image File
                </label>
                <input
                  type="file"
                  required
                  accept="video/*,image/*"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-2"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
                <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Files are stored in Admin&apos;s 5 TB Google Drive quota. 0 cost or storage impact on members.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md"
                >
                  {isUploading ? 'Streaming to 5TB Drive...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
