import { ProxyConfig } from '../types';
/**
 * 代理管理器类
 */
export declare class ProxyManager {
    private proxies;
    private currentIndex;
    private failedProxies;
    constructor();
    /**
     * 从环境变量加载代理列表
     */
    private loadProxiesFromEnv;
    /**
     * 解析代理URL
     */
    private parseProxyUrl;
    /**
     * 添加代理
     */
    addProxy(proxy: ProxyConfig): void;
    /**
     * 批量添加代理
     */
    addProxies(proxies: ProxyConfig[]): void;
    /**
     * 获取随机代理
     */
    getRandomProxy(): ProxyConfig | null;
    /**
     * 轮询获取代理
     */
    getNextProxy(): ProxyConfig | null;
    /**
     * 标记代理失败
     */
    markProxyFailed(proxy: ProxyConfig): void;
    /**
     * 重置失败代理
     */
    resetFailedProxies(): void;
    /**
     * 获取代理数量
     */
    getProxyCount(): number;
    /**
     * 获取可用代理数量
     */
    getAvailableProxyCount(): number;
    /**
     * 测试代理可用性
     */
    testProxy(proxy: ProxyConfig, testUrl?: string): Promise<boolean>;
    /**
     * 测试所有代理
     */
    testAllProxies(testUrl?: string): Promise<{
        proxy: ProxyConfig;
        isWorking: boolean;
    }[]>;
}
export declare const proxyManager: ProxyManager;
//# sourceMappingURL=ProxyManager.d.ts.map