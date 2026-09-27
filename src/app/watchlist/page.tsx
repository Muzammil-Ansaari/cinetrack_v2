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
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';

export default function WatchlistPage() {
  const { showToast } = useToast();
  const {
    watchlist,
    removeFromWatchlist,
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
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Import v1 Data Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoadSampleJSON = () => {
    const sample = {
      watched: [
        { title: 'Inception', releaseYear: 2010, rating: 8.8, type: 'movie', genres: ['Sci-Fi', 'Action'] },
        { title: 'Breaking Bad', releaseYear: 2008, rating: 9.5, type: 'tv', genres: ['Drama', "Crime"] }
      ],
      unwatched: [
        { title: 'The Dark Knight', releaseYear: 2008, rating: 9.0, type: 'movie', genres: ['Action', 'Drama'] }
      ],
      upcoming: [
        { title: 'Avatar 3', releaseDate: '2026-12-18', type: 'movie', isUpcoming: true, genres: ['Sci-Fi', 'Adventure'] }
      ]
    };
    setJsonInput(JSON.stringify(sample, null, 2));
    setImportError(null);
  };

  const handleImportJSON = async () => {
    if (!jsonInput.trim()) return;
    try {
      setImporting(true);
      setImportError(null);
      const parsed = JSON.parse(jsonInput);

      const token = localStorage.getItem('cinetrack_token');
      const res = await fetch('/api/user/import-watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || 'Failed to import watchlist data.');
        return;
      }

      showToast(data.message || 'Data imported successfully!', 'success', 'Import Complete');
      setIsImportModalOpen(false);
      setJsonInput('');

      // Refresh page to sync state
      window.location.reload();
    } catch (err: any) {
      setImportError(`Invalid JSON format: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Categorize Watchlist Items
  const categorized = useMemo(() => {
    const watched = watchlist.filter((w) => w.isWatched === true);

    const unwatched: typeof watchlist = [];
    const upcoming: typeof watchlist = [];

    watchlist.forEach((w) => {
      if (w.isWatched) return;

      const releaseDate = w.media.releaseDate || '';
      const isFutureRelease = releaseDate > todayStr || (w.media.isUpcoming && releaseDate > todayStr);

      if (isFutureRelease) {
        upcoming.push(w);
      } else {
        unwatched.push(w);
      }
    });

    return { unwatched, watched, upcoming };
  }, [watchlist, todayStr]);

  // Select items for the active tab
  const currentTabItems = categorized[activeMainTab];

  // Extract all unique genres dynamically from the user's watchlist
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    watchlist.forEach((w) => {
      if (w.media?.genres && Array.isArray(w.media.genres)) {
        w.media.genres.forEach((g) => {
          if (g && typeof g === 'string') {
            genreSet.add(g.trim());
          }
        });
      }
    });
    return Array.from(genreSet).sort();
  }, [watchlist]);

  // Extract all unique release years dynamically from the user's watchlist
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    watchlist.forEach((w) => {
      const year = w.media?.releaseYear || (w.media?.releaseDate ? w.media.releaseDate.split('-')[0] : null);
      if (year) {
        yearSet.add(year.toString());
      }
    });
    return Array.from(yearSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [watchlist]);

  // Apply Media Type, Search, Genre, and Year Filters
  const filteredItems = useMemo(() => {
    return currentTabItems.filter((w) => {
      const matchesType = mediaTypeFilter === 'all' || w.media.type === mediaTypeFilter;
      
      const matchesSearch =
        !searchQuery ||
        w.media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.media.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === 'all' ||
        (w.media.genres && w.media.genres.includes(selectedGenre));

      const itemYear = w.media.releaseYear?.toString() || (w.media.releaseDate ? w.media.releaseDate.split('-')[0] : '');
      const matchesYear = selectedYear === 'all' || itemYear === selectedYear;

      return matchesType && matchesSearch && matchesGenre && matchesYear;
    });
  }, [currentTabItems, mediaTypeFilter, searchQuery, selectedGenre, selectedYear]);

  // Pagination (30 items per page)
  const ITEMS_PER_PAGE = 30;
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeMainTab, mediaTypeFilter, searchQuery, selectedGenre, selectedYear]);

  const hasActiveFilters =
    selectedGenre !== 'all' || selectedYear !== 'all' || mediaTypeFilter !== 'all' || searchQuery !== '';

  const clearAllFilters = () => {
    setSelectedGenre('all');
    setSelectedYear('all');
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
                  Watchlist
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-400 pl-1">
              Organize, track, and get notified about your saved movies and TV shows.
            </p>
          </div>

          {/* Controls: Search & Import v1 Data Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter watchlist..."
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

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Import v1 Data</span>
            </button>
          </div>
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
                {categorized.unwatched.length}
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
                {categorized.watched.length}
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
                {categorized.upcoming.length}
              </span>
            </button>

          </div>

          {/* Sub Filters: Media Type Tabs, Genre Filter, Year Filter, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            {/* Left: Media Type Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
              <button
                onClick={() => setMediaTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  mediaTypeFilter === 'all' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMediaTypeFilter('movie')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  mediaTypeFilter === 'movie' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Movies</span>
              </button>
              <button
                onClick={() => setMediaTypeFilter('tv')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  mediaTypeFilter === 'tv' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Shows</span>
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

              {/* Dynamic Year Filter Selector */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none font-semibold cursor-pointer text-xs pr-1 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="all">All Years ({availableYears.length})</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
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
              {paginatedItems.map(({ media, id, isWatched }) => {
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
                        {isWatched && (
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
                        {!isFuture ? (
                          <>
                            {/* Play Button */}
                            <button
                              onClick={() => playMedia(media)}
                              className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>{isWatched ? 'Play Again' : 'Play Now'}</span>
                            </button>

                            {/* Toggle Watched & Remove Buttons */}
                            <div className="flex items-center gap-2">
                              {isWatched ? (
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                    })}
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

      {/* Import v1 Data Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl max-w-2xl w-full border border-white/10 shadow-2xl overflow-hidden my-8 p-6 md:p-8 space-y-6 relative">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Import Version 1 Data</h3>
                <p className="text-xs text-slate-400">Paste your JSON data dump of watched, unwatched, or upcoming titles</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">JSON Format Data Payload</span>
                <button
                  onClick={handleLoadSampleJSON}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  Load Sample v1 Format
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{\n  "watched": [{ "title": "Inception", "releaseYear": 2010 }],\n  "unwatched": [{ "title": "The Dark Knight" }],\n  "upcoming": [{ "title": "Avatar 3", "releaseDate": "2026-12-18" }]\n}'
                className="w-full h-52 p-4 bg-black/60 border border-white/10 rounded-2xl font-mono text-xs text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />

              {importError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold">
                  {importError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJSON}
                disabled={importing || !jsonInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Importing...' : 'Import Movies Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
