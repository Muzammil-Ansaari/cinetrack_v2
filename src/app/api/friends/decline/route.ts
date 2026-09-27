import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cinetrack_jwt_secret_key_2026_super_secret';

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

    const { senderId } = await req.json();
    if (!senderId) {
      return NextResponse.json({ success: false, error: 'senderId is required' }, { status: 400 });
    }

    const currentUser = await User.findById(payload.id);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Remove request from currentUser's friendRequests
    currentUser.friendRequests = (currentUser.friendRequests || []).filter(
      (r: any) => r.senderId !== senderId
    );

    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: 'Friend request declined.',
    });
  } catch (error: any) {
    console.error('Error declining friend request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
