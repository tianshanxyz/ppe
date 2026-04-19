import { Browser, Page } from 'puppeteer';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { CollectorConfig, CollectionResult, CollectionError, CollectionFilter, CollectionProgress, PPEProduct, PPEManufacturer, PPECertification, TaskStatus, AntiCrawlConfig } from '../types';
import { Logger } from '../utils/Logger';
import { ProxyManager } from '../utils/ProxyManager';
import { UserAgentRotator } from '../utils/UserAgentRotator';
/**
 * 基础采集器抽象类
 * 所有具体数据源采集器都需要继承此类
 */
export declare abstract class BaseCollector {
    protected config: CollectorConfig;
    protected antiCrawlConfig: AntiCrawlConfig;
    protected logger: Logger;
    protected proxyManager: ProxyManager;
    protected userAgentRotator: UserAgentRotator;
    protected browser: Browser | null;
    protected page: Page | null;
    protected axiosInstance: AxiosInstance;
    protected throttle: any;
    protected taskId: string;
    protected status: TaskStatus;
    protected progress: CollectionProgress;
    protected errors: CollectionError[];
    protected collectedProducts: PPEProduct[];
    protected collectedManufacturers: PPEManufacturer[];
    protected collectedCertifications: PPECertification[];
    protected startTime: number;
    protected totalRecords: number;
    protected successRecords: number;
    protected failedRecords: number;
    constructor(config: Partial<CollectorConfig>, antiCrawlConfig?: Partial<AntiCrawlConfig>);
    /**
     * 创建Axios实例
     */
    protected createAxiosInstance(): AxiosInstance;
    /**
     * 初始化Puppeteer浏览器
     */
    protected initBrowser(): Promise<void>;
    /**
     * 关闭浏览器
     */
    protected closeBrowser(): Promise<void>;
    /**
     * 应用限流
     */
    protected applyRateLimit(): Promise<void>;
    /**
     * 随机延迟
     */
    protected randomDelay(): Promise<void>;
    /**
     * 带重试的请求
     */
    protected requestWithRetry<T>(requestFn: () => Promise<T>, options?: {
        retries?: number;
        onRetry?: (error: Error, attempt: number) => void;
    }): Promise<T>;
    /**
     * 使用Puppeteer获取页面内容
     */
    protected fetchWithPuppeteer(url: string, waitForSelector?: string): Promise<string>;
    /**
     * 使用Axios获取页面内容
     */
    protected fetchWithAxios(url: string, config?: AxiosRequestConfig): Promise<string>;
    /**
     * 解析HTML
     */
    protected parseHTML(html: string): cheerio.CheerioAPI;
    /**
     * 模拟人类行为
     */
    protected simulateHumanBehavior(): Promise<void>;
    /**
     * 更新进度
     */
    protected updateProgress(currentPage: number, totalPages: number, processedRecords: number, totalRecords: number): void;
    /**
     * 记录错误
     */
    protected recordError(error: Error, recordId?: string): void;
    /**
     * 批量保存数据
     */
    protected batchSave(): Promise<void>;
    /**
     * 获取采集结果
     */
    protected getResult(): CollectionResult;
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
    getProgress(): CollectionProgress;
    /**
     * 获取任务状态
     */
    getStatus(): TaskStatus;
    /**
     * 取消任务
     */
    cancel(): Promise<void>;
}
//# sourceMappingURL=BaseCollector.d.ts.map