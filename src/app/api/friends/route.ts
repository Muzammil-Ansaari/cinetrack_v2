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

// Generate a clean Unique Friend Tag (e.g. "muzammil#9A42" or "CT-849201")
function generateFriendTag(name: string, idStr: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
  const shortId = idStr.slice(-4).toUpperCase();
  return `${cleanName}#${shortId}`;
}

export async function GET(req: Request) {
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

    // Generate friendTag if not present
    if (!currentUser.friendTag) {
      currentUser.friendTag = generateFriendTag(currentUser.name, currentUser._id.toString());
      await currentUser.save();
    }

    // Fetch friend profiles with their watchlists
    const friendIds = currentUser.friends || [];
    const friendUsers = await User.find({ _id: { $in: friendIds } }).select(
      'name email avatar friendTag watchlist history'
    );

    const formattedFriends = friendUsers.map((f) => {
      const watchlist = f.watchlist || [];
      const watched = watchlist.filter((w: any) => w.isWatched === true);
      const unwatched = watchlist.filter((w: any) => !w.isWatched);

      let totalWatchedMinutes = 0;
      watched.forEach((w: any) => {
        const m = w.media || {};
        totalWatchedMinutes += m.runtime || (m.type === 'movie' ? 110 : 450);
      });

      return {
        id: f._id.toString(),
        name: f.name,
        email: f.email,
        avatar: f.avatar,
        friendTag: f.friendTag || generateFriendTag(f.name, f._id.toString()),
        watchlistCount: watchlist.length,
        watchedCount: watched.length,
        unwatchedCount: unwatched.length,
        watchedMinutes: totalWatchedMinutes,
        watchlist: watchlist,
      };
    });

    return NextResponse.json({
      success: true,
      friendTag: currentUser.friendTag,
      friends: formattedFriends,
      friendRequests: currentUser.friendRequests || [],
    });
  } catch (error: any) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
