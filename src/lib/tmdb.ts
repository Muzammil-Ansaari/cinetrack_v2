import { MediaItem, Season, Episode, CastMember, ActorItem, ActorDetails } from '@/types/cinetrack';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '46b64310f8c3347203f4780bbac0144d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_W1280 = 'https://image.tmdb.org/t/p/w1280';
const IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
const IMAGE_BASE_W185 = 'https://image.tmdb.org/t/p/w185';

const SAMPLE_TRAILERS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
];

// Extract the best YouTube trailer from TMDB videos response
function extractTrailerUrl(videos: any): string | undefined {
  if (!videos || !videos.results || videos.results.length === 0) return undefined;

  // Priority: Official Trailer on YouTube > any Trailer on YouTube > any Teaser on YouTube
  const youtubeVideos = videos.results.filter((v: any) => v.site === 'YouTube');
  if (youtubeVideos.length === 0) return undefined;

  const officialTrailer = youtubeVideos.find(
    (v: any) => v.type === 'Trailer' && v.official === true
  );
  if (officialTrailer) return `https://www.youtube.com/embed/${officialTrailer.key}?autoplay=1&rel=0`;

  const anyTrailer = youtubeVideos.find((v: any) => v.type === 'Trailer');
  if (anyTrailer) return `https://www.youtube.com/embed/${anyTrailer.key}?autoplay=1&rel=0`;

  const teaser = youtubeVideos.find((v: any) => v.type === 'Teaser');
  if (teaser) return `https://www.youtube.com/embed/${teaser.key}?autoplay=1&rel=0`;

  // Fallback to any YouTube video
  return `https://www.youtube.com/embed/${youtubeVideos[0].key}?autoplay=1&rel=0`;
}

const GENRE_ID_MAP: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Drama: 18,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  'Sci-Fi': 878,
  Thriller: 53,
};

