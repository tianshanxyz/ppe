/**
 * PPE产品自动分类模型 - 分类器实现
 *
 * A-006: PPE产品自动分类模型
 *
 * 采用混合策略：
 * 1. 关键词匹配（快速规则）
 * 2. 相似度计算（编辑距离）
 * 3. LLM辅助分类（复杂情况）
 */

import {
  PPECategory,
  CATEGORY_LABELS,
  CATEGORY_KEYWORDS,
  ClassificationResult,
  ProductClassificationRequest,
  BatchClassificationRequest,
  BatchClassificationResponse,
  ClassificationModelConfig,
  DEFAULT_CLASSIFICATION_CONFIG,
  TrainingSample,
} from './types'
import { TRAINING_DATASET, getAllTrainingSamples } from './training-data'

/**
 * PPE产品分类器
 */
export class PPEProductClassifier {
  private config: ClassificationModelConfig
  private trainingData: TrainingSample[]

  constructor(config: Partial<ClassificationModelConfig> = {}) {
    this.config = { ...DEFAULT_CLASSIFICATION_CONFIG, ...config }
    this.trainingData = getAllTrainingSamples()
  }

  /**
   * 分类单个产品
   */
  async classify(request: ProductClassificationRequest): Promise<ClassificationResult> {
    const { product_name, product_description } = request
    const text = `${product_name} ${product_description || ''}`.toLowerCase().trim()

    // 1. 关键词匹配（最高优先级）
    const keywordResult = this.classifyByKeywords(text)
    if (keywordResult.confidence >= this.config.confidence_threshold) {
      return keywordResult
    }

    // 2. 相似度匹配（训练数据）
    const similarityResult = this.classifyBySimilarity(product_name)
    if (similarityResult.confidence >= this.config.confidence_threshold) {
      return similarityResult
    }

    // 3. 返回最佳结果（关键词或相似度）
    return keywordResult.confidence >= similarityResult.confidence
      ? keywordResult
      : similarityResult
  }

  /**
   * 批量分类
   */
  async classifyBatch(
    request: BatchClassificationRequest
  ): Promise<BatchClassificationResponse> {
    const startTime = Date.now()
    const results: ClassificationResult[] = []
    const failedIndices: number[] = []

    for (let i = 0; i < request.products.length; i++) {
      try {
        const result = await this.classify(request.products[i])
        results.push(result)
      } catch (error) {
        console.error(`分类产品 ${i} 失败:`, error)
        failedIndices.push(i)
        // 添加一个默认结果
        results.push({
          category: PPECategory.BODY_PROTECTION,
          confidence: 0,
          category_label: CATEGORY_LABELS[PPECategory.BODY_PROTECTION],
          all_scores: {} as Record<PPECategory, number>,
        })
      }
    }

    return {
      success: failedIndices.length === 0,
      results,
      failed_indices: failedIndices,
      processing_time_ms: Date.now() - startTime,
    }
  }

  /**
   * 基于关键词的分类
   */
  private classifyByKeywords(text: string): ClassificationResult {
    const scores: Record<PPECategory, number> = {} as Record<PPECategory, number>

    // 计算每个类别的匹配分数
    for (const category of Object.values(PPECategory)) {
      const keywords = CATEGORY_KEYWORDS[category]
      let score = 0

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase()
        // 完全匹配得分更高
        if (text === keywordLower) {
          score += 10
        } else if (text.includes(keywordLower)) {
          score += 5
        } else if (keywordLower.includes(text) && text.length > 2) {
          score += 2
        }
      }

      scores[category] = score
    }

    // 找出最高分
    let bestCategory = PPECategory.BODY_PROTECTION
    let maxScore = 0
    let totalScore = 0

    for (const [category, score] of Object.entries(scores)) {
      totalScore += score
      if (score > maxScore) {
        maxScore = score
        bestCategory = category as PPECategory
      }
    }

    // 计算置信度
    const confidence = totalScore > 0 ? maxScore / totalScore : 0

    return {
      category: bestCategory,
      confidence: Math.min(confidence, 1),
      category_label: {
        zh: CATEGORY_LABELS[bestCategory].zh,
        en: CATEGORY_LABELS[bestCategory].en,
      },
      all_scores: this.normalizeScores(scores),
    }
  }

  /**
   * 基于相似度的分类
   */
  private classifyBySimilarity(productName: string): ClassificationResult {
    const scores: Record<PPECategory, number> = {} as Record<PPECategory, number>
    const categoryMatches: Record<PPECategory, { sample: string; similarity: number }[]> = {} as Record<PPECategory, { sample: string; similarity: number }[]>

    // 初始化
    for (const category of Object.values(PPECategory)) {
      scores[category] = 0
      categoryMatches[category] = []
    }

    // 计算与训练数据的相似度
    for (const sample of this.trainingData) {
      const similarity = this.calculateSimilarity(productName, sample.product_name)
      categoryMatches[sample.category].push({
        sample: sample.product_name,
        similarity,
      })
      scores[sample.category] += similarity
    }

    // 找出最高分
    let bestCategory = PPECategory.BODY_PROTECTION
    let maxScore = 0
    let totalScore = 0

    for (const [category, score] of Object.entries(scores)) {
      totalScore += score
      if (score > maxScore) {
        maxScore = score
        bestCategory = category as PPECategory
      }
    }

    // 计算置信度
    const confidence = totalScore > 0 ? maxScore / totalScore : 0

    return {
      category: bestCategory,
      confidence: Math.min(confidence, 1),
      category_label: {
        zh: CATEGORY_LABELS[bestCategory].zh,
        en: CATEGORY_LABELS[bestCategory].en,
      },
      all_scores: this.normalizeScores(scores),
    }
  }

  /**
   * 计算字符串相似度（编辑距离归一化）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    // 完全匹配
    if (s1 === s2) return 1

    // 包含关系
    if (s1.includes(s2) || s2.includes(s1)) {
      const longer = s1.length > s2.length ? s1 : s2
      const shorter = s1.length > s2.length ? s2 : s1
      return shorter.length / longer.length * 0.8
    }

    // 编辑距离
    const distance = this.levenshteinDistance(s1, s2)
    const maxLength = Math.max(s1.length, s2.length)
    return 1 - distance / maxLength
  }

  /**
   * 计算Levenshtein编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length

    // 创建距离矩阵
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    // 初始化
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    // 填充矩阵
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // 删除
            dp[i][j - 1] + 1,     // 插入
            dp[i - 1][j - 1] + 1  // 替换
          )
        }
      }
    }

    return dp[m][n]
  }

  /**
   * 归一化分数
   */
  private normalizeScores(scores: Record<PPECategory, number>): Record<PPECategory, number> {
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) return scores

    const normalized: Record<PPECategory, number> = {} as Record<PPECategory, number>
    for (const [category, score] of Object.entries(scores)) {
      normalized[category as PPECategory] = score / maxScore
    }

    return normalized
  }

  /**
   * 更新训练数据
   */
  addTrainingSample(sample: TrainingSample): void {
    this.trainingData.push(sample)
  }

  /**
   * 获取分类器统计信息
   */
  getStats(): {
    training_samples: number
    config: ClassificationModelConfig
    categories: number
  } {
    return {
      training_samples: this.trainingData.length,
      config: this.config,
      categories: Object.values(PPECategory).length,
    }
  }
}

// 导出单例
export const ppeProductClassifier = new PPEProductClassifier()
