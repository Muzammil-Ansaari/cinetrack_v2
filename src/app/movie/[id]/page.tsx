'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Play, Plus, Check, Star, Clock, Calendar, Globe, Film, ArrowLeft, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getMediaDetails, getSimilarMedia, MOCK_MEDIA_ITEMS } from '@/lib/tmdb';
import { MediaItem } from '@/types/cinetrack';
import ContentRow from '@/components/ContentRow';
import { formatReleaseDate } from '@/components/MediaCard';

export default function MovieDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { playMedia, addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();

  const [movie, setMovie] = useState<MediaItem | null>(null);
  const [similarMovies, setSimilarMovies] = useState<MediaItem[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (id) {
      getMediaDetails(id).then((res) => {
        if (res) {
          setMovie(res);
          // Fetch similar movies
          getSimilarMedia(res.tmdbId, 'movie').then(setSimilarMovies);
        } else {
          setMovie(MOCK_MEDIA_ITEMS[0]);
        }
      });
    }
  }, [id]);

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-slate-400 space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wider uppercase">Loading movie details...</p>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(movie.internalId);

  const formatRuntime = (mins?: number) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop Section */}
      <div className="relative w-full h-[65vh] min-h-[480px]">
        {/* eslint-disable-next-img-element */}
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent w-full md:w-2/3" />

        {/* Back Link */}
        <div className="absolute top-24 left-4 sm:left-8 z-20">
          <Link
            href="/movies"
            className="flex items-center gap-2 px-3.5 py-2 bg-black/60 hover:bg-black/90 border border-white/10 text-slate-200 hover:text-white rounded-full text-xs font-semibold backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Movies</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-56 sm:w-64 aspect-[2/3] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-red-600/20 shrink-0 bg-slate-900 mx-auto md:mx-0">
            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="uppercase text-xs font-extrabold px-2.5 py-1 rounded bg-red-600 text-white">
                  Movie
                </span>
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded text-xs font-bold backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)} / 10</span>
                </div>
                <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded bg-white/10 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatReleaseDate(movie.releaseDate)}</span>
                </span>
                <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded bg-white/10 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatRuntime(movie.runtime)}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
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
              const isUnreleased = movie.isUpcoming || (movie.releaseDate ? new Date(movie.releaseDate) > new Date() : false);
              return (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!isUnreleased ? (
                    <button
                      onClick={() => playMedia(movie)}
                      className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-7 py-3.5 rounded-full text-base shadow-xl shadow-red-600/30 hover:scale-105 transition-all"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>Play Movie</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold px-7 py-3.5 rounded-full text-base backdrop-blur-md">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      <span>Coming Soon • {formatReleaseDate(movie.releaseDate)}</span>
                    </div>
                  )}

              {/* Watch Trailer Button */}
              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-6 py-3.5 rounded-full text-base backdrop-blur-md transition-all hover:scale-105 hover:border-red-500/50"
                >
                  <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                onClick={() => (inWatchlist ? removeFromWatchlist(movie.internalId) : addToWatchlist(movie))}
                className={`flex items-center gap-2 font-medium px-6 py-3.5 rounded-full text-base backdrop-blur-md border transition-all ${
                  inWatchlist
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 hover:bg-emerald-600/40'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
            );
          })()}

            {/* Synopsis */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Overview</h3>
              <p className="text-slate-300 text-base leading-relaxed">{movie.description}</p>
            </div>

            {/* Metadata Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl glass-panel border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Director</span>
                <span className="text-white font-bold">{movie.director || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Country</span>
                <span className="text-white font-bold">{movie.country || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Original Language</span>
                <span className="text-white font-bold">{movie.language || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">TMDB ID</span>
                <span className="text-amber-400 font-mono font-bold">{movie.tmdbId}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">IMDb ID</span>
                <span className="text-amber-400 font-mono font-bold">{movie.imdbId || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Release Date</span>
                <span className="text-white font-bold">{formatReleaseDate(movie.releaseDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cast List with Profile Images */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="text-xl font-bold text-white tracking-wide">Top Cast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {movie.cast.map((actor) => (
                <div key={actor.id} className="p-3 rounded-2xl glass-panel border border-white/10 flex items-center gap-3 hover:border-red-500/30 transition-colors">
                  {actor.profilePath ? (
                    <img
                      src={actor.profilePath}
                      alt={actor.name}
                      className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-300 font-bold text-sm shrink-0">
                      {actor.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-bold text-white truncate">{actor.name}</p>
                    <p className="text-xs text-slate-400 truncate">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Movies Rail (from TMDB API) */}
        {similarMovies.length > 0 && (
          <div className="pt-6 border-t border-white/10">
            <ContentRow title="Similar Movies You Might Like" items={similarMovies} />
          </div>
        )}
      </div>

      {/* YouTube Trailer Modal */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-red-600/20">
            <iframe
              src={movie.trailerUrl}
              title={`${movie.title} - Official Trailer`}
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
