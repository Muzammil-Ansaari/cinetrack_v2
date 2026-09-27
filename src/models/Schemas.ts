import mongoose, { Schema, model, models } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Watchlist Schema
const WatchlistSchema = new Schema({
  userId: { type: String, required: true },
  mediaId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  poster: { type: String },
  backdrop: { type: String },
  rating: { type: Number },
  addedAt: { type: Date, default: Date.now },
});

// Playback History Schema
const HistorySchema = new Schema({
  userId: { type: String, required: true },
  mediaId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  poster: { type: String },
  backdrop: { type: String },
  currentTime: { type: Number, required: true },
  duration: { type: Number, required: true },
  seasonNumber: { type: Number },
  episodeNumber: { type: Number },
  episodeTitle: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

export const User = models.User || model('User', UserSchema);
export const Watchlist = models.Watchlist || model('Watchlist', WatchlistSchema);
export const History = models.History || model('History', HistorySchema);
