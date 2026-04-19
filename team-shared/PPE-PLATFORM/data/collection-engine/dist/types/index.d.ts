export type DataSourceType = 'FDA' | 'EUDAMED' | 'NMPA' | 'PMDA' | 'TGA' | 'HealthCanada';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'full_import' | 'incremental_update' | 'manual_trigger';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';
export type CertificationType = 'FDA' | 'CE' | 'NMPA' | 'PMDA' | 'TGA' | 'HealthCanada';
export type PPECategory = 'I' | 'II' | 'III';
export type ProductCategory = '呼吸防护' | '头部防护' | '眼面防护' | '听力防护' | '手部防护' | '足部防护' | '身体防护' | '坠落防护' | '皮肤防护';
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
export interface CollectionLog {
    id: string;
    taskId: string;
    logLevel: LogLevel;
    message: string;
    details?: Record<string, any>;
    createdAt: Date;
}
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
export interface CollectorConfig {
    sourceType: DataSourceType;
    baseUrl: string;
    requestTimeout: number;
    retryAttempts: number;
    retryDelay: number;
    rateLimitPerSecond: number;
    rateLimitPerMinute: number;
    useProxy: boolean;
    proxyList?: string[];
    headless: boolean;
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
    batchSize: number;
    saveInterval: number;
}
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
export interface CollectionError {
    sourceId: string;
    sourceType: DataSourceType;
    error: string;
    timestamp: Date;
    retryable: boolean;
}
export interface PaginationParams {
    page: number;
    pageSize: number;
    totalPages?: number;
    totalRecords?: number;
}
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
export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
}
//# sourceMappingURL=index.d.ts.map