'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  List,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  RefreshCw,
  Eye,
  Bookmark,
  Check,
  Film,
  Tv,
  Star,
  Plus,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { MediaItem } from '@/types/cinetrack';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '46b64310f8c3347203f4780bbac0144d';
const IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';

// ---------- types ----------
interface SearchResult {
  query: string;
  status: 'pending' | 'searching' | 'found' | 'not_found' | 'error';
  candidates: MediaItem[];
  selected: MediaItem | null;
}

// ---------- TMDB helpers ----------
function tmdbItemToMedia(item: any, mediaType: 'movie' | 'tv'): MediaItem {
  const SAMPLE_TRAILERS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  ];
  const genresMap: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy',
  };
  const title = item.title || item.name || 'Untitled';
  const releaseDate = item.release_date || item.first_air_date || '';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 0;
  const genres = (item.genre_ids || []).map((id: number) => genresMap[id] || 'Entertainment').filter(Boolean);

  return {
    internalId: `${mediaType}-${item.id}`,
    tmdbId: item.id,
    imdbId: item.imdb_id || `tt${item.id}`,
    title,
    description: item.overview || '',
    poster: item.poster_path
      ? `${IMAGE_BASE_W500}${item.poster_path}`
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    backdrop: item.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
      : '',
    releaseDate,
    releaseYear,
    genres: genres.length > 0 ? genres : ['Entertainment'],
    type: mediaType,
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 0,
    runtime: item.runtime || 120,
    language: item.original_language?.toUpperCase() || 'EN',
    country: item.origin_country?.[0] || 'US',
    streamUrl: SAMPLE_TRAILERS[0],
    featured: false,
    trendingScore: Math.floor(item.popularity * 10) || 0,
    isUpcoming: releaseDate ? new Date(releaseDate) > new Date() : false,
  };
}

async function searchTMDB(query: string): Promise<MediaItem[]> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?${params.toString()}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 3)
    .map((r: any) => tmdbItemToMedia(r, r.media_type as 'movie' | 'tv'));
}

// ---------- component ----------
interface Props {
  onClose: () => void;
}

type Step = 'input' | 'review' | 'confirm';

