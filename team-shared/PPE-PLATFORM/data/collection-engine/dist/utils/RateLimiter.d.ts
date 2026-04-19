/**
 * 动态速率限制器
 * 根据响应情况动态调整请求频率，避免触发反爬虫机制
 */
export interface RateLimitConfig {
    minDelay: number;
    maxDelay: number;
    initialDelay: number;
    adaptiveMode: boolean;
    successThreshold: number;
    failureThreshold: number;
    increaseFactor: number;
    decreaseFactor: number;
    windowSize: number;
    cooldownPeriod: number;
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
export declare class RateLimiter {
    private config;
    private currentDelay;
    private requestHistory;
    private lastRequestTime;
    private cooldownEndTime;
    private consecutiveFailures;
    private consecutiveSuccesses;
    private readonly errorWeights;
    constructor(config?: Partial<RateLimitConfig>);
    /**
     * 等待下一次请求
     */
    wait(): Promise<void>;
    /**
     * 记录请求结果
     */
    recordResult(stats: RequestStats): void;
    /**
     * 自适应调整延迟
     */
    private adaptiveAdjust;
    /**
     * 增加延迟
     */
    private increaseDelay;
    /**
     * 减少延迟
     */
    private decreaseDelay;
    /**
     * 进入冷却期
     */
    private enterCooldown;
    /**
     * 重置限制器
     */
    reset(): void;
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
    };
    /**
     * 手动设置延迟
     */
    setDelay(delay: number): void;
    /**
     * 休眠
     */
    private sleep;
}
/**
 * 多域名速率限制管理器
 */
export declare class DomainRateLimiter {
    private limiters;
    private defaultConfig;
    constructor(defaultConfig?: Partial<RateLimitConfig>);
    /**
     * 获取或创建域名限制器
     */
    getLimiter(domain: string, config?: Partial<RateLimitConfig>): RateLimiter;
    /**
     * 等待指定域名的下一次请求
     */
    waitForDomain(domain: string): Promise<void>;
    /**
     * 记录指定域名的请求结果
     */
    recordResult(domain: string, stats: RequestStats): void;
    /**
     * 获取所有限制器状态
     */
    getAllStatus(): Record<string, ReturnType<RateLimiter['getStatus']>>;
    /**
     * 重置所有限制器
     */
    resetAll(): void;
}
export declare const domainRateLimiter: DomainRateLimiter;
//# sourceMappingURL=RateLimiter.d.ts.map