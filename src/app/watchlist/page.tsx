'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Play,
  Trash2,
  Star,
  CheckCircle2,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  Film,
  Tv,
  Lock,
  User,
  ChevronLeft,
  ChevronRight,
  Tag,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  FileText,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { filterItemByTimeframe, TimeframeFilter } from '@/lib/tmdb';
import { FriendUser } from '@/components/FriendsManager';

export default function WatchlistPage() {
  const { showToast } = useToast();
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    isWatched,
    markAsWatched,
    markAsUnwatched,
    playMedia,
    openSearch,
    user,
    authLoading,
    openAuthModal,
  } = useApp();

  const [activeMainTab, setActiveMainTab] = useState<'unwatched' | 'watched' | 'upcoming'>('unwatched');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Watchlist Source State (My Watchlist vs Friend's Watchlist)
  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('me');
  const [loadingFriends, setLoadingFriends] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Friends List to allow inspecting friends' watchlists with all filters
  React.useEffect(() => {
    const fetchFriends = async () => {
      const token = localStorage.getItem('cinetrack_token');
      if (!token) return;
      try {
        setLoadingFriends(true);
        const res = await fetch('/api/friends', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFriendsList(data.friends || []);
        }
      } catch (err) {
        console.error('Failed to load friends for watchlist page:', err);
      } finally {
        setLoadingFriends(false);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Active Friend Selected
  const selectedFriend = useMemo(() => {
    if (selectedFriendId === 'me') return null;
    return friendsList.find((f) => f.id === selectedFriendId) || null;
  }, [selectedFriendId, friendsList]);

  // Target Watchlist Array (My Watchlist or Friend's Watchlist)
  const activeWatchlist = useMemo(() => {
    if (selectedFriend) {
      return selectedFriend.watchlist || [];
    }
    return watchlist;
  }, [selectedFriend, watchlist]);

  // Categorize Active Watchlist Items (Unwatched, Watched, Upcoming)
  const categorized = useMemo(() => {
    const watched = activeWatchlist.filter((w) => w.isWatched === true);

    const unwatched: typeof activeWatchlist = [];
    const upcoming: typeof activeWatchlist = [];

    activeWatchlist.forEach((w) => {
      if (w.isWatched) return;

      const releaseDate = w.media?.releaseDate || '';
      const isFutureRelease = releaseDate > todayStr || (w.media?.isUpcoming && releaseDate > todayStr);

      if (isFutureRelease) {
        upcoming.push(w);
      } else {
        unwatched.push(w);
      }
    });

    return { unwatched, watched, upcoming };
  }, [activeWatchlist, todayStr]);

  // Items for the selected main tab (Unwatched | Watched | Upcoming)
  const currentTabItems = useMemo(() => {
    if (activeMainTab === 'watched') return categorized.watched;
    if (activeMainTab === 'upcoming') return categorized.upcoming;
    return categorized.unwatched;
  }, [activeMainTab, categorized]);

  // Extract all unique genres dynamically from target watchlist
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    activeWatchlist.forEach((w) => {
      if (w.media?.genres && Array.isArray(w.media.genres)) {
        w.media.genres.forEach((g) => {
          if (g && typeof g === 'string') {
            genreSet.add(g.trim());
          }
        });
      }
    });
    return Array.from(genreSet).sort();
  }, [activeWatchlist]);

  // Apply Media Type, Search, Genre, and Timeframe Filters
  const filteredItems = useMemo(() => {
    return currentTabItems.filter((w) => {
      const matchesType = mediaTypeFilter === 'all' || w.media.type === mediaTypeFilter;
      
      const matchesSearch =
        !searchQuery ||
        w.media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.media.genres?.some((g: string) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === 'all' ||
        (w.media.genres && w.media.genres.includes(selectedGenre));

      const targetDate = w.isWatched ? (w.watchedAt || w.addedAt) : w.addedAt;
      const matchesTimeframe = filterItemByTimeframe(targetDate, selectedTimeframe, customStartDate, customEndDate);

      return matchesType && matchesSearch && matchesGenre && matchesTimeframe;
    });
  }, [currentTabItems, mediaTypeFilter, searchQuery, selectedGenre, selectedTimeframe, customStartDate, customEndDate]);

  // Media Type breakdown counts for current main tab matching search, genre, and timeframe filters
  const typeCounts = useMemo(() => {
    const matchingFiltersWithoutType = currentTabItems.filter((w) => {
      const matchesSearch =
        !searchQuery ||
        w.media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.media.genres?.some((g: string) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === 'all' ||
        (w.media.genres && w.media.genres.includes(selectedGenre));

      const targetDate = w.isWatched ? (w.watchedAt || w.addedAt) : w.addedAt;
      const matchesTimeframe = filterItemByTimeframe(targetDate, selectedTimeframe, customStartDate, customEndDate);

      return matchesSearch && matchesGenre && matchesTimeframe;
    });

    const all = matchingFiltersWithoutType.length;
    const movies = matchingFiltersWithoutType.filter((w) => w.media.type === 'movie').length;
    const tv = matchingFiltersWithoutType.filter((w) => w.media.type === 'tv').length;

    return { all, movies, tv };
  }, [currentTabItems, searchQuery, selectedGenre, selectedTimeframe, customStartDate, customEndDate]);

  // Main tab counts after applying all active filters
  const filteredTabCounts = useMemo(() => {
    const calcCount = (items: typeof watchlist) => {
      return items.filter((w) => {
        const matchesType = mediaTypeFilter === 'all' || w.media.type === mediaTypeFilter;
        const matchesSearch =
          !searchQuery ||
          w.media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.media.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesGenre =
          selectedGenre === 'all' ||
          (w.media.genres && w.media.genres.includes(selectedGenre));
        const targetDate = w.isWatched ? (w.watchedAt || w.addedAt) : w.addedAt;
        const matchesTimeframe = filterItemByTimeframe(targetDate, selectedTimeframe, customStartDate, customEndDate);

        return matchesType && matchesSearch && matchesGenre && matchesTimeframe;
      }).length;
    };

    return {
      unwatched: calcCount(categorized.unwatched),
      watched: calcCount(categorized.watched),
      upcoming: calcCount(categorized.upcoming),
    };
  }, [categorized, mediaTypeFilter, searchQuery, selectedGenre, selectedTimeframe, customStartDate, customEndDate]);

  // Pagination (30 items per page)
  const ITEMS_PER_PAGE = 30;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page pagination on filter state change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeMainTab, mediaTypeFilter, searchQuery, selectedGenre, selectedTimeframe, selectedFriendId]);

  const hasActiveFilters =
    selectedGenre !== 'all' || selectedTimeframe !== 'all' || mediaTypeFilter !== 'all' || searchQuery !== '' || customStartDate !== '' || customEndDate !== '';

  const clearAllFilters = () => {
    setSelectedGenre('all');
    setSelectedTimeframe('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMediaTypeFilter('all');
    setSearchQuery('');
  };

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculate days remaining for upcoming item
  const getDaysUntilRelease = (releaseDate: string) => {
    if (!releaseDate) return null;
    const release = new Date(releaseDate);
    const today = new Date();
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (mounted && !authLoading && !user) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Sign In Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Please sign in to access your saved Watchlist, track watched movies, and sync across your devices.
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

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Bookmark className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  {selectedFriend ? `${selectedFriend.name}'s Watchlist` : 'Watchlist'}
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-400 pl-1">
              {selectedFriend
                ? `Browsing ${selectedFriend.name}'s saved movies and TV shows (${selectedFriend.friendTag}).`
                : 'Organize, track, and get notified about your saved movies and TV shows.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter titles..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Watchlist Source Selector Bar (My Watchlist vs Friends' Watchlists) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 pr-1">
              <User className="w-4 h-4 text-red-500" />
              <span>Watchlist Source:</span>
            </span>

            {/* My Watchlist Option */}
            <button
              onClick={() => setSelectedFriendId('me')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedFriendId === 'me'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>My Watchlist</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/40 text-white">
                {watchlist.length}
              </span>
            </button>

            {/* Friends' Watchlists Options */}
            {friendsList.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriendId(friend.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedFriendId === friend.id
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {/* eslint-disable-next-img-element */}
                <img
                  src={friend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                  alt={friend.name}
                  className="w-4 h-4 rounded-full object-cover border border-amber-400/50"
                />
                <span>{friend.name}&apos;s List</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/40 text-white">
                  {friend.watchlistCount || friend.watchlist?.length || 0}
                </span>
              </button>
            ))}

            {friendsList.length === 0 && !loadingFriends && (
              <span className="text-xs text-slate-500 italic pl-1">
                (Add friends in your Profile to view their watchlists here!)
              </span>
            )}
          </div>

          {selectedFriend && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs text-amber-300">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Inspecting <strong>{selectedFriend.name}&apos;s</strong> Watchlist</span>
              <button
                onClick={() => setSelectedFriendId('me')}
                className="ml-2 text-slate-300 hover:text-white underline text-[11px] font-bold cursor-pointer"
              >
                Switch to Mine
              </button>
            </div>
          )}
        </div>

        {/* Top Level 3 Tabs (Unwatched | Watched | Upcoming) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl w-full sm:w-auto">
            
            {/* Unwatched Tab */}
            <button
              onClick={() => setActiveMainTab('unwatched')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'unwatched'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Unwatched</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeMainTab === 'unwatched' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
              }`}>
                {filteredTabCounts.unwatched}
              </span>
            </button>

            {/* Watched Tab */}
            <button
              onClick={() => setActiveMainTab('watched')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'watched'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Watched</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeMainTab === 'watched' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
              }`}>
                {filteredTabCounts.watched}
              </span>
            </button>

            {/* Upcoming Tab */}
            <button
              onClick={() => setActiveMainTab('upcoming')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'upcoming'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Upcoming</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeMainTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
              }`}>
                {filteredTabCounts.upcoming}
              </span>
            </button>

          </div>

          {/* Sub Filters: Media Type Tabs, Genre Filter, Year Filter, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            {/* Left: Media Type Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
              <button
                onClick={() => setMediaTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mediaTypeFilter === 'all' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>All</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/10">
                  {typeCounts.all}
                </span>
              </button>
              <button
                onClick={() => setMediaTypeFilter('movie')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mediaTypeFilter === 'movie' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Movies</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/10">
                  {typeCounts.movies}
                </span>
              </button>
              <button
                onClick={() => setMediaTypeFilter('tv')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mediaTypeFilter === 'tv' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Shows</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/10">
                  {typeCounts.tv}
                </span>
              </button>
            </div>

            {/* Right: Dynamic Genre & Year Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dynamic Genre Filter Selector */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none font-semibold cursor-pointer text-xs pr-1 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="all">All Genres ({availableGenres.length})</option>
                  {availableGenres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe Filter Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                  <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value as TimeframeFilter)}
                    className="bg-transparent text-slate-200 focus:outline-none font-semibold cursor-pointer text-xs pr-1 [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Added Today</option>
                    <option value="yesterday">Added Yesterday</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Range...</option>
                  </select>
                </div>

                {selectedTimeframe === 'custom' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase">From:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase">To:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 text-xs font-semibold transition-all cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Skeleton grid on initial client mount & auth resolution */}
        {!mounted || authLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl border border-white/10 max-w-md mx-auto p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              {activeMainTab === 'unwatched' && <Clock className="w-8 h-8 text-red-400" />}
              {activeMainTab === 'watched' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              {activeMainTab === 'upcoming' && <Calendar className="w-8 h-8 text-amber-400" />}
            </div>
            
            <h3 className="text-xl font-bold text-white">
              {hasActiveFilters
                ? 'No matching titles found'
                : activeMainTab === 'unwatched'
                ? 'No unwatched items'
                : activeMainTab === 'watched'
                ? 'No watched items yet'
                : 'No upcoming releases in watchlist'}
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              {hasActiveFilters
                ? 'Try adjusting or clearing your genre, year, media type, or search query filters.'
                : activeMainTab === 'unwatched'
                ? 'Your unwatched list is currently empty. Explore trending movies or add upcoming titles!'
                : activeMainTab === 'watched'
                ? 'When you finish watching a movie or TV show, mark it as watched to track your complete viewing history!'
                : 'Add upcoming releases to your watchlist. As soon as they release, they will automatically move to your Unwatched list with a notification!'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  <span>Clear Filters</span>
                </button>
              )}

              <button
                onClick={openSearch}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Discover Titles</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {paginatedItems.map(({ media, id, isWatched: itemIsWatched }) => {
                const releaseDate = media.releaseDate || '';
                const isFuture = releaseDate > todayStr || (media.isUpcoming && releaseDate > todayStr);
                const daysLeft = getDaysUntilRelease(releaseDate);

                return (
                  <div
                    key={id}
                    className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-red-500/50 transition-all duration-300 shadow-xl"
                  >
                    {/* Poster Link to details */}
                    <Link href={`/${media.type}/${media.internalId}`} className="flex-1 flex flex-col">
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                        {/* eslint-disable-next-img-element */}
                        <img
                          src={media.poster}
                          alt={media.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] uppercase font-bold text-slate-200 backdrop-blur-md">
                          {media.type === 'tv' ? 'TV' : 'Movie'}
                        </div>

                        {/* Rating Badge */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{media.rating ? media.rating.toFixed(1) : 'N/A'}</span>
                        </div>

                        {/* Upcoming Release Countdown Badge */}
                        {isFuture && (
                          <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-xl bg-gradient-to-r from-amber-950/90 to-orange-950/90 border border-amber-500/50 backdrop-blur-md text-amber-200 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 shadow-lg">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>
                              {daysLeft !== null && daysLeft > 0
                                ? `Releasing in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`
                                : `Releasing ${releaseDate}`}
                            </span>
                          </div>
                        )}

                        {/* Watched Status Overlay Badge */}
                        {itemIsWatched && (
                          <div className="absolute top-10 right-2 px-2 py-0.5 rounded bg-emerald-600/90 border border-emerald-400/50 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Watched</span>
                          </div>
                        )}
                      </div>

                      {/* Metadata Details */}
                      <div className="p-3 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                          {media.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {media.releaseYear || '2026'} • {media.genres?.[0] || 'Entertainment'}
                        </p>
                      </div>
                    </Link>

                    {/* Actions Section */}
                    <div className="p-3 pt-0">
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                        {selectedFriend ? (
                          /* Friend Watchlist Card Actions: Play, Save to My List, Mark Watched in My List */
                          <>
                            {!isFuture && (
                              <button
                                onClick={() => playMedia(media)}
                                className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>Play Now</span>
                              </button>
                            )}

                            <div className="flex items-center gap-1.5">
                              {/* Add / Remove from My Watchlist */}
                              <button
                                onClick={() => {
                                  if (isInWatchlist(media.internalId) && !isWatched(media.internalId)) {
                                    removeFromWatchlist(media.internalId);
                                  } else {
                                    addToWatchlist(media, false);
                                  }
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                  isInWatchlist(media.internalId) && !isWatched(media.internalId)
                                    ? 'bg-amber-500/90 border-amber-400 text-slate-950 font-extrabold'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                }`}
                                title={isInWatchlist(media.internalId) && !isWatched(media.internalId) ? 'In your Watchlist' : 'Save to My Watchlist'}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>{isInWatchlist(media.internalId) && !isWatched(media.internalId) ? 'Saved' : '+ Save'}</span>
                              </button>

                              {/* Mark Watched in My List (Only for released titles) */}
                              {!isFuture && (
                                <button
                                  onClick={() => {
                                    if (isWatched(media.internalId)) {
                                      markAsUnwatched(media.internalId);
                                    } else {
                                      addToWatchlist(media, true);
                                    }
                                  }}
                                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                    isWatched(media.internalId)
                                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                                      : 'bg-white/10 border-white/20 text-slate-300 hover:text-white hover:bg-white/20'
                                  }`}
                                  title={isWatched(media.internalId) ? 'Marked Watched in My List' : 'Mark Watched in My List'}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          /* My Watchlist Card Actions */
                          <>
                            {!isFuture ? (
                              <>
                                {/* Play Button */}
                                <button
                                  onClick={() => playMedia(media)}
                                  className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  <span>{itemIsWatched ? 'Play Again' : 'Play Now'}</span>
                                </button>

                                {/* Toggle Watched & Remove Buttons */}
                                <div className="flex items-center gap-2">
                                  {itemIsWatched ? (
                                    <button
                                      onClick={() => markAsUnwatched(id)}
                                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                      title="Mark as Unwatched"
                                    >
                                      <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Unwatch</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => markAsWatched(id)}
                                      className="flex-1 py-1.5 px-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                      title="Mark as Watched"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Mark Watched</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => removeFromWatchlist(id)}
                                    className="p-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 rounded-xl text-xs transition-colors cursor-pointer"
                                    title="Remove from Watchlist"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              /* Upcoming Unreleased Item: Single Remove Button Only */
                              <button
                                onClick={() => removeFromWatchlist(id)}
                                className="w-full py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Remove from Watchlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove from Watchlist</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
                <p className="text-xs text-slate-400">
                  Showing{' '}
                  <strong className="text-white font-bold">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                  </strong>{' '}
                  of <strong className="text-white font-bold">{filteredItems.length}</strong> titles
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const getPages = (current: number, total: number): (number | string)[] => {
                        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                        if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
                        if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
                        return [1, '...', current - 1, current, current + 1, '...', total];
                      };

                      return getPages(currentPage, totalPages).map((page, idx) => {
                        if (typeof page === 'string') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-500 text-xs font-bold select-none">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === page
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
