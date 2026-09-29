'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  X,
  Play,
  Star,
  Film,
  Tv,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Eye,
  Search,
  Plus,
  Bookmark,
  UserMinus,
  Edit2,
  Save,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { filterItemByTimeframe, TimeframeFilter } from '@/lib/tmdb';

export interface FriendUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  friendTag: string;
  watchlistCount: number;
  watchedCount: number;
  unwatchedCount: number;
  watchedMinutes: number;
  watchlist: any[];
}

export interface FriendRequest {
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  senderTag: string;
  sentAt: string;
}

export default function FriendsManager() {
  const { showToast } = useToast();
  const {
    user,
    playMedia,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    isWatched,
    markAsUnwatched,
    updateUserFriendTag,
  } = useApp();

  const [myTag, setMyTag] = useState<string>('');
  const [tagLastChangedAt, setTagLastChangedAt] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputTag, setInputTag] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  // Editable Tag State
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [savingTag, setSavingTag] = useState(false);

  // Calculate days remaining in 30-day tag edit cooldown
  const getDaysLeftToEdit = (): number => {
    const lastChanged = tagLastChangedAt || user?.tagLastChangedAt;
    if (!lastChanged) return 0;
    const lastDate = new Date(lastChanged).getTime();
    if (isNaN(lastDate)) return 0;
    const now = Date.now();
    const diffMs = now - lastDate;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (diffMs >= thirtyDaysMs) return 0;
    const remainingMs = thirtyDaysMs - diffMs;
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  };

  const daysLeftToEdit = getDaysLeftToEdit();

  // Derive responsive display tag (from API or user context fallback)
  const displayTag =
    myTag ||
    user?.friendTag ||
    (user?.name
      ? `${user.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}#${(user.id || '1001').slice(-4).toUpperCase()}`
      : 'cinetrack#8492');

  // Fetch Friends Data from API
  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('cinetrack_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMyTag(data.friendTag || '');
        if (data.tagLastChangedAt) {
          setTagLastChangedAt(data.tagLastChangedAt);
        }
        setFriends(data.friends || []);
        setFriendRequests(data.friendRequests || []);
      }
    } catch (err) {
      console.error('Failed loading friends data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  // Copy Friend Tag
  const copyTag = () => {
    if (!displayTag) return;
    navigator.clipboard.writeText(displayTag);
    setCopied(true);
    showToast(`Friend Tag "${displayTag}" copied to clipboard!`, 'success', 'Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Tag Edit Mode
  const handleStartEditTag = () => {
    if (daysLeftToEdit > 0) {
      showToast(
        `Friend Tag locked. You can change your tag again in ${daysLeftToEdit} day${daysLeftToEdit > 1 ? 's' : ''}.`,
        'error',
        'Cooldown Active'
      );
      return;
    }
    setTagInputValue(displayTag);
    setIsEditingTag(true);
  };

  // Save Updated Friend Tag
  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInputValue.trim();
    if (!cleanTag) return;

    setSavingTag(true);
    try {
      const token = localStorage.getItem('cinetrack_token');
      const res = await fetch('/api/user/friend-tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newFriendTag: cleanTag }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to update Friend Tag.', 'error', 'Tag Error');
        return;
      }

      showToast(data.message || 'Friend Tag updated successfully!', 'success', 'Tag Updated');
      const newLastChanged = data.tagLastChangedAt || new Date().toISOString();
      setMyTag(data.friendTag);
      setTagLastChangedAt(newLastChanged);
      updateUserFriendTag(data.friendTag, newLastChanged);
      setIsEditingTag(false);
    } catch (err: any) {
      showToast(err.message || 'Error updating Friend Tag.', 'error');
    } finally {
      setSavingTag(false);
    }
  };

  // Send Friend Request
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTag.trim()) return;

    setSendingRequest(true);
    try {
      const token = localStorage.getItem('cinetrack_token');
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetTag: inputTag.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to send friend request.', 'error', 'Error');
        setSendingRequest(false);
        return;
      }

      showToast(data.message || 'Friend request sent!', 'success', 'Request Sent');
      setInputTag('');
    } catch (err: any) {
      showToast(err.message || 'Network error sending request.', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  // Accept Friend Request
  const handleAccept = async (senderId: string, senderName: string) => {
    try {
      const token = localStorage.getItem('cinetrack_token');
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`You are now friends with ${senderName}!`, 'success', 'Request Accepted');
        fetchFriendsData();
      } else {
        showToast(data.error || 'Failed to accept request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error accepting request.', 'error');
    }
  };

  // Decline Friend Request
  const handleDecline = async (senderId: string) => {
    try {
      const token = localStorage.getItem('cinetrack_token');
      const res = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Friend request declined', 'info');
        setFriendRequests((prev) => prev.filter((r) => r.senderId !== senderId));
      }
    } catch (err: any) {
      showToast(err.message || 'Error declining request.', 'error');
    }
  };

  // Remove Friend
  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) return;

    try {
      setRemovingFriendId(friendId);
      const token = localStorage.getItem('cinetrack_token');
      const res = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Removed ${friendName} from your friends list.`, 'info', 'Friend Removed');
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      } else {
        showToast(data.error || 'Failed to remove friend.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing friend.', 'error');
    } finally {
      setRemovingFriendId(null);
    }
  };

  // Helper to format minutes into human readable text
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return hours > 0 ? `${hours}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: My Friend Tag & Add Friend Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: My Unique Friend Tag */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-red-950/30 to-slate-900/90 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Your Unique Friend Tag</h3>
              <p className="text-xs text-slate-400">Share this tag with friends so they can add you</p>
            </div>
          </div>

          {isEditingTag ? (
            <form onSubmit={handleSaveTag} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={tagInputValue}
                onChange={(e) => setTagInputValue(e.target.value)}
                placeholder="e.g. john#9A42 or custom_tag"
                className="flex-1 bg-black/80 border border-amber-500/50 rounded-2xl px-4 py-3 font-mono text-xs font-extrabold text-amber-400 focus:outline-none focus:border-amber-400 transition-colors"
                autoFocus
              />

              <button
                type="submit"
                disabled={savingTag || !tagInputValue.trim()}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Save Unique Tag"
              >
                <Save className="w-4 h-4" />
                <span>{savingTag ? 'Saving...' : 'Save Tag'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditingTag(false)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 font-mono text-sm font-extrabold text-amber-400 tracking-wider flex items-center justify-between min-w-0">
                <span className="truncate">{displayTag}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold shrink-0 ml-2">ID TAG</span>
              </div>

              <button
                onClick={handleStartEditTag}
                disabled={daysLeftToEdit > 0}
                className={`p-3 rounded-2xl border transition-all shrink-0 ${
                  daysLeftToEdit > 0
                    ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-amber-400 cursor-pointer'
                }`}
                title={
                  daysLeftToEdit > 0
                    ? `Friend Tag locked. Editable in ${daysLeftToEdit} day${daysLeftToEdit > 1 ? 's' : ''}`
                    : 'Edit Unique Friend Tag'
                }
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={copyTag}
                disabled={!displayTag}
                className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
          {daysLeftToEdit > 0 ? (
            <p className="text-[11px] text-amber-400/90 font-medium pt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>🔒 Friend Tag locked. Editable in <strong className="text-amber-300 font-bold">{daysLeftToEdit} day{daysLeftToEdit > 1 ? 's' : ''}</strong>.</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 font-medium pt-0.5 flex items-center gap-1">
              <span>⏱️ Note: You can change your Unique Friend Tag once every 30 days.</span>
            </p>
          )}
        </div>

        {/* Card 2: Add Friend by Tag/Email */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add a New Friend</h3>
              <p className="text-xs text-slate-400">Enter a friend&apos;s unique tag or email</p>
            </div>
          </div>

          <form onSubmit={handleSendRequest} className="flex items-center gap-3 pt-1">
            <input
              type="text"
              value={inputTag}
              onChange={(e) => setInputTag(e.target.value)}
              placeholder="e.g. john#9A42 or email@domain.com"
              className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={sendingRequest || !inputTag.trim()}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{sendingRequest ? 'Sending...' : 'Send Request'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Pending Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-amber-950/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Pending Friend Requests ({friendRequests.length})</span>
            </h3>
            <span className="text-xs font-semibold text-amber-300">Action Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friendRequests.map((req) => (
              <div
                key={req.senderId}
                className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-img-element */}
                  <img
                    src={req.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                    alt={req.senderName}
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{req.senderName}</h4>
                    <p className="text-[11px] text-amber-400 font-mono font-semibold truncate">{req.senderTag}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(req.senderId, req.senderName)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(req.senderId)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Grid */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              <span>My Friends ({friends.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on any friend to inspect their complete watchlist and cinema stats
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 rounded-3xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-7 h-7 text-red-400" />
            </div>
            <h4 className="text-base font-bold text-white">No Friends Added Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Share your Unique Friend Tag ({myTag}) with friends or enter their tag above to start sharing watchlists!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="group p-5 rounded-3xl glass-panel border border-white/10 hover:border-red-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-img-element */}
                  <img
                    src={friend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                    alt={friend.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-red-500/50 group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {friend.name}
                    </h4>
                    <p className="text-xs text-amber-400 font-mono font-semibold truncate">{friend.friendTag}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Watched</span>
                    <span className="text-xs font-extrabold text-emerald-400 mt-0.5 block">
                      {friend.watchedCount} titles
                    </span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Watch Time</span>
                    <span className="text-xs font-extrabold text-white mt-0.5 block">
                      {formatMinutes(friend.watchedMinutes)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/watchlist"
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-white" />
                    <span>View Watchlist</span>
                  </Link>

                  <button
                    onClick={() => handleRemoveFriend(friend.id, friend.name)}
                    disabled={removingFriendId === friend.id}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/40 text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    title={`Remove ${friend.name} from friends`}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
