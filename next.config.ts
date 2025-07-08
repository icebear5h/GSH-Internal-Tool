import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // allow up to 50 MB bodies
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
