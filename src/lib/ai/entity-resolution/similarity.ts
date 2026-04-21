/**
 * 实体关联模型（企业去重）- 相似度计算
 *
 * A-007: 实体关联模型（企业去重）
 */

import { SimilarityAlgorithm, EntityMatchResult, CompanyEntity } from './types'
import { companyNameNormalizer } from './normalizer'

/**
 * 相似度计算器
 */
export class SimilarityCalculator {
  private algorithm: SimilarityAlgorithm

  constructor(algorithm: SimilarityAlgorithm = SimilarityAlgorithm.HYBRID) {
    this.algorithm = algorithm
  }

  /**
   * 计算两个企业名称的相似度
   */
  calculate(name1: string, name2: string): number {
    switch (this.algorithm) {
      case SimilarityAlgorithm.LEVENSHTEIN:
        return this.levenshteinSimilarity(name1, name2)
      case SimilarityAlgorithm.JARO_WINKLER:
        return this.jaroWinklerSimilarity(name1, name2)
      case SimilarityAlgorithm.COSINE:
        return this.cosineSimilarity(name1, name2)
      case SimilarityAlgorithm.JACCARD:
        return this.jaccardSimilarity(name1, name2)
      case SimilarityAlgorithm.HYBRID:
      default:
        return this.hybridSimilarity(name1, name2)
    }
  }

  /**
   * Levenshtein相似度（编辑距离归一化）
   */
  levenshteinSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0

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

    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          )
        }
      }
    }

    return dp[m][n]
  }

  /**
   * Jaro-Winkler相似度（适合短字符串）
   */
  jaroWinklerSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0

    const jaro = this.jaroSimilarity(s1, s2)
    const prefixScale = 0.1
    const maxPrefix = 4

    let prefix = 0
    for (let i = 0; i < Math.min(s1.length, s2.length, maxPrefix); i++) {
      if (s1[i] === s2[i]) {
        prefix++
      } else {
        break
      }
    }

    return jaro + prefix * prefixScale * (1 - jaro)
  }

  /**
   * Jaro相似度
   */
  private jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1

    const len1 = str1.length
    const len2 = str2.length

    if (len1 === 0 || len2 === 0) return 0

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1

    const s1Matches = new Array(len1).fill(false)
    const s2Matches = new Array(len2).fill(false)

    let matches = 0
    let transpositions = 0

    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance)
      const end = Math.min(i + matchDistance + 1, len2)

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || str1[i] !== str2[j]) continue
        s1Matches[i] = true
        s2Matches[j] = true
        matches++
        break
      }
    }

    if (matches === 0) return 0

    let k = 0
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue
      while (!s2Matches[k]) k++
      if (str1[i] !== str2[k]) transpositions++
      k++
    }

    return (
      (matches / len1 +
        matches / len2 +
        (matches - transpositions / 2) / matches) /
      3
    )
  }

  /**
   * 余弦相似度（基于n-gram）
   */
  cosineSimilarity(str1: string, str2: string, n: number = 2): number {
    const ngrams1 = companyNameNormalizer.getNGrams(str1, n)
    const ngrams2 = companyNameNormalizer.getNGrams(str2, n)

    const set1 = new Set(ngrams1)
    const set2 = new Set(ngrams2)

    const intersection = new Set([...set1].filter((x) => set2.has(x)))

    if (intersection.size === 0) return 0

    const dotProduct = intersection.size
    const magnitude1 = Math.sqrt(set1.size)
    const magnitude2 = Math.sqrt(set2.size)

    return dotProduct / (magnitude1 * magnitude2)
  }

  /**
   * Jaccard相似度（基于n-gram）
   */
  jaccardSimilarity(str1: string, str2: string, n: number = 2): number {
    const ngrams1 = companyNameNormalizer.getNGrams(str1, n)
    const ngrams2 = companyNameNormalizer.getNGrams(str2, n)

    const set1 = new Set(ngrams1)
    const set2 = new Set(ngrams2)

    const intersection = new Set([...set1].filter((x) => set2.has(x)))
    const union = new Set([...set1, ...set2])

    if (union.size === 0) return 0

    return intersection.size / union.size
  }

  /**
   * 混合相似度（综合多种算法）
   */
  hybridSimilarity(str1: string, str2: string): number {
    // 标准化名称
    const normalized1 = companyNameNormalizer.normalize(str1).normalized
    const normalized2 = companyNameNormalizer.normalize(str2).normalized

    // 计算多种相似度
    const levenshtein = this.levenshteinSimilarity(normalized1, normalized2)
    const jaroWinkler = this.jaroWinklerSimilarity(str1, str2) // 使用原始字符串
    const cosine = this.cosineSimilarity(normalized1, normalized2)
    const jaccard = this.jaccardSimilarity(normalized1, normalized2)

    // 加权平均
    const weights = {
      levenshtein: 0.3,
      jaroWinkler: 0.3,
      cosine: 0.2,
      jaccard: 0.2,
    }

    return (
      levenshtein * weights.levenshtein +
      jaroWinkler * weights.jaroWinkler +
      cosine * weights.cosine +
      jaccard * weights.jaccard
    )
  }

  /**
   * 计算两个企业实体的匹配结果
   */
  calculateEntityMatch(
    entity1: CompanyEntity,
    entity2: CompanyEntity,
    highThreshold: number = 0.95,
    mediumThreshold: number = 0.85
  ): EntityMatchResult {
    const reasons: string[] = []

    // 1. 名称相似度
    const nameSimilarity = this.calculate(entity1.name, entity2.name)

    // 2. 国家匹配（如果都有国家信息）
    let countryMatch = true
    if (entity1.country && entity2.country) {
      countryMatch = entity1.country.toLowerCase() === entity2.country.toLowerCase()
      if (!countryMatch) {
        reasons.push('国家不同')
      }
    }

    // 3. 注册号匹配（如果都有注册号）
    let registrationMatch = true
    if (entity1.registration_number && entity2.registration_number) {
      registrationMatch =
        entity1.registration_number === entity2.registration_number
      if (registrationMatch) {
        reasons.push('注册号相同')
      }
    }

    // 4. 计算综合相似度
    let finalScore = nameSimilarity

    // 如果国家不同，降低相似度
    if (!countryMatch) {
      finalScore *= 0.8
    }

    // 如果注册号相同，提高相似度
    if (registrationMatch && entity1.registration_number) {
      finalScore = Math.min(1, finalScore * 1.1)
    }

    // 5. 确定置信度
    let confidence: 'high' | 'medium' | 'low'
    if (finalScore >= highThreshold) {
      confidence = 'high'
      if (reasons.length === 0) reasons.push('名称高度相似')
    } else if (finalScore >= mediumThreshold) {
      confidence = 'medium'
      if (reasons.length === 0) reasons.push('名称较为相似')
    } else {
      confidence = 'low'
      if (reasons.length === 0) reasons.push('名称相似度较低')
    }

    return {
      entity1,
      entity2,
      similarity_score: finalScore,
      match_confidence: confidence,
      match_reasons: reasons,
      is_match: finalScore >= mediumThreshold,
    }
  }

  /**
   * 批量计算相似度矩阵
   */
  calculateSimilarityMatrix(entities: CompanyEntity[]): number[][] {
    const n = entities.length
    const matrix: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1
        } else {
          const similarity = this.calculate(entities[i].name, entities[j].name)
          matrix[i][j] = similarity
          matrix[j][i] = similarity
        }
      }
    }

    return matrix
  }
}

// 导出单例
export const similarityCalculator = new SimilarityCalculator()
