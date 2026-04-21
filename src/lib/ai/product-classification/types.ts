/**
 * PPE产品自动分类模型 - 类型定义
 *
 * A-006: PPE产品自动分类模型
 */

/**
 * PPE产品分类体系
 */
export enum PPECategory {
  HEAD_PROTECTION = 'head_protection',           // 头部防护
  RESPIRATORY_PROTECTION = 'respiratory_protection', // 呼吸防护
  EYE_PROTECTION = 'eye_protection',             // 眼部防护
  HEARING_PROTECTION = 'hearing_protection',     // 听力防护
  HAND_PROTECTION = 'hand_protection',           // 手部防护
  FOOT_PROTECTION = 'foot_protection',           // 足部防护
  BODY_PROTECTION = 'body_protection',           // 身体防护
  FALL_PROTECTION = 'fall_protection',           // 坠落防护
}

/**
 * 分类标签映射
 */
export const CATEGORY_LABELS: Record<PPECategory, { zh: string; en: string; description: string }> = {
  [PPECategory.HEAD_PROTECTION]: {
    zh: '头部防护',
    en: 'Head Protection',
    description: '安全帽、面罩、头盔等',
  },
  [PPECategory.RESPIRATORY_PROTECTION]: {
    zh: '呼吸防护',
    en: 'Respiratory Protection',
    description: '口罩、呼吸器、防毒面具等',
  },
  [PPECategory.EYE_PROTECTION]: {
    zh: '眼部防护',
    en: 'Eye Protection',
    description: '护目镜、面屏、防护眼镜等',
  },
  [PPECategory.HEARING_PROTECTION]: {
    zh: '听力防护',
    en: 'Hearing Protection',
    description: '耳塞、耳罩等',
  },
  [PPECategory.HAND_PROTECTION]: {
    zh: '手部防护',
    en: 'Hand Protection',
    description: '防护手套、医用手套等',
  },
  [PPECategory.FOOT_PROTECTION]: {
    zh: '足部防护',
    en: 'Foot Protection',
    description: '安全鞋、防护靴等',
  },
  [PPECategory.BODY_PROTECTION]: {
    zh: '身体防护',
    en: 'Body Protection',
    description: '防护服、反光衣、围裙等',
  },
  [PPECategory.FALL_PROTECTION]: {
    zh: '坠落防护',
    en: 'Fall Protection',
    description: '安全带、安全绳、防坠器等',
  },
}

/**
 * 产品分类请求
 */
export interface ProductClassificationRequest {
  product_name: string
  product_description?: string
  product_image_url?: string
}

/**
 * 分类结果
 */
export interface ClassificationResult {
  category: PPECategory
  confidence: number
  category_label: {
    zh: string
    en: string
  }
  all_scores: Record<PPECategory, number>
}

/**
 * 批量分类请求
 */
export interface BatchClassificationRequest {
  products: ProductClassificationRequest[]
}

/**
 * 批量分类响应
 */
export interface BatchClassificationResponse {
  success: boolean
  results: ClassificationResult[]
  failed_indices: number[]
  processing_time_ms: number
  error?: string
}

/**
 * 分类模型配置
 */
export interface ClassificationModelConfig {
  model_name: string
  model_path?: string
  confidence_threshold: number
  use_gpu: boolean
  batch_size: number
  max_length: number
}

/**
 * 默认配置
 */
export const DEFAULT_CLASSIFICATION_CONFIG: ClassificationModelConfig = {
  model_name: 'distilbert-base-multilingual-cased',
  confidence_threshold: 0.7,
  use_gpu: false,
  batch_size: 32,
  max_length: 128,
}

/**
 * 训练样本
 */
export interface TrainingSample {
  product_name: string
  product_description?: string
  category: PPECategory
  source?: string
}

/**
 * 模型评估结果
 */
export interface ModelEvaluationResult {
  accuracy: number
  precision: Record<PPECategory, number>
  recall: Record<PPECategory, number>
  f1_score: Record<PPECategory, number>
  confusion_matrix: number[][]
  overall_f1: number
  support: Record<PPECategory, number>
}

/**
 * 分类关键词映射（用于规则引擎）
 */
export const CATEGORY_KEYWORDS: Record<PPECategory, string[]> = {
  [PPECategory.HEAD_PROTECTION]: [
    '安全帽', '头盔', 'helmet', 'hard hat', 'head protection',
    '面罩', 'face shield', '防护帽', 'bump cap',
  ],
  [PPECategory.RESPIRATORY_PROTECTION]: [
    '口罩', 'mask', 'respirator', '呼吸器', '防毒面具', 'gas mask',
    'N95', 'KN95', 'FFP2', 'FFP3', 'N99', 'N100',
    '防尘口罩', 'dust mask', '医用口罩', 'surgical mask',
    '过滤式呼吸器', '空气净化', 'air purifying',
  ],
  [PPECategory.EYE_PROTECTION]: [
    '护目镜', 'goggles', '防护眼镜', 'safety glasses',
    '面屏', 'face shield', '面罩', '眼部防护', 'eye protection',
    '防冲击眼镜', '防化眼镜', '焊接面罩', 'welding helmet',
  ],
  [PPECategory.HEARING_PROTECTION]: [
    '耳塞', 'earplug', '耳罩', 'earmuff', 'hearing protection',
    '听力防护', '降噪耳塞', 'noise reduction',
  ],
  [PPECategory.HAND_PROTECTION]: [
    '手套', 'glove', '防护手套', '医用手套', 'medical glove',
    '丁腈手套', 'nitrile', '乳胶手套', 'latex', 'PVC手套',
    '防切割手套', 'cut resistant', '防化手套', 'chemical resistant',
    '耐热手套', 'heat resistant', '绝缘手套', 'electrical',
  ],
  [PPECategory.FOOT_PROTECTION]: [
    '安全鞋', 'safety shoe', '防护靴', 'safety boot',
    '足部防护', 'foot protection', '防砸鞋', '防穿刺',
    '绝缘鞋', '防静电鞋', '防滑鞋', '钢头鞋', 'steel toe',
  ],
  [PPECategory.BODY_PROTECTION]: [
    '防护服', 'protective clothing', '防护衣', 'suit',
    '反光衣', 'high visibility', '反光背心', 'reflective vest',
    '防化服', 'chemical suit', '隔离衣', 'isolation gown',
    '手术衣', 'surgical gown', '围裙', 'apron',
    '防辐射服', 'radiation protection',
  ],
  [PPECategory.FALL_PROTECTION]: [
    '安全带', 'safety harness', '安全绳', 'lanyard',
    '防坠器', 'fall arrester', '坠落防护', 'fall protection',
    '安全网', 'safety net', '缓冲绳', 'shock absorber',
    '定位绳', 'positioning lanyard',
  ],
}
