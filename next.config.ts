import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://v3b.fal.media/**')],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
  },
};

export default nextConfig;
