'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Film, Tv, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { searchMedia, searchActors } from '@/lib/tmdb';
import { MediaItem, ActorItem } from '@/types/cinetrack';
import MediaCard from '@/components/MediaCard';
import ActorCard from '@/components/ActorCard';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const [query, setQuery] = useState(urlQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv' | 'actor'>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [actors, setActors] = useState<ActorItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync state if URL query or page parameter changes
  useEffect(() => {
    const qParam = searchParams.get('q');
    const pParam = searchParams.get('page');
    if (qParam !== null) {
      setQuery(qParam);
    }
    if (pParam) {
      const parsedP = parseInt(pParam, 10);
      if (!isNaN(parsedP) && parsedP > 0) {
        setCurrentPage(parsedP);
      }
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    let isCurrent = true;

    if (!query.trim()) {
      setResults([]);
      setActors([]);
      setTotalPages(1);
      setTotalResults(0);
      setLoading(false);
      return;
    }
    // Immediately clear stale results and actors so previous data never flashes
    setResults([]);
    setActors([]);
    setLoading(true);

    const timer = setTimeout(async () => {
      const [res, actorRes] = await Promise.all([
        searchMedia(query, currentPage),
        currentPage === 1 ? searchActors(query) : Promise.resolve([]),
      ]);

      if (isCurrent) {
        setResults(res.items);
        setTotalPages(res.totalPages);
        setTotalResults(res.totalResults);
        setActors(actorRes);
        setLoading(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setCurrentPage(1);
      router.push(`/search?q=${encodeURIComponent(query.trim())}&page=1`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    router.push(`/search?q=${encodeURIComponent(query.trim())}&page=${newPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl glass-panel border border-white/20 shadow-2xl"
          >
            <button
              type="submit"
              className="p-1 text-red-500 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
              title="Execute Search"
            >
              <SearchIcon className="w-6 h-6" />
            </button>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Movies, TV Shows, or Actors..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-base font-medium outline-none"
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCurrentPage(1);
                  router.push('/search');
                }}
                className="p-1 text-slate-400 hover:text-white rounded-full shrink-0 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Type Filter Chips */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            {(() => {
              const moviesCount = results.filter((r) => r.type === 'movie').length;
              const tvCount = results.filter((r) => r.type === 'tv').length;
              const actorCount = actors.length;
              const allCount = results.length + actorCount;

              return (
                <>
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      typeFilter === 'all'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>All Results</span>
                    {query && !loading && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/20">
                        {allCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setTypeFilter('movie')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      typeFilter === 'movie'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Movies</span>
                    {query && !loading && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/20">
                        {moviesCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setTypeFilter('tv')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      typeFilter === 'tv'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>TV Shows</span>
                    {query && !loading && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/20">
                        {tvCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setTypeFilter('actor')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      typeFilter === 'actor'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Actors</span>
                    {query && !loading && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-white/20">
                        {actorCount}
                      </span>
                    )}
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Searching Cinetrack Vault (Page {currentPage})...</p>
          </div>
        )}

        {/* Matching Actor Cards Section */}
        {!loading && query && actors.length > 0 && currentPage === 1 && (typeFilter === 'all' || typeFilter === 'actor') && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <User className="w-5 h-5 text-red-500" />
              <span>Actors ({actors.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {actors.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </div>
        )}

        {/* Search Results Grid & Pagination */}
        {!loading && query && filteredResults.length > 0 && typeFilter !== 'actor' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
              <h3 className="text-xl font-bold text-white">
                Found {totalResults > 0 ? totalResults : filteredResults.length} title{totalResults !== 1 ? 's' : ''} for &quot;{query}&quot;
              </h3>
              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredResults.map((item) => (
                <MediaCard key={item.internalId} item={item} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
                <p className="text-xs text-slate-400">
                  Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalResults} items found)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page Number Buttons */}
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
                            disabled={loading}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === page
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
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
                    disabled={currentPage === totalPages || loading}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State / No Query Prompt */}
        {!loading && !query && (
          <div className="text-center py-12 space-y-4 max-w-lg mx-auto">
            <Film className="w-12 h-12 text-red-500/60 mx-auto" />
            <h3 className="text-lg font-bold text-white">Search Movies, TV Shows & Actors</h3>
            <p className="text-xs text-slate-400">
              Type any movie title, TV show, or actor name above to explore the catalog.
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-2">
              {['Tom Cruise', 'Zendaya', 'Avatar', 'Dune', 'Stranger Things', 'Batman', 'Cillian Murphy', 'Christopher Nolan'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    setCurrentPage(1);
                    router.push(`/search?q=${encodeURIComponent(term)}&page=1`);
                  }}
                  className="px-3.5 py-2 bg-white/5 hover:bg-red-600/20 text-slate-300 hover:text-white rounded-xl text-xs border border-white/10 hover:border-red-500/40 transition-all cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty Results State */}
        {!loading && query && (typeFilter === 'actor' ? actors.length === 0 : filteredResults.length === 0) && (
          <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl max-w-md mx-auto p-8 border border-white/10">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No results found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try searching for &quot;Avatar&quot;, &quot;Dune&quot;, or &quot;Tom Cruise&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-20 min-h-screen text-center text-slate-400">
          Loading Search...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
