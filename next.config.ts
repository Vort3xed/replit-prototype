import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin', // Adjust as needed
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp', // Adjust as needed
          },
        ],
      },
    ];
  },
};

export default nextConfig;
