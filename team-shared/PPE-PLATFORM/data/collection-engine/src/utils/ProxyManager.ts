// 全局PPE数据采集引擎 - 代理管理器

import { ProxyConfig } from '../types';

/**
 * 代理管理器类
 */
export class ProxyManager {
  private proxies: ProxyConfig[] = [];
  private currentIndex: number = 0;
  private failedProxies: Set<string> = new Set();

  constructor() {
    this.loadProxiesFromEnv();
  }

  /**
   * 从环境变量加载代理列表
   */
  private loadProxiesFromEnv(): void {
    const proxyString = process.env.PROXY_LIST;
    if (proxyString) {
      const proxyUrls = proxyString.split(',');
      this.proxies = proxyUrls.map((url) => this.parseProxyUrl(url.trim()));
    }
  }

  /**
   * 解析代理URL
   */
  private parseProxyUrl(url: string): ProxyConfig {
    // 支持格式: protocol://username:password@host:port
    // 或: protocol://host:port
    const match = url.match(/^(\w+):\/\/(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/);

    if (!match) {
      throw new Error(`Invalid proxy URL format: ${url}`);
    }

    const [, protocol, username, password, host, port] = match;

    return {
      protocol: protocol as 'http' | 'https' | 'socks4' | 'socks5',
      host,
      port: parseInt(port, 10),
      username,
      password,
    };
  }

  /**
   * 添加代理
   */
  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  /**
   * 批量添加代理
   */
  addProxies(proxies: ProxyConfig[]): void {
    this.proxies.push(...proxies);
  }

  /**
   * 获取随机代理
   */
  getRandomProxy(): ProxyConfig | null {
    const availableProxies = this.proxies.filter(
      (p) => !this.failedProxies.has(`${p.host}:${p.port}`)
    );

    if (availableProxies.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableProxies.length);
    return availableProxies[randomIndex];
  }

  /**
   * 轮询获取代理
   */
  getNextProxy(): ProxyConfig | null {
    const availableProxies = this.proxies.filter(
      (p) => !this.failedProxies.has(`${p.host}:${p.port}`)
    );

    if (availableProxies.length === 0) {
      return null;
    }

    const proxy = availableProxies[this.currentIndex % availableProxies.length];
    this.currentIndex++;
    return proxy;
  }

  /**
   * 标记代理失败
   */
  markProxyFailed(proxy: ProxyConfig): void {
    this.failedProxies.add(`${proxy.host}:${proxy.port}`);
  }

  /**
   * 重置失败代理
   */
  resetFailedProxies(): void {
    this.failedProxies.clear();
  }

  /**
   * 获取代理数量
   */
  getProxyCount(): number {
    return this.proxies.length;
  }

  /**
   * 获取可用代理数量
   */
  getAvailableProxyCount(): number {
    return this.proxies.filter((p) => !this.failedProxies.has(`${p.host}:${p.port}`)).length;
  }

  /**
   * 测试代理可用性
   */
  async testProxy(proxy: ProxyConfig, testUrl: string = 'https://www.google.com'): Promise<boolean> {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(testUrl, {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          protocol: proxy.protocol,
        },
        timeout: 10000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * 测试所有代理
   */
  async testAllProxies(testUrl?: string): Promise<{ proxy: ProxyConfig; isWorking: boolean }[]> {
    const results = [];
    for (const proxy of this.proxies) {
      const isWorking = await this.testProxy(proxy, testUrl);
      if (!isWorking) {
        this.markProxyFailed(proxy);
      }
      results.push({ proxy, isWorking });
    }
    return results;
  }
}

// 导出单例实例
export const proxyManager = new ProxyManager();
