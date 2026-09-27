/**
 * CineTrack v1 to v2 Data Import Script
 * 
 * Usage:
 *   node scripts/import-v1-data.mjs path/to/v1-data.json
 * 
 * Example JSON format:
 * {
 *   "userEmail": "user@example.com", // Optional, target user email
 *   "watched": [
 *     { "title": "Inception", "year": 2010, "rating": 8.8, "type": "movie" }
 *   ],
 *   "unwatched": [
 *     { "title": "The Dark Knight", "year": 2008, "rating": 9.0, "type": "movie" }
 *   ],
 *   "upcoming": [
 *     { "title": "Avatar 3", "releaseDate": "2025-12-19", "type": "movie" }
 *   ]
 * }
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinetrack';

const UserSchema = new mongoose.Schema({
  email: String,
  watchlist: Array,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function runImport() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('❌ Please specify a JSON data file to import.');
    console.log('Usage: node scripts/import-v1-data.mjs path/to/v1-data.json');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const targetEmail = (data.userEmail || data.email || '').toLowerCase();
  
  let targetUser;
  if (targetEmail) {
    targetUser = await User.findOne({ email: targetEmail });
  }

  if (!targetUser) {
    targetUser = await User.findOne({});
    if (!targetUser) {
      console.error('❌ No user found in database to attach watchlist items to.');
      process.exit(1);
    }
  }

  console.log(`👤 Target user found: ${targetUser.email || targetUser._id}`);

  const now = new Date().toISOString();
  const formatMedia = (item, isUpcoming = false) => ({
    internalId: item.internalId || item.id || `v1-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tmdbId: Number(item.tmdbId || item.id || 0),
    title: item.title || item.name || 'Untitled',
    description: item.description || item.overview || 'Imported from CineTrack v1',
    poster: item.poster || item.posterPath || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    backdrop: item.backdrop || item.backdropPath || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    releaseDate: item.releaseDate || item.release_date || '2026-01-01',
    releaseYear: Number(item.releaseYear || item.year || 2026),
    genres: Array.isArray(item.genres) ? item.genres : ['Action'],
    type: item.type === 'tv' ? 'tv' : 'movie',
    rating: Number(item.rating || 8.0),
    isUpcoming: Boolean(item.isUpcoming || isUpcoming),
    streamUrl: item.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  });

  const newWatchlistItems = [];

  // Watched
  (data.watched || []).forEach((item) => {
    const media = formatMedia(item, false);
    newWatchlistItems.push({
      id: media.internalId,
      media,
      addedAt: item.addedAt || now,
      isWatched: true,
      watchedAt: item.watchedAt || now,
    });
  });

  // Unwatched
  (data.unwatched || []).forEach((item) => {
    const media = formatMedia(item, false);
    newWatchlistItems.push({
      id: media.internalId,
      media,
      addedAt: item.addedAt || now,
      isWatched: false,
    });
  });

  // Upcoming
  (data.upcoming || []).forEach((item) => {
    const media = formatMedia(item, true);
    newWatchlistItems.push({
      id: media.internalId,
      media,
      addedAt: item.addedAt || now,
      isWatched: false,
    });
  });

  const existingList = targetUser.watchlist || [];
  const existingMap = new Map(existingList.map((i) => [i.id, i]));

  newWatchlistItems.forEach((i) => existingMap.set(i.id, i));

  targetUser.watchlist = Array.from(existingMap.values());
  await targetUser.save();

  console.log(`🎉 Successfully imported ${newWatchlistItems.length} titles into ${targetUser.email}'s watchlist!`);
  console.log(`📊 Total watchlist size now: ${targetUser.watchlist.length} items.`);

  await mongoose.disconnect();
}

runImport().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
