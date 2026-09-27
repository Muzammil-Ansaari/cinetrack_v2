'use client';

import React, { useState, useEffect } from 'react';
import { Film, Lock, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading, isAuthModalOpen, openAuthModal } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically open AuthModal if user is unauthenticated after session restoration
  useEffect(() => {
    if (mounted && !authLoading && !user && !isAuthModalOpen) {
      openAuthModal();
    }
  }, [mounted, authLoading, user, isAuthModalOpen, openAuthModal]);

  // 1. Initial Loading Screen while checking session & hydration
  if (!mounted || authLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090a0f] flex flex-col items-center justify-center space-y-6">
        <div className="relative group">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-red-600/40 animate-pulse">
            <Film className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-red-600/20 blur-xl animate-pulse" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-wider text-white">
            CINETRACK<span className="text-red-500 text-xs ml-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800">v2</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium animate-pulse">Restoring secure session...</p>
        </div>
      </div>
    );
  }

  // 2. Strict Authentication Lock Screen for Unauthenticated Users
  if (!user) {
    return (
      <div className="min-h-screen w-full relative bg-[#090a0f] flex items-center justify-center p-4 overflow-hidden pt-20 pb-20">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Lock Screen Card */}
        <div className="relative z-10 max-w-lg w-full glass-panel rounded-3xl border border-white/10 p-8 text-center space-y-8 shadow-2xl backdrop-blur-2xl">
          {/* Logo & Lock Badge */}
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 p-0.5 shadow-xl shadow-red-600/30 mx-auto flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-white">
                <Lock className="w-9 h-9 text-red-500" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-600 to-rose-600 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-extrabold uppercase tracking-wider">
              Authentication Required
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome to CineTrack v2
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto font-normal">
              Sign in or create a free account to unlock instant movie & TV show streaming, personal watchlists, and watch time analytics.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">Unlimited Streaming</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2.5">
              <Film className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">Personal Watchlist</span>
            </div>
          </div>

          {/* Sign In CTA Button */}
          <button
            onClick={openAuthModal}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-red-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Sign In / Create Free Account</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. User is authenticated -> Render page children
  return <>{children}</>;
}
