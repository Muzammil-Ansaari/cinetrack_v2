import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Watchlist } from '@/models/Schemas';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.nextUrl.searchParams.get('userId') || 'guest-101';
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId = 'guest-101', media } = body;

    if (!media || !media.internalId) {
      return NextResponse.json({ success: false, error: 'Invalid media payload' }, { status: 400 });
    }

    const existing = await Watchlist.findOne({ userId, mediaId: media.internalId });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const newItem = await Watchlist.create({
      userId,
      mediaId: media.internalId,
      title: media.title,
      type: media.type,
      poster: media.poster,
      backdrop: media.backdrop,
      rating: media.rating,
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { mediaId, userId = 'guest-101' } = await req.json();

    await Watchlist.deleteOne({ userId, mediaId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
