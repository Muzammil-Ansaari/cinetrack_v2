'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Play, Plus, Check, Star, Tv, Calendar, ArrowLeft, ChevronDown, X, Eye, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getMediaDetails, getSimilarMedia, getSeasonEpisodes, MOCK_MEDIA_ITEMS } from '@/lib/tmdb';
import { MediaItem, Season } from '@/types/cinetrack';
import ContentRow from '@/components/ContentRow';
import { formatReleaseDate } from '@/components/MediaCard';

export default function TVShowDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { playMedia, addToWatchlist, removeFromWatchlist, isInWatchlist, isWatched, markAsUnwatched } = useApp();

  const [show, setShow] = useState<MediaItem | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [similarShows, setSimilarShows] = useState<MediaItem[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (id) {
      getMediaDetails(id).then((res) => {
        if (res && res.type === 'tv') {
          setShow(res);
          if (res.seasons && res.seasons.length > 0) {
            setSelectedSeasonNumber(res.seasons[0].seasonNumber);
          }
          // Fetch similar TV shows
          getSimilarMedia(res.tmdbId, 'tv').then(setSimilarShows);
        } else {
          const fallback = MOCK_MEDIA_ITEMS.find((item) => item.type === 'tv') || MOCK_MEDIA_ITEMS[2];
          setShow(fallback);
          if (fallback.seasons && fallback.seasons.length > 0) {
            setSelectedSeasonNumber(fallback.seasons[0].seasonNumber);
          }
        }
      });
    }
  }, [id]);

  // Dynamically load real episode names and data when season selection changes
  useEffect(() => {
    if (!show || !show.tmdbId) return;

    const currentSeasonObj = show.seasons?.find((s) => s.seasonNumber === selectedSeasonNumber);
    const needsFetch =
      !currentSeasonObj?.episodes ||
      currentSeasonObj.episodes.length === 0 ||
      currentSeasonObj.episodes.every((ep) => ep.title.startsWith('Episode '));

    if (needsFetch) {
      getSeasonEpisodes(show.tmdbId, selectedSeasonNumber, show.backdrop).then((episodes) => {
        if (episodes.length > 0) {
          setShow((prev) => {
            if (!prev || !prev.seasons) return prev;
            const updatedSeasons = prev.seasons.map((s) =>
              s.seasonNumber === selectedSeasonNumber ? { ...s, episodes } : s
            );
            return { ...prev, seasons: updatedSeasons };
          });
        }
      });
    }
  }, [show?.tmdbId, selectedSeasonNumber]);

  if (!show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-slate-400 space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wider uppercase">Loading TV show details...</p>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(show.internalId);
  const isUnreleased = show.isUpcoming || (show.releaseDate ? new Date(show.releaseDate) > new Date() : false);
  const seasons = show.seasons || [];
  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0];

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop */}
      <div className="relative w-full h-[65vh] min-h-[480px]">
        {/* eslint-disable-next-img-element */}
        <img
          src={show.backdrop}
          alt={show.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent w-full md:w-2/3" />

        {/* Back Link */}
        <div className="absolute top-24 left-4 sm:left-8 z-20">
          <Link
            href="/tv"
            className="flex items-center gap-2 px-3.5 py-2 bg-black/60 hover:bg-black/90 border border-white/10 text-slate-200 hover:text-white rounded-full text-xs font-semibold backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to TV Shows</span>
          </Link>
        </div>
      </div>

      {/* Main Details Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-56 sm:w-64 aspect-[2/3] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-red-600/20 shrink-0 bg-slate-900 mx-auto md:mx-0">
            <img src={show.poster} alt={show.title} className="w-full h-full object-cover" />
          </div>

          {/* Column Info */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="uppercase text-xs font-extrabold px-2.5 py-1 rounded bg-red-600 text-white flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5" />
                  <span>TV Series</span>
                </span>
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded text-xs font-bold backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{show.rating.toFixed(1)} / 10</span>
                </div>
                <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded bg-white/10 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatReleaseDate(show.releaseDate)}</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-950/80 border border-red-800/60 text-red-300">
                  {show.seasonsCount || seasons.length || 1} Seasons • {show.episodesCount || 10} Episodes
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {show.title}
              </h1>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {show.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/15 text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            {(() => {
              const isUnreleased = show.isUpcoming || (show.releaseDate ? new Date(show.releaseDate) > new Date() : false);
              const itemIsWatched = isWatched(show.internalId);

              return (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 w-full">
                  {!isUnreleased ? (
                    <button
                      onClick={() => {
                        const ep = currentSeason?.episodes[0];
                        playMedia(show, ep);
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-3 py-2 sm:px-7 sm:py-3.5 rounded-full text-xs sm:text-base shadow-xl shadow-red-600/30 hover:scale-105 transition-all cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white shrink-0" />
                      <span><span className="inline sm:hidden">Play S1E1</span><span className="hidden sm:inline">Watch First Episode</span></span>
                    </button>
                  ) : (
                    <div className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold px-3 py-2 sm:px-7 sm:py-3.5 rounded-full text-xs sm:text-base backdrop-blur-md shrink-0">
                      <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                      <span>Coming Soon</span>
                    </div>
                  )}

                  {/* Watch Trailer Button */}
                  {show.trailerUrl && (
                    <button
                      onClick={() => setShowTrailer(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-3 py-2 sm:px-6 sm:py-3.5 rounded-full text-xs sm:text-base backdrop-blur-md transition-all hover:scale-105 hover:border-red-500/50 cursor-pointer shrink-0"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-500 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span><span className="inline sm:hidden">Trailer</span><span className="hidden sm:inline">Watch Trailer</span></span>
                    </button>
                  )}

                  {/* Add to Watchlist Button */}
                  <button
                    onClick={() => (inWatchlist && !itemIsWatched ? removeFromWatchlist(show.internalId) : addToWatchlist(show, false))}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 font-medium px-3 py-2 sm:px-6 sm:py-3.5 rounded-full text-xs sm:text-base backdrop-blur-md border transition-all cursor-pointer shrink-0 ${
                      inWatchlist && !itemIsWatched
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 hover:bg-blue-600/40'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    {inWatchlist && !itemIsWatched ? <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400 shrink-0" /> : <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />}
                    <span>{inWatchlist && !itemIsWatched ? 'Saved' : 'Watchlist'}</span>
                  </button>

                  {/* Add to Watched List Button */}
                  {!isUnreleased && (
                    <button
                      onClick={() => {
                        if (itemIsWatched) {
                          markAsUnwatched(show.internalId);
                        } else {
                          addToWatchlist(show, true);
                        }
                      }}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 font-bold px-3 py-2 sm:px-6 sm:py-3.5 rounded-full text-xs sm:text-base backdrop-blur-md border transition-all cursor-pointer shrink-0 ${
                        itemIsWatched
                          ? 'bg-emerald-600/40 border-emerald-500 text-emerald-300 hover:bg-emerald-600/60 shadow-lg shadow-emerald-950/40'
                          : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                      }`}
                      title={itemIsWatched ? 'Click to mark as unwatched' : 'Directly mark as watched'}
                    >
                      {itemIsWatched ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400 shrink-0" /> : <Eye className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />}
                      <span>{itemIsWatched ? 'Watched' : 'Watched'}</span>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Synopsis */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Overview</h3>
              <p className="text-slate-300 text-base leading-relaxed">{show.description}</p>
            </div>
          </div>
        </div>

        {/* Cast List with Profile Images */}
        {show.cast && show.cast.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="text-xl font-bold text-white tracking-wide">Top Cast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {show.cast.map((actor) => (
                <Link
                  key={actor.id}
                  href={`/actor/${actor.id}`}
                  className="p-3 rounded-2xl glass-panel border border-white/10 flex items-center gap-3 hover:border-red-500/50 hover:bg-white/10 transition-all group cursor-pointer"
                  title={`View all movies & TV series starring ${actor.name}`}
                >
                  {actor.profilePath ? (
                    <img
                      src={actor.profilePath}
                      alt={actor.name}
                      className="w-11 h-11 rounded-full object-cover border border-white/20 group-hover:border-red-500 shrink-0 transition-colors"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-300 font-bold text-sm shrink-0">
                      {actor.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {actor.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{actor.character}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Season & Episodes Hierarchy Section */}
        <div className="space-y-6 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-2xl font-black text-white tracking-wide">Episodes</h3>

            {/* Season Selector Dropdown */}
            {seasons.length > 0 && (
              <div className="relative">
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                  className="bg-red-950/70 border border-red-800/80 text-white text-sm font-bold rounded-xl px-4 py-2.5 pr-8 appearance-none cursor-pointer outline-none hover:bg-red-900/80 transition-colors"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.seasonNumber} className="bg-slate-900 text-white">
                      {s.title || `Season ${s.seasonNumber}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-red-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Episode Cards List */}
          {currentSeason && currentSeason.episodes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSeason.episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-red-500/50 flex flex-col sm:flex-row gap-4 group transition-all"
                >
                  {/* Episode Thumbnail */}
                  <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {!isUnreleased && (
                      <button
                        onClick={() => playMedia(show, ep)}
                        className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Episode Text Details */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        Episode {ep.episodeNumber}
                      </span>
                      <span>{ep.runtime} min {ep.releaseDate ? `• ${formatReleaseDate(ep.releaseDate)}` : ''}</span>
                    </div>

                    <h4 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {ep.title.toLowerCase().startsWith('episode') ? ep.title : `${ep.episodeNumber}. ${ep.title}`}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{ep.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No episodes available for this season.</p>
          )}
        </div>

        {/* Similar Shows (from TMDB API) */}
        {similarShows.length > 0 && (
          <div className="pt-6 border-t border-white/10">
            <ContentRow title="Similar TV Series" items={similarShows} />
          </div>
        )}
      </div>

      {/* YouTube Trailer Modal */}
      {showTrailer && show.trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-red-600/20">
            <iframe
              src={show.trailerUrl}
              title={`${show.title} - Official Trailer`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 p-2.5 bg-black/70 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-colors border border-white/20 z-10"
              title="Close Trailer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Click outside to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setShowTrailer(false)} />
        </div>
      )}
    </div>
  );
}
