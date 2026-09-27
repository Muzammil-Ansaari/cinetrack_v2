'use client';

import React, { useEffect, useState } from 'react';
import HeroSlider from '@/components/HeroSlider';
import Top10Section from '@/components/Top10Section';
import ContentRow from '@/components/ContentRow';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';
import { useApp } from '@/context/AppContext';
import { getItemsByGenre, getTrendingToday, getTrendingThisWeek, getUpcomingItems } from '@/lib/tmdb';
import { MediaItem } from '@/types/cinetrack';

export default function HomePage() {
  const { catalog, featuredItems, sectionsConfig, loading } = useApp();
  const [genreMap, setGenreMap] = useState<Record<string, MediaItem[]>>({});
  const [trendingToday, setTrendingToday] = useState<MediaItem[]>([]);
  const [trendingWeek, setTrendingWeek] = useState<MediaItem[]>([]);
  const [upcoming, setUpcoming] = useState<MediaItem[]>([]);
  const [upcomingRange, setUpcomingRange] = useState<'7' | '30'>('7');
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  // Fetch live trending, upcoming, and genre items matching TMDB API rank order 100%
  useEffect(() => {
    async function loadLiveData() {
      const [todayData, weekData, upcomingData] = await Promise.all([
        getTrendingToday(),
        getTrendingThisWeek(),
        getUpcomingItems(7),
      ]);
      setTrendingToday(todayData);
      setTrendingWeek(weekData);

      // Strict filter to guarantee only unreleased future items show in Upcoming rail
      const today = new Date();
      const trueUpcoming = (upcomingData || []).filter((item) => {
        if (!item.releaseDate) return false;
        return new Date(item.releaseDate) > today;
      });
      setUpcoming(trueUpcoming.length > 0 ? trueUpcoming : upcomingData || []);

      const genresToFetch = ['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller'];
      const results: Record<string, MediaItem[]> = {};

      for (const g of genresToFetch) {
        const items = await getItemsByGenre(g);
        results[g] = items;
      }
      setGenreMap(results);
    }
    loadLiveData();
  }, []);

  const handleUpcomingFilter = async (range: '7' | '30') => {
    setUpcomingRange(range);
    setUpcomingLoading(true);
    const days = range === '7' ? 7 : 30;
    const res = await getUpcomingItems(days);
    const today = new Date();
    const filtered = (res || []).filter((item) => {
      if (!item.releaseDate) return false;
      return new Date(item.releaseDate) > today;
    });
    setUpcoming(filtered.length > 0 ? filtered : res || []);
    setUpcomingLoading(false);
  };

  if (loading && catalog.length === 0) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">
          Fetching live TMDB catalog & latest releases...
        </p>
      </div>
    );
  }

  // Sort sections by order
  const activeSections = [...sectionsConfig]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Helper selectors matching exact TMDB rank order
  const getTop10 = () =>
    trendingToday.length > 0 ? trendingToday.slice(0, 10) : catalog.slice(0, 10);

  const getUpcoming = () => {
    if (upcoming.length > 0) return upcoming;
    const now = new Date();
    return catalog.filter((i) => i.releaseDate && new Date(i.releaseDate) > now);
  };

  const upcomingHeaderControls = (
    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl backdrop-blur-md">
      <button
        onClick={() => handleUpcomingFilter('7')}
        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
          upcomingRange === '7'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        Next 7 Days ⚡
      </button>
      <button
        onClick={() => handleUpcomingFilter('30')}
        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
          upcomingRange === '30'
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        Next 30 Days 📅
      </button>
      {upcomingLoading && (
        <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin ml-1" />
      )}
    </div>
  );

  const getGenreItems = (genre?: string) => {
    if (!genre) return [];
    if (genreMap[genre] && genreMap[genre].length > 0) return genreMap[genre];
    return catalog.filter((i) => i.genres.includes(genre) || i.genres.includes('Action'));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Homepage Rails Rendering */}
      {activeSections.map((section) => {
        switch (section.type) {
          case 'hero':
            return <HeroSlider key={section.id} items={featuredItems} />;
          case 'continue_watching':
            return <ContinueWatchingRow key={section.id} />;
          case 'top10':
            return <Top10Section key={section.id} items={getTop10()} title={section.title} />;
          case 'trending_today':
            return (
              <ContentRow
                key={section.id}
                title={section.title}
                items={trendingToday.length > 0 ? trendingToday : catalog}
              />
            );
          case 'trending_week':
            return (
              <ContentRow
                key={section.id}
                title={section.title}
                items={trendingWeek.length > 0 ? trendingWeek : catalog}
              />
            );
          case 'upcoming':
            return (
              <ContentRow
                key={section.id}
                title={section.title}
                items={getUpcoming()}
                extraHeader={upcomingHeaderControls}
              />
            );
          case 'genre':
            return (
              <ContentRow
                key={section.id}
                title={section.title}
                items={getGenreItems(section.genreFilter)}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
