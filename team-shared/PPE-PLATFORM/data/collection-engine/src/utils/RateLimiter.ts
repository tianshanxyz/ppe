/**
 * 动态速率限制器
 * 根据响应情况动态调整请求频率，避免触发反爬虫机制
 */

export interface RateLimitConfig {
  // 基础配置
  minDelay: number; // 最小延迟（毫秒）
  maxDelay: number; // 最大延迟（毫秒）
  initialDelay: number; // 初始延迟

  // 自适应配置
  adaptiveMode: boolean; // 是否启用自适应模式
  successThreshold: number; // 成功率阈值（低于此值则增加延迟）
  failureThreshold: number; // 失败率阈值（高于此值则大幅增加延迟）

  // 调整步长
  increaseFactor: number; // 延迟增加因子
  decreaseFactor: number; // 延迟减少因子

  // 窗口配置
  windowSize: number; // 统计窗口大小（请求数）
  cooldownPeriod: number; // 冷却期（毫秒）
}

export interface RequestStats {
  timestamp: number;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  errorType?: string;
}

/**
 * 动态速率限制器类
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private currentDelay: number;
  private requestHistory: RequestStats[] = [];
  private lastRequestTime: number = 0;
  private cooldownEndTime: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;

  // 错误类型权重（用于判断是否需要增加延迟）
  private readonly errorWeights: Record<string, number> = {
    'timeout': 1,
    'rate_limit': 3,
    'blocked': 5,
    'captcha': 5,
    'forbidden': 4,
    'server_error': 2,
    'network_error': 1,
    'parse_error': 0,
  };

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      minDelay: 1000,
      maxDelay: 30000,
      initialDelay: 2000,
      adaptiveMode: true,
      successThreshold: 0.8,
      failureThreshold: 0.3,
      increaseFactor: 1.5,
      decreaseFactor: 0.9,
      windowSize: 20,
      cooldownPeriod: 60000,
      ...config,
    };

    this.currentDelay = this.config.initialDelay;
  }

  /**
   * 等待下一次请求
   */
  async wait(): Promise<void> {
    const now = Date.now();

    // 检查是否在冷却期
    if (now < this.cooldownEndTime) {
      const waitTime = this.cooldownEndTime - now;
      console.log(`[RateLimiter] 冷却期中，等待 ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    // 计算需要等待的时间
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.currentDelay - timeSinceLastRequest);

    if (waitTime > 0) {
      // 添加随机抖动（±20%）
      const jitter = waitTime * (0.8 + Math.random() * 0.4);
      console.log(`[RateLimiter] 等待 ${Math.round(jitter)}ms (当前延迟: ${Math.round(this.currentDelay)}ms)`);
      await this.sleep(jitter);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * 记录请求结果
   */
  recordResult(stats: RequestStats): void {
    this.requestHistory.push(stats);

    // 保持窗口大小
    if (this.requestHistory.length > this.config.windowSize) {
      this.requestHistory.shift();
    }

    if (stats.success) {
      this.consecutiveSuccesses++;
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;

      // 根据错误类型调整延迟
      const errorWeight = this.errorWeights[stats.errorType || ''] || 1;
      this.increaseDelay(errorWeight);

      // 检查是否需要进入冷却期
      if (this.consecutiveFailures >= 5) {
        this.enterCooldown();
      }
    }

    // 自适应调整
    if (this.config.adaptiveMode && this.requestHistory.length >= 10) {
      this.adaptiveAdjust();
    }
  }

  /**
   * 自适应调整延迟
   */
  private adaptiveAdjust(): void {
    const window = this.requestHistory.slice(-this.config.windowSize);
    const successCount = window.filter((r) => r.success).length;
    const successRate = successCount / window.length;

    const avgResponseTime = window.reduce((sum, r) => sum + r.responseTime, 0) / window.length;

    console.log(`[RateLimiter] 统计窗口: 成功率=${(successRate * 100).toFixed(1)}%, 平均响应=${Math.round(avgResponseTime)}ms`);

    if (successRate < this.config.failureThreshold) {
      // 失败率过高，大幅增加延迟
      this.increaseDelay(2);
      console.log(`[RateLimiter] 失败率过高，增加延迟至 ${Math.round(this.currentDelay)}ms`);
    } else if (successRate < this.config.successThreshold) {
      // 成功率略低，适度增加延迟
      this.increaseDelay(1);
      console.log(`[RateLimiter] 成功率偏低，增加延迟至 ${Math.round(this.currentDelay)}ms`);
    } else if (successRate > 0.95 && this.consecutiveSuccesses >= 5) {
      // 成功率很高且连续成功，尝试减少延迟
      this.decreaseDelay();
      console.log(`[RateLimiter] 成功率优秀，减少延迟至 ${Math.round(this.currentDelay)}ms`);
    }

    // 根据响应时间微调
    if (avgResponseTime > 5000) {
      // 响应慢，可能服务器压力大，增加延迟
      this.increaseDelay(0.5);
    }
  }

  /**
   * 增加延迟
   */
  private increaseDelay(factor: number = 1): void {
    const adjustedFactor = Math.pow(this.config.increaseFactor, factor);
    this.currentDelay = Math.min(
      this.currentDelay * adjustedFactor,
      this.config.maxDelay
    );
  }

  /**
   * 减少延迟
   */
  private decreaseDelay(): void {
    this.currentDelay = Math.max(
      this.currentDelay * this.config.decreaseFactor,
      this.config.minDelay
    );
  }

  /**
   * 进入冷却期
   */
  private enterCooldown(): void {
    this.cooldownEndTime = Date.now() + this.config.cooldownPeriod;
    this.currentDelay = this.config.maxDelay;
    console.log(`[RateLimiter] 进入冷却期 ${this.config.cooldownPeriod}ms，重置延迟为最大值`);
  }

  /**
   * 重置限制器
   */
  reset(): void {
    this.currentDelay = this.config.initialDelay;
    this.requestHistory = [];
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.cooldownEndTime = 0;
    console.log('[RateLimiter] 已重置');
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    currentDelay: number;
    successRate: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    inCooldown: boolean;
    requestCount: number;
  } {
    const window = this.requestHistory.slice(-this.config.windowSize);
    const successCount = window.filter((r) => r.success).length;
    const successRate = window.length > 0 ? successCount / window.length : 1;

    return {
      currentDelay: this.currentDelay,
      successRate,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      inCooldown: Date.now() < this.cooldownEndTime,
      requestCount: this.requestHistory.length,
    };
  }

  /**
   * 手动设置延迟
   */
  setDelay(delay: number): void {
    this.currentDelay = Math.max(
      this.config.minDelay,
      Math.min(delay, this.config.maxDelay)
    );
  }

  /**
   * 休眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 多域名速率限制管理器
 */
export class DomainRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  private defaultConfig: Partial<RateLimitConfig>;

  constructor(defaultConfig?: Partial<RateLimitConfig>) {
    this.defaultConfig = defaultConfig || {};
  }

  /**
   * 获取或创建域名限制器
   */
  getLimiter(domain: string, config?: Partial<RateLimitConfig>): RateLimiter {
    if (!this.limiters.has(domain)) {
      this.limiters.set(
        domain,
        new RateLimiter({ ...this.defaultConfig, ...config })
      );
    }
    return this.limiters.get(domain)!;
  }

  /**
   * 等待指定域名的下一次请求
   */
  async waitForDomain(domain: string): Promise<void> {
    const limiter = this.getLimiter(domain);
    await limiter.wait();
  }

  /**
   * 记录指定域名的请求结果
   */
  recordResult(domain: string, stats: RequestStats): void {
    const limiter = this.getLimiter(domain);
    limiter.recordResult(stats);
  }

  /**
   * 获取所有限制器状态
   */
  getAllStatus(): Record<string, ReturnType<RateLimiter['getStatus']>> {
    const status: Record<string, ReturnType<RateLimiter['getStatus']>> = {};
    this.limiters.forEach((limiter, domain) => {
      status[domain] = limiter.getStatus();
    });
    return status;
  }

  /**
   * 重置所有限制器
   */
  resetAll(): void {
    this.limiters.forEach((limiter) => limiter.reset());
  }
}

// 导出单例实例
export const domainRateLimiter = new DomainRateLimiter({
  minDelay: 2000,
  maxDelay: 30000,
  initialDelay: 3000,
  adaptiveMode: true,
});
