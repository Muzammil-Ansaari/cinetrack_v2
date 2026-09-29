import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

    const { newFriendTag } = await req.json();

    if (!newFriendTag || typeof newFriendTag !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Friend Tag.' },
        { status: 400 }
      );
    }

    const trimmedTag = newFriendTag.trim();

    // Length validation (3 - 35 characters)
    if (trimmedTag.length < 3 || trimmedTag.length > 35) {
      return NextResponse.json(
        { success: false, error: 'Friend Tag must be between 3 and 35 characters long.' },
        { status: 400 }
      );
    }

    // Allowed characters: Alphanumeric, underscore, hyphen, hash
    if (!/^[a-zA-Z0-9_#-]+$/.test(trimmedTag)) {
      return NextResponse.json(
        { success: false, error: 'Friend Tag can only contain letters, numbers, underscores, hyphens, and hashes (#).' },
        { status: 400 }
      );
    }

    const currentUser = await User.findById(payload.id);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    // Check if tag is unchanged
    if (currentUser.friendTag && currentUser.friendTag.toLowerCase() === trimmedTag.toLowerCase()) {
      return NextResponse.json({
        success: true,
        friendTag: currentUser.friendTag,
        message: 'Friend Tag is unchanged.',
      });
    }

    // Check 30-day cooldown period
    if (currentUser.tagLastChangedAt) {
      const lastChanged = new Date(currentUser.tagLastChangedAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - lastChanged;
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      if (diffMs < THIRTY_DAYS_MS) {
        const daysLeft = Math.ceil((THIRTY_DAYS_MS - diffMs) / (1000 * 60 * 60 * 24));
        return NextResponse.json(
          {
            success: false,
            error: `You can only change your Friend Tag once every 30 days. Please wait ${daysLeft} more ${daysLeft === 1 ? 'day' : 'days'}.`,
            daysLeft,
          },
          { status: 400 }
        );
      }
    }

    // Uniqueness check across all other users in MongoDB (case-insensitive)
    const escapedTag = trimmedTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUserWithTag = await User.findOne({
      _id: { $ne: currentUser._id },
      friendTag: { $regex: new RegExp(`^${escapedTag}$`, 'i') },
    });

    if (existingUserWithTag) {
      return NextResponse.json(
        {
          success: false,
          error: `The Friend Tag "${trimmedTag}" is already taken by another user. Please pick a unique tag.`,
        },
        { status: 400 }
      );
    }

    // Update user's friendTag and set cooldown timestamp
    currentUser.friendTag = trimmedTag;
    currentUser.tagLastChangedAt = new Date();
    await currentUser.save();

    return NextResponse.json({
      success: true,
      friendTag: currentUser.friendTag,
      tagLastChangedAt: currentUser.tagLastChangedAt,
      message: 'Your Unique Friend Tag has been updated successfully!',
    });
  } catch (error: any) {
    console.error('Error updating friend tag:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
