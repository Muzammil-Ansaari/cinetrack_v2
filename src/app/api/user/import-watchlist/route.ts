import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cinetrack_jwt_secret_key_2026_super_secure';

function verifyToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id || decoded.sub;
    if (!userId) return null;
    return { id: userId.toString(), email: decoded.email };
  } catch {
    return null;
  }
}

// Flexible parser for standard JSON, loose JavaScript objects (unquoted keys, single quotes), and Mongo BSON dumps
function parseFlexibleJsonOrBson(rawText: string): any {
  let text = rawText.trim();

  // Remove leading JS variable declaration if user pasted `const data = [...]` or trailing semicolon
  text = text.replace(/^(const|let|var)\s+\w+\s*=\s*/, '').replace(/;$/, '');

  // 1. Try standard JSON.parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to BSON & loose JS parsing
  }

  // 2. Normalize Mongo BSON constructor wrappers
  let cleaned = text
    .replace(/ObjectId\((['"])(.*?)\1\)/g, '"$2"')
    .replace(/Double\((['"])(.*?)\1\)/g, '$2')
    .replace(/NumberInt\((['"])(.*?)\1\)/g, '$2')
    .replace(/NumberLong\((['"])(.*?)\1\)/g, '$2')
    .replace(/ISODate\((['"])(.*?)\1\)/g, '"$2"');

  // 3. Try parsing with Function constructor for loose JS object notation
  try {
    const fn = new Function(`return (${cleaned});`);
    return fn();
  } catch {
    // 4. Fallback: Quote unquoted keys and replace single quotes with double quotes
    let jsonified = cleaned
      .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

    return JSON.parse(jsonified);
  }
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '46b64310f8c3347203f4780bbac0144d';

async function fetchTmdbDetailsById(tmdbId: string | number): Promise<any | null> {
  const idStr = String(tmdbId).trim();
  if (!idStr || idStr === '0') return null;
  try {
    let res = await fetch(`https://api.themoviedb.org/3/movie/${idStr}?api_key=${TMDB_API_KEY}`);
    let data = await res.json();
    if (res.ok && data && (data.title || data.original_title)) {
      return { ...data, media_type: 'movie' };
    }
    res = await fetch(`https://api.themoviedb.org/3/tv/${idStr}?api_key=${TMDB_API_KEY}`);
    data = await res.json();
    if (res.ok && data && (data.name || data.original_name)) {
      return { ...data, media_type: 'tv' };
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to sanitize incoming movie object into CineTrack v2 format
function formatMediaItem(item: any, isUpcomingDefault = false) {
  const tmdbIdNum = Number(item.tmdbId || item.tmdb_id || 0) || 0;
  const title = item.title || item.name || (tmdbIdNum > 0 ? `Movie #${tmdbIdNum}` : 'Untitled');
  const internalId = item.internalId || (tmdbIdNum > 0 ? String(tmdbIdNum) : (item.id || title));

  // Normalize poster path
  let poster = item.poster || item.posterPath || item.poster_path;
  if (poster && typeof poster === 'string' && poster.startsWith('/')) {
    poster = `https://image.tmdb.org/t/p/w500${poster}`;
  } else if (!poster) {
    poster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop';
  }

  // Normalize backdrop path
  let backdrop = item.backdrop || item.backdropPath || item.backdrop_path;
  if (backdrop && typeof backdrop === 'string' && backdrop.startsWith('/')) {
    backdrop = `https://image.tmdb.org/t/p/w1280${backdrop}`;
  } else if (!backdrop) {
    backdrop = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop';
  }

  // Normalize genres (handle array vs string "Action, Thriller")
  let genres: string[] = [];
  if (Array.isArray(item.genres)) {
    genres = item.genres.map((g: any) => (typeof g === 'string' ? g : g.name));
  } else if (typeof item.genres === 'string' && item.genres.trim()) {
    genres = item.genres.split(',').map((g: string) => g.trim());
  } else if (item.genre) {
    genres = [item.genre];
  } else {
    genres = ['Action', 'Entertainment'];
  }

  // Normalize category/type
  const typeStr = (item.type || item.category || item.mediaType || item.media_type || 'movie').toLowerCase();
  const type = typeStr.includes('tv') || typeStr.includes('show') ? 'tv' : 'movie';

  // Normalize rating
  const rating = Number(item.rating || item.global_rating || item.vote_average || 8.0);

  // Normalize release date
  const releaseDate = item.releaseDate || item.release_date || item.first_air_date || new Date().toISOString().split('T')[0];

  return {
    internalId: String(internalId),
    tmdbId: tmdbIdNum,
    imdbId: item.imdbId || item.imdb_id || '',
    title: String(title),
    description: item.description || item.synopsis || item.overview || 'Imported title',
    poster: String(poster),
    backdrop: String(backdrop),
    releaseDate: String(releaseDate),
    releaseYear: Number(item.releaseYear || item.release_year || item.year || (releaseDate ? releaseDate.split('-')[0] : 2026)),
    genres,
    type,
    rating,
    runtime: Number(item.runtime || 110),
    isUpcoming: Boolean(item.isUpcoming || isUpcomingDefault),
    streamUrl: item.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const payload = verifyToken(req.headers.get('authorization'));

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await User.findById(payload.id);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let rawBody = await req.text();
    let body: any;

    try {
      body = parseFlexibleJsonOrBson(rawBody);
    } catch (cleanErr: any) {
      return NextResponse.json(
        { success: false, error: `Invalid JSON or BSON format: ${cleanErr.message}` },
        { status: 400 }
      );
    }

    const importedItems: any[] = [];
    const now = new Date().toISOString();

    // Extract items array from body
    let itemsArray: any[] = [];
    if (Array.isArray(body)) {
      itemsArray = body;
    } else if (body.items || body.watched || body.unwatched || body.upcoming) {
      itemsArray = body.items || [];
    } else if (typeof body === 'object' && body !== null && (body.title || body.name || body.tmdb_id || body.tmdbId)) {
      itemsArray = [body];
    }

    const watchedArray = body.watched || [];
    const unwatchedArray = body.unwatched || [];
    const upcomingArray = body.upcoming || [];

    // Enrich raw TMDB IDs that lack full title/metadata by fetching TMDB API details in parallel batches
    const allRawLists = [...watchedArray, ...unwatchedArray, ...upcomingArray, ...itemsArray];
    const itemsNeedFetching = allRawLists.filter((raw: any) => {
      const tmdbIdNum = Number(raw.tmdbId || raw.tmdb_id || 0);
      return tmdbIdNum > 0 && !raw.title && !raw.name;
    });

    if (itemsNeedFetching.length > 0) {
      const BATCH_SIZE = 20;
      for (let i = 0; i < itemsNeedFetching.length; i += BATCH_SIZE) {
        const batch = itemsNeedFetching.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (rawItem) => {
            const tmdbIdNum = Number(rawItem.tmdbId || rawItem.tmdb_id);
            const fetched = await fetchTmdbDetailsById(tmdbIdNum);
            if (fetched) {
              Object.assign(rawItem, {
                title: fetched.title || fetched.name || fetched.original_title,
                poster_path: fetched.poster_path,
                backdrop_path: fetched.backdrop_path,
                overview: fetched.overview,
                release_date: fetched.release_date || fetched.first_air_date,
                vote_average: fetched.vote_average,
                runtime: fetched.runtime || (fetched.episode_run_time ? fetched.episode_run_time[0] : 110),
                type: fetched.media_type,
                genres: fetched.genres ? fetched.genres.map((g: any) => g.name) : ['General'],
              });
            }
          })
        );
      }
    }

    // 1. Process watched list
    watchedArray.forEach((raw: any) => {
      const media = formatMediaItem(raw, false);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.created_at || raw.addedAt || now,
        isWatched: true,
        watchedAt: raw.watched_at || raw.watchedAt || now,
      });
    });

    // 2. Process unwatched list
    unwatchedArray.forEach((raw: any) => {
      const media = formatMediaItem(raw, false);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.created_at || raw.addedAt || now,
        isWatched: false,
      });
    });

    // 3. Process upcoming list
    upcomingArray.forEach((raw: any) => {
      const media = formatMediaItem(raw, true);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.created_at || raw.addedAt || now,
        isWatched: false,
      });
    });

    // Check optional targetStatus override parameter ('unwatched' | 'watched' | 'auto')
    const { searchParams } = new URL(req.url);
    const targetStatusParam = searchParams.get('targetStatus') || 'auto';

    // 4. Process generic list (or direct array / single object) with v1 attributes
    itemsArray.forEach((raw: any) => {
      let isWatched = raw.watched === true || raw.status === 'watched' || raw.isWatched === true;

      if (targetStatusParam === 'watched') {
        isWatched = true;
      } else if (targetStatusParam === 'unwatched') {
        isWatched = false;
      }

      const isUpcoming = raw.status === 'upcoming' || raw.isUpcoming === true;
      const media = formatMediaItem(raw, isUpcoming);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.created_at || raw.addedAt || now,
        isWatched,
        watchedAt: isWatched ? raw.watched_at || raw.watchedAt || now : undefined,
      });
    });

    if (importedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid movie/TV items found in import payload.' },
        { status: 400 }
      );
    }

    // Merge with existing watchlist without duplicates by internalId
    const existingWatchlist = currentUser.watchlist || [];
    const existingMap = new Map(existingWatchlist.map((w: any) => [w.id, w]));

    importedItems.forEach((newItem) => {
      existingMap.set(newItem.id, newItem);
    });

    currentUser.watchlist = Array.from(existingMap.values());
    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedItems.length} title(s) into your watchlist!`,
      totalCount: currentUser.watchlist.length,
      watchlist: currentUser.watchlist,
    });
  } catch (error: any) {
    console.error('Error importing watchlist:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
