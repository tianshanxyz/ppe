// 全局PPE数据采集引擎 - 基础采集器类

import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import pRetry from 'p-retry';
import pThrottle from 'p-throttle';

import {
  DataSourceType,
  CollectorConfig,
  CollectionResult,
  CollectionError,
  CollectionFilter,
  CollectionProgress,
  PPEProduct,
  PPEManufacturer,
  PPECertification,
  TaskStatus,
  AntiCrawlConfig,
  ProxyConfig,
} from '../types';

import { Logger } from '../utils/Logger';
import { ProxyManager } from '../utils/ProxyManager';
import { UserAgentRotator } from '../utils/UserAgentRotator';

/**
 * 基础采集器抽象类
 * 所有具体数据源采集器都需要继承此类
 */
export abstract class BaseCollector {
  protected config: CollectorConfig;
  protected antiCrawlConfig: AntiCrawlConfig;
  protected logger: Logger;
  protected proxyManager: ProxyManager;
  protected userAgentRotator: UserAgentRotator;
  
  // Puppeteer实例
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  
  // Axios实例
  protected axiosInstance: AxiosInstance;
  
  // 限流器
  protected throttle: any;
  
  // 任务状态
  protected taskId: string;
  protected status: TaskStatus;
  protected progress: CollectionProgress;
  protected errors: CollectionError[] = [];
  protected collectedProducts: PPEProduct[] = [];
  protected collectedManufacturers: PPEManufacturer[] = [];
  protected collectedCertifications: PPECertification[] = [];
  
  // 统计信息
  protected startTime: number = 0;
  protected totalRecords: number = 0;
  protected successRecords: number = 0;
  protected failedRecords: number = 0;

  constructor(
    config: Partial<CollectorConfig>,
    antiCrawlConfig?: Partial<AntiCrawlConfig>
  ) {
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
    this.logger = new Logger(this.config.sourceType);
    this.proxyManager = new ProxyManager();
    this.userAgentRotator = new UserAgentRotator();
    
    // 初始化限流器
    this.throttle = pThrottle({
      limit: this.config.rateLimitPerSecond,
      interval: 1000,
    });
    
    // 初始化Axios
    this.axiosInstance = this.createAxiosInstance();
    
    // 生成任务ID
    this.taskId = uuidv4();

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
  protected createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
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
    instance.interceptors.request.use(
      async (config) => {
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
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        this.logger.error('Request failed', error.message);
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * 初始化Puppeteer浏览器
   */
  protected async initBrowser(): Promise<void> {
    try {
      const launchOptions: PuppeteerLaunchOptions = {
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

      this.browser = await puppeteer.launch(launchOptions);
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
    } catch (error) {
      this.logger.error('Failed to initialize browser', error);
      throw error;
    }
  }

  /**
   * 关闭浏览器
   */
  protected async closeBrowser(): Promise<void> {
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
  protected async applyRateLimit(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000 / this.config.rateLimitPerSecond);
    });
  }

  /**
   * 随机延迟
   */
  protected async randomDelay(): Promise<void> {
    const delay = Math.floor(
      Math.random() * (this.antiCrawlConfig.maxDelay - this.antiCrawlConfig.minDelay) +
        this.antiCrawlConfig.minDelay
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * 带重试的请求
   */
  protected async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    options?: { retries?: number; onRetry?: (error: Error, attempt: number) => void }
  ): Promise<T> {
    return pRetry(requestFn, {
      retries: options?.retries ?? this.config.retryAttempts,
      onFailedAttempt: (error) => {
        this.logger.warn(
          `Request failed (attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber})`,
          error.message
        );
        options?.onRetry?.(error, error.attemptNumber);
      },
    });
  }

  /**
   * 使用Puppeteer获取页面内容
   */
  protected async fetchWithPuppeteer(url: string, waitForSelector?: string): Promise<string> {
    if (!this.page) {
      await this.initBrowser();
    }

    return this.requestWithRetry(async () => {
      if (!this.page) throw new Error('Page not initialized');

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
  protected async fetchWithAxios(url: string, config?: AxiosRequestConfig): Promise<string> {
    return this.requestWithRetry(async () => {
      const response = await this.axiosInstance.get(url, config);
      return response.data;
    });
  }

  /**
   * 解析HTML
   */
  protected parseHTML(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * 模拟人类行为
   */
  protected async simulateHumanBehavior(): Promise<void> {
    if (!this.page) return;

    // 随机滚动
    await this.page.evaluate(() => {
      const scrollHeight = Math.floor(Math.random() * 500) + 100;
      window.scrollBy(0, scrollHeight);
    });

    await this.randomDelay();

    // 随机鼠标移动
    await this.page.mouse.move(
      Math.floor(Math.random() * 1000),
      Math.floor(Math.random() * 800)
    );
  }

  /**
   * 更新进度
   */
  protected updateProgress(
    currentPage: number,
    totalPages: number,
    processedRecords: number,
    totalRecords: number
  ): void {
    this.progress = {
      ...this.progress,
      currentPage,
      totalPages,
      processedRecords,
      totalRecords,
      percentage: Math.round((processedRecords / totalRecords) * 100) || 0,
      status: this.status,
    };

    this.logger.info(
      `Progress: ${this.progress.percentage}% (${processedRecords}/${totalRecords})`
    );
  }

  /**
   * 记录错误
   */
  protected recordError(error: Error, recordId?: string): void {
    const collectionError: CollectionError = {
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
  protected async batchSave(): Promise<void> {
    // 这里应该调用数据库保存逻辑
    // 由子类实现或注入的数据库服务处理
    this.logger.info(
      `Batch save: ${this.collectedProducts.length} products, ` +
        `${this.collectedManufacturers.length} manufacturers, ` +
        `${this.collectedCertifications.length} certifications`
    );
  }

  /**
   * 获取采集结果
   */
  protected getResult(): CollectionResult {
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
   * 抽象方法：执行采集
   * 子类必须实现此方法
   */
  abstract collect(filter?: CollectionFilter): Promise<CollectionResult>;

  /**
   * 抽象方法：解析产品数据
   * 子类必须实现此方法
   */
  abstract parseProduct(element: any, $: cheerio.CheerioAPI): PPEProduct | null;

  /**
   * 抽象方法：解析制造商数据
   * 子类必须实现此方法
   */
  abstract parseManufacturer(element: any, $: cheerio.CheerioAPI): PPEManufacturer | null;

  /**
   * 抽象方法：解析认证数据
   * 子类必须实现此方法
   */
  abstract parseCertification(element: any, $: cheerio.CheerioAPI): PPECertification | null;

  /**
   * 获取当前进度
   */
  getProgress(): CollectionProgress {
    return this.progress;
  }

  /**
   * 获取任务状态
   */
  getStatus(): TaskStatus {
    return this.status;
  }

  /**
   * 取消任务
   */
  async cancel(): Promise<void> {
    this.status = 'cancelled';
    await this.closeBrowser();
    this.logger.info('Task cancelled');
  }
}