// Helper to format TMDB JSON to MediaItem
function formatTmdbItem(item: any, mediaType?: 'movie' | 'tv'): MediaItem {
  const type = mediaType || item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name || 'Untitled';
  const releaseDate = item.release_date || item.first_air_date || '2026-12-01';
  const releaseYear = new Date(releaseDate).getFullYear() || 2026;

  const genresMap: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy',
  };

  const genres = item.genre_ids
    ? item.genre_ids.map((id: number) => genresMap[id] || 'Entertainment')
    : item.genres
    ? item.genres.map((g: any) => g.name)
    : ['Action', 'Sci-Fi'];

  const isFutureRelease = new Date(releaseDate) > new Date();

  return {
    internalId: `${type}-${item.id}`,
    tmdbId: item.id,
    imdbId: item.imdb_id || `tt${item.id}`,
    title,
    description: item.overview || 'No synopsis available for this title.',
    poster: item.poster_path ? `${IMAGE_BASE_W500}${item.poster_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    backdrop: item.backdrop_path ? `${IMAGE_BASE_W1280}${item.backdrop_path}` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    releaseDate,
    releaseYear,
    genres: genres.length > 0 ? genres : ['Popular'],
    type,
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.5,
    runtime: item.runtime || 135,
    seasonsCount: item.number_of_seasons || (type === 'tv' ? 2 : undefined),
    episodesCount: item.number_of_episodes || (type === 'tv' ? 16 : undefined),
    language: item.original_language ? item.original_language.toUpperCase() : 'EN',
    country: item.origin_country ? item.origin_country[0] : 'US',
    streamUrl: SAMPLE_TRAILERS[item.id % SAMPLE_TRAILERS.length],
    featured: item.vote_count > 500,
    trendingScore: Math.floor(item.popularity * 10) || 9000,
    isUpcoming: isFutureRelease,
  };
}

export const MOCK_MEDIA_ITEMS: MediaItem[] = [
  {
    internalId: 'movie-avatar-3',
    tmdbId: 83533,
    imdbId: 'tt1757678',
    title: 'Avatar: Fire and Ash',
    description: 'Jake Sully and Neytiri encounter the Ash People, a aggressive Na\'vi clan living near volcanic regions of Pandora.',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    releaseDate: '2026-12-19',
    releaseYear: 2026,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    type: 'movie',
    rating: 8.9,
    runtime: 192,
    language: 'English',
    country: 'United States',
    director: 'James Cameron',
    cast: [
      { id: 1, name: 'Sam Worthington', character: 'Jake Sully' },
      { id: 2, name: 'Zoe Saldaña', character: 'Neytiri' },
    ],
    streamUrl: SAMPLE_TRAILERS[0],
    featured: true,
    trendingScore: 9945,
    isUpcoming: true,
  },
  {
    internalId: 'movie-avengers-secret-wars',
    tmdbId: 1003596,
    imdbId: 'tt21361408',
    title: 'Avengers: Secret Wars',
    description: 'The Marvel multiverse collapses into Battleworld. Heroes from across realities unite for a final stand against cosmic destruction.',
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    releaseDate: '2027-05-07',
    releaseYear: 2027,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    type: 'movie',
    rating: 9.5,
    runtime: 185,
    streamUrl: SAMPLE_TRAILERS[3],
    featured: false,
    trendingScore: 9999,
    isUpcoming: true,
  },
  {
    internalId: 'movie-spider-man-beyond',
    tmdbId: 569094,
    imdbId: 'tt9362722',
    title: 'Spider-Man: Beyond the Spider-Verse',
    description: 'Miles Morales races across dimensions to save his father and rewrite destiny in the finale of the Spider-Verse trilogy.',
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop',
    releaseDate: '2026-11-20',
    releaseYear: 2026,
    genres: ['Animation', 'Action', 'Sci-Fi'],
    type: 'movie',
    rating: 9.4,
    runtime: 140,
    streamUrl: SAMPLE_TRAILERS[4],
    featured: false,
    trendingScore: 9600,
    isUpcoming: true,
  }
];

// Live TMDB API Fetch Functions
export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  try {
    const urlParams = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
    const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('TMDB API Fetch Error:', err);
    return null;
  }
}

export async function getFeaturedHeroItems(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB('/trending/all/day');
  if (data && data.results && data.results.length >= 5) {
    return data.results.slice(0, 5).map((item: any) => formatTmdbItem(item));
  }
  return MOCK_MEDIA_ITEMS.slice(0, 5);
}

export async function getTop10NewReleases(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB('/movie/popular');
  if (data && data.results && data.results.length >= 10) {
    return data.results.slice(0, 10).map((item: any) => formatTmdbItem(item, 'movie'));
  }
  return MOCK_MEDIA_ITEMS.slice(0, 10);
}

export async function getTrendingToday(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB('/trending/all/day');
  if (data && data.results && data.results.length >= 10) {
    return data.results.slice(0, 15).map((item: any) => formatTmdbItem(item));
  }
  return MOCK_MEDIA_ITEMS;
}

export async function getTrendingThisWeek(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB('/trending/all/week');
  if (data && data.results && data.results.length >= 10) {
    return data.results.slice(0, 15).map((item: any) => formatTmdbItem(item));
  }
  return MOCK_MEDIA_ITEMS;
}

export async function getUpcomingItems(daysAhead?: number): Promise<MediaItem[]> {
  // Use tomorrow's date to ensure we only get truly unreleased movies
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  if (daysAhead && daysAhead > 0) {
    maxDate.setDate(maxDate.getDate() + daysAhead);
  } else {
    maxDate.setFullYear(maxDate.getFullYear() + 1);
  }
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const data = await fetchFromTMDB('/discover/movie', {
    'primary_release_date.gte': tomorrowStr,
    'primary_release_date.lte': maxDateStr,
    sort_by: 'popularity.desc',
  });
  if (data && data.results && data.results.length > 0) {
    return data.results.slice(0, 15).map((item: any) => formatTmdbItem(item, 'movie'));
  }
  return MOCK_MEDIA_ITEMS.filter((i) => i.isUpcoming);
}

export async function getMovies(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB('/movie/popular');
  if (data && data.results && data.results.length > 0) {
    return data.results.map((item: any) => formatTmdbItem(item, 'movie'));
  }
  return MOCK_MEDIA_ITEMS.filter((i) => i.type === 'movie');
}

export async function getTVShows(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB('/tv/popular');
  if (data && data.results && data.results.length > 0) {
    return data.results.map((item: any) => formatTmdbItem(item, 'tv'));
  }
  return MOCK_MEDIA_ITEMS.filter((i) => i.type === 'tv');
}

export async function getItemsByGenre(genre: string, type: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
  const genreId = GENRE_ID_MAP[genre];
  const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie';
  if (genreId) {
    const data = await fetchFromTMDB(endpoint, { with_genres: genreId.toString() });
    if (data && data.results && data.results.length > 0) {
      return data.results.slice(0, 15).map((item: any) => formatTmdbItem(item, type));
    }
  }
  return MOCK_MEDIA_ITEMS.filter((item) => item.type === type);
}

export interface SearchResponse {
  items: MediaItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export async function searchMedia(query: string, page: number = 1): Promise<SearchResponse> {
  if (!query.trim()) {
    return { items: [], page: 1, totalPages: 1, totalResults: 0 };
  }

  const data = await fetchFromTMDB('/search/multi', { query, page: page.toString() });
  const resultsMap = new Map<string, MediaItem>();

  if (data && data.results && data.results.length > 0) {
    for (const item of data.results) {
      if (item.media_type === 'movie' || item.media_type === 'tv') {
        const formatted = formatTmdbItem(item);
        if (!resultsMap.has(formatted.internalId)) {
          resultsMap.set(formatted.internalId, formatted);
        }
      } else if (item.media_type === 'person' && item.known_for && Array.isArray(item.known_for)) {
        for (const k of item.known_for) {
          if (k.media_type === 'movie' || k.media_type === 'tv') {
            const formatted = formatTmdbItem(k);
            if (!resultsMap.has(formatted.internalId)) {
              resultsMap.set(formatted.internalId, formatted);
            }
          }
        }
      }
    }

    const items = Array.from(resultsMap.values());
    const totalPages = Math.min(data.total_pages || 1, 50);
    const totalResults = data.total_results || items.length;

    return {
      items,
      page: data.page || page,
      totalPages,
      totalResults,
    };
  }

  // Fallback to local mock data matching title, cast names, or director
  const q = query.toLowerCase();
  const matched = MOCK_MEDIA_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      (item.cast && item.cast.some((c) => c.name.toLowerCase().includes(q))) ||
      (item.director && item.director.toLowerCase().includes(q))
  );

  return {
    items: matched,
    page: 1,
    totalPages: 1,
    totalResults: matched.length,
  };
}

export async function getMediaDetails(id: string): Promise<MediaItem | undefined> {
  let targetType: 'movie' | 'tv' = id.startsWith('tv-') ? 'tv' : 'movie';
  let targetTmdbId: string | number | null = null;

  if (id.startsWith('tv-') || id.startsWith('movie-')) {
    targetType = id.startsWith('tv-') ? 'tv' : 'movie';
    targetTmdbId = id.replace(/^(movie|tv)-/, '');
  } else if (/^\d+$/.test(id)) {
    targetTmdbId = id;
  }

  let data: any = null;

  if (targetTmdbId) {
    const endpoint = targetType === 'tv' ? `/tv/${targetTmdbId}` : `/movie/${targetTmdbId}`;
    data = await fetchFromTMDB(endpoint, { append_to_response: 'credits,videos' });

    // Fallback: If movie endpoint returned null and no explicit type was given, try TV show endpoint
    if (!data && !id.startsWith('movie-')) {
      const tvData = await fetchFromTMDB(`/tv/${targetTmdbId}`, { append_to_response: 'credits,videos' });
      if (tvData) {
        data = tvData;
        targetType = 'tv';
      }
    }
  }

  // Fallback 2: Search TMDB by query (e.g. if id is non-numeric title, name, or UUID)
  if (!data && id) {
    const searchRes = await fetchFromTMDB('/search/multi', { query: id });
    if (searchRes && searchRes.results && searchRes.results.length > 0) {
      const firstMatch = searchRes.results.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv') || searchRes.results[0];
      if (firstMatch) {
        targetType = firstMatch.media_type === 'tv' ? 'tv' : 'movie';
        targetTmdbId = firstMatch.id;
        const endpoint = targetType === 'tv' ? `/tv/${targetTmdbId}` : `/movie/${targetTmdbId}`;
        data = await fetchFromTMDB(endpoint, { append_to_response: 'credits,videos' });
      }
    }
  }

  if (data) {
    const item = formatTmdbItem(data, targetType);

    // Parse cast with profile images
    if (data.credits && data.credits.cast) {
      item.cast = data.credits.cast.slice(0, 8).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `${IMAGE_BASE_W185}${c.profile_path}` : undefined,
      }));
    }

    // Parse director from crew
    if (data.credits && data.credits.crew) {
      const director = data.credits.crew.find((c: any) => c.job === 'Director');
      if (director) item.director = director.name;
    }

    // Parse trailer URL from videos
    if (data.videos) {
      const trailerUrl = extractTrailerUrl(data.videos);
      if (trailerUrl) item.trailerUrl = trailerUrl;
    }

    // Parse seasons if TV
    if (targetType === 'tv' && data.seasons) {
      const validSeasons = data.seasons.filter((s: any) => s.season_number > 0);
      const seasonsToUse = validSeasons.length > 0 ? validSeasons : data.seasons;

      item.seasons = seasonsToUse.map((s: any) => ({
        id: s.id,
        seasonNumber: s.season_number,
        title: s.name || `Season ${s.season_number}`,
        episodeCount: s.episode_count || 10,
        episodes: Array.from({ length: s.episode_count || 8 }).map((_, idx) => ({
          id: s.id * 100 + idx + 1,
          seasonNumber: s.season_number,
          episodeNumber: idx + 1,
          title: `Episode ${idx + 1}`,
          description: `Episode ${idx + 1} of ${s.name || 'Season ' + s.season_number}`,
          thumbnail: item.backdrop,
          runtime: 45,
          releaseDate: item.releaseDate,
          streamUrl: SAMPLE_TRAILERS[idx % SAMPLE_TRAILERS.length],
        })),
      }));

      // Automatically fetch real episodes for Season 1
      const seasons = item.seasons || [];
      const firstSeason = seasons.find((s) => s.seasonNumber === 1) || seasons[0];
      if (firstSeason && item.tmdbId) {
        const realEpisodes = await getSeasonEpisodes(item.tmdbId, firstSeason.seasonNumber, item.backdrop);
        if (realEpisodes.length > 0) {
          firstSeason.episodes = realEpisodes;
        }
      }
    }

    return item;
  }

  return MOCK_MEDIA_ITEMS.find((m) => m.internalId === id || m.tmdbId === Number(id));
}

// Fetch real episodes for a given TV show season from TMDB API
export async function getSeasonEpisodes(
  tvTmdbId: number,
  seasonNumber: number,
  fallbackBackdrop: string = ''
): Promise<Episode[]> {
  const data = await fetchFromTMDB(`/tv/${tvTmdbId}/season/${seasonNumber}`);
  if (data && data.episodes && Array.isArray(data.episodes)) {
    return data.episodes.map((ep: any, idx: number) => ({
      id: ep.id || tvTmdbId * 1000 + seasonNumber * 100 + ep.episode_number,
      seasonNumber: ep.season_number || seasonNumber,
      episodeNumber: ep.episode_number || idx + 1,
      title: ep.name || `Episode ${ep.episode_number || idx + 1}`,
      description: ep.overview || `Episode ${ep.episode_number || idx + 1} of Season ${seasonNumber}`,
      thumbnail: ep.still_path ? `${IMAGE_BASE_W500}${ep.still_path}` : fallbackBackdrop,
      runtime: ep.runtime || 45,
      releaseDate: ep.air_date || '',
      streamUrl: SAMPLE_TRAILERS[idx % SAMPLE_TRAILERS.length],
    }));
  }
  return [];
}

// Fetch trailer URL for a given TMDB ID (standalone function for quick lookup)
export async function getTrailerUrl(tmdbId: number, type: 'movie' | 'tv' = 'movie'): Promise<string | undefined> {
  const endpoint = type === 'tv' ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;
  const data = await fetchFromTMDB(endpoint);
  if (data) {
    return extractTrailerUrl(data);
  }
  return undefined;
}

// Fetch similar movies or TV shows from TMDB
export async function getSimilarMedia(tmdbId: number, type: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
  const endpoint = type === 'tv' ? `/tv/${tmdbId}/similar` : `/movie/${tmdbId}/similar`;
  const data = await fetchFromTMDB(endpoint);
  if (data && data.results && data.results.length > 0) {
    return data.results.slice(0, 12).map((item: any) => formatTmdbItem(item, type));
  }
  // Fallback: try recommendations
  const recEndpoint = type === 'tv' ? `/tv/${tmdbId}/recommendations` : `/movie/${tmdbId}/recommendations`;
  const recData = await fetchFromTMDB(recEndpoint);
  if (recData && recData.results && recData.results.length > 0) {
    return recData.results.slice(0, 12).map((item: any) => formatTmdbItem(item, type));
  }
  return [];
}

// Generate live embed player URL for movies and TV shows
export function getEmbedUrl(media: MediaItem, episode?: Episode, startTime: number = 0): string {
  const tmdbId = media.tmdbId || Number(String(media.internalId).replace(/^(movie|tv)-/, '')) || media.internalId;
  const isMovie = media.type === 'movie';
  const baseUrl = isMovie
    ? `https://cinemaos.tech/player/${tmdbId}`
    : `https://cinemaos.tech/player/${tmdbId}/${episode?.seasonNumber || 1}/${episode?.episodeNumber || 1}`;

  const queryParams = new URLSearchParams();

  if (startTime && startTime > 0) {
    queryParams.set('startTime', Math.floor(startTime).toString());
  }

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export async function searchActors(query: string): Promise<ActorItem[]> {
  if (!query.trim()) return [];
  const data = await fetchFromTMDB('/search/person', { query });
  if (data && data.results && data.results.length > 0) {
    return data.results.slice(0, 8).map((p: any) => ({
      id: p.id,
      name: p.name,
      profilePath: p.profile_path ? `https://image.tmdb.org/t/p/w500${p.profile_path}` : undefined,
      knownForDepartment: p.known_for_department || 'Acting',
      knownForTitles: p.known_for
        ? p.known_for.map((k: any) => k.title || k.name).filter(Boolean)
        : [],
      popularity: p.popularity,
    }));
  }
  return [];
}

export async function getActorDetails(actorId: string | number): Promise<{
  actor: ActorDetails;
  filmography: MediaItem[];
} | null> {
  const cleanId = actorId.toString().split('-')[0];
  const [personData, creditsData] = await Promise.all([
    fetchFromTMDB(`/person/${cleanId}`),
    fetchFromTMDB(`/person/${cleanId}/combined_credits`),
  ]);

  if (!personData) return null;

  const actor: ActorDetails = {
    id: personData.id,
    name: personData.name,
    biography: personData.biography,
    profilePath: personData.profile_path ? `https://image.tmdb.org/t/p/w500${personData.profile_path}` : undefined,
    birthday: personData.birthday,
    placeOfBirth: personData.place_of_birth,
    knownForDepartment: personData.known_for_department || 'Acting',
    popularity: personData.popularity,
  };

  const filmographyMap = new Map<string, MediaItem>();

  if (creditsData && creditsData.cast && Array.isArray(creditsData.cast)) {
    const sorted = creditsData.cast
      .filter((c: any) => (c.poster_path || c.backdrop_path) && (c.media_type === 'movie' || c.media_type === 'tv'))
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

    for (const item of sorted) {
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const formatted = formatTmdbItem(item, mediaType);
      if (!filmographyMap.has(formatted.internalId)) {
        filmographyMap.set(formatted.internalId, formatted);
      }
    }
  }

  return {
    actor,
    filmography: Array.from(filmographyMap.values()),
  };
}

export type TimeframeFilter = 'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'custom';

export function filterItemByTimeframe(
  itemDateStr?: string | Date,
  timeframe: TimeframeFilter = 'all',
  customStartDate?: string,
  customEndDate?: string
): boolean {
  if (timeframe === 'all' || !itemDateStr) return true;

  const itemDate = new Date(itemDateStr);
  if (isNaN(itemDate.getTime())) return true;

  const now = new Date();

  // Midnight today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Midnight yesterday
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  // 7 days ago midnight
  const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  // Start of current month midnight
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (timeframe) {
    case 'today':
      return itemDate >= startOfToday;
    case 'yesterday':
      return itemDate >= startOfYesterday && itemDate < startOfToday;
    case '7days':
      return itemDate >= startOf7Days;
    case 'this_month':
      return itemDate >= startOfMonth;
    case 'custom': {
      if (!customStartDate && !customEndDate) return true;

      let passesStart = true;
      let passesEnd = true;

      if (customStartDate) {
        const start = new Date(customStartDate);
        if (!isNaN(start.getTime())) {
          const startBoundary = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          passesStart = itemDate >= startBoundary;
        }
      }

      if (customEndDate) {
        const end = new Date(customEndDate);
        if (!isNaN(end.getTime())) {
          const endBoundary = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
          passesEnd = itemDate < endBoundary;
        }
      }

      return passesStart && passesEnd;
    }
    default:
      return true;
  }
}
