'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bookmark, User, ShieldAlert, Film, Tv, Home, LogOut, Menu, X, LayoutDashboard, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const pathname = usePathname();
  const { watchlist, openSearch, user, authLoading, logout, openAuthModal } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'TV Shows', href: '/tv', icon: Tv },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark, badge: watchlist.length },
    ...(user ? [{ name: 'Friends', href: '/friends', icon: Users }] : []),
    ...(user ? [{ name: 'Dashboard', href: '/profile', icon: LayoutDashboard }] : []),
    ...(user?.isAdmin ? [{ name: 'Admin', href: '/admin', icon: ShieldAlert }] : []),
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav py-2.5 shadow-2xl' : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-red-500 bg-clip-text text-transparent">
            CINETRACK<span className="text-red-500 font-bold text-[10px] ml-1 px-1 py-0.2 rounded bg-red-950/80 border border-red-800/60">v2</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            const showBadge = link.badge !== undefined && mounted && !authLoading && link.badge > 0;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.name}</span>
                {showBadge && (
                  <span className="ml-0.5 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search Trigger */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-md transition-all group"
            title="Global Search"
          >
            <Search className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-normal text-xs text-slate-400">Search...</span>
            <kbd className="hidden xl:inline bg-black/40 text-[9px] text-slate-400 px-1 py-0.5 rounded border border-white/10">⌘K</kbd>
          </button>

          {/* User Auth Profile */}
          {!mounted || authLoading ? (
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className={`p-0.5 rounded-full border transition-all cursor-pointer ${
                  pathname === '/profile'
                    ? 'border-red-500 ring-2 ring-red-500/40 scale-105'
                    : 'border-white/20 hover:border-red-500/60'
                }`}
                title={`${user.name} - View Dashboard`}
              >
                {/* eslint-disable-next-img-element */}
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                />
              </Link>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium px-3.5 py-1.5 rounded-full text-xs transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile/Tablet Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white bg-white/5 rounded-xl border border-white/10 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-white/10 px-4 pt-3 pb-5 backdrop-blur-xl mt-3 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                  pathname === link.href ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
