'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Plus, Check, Star, Calendar, CheckCircle2, Bookmark } from 'lucide-react';
import { MediaItem } from '@/types/cinetrack';
import { useApp } from '@/context/AppContext';

interface MediaCardProps {
  item: MediaItem;
  rank?: number;
}

export function formatReleaseDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function MediaCard({ item }: MediaCardProps) {
  const router = useRouter();
  const {
    playMedia,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    isWatched,
    markAsWatched,
    markAsUnwatched,
  } = useApp();

  const inWatchlist = isInWatchlist(item.internalId);
  const itemIsWatched = isWatched(item.internalId);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playMedia(item);
    router.push(`/${item.type}/${item.internalId}`);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/${item.type}/${item.internalId}`);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(item.internalId);
    } else {
      addToWatchlist(item, false);
    }
  };

  const handleWatchedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemIsWatched) {
      markAsUnwatched(item.internalId);
    } else {
      addToWatchlist(item, true);
    }
  };

  const formattedDate = formatReleaseDate(item.releaseDate) || `${item.releaseYear}`;
  const isUnreleased = item.isUpcoming || (item.releaseDate ? new Date(item.releaseDate) > new Date() : false);

  return (
    <Link
      href={`/${item.type}/${item.internalId}`}
      className="group relative flex-none w-44 sm:w-52 transition-transform duration-300 hover:-translate-y-2 z-10 select-none block cursor-pointer"
    >
      {/* Card Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-600/30 group-hover:border-white/40 transition-all">
        {/* Poster Image */}
        {/* eslint-disable-next-img-element */}
        <img
          src={item.poster}
          alt={item.title}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-slate-200 border border-white/10 backdrop-blur-md">
            {item.type === 'tv' ? 'TV' : 'Movie'}
          </span>
          {itemIsWatched ? (
            <span className="uppercase text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Watched
            </span>
          ) : isUnreleased ? (
            <span className="uppercase text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-md">
              Coming Soon
            </span>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 text-amber-400 text-xs font-bold border border-amber-500/20 backdrop-blur-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-20">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">{item.description}</p>
            
            <div className="flex items-center gap-1.5 pt-1">
              {/* Play / Details Button (compact) */}
              {!isUnreleased ? (
                <button
                  onClick={handlePlayClick}
                  className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-2 rounded-xl text-xs shadow-md shadow-red-600/40 hover:scale-105 transition-all cursor-pointer"
                  title="Play & View Details"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Play</span>
                </button>
              ) : (
                <button
                  onClick={handleDetailsClick}
                  className="flex-1 flex items-center justify-center gap-1 bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold py-1.5 px-2 rounded-xl text-xs shadow-md shadow-amber-500/30 hover:scale-105 transition-all cursor-pointer"
                  title="View Movie Details"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Details</span>
                </button>
              )}

              {/* Watchlist Toggle Button (Unwatched List) */}
              <button
                onClick={handleWatchlistClick}
                className={`p-2 rounded-xl border text-xs transition-all hover:scale-105 cursor-pointer ${
                  inWatchlist && !itemIsWatched
                    ? 'bg-red-600/60 border-red-500 text-white'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                title={inWatchlist && !itemIsWatched ? 'Remove from Watchlist' : 'Add to Unwatched Watchlist'}
              >
                {inWatchlist && !itemIsWatched ? <Bookmark className="w-3.5 h-3.5 fill-white" /> : <Plus className="w-3.5 h-3.5" />}
              </button>

              {/* Direct Watched Button (Only for released titles) */}
              {!isUnreleased && (
                <button
                  onClick={handleWatchedClick}
                  className={`p-2 rounded-xl border text-xs transition-all hover:scale-105 cursor-pointer ${
                    itemIsWatched
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/40'
                      : 'bg-white/10 border-white/20 text-slate-300 hover:text-white hover:bg-white/20'
                  }`}
                  title={itemIsWatched ? 'Marked as Watched (Click to unwatch)' : 'Mark directly as Watched'}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${itemIsWatched ? 'text-white' : 'text-slate-300'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Title & Formatted Release Date (e.g. 14 Sep 2026) */}
      <div className="mt-2.5 space-y-0.5 px-0.5 pointer-events-none">
        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white line-clamp-1 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-amber-400 text-[11px] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>{formattedDate}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">{item.genres?.[0] || ''}</span>
        </div>
      </div>
    </Link>
  );
}
