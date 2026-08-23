import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'svsffegiwzdlymixtnfo.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'ony.id', 'ony.my.id'] },
  },
  async headers() {
    return [
      {
        // Firebase signInWithPopup requires Cross-Origin-Opener-Policy to be
        // "unsafe-none" on the login page so it can communicate with the Google
        // OAuth popup window. The default Next.js "same-origin" policy blocks it.
        source: '/login',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
      {
        // High-throughput Edge CDN Caching for redirect endpoints
        source: '/c/:code*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=120' },
        ],
      },
    ]
  },
}

export default nextConfig
