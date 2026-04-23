import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 生产环境配置
  productionBrowserSourceMaps: false,

  // 实验性功能
  experimental: {
    // 优化包体积
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
  
  // 输出配置
  output: 'standalone',

  // 重写规则
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },

  // 重定向规则
  async redirects() {
    return [
      {
        source: '/old-search',
        destination: '/search',
        permanent: true,
      },
    ];
  },

  // HTTP 头配置 - 最简化版本
  async headers() {
    return [
      {
        // 全局安全头 - 最简化
        source: '/:path*',
        headers: [
          // 防止 MIME 类型嗅探
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer 策略
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // 静态资源缓存头
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Turbopack 配置（Next.js 16+）
  turbopack: {},

  // Webpack 配置优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },

  // 日志配置
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
