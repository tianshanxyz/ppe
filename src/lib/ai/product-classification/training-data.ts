/**
 * PPE产品自动分类模型 - 训练数据集
 *
 * A-006: PPE产品自动分类模型
 */

import { PPECategory, TrainingSample } from './types'

/**
 * 训练数据集 - 基于实际产品名称和描述
 * 每个类别包含多样化的样本，覆盖中英文
 */
export const TRAINING_DATASET: TrainingSample[] = [
  // ========== 呼吸防护 (Respiratory Protection) ==========
  { product_name: 'N95口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'KN95防护口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '医用外科口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'FFP2防护口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'FFP3防尘口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'N99高效过滤口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '防尘口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '防毒面具', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '半面型呼吸器', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '全面型呼吸器', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '电动送风呼吸器', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '自给式呼吸器 SCBA', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '过滤式防颗粒物呼吸器', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: '活性炭口罩', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'N95 Respirator Mask', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'Surgical Face Mask', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'Disposable Dust Mask', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'Gas Mask with Filter', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'Powered Air Purifying Respirator', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },
  { product_name: 'Half Face Respirator', category: PPECategory.RESPIRATORY_PROTECTION, source: 'sample' },

  // ========== 手部防护 (Hand Protection) ==========
  { product_name: '丁腈手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '乳胶手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'PVC防护手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '医用手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '检查手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '手术手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '防切割手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '防化手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '耐热手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '绝缘手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '防滑手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '防静电手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '棉纱手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: '皮革手套', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'Nitrile Gloves', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'Latex Examination Gloves', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'Vinyl Disposable Gloves', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'Cut Resistant Gloves', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'Chemical Resistant Gloves', category: PPECategory.HAND_PROTECTION, source: 'sample' },
  { product_name: 'Heat Resistant Welding Gloves', category: PPECategory.HAND_PROTECTION, source: 'sample' },

  // ========== 眼部防护 (Eye Protection) ==========
  { product_name: '护目镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '防护眼镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '安全眼镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '防冲击眼镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '防化护目镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '防雾护目镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '面屏', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '防护面罩', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '焊接面罩', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '激光防护眼镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: '防紫外线眼镜', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: 'Safety Goggles', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: 'Protective Eyewear', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: 'Face Shield Visor', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: 'Welding Helmet Mask', category: PPECategory.EYE_PROTECTION, source: 'sample' },
  { product_name: 'Anti-Fog Safety Glasses', category: PPECategory.EYE_PROTECTION, source: 'sample' },

  // ========== 身体防护 (Body Protection) ==========
  { product_name: '防护服', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '一次性防护服', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '防化服', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '隔离衣', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '手术衣', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '反光衣', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '反光背心', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '高可视性服装', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '阻燃防护服', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '防静电工作服', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '防辐射服', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '围裙', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: '工作围裙', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: 'Disposable Coverall', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: 'Chemical Protective Suit', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: 'High Visibility Vest', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: 'Flame Resistant Coverall', category: PPECategory.BODY_PROTECTION, source: 'sample' },
  { product_name: 'Surgical Isolation Gown', category: PPECategory.BODY_PROTECTION, source: 'sample' },

  // ========== 头部防护 (Head Protection) ==========
  { product_name: '安全帽', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '工地安全帽', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '电工安全帽', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '防撞帽', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '头盔', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '防护头盔', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '面罩', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: '防护面罩', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: 'Hard Hat', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: 'Safety Helmet', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: 'Bump Cap', category: PPECategory.HEAD_PROTECTION, source: 'sample' },
  { product_name: 'Face Shield with Headgear', category: PPECategory.HEAD_PROTECTION, source: 'sample' },

  // ========== 足部防护 (Foot Protection) ==========
  { product_name: '安全鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '防护靴', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '安全靴', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '防砸鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '防穿刺鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '绝缘鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '防静电鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '防滑鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '耐油鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: '钢头鞋', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: 'Safety Shoes', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: 'Steel Toe Boots', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: 'Safety Work Boots', category: PPECategory.FOOT_PROTECTION, source: 'sample' },
  { product_name: 'Electrical Hazard Boots', category: PPECategory.FOOT_PROTECTION, source: 'sample' },

  // ========== 听力防护 (Hearing Protection) ==========
  { product_name: '耳塞', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '防噪音耳塞', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '一次性耳塞', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '硅胶耳塞', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '耳罩', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '隔音耳罩', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '降噪耳罩', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: '挂耳式耳罩', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: 'Ear Plugs', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: 'Foam Earplugs', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: 'Ear Muffs', category: PPECategory.HEARING_PROTECTION, source: 'sample' },
  { product_name: 'Noise Cancelling Earmuffs', category: PPECategory.HEARING_PROTECTION, source: 'sample' },

  // ========== 坠落防护 (Fall Protection) ==========
  { product_name: '安全带', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '全身安全带', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '半身安全带', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '安全绳', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '缓冲安全绳', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '定位绳', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '防坠器', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '速差防坠器', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '安全网', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: '水平安全网', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: 'Safety Harness', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: 'Full Body Harness', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: 'Safety Lanyard', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: 'Shock Absorbing Lanyard', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: 'Self Retracting Lifeline', category: PPECategory.FALL_PROTECTION, source: 'sample' },
  { product_name: 'Safety Net', category: PPECategory.FALL_PROTECTION, source: 'sample' },
]

/**
 * 按类别获取训练样本
 */
export function getSamplesByCategory(category: PPECategory): TrainingSample[] {
  return TRAINING_DATASET.filter((sample) => sample.category === category)
}

/**
 * 获取所有训练样本
 */
export function getAllTrainingSamples(): TrainingSample[] {
  return TRAINING_DATASET
}

/**
 * 获取训练数据统计
 */
export function getTrainingDataStats(): {
  total: number
  byCategory: Record<PPECategory, number>
} {
  const byCategory = {} as Record<PPECategory, number>

  Object.values(PPECategory).forEach((category) => {
    byCategory[category] = TRAINING_DATASET.filter(
      (sample) => sample.category === category
    ).length
  })

  return {
    total: TRAINING_DATASET.length,
    byCategory,
  }
}

/**
 * 导出训练数据为CSV格式
 */
export function exportTrainingDataToCSV(): string {
  const headers = ['product_name', 'product_description', 'category', 'source']
  const rows = TRAINING_DATASET.map((sample) => [
    sample.product_name,
    sample.product_description || '',
    sample.category,
    sample.source || 'sample',
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}
