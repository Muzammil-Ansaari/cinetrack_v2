'use client';

import React from 'react';
import Link from 'next/link';
import { User, Film, Star } from 'lucide-react';
import { ActorItem } from '@/types/cinetrack';

interface ActorCardProps {
  actor: ActorItem;
  onClick?: () => void;
}

export default function ActorCard({ actor, onClick }: ActorCardProps) {
  return (
    <Link
      href={`/actor/${actor.id}`}
      onClick={onClick}
      className="group relative p-4 rounded-3xl glass-panel border border-white/10 hover:border-red-500/50 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-red-950/20 hover:scale-[1.02] transition-all duration-300 shadow-xl flex items-center gap-4 cursor-pointer"
    >
      {/* Profile Photo / Avatar */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-950 border border-white/20 group-hover:border-red-500 transition-colors shrink-0 shadow-md">
        {actor.profilePath ? (
          <img
            src={actor.profilePath}
            alt={actor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-red-950/60 flex items-center justify-center text-red-300 font-extrabold text-xl">
            {actor.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider">
            {actor.knownForDepartment || 'Actor'}
          </span>
          {actor.popularity && actor.popularity > 15 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-extrabold">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Popular</span>
            </span>
          )}
        </div>

        <h4 className="text-base font-black text-white group-hover:text-red-400 transition-colors truncate">
          {actor.name}
        </h4>

        {actor.knownForTitles && actor.knownForTitles.length > 0 && (
          <p className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1">
            <Film className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{actor.knownForTitles.join(', ')}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
