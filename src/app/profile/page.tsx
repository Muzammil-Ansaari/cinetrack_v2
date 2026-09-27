'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User,
  Film,
  Tv,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Play,
  EyeOff,
  Trash2,
  Star,
  Lock,
  LogOut,
  TrendingUp,
  Award,
  PieChart,
  ArrowRight,
  ShieldAlert,
  Search,
  Users,
  BarChart3,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MediaItem } from '@/types/cinetrack';
import FriendsManager from '@/components/FriendsManager';

export default function UserDashboardPage() {
  const {
    watchlist,
    user,
    authLoading,
    logout,
    openAuthModal,
    markAsWatched,
    markAsUnwatched,
    removeFromWatchlist,
    playMedia,
    openSearch,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'watched' | 'unwatched' | 'upcoming'>('watched');
  const [dashboardSection, setDashboardSection] = useState<'analytics' | 'friends'>('analytics');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Helper to calculate total estimated runtime for a media item in minutes
  const getItemRuntimeMinutes = (media: MediaItem): number => {
    if (media.type === 'movie') {
      return media.runtime || 110;
    } else {
      const epRuntime = media.runtime || 45;
      const epCount = media.episodesCount || (media.seasonsCount ? media.seasonsCount * 10 : 10);
      return epRuntime * epCount;
    }
  };

  // Helper to convert total minutes into Days, Hours, Minutes format
  const formatRuntime = (totalMinutes: number) => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = totalMinutes % 60;

    let formatted = '';
    if (days > 0) {
      formatted += `${days}d `;
    }
    if (hours > 0 || days > 0) {
      formatted += `${hours}h `;
    }
    formatted += `${mins}m`;

    return { days, hours, mins, formatted: formatted.trim() };
  };

  // Dashboard Analytics Computations
  const stats = useMemo(() => {
    const watchedList: typeof watchlist = [];
    const unwatchedList: typeof watchlist = [];
    const upcomingList: typeof watchlist = [];

    let watchedMinutes = 0;
    let unwatchedMinutes = 0;

    let watchedMoviesCount = 0;
    let watchedTvCount = 0;

    const genreCounts: Record<string, number> = {};

    watchlist.forEach((item) => {
      const releaseDate = item.media.releaseDate || '';
      const isFuture = releaseDate > todayStr || (item.media.isUpcoming && releaseDate > todayStr);
      const runtime = getItemRuntimeMinutes(item.media);

      if (item.isWatched) {
        watchedList.push(item);
        watchedMinutes += runtime;

        if (item.media.type === 'movie') watchedMoviesCount++;
        if (item.media.type === 'tv') watchedTvCount++;

        // Track genres for watched items
        item.media.genres?.forEach((genre) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      } else if (isFuture) {
        upcomingList.push(item);
      } else {
        unwatchedList.push(item);
        unwatchedMinutes += runtime;
      }
    });

    const totalReleasedCount = watchedList.length + unwatchedList.length;
    const completionRate =
      totalReleasedCount > 0 ? Math.round((watchedList.length / totalReleasedCount) * 100) : 0;

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      watchedList,
      unwatchedList,
      upcomingList,
      watchedMinutes,
      unwatchedMinutes,
      watchedFormatted: formatRuntime(watchedMinutes),
      unwatchedFormatted: formatRuntime(unwatchedMinutes),
      watchedMoviesCount,
      watchedTvCount,
      completionRate,
      topGenres,
      totalSaved: watchlist.length,
    };
  }, [watchlist, todayStr]);

  // Skeleton / Loading guard while client hydration & auth session resolution takes place
  if (!mounted || authLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          {/* Skeleton Hero Banner */}
          <div className="h-44 rounded-3xl bg-white/5 border border-white/10" />

          {/* Skeleton 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 rounded-3xl bg-white/5 border border-white/10" />
            ))}
          </div>

          {/* Skeleton Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-3xl bg-white/5 border border-white/10" />
            <div className="h-64 rounded-3xl bg-white/5 border border-white/10" />
          </div>
        </div>
      </div>
    );
  }

  // Auth Guard for unauthenticated users
  if (!user) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Sign In Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Please sign in to view your user dashboard, watch time analytics, and personal cinema stats.
            </p>
          </div>
          <button
            onClick={openAuthModal}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Sign In to Continue</span>
          </button>
        </div>
      </div>
    );
  }

  const activeTabList =
    activeTab === 'watched'
      ? stats.watchedList
      : activeTab === 'unwatched'
      ? stats.unwatchedList
      : stats.upcomingList;

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* User Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/10 p-6 md:p-8 bg-gradient-to-r from-slate-900/90 via-red-950/40 to-slate-900/90 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 shadow-xl shadow-red-600/20">
                  {/* eslint-disable-next-img-element */}
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                    alt={user?.name || 'User Avatar'}
                    className="w-full h-full object-cover rounded-[22px]"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900 shadow" title="Active Account">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* User Metadata */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    {user?.name || 'CineTrack User'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>VIP MEMBER</span>
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-medium">{user?.email || 'user@cinetrack.com'}</p>
                <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 justify-center sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Member since 2026</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-red-400" />
                    <span>{stats.totalSaved} Saved Titles</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Account Quick Actions */}
            <div className="flex items-center gap-3">
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={logout}
                className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Cinema Stats & Analytics | Friends & Social) */}
        <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl w-full sm:w-auto">
          <button
            onClick={() => setDashboardSection('analytics')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dashboardSection === 'analytics'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Cinema Stats & Analytics</span>
          </button>

          <button
            onClick={() => setDashboardSection('friends')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dashboardSection === 'friends'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends & Social Watchlists</span>
          </button>
        </div>

        {dashboardSection === 'friends' ? (
          <FriendsManager />
        ) : (
          <>
            {/* 4 Primary Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Watched Runtime & Count */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Watched</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white">{stats.watchedFormatted.formatted}</div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <span className="text-emerald-400 font-bold">{stats.watchedList.length} titles</span> watched
                    ({stats.watchedMoviesCount} movies, {stats.watchedTvCount} shows)
                  </p>
                </div>
              </div>

              {/* Card 2: Remaining Unwatched Runtime */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-red-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available to Watch</span>
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white">{stats.unwatchedFormatted.formatted}</div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <span className="text-red-400 font-bold">{stats.unwatchedList.length} titles</span> waiting in queue
                  </p>
                </div>
              </div>

              {/* Card 3: Upcoming Releases */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Titles</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white">{stats.upcomingList.length}</div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <span className="text-amber-400 font-bold">Releasing soon</span> with notifications
                  </p>
                </div>
              </div>

              {/* Card 4: Watchlist Completion Rate */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-rose-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-3xl font-black text-white">{stats.completionRate}%</div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Detailed Analytics Section: Time Comparison & Top Genres */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Runtime Comparison Bar Chart */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-red-500" />
                      <span>Watch Time Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Comparison between time spent watching vs remaining unwatched queue
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                    Total {formatRuntime(stats.watchedMinutes + stats.unwatchedMinutes).formatted}
                  </span>
                </div>

                {/* Visual Runtime Progress Bars */}
                <div className="space-y-4 pt-2">
                  {/* Watched Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Watched Runtime</span>
                      </span>
                      <span className="text-white font-bold">{stats.watchedFormatted.formatted} ({stats.watchedMinutes} mins)</span>
                    </div>
                    <div className="w-full h-4 bg-slate-900 rounded-xl overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-lg transition-all duration-1000"
                        style={{
                          width: `${
                            stats.watchedMinutes + stats.unwatchedMinutes > 0
                              ? Math.round((stats.watchedMinutes / (stats.watchedMinutes + stats.unwatchedMinutes)) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Unwatched Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-red-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Remaining Unwatched Runtime</span>
                      </span>
                      <span className="text-white font-bold">{stats.unwatchedFormatted.formatted} ({stats.unwatchedMinutes} mins)</span>
                    </div>
                    <div className="w-full h-4 bg-slate-900 rounded-xl overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-lg transition-all duration-1000"
                        style={{
                          width: `${
                            stats.watchedMinutes + stats.unwatchedMinutes > 0
                              ? Math.round((stats.unwatchedMinutes / (stats.watchedMinutes + stats.unwatchedMinutes)) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Avg Movie Length</span>
                    <span className="text-base font-extrabold text-white mt-1 block">~110 Mins</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Movies Watched</span>
                    <span className="text-base font-extrabold text-emerald-400 mt-1 block">{stats.watchedMoviesCount}</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">TV Shows Watched</span>
                    <span className="text-base font-extrabold text-emerald-400 mt-1 block">{stats.watchedTvCount}</span>
                  </div>
                </div>
              </div>

              {/* Top Genres Breakdown */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-400" />
                  <span>Top Watched Genres</span>
                </h3>

                {stats.topGenres.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Mark items in your watchlist as watched to see your genre stats!
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {stats.topGenres.map(([genre, count]) => {
                      const percentage = Math.round((count / (stats.watchedList.length || 1)) * 100);
                      return (
                        <div key={genre} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-200">{genre}</span>
                            <span className="text-slate-400 font-bold">{count} titles ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Quick Lists & Controls Tab View */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Film className="w-5 h-5 text-red-500" />
                  <span>Watchlist Quick Overview</span>
                </h3>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('watched')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'watched'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Watched ({stats.watchedList.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('unwatched')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'unwatched'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Unwatched ({stats.unwatchedList.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'upcoming'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Upcoming ({stats.upcomingList.length})</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Grid */}
              {activeTabList.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm text-slate-400">No items found in this category.</p>
                  <button
                    onClick={openSearch}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Explore Movies & Shows</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {activeTabList.slice(0, 12).map(({ media, id, isWatched }) => {
                    const isFuture = (media.releaseDate || '') > todayStr || (media.isUpcoming && (media.releaseDate || '') > todayStr);

                    return (
                      <div
                        key={id}
                        className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-red-500/50 transition-all duration-300 shadow-lg"
                      >
                        <Link href={`/${media.type}/${media.internalId}`} className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                          {/* eslint-disable-next-img-element */}
                          <img
                            src={media.poster}
                            alt={media.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            <span>{media.rating ? media.rating.toFixed(1) : 'N/A'}</span>
                          </div>
                        </Link>

                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                              {media.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {media.releaseYear || '2026'} • {getItemRuntimeMinutes(media)} mins
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                            {!isFuture ? (
                              <>
                                <button
                                  onClick={() => playMedia(media)}
                                  className="w-full flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 rounded-lg text-[10px] shadow-sm transition-all cursor-pointer"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span>Play</span>
                                </button>

                                {isWatched ? (
                                  <button
                                    onClick={() => markAsUnwatched(id)}
                                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <EyeOff className="w-3 h-3 text-amber-400" />
                                    <span>Unwatch</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markAsWatched(id)}
                                    className="w-full py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Watched</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => removeFromWatchlist(id)}
                                className="w-full py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTabList.length > 12 && (
                <div className="text-center pt-4">
                  <Link
                    href="/watchlist"
                    className="inline-flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    <span>View all {activeTabList.length} titles in Watchlist</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
