"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Server, ExternalLink } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getEmbedUrl } from "@/lib/tmdb";

export default function VideoPlayerModal() {
  const { activeVideo, closePlayer, updatePlaybackProgress, getProgress } =
    useApp();
  const [selectedServer, setSelectedServer] = useState<
    "cinemaos" | "vidsrc" | "vidlink" | "vidsrcme" | "embedcc"
  >("cinemaos");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const media = activeVideo?.media;
  const episode = activeVideo?.episode;

  // Freeze initialStartTime on mount so iframe URL stays 100% stable without reloading
  const [initialStartTime] = useState<number>(() => {
    if (!media) return 0;
    const saved = getProgress(media.internalId);
    return saved?.currentTime || 0;
  });

  const currentWatchTimeRef = useRef<number>(initialStartTime);

  // Helper to send CinemaOS postMessage commands
  const sendPlayerCommand = (
    command: string,
    params: Record<string, any> = {},
  ) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ command, ...params }, "*");
    }
  };

  // Dispatch seek command when iframe loads
  const handleIframeLoad = () => {
    if (initialStartTime > 0) {
      const seekTime = Math.floor(initialStartTime);
      setTimeout(() => sendPlayerCommand("seek", { time: seekTime }), 500);
      setTimeout(() => sendPlayerCommand("seek", { time: seekTime }), 1200);
    }
  };

  // Track playback time silently without triggering re-renders that refresh the iframe
  useEffect(() => {
    if (!media) return;

    currentWatchTimeRef.current = initialStartTime;

    // Increment watch position every 1 second in memory
    const timer = setInterval(() => {
      currentWatchTimeRef.current += 1;
    }, 1000);

    return () => {
      clearInterval(timer);
      // Save final playback position into AppContext and localStorage upon close
      if (media && currentWatchTimeRef.current > 0) {
        updatePlaybackProgress(
          media,
          currentWatchTimeRef.current,
          7200,
          episode,
        );
      }
    };
  }, [media?.internalId]);

  // Listen for player postMessage events if player emits time updates
  useEffect(() => {
    if (!media) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data) return;

        const time = Number(data.currentTime || data.time || data.seconds) || 0;
        if (time > 0) {
          currentWatchTimeRef.current = Math.floor(time);
        }
      } catch (err) {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [media]);

  const handleClose = () => {
    if (media && currentWatchTimeRef.current > 0) {
      updatePlaybackProgress(media, currentWatchTimeRef.current, 7200, episode);
    }
    closePlayer();
  };

  if (!activeVideo || !media) return null;

  const tmdbId =
    media.tmdbId ||
    Number(String(media.internalId).replace(/^(movie|tv)-/, "")) ||
    media.internalId;
  const s = episode?.seasonNumber || 1;
  const ep = episode?.episodeNumber || 1;

  // Build stream URL according to selected server
  const getStreamSrc = () => {
    if (selectedServer === "vidsrc") {
      return media.type === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${ep}`;
    }

    if (selectedServer === "vidlink") {
      const startParam =
        initialStartTime > 0
          ? `?start_time=${Math.floor(initialStartTime)}`
          : "";
      return media.type === "movie"
        ? `https://vidlink.pro/movie/${tmdbId}${startParam}`
        : `https://vidlink.pro/tv/${tmdbId}/${s}/${ep}${startParam}`;
    }

    if (selectedServer === "vidsrcme") {
      return media.type === "movie"
        ? `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`
        : `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${ep}`;
    }

    if (selectedServer === "embedcc") {
      return media.type === "movie"
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${ep}`;
    }

    // Default: CinemaOS Player
    return getEmbedUrl(media, episode, initialStartTime);
  };

  const iframeSrc = getStreamSrc();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
      {/* Top Floating Control Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="uppercase text-[10px] font-extrabold px-2.5 py-1 rounded bg-red-600 text-white shadow-lg shadow-red-600/30">
            {media.type === "tv" ? "TV Series" : "Movie"}
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white tracking-tight line-clamp-1">
              {media.title}
            </h3>
            {episode && (
              <p className="text-xs text-amber-400 font-medium">
                Season {episode.seasonNumber} • Episode {episode.episodeNumber}:{" "}
                {episode.title}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls: Server Switcher & Close Button */}
        <div className="flex items-center gap-3">
          {/* Server Switcher Dropdown */}
          <div className="relative flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
            <Server className="w-4 h-4 text-red-500" />
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
            >
              <option value="cinemaos" className="bg-slate-900 text-white">
                CinemaOS Player (Default)
              </option>
              <option value="vidsrc" className="bg-slate-900 text-white">
                Server 2 (VidSrc Pro)
              </option>
              <option value="vidlink" className="bg-slate-900 text-white">
                Server 3 (VidLink HD)
              </option>
              <option value="vidsrcme" className="bg-slate-900 text-white">
                Server 4 (VidSrc.me)
              </option>
              <option value="embedcc" className="bg-slate-900 text-white">
                Server 5 (2Embed)
              </option>
            </select>
          </div>

          {/* Open Direct External Link */}
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-full backdrop-blur-md transition-colors hidden sm:flex"
            title="Open stream in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close Modal Button */}
          <button
            onClick={handleClose}
            className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-600/30 transition-all hover:scale-105"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Iframe Video Container */}
      <div className="relative w-full h-full bg-black">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          onLoad={handleIframeLoad}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          className="w-full h-full border-0 absolute inset-0"
        />
      </div>
    </div>
  );
}
