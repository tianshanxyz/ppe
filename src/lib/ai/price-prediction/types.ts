/**
 * 价格预测模型 - 类型定义
 * 预测PPE产品认证成本和市场价格趋势
 */

/**
 * 认证类型
 */
export enum CertificationType {
  FDA_510K = 'fda_510k',                    // FDA 510(k)
  FDA_PMA = 'fda_pma',                      // FDA PMA
  CE_MARK = 'ce_mark',                      // CE认证
  ISO_13485 = 'iso_13485',                  // ISO 13485
  NIOSH = 'niosh',                          // NIOSH认证
  GB_STANDARD = 'gb_standard',              // 国标
  JIS = 'jis',                              // 日本工业标准
  CSA = 'csa',                              // 加拿大标准
  TGA = 'tga',                              // 澳大利亚TGA
  ANVISA = 'anvisa',                        // 巴西ANVISA
}

/**
 * 产品类别
 */
export enum ProductCategory {
  RESPIRATORY = 'respiratory',              // 呼吸防护
  HAND_PROTECTION = 'hand_protection',      // 手部防护
  EYE_PROTECTION = 'eye_protection',        // 眼部防护
  BODY_PROTECTION = 'body_protection',      // 身体防护
  HEAD_PROTECTION = 'head_protection',      // 头部防护
  FOOT_PROTECTION = 'foot_protection',      // 足部防护
  HEARING_PROTECTION = 'hearing_protection', // 听力防护
  FALL_PROTECTION = 'fall_protection',      // 坠落防护
}

/**
 * 成本类型
 */
export enum CostType {
  APPLICATION_FEE = 'application_fee',      // 申请费
  TESTING_FEE = 'testing_fee',              // 测试费
  AUDIT_FEE = 'audit_fee',                  // 审核费
  CONSULTING_FEE = 'consulting_fee',        // 咨询费
  ANNUAL_FEE = 'annual_fee',                // 年费
  RENEWAL_FEE = 'renewal_fee',              // 续证费
}

/**
 * 市场区域
 */
export enum MarketRegion {
  US = 'us',                                // 美国
  EU = 'eu',                                // 欧盟
  CHINA = 'china',                          // 中国
  JAPAN = 'japan',                          // 日本
  UK = 'uk',                                // 英国
  CANADA = 'canada',                        // 加拿大
  AUSTRALIA = 'australia',                  // 澳大利亚
  BRAZIL = 'brazil',                        // 巴西
}

/**
 * 预测时间范围
 */
export enum PredictionTimeframe {
  SHORT_TERM = 'short_term',                // 短期 (1-3个月)
  MEDIUM_TERM = 'medium_term',              // 中期 (3-12个月)
  LONG_TERM = 'long_term',                  // 长期 (1-3年)
}

/**
 * 价格趋势方向
 */
export enum PriceTrend {
  INCREASING = 'increasing',                // 上涨
  DECREASING = 'decreasing',                // 下跌
  STABLE = 'stable',                        // 稳定
  VOLATILE = 'volatile',                    // 波动
}

/**
 * 认证成本项目
 */
export interface CertificationCostItem {
  cost_type: CostType
  min_cost: number                          // 最低成本 (USD)
  max_cost: number                          // 最高成本 (USD)
  typical_cost: number                      // 典型成本 (USD)
  currency: string                          // 货币代码
  notes?: string                            // 备注说明
}

/**
 * 认证成本预测
 */
export interface CertificationCostPrediction {
  certification_type: CertificationType
  product_category: ProductCategory
  market_region: MarketRegion
  total_cost_min: number                    // 总成本最低
  total_cost_max: number                    // 总成本最高
  total_cost_typical: number                // 总成本典型值
  cost_breakdown: CertificationCostItem[]   // 成本明细
  timeline_months_min: number               // 最短周期
  timeline_months_max: number               // 最长周期
  timeline_months_typical: number           // 典型周期
  confidence_score: number                  // 置信度 (0-1)
  last_updated: string                      // 最后更新时间
}

/**
 * 历史价格数据点
 */
export interface PriceDataPoint {
  date: string                              // 日期
  price: number                             // 价格
  volume?: number                           // 交易量
  source?: string                           // 数据来源
}

