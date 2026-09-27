import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || '';

if (!MONGODB_URI) {
  console.warn('DATABASE_URL environment variable is not defined.');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) return null;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('MongoDB connected successfully to Cinetrack Cluster');
      return m;
    }).catch((err) => {
      console.error('MongoDB connection failure:', err);
      return null;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
