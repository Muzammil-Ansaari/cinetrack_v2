'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types/cinetrack';
import { useApp } from '@/context/AppContext';

interface HeroSliderProps {
  items: MediaItem[];
}

export default function HeroSlider({ items }: HeroSliderProps) {
  const { playMedia, addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mouse Drag / Touch Swipe State
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayItems = items.slice(0, 5);

  useEffect(() => {
    if (displayItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [displayItems.length]);

  if (!displayItems || displayItems.length === 0) return null;

  const current = displayItems[currentIndex];
  const inWatchlist = isInWatchlist(current.internalId);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
  };

  // Drag / Swipe gesture handlers
  const handleStart = (clientX: number) => {
    setTouchStartX(clientX);
    setIsDragging(true);
  };

  const handleEnd = (clientX: number) => {
    if (touchStartX === null || !isDragging) return;
    const diffX = clientX - touchStartX;
    const threshold = 50; // pixels to trigger slide change

    if (diffX < -threshold) {
      handleNext();
    } else if (diffX > threshold) {
      handlePrev();
    }

    setTouchStartX(null);
    setIsDragging(false);
  };

  return (
    <section
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseUp={(e) => handleEnd(e.clientX)}
      onMouseLeave={(e) => isDragging && handleEnd(e.clientX)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
      className="relative w-full h-[75vh] min-h-[520px] max-h-[780px] overflow-hidden group select-none cursor-grab active:cursor-grabbing"
    >
      {/* Backdrop Image */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        {/* eslint-disable-next-img-element */}
        <img
          src={current.backdrop}
          alt={current.title}
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-10000 ease-out pointer-events-none"
        />
        {/* Gradient overlays for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-[#090a0f]/90" />
      </div>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-end pb-16 z-10 pointer-events-none">
        <div className="max-w-2xl space-y-4 pointer-events-auto">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="uppercase tracking-widest text-[11px] font-bold px-2.5 py-1 rounded-md bg-red-600/90 text-white shadow-lg shadow-red-600/40">
              {current.type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            <div className="flex items-center gap-1 bg-black/50 border border-amber-500/30 px-2.5 py-1 rounded-md text-amber-400 text-xs font-semibold backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{current.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-slate-300 font-medium px-2 py-0.5 rounded bg-white/10 backdrop-blur-md">
              {current.releaseYear}
            </span>
            {current.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-xs text-slate-300 font-normal px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            {current.title}
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed drop-shadow-sm font-normal">
            {current.description}
          </p>

          {/* Call to Actions */}
          {(() => {
            const isUnreleased = current.isUpcoming || (current.releaseDate ? new Date(current.releaseDate) > new Date() : false);
            return (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isUnreleased ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playMedia(current);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-6 py-3 rounded-full text-sm sm:text-base shadow-xl shadow-red-600/30 hover:scale-105 transition-all"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Play Now</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold px-6 py-3 rounded-full text-sm sm:text-base backdrop-blur-md">
                    <span>Coming Soon</span>
                  </div>
                )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                inWatchlist ? removeFromWatchlist(current.internalId) : addToWatchlist(current);
              }}
              className={`flex items-center gap-2 font-medium px-5 py-3 rounded-full text-sm sm:text-base backdrop-blur-md border transition-all ${
                inWatchlist
                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            <Link
              href={`/${current.type}/${current.internalId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 font-medium px-5 py-3 rounded-full text-sm sm:text-base backdrop-blur-md transition-all"
            >
              <Info className="w-5 h-5 text-slate-300" />
              <span>More Details</span>
            </Link>
          </div>
        );
      })()}
        </div>
      </div>

      {/* Prev / Next Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-6 right-8 flex items-center gap-2 z-20">
        {displayItems.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex ? 'w-8 bg-red-600 shadow-md shadow-red-600/50' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
