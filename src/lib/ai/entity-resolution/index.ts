/**
 * 实体关联模型（企业去重）- 主入口
 *
 * A-007: 实体关联模型（企业去重）
 */

// 导出类型
export type {
  CompanyEntity,
  EntityCluster,
  EntityMatchResult,
  NormalizedName,
  SimilarityAlgorithm,
  EntityResolutionConfig,
  DEFAULT_ENTITY_RESOLUTION_CONFIG,
  EntityResolutionRequest,
  EntityResolutionResponse,
  EntityQueryRequest,
  EntityGraph,
  EntityGraphNode,
  EntityGraphEdge,
} from './types'

// 导出常量
export {
  LEGAL_SUFFIXES,
  ABBREVIATION_MAP,
  PHONETIC_MAP,
} from './types'

// 导出标准化器
export { CompanyNameNormalizer, companyNameNormalizer } from './normalizer'

// 导出相似度计算器
export { SimilarityCalculator, similarityCalculator } from './similarity'

// 导出聚类器
export { EntityClustering, entityClustering } from './clustering'

// 导出解析引擎
export { EntityResolutionEngine, entityResolutionEngine } from './engine'