/**
 * 市场价格趋势
 */
export interface MarketPriceTrend {
  product_category: ProductCategory
  market_region: MarketRegion
  current_price: number                     // 当前价格
  price_unit: string                        // 价格单位
  trend: PriceTrend                         // 趋势方向
  trend_strength: number                    // 趋势强度 (0-1)
  change_percent_30d: number                // 30天变化百分比
  change_percent_90d: number                // 90天变化百分比
  change_percent_1y: number                 // 1年变化百分比
  historical_data: PriceDataPoint[]         // 历史数据
  forecast: PriceForecast[]                 // 价格预测
}

/**
 * 价格预测
 */
export interface PriceForecast {
  timeframe: PredictionTimeframe
  predicted_price: number                   // 预测价格
  confidence_interval_low: number           // 置信区间下限
  confidence_interval_high: number          // 置信区间上限
  confidence_score: number                  // 置信度
  factors: PriceFactor[]                    // 影响因素
}

/**
 * 价格影响因素
 */
export interface PriceFactor {
  factor_name: string                       // 因素名称
  impact_direction: 'positive' | 'negative' | 'neutral'  // 影响方向
  impact_weight: number                     // 影响权重 (0-1)
  description: string                       // 描述
}

/**
 * 成本预测请求
 */
export interface CostPredictionRequest {
  certification_type: CertificationType
  product_category: ProductCategory
  market_region: MarketRegion
  product_complexity?: 'low' | 'medium' | 'high'  // 产品复杂度
  company_size?: 'small' | 'medium' | 'large'    // 企业规模
  urgency_level?: 'normal' | 'urgent' | 'emergency'  // 紧急程度
}

/**
 * 价格趋势预测请求
 */
export interface PriceTrendRequest {
  product_category: ProductCategory
  market_region: MarketRegion
  timeframe: PredictionTimeframe
}

/**
 * 批量成本预测请求
 */
export interface BatchCostPredictionRequest {
  requests: CostPredictionRequest[]
}

/**
 * 成本优化建议
 */
export interface CostOptimizationSuggestion {
  suggestion_type: 'timing' | 'bundling' | 'alternative' | 'negotiation'
  title: string
  description: string
  potential_savings_percent: number         // 潜在节省百分比
  potential_savings_amount: number          // 潜在节省金额
  implementation_difficulty: 'easy' | 'medium' | 'hard'
  time_to_implement: string                 // 实施时间
}

/**
 * 价格预测结果
 */
export interface PricePredictionResult {
  cost_predictions: CertificationCostPrediction[]
  price_trends: MarketPriceTrend[]
  optimization_suggestions: CostOptimizationSuggestion[]
  generated_at: string
  valid_until: string
}

/**
 * 认证成本数据库记录
 */
export interface CertificationCostRecord {
  id: string
  certification_type: CertificationType
  product_category: ProductCategory
  market_region: MarketRegion
  cost_data: CertificationCostPrediction
  data_source: string
  recorded_at: string
  verified: boolean
}

/**
 * 价格监控配置
 */
export interface PriceMonitorConfig {
  id: string
  user_id: string
  product_category: ProductCategory
  market_region: MarketRegion
  price_threshold_low?: number              // 价格下限预警
  price_threshold_high?: number             // 价格上限预警
  alert_enabled: boolean
  check_interval_days: number
  created_at: string
}

/**
 * 价格预警
 */
export interface PriceAlert {
  id: string
  config_id: string
  alert_type: 'price_drop' | 'price_spike' | 'trend_change'
  product_category: ProductCategory
  market_region: MarketRegion
  current_price: number
  previous_price: number
  change_percent: number
  message: string
  created_at: string
  read: boolean
}

/**
 * 预测准确性指标
 */
export interface PredictionAccuracyMetrics {
  certification_type?: CertificationType
  product_category?: ProductCategory
  market_region?: MarketRegion
  total_predictions: number
  accurate_predictions: number
  accuracy_rate: number                     // 准确率
  mean_absolute_error: number               // 平均绝对误差
  mean_squared_error: number                // 均方误差
  r_squared: number                         // R² 决定系数
  evaluation_period_days: number
  last_evaluated_at: string
}
