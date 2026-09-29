'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Film, Tv, ArrowLeft, Star, Calendar, MapPin, Sparkles, UserCheck } from 'lucide-react';
import { getActorDetails } from '@/lib/tmdb';
import { MediaItem, ActorDetails } from '@/types/cinetrack';
import MediaCard from '@/components/MediaCard';

export default function ActorDetailsPage() {
  const params = useParams();
  const rawId = params?.id as string;

  const [actor, setActor] = useState<ActorDetails | null>(null);
  const [filmography, setFilmography] = useState<MediaItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rawId) return;
    setLoading(true);
    getActorDetails(rawId).then((res) => {
      if (res) {
        setActor(res.actor);
        setFilmography(res.filmography);
      }
      setLoading(false);
    });
  }, [rawId]);

  const filteredFilmography = filmography.filter((item) => {
    if (typeFilter === 'all') return true;
    return item.type === typeFilter;
  });

  const movieCount = filmography.filter((f) => f.type === 'movie').length;
  const tvCount = filmography.filter((f) => f.type === 'tv').length;

  if (loading) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400">Loading Actor Filmography...</p>
        </div>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="pt-28 pb-20 min-h-screen text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Actor Not Found</h2>
        <p className="text-xs text-slate-400">We couldn&apos;t load details for this actor.</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Back Link */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-red-500" />
          <span>Back to Global Search</span>
        </Link>

        {/* Actor Profile Header Banner */}
        <div className="relative glass-panel rounded-3xl p-6 md:p-8 border border-white/10 overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900/90 via-red-950/20 to-slate-900/90 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          
          {/* Profile Photo */}
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl bg-slate-950 shrink-0">
            {actor.profilePath ? (
              <img
                src={actor.profilePath}
                alt={actor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-red-950 flex items-center justify-center text-red-400 font-black text-4xl">
                {actor.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                {actor.knownForDepartment || 'Acting'}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{filmography.length} Movies & Shows</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{actor.name}</h1>

            <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-400 flex-wrap">
              {actor.birthday && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  <span>Born: <strong>{actor.birthday}</strong></span>
                </div>
              )}
              {actor.placeOfBirth && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span><strong>{actor.placeOfBirth}</strong></span>
                </div>
              )}
            </div>

            {actor.biography && (
              <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed pt-1">
                {actor.biography}
              </p>
            )}
          </div>
        </div>

        {/* Filmography Section Header & Type Filters */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-red-500" />
                <span>Complete Filmography ({filteredFilmography.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing all movies & TV series starring <strong className="text-white font-bold">{actor.name}</strong>
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All ({filmography.length})
              </button>
              <button
                onClick={() => setTypeFilter('movie')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'movie'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Movies ({movieCount})
              </button>
              <button
                onClick={() => setTypeFilter('tv')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'tv'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                TV Shows ({tvCount})
              </button>
            </div>
          </div>

          {/* Filmography Media Grid */}
          {filteredFilmography.length === 0 ? (
            <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl p-8 border border-white/10">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No titles in this category</p>
              <p className="text-xs text-slate-500 mt-0.5">Try switching between Movies and TV Shows above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredFilmography.map((item) => (
                <MediaCard key={item.internalId} item={item} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
