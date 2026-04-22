/**
 * PPE产品自动分类模型 - 主入口
 *
 * A-006: PPE产品自动分类模型
 */

// 导出类型
export type {
  ProductClassificationRequest,
  ClassificationResult,
  BatchClassificationRequest,
  BatchClassificationResponse,
  ClassificationModelConfig,
  TrainingSample,
  ModelEvaluationResult,
} from './types'

// 导出常量和枚举
export {
  PPECategory,
  CATEGORY_LABELS,
  CATEGORY_KEYWORDS,
  DEFAULT_CLASSIFICATION_CONFIG,
} from './types'

// 导出训练数据
export {
  TRAINING_DATASET,
  getSamplesByCategory,
  getAllTrainingSamples,
  getTrainingDataStats,
  exportTrainingDataToCSV,
} from './training-data'

// 导出分类器
export { PPEProductClassifier, ppeProductClassifier } from './classifier'
