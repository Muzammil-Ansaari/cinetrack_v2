'use client';

import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Film, Tv, SlidersHorizontal } from 'lucide-react';
import { searchMedia } from '@/lib/tmdb';
import { MediaItem } from '@/types/cinetrack';
import MediaCard from '@/components/MediaCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchMedia(query);
      setResults(res);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = results.filter((item) => {
    if (typeFilter === 'all') return true;
    return item.type === typeFilter;
  });

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Search Input Bar */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-black text-white text-center tracking-tight">Global Search</h1>
          
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl glass-panel border border-white/20 shadow-2xl">
            <SearchIcon className="w-6 h-6 text-red-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by movie title, TV show, actor name, or genre..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-base font-medium outline-none"
              autoFocus
            />
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'all' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setTypeFilter('movie')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'movie' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Movies Only
            </button>
            <button
              onClick={() => setTypeFilter('tv')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'tv' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              TV Shows Only
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Searching Cinetrack database...</p>
          </div>
        )}

        {/* Search Results Grid */}
        {!loading && query && filteredResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">
              Found {filteredResults.length} title{filteredResults.length > 1 ? 's' : ''} for &quot;{query}&quot;
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredResults.map((item) => (
                <MediaCard key={item.internalId} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && query && filteredResults.length === 0 && (
          <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl max-w-md mx-auto p-8 border border-white/10">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No results found</h3>
            <p className="text-xs text-slate-400 mt-1">Try searching for &quot;Avatar&quot;, &quot;Dune&quot;, or &quot;Action&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
