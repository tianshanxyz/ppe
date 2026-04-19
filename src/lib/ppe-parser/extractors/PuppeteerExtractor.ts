/**
 * Puppeteer 动态 HTML 提取器
 * Phase 2: 智能解析模型开发
 */

import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import {
  FieldExtractor,
  FieldExtractionRule,
  ProxyConfig,
} from '../types';

/**
 * Puppeteer 提取选项
 */
export interface PuppeteerExtractOptions {
  /** 是否启用无头模式 */
  headless: boolean;
  /** 浏览器启动参数 */
  args: string[];
  /** 默认视口 */
  viewport: { width: number; height: number };
  /** 请求超时（毫秒） */
  timeout: number;
  /** 等待页面加载完成的时间（毫秒） */
  waitForTimeout: number;
  /** 是否禁用图片加载 */
  disableImages: boolean;
  /** 是否禁用 CSS */
  disableCSS: boolean;
  /** 是否禁用 JavaScript */
  disableJS: boolean;
  /** User-Agent */
  userAgent?: string;
  /** 代理配置 */
  proxy?: ProxyConfig;
}

/**
 * 页面加载策略
 */
export enum LoadStrategy {
  /** 等待 DOM 加载完成 */
  DOM_CONTENT_LOADED = 'domcontentloaded',
  /** 等待网络空闲 */
  NETWORK_IDLE = 'networkidle0',
  /** 等待网络几乎空闲 */
  NETWORK_IDLE_2 = 'networkidle2',
  /** 等待页面完全加载 */
  LOAD = 'load',
}

/**
 * Puppeteer 动态提取器
 * 用于解析需要 JavaScript 渲染的动态页面
 */
export class PuppeteerExtractor implements FieldExtractor {
  readonly name = 'PuppeteerExtractor';

  private options: PuppeteerExtractOptions;
  private browser: Browser | null = null;
  private isInitialized: boolean = false;

