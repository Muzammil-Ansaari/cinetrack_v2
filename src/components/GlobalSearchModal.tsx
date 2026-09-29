'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Play, Plus, Check, Star, Film, Tv, ArrowRight, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { searchMedia, searchActors } from '@/lib/tmdb';
import { MediaItem, ActorItem } from '@/types/cinetrack';
import ActorCard from '@/components/ActorCard';

export default function GlobalSearchModal() {
  const router = useRouter();
  const { isSearchOpen, closeSearch, playMedia, addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    // Immediately clear stale results to prevent previous data flashing
    setResults([]);
    setLoading(true);

    const timer = setTimeout(async () => {
      const res = await searchMedia(query, 1);
      setResults(res.items.slice(0, 6));
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSearchOpen) closeSearch();
        else {
          // Open search logic handled in context
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      closeSearch();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center px-5 py-4 border-b border-white/10 gap-3">
          <button
            type="submit"
            className="p-1 text-red-500 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
            title="Search all titles"
          >
            <Search className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, actors... (Press Enter to view all)"
            className="w-full bg-transparent text-white placeholder-slate-400 text-lg font-medium outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-full shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition-colors shrink-0 cursor-pointer"
          >
            ESC
          </button>
        </form>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
          {loading && (
            <div className="text-center py-8 text-slate-400 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>Searching database...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-base font-semibold text-slate-300">No titles found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-500">Try searching for &quot;Avatar&quot;, &quot;Dune&quot;, &quot;Batman&quot;, or &quot;Action&quot;</p>
            </div>
          )}

          {!query && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {['Avatar', 'Dune', 'Stranger Things', 'Action', 'Sci-Fi', 'Batman', 'Christopher Nolan'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs border border-white/10 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Actor Cards Section */}
          {results.map((item) => {
            const inWatchlist = isInWatchlist(item.internalId);
            return (
              <div
                key={item.internalId}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
              >
                {/* Clickable Card Link -> Opens Details Page */}
                <Link
                  href={`/${item.type}/${item.internalId}`}
                  onClick={closeSearch}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    {/* eslint-disable-next-img-element */}
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-white/10">
                        {item.type === 'tv' ? 'TV Series' : 'Movie'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{item.releaseYear}</span>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                    <p className="text-[11px] text-slate-400 font-normal mt-1">
                      {item.genres.join(' • ')} {item.director ? `| Dir: ${item.director}` : ''}
                    </p>
                  </div>
                </Link>

                {/* Direct Action Buttons: Play & Watchlist (+) Only */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playMedia(item);
                      closeSearch();
                    }}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-red-600/30 hover:scale-105 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      inWatchlist ? removeFromWatchlist(item.internalId) : addToWatchlist(item);
                    }}
                    className={`p-2 rounded-xl border text-xs hover:scale-105 transition-all ${
                      inWatchlist
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 hover:bg-emerald-600/50'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}

          {query.trim() && (
            <button
              onClick={() => handleSearchSubmit()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600/30 via-red-600/40 to-rose-600/30 hover:from-red-600 hover:to-rose-600 border border-red-500/40 hover:border-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg mt-3 group"
            >
              <span>View All Results for &quot;{query}&quot;</span>
              <ArrowRight className="w-4 h-4 text-red-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
