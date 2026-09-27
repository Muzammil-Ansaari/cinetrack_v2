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
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

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
  } = useApp();

  const [myTag, setMyTag] = useState<string>('');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputTag, setInputTag] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  // Inspector Modal State
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'watched' | 'unwatched' | 'upcoming'>('watched');

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
        if (selectedFriend?.id === friendId) {
          setSelectedFriend(null);
        }
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

          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 font-mono text-sm font-extrabold text-amber-400 tracking-wider flex items-center justify-between">
              <span>{displayTag}</span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">ID TAG</span>
            </div>

            <button
              onClick={copyTag}
              disabled={!displayTag}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Tag'}</span>
            </button>
          </div>
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
                  <button
                    onClick={() => setSelectedFriend(friend)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Watchlist</span>
                  </button>

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

      {/* Friend Watchlist & Cinema Stats Inspector Modal */}
      {selectedFriend && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl max-w-4xl w-full border border-white/10 shadow-2xl overflow-hidden my-8 space-y-6 p-6 md:p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedFriend(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Friend Profile Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border-b border-white/10 pb-6 pr-10">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                {/* eslint-disable-next-img-element */}
                <img
                  src={selectedFriend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                  alt={selectedFriend.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-red-500/60 shadow-lg"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-2xl font-black text-white">{selectedFriend.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                      {selectedFriend.friendTag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Total Saved Titles: <strong className="text-white font-bold">{selectedFriend.watchlistCount}</strong> • Watched Runtime: <strong className="text-emerald-400 font-bold">{formatMinutes(selectedFriend.watchedMinutes)}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveFriend(selectedFriend.id, selectedFriend.name)}
                disabled={removingFriendId === selectedFriend.id}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <UserMinus className="w-4 h-4" />
                <span>Remove Friend</span>
              </button>
            </div>

            {/* Tabs for Friend's Watchlist */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-auto">
              <button
                onClick={() => setInspectorTab('watched')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectorTab === 'watched'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Watched ({selectedFriend.watchlist.filter((w: any) => w.isWatched).length})</span>
              </button>

              <button
                onClick={() => setInspectorTab('unwatched')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectorTab === 'unwatched'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Unwatched ({selectedFriend.watchlist.filter((w: any) => !w.isWatched).length})</span>
              </button>
            </div>

            {/* Friend Items Grid */}
            {selectedFriend.watchlist.filter((w: any) =>
              inspectorTab === 'watched' ? w.isWatched : !w.isWatched
            ).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No items in {selectedFriend.name}&apos;s {inspectorTab} list.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto pr-1">
                {selectedFriend.watchlist
                  .filter((w: any) => (inspectorTab === 'watched' ? w.isWatched : !w.isWatched))
                  .map(({ media, id }: any) => {
                    const mediaItem = {
                      ...media,
                      internalId: media?.internalId || media?.id || id,
                    };
                    const inMyWatchlist = isInWatchlist(mediaItem.internalId);
                    const iHaveWatched = isWatched(mediaItem.internalId);
                    const isUpcomingItem =
                      mediaItem?.isUpcoming ||
                      (mediaItem?.releaseDate ? new Date(mediaItem.releaseDate) > new Date() : false);

                    return (
                      <div
                        key={id}
                        className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-red-500/50 transition-all shadow-md bg-slate-900/60"
                      >
                        <div className="relative aspect-[2/3] w-full bg-slate-900 overflow-hidden">
                          {/* eslint-disable-next-img-element */}
                          <img
                            src={mediaItem?.poster}
                            alt={mediaItem?.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md z-10">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            <span>{mediaItem?.rating ? mediaItem.rating.toFixed(1) : 'N/A'}</span>
                          </div>

                          {/* Hover Overlay with Action Buttons */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2 z-20">
                            <div className="space-y-1.5">
                              {!isUpcomingItem && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    playMedia(mediaItem);
                                  }}
                                  className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-red-600/40 transition-all cursor-pointer"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span>Play Now</span>
                                </button>
                              )}

                              <div className="flex items-center gap-1">
                                {/* Save to Unwatched Watchlist */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (inMyWatchlist && !iHaveWatched) {
                                      removeFromWatchlist(mediaItem.internalId);
                                    } else {
                                      addToWatchlist(mediaItem, false);
                                    }
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                    inMyWatchlist && !iHaveWatched
                                      ? 'bg-amber-500/90 border-amber-400 text-slate-950 font-extrabold'
                                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                  }`}
                                  title={inMyWatchlist && !iHaveWatched ? 'In your Watchlist' : 'Add to Watchlist'}
                                >
                                  <Bookmark className="w-3.5 h-3.5" />
                                  <span>{inMyWatchlist && !iHaveWatched ? 'Saved' : '+ Save'}</span>
                                </button>

                                {/* Save directly to Watched (only for released media) */}
                                {!isUpcomingItem && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (iHaveWatched) {
                                        markAsUnwatched(mediaItem.internalId);
                                      } else {
                                        addToWatchlist(mediaItem, true);
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      iHaveWatched
                                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                                        : 'bg-white/10 border-white/20 text-slate-300 hover:text-white hover:bg-white/20'
                                    }`}
                                    title={iHaveWatched ? 'Marked Watched' : 'Mark as Watched'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Details */}
                        <div className="p-2.5 text-xs flex flex-col justify-between flex-1">
                          <Link href={`/${mediaItem?.type || 'movie'}/${mediaItem?.internalId}`}>
                            <h5 className="font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                              {mediaItem?.title}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {mediaItem?.releaseYear || '2026'} • {mediaItem?.type === 'tv' ? 'TV' : 'Movie'}
                            </p>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
