'use client';

import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import MediaCard from '@/components/MediaCard';
import Top10Section from '@/components/Top10Section';
import ContentRow from '@/components/ContentRow';
import { getMovies, getItemsByGenre } from '@/lib/tmdb';
import { MediaItem } from '@/types/cinetrack';

export default function MoviesPage() {
  const [movieCatalog, setMovieCatalog] = useState<MediaItem[]>([]);
  const [actionMovies, setActionMovies] = useState<MediaItem[]>([]);
  const [scifiMovies, setScifiMovies] = useState<MediaItem[]>([]);
  const [dramaMovies, setDramaMovies] = useState<MediaItem[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<MediaItem[]>([]);
  const [comedyMovies, setComedyMovies] = useState<MediaItem[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load live movies from TMDB on mount
  useEffect(() => {
    async function loadMoviesData() {
      setLoading(true);
      const [popular, action, scifi, drama, thriller, comedy, horror] = await Promise.all([
        getMovies(),
        getItemsByGenre('Action', 'movie'),
        getItemsByGenre('Sci-Fi', 'movie'),
        getItemsByGenre('Drama', 'movie'),
        getItemsByGenre('Thriller', 'movie'),
        getItemsByGenre('Comedy', 'movie'),
        getItemsByGenre('Horror', 'movie'),
      ]);

      setMovieCatalog(popular);
      setActionMovies(action);
      setScifiMovies(scifi);
      setDramaMovies(drama);
      setThrillerMovies(thriller);
      setComedyMovies(comedy);
      setHorrorMovies(horror);
      setLoading(false);
    }
    loadMoviesData();
  }, []);

  if (loading && movieCatalog.length === 0) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Loading movies catalog...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen space-y-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            <Film className="w-8 h-8 text-red-500" />
            <span>Movies Hub</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Explore blockbusters, indie gems, and high-rating cinema</p>
        </div>
      </div>

      {/* Top 10 Movies */}
      <Top10Section items={movieCatalog.slice(0, 10)} title="Top 10 Movies" />

      {/* Popular Blockbusters */}
      <ContentRow title="Popular Blockbusters" items={movieCatalog} />

          {/* Action Blockbusters */}
          <ContentRow title="Action & Adventure" items={actionMovies} />

          {/* Sci-Fi Movies */}
          <ContentRow title="Sci-Fi & Fantasy" items={scifiMovies} />

          {/* Comedy Movies */}
          <ContentRow title="Comedy Hits" items={comedyMovies} />

          {/* Thriller Movies */}
          <ContentRow title="Thrillers & Crime" items={thrillerMovies} />

          {/* Horror Movies */}
          <ContentRow title="Horror & Suspense" items={horrorMovies} />

          {/* Dramatic Masterpieces */}
          <ContentRow title="Dramatic Cinema" items={dramaMovies} />
    </div>
  );
}
