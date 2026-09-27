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

// Helper to sanitize incoming movie object into CineTrack v2 format
function formatMediaItem(item: any, isUpcomingDefault = false) {
  const title = item.title || item.name || 'Untitled';
  const internalId = item.internalId || item.id || item.tmdbId?.toString() || `v1-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  return {
    internalId: String(internalId),
    tmdbId: Number(item.tmdbId || item.id || 0),
    imdbId: item.imdbId || '',
    title: String(title),
    description: item.description || item.overview || 'Imported from CineTrack v1',
    poster: item.poster || item.posterPath || item.poster_path || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    backdrop: item.backdrop || item.backdropPath || item.backdrop_path || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    releaseDate: item.releaseDate || item.release_date || new Date().toISOString().split('T')[0],
    releaseYear: Number(item.releaseYear || item.year || (item.releaseDate ? item.releaseDate.split('-')[0] : 2026)),
    genres: Array.isArray(item.genres) ? item.genres : [item.genre || 'General'],
    type: item.type === 'tv' || item.mediaType === 'tv' ? 'tv' : 'movie',
    rating: Number(item.rating || item.vote_average || 8.0),
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

    const body = await req.json();
    const { watched = [], unwatched = [], upcoming = [], items = [] } = body;

    const importedItems: any[] = [];
    const now = new Date().toISOString();

    // 1. Process watched list
    watched.forEach((raw: any) => {
      const media = formatMediaItem(raw, false);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.addedAt || now,
        isWatched: true,
        watchedAt: raw.watchedAt || now,
      });
    });

    // 2. Process unwatched list
    unwatched.forEach((raw: any) => {
      const media = formatMediaItem(raw, false);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.addedAt || now,
        isWatched: false,
      });
    });

    // 3. Process upcoming list
    upcoming.forEach((raw: any) => {
      const media = formatMediaItem(raw, true);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.addedAt || now,
        isWatched: false,
      });
    });

    // 4. Process generic list with status attribute
    items.forEach((raw: any) => {
      const isWatched = raw.status === 'watched' || raw.isWatched === true;
      const isUpcoming = raw.status === 'upcoming' || raw.isUpcoming === true;
      const media = formatMediaItem(raw, isUpcoming);
      importedItems.push({
        id: media.internalId,
        media,
        addedAt: raw.addedAt || now,
        isWatched,
        watchedAt: isWatched ? raw.watchedAt || now : undefined,
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
      message: `Successfully imported ${importedItems.length} titles into your watchlist!`,
      totalCount: currentUser.watchlist.length,
      watchlist: currentUser.watchlist,
    });
  } catch (error: any) {
    console.error('Error importing watchlist:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
