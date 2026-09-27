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

    const { targetTag } = await req.json();
    if (!targetTag || typeof targetTag !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Friend Tag or Email.' },
        { status: 400 }
      );
    }

    const trimmedTag = targetTag.trim();
    const lowerTag = trimmedTag.toLowerCase();
    const escapedTag = lowerTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const sender = await User.findById(payload.id);
    if (!sender) {
      return NextResponse.json({ success: false, error: 'Sender user not found.' }, { status: 404 });
    }

    // Ensure sender has friendTag
    if (!sender.friendTag) {
      sender.friendTag = `${(sender.name || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}#${sender._id.toString().slice(-4).toUpperCase()}`;
      await sender.save();
    }

    // Build query conditions for target user
    const queryConditions: any[] = [
      { email: lowerTag },
      { friendTag: { $regex: new RegExp(`^${escapedTag}$`, 'i') } },
    ];

    if (mongoose.Types.ObjectId.isValid(trimmedTag)) {
      queryConditions.push({ _id: trimmedTag });
    }

    let targetUser = await User.findOne({ $or: queryConditions });

    // Fallback: search all users to match generated tag or ID if tag was not yet stored in DB
    if (!targetUser) {
      const allUsers = await User.find({}).select('name email friendTag _id');
      for (const u of allUsers) {
        const uIdStr = u._id.toString();
        const shortId = uIdStr.slice(-4).toUpperCase();
        const cleanName = (u.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
        const genTag = u.friendTag || `${cleanName}#${shortId}`;

        if (
          genTag.toLowerCase() === lowerTag ||
          uIdStr.toLowerCase() === lowerTag ||
          u.email.toLowerCase() === lowerTag
        ) {
          targetUser = await User.findById(u._id);
          if (targetUser && !targetUser.friendTag) {
            targetUser.friendTag = genTag;
            await targetUser.save();
          }
          break;
        }
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: `No user found matching Tag or Email "${targetTag}".` },
        { status: 404 }
      );
    }

    if (targetUser._id.toString() === sender._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'You cannot send a friend request to yourself.' },
        { status: 400 }
      );
    }

    // Check if already friends
    if (sender.friends?.includes(targetUser._id.toString())) {
      return NextResponse.json(
        { success: false, error: `You are already friends with ${targetUser.name}.` },
        { status: 400 }
      );
    }

    // Check if request already pending
    const existingReq = targetUser.friendRequests?.find(
      (r: any) => r.senderId === sender._id.toString()
    );
    if (existingReq) {
      return NextResponse.json(
        { success: false, error: `Friend request already pending for ${targetUser.name}.` },
        { status: 400 }
      );
    }

    // Add friend request to target user
    const newRequest = {
      senderId: sender._id.toString(),
      senderName: sender.name,
      senderEmail: sender.email,
      senderAvatar: sender.avatar,
      senderTag: sender.friendTag,
      sentAt: new Date().toISOString(),
    };

    targetUser.friendRequests = [newRequest, ...(targetUser.friendRequests || [])];
    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: `Friend request sent to ${targetUser.name}!`,
    });
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
