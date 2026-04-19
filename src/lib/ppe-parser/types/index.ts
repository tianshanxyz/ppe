/**
 * PPE 智能解析系统 - 类型定义
 * Phase 2: 智能解析模型开发
 */

/**
 * PPE 产品基础信息
 */
export interface PPEProduct {
  id: string;
  name: string;
  companyName: string;
  registrationNumber: string;
  deviceClass: string;
  market: string;
  productType: string;
  approvalDate?: string;
  expirationDate?: string;
  status: 'active' | 'inactive' | 'expired' | 'recalled';
  sourceUrl: string;
  sourceType: DataSourceType;
  extractedAt: string;
  rawData?: Record<string, any>;
}

/**
 * PPE 产品详细信息
 */
export interface PPEProductDetail extends PPEProduct {
  description?: string;
  specifications?: Record<string, string>;
  intendedUse?: string;
  indications?: string[];
  contraindications?: string[];
  warnings?: string[];
  manufacturerInfo?: ManufacturerInfo;
  contactInfo?: ContactInfo;
  attachments?: Attachment[];
  relatedProducts?: string[];
}

/**
 * 制造商信息
 */
export interface ManufacturerInfo {
  name: string;
  address?: string;
  country?: string;
  registrationNumber?: string;
  establishmentType?: string;
}

/**
 * 联系信息
 */
export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
}

/**
 * 附件信息
 */
export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

/**
 * 数据源类型
 */
export enum DataSourceType {
  FDA = 'fda',
  EUDAMED = 'eudamed',
  NMPA = 'nmpa',
  PMDA = 'pmda',
  TGA = 'tga',
  HEALTH_CANADA = 'health_canada',
}

/**
 * 解析器配置
 */
export interface ParserConfig {
  /** 数据源类型 */
  sourceType: DataSourceType;
  /** 基础 URL */
  baseUrl: string;
  /** 请求超时（毫秒） */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 请求间隔（毫秒） */
  requestInterval: number;
  /** 是否使用代理 */
  useProxy: boolean;
  /** 代理配置 */
  proxyConfig?: ProxyConfig;
  /** 用户代理字符串 */
  userAgent?: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 是否遵守 robots.txt */
  respectRobotsTxt: boolean;
  /** 采集时间窗口 */
  crawlWindow?: CrawlWindow;
}

/**
 * 代理配置
 */
export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
}

/**
 * 采集时间窗口
 */
export interface CrawlWindow {
  startHour: number;
  endHour: number;
  excludeWeekends: boolean;
  timezone: string;
}

/**
 * 解析结果
 */
export interface ParseResult<T = PPEProduct> {
  success: boolean;
  data?: T;
  error?: ParseError;
  metadata: ParseMetadata;
}

/**
 * 解析错误
 */
export interface ParseError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * 解析元数据
 */
export interface ParseMetadata {
  sourceType: DataSourceType;
  sourceUrl: string;
  parsedAt: string;
  duration: number;
  parserVersion: string;
  htmlSize?: number;
  fieldsExtracted: string[];
  confidence: number;
}

/**
 * 列表页结果
 */
export interface ListPageResult {
  items: PPEProduct[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPageUrl?: string;
}

/**
 * 详情页结果
 */
export interface DetailPageResult {
  product: PPEProductDetail;
  relatedData?: RelatedData;
}

/**
 * 相关数据
 */
export interface RelatedData {
  similarProducts?: PPEProduct[];
  companyProducts?: PPEProduct[];
  regulations?: string[];
}

/**
 * 字段提取规则
 */
export interface FieldExtractionRule {
  field: string;
  selectors: string[];
  attribute?: string;
  regex?: string;
  transform?: (value: string) => any;
  required: boolean;
  fallback?: string;
}

/**
 * 解析器接口
 */
export interface PPEParser {
  readonly name: string;
  readonly sourceType: DataSourceType;
  readonly version: string;
  
  /** 初始化解析器 */
  initialize(config: ParserConfig): Promise<void>;
  
  /** 获取列表页 */
  fetchListPage(page: number, filters?: Record<string, any>): Promise<ListPageResult>;
  
  /** 获取详情页 */
  fetchDetailPage(id: string): Promise<DetailPageResult>;
  
  /** 解析列表数据 */
  parseList(html: string): Promise<PPEProduct[]>;
  
  /** 解析详情数据 */
  parseDetail(html: string): Promise<PPEProductDetail>;
  
  /** 检查是否需要动态渲染 */
  requiresDynamicRendering(): boolean;
  
  /** 验证配置 */
  validateConfig(): boolean;
  
  /** 关闭解析器 */
  close(): Promise<void>;
}

/**
 * 提取器接口
 */
export interface FieldExtractor {
  readonly name: string;
  
  /** 提取字段 */
  extract(html: string, rules: FieldExtractionRule[]): Promise<Record<string, any>>;
  
  /** 验证提取结果 */
  validate(extracted: Record<string, any>): boolean;
}

/**
 * AI 模型配置
 */
export interface AIModelConfig {
  modelName: string;
  modelPath?: string;
  apiEndpoint?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

/**
 * AI 字段识别结果
 */
export interface AIFieldRecognitionResult {
  field: string;
  value: unknown;
  confidence: number;
  xpath?: string;
  alternative?: string[];
}

/**
 * 任务配置
 */
export interface CrawlTask {
  id: string;
  sourceType: DataSourceType;
  taskType: 'list' | 'detail' | 'full';
  targetUrl: string;
  priority: number;
  retryCount: number;
  maxRetries: number;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

/**
 * 采集统计
 */
export interface CrawlStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  retryingTasks: number;
  successRate: number;
  avgDuration: number;
  totalItems: number;
  errorsByType: Record<string, number>;
}

/**
 * 监控指标
 */
export interface MonitoringMetrics {
  timestamp: string;
  parserName: string;
  requestsPerSecond: number;
  avgResponseTime: number;
  errorRate: number;
  queueSize: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * 数据质量报告
 */
export interface DataQualityReport {
  sourceType: DataSourceType;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  issues: DataQualityIssue[];
  generatedAt: string;
}

/**
 * 数据质量问题
 */
export interface DataQualityIssue {
  field: string;
  issueType: 'missing' | 'invalid' | 'inconsistent' | 'duplicate';
  severity: 'low' | 'medium' | 'high';
  count: number;
  examples: string[];
  suggestion?: string;
}
