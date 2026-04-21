/**
 * 法规变更影响分析系统 - 类型定义
 *
 * A-008: 法规变更影响分析
 */

/**
 * 法规变更类型
 */
export enum RegulationChangeType {
  NEW = 'new',                    // 新法规
  AMENDED = 'amended',            // 修订
  REPEALED = 'repealed',          // 废止
  INTERPRETATION = 'interpretation', // 解释说明
  GUIDANCE = 'guidance',          // 指导文件
}

/**
 * 影响严重程度
 */
export enum ImpactSeverity {
  CRITICAL = 'critical',          // 严重 - 必须立即采取行动
  HIGH = 'high',                  // 高 - 需要尽快处理
  MEDIUM = 'medium',              // 中 - 需要关注
  LOW = 'low',                    // 低 - 一般性了解
}

/**
 * 影响范围
 */
export enum ImpactScope {
  PRODUCT = 'product',            // 产品级别
  COMPANY = 'company',            // 企业级别
  CATEGORY = 'category',          // 类别级别
  MARKET = 'market',              // 市场级别
  GLOBAL = 'global',              // 全局级别
}

/**
 * 法规变更记录
 */
export interface RegulationChange {
  id: string
  regulation_id: string
  regulation_title: string
  jurisdiction: string
  change_type: RegulationChangeType
  change_summary: string
  changed_fields: string[]
  previous_version?: string
  current_version: string
  effective_date: string
  announced_date: string
  source_url?: string
  keywords: string[]
  confidence: number
  created_at: string
}

/**
 * 受影响的产品
 */
export interface AffectedProduct {
  product_id: string
  product_name: string
  manufacturer_id: string
  manufacturer_name: string
  impact_severity: ImpactSeverity
  impact_description: string
  required_actions: string[]
  deadline?: string
  estimated_cost?: number
}

/**
 * 受影响的企业
 */
export interface AffectedCompany {
  company_id: string
  company_name: string
  impact_severity: ImpactSeverity
  impact_description: string
  affected_products_count: number
  affected_markets: string[]
  required_actions: string[]
  estimated_compliance_cost: number
  estimated_timeline_days: number
}

/**
 * 影响分析结果
 */
export interface ImpactAnalysis {
  change: RegulationChange
  scope: ImpactScope
  severity: ImpactSeverity
  affected_products: AffectedProduct[]
  affected_companies: AffectedCompany[]
  affected_categories: string[]
  affected_markets: string[]
  summary: string
  recommendations: string[]
  analysis_timestamp: string
}

/**
 * 影响报告
 */
export interface ImpactReport {
  id: string
  title: string
  description: string
  changes_analyzed: RegulationChange[]
  total_affected_products: number
  total_affected_companies: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  analysis_results: ImpactAnalysis[]
  generated_at: string
  valid_until: string
}

/**
 * 监控配置
 */
export interface MonitoringConfig {
  jurisdictions: string[]          // 监控的司法管辖区
  categories: string[]             // 监控的产品类别
  keywords: string[]               // 监控的关键词
  check_interval_hours: number     // 检查间隔（小时）
  alert_threshold: ImpactSeverity  // 告警阈值
  notification_channels: string[]  // 通知渠道
}

/**
 * 监控任务
 */
export interface MonitoringTask {
  id: string
  name: string
  config: MonitoringConfig
  last_check_at?: string
  last_change_detected?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 影响分析请求
 */
export interface ImpactAnalysisRequest {
  change: RegulationChange
  analysis_depth: 'basic' | 'detailed' | 'comprehensive'
  include_historical_data: boolean
  max_results?: number
}

/**
 * 影响查询请求
 */
export interface ImpactQueryRequest {
  regulation_id?: string
  jurisdiction?: string
  severity?: ImpactSeverity
  scope?: ImpactScope
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

/**
 * 默认监控配置
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  jurisdictions: ['US', 'EU', 'CN', 'JP', 'UK'],
  categories: [
    'Respiratory Protection',
    'Hand Protection',
    'Eye Protection',
    'Body Protection',
    'Head Protection',
    'Foot Protection',
    'Hearing Protection',
    'Fall Protection',
  ],
  keywords: ['PPE', 'certification', 'standard', 'compliance', 'safety'],
  check_interval_hours: 24,
  alert_threshold: ImpactSeverity.MEDIUM,
  notification_channels: ['email', 'dashboard'],
}

/**
 * 法规变更类型标签
 */
export const CHANGE_TYPE_LABELS: Record<RegulationChangeType, string> = {
  [RegulationChangeType.NEW]: '新法规',
  [RegulationChangeType.AMENDED]: '修订',
  [RegulationChangeType.REPEALED]: '废止',
  [RegulationChangeType.INTERPRETATION]: '解释说明',
  [RegulationChangeType.GUIDANCE]: '指导文件',
}

/**
 * 严重程度标签
 */
export const SEVERITY_LABELS: Record<ImpactSeverity, string> = {
  [ImpactSeverity.CRITICAL]: '严重',
  [ImpactSeverity.HIGH]: '高',
  [ImpactSeverity.MEDIUM]: '中',
  [ImpactSeverity.LOW]: '低',
}

/**
 * 严重程度颜色
 */
export const SEVERITY_COLORS: Record<ImpactSeverity, string> = {
  [ImpactSeverity.CRITICAL]: '#dc2626',
  [ImpactSeverity.HIGH]: '#ea580c',
  [ImpactSeverity.MEDIUM]: '#ca8a04',
  [ImpactSeverity.LOW]: '#16a34a',
}

/**
 * 影响范围标签
 */
export const SCOPE_LABELS: Record<ImpactScope, string> = {
  [ImpactScope.PRODUCT]: '产品级别',
  [ImpactScope.COMPANY]: '企业级别',
  [ImpactScope.CATEGORY]: '类别级别',
  [ImpactScope.MARKET]: '市场级别',
  [ImpactScope.GLOBAL]: '全局级别',
}
