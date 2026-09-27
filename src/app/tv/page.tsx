'use client';

import React, { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import MediaCard from '@/components/MediaCard';
import Top10Section from '@/components/Top10Section';
import ContentRow from '@/components/ContentRow';
import { getTVShows, getItemsByGenre } from '@/lib/tmdb';
import { MediaItem } from '@/types/cinetrack';

export default function TVShowsPage() {
  const [tvCatalog, setTvCatalog] = useState<MediaItem[]>([]);
  const [actionTV, setActionTV] = useState<MediaItem[]>([]);
  const [scifiTV, setScifiTV] = useState<MediaItem[]>([]);
  const [dramaTV, setDramaTV] = useState<MediaItem[]>([]);
  const [thrillerTV, setThrillerTV] = useState<MediaItem[]>([]);
  const [comedyTV, setComedyTV] = useState<MediaItem[]>([]);
  const [crimeTV, setCrimeTV] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load live TV shows from TMDB on mount
  useEffect(() => {
    async function loadTVData() {
      setLoading(true);
      const [popular, action, scifi, drama, thriller, comedy, crime] = await Promise.all([
        getTVShows(),
        getItemsByGenre('Action', 'tv'),
        getItemsByGenre('Sci-Fi', 'tv'),
        getItemsByGenre('Drama', 'tv'),
        getItemsByGenre('Thriller', 'tv'),
        getItemsByGenre('Comedy', 'tv'),
        getItemsByGenre('Crime', 'tv'),
      ]);

      setTvCatalog(popular);
      setActionTV(action);
      setScifiTV(scifi);
      setDramaTV(drama);
      setThrillerTV(thriller);
      setComedyTV(comedy);
      setCrimeTV(crime);
      setLoading(false);
    }
    loadTVData();
  }, []);

  if (loading && tvCatalog.length === 0) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Loading TV shows catalog...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen space-y-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            <Tv className="w-8 h-8 text-red-500" />
            <span>TV Series Hub</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Binge-watch full seasons, episode guides, and trending TV series</p>
        </div>
      </div>

      {/* Top 10 TV Shows */}
      <Top10Section items={tvCatalog.slice(0, 10)} title="Top 10 TV Shows" />

      {/* Trending TV Shows */}
      <ContentRow title="Trending TV Shows" items={tvCatalog} />

          {/* Action & Adventure Series */}
          <ContentRow title="Action & Adventure Series" items={actionTV} />

          {/* Sci-Fi & Fantasy Series */}
          <ContentRow title="Sci-Fi & Fantasy Series" items={scifiTV} />

          {/* Popular Drama Series */}
          <ContentRow title="Popular Drama Series" items={dramaTV} />

          {/* Comedy Series */}
          <ContentRow title="Comedy Series" items={comedyTV} />

          {/* Crime & Thriller Series */}
          <ContentRow title="Crime & Thriller Series" items={thrillerTV} />

          {/* Crime Investigation */}
          <ContentRow title="Crime Investigation" items={crimeTV} />
    </div>
  );
}
