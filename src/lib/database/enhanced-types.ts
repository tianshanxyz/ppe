/**
 * 增强版PPE数据类型定义
 * 
 * 任务D-001: 完善PPE产品数据模型
 * 任务D-002: 扩展制造商档案模型
 * 创建时间: 2026-04-20
 */

// ============================================
// 产品技术规格
// ============================================

export interface ProductSpecifications {
  // 物理规格
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'mm' | 'cm' | 'm' | 'inch'
  }
  weight?: {
    value: number
    unit: 'g' | 'kg' | 'oz' | 'lb'
  }
  material?: string
  color?: string[]
  
  // 性能规格
  filtration_efficiency?: number  // 过滤效率（如N95的95%）
  protection_level?: string       // 防护等级
  breathability?: number         // 透气性指数
  fluid_resistance?: string      // 抗液体渗透
  
  // 包装规格
  packaging?: {
    quantity_per_box: number
    boxes_per_carton: number
    carton_dimensions?: string
  }
  
  // 存储条件
  storage_conditions?: {
    temperature_range?: string
    humidity_range?: string
    shelf_life_months?: number
  }
}

// ============================================
// 认证详情
// ============================================

export interface CE {
  certificate_number: string
  notified_body: {
    name: string
    code: string
    country: string
  }
  directive: string           // 如: MDR 2017/745, PPE 2016/425
  classification: string      // 如: Class I, Class IIa
  issue_date: string
  expiry_date: string
  scope: string               // 认证范围描述
  status: 'active' | 'expired' | 'suspended' | 'withdrawn'
  verification_url?: string
}

export interface FDA510kDetail {
  k_number: string
  device_name: string
  applicant: string
  decision: string            // 如: Substantially Equivalent
  decision_date: string
  product_code: string
  device_class: 'I' | 'II' | 'III'
  summary_url?: string
  statement_url?: string
  predicates?: string[]       // 对比的已有产品
  indications?: string[]      // 适应症/用途
  status: 'active' | 'inactive'
}

export interface NMPARegistrationDetail {
  registration_number: string
  product_name_cn: string
  product_name_en?: string
  registrant: string
  registrant_address: string
  manufacturing_address: string
  classification: string      // 如: II类医疗器械
  approval_date: string
  expiry_date: string
  scope: string
  status: 'active' | 'expired' | 'cancelled'
}

export interface UKCADetail {
  certificate_number: string
  approved_body: {
    name: string
    number: string
  }
  regulation: string
  issue_date: string
  expiry_date: string
  status: 'active' | 'expired'
}

export interface OtherCertification {
  type: string                // ISO, TGA, PMDA等
  certificate_number: string
  issuer: string
  issue_date: string
  expiry_date?: string
  status: 'active' | 'expired'
  document_url?: string
}

// ============================================
// 增强版产品类型
// ============================================

export interface EnhancedPPEProduct {
  // 基础信息
  id: string
  product_name: string
  product_name_zh?: string
  product_code: string
  product_category: string
  sub_category: string
  ppe_category: 'I' | 'II' | 'III'
  
  // 详细描述
  description: string
  description_zh?: string
  intended_use: string[]      // 预期用途
  target_users: string[]      // 目标用户群体
  
  // 技术规格（结构化）
  specifications: ProductSpecifications
  
  // 产品特性
  features: {
    key_features: string[]
    advantages: string[]
    certifications_highlight: string[]
  }
  
  // 图片资源
  images: {
    main_image: string
    gallery: string[]
    certification_documents: string[]
    test_reports: string[]
  }
  
  // 制造商信息
  manufacturer_id: string
  manufacturer_name: string
  manufacturer_name_zh?: string
  manufacturer_address: string
  manufacturer_country: string
  brand_name: string
  
  // 认证详情（完整结构化）
  certifications: {
    ce?: CE
    fda_510k?: FDA510kDetail
    nmpa?: NMPARegistrationDetail
    ukca?: UKCADetail
    others?: OtherCertification[]
  }
  
  // 目标市场
  target_markets: string[]
  market_approvals: {
    market_code: string
    approval_status: 'approved' | 'pending' | 'not_required'
    approval_date?: string
    expiry_date?: string
  }[]
  
  // 注册状态
  registration_status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending'
  
  // 适用法规和标准
  applicable_regulations: string[]
  harmonized_standards: {
    standard_number: string
    standard_name: string
    version: string
  }[]
  
  // 风险分类
  risk_classification: string
  
  // 基本要求合规
  essential_requirements: {
    requirement_id: string
    description: string
    compliance_status: 'compliant' | 'not_applicable' | 'pending'
    evidence_reference?: string
  }[]
  
  // 性能指标
  performance_metrics: {
    metric_name: string
    value: number | string
    unit?: string
    test_method?: string
    test_date?: string
  }[]
  
  // 测试报告
  test_reports: {
    report_id: string
    test_type: string
    laboratory: string
    test_date: string
    result: 'pass' | 'fail' | 'inconclusive'
    document_url?: string
  }[]
  
  // 时间戳
  approval_date: string
  expiry_date: string
  created_at: string
  updated_at: string
  last_sync_at: string
  
  // 数据质量
  data_quality_score: number  // 0-100
  data_completeness: {        // 各字段完整度
    basic_info: number
    specifications: number
    certifications: number
    test_reports: number
  }
}

// ============================================
// 制造商信用评分
// ============================================

export interface ManufacturerCreditScore {
  overall_score: number       // 0-100
  last_calculated: string
  
