import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Базовая конфигурация для Vercel
  output: 'export',
  trailingSlash: true,
  
  // Отключаем оптимизации которые могут вызывать ошибки
  images: {
    unoptimized: true,
  },

  // Отключаем проблемные экспериментальные функции
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
