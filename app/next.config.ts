import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external IP access
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Ensure proper host binding
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  
  // Configure webpack for HMR
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
