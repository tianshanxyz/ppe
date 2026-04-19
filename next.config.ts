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

  // HTTP 头配置 - 安全性增强
  async headers() {
    return [
      {
        // 全局安全头
        source: '/:path*',
        headers: [
          // 传输安全
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // 防止 MIME 类型嗅探
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 防止点击劫持
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS 防护
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer 策略
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 权限策略
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          // 内容安全策略 - 严格模式
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 脚本：仅允许来自自身的脚本，使用 nonce 支持内联脚本
              "script-src 'self' https://*.sentry.io https://*.volces.com",
              // 样式：仅允许来自自身的样式
              "style-src 'self' https://*.volces.com",
              // 图片：允许来自自身、data URI、HTTPS 和 blob 的图片
              "img-src 'self' data: https: blob: https://*.supabase.co",
              // 字体：允许来自自身和 data URI 的字体
              "font-src 'self' data:",
              // 连接：限制允许的 API 端点
              "connect-src 'self' https://*.sentry.io https://*.supabase.co https://*.vercel.app https://*.volces.com https://api.medplum.com",
              // 框架：禁止嵌入框架
              "frame-src 'none'",
              "frame-ancestors 'none'",
              // 基础 URI：禁止修改 base 标签
              "base-uri 'self'",
              // 表单提交：仅允许提交到自身
              "form-action 'self'",
              // 对象：禁止插件
              "object-src 'none'",
              // 自动升级不安全请求
              "upgrade-insecure-requests",
              // 报告 URI（可选）
              "report-uri https://sentry.io/api/security-report/",
            ].join('; '),
          },
          // DNS 预取控制
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // 跨域嵌入策略
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // API 端点特殊头
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
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
      {
        // HTML 文件不缓存
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
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
