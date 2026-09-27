export type MediaType = 'movie' | 'tv';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
}

export interface Episode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnail: string;
  runtime: number; // in minutes
  releaseDate: string;
  streamUrl?: string;
  trailerUrl?: string;
}

export interface Season {
  id: number;
  seasonNumber: number;
  title: string;
  episodeCount: number;
  episodes: Episode[];
}

export interface MediaItem {
  internalId: string;
  tmdbId: number;
  imdbId?: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  releaseDate: string;
  releaseYear: number;
  genres: string[];
  type: MediaType;
  rating: number; // e.g. 8.4
  runtime?: number; // in minutes for movie
  seasonsCount?: number; // for tv
  episodesCount?: number; // for tv
  language?: string;
  country?: string;
  cast?: CastMember[];
  director?: string;
  writers?: string[];
  streamUrl?: string;
  trailerUrl?: string;
  featured?: boolean;
  seasons?: Season[];
  trendingScore?: number;
  isUpcoming?: boolean;
}

export interface WatchItem {
  id: string; // internalId
  media: MediaItem;
  addedAt: string;
  isWatched?: boolean;
  watchedAt?: string;
}

export interface PlaybackProgress {
  mediaId: string;
  title: string;
  poster: string;
  backdrop: string;
  type: MediaType;
  currentTime: number; // seconds
  duration: number; // seconds
  lastWatched: string; // ISO string
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  genres?: string[];
  releaseYear?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  friendTag?: string;
  watchlist?: WatchItem[];
  history?: PlaybackProgress[];
}

export interface HomepageSectionConfig {
  id: string;
  title: string;
  type: 'hero' | 'top10' | 'trending_today' | 'trending_week' | 'upcoming' | 'continue_watching' | 'genre';
  genreFilter?: string;
  enabled: boolean;
  order: number;
}
