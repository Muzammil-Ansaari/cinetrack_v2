import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'cinetrack_jwt_secret_key_2026_super_secure';

function getUserIdFromToken(req: Request): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : '';

    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/cinetrack_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.userId || null;
  } catch (err) {
    return null;
  }
}

// GET: Fetch current user profile & data from MongoDB
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        watchlist: user.watchlist || [],
        history: user.history || [],
      },
    });
  } catch (err: any) {
    console.error('User GET Sync Error:', err);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}

// POST: Save/Sync Watchlist and Playback History into MongoDB
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { watchlist, history } = await req.json();

    await connectToDatabase();

    const updateData: any = {};
    if (watchlist !== undefined) updateData.watchlist = watchlist;
    if (history !== undefined) updateData.history = history;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        watchlist: user.watchlist || [],
        history: user.history || [],
      },
    });
  } catch (err: any) {
    console.error('User POST Sync Error:', err);
    return NextResponse.json({ error: 'Failed to sync user data' }, { status: 500 });
  }
}
