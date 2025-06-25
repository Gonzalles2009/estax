import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Добавляем заголовки безопасности для исправления script errors
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // CORS заголовки
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          // Безопасность
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
            value: 'origin-when-cross-origin'
          },
          // CSP для разрешения скриптов и стилей
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob:",
              "connect-src 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
