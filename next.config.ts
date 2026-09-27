import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: 'image.tmdb.org' },
      { hostname: 'images.unsplash.com' },
    ],
  },
  // @ts-ignore
  allowedDevOrigins: ['eb599551a04cf1.lhr.life'],
};

export default nextConfig;