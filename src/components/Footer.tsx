import React from 'react';
import Link from 'next/link';
import { Film, Globe, Share2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-400 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-wider">
              CINETRACK<span className="text-red-500 text-xs ml-1">v2</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The next-generation streaming platform with real-time metadata, live search, watchlist syncing, and custom video playback.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-red-400 transition-colors">Home</Link></li>
            <li><Link href="/movies" className="hover:text-red-400 transition-colors">Movies Hub</Link></li>
            <li><Link href="/tv" className="hover:text-red-400 transition-colors">TV Shows Hub</Link></li>
            <li><Link href="/watchlist" className="hover:text-red-400 transition-colors">My Watchlist</Link></li>
            <li><Link href="/admin" className="hover:text-red-400 transition-colors">Admin Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Genres</h4>
          <ul className="space-y-2 text-xs grid grid-cols-2 gap-x-4">
            <li><Link href="/movies?genre=Action" className="hover:text-red-400 transition-colors">Action</Link></li>
            <li><Link href="/movies?genre=Sci-Fi" className="hover:text-red-400 transition-colors">Sci-Fi</Link></li>
            <li><Link href="/tv?genre=Drama" className="hover:text-red-400 transition-colors">Drama</Link></li>
            <li><Link href="/movies?genre=Thriller" className="hover:text-red-400 transition-colors">Thriller</Link></li>
            <li><Link href="/tv?genre=Animation" className="hover:text-red-400 transition-colors">Animation</Link></li>
            <li><Link href="/movies?genre=Comedy" className="hover:text-red-400 transition-colors">Comedy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Powered By</h4>
          <p className="text-xs text-slate-400 mb-3">
            Metadata powered by TMDB API. Video playback engineered with HTML5 & HLS stream players.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://cinetrack.app" target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors" title="Official Website">
              <Globe className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors" title="Share Cinetrack">
              <Share2 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 Cinetrack v2. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for movie lovers everywhere.
        </p>
      </div>
    </footer>
  );
}
