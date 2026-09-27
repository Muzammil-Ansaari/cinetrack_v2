import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { History } from '@/models/Schemas';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.nextUrl.searchParams.get('userId') || 'guest-101';
    const history = await History.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId = 'guest-101', mediaId, title, type, poster, backdrop, currentTime, duration, seasonNumber, episodeNumber, episodeTitle } = body;

    if (!mediaId || currentTime === undefined) {
      return NextResponse.json({ success: false, error: 'Invalid history payload' }, { status: 400 });
    }

    const updated = await History.findOneAndUpdate(
      { userId, mediaId },
      {
        title,
        type,
        poster,
        backdrop,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration || 0),
        seasonNumber,
        episodeNumber,
        episodeTitle,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
