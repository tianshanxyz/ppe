/**
 * PPE产品自动分类模型 - 主入口
 *
 * A-006: PPE产品自动分类模型
 */

// 导出类型
export {
  PPECategory,
  CATEGORY_LABELS,
  CATEGORY_KEYWORDS,
  ProductClassificationRequest,
  ClassificationResult,
  BatchClassificationRequest,
  BatchClassificationResponse,
  ClassificationModelConfig,
  DEFAULT_CLASSIFICATION_CONFIG,
  TrainingSample,
  ModelEvaluationResult,
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
