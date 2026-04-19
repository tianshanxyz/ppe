/**
 * Sentry 错误监控配置
 * 
 * 用于 MDLooker 项目的错误追踪和性能监控
 * 文档：https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

// Sentry 配置
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// 初始化配置
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // 环境配置
    environment: process.env.NODE_ENV || 'development',
    
    // 性能监控
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // 采样率 - 生产环境降低采样率以节省配额
    sampleRate: 0.8,
    
    // 是否允许发送用户反馈
    sendDefaultPii: false,
    
    // 集成配置
    integrations: [
      // 浏览器性能监控
      Sentry.browserTracingIntegration?.(),
    ],
    
    // 性能追踪配置
    tracesSampler: (options) => {
      // 对某些交易降低采样率
      if (options.name?.includes('/api/')) {
        return 0.1; // API 端点 10% 采样
      }
      
      // 对某些交易提高采样率
      if (options.name?.includes('/search')) {
        return 0.5; // 搜索页面 50% 采样
      }
      
      // 默认采样率
      return 0.1;
    },
    
    // 事件处理器 - 过滤敏感信息
    beforeSend(event, hint) {
      // 开发环境记录到控制台
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Event]', event);
      }
      
      // 过滤敏感数据
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      
      return event;
    },
    
    // 忽略某些错误
    ignoreErrors: [
      // 浏览器扩展错误
      'top.GLOBALS',
      'canvas.contentDocument',
      
      // 网络错误（已处理）
      'Network request failed',
      
      // 无意义的错误
      'Non-Error promise rejection captured',
    ],
    
    // 允许的主机列表
    allowUrls: [
      /https?:\/\/(www\.)?mdlooker\.com/,
      /https?:\/\/mdlooker\.vercel\.app/,
    ],
  });
}

// 导出 Sentry 实例
export { Sentry };

// 导出常用的错误追踪函数
export const captureException = (error: Error, context?: {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
}) => {
  if (!SENTRY_DSN) {
    console.warn('Sentry not configured, skipping error capture');
    return;
  }
  
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (!SENTRY_DSN) {
    console.warn('Sentry not configured, skipping message capture');
    return;
  }
  
  Sentry.captureMessage(message, level);
};

export const setContext = (name: string, context: Record<string, any>) => {
  if (!SENTRY_DSN) {
    return;
  }
  
  Sentry.setContext(name, context);
};

export const setUser = (user: {
  id?: string;
  username?: string;
  email?: string;
}) => {
  if (!SENTRY_DSN) {
    return;
  }
  
  Sentry.setUser(user);
};
