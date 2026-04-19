// 全局PPE数据采集引擎 - 类型定义

// 数据源类型
export type DataSourceType = 'FDA' | 'EUDAMED' | 'NMPA' | 'PMDA' | 'TGA' | 'HealthCanada';

// 采集任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 采集任务类型
export type TaskType = 'full_import' | 'incremental_update' | 'manual_trigger';

// 日志级别
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

// 认证类型
export type CertificationType = 'FDA' | 'CE' | 'NMPA' | 'PMDA' | 'TGA' | 'HealthCanada';

// PPE产品分类
export type PPECategory = 'I' | 'II' | 'III';

// 产品大类
export type ProductCategory = 
  | '呼吸防护' 
  | '头部防护' 
  | '眼面防护' 
  | '听力防护' 
  | '手部防护' 
  | '足部防护' 
  | '身体防护' 
  | '坠落防护' 
  | '皮肤防护';

// 数据源配置
export interface DataSource {
  id: string;
  sourceName: DataSourceType;
  sourceType: 'api' | 'web_scraping' | 'file_import';
  jurisdiction: string;
  baseUrl: string;
  apiEndpoint?: string;
  config?: Record<string, any>;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

// 采集任务
export interface CollectionTask {
  id: string;
  taskName: string;
  dataSourceId: string;
  taskType: TaskType;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  recordsTotal: number;
  recordsSuccess: number;
  recordsFailed: number;
  errorMessage?: string;
  executedBy: 'system' | 'manual' | 'scheduled';
  createdAt: Date;
  updatedAt: Date;
}

// 采集日志
export interface CollectionLog {
  id: string;
  taskId: string;
  logLevel: LogLevel;
  message: string;
  details?: Record<string, any>;
  createdAt: Date;
}

// PPE产品数据
export interface PPEProduct {
  id?: string;
  productName: string;
  productNameEn?: string;
  productNameLocal?: string;
  productCode?: string;
  modelNumber?: string;
  category: ProductCategory | string;
  subcategory?: string;
  ppeCategory?: PPECategory;
  riskLevel?: string;
  description?: string;
  descriptionEn?: string;
  specifications?: Record<string, any>;
  features?: Record<string, any>;
  images?: string[];
  manufacturerId?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  manufacturerCountry?: string;
  brandName?: string;
  brandOwner?: string;
  dataSource: DataSourceType;
  sourceId: string;
  sourceUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  dataQualityScore?: number;
  isActive?: boolean;
}

// 制造商数据
export interface PPEManufacturer {
  id?: string;
  companyName: string;
  companyNameEn?: string;
  companyNameLocal?: string;
  businessType?: 'manufacturer' | 'supplier' | 'distributor' | 'cert_body';
  country?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  email?: string;
  phone?: string;
  certifications?: Record<string, any>;
  capabilities?: string;
  dataSource?: DataSourceType;
  sourceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  dataQualityScore?: number;
  isActive?: boolean;
}

// 认证信息
export interface PPECertification {
  id?: string;
  productId?: string;
  certificationType: CertificationType;
  certificationNumber?: string;
  certificateUrl?: string;
  certBodyId?: string;
  certBodyName?: string;
  issueDate?: Date;
  expiryDate?: Date;
  renewalDate?: Date;
  status?: 'active' | 'expired' | 'revoked' | 'suspended';
  standardCode?: string;
  standardName?: string;
  scopeDescription?: string;
  dataSource?: DataSourceType;
  sourceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  warningSent?: boolean;
  warningDate?: Date;
}

// 采集器配置
export interface CollectorConfig {
  // 基础配置
  sourceType: DataSourceType;
  baseUrl: string;
  
  // 请求配置
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  
  // 限流配置
  rateLimitPerSecond: number;
  rateLimitPerMinute: number;
  
  // 代理配置
  useProxy: boolean;
  proxyList?: string[];
  
  // 浏览器配置
  headless: boolean;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  
  // 数据存储配置
  batchSize: number;
  saveInterval: number;
}

// 采集结果
export interface CollectionResult {
  taskId: string;
  sourceType: DataSourceType;
  status: TaskStatus;
  startTime: Date;
  endTime: Date;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  errors: CollectionError[];
  data: {
    products: PPEProduct[];
    manufacturers: PPEManufacturer[];
    certifications: PPECertification[];
  };
  duration?: number;
  metadata?: Record<string, any>;
}

// 采集错误
export interface CollectionError {
  sourceId: string;
  sourceType: DataSourceType;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalPages?: number;
  totalRecords?: number;
}

// 采集过滤器
export interface CollectionFilter {
  category?: string;
  ppeCategory?: string;
  country?: string;
  dateFrom?: Date;
  dateTo?: Date;
  keywords?: string[];
  certificationType?: CertificationType;
  lastId?: string;
}

// 采集进度
export interface CollectionProgress {
  taskId: string;
  currentPage: number;
  totalPages: number;
  processedRecords: number;
  totalRecords: number;
  percentage: number;
  status: TaskStatus;
  message?: string;
}

// 反爬策略配置
export interface AntiCrawlConfig {
  enabled: boolean;
  rotateUserAgent: boolean;
  rotateProxy: boolean;
  randomDelay: boolean;
  minDelay: number;
  maxDelay: number;
  simulateHuman: boolean;
  cookiePersistence: boolean;
}

// 代理配置
export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}
