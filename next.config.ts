import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Оптимизация для production
  output: 'standalone',
  
  // Оптимизация изображений
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Сжатие
  compress: true,
  
  // Экспериментальные функции для производительности
  experimental: {
    optimizePackageImports: ['chart.js', 'react-chartjs-2', 'zustand'],
  },

  // Заголовки безопасности
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
