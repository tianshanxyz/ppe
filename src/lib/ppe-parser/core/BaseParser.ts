/**
 * PPE 基础解析器
 * Phase 2: 智能解析模型开发
 */

import {
  PPEParser,
  ParserConfig,
  ListPageResult,
  DetailPageResult,
  PPEProduct,
  PPEProductDetail,
  DataSourceType,
  ParseResult,
  ParseMetadata,
  TaskStatus,
} from '../types';

/**
 * 抽象基础解析器类
 * 所有具体解析器都需要继承此类
 */
export abstract class BaseParser implements PPEParser {
  abstract readonly name: string;
  abstract readonly sourceType: DataSourceType;
  abstract readonly version: string;

  protected config!: ParserConfig;
  protected isInitialized: boolean = false;
  protected requestCount: number = 0;
  private lastRequestTime: number = 0;

  /**
   * 初始化解析器
   */
  async initialize(config: ParserConfig): Promise<void> {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    };

    if (!this.validateConfig()) {
      throw new Error(`Invalid parser configuration for ${this.name}`);
    }

    await this.onInitialize();
    this.isInitialized = true;
  }

  /**
   * 获取默认配置
   */
  protected abstract getDefaultConfig(): Partial<ParserConfig>;

  /**
   * 初始化钩子（子类可覆盖）
   */
  protected async onInitialize(): Promise<void> {
    // 子类可覆盖
  }

  /**
   * 验证配置
   */
  validateConfig(): boolean {
    if (!this.config) {
      return false;
    }

    // 基础验证
    if (!this.config.baseUrl) {
      console.error(`[${this.name}] baseUrl is required`);
      return false;
    }

    if (this.config.timeout <= 0) {
      console.error(`[${this.name}] timeout must be positive`);
      return false;
    }

    if (this.config.retryCount < 0) {
      console.error(`[${this.name}] retryCount must be non-negative`);
      return false;
    }

    return true;
  }

  /**
   * 获取列表页
   */
  abstract fetchListPage(
    page: number,
    filters?: Record<string, any>
  ): Promise<ListPageResult>;

  /**
   * 获取详情页
   */
  abstract fetchDetailPage(id: string): Promise<DetailPageResult>;

  /**
   * 解析列表数据
   */
  abstract parseList(html: string): Promise<PPEProduct[]>;

  /**
   * 解析详情数据
   */
  abstract parseDetail(html: string): Promise<PPEProductDetail>;

  /**
   * 检查是否需要动态渲染
   */
  abstract requiresDynamicRendering(): boolean;

  /**
   * 关闭解析器
   */
  async close(): Promise<void> {
    this.isInitialized = false;
    await this.onClose();
  }

  /**
   * 关闭钩子（子类可覆盖）
   */
  protected async onClose(): Promise<void> {
    // 子类可覆盖
  }

  /**
   * 执行 HTTP 请求（带限速和重试）
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<Response> {
    // 检查采集时间窗口
    if (!this.isInCrawlWindow()) {
      throw new Error('Outside of allowed crawl window');
    }

    // 限速控制
    await this.applyRateLimit();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': this.config.userAgent || this.getDefaultUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          ...this.config.headers,
          ...options.headers,
        },
      });

      this.requestCount++;
      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (retryCount < this.config.retryCount) {
        console.warn(`[${this.name}] Request failed, retrying (${retryCount + 1}/${this.config.retryCount})...`);
        await this.delay(1000 * (retryCount + 1)); // 指数退避
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 检查是否在采集时间窗口内
   */
  protected isInCrawlWindow(): boolean {
    if (!this.config.crawlWindow) {
      return true;
    }

    const now = new Date();
    const { startHour, endHour, excludeWeekends } = this.config.crawlWindow;

    // 检查周末
    if (excludeWeekends) {
      const day = now.getDay();
      if (day === 0 || day === 6) {
        return false;
      }
    }

    // 检查时间窗口
    const hour = now.getHours();
    return hour >= startHour && hour < endHour;
  }

  /**
   * 应用限速
   */
  protected async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = this.config.requestInterval;

    if (timeSinceLastRequest < minInterval) {
      await this.delay(minInterval - timeSinceLastRequest);
    }
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取默认 User-Agent
   */
  protected getDefaultUserAgent(): string {
    return `MDLooker-PPE-Parser/${this.version} (Research Bot; Contact: admin@mdlooker.com)`;
  }

  /**
   * 生成解析元数据
   */
  protected createMetadata(
    sourceUrl: string,
    duration: number,
    fieldsExtracted: string[],
    confidence: number,
    htmlSize?: number
  ): ParseMetadata {
    return {
      sourceType: this.sourceType,
      sourceUrl,
      parsedAt: new Date().toISOString(),
      duration,
      parserVersion: this.version,
      htmlSize,
      fieldsExtracted,
      confidence,
    };
  }

  /**
   * 包装解析结果
   */
  protected createSuccessResult<T>(
    data: T,
    metadata: ParseMetadata
  ): ParseResult<T> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /**
   * 包装错误结果
   */
  protected createErrorResult(
    code: string,
    message: string,
    sourceUrl: string,
    details?: Record<string, any>
  ): ParseResult<any> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        sourceType: this.sourceType,
        sourceUrl,
        parsedAt: new Date().toISOString(),
        duration: 0,
        parserVersion: this.version,
        fieldsExtracted: [],
        confidence: 0,
      },
    };
  }

  /**
   * 生成唯一 ID
   */
  protected generateId(): string {
    return `${this.sourceType}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 清理文本
   */
  protected cleanText(text: string | null | undefined): string {
    if (!text) {
      return '';
    }
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * 解析日期
   */
  protected parseDate(dateStr: string | null | undefined): string | undefined {
    if (!dateStr) {
      return undefined;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  }

  /**
   * 获取请求统计
   */
  getRequestStats(): { count: number; lastRequestTime: number } {
    return {
      count: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}