export default function BulkAddModal({ onClose }: Props) {
  const { addToWatchlist } = useApp();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addAs, setAddAs] = useState<'watched' | 'unwatched'>('unwatched');
  const [adding, setAdding] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Step 1 -> Step 2
  const handleSearch = useCallback(async () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setSearching(true);

    const initial: SearchResult[] = lines.map((q) => ({
      query: q,
      status: 'searching',
      candidates: [],
      selected: null,
    }));
    setResults(initial);
    setStep('review');

    const settled = await Promise.all(
      lines.map(async (query) => {
        try {
          const candidates = await searchTMDB(query);
          return {
            query,
            status: candidates.length > 0 ? 'found' : 'not_found',
            candidates,
            selected: candidates[0] || null,
          } as SearchResult;
        } catch {
          return {
            query,
            status: 'error',
            candidates: [],
            selected: null,
          } as SearchResult;
        }
      })
    );

    setResults(settled);
    setSearching(false);
  }, [rawText]);

  // Step 2 -> Step 3
  const handleProceedToConfirm = () => {
    const found = results.filter((r) => r.selected !== null);
    if (found.length === 0) {
      showToast('No valid matches to add.', 'error');
      return;
    }
    setStep('confirm');
  };

  // Step 3: bulk add
  const handleBulkAdd = async () => {
    setAdding(true);
    const toAdd = results.filter((r) => r.selected !== null);
    for (const r of toAdd) {
      addToWatchlist(r.selected!, addAs === 'watched');
    }
    setAdding(false);
    showToast(
      `Added ${toAdd.length} title${toAdd.length !== 1 ? 's' : ''} to your ${addAs === 'watched' ? 'Watched list' : 'Watchlist'}!`,
      'success'
    );
    onClose();
  };

  const removeRow = (i: number) => {
    setResults((prev) => prev.filter((_, idx) => idx !== i));
  };

  const selectCandidate = (rowIndex: number, candidate: MediaItem) => {
    setResults((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, selected: candidate, status: 'found' } : r
      )
    );
    setSwapIndex(null);
  };

  const retryRow = async (i: number) => {
    const query = results[i].query;
    setResults((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, status: 'searching' } : r))
    );
    const candidates = await searchTMDB(query);
    setResults((prev) =>
      prev.map((r, idx) =>
        idx === i
          ? {
              ...r,
              status: candidates.length > 0 ? 'found' : 'not_found',
              candidates,
              selected: candidates[0] || null,
            }
          : r
      )
    );
  };

  const foundCount = results.filter((r) => r.selected).length;
  const notFoundCount = results.filter((r) => r.status === 'not_found' || r.status === 'error').length;
  const pendingCount = results.filter((r) => r.status === 'searching').length;
  const titleCount = rawText.split('\n').filter((l) => l.trim()).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #141420 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <List className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Bulk Add Titles</h2>
              <p className="text-slate-400 text-xs">
                {step === 'input' && 'Enter movie & show names, one per line'}
                {step === 'review' && 'Review & confirm the matches'}
                {step === 'confirm' && 'Choose how to add them'}
              </p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mr-3">
            {(['input', 'review', 'confirm'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-violet-600 text-white'
                    : (step === 'confirm' && i < 2) || (step === 'review' && i < 1)
                    ? 'bg-emerald-600/40 text-emerald-300'
                    : 'bg-white/10 text-slate-400'
                }`}>{i + 1}</div>
                {i < 2 && <div className="w-3 h-px bg-white/20" />}
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: INPUT */}
        {step === 'input' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
              <p className="text-slate-400 text-sm leading-relaxed">
                Type or paste your list of movies and TV shows —{' '}
                <span className="text-white font-medium">one title per line</span>. We&apos;ll search
                TMDB for each and let you review before adding.
              </p>
              <textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={"Inception\nBreaking Bad\nThe Dark Knight\nInterstellar\nGame of Thrones"}
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/60 transition-all font-mono leading-relaxed"
              />
              <p className="text-xs text-slate-500">
                {titleCount} title{titleCount !== 1 ? 's' : ''} entered
              </p>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-violet-600/20"
              >
                <Search className="w-4 h-4" />
                Search Titles
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW */}
        {step === 'review' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Status bar */}
            <div className="px-6 py-2.5 bg-white/3 border-b border-white/8 flex items-center gap-4 text-xs flex-wrap">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Searching {pendingCount}…
                </span>
              )}
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> {foundCount} matched
              </span>
              {notFoundCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-3 h-3" /> {notFoundCount} not found
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl border transition-all ${
                    r.status === 'searching'
                      ? 'border-white/10 bg-white/3'
                      : r.selected
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : 'border-red-500/30 bg-red-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Poster */}
                    {r.status === 'searching' ? (
                      <div className="w-12 h-16 rounded-lg bg-white/10 flex items-center justify-center shrink-0 animate-pulse">
                        <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                      </div>
                    ) : r.selected ? (
                      <img
                        src={r.selected.poster}
                        alt={r.selected.title}
                        className="w-12 h-16 object-cover rounded-lg shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-0.5 truncate">
                        Searched:{' '}
                        <span className="text-slate-300 italic">&quot;{r.query}&quot;</span>
                      </p>
                      {r.status === 'searching' ? (
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                      ) : r.selected ? (
                        <>
                          <p className="text-white font-semibold text-sm leading-tight truncate">
                            {r.selected.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              {r.selected.type === 'tv' ? (
                                <Tv className="w-3 h-3" />
                              ) : (
                                <Film className="w-3 h-3" />
                              )}
                              {r.selected.type === 'movie' ? 'Movie' : 'TV Show'}
                            </span>
                            {r.selected.releaseYear > 0 && (
                              <span className="text-xs text-slate-400">{r.selected.releaseYear}</span>
                            )}
                            {r.selected.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-400">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                {r.selected.rating}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-medium text-sm">Not found</p>
                          <p className="text-xs text-slate-500">No TMDB match for this title</p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {r.status !== 'searching' && r.candidates.length > 1 && (
                        <button
                          onClick={() => setSwapIndex(swapIndex === i ? null : i)}
                          title="Pick a different match"
                          className="p-1.5 rounded-lg bg-white/8 hover:bg-violet-600/30 text-slate-400 hover:text-violet-300 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(r.status === 'not_found' || r.status === 'error') && (
                        <button
                          onClick={() => retryRow(i)}
                          title="Retry search"
                          className="p-1.5 rounded-lg bg-white/8 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => removeRow(i)}
                        title="Remove from list"
                        className="p-1.5 rounded-lg bg-white/8 hover:bg-red-600/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Swap panel */}
                  {swapIndex === i && r.candidates.length > 0 && (
                    <div className="border-t border-white/10 px-3 pb-3 pt-2">
                      <p className="text-xs text-slate-400 mb-2 font-medium">Pick a different match:</p>
                      <div className="flex flex-col gap-2">
                        {r.candidates.map((c) => (
                          <button
                            key={c.internalId}
                            onClick={() => selectCandidate(i, c)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              r.selected?.internalId === c.internalId
                                ? 'border-violet-500/60 bg-violet-600/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            <img
                              src={c.poster}
                              alt={c.title}
                              className="w-8 h-11 object-cover rounded shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=200';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-semibold truncate">{c.title}</p>
                              <p className="text-slate-400 text-xs">
                                {c.type === 'tv' ? 'TV' : 'Movie'} · {c.releaseYear || '—'}
                              </p>
                            </div>
                            {r.selected?.internalId === c.internalId && (
                              <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {results.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-sm">No results to show.</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Edit List
              </button>
              <button
                onClick={handleProceedToConfirm}
                disabled={foundCount === 0 || pendingCount > 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-violet-600/20"
              >
                Continue with {foundCount} title{foundCount !== 1 ? 's' : ''}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 'confirm' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
              {/* Add-as selector */}
              <div>
                <p className="text-white font-semibold text-sm mb-3">Add these titles as:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAddAs('unwatched')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                      addAs === 'unwatched'
                        ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    <Bookmark className={`w-6 h-6 ${addAs === 'unwatched' ? 'text-violet-400' : ''}`} />
                    <span className="font-semibold text-sm">Watchlist</span>
                    <span className="text-xs opacity-70">Plan to watch later</span>
                  </button>
                  <button
                    onClick={() => setAddAs('watched')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                      addAs === 'watched'
                        ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    <Eye className={`w-6 h-6 ${addAs === 'watched' ? 'text-emerald-400' : ''}`} />
                    <span className="font-semibold text-sm">Already Watched</span>
                    <span className="text-xs opacity-70">Mark as watched</span>
                  </button>
                </div>
              </div>

              {/* Summary list */}
              <div>
                <p className="text-white font-semibold text-sm mb-3">
                  {foundCount} title{foundCount !== 1 ? 's' : ''} will be added:
                </p>
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                  {results
                    .filter((r) => r.selected)
                    .map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/8"
                      >
                        <img
                          src={r.selected!.poster}
                          alt={r.selected!.title}
                          className="w-9 h-12 object-cover rounded-lg shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=200';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{r.selected!.title}</p>
                          <p className="text-slate-400 text-xs">
                            {r.selected!.type === 'tv' ? 'TV Show' : 'Movie'} · {r.selected!.releaseYear || '—'}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            addAs === 'watched'
                              ? 'bg-emerald-600/30 text-emerald-300'
                              : 'bg-violet-600/30 text-violet-300'
                          }`}
                        >
                          {addAs === 'watched' ? 'Watched' : 'Watchlist'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('review')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={adding}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg ${
                  addAs === 'watched'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/20'
                }`}
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add {foundCount} Title{foundCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