  constructor(options: Partial<PuppeteerExtractOptions> = {}) {
    this.options = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      viewport: { width: 1920, height: 1080 },
      timeout: 60000,
      waitForTimeout: 5000,
      disableImages: true,
      disableCSS: false,
      disableJS: false,
      ...options,
    };
  }

  /**
   * 初始化浏览器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const launchOptions: LaunchOptions = {
      headless: this.options.headless,
      args: this.options.args,
      defaultViewport: this.options.viewport,
    };

    // 配置代理
    if (this.options.proxy) {
      const proxyUrl = `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`;
      launchOptions.args?.push(`--proxy-server=${proxyUrl}`);
    }

    this.browser = await puppeteer.launch(launchOptions);
    this.isInitialized = true;

    console.log('[PuppeteerExtractor] Browser initialized');
  }

  /**
   * 创建新页面
   */
  async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();

    // 设置 User-Agent
    if (this.options.userAgent) {
      await page.setUserAgent(this.options.userAgent);
    }

    // 设置视口
    await page.setViewport(this.options.viewport);

    // 配置请求拦截
    await this.setupRequestInterception(page);

    // 设置默认超时
    page.setDefaultTimeout(this.options.timeout);
    page.setDefaultNavigationTimeout(this.options.timeout);

    return page;
  }

  /**
   * 配置请求拦截
   */
  private async setupRequestInterception(page: Page): Promise<void> {
    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const resourceType = request.resourceType();

      // 禁用图片
      if (this.options.disableImages && resourceType === 'image') {
        request.abort();
        return;
      }

      // 禁用 CSS
      if (this.options.disableCSS && resourceType === 'stylesheet') {
        request.abort();
        return;
      }

      // 禁用 JavaScript
      if (this.options.disableJS && resourceType === 'script') {
        request.abort();
        return;
      }

      request.continue();
    });
  }

  /**
   * 导航到页面并等待加载
   */
  async navigate(
    page: Page,
    url: string,
    strategy: LoadStrategy = LoadStrategy.NETWORK_IDLE
  ): Promise<void> {
    await page.goto(url, {
      waitUntil: strategy as puppeteer.WaitForOptions['waitUntil'],
      timeout: this.options.timeout,
    });

    // 额外等待时间，确保动态内容加载
    if (this.options.waitForTimeout > 0) {
      await page.waitForTimeout(this.options.waitForTimeout);
    }
  }

  /**
   * 提取字段
   */
  async extract(
    html: string,
    rules: FieldExtractionRule[]
  ): Promise<Record<string, any>> {
    // Puppeteer 提取器需要页面实例，这里返回空对象
    // 实际使用时应该使用 extractFromPage 方法
    console.warn('[PuppeteerExtractor] Use extractFromPage() for dynamic content extraction');
    return {};
  }

  /**
   * 从页面提取字段
   */
  async extractFromPage(
    page: Page,
    rules: FieldExtractionRule[]
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const rule of rules) {
      const value = await this.extractFieldFromPage(page, rule);
      if (value !== undefined && value !== null && value !== '') {
        result[rule.field] = value;
      } else if (rule.required && rule.fallback) {
        result[rule.field] = rule.fallback;
      }
    }

    return result;
  }

  /**
   * 从页面提取单个字段
   */
  private async extractFieldFromPage(
    page: Page,
    rule: FieldExtractionRule
  ): Promise<any> {
    for (const selector of rule.selectors) {
      try {
        // 等待元素出现
        await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);

        const element = await page.$(selector);

        if (!element) {
          continue;
        }

        let value: string;

        // 获取属性值
        if (rule.attribute) {
          value = (await element.evaluate((el, attr) => el.getAttribute(attr), rule.attribute)) || '';
        } else {
          // 获取文本内容
          value = await element.evaluate((el) => el.textContent || '');
        }

        // 清理文本
        value = this.cleanText(value);

        // 应用正则表达式
        if (rule.regex && value) {
          const match = value.match(new RegExp(rule.regex));
          value = match ? match[1] || match[0] : '';
        }

        // 应用转换函数
        if (rule.transform && value) {
          return rule.transform(value);
        }

        if (value) {
          return value;
        }
      } catch (error) {
        console.warn(
          `[PuppeteerExtractor] Failed to extract ${rule.field} with selector: ${selector}`,
          error
        );
        continue;
      }
    }

    return undefined;
  }

  /**
   * 提取页面内容
   */
  async extractPageContent(page: Page): Promise<{
    title: string;
    url: string;
    html: string;
    text: string;
  }> {
    const title = await page.title();
    const url = page.url();
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);

    return {
      title,
      url,
      html,
      text: this.cleanText(text),
    };
  }

  /**
   * 提取表格数据
   */
  async extractTableFromPage(
    page: Page,
    tableSelector: string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    return await page.evaluate((selector) => {
      const table = document.querySelector(selector);
      if (!table) {
        return { headers: [], rows: [] };
      }

      const headers: string[] = [];
      const rows: string[][] = [];

      // 提取表头
      table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td').forEach((th) => {
        headers.push(th.textContent?.trim() || '');
      });

      // 提取数据行
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach((row) => {
        const rowData: string[] = [];
        row.querySelectorAll('td, th').forEach((cell) => {
          rowData.push(cell.textContent?.trim() || '');
        });

        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      return { headers, rows };
    }, tableSelector);
  }

  /**
   * 滚动页面加载更多内容
   */
  async scrollToBottom(page: Page, options: { step?: number; delay?: number } = {}): Promise<void> {
    const { step = 500, delay = 100 } = options;

    await page.evaluate(
      async (scrollStep, scrollDelay) => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, scrollStep);
            totalHeight += scrollStep;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, scrollDelay);
        });
      },
      step,
      delay
    );
  }

  /**
   * 点击元素
   */
  async clickElement(page: Page, selector: string, waitForNavigation: boolean = false): Promise<void> {
    if (waitForNavigation) {
      await Promise.all([page.waitForNavigation(), page.click(selector)]);
    } else {
      await page.click(selector);
    }

    // 等待动态内容加载
    if (this.options.waitForTimeout > 0) {
      await page.waitForTimeout(this.options.waitForTimeout);
    }
  }

  /**
   * 填写表单
   */
  async fillForm(
    page: Page,
    formData: Record<string, string>,
    submitSelector?: string
  ): Promise<void> {
    for (const [selector, value] of Object.entries(formData)) {
      await page.type(selector, value);
    }

    if (submitSelector) {
      await this.clickElement(page, submitSelector, true);
    }
  }

  /**
   * 等待元素出现
   */
  async waitForElement(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<void> {
    await page.waitForSelector(selector, {
      timeout: timeout || this.options.timeout,
    });
  }

  /**
   * 检查元素是否存在
   */
  async hasElement(page: Page, selector: string): Promise<boolean> {
    const element = await page.$(selector);
    return element !== null;
  }

  /**
   * 获取元素数量
   */
  async countElements(page: Page, selector: string): Promise<number> {
    return await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
  }

  /**
   * 截图
   */
  async screenshot(
    page: Page,
    options: { path?: string; fullPage?: boolean; selector?: string } = {}
  ): Promise<Buffer | string | void> {
    const { path, fullPage = false, selector } = options;

    if (selector) {
      const element = await page.$(selector);
      if (element) {
        return await element.screenshot({ path });
      }
      return;
    }

    return await page.screenshot({ path, fullPage });
  }

  /**
   * 执行自定义 JavaScript
   */
  async evaluate<T>(page: Page, script: string | Function, ...args: any[]): Promise<T> {
    return await page.evaluate(script as any, ...args);
  }

  /**
   * 验证提取结果
   */
  validate(extracted: Record<string, any>): boolean {
    return Object.keys(extracted).length > 0;
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('[PuppeteerExtractor] Browser closed');
    }
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    if (!text) {
      return '';
    }

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * 获取浏览器实例
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized && this.browser !== null;
  }
}

/**
 * 创建 Puppeteer 提取器实例
 */
export function createPuppeteerExtractor(
  options?: Partial<PuppeteerExtractOptions>
): PuppeteerExtractor {
  return new PuppeteerExtractor(options);
}
