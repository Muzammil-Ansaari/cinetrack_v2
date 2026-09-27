'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Star, Calendar } from 'lucide-react';
import { MediaItem } from '@/types/cinetrack';
import { useApp } from '@/context/AppContext';
import { useDragScroll } from '@/hooks/useDragScroll';
import { formatReleaseDate } from './MediaCard';

interface Top10SectionProps {
  items: MediaItem[];
  title?: string;
}

export default function Top10Section({ items, title = 'Top 10 New Releases' }: Top10SectionProps) {
  const router = useRouter();
  const { playMedia, addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();
  const { ref: scrollRef, events, isDragging, hasDragged } = useDragScroll<HTMLDivElement>();

  const displayItems = items.slice(0, 10);

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

  if (!displayItems || displayItems.length === 0) return null;

  return (
    <section className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-7 bg-gradient-to-b from-red-600 to-rose-500 rounded-full" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top 10 Drag-to-Scroll Rail */}
      <div
        ref={scrollRef}
        {...events}
        onDragStart={(e) => e.preventDefault()}
        className={`flex items-center gap-4 overflow-x-auto no-scrollbar py-4 px-2 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {displayItems.map((item, index) => {
          const rank = index + 1;
          const rankFormatted = rank < 10 ? `0${rank}` : `${rank}`;
          const inWatchlist = isInWatchlist(item.internalId);

          const handlePlayClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            playMedia(item);
            router.push(`/${item.type}/${item.internalId}`);
          };

          const handleWatchlistClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (inWatchlist) {
              removeFromWatchlist(item.internalId);
            } else {
              addToWatchlist(item);
            }
          };

          const handleCardClick = (e: React.MouseEvent) => {
            if (hasDragged) {
              e.preventDefault();
            }
          };

          const formattedDate = formatReleaseDate(item.releaseDate) || `${item.releaseYear}`;

          return (
            <Link
              key={item.internalId}
              href={`/${item.type}/${item.internalId}`}
              onClick={handleCardClick}
              onDragStart={(e) => e.preventDefault()}
              className="group relative flex-none flex items-center w-64 sm:w-72 select-none cursor-pointer block"
            >
              {/* Huge Rank Number */}
              <div className="relative z-0 -mr-6 select-none pointer-events-none">
                <span className="text-7xl sm:text-8xl font-black text-stroke-rank tracking-tighter drop-shadow-xl font-mono select-none pointer-events-none">
                  {rankFormatted}
                </span>
              </div>

              {/* Card Container */}
              <div className="relative z-10 w-40 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-red-600/30 group-hover:border-red-500/50 transition-all duration-300 select-none">
                {/* Poster */}
                {/* eslint-disable-next-img-element */}
                <img
                  src={item.poster}
                  alt={item.title}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                  loading="lazy"
                />

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 border border-amber-500/30 text-amber-400 text-xs font-bold backdrop-blur-md flex items-center gap-1 pointer-events-none select-none">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <h4 className="text-sm font-bold text-white line-clamp-1 select-none">{item.title}</h4>
                  <p className="text-[11px] font-semibold text-amber-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>{formattedDate}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mb-2 select-none">{item.description}</p>
                  
                  <div className="flex items-center gap-2">
                    {/* Play Button */}
                    <button
                      onClick={handlePlayClick}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-600/30 hover:scale-105 transition-all"
                      title="Play & View Details"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play</span>
                    </button>

                    {/* Watchlist Toggle Button */}
                    <button
                      onClick={handleWatchlistClick}
                      className={`p-2 rounded-xl border text-xs transition-all hover:scale-105 ${
                        inWatchlist ? 'bg-emerald-600/40 border-emerald-500 text-emerald-300' : 'bg-white/10 border-white/20 text-white'
                      }`}
                      title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
