import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WebSocket configuration for remote development
  webSocketServer: {
    options: {
      path: '/_next/webpack-hmr',
    },
  },
  
  // Allow external IP access
  devIndicators: {
    buildActivityPosition: 'bottom-right',
  },
  
  // Ensure proper host binding
  experimental: {
    serverActions: {
      allowedOrigins: ['3.109.164.76:3000', 'localhost:3000'],
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
