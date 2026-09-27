'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types/cinetrack';
import MediaCard from './MediaCard';
import { useDragScroll } from '@/hooks/useDragScroll';

interface ContentRowProps {
  title: string;
  items: MediaItem[];
  extraHeader?: React.ReactNode;
}

export default function ContentRow({ title, items, extraHeader }: ContentRowProps) {
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

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-1.5 h-6 bg-red-600 rounded-full" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{title}</h2>
          {extraHeader}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rail with Mouse Drag-to-Scroll */}
      <div
        ref={scrollRef}
        {...events}
        className={`flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-2 px-1 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {items.map((item) => (
          <MediaCard key={item.internalId} item={item} />
        ))}
      </div>
    </section>
  );
}
