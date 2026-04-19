import React, { lazy, ComponentType, createElement } from 'react';

/**
 * 性能优化工具类
 */
export class PerformanceOptimizer {
  /**
   * 创建懒加载组件
   */
  static createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback: React.ReactNode = null
  ): React.FC<React.ComponentProps<T>> {
    const LazyComponent = lazy(importFn);
    
    return function LazyComponentWrapper(props: React.ComponentProps<T>) {
      return createElement(
        React.Suspense,
        { fallback },
        createElement(LazyComponent, props)
      );
    };
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * 内存缓存
   */
  static createCache<T>() {
    const cache = new Map<string, { data: T; timestamp: number }>();
    const DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

    return {
      set: (key: string, data: T, ttl: number = DEFAULT_TTL) => {
        cache.set(key, {
          data,
          timestamp: Date.now() + ttl
        });
      },

      get: (key: string): T | null => {
        const item = cache.get(key);
        
        if (!item) {
          return null;
        }

        if (Date.now() > item.timestamp) {
          cache.delete(key);
          return null;
        }

        return item.data;
      },

      delete: (key: string) => {
        cache.delete(key);
      },

      clear: () => {
        cache.clear();
      },

      size: () => {
        return cache.size;
      }
    };
  }

  /**
   * 图片懒加载
   */
  static lazyLoadImage(
    img: HTMLImageElement,
    src: string,
    placeholder?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (placeholder) {
        img.src = placeholder;
      }

      const image = new Image();
      
      image.onload = () => {
        img.src = src;
        resolve();
      };

      image.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      image.src = src;
    });
  }

  /**
   * 虚拟滚动优化
   */
  static virtualScrollConfig = {
    itemHeight: 50,
    overscan: 5,
    containerHeight: 400
  };

  /**
   * 计算虚拟滚动可见项
   */
  static calculateVisibleItems(
    scrollTop: number,
    totalItems: number,
    containerHeight: number = this.virtualScrollConfig.containerHeight,
    itemHeight: number = this.virtualScrollConfig.itemHeight,
    overscan: number = this.virtualScrollConfig.overscan
  ) {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    
    const visibleItemCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(totalItems, startIndex + visibleItemCount);

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex
    };
  }

  /**
   * 性能监控
   */
  static performanceMonitor = {
    startTime: 0,
    
    start: () => {
      this.performanceMonitor.startTime = performance.now();
    },
    
    end: (label: string) => {
      const endTime = performance.now();
      const duration = endTime - this.performanceMonitor.startTime;
      
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      
      // 可以发送到监控服务
      if (duration > 100) {
        console.warn(`⚠️ 性能警告: ${label} 耗时过长`);
      }
    }
  };

  /**
   * 批量更新优化
   */
  static batchUpdates = {
    pendingUpdates: new Set<() => void>(),
    isBatching: false,
    
    schedule: (update: () => void) => {
      this.batchUpdates.pendingUpdates.add(update);
      
      if (!this.batchUpdates.isBatching) {
        this.batchUpdates.isBatching = true;
        
        requestAnimationFrame(() => {
          this.batchUpdates.pendingUpdates.forEach(update => update());
          this.batchUpdates.pendingUpdates.clear();
          this.batchUpdates.isBatching = false;
        });
      }
    }
  };
}

/**
 * 预加载工具
 */
export class PreloadManager {
  private static preloadedResources = new Set<string>();

  /**
   * 预加载组件
   */
  static preloadComponent(importFn: () => Promise<any>) {
    const key = importFn.toString();
    
    if (!this.preloadedResources.has(key)) {
      this.preloadedResources.add(key);
      importFn();
    }
  }

  /**
   * 预加载路由
   */
  static preloadRoute(route: string) {
    // 在 Next.js 中预加载路由
    if (typeof window !== 'undefined') {
      // 这里可以集成 Next.js 的路由预加载
      console.log(`预加载路由: ${route}`);
    }
  }

  /**
   * 预加载图片
   */
  static preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };

      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };

      img.src = src;
    });
  }
}

/**
 * 代码分割配置
 */
export const codeSplittingConfig = {
  // 路由级别的代码分割
  routes: {
    dashboard: () => import('@/app/dashboard/page'),
    search: () => import('@/app/search/page'),
    regulations: () => import('@/app/regulations/page'),
    companies: () => import('@/app/companies/page'),
    products: () => import('@/app/products/page'),
    reports: () => import('@/app/reports/page')
  },

  // 组件级别的代码分割
  components: {
    // 添加实际存在的组件
  },

  // 第三方库的代码分割
  libraries: {
    pdf: () => import('@react-pdf/renderer'),
    charts: () => import('recharts')
  }
};

export default PerformanceOptimizer;