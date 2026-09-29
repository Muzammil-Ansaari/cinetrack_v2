'use client';

import React from 'react';
import { Play, X, Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useDragScroll } from '@/hooks/useDragScroll';
import { MediaItem } from '@/types/cinetrack';

export default function ContinueWatchingRow() {
  const { history, playMedia, catalog, removeFromHistory, updatePlaybackProgress, addToWatchlist, markAsUnwatched, isInWatchlist } = useApp();
  const { ref: scrollRef, events, isDragging } = useDragScroll<HTMLDivElement>();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!history || history.length === 0) return null;

  return (
    <section className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Scroll Arrows matching ContentRow */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">Continue Watching</h2>
          <span className="text-xs text-slate-400 font-medium">({history.length})</span>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-all"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-all"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Draggable Rail */}
      <div
        ref={scrollRef}
        {...events}
        className={`flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-2 px-1 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {history.map((item) => {
          // Parse numeric TMDB ID accurately (e.g., 'tv-37680' -> 37680)
          const parsedIdStr = String(item.mediaId).replace(/^(movie|tv)-/, '');
          const numericTmdbId = Number(parsedIdStr) || 0;
          const detectedType = item.type || (String(item.mediaId).startsWith('tv-') ? 'tv' : 'movie');

          const catalogItem = catalog.find(
            (m) => m.internalId === item.mediaId || m.tmdbId === numericTmdbId
          );

          const media: MediaItem = catalogItem || {
            internalId: item.mediaId.includes('-') ? item.mediaId : `${detectedType}-${item.mediaId}`,
            tmdbId: numericTmdbId,
            title: item.title,
            description: '',
            poster: item.poster,
            backdrop: item.backdrop || item.poster,
            releaseDate: '',
            releaseYear: item.releaseYear || 2026,
            genres: item.genres || [],
            type: detectedType,
            rating: 8.5,
          };

          const genresList = (media.genres && media.genres.length > 0 ? media.genres : item.genres) || [];
          const year = media.releaseYear || item.releaseYear || 2026;

          const isWatched = item.duration > 0 && item.currentTime >= item.duration * 0.9;
          const progressPercent = isWatched
            ? 100
            : item.duration > 0 && item.currentTime > 0
            ? Math.min(100, Math.max(10, (item.currentTime / item.duration) * 100))
            : 35; // Default progress bar indicator

          const isTV = detectedType === 'tv';

          const handlePlayClick = () => {
            const ep = isTV ? {
              id: (item.seasonNumber || 1) * 100 + (item.episodeNumber || 1),
              seasonNumber: item.seasonNumber || 1,
              episodeNumber: item.episodeNumber || 1,
              title: item.episodeTitle || `Episode ${item.episodeNumber || 1}`,
              description: '',
              thumbnail: item.backdrop || item.poster,
              runtime: 45,
              releaseDate: '',
            } : undefined;

            playMedia(media, ep);
          };

          const genresText = genresList.length > 0 ? genresList.slice(0, 2).join(' • ') : (isTV ? 'TV Series' : 'Movie');
          const subtitleText = isTV
            ? item.episodeTitle
              ? `S${item.seasonNumber || 1} E${item.episodeNumber || 1} • ${genresText}`
              : `Season ${item.seasonNumber || 1} • ${genresText}`
            : `${year} • ${genresText}`;

          return (
            <div
              key={item.mediaId}
              onClick={handlePlayClick}
              className="group relative flex-none w-64 sm:w-72 rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
            >
              {/* Quick Status Buttons: Watched & Unwatched */}
              <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const dur = item.duration || 7200;
                    updatePlaybackProgress(media, dur, dur);
                    addToWatchlist(media, true);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md border transition-all flex items-center gap-1 cursor-pointer ${
                    isWatched
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40'
                      : 'bg-black/75 hover:bg-emerald-600 text-slate-200 hover:text-white border-white/15 hover:border-emerald-500'
                  }`}
                  title="Mark as Watched"
                >
                  <Check className="w-3 h-3 text-emerald-400 group-hover:text-white" />
                  <span>Watched</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updatePlaybackProgress(media, 0, item.duration || 7200);
                    if (isInWatchlist(media.internalId)) {
                      markAsUnwatched(media.internalId);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md border transition-all flex items-center gap-1 cursor-pointer ${
                    !isWatched && item.currentTime === 0
                      ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-950/40'
                      : 'bg-black/75 hover:bg-amber-600 text-slate-200 hover:text-white border-white/15 hover:border-amber-500'
                  }`}
                  title="Mark as Unwatched"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400 group-hover:text-white" />
                  <span>Unwatched</span>
                </button>
              </div>

              {/* Remove (Delete) Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromHistory(item.mediaId);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-red-600 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition-all z-20 cursor-pointer"
                title="Remove from Continue Watching"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Image & Progress Overlay */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                {/* eslint-disable-next-img-element */}
                <img
                  src={item.backdrop || item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Play Center Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors opacity-90 group-hover:opacity-100">
                  <div className="w-12 h-12 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>

                {/* TV Episode or Watched Status Badge */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white z-10 pointer-events-none">
                  <span className="font-semibold px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10">
                    {isTV ? `S0${item.seasonNumber || 1} E0${item.episodeNumber || 1}` : 'Movie'}
                  </span>

                  {isWatched && (
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded backdrop-blur-md font-semibold">
                      <Check className="w-3 h-3" />
                      <span>Watched</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                  <div
                    className={`h-full transition-all duration-300 ${isWatched ? 'bg-emerald-500' : 'bg-red-600'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Text info (No bottom Resume button) */}
              <div className="p-3">
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {subtitleText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
