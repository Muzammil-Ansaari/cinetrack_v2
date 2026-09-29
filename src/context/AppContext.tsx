'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MediaItem, WatchItem, PlaybackProgress, UserProfile, HomepageSectionConfig, Episode } from '@/types/cinetrack';
import { getTrendingToday, getFeaturedHeroItems, MOCK_MEDIA_ITEMS } from '@/lib/tmdb';
import { useToast } from '@/context/ToastContext';

interface AppContextType {
  // Watchlist
  watchlist: WatchItem[];
  addToWatchlist: (item: MediaItem, asWatched?: boolean) => void;
  removeFromWatchlist: (internalId: string) => void;
  isInWatchlist: (internalId: string) => boolean;
  isWatched: (internalId: string) => boolean;
  markAsWatched: (internalId: string) => void;
  markAsUnwatched: (internalId: string) => void;
  toggleWatchedStatus: (internalId: string) => void;

  // Continue Watching / Progress
  history: PlaybackProgress[];
  updatePlaybackProgress: (
    media: MediaItem,
    currentTime: number,
    duration: number,
    episode?: Episode
  ) => void;
  getProgress: (mediaId: string) => PlaybackProgress | undefined;
  removeFromHistory: (mediaId: string) => void;

  // Video Player Modal
  activeVideo: {
    media: MediaItem;
    episode?: Episode;
    streamUrl: string;
  } | null;
  playMedia: (media: MediaItem, episode?: Episode) => void;
  closePlayer: () => void;

  // Global Search Modal
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // Auth & Profile
  user: UserProfile | null;
  authLoading: boolean;
  login: (userData: UserProfile, token?: string) => void;
  logout: () => void;
  updateUserFriendTag: (newTag: string, tagLastChangedAt?: string | Date) => void;
  updateUserAvatar: (newAvatarUrl: string) => Promise<boolean>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Admin CMS
  featuredItems: MediaItem[];
  setFeaturedHeroItems: (items: MediaItem[]) => void;
  sectionsConfig: HomepageSectionConfig[];
  updateSectionsConfig: (configs: HomepageSectionConfig[]) => void;
  catalog: MediaItem[];
  addMediaToCatalog: (item: MediaItem) => void;
  deleteMediaFromCatalog: (internalId: string) => void;
  toggleFeaturedInCatalog: (internalId: string) => void;
  loading: boolean;
}

