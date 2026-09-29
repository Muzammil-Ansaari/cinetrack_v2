import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserWatchItem {
  id: string;
  media: any;
  addedAt: string;
}

export interface IUserPlaybackProgress {
  mediaId: string;
  title: string;
  poster: string;
  backdrop?: string;
  type: 'movie' | 'tv';
  currentTime: number;
  duration: number;
  lastWatched: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  genres?: string[];
  releaseYear?: number;
}

export interface IFriendRequest {
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  senderTag: string;
  sentAt: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  isAdmin?: boolean;
  friendTag?: string;
  tagLastChangedAt?: Date | null;
  friends: string[];
  friendRequests: IFriendRequest[];
  watchlist: IUserWatchItem[];
  history: IUserPlaybackProgress[];
  isVerified: boolean;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    friendTag: {
      type: String,
      sparse: true,
      unique: true,
    },
    tagLastChangedAt: {
      type: Date,
      default: null,
    },
    friends: {
      type: Array,
      default: [],
    },
    friendRequests: {
      type: Array,
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    watchlist: {
      type: Array,
      default: [],
    },
    history: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure User model compiles with latest schema fields in Next.js development
delete (mongoose.models as any).User;
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
