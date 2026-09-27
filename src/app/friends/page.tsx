'use client';

import React, { useState, useEffect } from 'react';
import FriendsManager from '@/components/FriendsManager';
import { Users, Lock, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function FriendsPage() {
  const { user, authLoading, openAuthModal } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          <div className="h-44 rounded-3xl bg-white/5 border border-white/10" />
          <div className="h-64 rounded-3xl bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Sign In Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Please sign in to add friends, share watchlists, and see each other&apos;s watch stats.
            </p>
          </div>
          <button
            onClick={openAuthModal}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Sign In to Continue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
                <Users className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  Friends & Social Watchlists
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-400 pl-1">
              Add friends using unique friend tags, accept requests, and inspect each other&apos;s complete movie & TV watchlists.
            </p>
          </div>
        </div>

        {/* Friends Manager System */}
        <FriendsManager />
      </div>
    </div>
  );
}
