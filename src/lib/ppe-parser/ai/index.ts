/**
 * PPE 智能解析系统 - AI 模块
 * Phase 3: AI 模型集成
 */

// AI-002: 自动分类模型
export {
  Classifier,
  createClassifier,
} from './Classifier';
export type {
  PPECategory,
  DeviceClass,
  ClassificationResult,
  ClassificationInput,
  ClassifierConfig,
} from './Classifier';

// AI-003: 实体识别模型
export {
  EntityExtractor,
} from './EntityExtractor';
export type {
  EntityType,
  Entity,
  EntityExtractionResult,
  EntityExtractionInput,
  EntityExtractorConfig,
} from './EntityExtractor';

// AI-004: 相似度匹配模型
export {
  SimilarityMatcher,
} from './SimilarityMatcher';
export type {
  SimilarityType,
  MatchType,
  ProductInfo,
  SimilarityScore,
  SimilarityResult,
  SimilarityInput,
  BatchMatchInput,
  BatchMatchResult,
} from './SimilarityMatcher';

// AI-005: 评估算法
export {
  ComplianceEvaluator,
} from './ComplianceEvaluator';
export type {
  EvaluationDimension,
  RiskLevel,
  EvaluationStatus,
  ProductComplianceInfo,
  EvaluationResult,
  EvaluationInput,
  BatchEvaluationInput,
  BatchEvaluationResult,
} from './ComplianceEvaluator';

// AI-006: 推荐算法
export {
  RecommendationEngine,
} from './RecommendationEngine';
export type {
  RecommendationType,
  RecommendationScenario,
  RecommendationItem,
  RecommendationResult,
  RecommendationInput,
  CompliancePathRecommendation,
  SupplierRecommendation,
} from './RecommendationEngine';
