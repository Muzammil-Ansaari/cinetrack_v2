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

export async function POST(req: Request) {
  try {
    await connectDB();
    const payload = verifyToken(req.headers.get('authorization'));

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await req.json();
    if (!friendId) {
      return NextResponse.json({ success: false, error: 'friendId is required' }, { status: 400 });
    }

    const currentUser = await User.findById(payload.id);
    const friendUser = await User.findById(friendId);

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Remove friendId from currentUser.friends
    currentUser.friends = (currentUser.friends || []).filter(
      (id: string) => id.toString() !== friendId
    );
    await currentUser.save();

    // If friendUser exists, remove currentUser._id from friendUser.friends
    if (friendUser) {
      friendUser.friends = (friendUser.friends || []).filter(
        (id: string) => id.toString() !== currentUser._id.toString()
      );
      await friendUser.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing friend:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
