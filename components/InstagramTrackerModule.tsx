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
import { InstagramPost } from '@/lib/types';
import { 
  Instagram, 
  Plus, 
  Trophy, 
  Eye, 
  Heart, 
  Share2, 
  ExternalLink, 
  TrendingUp, 
  Trash2, 
  UserCheck, 
  Award, 
  Flame 
} from 'lucide-react';

export function InstagramTrackerModule() {
  const { teamMember, whitelist } = useAuth();
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form states
  const [selectedMemberEmail, setSelectedMemberEmail] = useState(whitelist[0]?.email || '');
  const [accountHandle, setAccountHandle] = useState('@triopod.official');
  const [postUrl, setPostUrl] = useState('');
  const [views, setViews] = useState<number>(12500);
  const [impressions, setImpressions] = useState<number>(18200);
  const [likes, setLikes] = useState<number>(840);
  const [postDate, setPostDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'instagram_posts'), orderBy('postDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: InstagramPost[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          memberEmail: data.memberEmail || '',
          memberName: data.memberName || 'Team Member',
          accountHandle: data.accountHandle || '@triopod',
          postUrl: data.postUrl || '',
          views: Number(data.views) || 0,
          impressions: Number(data.impressions) || 0,
          likes: Number(data.likes) || 0,
          postDate: data.postDate || new Date().toISOString().split('T')[0],
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setPosts(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'instagram_posts');
    });

    return () => unsubscribe();
  }, []);

  const handleLogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberEmail || !accountHandle.trim()) return;

    const matchedMember = whitelist.find((m) => m.email.toLowerCase() === selectedMemberEmail.toLowerCase());
    const memberName = matchedMember ? matchedMember.displayName : 'Team Member';

    try {
      await addDoc(collection(db, 'instagram_posts'), {
        memberEmail: selectedMemberEmail,
        memberName,
        accountHandle: accountHandle.trim(),
        postUrl: postUrl.trim(),
        views: Number(views) || 0,
        impressions: Number(impressions) || 0,
        likes: Number(likes) || 0,
        postDate,
        createdAt: new Date().toISOString(),
      });

      setPostUrl('');
      setShowLogModal(false);
    } catch (err) {
      console.error('Error logging reel post:', err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Remove this post entry?')) return;
    try {
      await deleteDoc(doc(db, 'instagram_posts', id));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Compute 3-member Leaderboard
  const memberStats = whitelist.map((member) => {
    const memberPosts = posts.filter((p) => p.memberEmail.toLowerCase() === member.email.toLowerCase());
    const totalViews = memberPosts.reduce((acc, curr) => acc + curr.views, 0);
    const totalLikes = memberPosts.reduce((acc, curr) => acc + curr.likes, 0);
    const totalImpressions = memberPosts.reduce((acc, curr) => acc + curr.impressions, 0);
    const highestViewed = memberPosts.reduce((max, curr) => (curr.views > max ? curr.views : max), 0);

    return {
      member,
      postCount: memberPosts.length,
      totalViews,
      totalLikes,
      totalImpressions,
      highestViewed,
    };
  }).sort((a, b) => b.totalViews - a.totalViews);

  const totalTeamViews = posts.reduce((acc, curr) => acc + curr.views, 0);
  const totalTeamLikes = posts.reduce((acc, curr) => acc + curr.likes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            Instagram Performance & Reel Views Tracker
          </h2>
          <p className="text-sm text-slate-400">
            Track organic reach, impressions, and viral reel metrics across the 3 startup partners with daily consistency rankings.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-pink-600/20"
        >
          <Plus className="w-4 h-4" />
          Log Reel Performance
        </button>
      </div>

      {/* Top Level Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Team Organic Views</span>
            <Eye className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalTeamViews.toLocaleString()}</p>
          <p className="text-[11px] text-pink-400 font-medium mt-1">Across all 3 members</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Team Likes & Saves</span>
            <Heart className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalTeamLikes.toLocaleString()}</p>
          <p className="text-[11px] text-purple-400 font-medium mt-1">Audience engagement</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Reels & Posts Logged</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{posts.length}</p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Continuous posting cadence</p>
        </div>
      </div>

      {/* 3-Member Leaderboard Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          3-Member Consistency & Views Leaderboard
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {memberStats.map((stat, idx) => {
            const isRank1 = idx === 0;
            return (
              <div
                key={stat.member.email}
                className={`relative rounded-xl p-4 border transition-all ${
                  isRank1
                    ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                {isRank1 && (
                  <div className="absolute -top-3 right-4 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <Award className="w-3 h-3" /> #1 Views Leader
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                    {stat.member.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{stat.member.displayName}</h4>
                    <p className="text-xs text-slate-400">{stat.member.role.toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Views:</span>
                    <span className="font-bold text-white font-mono">{stat.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Likes:</span>
                    <span className="font-bold text-purple-300 font-mono">{stat.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Posts Deployed:</span>
                    <span className="font-bold text-slate-200">{stat.postCount} reels</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Best Reel Views:</span>
                    <span className="font-bold text-emerald-400 font-mono">{stat.highestViewed.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Posts Table / Log List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Logged Performance Entries</h3>
          <span className="text-xs text-slate-400">{posts.length} entries</span>
        </div>

        {posts.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No reels logged yet. Log the latest viral post to start calculating team rankings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Views</th>
                  <th className="py-2.5 px-3">Impressions</th>
                  <th className="py-2.5 px-3">Likes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{post.postDate}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{post.memberName}</td>
                    <td className="py-2.5 px-3 text-pink-400 font-mono">{post.accountHandle}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400 font-mono">
                      {post.views.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{post.impressions.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-purple-300 font-mono">{post.likes.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {post.postUrl && (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white"
                            title="View Reel"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-slate-500 hover:text-red-400"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Performance Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-500" />
                Log Reel / Post Performance
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleLogPost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Member (3-Member Team)</label>
                <select
                  value={selectedMemberEmail}
                  onChange={(e) => setSelectedMemberEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:border-pink-500 focus:outline-none"
                >
                  {whitelist.map((m) => (
                    <option key={m.email} value={m.email}>
                      {m.displayName} ({m.title || m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Instagram Account Handle</label>
                <input
                  type="text"
                  required
                  placeholder="@triopod.official"
                  value={accountHandle}
                  onChange={(e) => setAccountHandle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reel / Post URL</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/reel/..."
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Views</label>
                  <input
                    type="number"
                    required
                    value={views}
                    onChange={(e) => setViews(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-2.5 py-2 focus:border-pink-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Impressions</label>
                  <input
                    type="number"
                    value={impressions}
                    onChange={(e) => setImpressions(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-2.5 py-2 focus:border-pink-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Likes</label>
                  <input
                    type="number"
                    value={likes}
                    onChange={(e) => setLikes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-2.5 py-2 focus:border-pink-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date Posted</label>
                <input
                  type="date"
                  required
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:border-pink-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-colors shadow-md"
                >
                  Save Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
