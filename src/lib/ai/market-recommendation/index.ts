/**
 * 市场准入推荐引擎 - 主入口
 *
 * A-004: 市场准入推荐引擎
 */

// 导出类型
export type {
  ProductInfo,
  CompanyProfile,
  ExistingCertification,
  BudgetConstraint,
  TimelineConstraint,
  MarketInfo,
  MarketRecommendation,
  RequiredCertification,
  MarketRecommendationRequest,
  MarketRecommendationResponse,
  MarketComparisonMatrix,
  ScoringWeights,
} from './types'

// 导出常量
export {
  DEFAULT_SCORING_WEIGHTS,
} from './types'

// 导出市场数据
export {
  MARKETS,
  PRODUCT_TYPE_REQUIREMENTS,
  CERTIFICATION_RECIPROCITY,
  CERTIFICATION_DETAILS,
  getMarketInfo,
  getAllMarkets,
  getMarketsByRegion,
  getProductTypeRequirements,
  getCertificationReciprocity,
} from './market-data'

// 导出推荐引擎
export {
  MarketRecommendationEngine,
  marketRecommendationEngine,
} from './engine'
