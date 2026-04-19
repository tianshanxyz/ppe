"use strict";
// 全局PPE数据采集引擎 - 代理管理器
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyManager = exports.ProxyManager = void 0;
/**
 * 代理管理器类
 */
class ProxyManager {
    proxies = [];
    currentIndex = 0;
    failedProxies = new Set();
    constructor() {
        this.loadProxiesFromEnv();
    }
    /**
     * 从环境变量加载代理列表
     */
    loadProxiesFromEnv() {
        const proxyString = process.env.PROXY_LIST;
        if (proxyString) {
            const proxyUrls = proxyString.split(',');
            this.proxies = proxyUrls.map((url) => this.parseProxyUrl(url.trim()));
        }
    }
    /**
     * 解析代理URL
     */
    parseProxyUrl(url) {
        // 支持格式: protocol://username:password@host:port
        // 或: protocol://host:port
        const match = url.match(/^(\w+):\/\/(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/);
        if (!match) {
            throw new Error(`Invalid proxy URL format: ${url}`);
        }
        const [, protocol, username, password, host, port] = match;
        return {
            protocol: protocol,
            host,
            port: parseInt(port, 10),
            username,
            password,
        };
    }
    /**
     * 添加代理
     */
    addProxy(proxy) {
        this.proxies.push(proxy);
    }
    /**
     * 批量添加代理
     */
    addProxies(proxies) {
        this.proxies.push(...proxies);
    }
    /**
     * 获取随机代理
     */
    getRandomProxy() {
        const availableProxies = this.proxies.filter((p) => !this.failedProxies.has(`${p.host}:${p.port}`));
        if (availableProxies.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * availableProxies.length);
        return availableProxies[randomIndex];
    }
    /**
     * 轮询获取代理
     */
    getNextProxy() {
        const availableProxies = this.proxies.filter((p) => !this.failedProxies.has(`${p.host}:${p.port}`));
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
    markProxyFailed(proxy) {
        this.failedProxies.add(`${proxy.host}:${proxy.port}`);
    }
    /**
     * 重置失败代理
     */
    resetFailedProxies() {
        this.failedProxies.clear();
    }
    /**
     * 获取代理数量
     */
    getProxyCount() {
        return this.proxies.length;
    }
    /**
     * 获取可用代理数量
     */
    getAvailableProxyCount() {
        return this.proxies.filter((p) => !this.failedProxies.has(`${p.host}:${p.port}`)).length;
    }
    /**
     * 测试代理可用性
     */
    async testProxy(proxy, testUrl = 'https://www.google.com') {
        try {
            const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
            const response = await axios.get(testUrl, {
                proxy: {
                    host: proxy.host,
                    port: proxy.port,
                    protocol: proxy.protocol,
                },
                timeout: 10000,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 测试所有代理
     */
    async testAllProxies(testUrl) {
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
exports.ProxyManager = ProxyManager;
// 导出单例实例
exports.proxyManager = new ProxyManager();
//# sourceMappingURL=ProxyManager.js.map