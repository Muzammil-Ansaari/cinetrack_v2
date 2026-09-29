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

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { avatar } = await req.json();

    if (!avatar || typeof avatar !== 'string' || !avatar.trim()) {
      return NextResponse.json({ error: 'Invalid profile picture URL or image string' }, { status: 400 });
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatar.trim() } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      avatar: updatedUser.avatar,
    });
  } catch (err: any) {
    console.error('Avatar Update API Error:', err);
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
  }
}