const DEFAULT_SECTIONS: HomepageSectionConfig[] = [
  { id: 'hero', title: 'Featured Slider', type: 'hero', enabled: true, order: 1 },
  { id: 'continue_watching', title: 'Continue Watching', type: 'continue_watching', enabled: true, order: 2 },
  { id: 'top10', title: 'Top 10 New Releases', type: 'top10', enabled: true, order: 3 },
  { id: 'trending_today', title: 'Trending Today', type: 'trending_today', enabled: true, order: 4 },
  { id: 'trending_week', title: 'Trending This Week', type: 'trending_week', enabled: true, order: 5 },
  { id: 'upcoming', title: 'Upcoming Movies & Shows', type: 'upcoming', enabled: true, order: 6 },
  { id: 'action', title: 'Popular Action', type: 'genre', genreFilter: 'Action', enabled: true, order: 7 },
  { id: 'scifi', title: 'Popular Sci-Fi', type: 'genre', genreFilter: 'Sci-Fi', enabled: true, order: 8 },
  { id: 'drama', title: 'Popular Drama', type: 'genre', genreFilter: 'Drama', enabled: true, order: 9 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  // Catalog State
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  // Continue Watching History
  const [history, setHistory] = useState<PlaybackProgress[]>([]);

  // Video Player Modal State
  const [activeVideo, setActiveVideo] = useState<{
    media: MediaItem;
    episode?: Episode;
    streamUrl: string;
  } | null>(null);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Auth Modal & User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Admin Config State
  const [sectionsConfig, setSectionsConfig] = useState<HomepageSectionConfig[]>(DEFAULT_SECTIONS);

  // Helper to sync user watchlist & history with MongoDB
  const syncToMongoDB = async (updatedWatchlist: WatchItem[], updatedHistory: PlaybackProgress[]) => {
    try {
      const token = localStorage.getItem('cinetrack_token');
      if (!token) return;

      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          watchlist: updatedWatchlist,
          history: updatedHistory,
        }),
      });
    } catch (err) {
      console.error('Failed syncing user data to MongoDB:', err);
    }
  };

  // Fetch Live TMDB Catalog & Hero Items on Mount
  useEffect(() => {
    async function initTMDBData() {
      try {
        setLoading(true);
        const [heroData, trendingData] = await Promise.all([
          getFeaturedHeroItems(),
          getTrendingToday(),
        ]);

        if (heroData && heroData.length > 0) {
          setFeaturedItems(heroData);
        }

        if (trendingData && trendingData.length > 0) {
          setCatalog(trendingData);
        } else {
          setCatalog(MOCK_MEDIA_ITEMS);
        }
      } catch (err) {
        console.error('Error fetching live TMDB catalog:', err);
        setCatalog(MOCK_MEDIA_ITEMS);
      } finally {
        setLoading(false);
      }
    }

    initTMDBData();
  }, []);

  // Sync initial localStorage and restore MongoDB user session on Mount
  useEffect(() => {
    async function restoreUserSession() {
      try {
        // 1. Immediately restore cached user & lists from localStorage on client mount
        const savedUser = localStorage.getItem('cinetrack_user');
        if (savedUser) setUser(JSON.parse(savedUser));

        const savedWatchlist = localStorage.getItem('cinetrack_watchlist');
        if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));

        const savedHistory = localStorage.getItem('cinetrack_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));

        const savedSections = localStorage.getItem('cinetrack_sections');
        if (savedSections) setSectionsConfig(JSON.parse(savedSections));

        // Immediately mark auth state as resolved from local storage
        setAuthLoading(false);

        // 2. Perform background session validation and sync with MongoDB
        const token = localStorage.getItem('cinetrack_token');
        if (token) {
          const res = await fetch('/api/user/sync', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data.user) {
            setUser(data.user);
            localStorage.setItem('cinetrack_user', JSON.stringify(data.user));
            if (data.user.watchlist) {
              setWatchlist(data.user.watchlist);
              localStorage.setItem('cinetrack_watchlist', JSON.stringify(data.user.watchlist));
            }
            if (data.user.history) {
              setHistory(data.user.history);
              localStorage.setItem('cinetrack_history', JSON.stringify(data.user.history));
            }
          } else {
            localStorage.removeItem('cinetrack_token');
            localStorage.removeItem('cinetrack_user');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed restoring user session from MongoDB:', err);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreUserSession();
  }, []);

  // Watchlist Methods
  const addToWatchlist = (item: MediaItem, asWatched = false) => {
    let wasAlreadyIn = false;
    let switchedToUnwatched = false;

    setWatchlist((prev) => {
      const existing = prev.find((w) => w.id === item.internalId);
      if (existing) {
        wasAlreadyIn = true;
        if (asWatched && !existing.isWatched) {
          const updated = prev.map((w) =>
            w.id === item.internalId
              ? { ...w, isWatched: true, watchedAt: new Date().toISOString() }
              : w
          );
          localStorage.setItem('cinetrack_watchlist', JSON.stringify(updated));
          syncToMongoDB(updated, history);
          return updated;
        }

        if (!asWatched && existing.isWatched) {
          switchedToUnwatched = true;
          const updated = prev.map((w) =>
            w.id === item.internalId
              ? { ...w, isWatched: false, watchedAt: undefined }
              : w
          );
          localStorage.setItem('cinetrack_watchlist', JSON.stringify(updated));
          syncToMongoDB(updated, history);
          return updated;
        }

        return prev;
      }

      const newItem: WatchItem = {
        id: item.internalId,
        media: item,
        addedAt: new Date().toISOString(),
        isWatched: asWatched,
        watchedAt: asWatched ? new Date().toISOString() : undefined,
      };

      const updated = [newItem, ...prev];
      localStorage.setItem('cinetrack_watchlist', JSON.stringify(updated));
      syncToMongoDB(updated, history);
      return updated;
    });

    if (wasAlreadyIn) {
      if (asWatched) {
        showToast(`Marked "${item.title}" as Watched`, 'success', 'Watched List');
      } else if (switchedToUnwatched) {
        showToast(`Moved "${item.title}" to Unwatched Watchlist`, 'info', 'Unwatched List');
      }
    } else {
      if (asWatched) {
        showToast(`Added "${item.title}" directly to Watched List`, 'success', 'Watched List');
      } else {
        showToast(`Added "${item.title}" to Watchlist`, 'success', 'Watchlist');
      }
    }
  };

  const removeFromWatchlist = (internalId: string) => {
    const itemToRemove = watchlist.find((w) => w.id === internalId);

    setWatchlist((prev) => {
      const updated = prev.filter((w) => w.id !== internalId);
      localStorage.setItem('cinetrack_watchlist', JSON.stringify(updated));
      syncToMongoDB(updated, history);
      return updated;
    });

    if (itemToRemove) {
      showToast(`Removed "${itemToRemove.media.title}" from Watchlist`, 'info', 'Watchlist');
    }
  };

  const isInWatchlist = (internalId: string) => {
    return watchlist.some((w) => w.id === internalId);
  };

  const isWatched = (internalId: string) => {
    return watchlist.some((w) => w.id === internalId && w.isWatched);
  };

  const markAsWatched = (internalId: string) => {
    const item = watchlist.find((w) => w.id === internalId);

    setWatchlist((prev) => {
      const updated = prev.map((w) =>
        w.id === internalId
          ? { ...w, isWatched: true, watchedAt: new Date().toISOString() }
          : w
      );
      localStorage.setItem('cinetrack_watchlist', JSON.stringify(updated));
      syncToMongoDB(updated, history);
      return updated;
    });

    if (item) {
      showToast(`Marked "${item.media.title}" as Watched`, 'success', 'Watched List');
    }
  };

  const markAsUnwatched = (internalId: string) => {
    const item = watchlist.find((w) => w.id === internalId);

    setWatchlist((prev) => {
      const updated = prev.map((w) =>
        w.id === internalId
          ? { ...w, isWatched: false, watchedAt: undefined }
          : w
      );
      localStorage.setItem('cinetrack_watchlist', JSON.stringify(updated));
      syncToMongoDB(updated, history);
      return updated;
    });

    if (item) {
      showToast(`Moved "${item.media.title}" to Unwatched`, 'info', 'Unwatched List');
    }
  };

  const toggleWatchedStatus = (internalId: string) => {
    const item = watchlist.find((w) => w.id === internalId);
    if (!item) return;
    if (item.isWatched) {
      markAsUnwatched(internalId);
    } else {
      markAsWatched(internalId);
    }
  };

  // Auto-detect newly released upcoming titles in watchlist
  useEffect(() => {
    if (watchlist.length === 0) return;

    const notifiedKey = 'cinetrack_notified_releases';
    const notifiedIds: string[] = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
    const newNotifiedIds = [...notifiedIds];

    const todayStr = new Date().toISOString().split('T')[0];

    watchlist.forEach((w) => {
      const releaseDate = w.media.releaseDate;
      if (!releaseDate) return;

      const isNowReleased = releaseDate <= todayStr;
      
      if (isNowReleased && !notifiedIds.includes(w.id)) {
        const addedDateStr = w.addedAt ? w.addedAt.split('T')[0] : '';
        if (releaseDate > addedDateStr || w.media.isUpcoming) {
          showToast(
            `🎬 "${w.media.title}" has just been released! Moved to your Unwatched list.`,
            'info',
            'Movie Released!'
          );
          newNotifiedIds.push(w.id);
        }
      }
    });

    if (newNotifiedIds.length > notifiedIds.length) {
      localStorage.setItem(notifiedKey, JSON.stringify(newNotifiedIds));
    }
  }, [watchlist, showToast]);

  // Playback Progress Methods
  const updatePlaybackProgress = (
    media: MediaItem,
    currentTime: number,
    duration: number,
    episode?: Episode
  ) => {
    setHistory((prev) => {
      const existingIdx = prev.findIndex((h) => h.mediaId === media.internalId);
      const newEntry: PlaybackProgress = {
        mediaId: media.internalId,
        title: media.title,
        poster: media.poster,
        backdrop: media.backdrop,
        type: media.type,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration || 0),
        lastWatched: new Date().toISOString(),
        seasonNumber: episode?.seasonNumber,
        episodeNumber: episode?.episodeNumber,
        episodeTitle: episode?.title,
        genres: media.genres || [],
        releaseYear: media.releaseYear || 2026,
      };

      let updated: PlaybackProgress[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = newEntry;
      } else {
        updated = [newEntry, ...prev];
      }

      localStorage.setItem('cinetrack_history', JSON.stringify(updated));
      syncToMongoDB(watchlist, updated);
      return updated;
    });
  };

  const getProgress = (mediaId: string) => {
    return history.find((h) => h.mediaId === mediaId);
  };

  const removeFromHistory = (mediaId: string) => {
    setHistory((prev) => {
      const itemToRemove = prev.find((h) => h.mediaId === mediaId);
      const updated = prev.filter((h) => h.mediaId !== mediaId);
      localStorage.setItem('cinetrack_history', JSON.stringify(updated));
      syncToMongoDB(watchlist, updated);
      showToast(`Removed "${itemToRemove?.title || 'Item'}" from Continue Watching`, 'info', 'Continue Watching');
      return updated;
    });
  };

  // Video Player Methods
  const playMedia = (media: MediaItem, episode?: Episode) => {
    const url = episode?.streamUrl || media.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    setActiveVideo({ media, episode, streamUrl: url });
  };

  const closePlayer = () => {
    setActiveVideo(null);
  };

  // Search Methods
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  // Auth Methods
  const login = (userData: UserProfile, token?: string) => {
    setUser(userData);
    localStorage.setItem('cinetrack_user', JSON.stringify(userData));
    if (userData.watchlist) {
      setWatchlist(userData.watchlist);
      localStorage.setItem('cinetrack_watchlist', JSON.stringify(userData.watchlist));
    }
    if (userData.history) {
      setHistory(userData.history);
      localStorage.setItem('cinetrack_history', JSON.stringify(userData.history));
    }
    if (token) {
      localStorage.setItem('cinetrack_token', token);
    }
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${userData.name}!`, 'success', 'Sign In Successful');
  };

  const logout = () => {
    setUser(null);
    setWatchlist([]);
    setHistory([]);
    localStorage.removeItem('cinetrack_token');
    localStorage.removeItem('cinetrack_user');
    localStorage.removeItem('cinetrack_watchlist');
    localStorage.removeItem('cinetrack_history');
    showToast('You have been logged out', 'info', 'Logged Out');
  };

  const updateUserFriendTag = (newTag: string, tagLastChangedAt?: string | Date) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      friendTag: newTag,
      tagLastChangedAt: tagLastChangedAt || new Date().toISOString(),
    };
    setUser(updatedUser);
    localStorage.setItem('cinetrack_user', JSON.stringify(updatedUser));
  };

  const updateUserAvatar = async (newAvatarUrl: string): Promise<boolean> => {
    if (!user) return false;

    const updatedUser = {
      ...user,
      avatar: newAvatarUrl,
    };

    // Update local state & localStorage immediately
    setUser(updatedUser);
    localStorage.setItem('cinetrack_user', JSON.stringify(updatedUser));

    // Persist to MongoDB if token exists
    try {
      const token = localStorage.getItem('cinetrack_token');
      if (token) {
        const res = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar: newAvatarUrl }),
        });
        if (!res.ok) {
          console.warn('Avatar update endpoint returned non-ok status');
        }
      }
      showToast('Profile picture updated successfully!', 'success', 'Avatar Changed');
      return true;
    } catch (err) {
      console.error('Failed saving avatar to MongoDB:', err);
      showToast('Profile picture updated locally', 'info', 'Avatar Updated');
      return true;
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Admin Methods
  const setFeaturedHeroItems = (items: MediaItem[]) => {
    setFeaturedItems(items);
  };

  const updateSectionsConfig = (configs: HomepageSectionConfig[]) => {
    setSectionsConfig(configs);
    localStorage.setItem('cinetrack_sections', JSON.stringify(configs));
  };

  const addMediaToCatalog = (item: MediaItem) => {
    setCatalog((prev) => [item, ...prev]);
  };

  const deleteMediaFromCatalog = (internalId: string) => {
    setCatalog((prev) => prev.filter((item) => item.internalId !== internalId));
    removeFromWatchlist(internalId);
  };

  const toggleFeaturedInCatalog = (internalId: string) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.internalId === internalId ? { ...item, featured: !item.featured } : item
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        isWatched,
        markAsWatched,
        markAsUnwatched,
        toggleWatchedStatus,
        history,
        updatePlaybackProgress,
        getProgress,
        removeFromHistory,
        activeVideo,
        playMedia,
        closePlayer,
        isSearchOpen,
        openSearch,
        closeSearch,
        user,
        authLoading,
        login,
        logout,
        updateUserFriendTag,
        updateUserAvatar,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        featuredItems,
        setFeaturedHeroItems,
        sectionsConfig,
        updateSectionsConfig,
        catalog,
        addMediaToCatalog,
        deleteMediaFromCatalog,
        toggleFeaturedInCatalog,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