  // 评分维度
  dimensions: {
    compliance_history: {      // 合规历史分 (40%)
      score: number
      total_certifications: number
      active_certifications: number
      avg_certification_duration_days: number
      first_certification_date?: string
    }
    risk_events: {             // 风险事件分 (30%)
      score: number
      recalls_count: number
      warning_letters_count: number
      import_alerts_count: number
      last_incident_date?: string
    }
    activity: {                // 活跃度分 (20%)
      score: number
      certifications_last_year: number
      new_markets_last_year: number
      last_activity_date?: string
    }
    diversity: {               // 多样性分 (10%)
      score: number
      market_count: number
      product_category_count: number
      certification_type_count: number
    }
  }
  
  // 风险评级
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: string[]
  
  // 历史趋势
  score_history: {
    date: string
    score: number
  }[]
}

// ============================================
// 增强版制造商类型
// ============================================

export interface EnhancedPPEManufacturer {
  // 基础信息
  id: string
  company_name: string
  company_name_en?: string
  company_name_zh?: string
  
  // 公司注册信息
  registration_info: {
    registration_number?: string
    registration_country: string
    registration_date?: string
    legal_form?: string          // 如: GmbH, Ltd, Inc.
  }
  
  // 地址信息
  headquarters_address: {
    street?: string
    city: string
    state_province?: string
    postal_code?: string
    country: string
    full_address: string
  }
  
  // 联系方式
  contact: {
    website?: string
    email?: string
    phone?: string
    fax?: string
  }
  
  // 业务类型
  business_type: 'manufacturer' | 'distributor' | 'agent' | 'retailer' | 'oem'
  
  // 公司规模
  company_size?: {
    employee_count?: number
    annual_revenue_usd?: number
    production_capacity?: string
  }
  
  // 生产能力
  capabilities: {
    product_categories: string[]
    certifications_held: string[]
    production_facilities?: {
      location: string
      certifications: string[]
    }[]
    quality_systems?: string[]   // ISO 9001, ISO 13485等
  }
  
  // 公司描述
  description: string
  description_zh?: string
  
  // 信用评分
  credit_score?: ManufacturerCreditScore
  
  // 合规统计
  compliance_stats: {
    total_products: number
    active_products: number
    total_certifications: number
    active_certifications: number
    markets_served: string[]
    
    // 风险统计
    recalls_history: {
      total_recalls: number
      last_recall_date?: string
      recall_details?: {
        date: string
        product: string
        reason: string
        severity: 'low' | 'medium' | 'high'
      }[]
    }
    
    warning_letters?: {
      total: number
      last_date?: string
      open_count: number
    }
  }
  
  // 关联企业
  related_companies?: {
    company_id: string
    company_name: string
    relationship: 'parent' | 'subsidiary' | 'sibling' | 'affiliate'
    ownership_percentage?: number
  }[]
  
  // 时间戳
  created_at: string
  updated_at: string
  last_sync_at: string
  
  // 数据验证
  data_verified: boolean
  verification_date?: string
  data_quality_score: number
}

// ============================================
// 数据同步状态
// ============================================

export interface DataSyncStatus {
  id: string
  data_source: 'fda' | 'eudamed' | 'nmpa' | 'ukca' | 'pmda' | 'health_canada' | 'tga' | 'other'
  source_name: string
  
  // 同步配置
  sync_config: {
    sync_type: 'full' | 'incremental'
    sync_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
    sync_schedule?: string       // cron表达式
    api_endpoint?: string
    last_successful_sync?: string
  }
  
  // 同步状态
  last_sync_at?: string
  last_sync_status: 'success' | 'failed' | 'running' | 'pending'
  last_sync_duration_ms?: number
  last_sync_records_count?: number
  
  // 错误信息
  last_error?: {
    message: string
    code?: string
    timestamp: string
    retry_count: number
  }
  
  // 统计信息
  stats: {
    total_records: number
    new_records_last_sync: number
    updated_records_last_sync: number
    failed_records_last_sync: number
  }
  
  // 健康度
  health_status: 'healthy' | 'degraded' | 'unhealthy'
  health_check_at?: string
  
  created_at: string
  updated_at: string
}

// ============================================
// 数据库表名常量
// ============================================

export const DB_TABLES = {
  PRODUCTS: 'ppe_products',
  PRODUCTS_ENHANCED: 'ppe_products_enhanced',
  MANUFACTURERS: 'ppe_manufacturers',
  MANUFACTURERS_ENHANCED: 'ppe_manufacturers_enhanced',
  REGULATIONS: 'ppe_regulations',
  SYNC_STATUS: 'data_sync_status',
  SEARCH_LOGS: 'search_logs',
  USER_FAVORITES: 'user_favorites',
  ALERTS: 'user_alerts',
} as const

// ============================================
// 辅助类型
// ============================================

export type MarketCode = 
  | 'US' | 'EU' | 'UK' | 'CN' | 'JP' 
  | 'CA' | 'AU' | 'KR' | 'BR' | 'IN'
  | 'RU' | 'MX' | 'SG' | 'MY' | 'TH'
  | 'VN' | 'ID' | 'PH' | 'TW' | 'HK'

export type CertificationType = 
  | 'CE' | 'FDA_510K' | 'FDA_PMA' | 'NMPA' 
  | 'UKCA' | 'PMDA' | 'TGA' | 'HealthCanada'
  | 'ISO_9001' | 'ISO_13485' | 'ISO_14001'

export type PPECategory = 'I' | 'II' | 'III'

export type RegistrationStatus = 
  | 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending'
