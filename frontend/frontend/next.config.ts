import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xvvqfwoajvgpedkbxldd.supabase.co',
      },
    ],
  },
};

export default nextConfig;
