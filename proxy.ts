/**
 * Vercel 代理配置 - 简化版本
 * 
 * 用于配置生产环境的安全头和代理规则
 */

export const config = {
  // 匹配所有路由
  matcher: '/:path*',
};

export default function middleware() {
  // 中间件逻辑已移至 next.config.ts
}
