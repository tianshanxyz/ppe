"use strict";
// 全局PPE数据采集引擎 - 基础采集器类
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCollector = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const uuid_1 = require("uuid");
const p_retry_1 = __importDefault(require("p-retry"));
const p_throttle_1 = __importDefault(require("p-throttle"));
const Logger_1 = require("../utils/Logger");
const ProxyManager_1 = require("../utils/ProxyManager");
const UserAgentRotator_1 = require("../utils/UserAgentRotator");
/**
 * 基础采集器抽象类
 * 所有具体数据源采集器都需要继承此类
 */
class BaseCollector {
    config;
    antiCrawlConfig;
    logger;
    proxyManager;
    userAgentRotator;
    // Puppeteer实例
    browser = null;
    page = null;
    // Axios实例
    axiosInstance;
    // 限流器
    throttle;
    // 任务状态
    taskId;
    status;
    progress;
    errors = [];
    collectedProducts = [];
    collectedManufacturers = [];
    collectedCertifications = [];
    // 统计信息
    startTime = 0;
    totalRecords = 0;
    successRecords = 0;
    failedRecords = 0;
    constructor(config, antiCrawlConfig) {
        // 默认配置
        this.config = {
            sourceType: 'FDA',
            baseUrl: '',
            requestTimeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            rateLimitPerSecond: 2,
            rateLimitPerMinute: 60,
            useProxy: false,
            headless: true,
            batchSize: 100,
            saveInterval: 5000,
            ...config,
        };
        // 反爬配置
        this.antiCrawlConfig = {
            enabled: true,
            rotateUserAgent: true,
            rotateProxy: false,
            randomDelay: true,
            minDelay: 1000,
            maxDelay: 5000,
            simulateHuman: true,
            cookiePersistence: true,
            ...antiCrawlConfig,
        };
        // 初始化组件
        this.logger = new Logger_1.Logger(this.config.sourceType);
        this.proxyManager = new ProxyManager_1.ProxyManager();
        this.userAgentRotator = new UserAgentRotator_1.UserAgentRotator();
        // 初始化限流器
        this.throttle = (0, p_throttle_1.default)({
            limit: this.config.rateLimitPerSecond,
            interval: 1000,
        });
        // 初始化Axios
        this.axiosInstance = this.createAxiosInstance();
        // 生成任务ID
        this.taskId = (0, uuid_1.v4)();
        // 初始化状态
        this.status = 'pending';
        // 初始化进度
        this.progress = {
            taskId: this.taskId,
            currentPage: 0,
            totalPages: 0,
            processedRecords: 0,
            totalRecords: 0,
            percentage: 0,
            status: 'pending',
        };
    }
    /**
     * 创建Axios实例
     */
    createAxiosInstance() {
        const instance = axios_1.default.create({
            timeout: this.config.requestTimeout,
            headers: {
                'User-Agent': this.userAgentRotator.getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
        });
        // 请求拦截器
        instance.interceptors.request.use(async (config) => {
            // 应用限流
            await this.applyRateLimit();
            // 随机延迟
            if (this.antiCrawlConfig.randomDelay) {
                await this.randomDelay();
            }
            // 轮换User-Agent
            if (this.antiCrawlConfig.rotateUserAgent) {
                config.headers['User-Agent'] = this.userAgentRotator.getRandomUserAgent();
            }
            // 使用代理
            if (this.antiCrawlConfig.rotateProxy && this.config.useProxy) {
                const proxy = this.proxyManager.getRandomProxy();
                if (proxy) {
                    config.proxy = {
                        host: proxy.host,
                        port: proxy.port,
                        protocol: proxy.protocol,
                    };
                }
            }
            return config;
        }, (error) => Promise.reject(error));
        // 响应拦截器
        instance.interceptors.response.use((response) => response, async (error) => {
            this.logger.error('Request failed', error.message);
            return Promise.reject(error);
        });
        return instance;
    }
    /**
     * 初始化Puppeteer浏览器
     */
    async initBrowser() {
        try {
            const launchOptions = {
                headless: this.config.headless ? 'new' : false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                ],
            };
            // 使用代理
            if (this.antiCrawlConfig.rotateProxy && this.config.useProxy) {
                const proxy = this.proxyManager.getRandomProxy();
                if (proxy) {
                    launchOptions.args?.push(`--proxy-server=${proxy.protocol}://${proxy.host}:${proxy.port}`);
                }
            }
            this.browser = await puppeteer_1.default.launch(launchOptions);
            this.page = await this.browser.newPage();
            // 设置视口
            await this.page.setViewport({
                width: 1920,
                height: 1080,
            });
            // 设置User-Agent
            await this.page.setUserAgent(this.userAgentRotator.getRandomUserAgent());
            // 设置额外的HTTP头
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
            });
            this.logger.info('Browser initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize browser', error);
            throw error;
        }
    }
    /**
     * 关闭浏览器
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.logger.info('Browser closed');
        }
    }
    /**
     * 应用限流
     */
    async applyRateLimit() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1000 / this.config.rateLimitPerSecond);
        });
    }
    /**
     * 随机延迟
     */
    async randomDelay() {
        const delay = Math.floor(Math.random() * (this.antiCrawlConfig.maxDelay - this.antiCrawlConfig.minDelay) +
            this.antiCrawlConfig.minDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    /**
     * 带重试的请求
     */
    async requestWithRetry(requestFn, options) {
        return (0, p_retry_1.default)(requestFn, {
            retries: options?.retries ?? this.config.retryAttempts,
            onFailedAttempt: (error) => {
                this.logger.warn(`Request failed (attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber})`, error.message);
                options?.onRetry?.(error, error.attemptNumber);
            },
        });
    }
    /**
     * 使用Puppeteer获取页面内容
     */
    async fetchWithPuppeteer(url, waitForSelector) {
        if (!this.page) {
            await this.initBrowser();
        }
        return this.requestWithRetry(async () => {
            if (!this.page)
                throw new Error('Page not initialized');
            await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: this.config.requestTimeout,
            });
            // 模拟人类行为
            if (this.antiCrawlConfig.simulateHuman) {
                await this.simulateHumanBehavior();
            }
            // 等待特定元素
            if (waitForSelector) {
                await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
            }
            return await this.page.content();
        });
    }
    /**
     * 使用Axios获取页面内容
     */
    async fetchWithAxios(url, config) {
        return this.requestWithRetry(async () => {
            const response = await this.axiosInstance.get(url, config);
            return response.data;
        });
    }
    /**
     * 解析HTML
     */
    parseHTML(html) {
        return cheerio.load(html);
    }
    /**
     * 模拟人类行为
     */
    async simulateHumanBehavior() {
        if (!this.page)
            return;
        // 随机滚动
        await this.page.evaluate(() => {
            const scrollHeight = Math.floor(Math.random() * 500) + 100;
            window.scrollBy(0, scrollHeight);
        });
        await this.randomDelay();
        // 随机鼠标移动
        await this.page.mouse.move(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 800));
    }
    /**
     * 更新进度
     */
    updateProgress(currentPage, totalPages, processedRecords, totalRecords) {
        this.progress = {
            ...this.progress,
            currentPage,
            totalPages,
            processedRecords,
            totalRecords,
            percentage: Math.round((processedRecords / totalRecords) * 100) || 0,
            status: this.status,
        };
        this.logger.info(`Progress: ${this.progress.percentage}% (${processedRecords}/${totalRecords})`);
    }
    /**
     * 记录错误
     */
    recordError(error, recordId) {
        const collectionError = {
            sourceId: recordId || 'unknown',
            sourceType: this.config.sourceType,
            error: error.message,
            timestamp: new Date(),
            retryable: true,
        };
        this.errors.push(collectionError);
        this.failedRecords++;
        this.logger.error(`Error processing record ${recordId || 'unknown'}`, error.message);
    }
    /**
     * 批量保存数据
     */
    async batchSave() {
        // 这里应该调用数据库保存逻辑
        // 由子类实现或注入的数据库服务处理
        this.logger.info(`Batch save: ${this.collectedProducts.length} products, ` +
            `${this.collectedManufacturers.length} manufacturers, ` +
            `${this.collectedCertifications.length} certifications`);
    }
    /**
     * 获取采集结果
     */
    getResult() {
        const duration = Date.now() - this.startTime;
        return {
            taskId: this.taskId,
            sourceType: this.config.sourceType,
            status: this.status,
            startTime: new Date(this.startTime),
            endTime: new Date(),
            totalRecords: this.totalRecords,
            successRecords: this.successRecords,
            failedRecords: this.failedRecords,
            errors: this.errors,
            data: {
                products: this.collectedProducts,
                manufacturers: this.collectedManufacturers,
                certifications: this.collectedCertifications,
            },
            duration,
            metadata: {
                taskId: this.taskId,
                sourceType: this.config.sourceType,
                manufacturers: this.collectedManufacturers.length,
                certifications: this.collectedCertifications.length,
            },
        };
    }
    /**
     * 获取当前进度
     */
    getProgress() {
        return this.progress;
    }
    /**
     * 获取任务状态
     */
    getStatus() {
        return this.status;
    }
    /**
     * 取消任务
     */
    async cancel() {
        this.status = 'cancelled';
        await this.closeBrowser();
        this.logger.info('Task cancelled');
    }
}
exports.BaseCollector = BaseCollector;
//# sourceMappingURL=BaseCollector.js.map