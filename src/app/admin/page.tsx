'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Film,
  Tv,
  Users,
  Eye,
  TrendingUp,
  Download,
  Sliders,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Check,
  Search,
  Star,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MediaItem } from '@/types/cinetrack';

export default function AdminPanelPage() {
  const {
    catalog,
    user,
    sectionsConfig,
    updateSectionsConfig,
    featuredItems,
    addMediaToCatalog,
    deleteMediaFromCatalog,
    toggleFeaturedInCatalog,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'movies' | 'tv' | 'tmdb' | 'cms' | 'users'>('dashboard');

  // TMDB Import Modal / State
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<MediaItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // New Content Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'movie' | 'tv'>('movie');
  const [newDescription, setNewDescription] = useState('');
  const [newPoster, setNewPoster] = useState('');
  const [newBackdrop, setNewBackdrop] = useState('');
  const [newStreamUrl, setNewStreamUrl] = useState('');

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/30 text-center max-w-md space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Admin Access Restricted</h2>
          <p className="text-sm text-slate-400">You must be logged in as an Administrator to access the CMS Dashboard.</p>
        </div>
      </div>
    );
  }

  const moviesCount = catalog.filter((i) => i.type === 'movie').length;
  const tvCount = catalog.filter((i) => i.type === 'tv').length;

  const handleImportTMDB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbQuery) return;
    setImporting(true);

    setTimeout(() => {
      // Mock TMDB import response
      const mockResult: MediaItem = {
        internalId: `imported-${Date.now()}`,
        tmdbId: Math.floor(100000 + Math.random() * 900000),
        imdbId: `tt${Math.floor(1000000 + Math.random() * 9000000)}`,
        title: tmdbQuery,
        description: `Imported metadata for ${tmdbQuery} directly from TMDB API v3.`,
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
        backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
        releaseDate: '2026-09-01',
        releaseYear: 2026,
        genres: ['Action', 'Sci-Fi'],
        type: 'movie',
        rating: 8.5,
        runtime: 145,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        featured: false,
      };

      setTmdbResults([mockResult]);
      setImporting(false);
    }, 600);
  };

  const handleConfirmImport = (item: MediaItem) => {
    addMediaToCatalog(item);
    setImportSuccess(`Successfully imported "${item.title}" into catalog!`);
    setTimeout(() => setImportSuccess(null), 4000);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MediaItem = {
      internalId: `manual-${Date.now()}`,
      tmdbId: Math.floor(100000 + Math.random() * 900000),
      title: newTitle,
      type: newType,
      description: newDescription || 'No description provided.',
      poster: newPoster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
      backdrop: newBackdrop || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
      releaseDate: new Date().toISOString().split('T')[0],
      releaseYear: 2026,
      genres: ['Action', 'Drama'],
      rating: 8.0,
      streamUrl: newStreamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      featured: false,
    };
    addMediaToCatalog(item);
    setShowAddForm(false);
    setNewTitle('');
    setNewDescription('');
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sectionsConfig];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const tempOrder = newSections[index].order;
    newSections[index].order = newSections[targetIdx].order;
    newSections[targetIdx].order = tempOrder;

    updateSectionsConfig(newSections);
  };

  const toggleSectionEnabled = (id: string) => {
    const newSections = sectionsConfig.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    updateSectionsConfig(newSections);
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded uppercase tracking-wider">
                Admin CMS
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight">Cinetrack Control Panel</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">Manage catalog, TMDB imports, homepage sliders, section rails & analytics</p>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex flex-wrap items-center bg-white/5 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'movies' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Catalog ({catalog.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tmdb')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tmdb' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>TMDB Import</span>
            </button>
            <button
              onClick={() => setActiveTab('cms')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cms' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Homepage CMS</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {importSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Total Movies</span>
                  <Film className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-3xl font-black text-white">{moviesCount}</p>
                <span className="text-[11px] text-emerald-400 font-semibold">+2 added this week</span>
              </div>

              <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Total TV Shows</span>
                  <Tv className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-3xl font-black text-white">{tvCount}</p>
                <span className="text-[11px] text-emerald-400 font-semibold">+1 added this week</span>
              </div>

              <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Views Today</span>
                  <Eye className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-3xl font-black text-white">14,290</p>
                <span className="text-[11px] text-emerald-400 font-semibold">↑ 18% vs yesterday</span>
              </div>

              <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Active Users</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-3xl font-black text-white">3,850</p>
                <span className="text-[11px] text-emerald-400 font-semibold">+145 new signups</span>
              </div>
            </div>

            {/* Most Watched Content Table */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <span>Most Watched Content Analytics</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-3">Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Trending Score</th>
                      <th className="p-3">Featured Slider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {catalog.slice(0, 5).map((item) => (
                      <tr key={item.internalId} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-white flex items-center gap-3">
                          <img src={item.poster} alt={item.title} className="w-8 h-11 object-cover rounded" />
                          <span>{item.title}</span>
                        </td>
                        <td className="p-3 uppercase text-xs font-semibold">{item.type}</td>
                        <td className="p-3 font-bold text-amber-400">⭐ {item.rating}</td>
                        <td className="p-3 font-mono">{item.trendingScore || 8500} pts</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold ${
                              item.featured ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.featured ? 'Featured' : 'Standard'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG MANAGEMENT */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Media Catalog ({catalog.length})</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-red-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Title</span>
              </button>
            </div>

            {/* Manual Add Form */}
            {showAddForm && (
              <form onSubmit={handleManualAdd} className="p-6 rounded-3xl glass-panel border border-white/20 space-y-4">
                <h4 className="text-base font-bold text-white">Add New Movie / TV Show</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none"
                    required
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'movie' | 'tv')}
                    className="p-3 bg-slate-900 border border-white/10 rounded-xl text-sm text-white outline-none"
                  >
                    <option value="movie">Movie</option>
                    <option value="tv">TV Series</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Poster Image URL"
                    value={newPoster}
                    onChange={(e) => setNewPoster(e.target.value)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Stream URL (HLS / MP4)"
                    value={newStreamUrl}
                    onChange={(e) => setNewStreamUrl(e.target.value)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none"
                  />
                </div>
                <textarea
                  placeholder="Overview Description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none h-20"
                />
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">
                  Save to Catalog
                </button>
              </form>
            )}

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalog.map((item) => (
                <div key={item.internalId} className="p-3 rounded-2xl glass-panel border border-white/10 flex gap-3 group">
                  <img src={item.poster} alt={item.title} className="w-16 h-24 object-cover rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-slate-300">
                      {item.type}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    <p className="text-xs text-amber-400 font-bold">⭐ {item.rating}</p>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => toggleFeaturedInCatalog(item.internalId)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                          item.featured ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {item.featured ? 'Featured' : '+ Hero'}
                      </button>
                      <button
                        onClick={() => deleteMediaFromCatalog(item.internalId)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Delete Title"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TMDB IMPORT MODULE */}
        {activeTab === 'tmdb' && (
          <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">TMDB One-Click Auto Importer</h3>
              <p className="text-xs text-slate-400 mt-1">Search TMDB database to import titles, posters, cast, ratings, and IDs directly.</p>
            </div>

            <form onSubmit={handleImportTMDB} className="flex gap-3">
              <input
                type="text"
                value={tmdbQuery}
                onChange={(e) => setTmdbQuery(e.target.value)}
                placeholder="Enter movie or show name (e.g. Oppenheimer, Interstellar)..."
                className="flex-1 p-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none"
              />
              <button
                type="submit"
                disabled={importing}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{importing ? 'Importing...' : 'Search TMDB'}</span>
              </button>
            </form>

            {/* Imported Previews */}
            {tmdbResults.map((item) => (
              <div key={item.internalId} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={item.poster} alt={item.title} className="w-16 h-24 object-cover rounded-xl" />
                  <div>
                    <h4 className="text-base font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.description}</p>
                    <div className="flex gap-3 text-xs text-amber-400 font-mono mt-1">
                      <span>TMDB ID: {item.tmdbId}</span>
                      <span>IMDb ID: {item.imdbId}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleConfirmImport(item)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shrink-0"
                >
                  Import to Catalog
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: HOMEPAGE CMS CONTROL */}
        {activeTab === 'cms' && (
          <div className="space-y-8">
            {/* Hero Slider Management */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white">Featured Hero Slider Items (Max 5)</h3>
              <div className="space-y-2">
                {featuredItems.map((item, idx) => (
                  <div key={item.internalId} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <img src={item.poster} alt={item.title} className="w-8 h-12 object-cover rounded" />
                      <span className="text-sm font-bold text-white">{item.title}</span>
                    </div>
                    <button
                      onClick={() => toggleFeaturedInCatalog(item.internalId)}
                      className="text-xs text-red-400 font-semibold px-2 py-1 bg-red-950/60 rounded"
                    >
                      Remove from Hero
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Rails CMS */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white">Homepage Sections Rail Order</h3>
              <p className="text-xs text-slate-400">Enable, disable, or drag section rail order on the homepage.</p>

              <div className="space-y-2">
                {sectionsConfig
                  .sort((a, b) => a.order - b.order)
                  .map((sec, idx) => (
                    <div key={sec.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={() => toggleSectionEnabled(sec.id)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <span className="text-sm font-bold text-white">{sec.title}</span>
                        <span className="text-xs text-slate-400 uppercase font-mono">({sec.type})</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 bg-white/10 text-slate-300 rounded hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sectionsConfig.length - 1}
                          className="p-1.5 bg-white/10 text-slate-300 rounded hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
