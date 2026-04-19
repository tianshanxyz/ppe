/**
 * 相似度匹配器
 * 
 * AI-004: 相似度匹配模型
 * 用于计算产品之间的相似度，识别等价产品和替代产品
 */

import { Logger } from '../monitoring/Logger';

/**
 * 相似度类型
 */
export enum SimilarityType {
  // 产品相似度
  PRODUCT = 'product',
  // 制造商相似度
  MANUFACTURER = 'manufacturer',
  // 规格相似度
  SPECIFICATION = 'specification',
  // 功能相似度
  FUNCTIONAL = 'functional',
  // 材料相似度
  MATERIAL = 'material',
  // 标准相似度
  STANDARD = 'standard',
  // 综合相似度
  OVERALL = 'overall',
}

/**
 * 匹配结果类型
 */
export enum MatchType {
  // 完全等价
  EQUIVALENT = 'equivalent',
  // 高度相似
  HIGHLY_SIMILAR = 'highly_similar',
  // 中等相似
  MODERATELY_SIMILAR = 'moderately_similar',
  // 低度相似
  LOW_SIMILARITY = 'low_similarity',
  // 不相似
  DISSIMILAR = 'dissimilar',
}

/**
 * 产品信息
 */
export interface ProductInfo {
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description?: string;
  /** 产品规格 */
  specifications?: Record<string, string>;
  /** 制造商 */
  manufacturer?: string;
  /** 材料 */
  materials?: string[];
  /** 标准 */
  standards?: string[];
  /** 预期用途 */
  intendedUse?: string;
  /** 产品代码 */
  productCode?: string;
  /** 设备类别 */
  deviceClass?: string;
}

/**
 * 相似度计算输入
 */
export interface SimilarityInput {
  /** 源产品 */
  source: ProductInfo;
  /** 目标产品 */
  target: ProductInfo;
  /** 相似度类型（可选，默认综合相似度） */
  type?: SimilarityType;
  /** 权重配置（可选） */
  weights?: Record<SimilarityType, number>;
}

/**
 * 相似度分数
 */
export interface SimilarityScore {
  /** 相似度类型 */
  type: SimilarityType;
  /** 相似度分数 (0-1) */
  score: number;
  /** 置信度 */
  confidence: number;
  /** 匹配理由 */
  reasoning: string;
  /** 关键匹配点 */
  keyMatches: string[];
  /** 关键差异点 */
  keyDifferences: string[];
}

/**
 * 相似度匹配结果
 */
export interface SimilarityResult {
  /** 源产品 */
  source: ProductInfo;
  /** 目标产品 */
  target: ProductInfo;
  /** 综合相似度分数 */
  overallScore: number;
  /** 匹配类型 */
  matchType: MatchType;
  /** 各维度相似度分数 */
  scores: SimilarityScore[];
  /** 是否可替代 */
  isSubstitutable: boolean;
  /** 替代建议 */
  substitutionAdvice?: string;
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 批量匹配输入
 */
export interface BatchMatchInput {
  /** 源产品 */
  source: ProductInfo;
  /** 候选产品列表 */
  candidates: ProductInfo[];
  /** 相似度阈值（可选，默认0.7） */
  threshold?: number;
  /** 最大返回数量（可选，默认10） */
  limit?: number;
  /** 是否只返回可替代产品（可选，默认false） */
  substitutableOnly?: boolean;
}

/**
 * 批量匹配结果
 */
export interface BatchMatchResult {
  /** 源产品 */
  source: ProductInfo;
  /** 匹配结果列表 */
  matches: SimilarityResult[];
  /** 处理时间（毫秒） */
  processingTime: number;
  /** 候选产品总数 */
  totalCandidates: number;
  /** 匹配产品数量 */
  matchedCount: number;
}

/**
 * 相似度匹配器配置
 */
export interface SimilarityMatcherConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存最大条目数 */
  cacheMaxSize: number;
  /** 默认相似度阈值 */
  defaultThreshold: number;
  /** 最小置信度 */
  minConfidence: number;
  /** 是否使用AI模型 */
  useAIModel: boolean;
  /** AI模型配置 */
  aiModel?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  /** 默认权重配置 */
  defaultWeights: Record<SimilarityType, number>;
}

/**
 * 相似度匹配器
 */
export class SimilarityMatcher {
  private logger: Logger;
  private config: SimilarityMatcherConfig;
  private cache: Map<string, SimilarityResult>;

  constructor(config?: Partial<SimilarityMatcherConfig>) {
    this.logger = new Logger();
    this.config = {
      enableCache: true,
      cacheMaxSize: 1000,
      defaultThreshold: 0.7,
      minConfidence: 0.6,
      useAIModel: false,
      defaultWeights: {
        [SimilarityType.PRODUCT]: 0.25,
        [SimilarityType.MANUFACTURER]: 0.1,
        [SimilarityType.SPECIFICATION]: 0.25,
        [SimilarityType.FUNCTIONAL]: 0.2,
        [SimilarityType.MATERIAL]: 0.1,
        [SimilarityType.STANDARD]: 0.1,
        [SimilarityType.OVERALL]: 0,
      },
      ...config,
    };
    this.cache = new Map();
  }

  /**
   * 计算相似度
   */
  async calculate(input: SimilarityInput): Promise<SimilarityResult> {
    const startTime = Date.now();

    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.getFromCache(input);
      if (cached) {
        this.logger.debug('Cache hit for similarity calculation');
        return cached;
      }
    }

    try {
      let result: SimilarityResult;

      if (this.config.useAIModel) {
        // 使用规则计算相似度（AI 功能已禁用）
        console.warn('AI similarity calculation is currently disabled, using rule-based calculation');
        result = await this.calculateWithRules(input);
      } else {
        // 使用规则计算相似度
        result = await this.calculateWithRules(input);
      }

      // 缓存结果
      if (this.config.enableCache) {
        this.setCache(input, result);
      }

      this.logger.info('Similarity calculation completed', {
        sourceName: input.source.name,
        targetName: input.target.name,
        overallScore: result.overallScore,
        matchType: result.matchType,
      });

      return result;
    } catch (error) {
      this.logger.error('Similarity calculation failed', { error });
      throw error;
    }
  }

  /**
   * 批量匹配
   */
  async batchMatch(input: BatchMatchInput): Promise<BatchMatchResult> {
    const startTime = Date.now();
    const threshold = input.threshold ?? this.config.defaultThreshold;
    const limit = input.limit ?? 10;

    this.logger.info('Starting batch similarity matching', {
      sourceName: input.source.name,
      candidateCount: input.candidates.length,
      threshold,
      limit,
    });

    // 计算所有候选产品的相似度
    const promises = input.candidates.map((candidate) =>
      this.calculate({
        source: input.source,
        target: candidate,
      })
    );

    const results = await Promise.all(promises);

    // 过滤和排序
    let matches = results
      .filter((result) => result.overallScore >= threshold)
      .filter((result) => !input.substitutableOnly || result.isSubstitutable)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);

    const processingTime = Date.now() - startTime;

    this.logger.info('Batch matching completed', {
      matchedCount: matches.length,
      processingTime,
    });

    return {
      source: input.source,
      matches,
      processingTime,
      totalCandidates: input.candidates.length,
      matchedCount: matches.length,
    };
  }

  /**
   * 查找等价产品
   */
  async findEquivalents(
    source: ProductInfo,
    candidates: ProductInfo[],
    threshold: number = 0.85
  ): Promise<SimilarityResult[]> {
    const result = await this.batchMatch({
      source,
      candidates,
      threshold,
      substitutableOnly: true,
    });

    return result.matches.filter(
      (match) => match.matchType === MatchType.EQUIVALENT ||
                match.matchType === MatchType.HIGHLY_SIMILAR
    );
  }

  /**
   * 使用规则计算相似度
   */
  private async calculateWithRules(input: SimilarityInput): Promise<SimilarityResult> {
    const scores: SimilarityScore[] = [];
    const weights = input.weights ?? this.config.defaultWeights;

    // 计算各维度相似度
    scores.push(this.calculateProductSimilarity(input.source, input.target));
    scores.push(this.calculateManufacturerSimilarity(input.source, input.target));
    scores.push(this.calculateSpecificationSimilarity(input.source, input.target));
    scores.push(this.calculateFunctionalSimilarity(input.source, input.target));
    scores.push(this.calculateMaterialSimilarity(input.source, input.target));
    scores.push(this.calculateStandardSimilarity(input.source, input.target));

    // 计算加权综合分数
    let overallScore = 0;
    let totalWeight = 0;

    for (const score of scores) {
      const weight = weights[score.type] ?? 0;
      overallScore += score.score * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      overallScore /= totalWeight;
    }

    // 确定匹配类型
    const matchType = this.determineMatchType(overallScore);

    // 判断是否可替代
    const isSubstitutable = this.isSubstitutable(scores, overallScore);

    return {
      source: input.source,
      target: input.target,
      overallScore,
      matchType,
      scores,
      isSubstitutable,
      substitutionAdvice: this.generateSubstitutionAdvice(scores, overallScore),
      processingTime: 0,
    };
  }

  /**
   * 计算产品相似度
   */
  private calculateProductSimilarity(source: ProductInfo, target: ProductInfo): SimilarityScore {
    const keyMatches: string[] = [];
    const keyDifferences: string[] = [];

    // 名称相似度
    const nameSimilarity = this.calculateTextSimilarity(source.name, target.name);
    if (nameSimilarity > 0.8) {
      keyMatches.push('产品名称高度相似');
    } else if (nameSimilarity < 0.3) {
      keyDifferences.push('产品名称差异较大');
    }

    // 描述相似度
    let descSimilarity = 0;
    if (source.description && target.description) {
      descSimilarity = this.calculateTextSimilarity(source.description, target.description);
      if (descSimilarity > 0.7) {
        keyMatches.push('产品描述相似');
      }
    }

    // 产品代码相似度
    let codeSimilarity = 0;
    if (source.productCode && target.productCode) {
      codeSimilarity = source.productCode === target.productCode ? 1 : 0;
      if (codeSimilarity === 1) {
        keyMatches.push('产品代码相同');
      }
    }

    // 综合分数
    const score = (nameSimilarity * 0.5 + descSimilarity * 0.3 + codeSimilarity * 0.2);

    return {
      type: SimilarityType.PRODUCT,
      score,
      confidence: 0.8,
      reasoning: `产品名称相似度: ${(nameSimilarity * 100).toFixed(1)}%`,
      keyMatches,
      keyDifferences,
    };
  }

  /**
   * 计算制造商相似度
   */
  private calculateManufacturerSimilarity(source: ProductInfo, target: ProductInfo): SimilarityScore {
    const keyMatches: string[] = [];
    const keyDifferences: string[] = [];

    if (!source.manufacturer || !target.manufacturer) {
      return {
        type: SimilarityType.MANUFACTURER,
        score: 0.5,
        confidence: 0.5,
        reasoning: '制造商信息不完整',
        keyMatches,
        keyDifferences: ['缺少制造商信息'],
      };
    }

    const similarity = this.calculateTextSimilarity(source.manufacturer, target.manufacturer);

    if (similarity > 0.9) {
      keyMatches.push('制造商相同');
    } else if (similarity > 0.5) {
      keyMatches.push('制造商可能相关');
    } else {
      keyDifferences.push('制造商不同');
    }

    return {
      type: SimilarityType.MANUFACTURER,
      score: similarity,
      confidence: 0.85,
      reasoning: similarity > 0.9 ? '制造商相同' : '制造商不同或相关',
      keyMatches,
      keyDifferences,
    };
  }

  /**
   * 计算规格相似度
   */
  private calculateSpecificationSimilarity(source: ProductInfo, target: ProductInfo): SimilarityScore {
    const keyMatches: string[] = [];
    const keyDifferences: string[] = [];

    if (!source.specifications || !target.specifications) {
      return {
        type: SimilarityType.SPECIFICATION,
        score: 0.5,
        confidence: 0.5,
        reasoning: '规格信息不完整',
        keyMatches,
        keyDifferences: ['缺少规格信息'],
      };
    }

    const sourceSpecs = Object.entries(source.specifications);
    const targetSpecs = Object.entries(target.specifications);

    if (sourceSpecs.length === 0 || targetSpecs.length === 0) {
      return {
        type: SimilarityType.SPECIFICATION,
        score: 0.5,
        confidence: 0.5,
        reasoning: '规格信息为空',
        keyMatches,
        keyDifferences: ['规格信息为空'],
      };
    }

    let matchCount = 0;
    let totalComparisons = 0;

    for (const [key, sourceValue] of sourceSpecs) {
      const targetValue = target.specifications[key];
      if (targetValue) {
        totalComparisons++;
        const similarity = this.calculateTextSimilarity(sourceValue, targetValue);
        if (similarity > 0.8) {
          matchCount++;
          keyMatches.push(`规格 ${key} 匹配`);
        } else if (similarity < 0.3) {
          keyDifferences.push(`规格 ${key} 差异较大`);
        }
      }
    }

    const score = totalComparisons > 0 ? matchCount / totalComparisons : 0.5;

    return {
      type: SimilarityType.SPECIFICATION,
      score,
      confidence: 0.75,
      reasoning: `${matchCount}/${totalComparisons} 项规格匹配`,
      keyMatches,
      keyDifferences,
    };
  }

  /**
   * 计算功能相似度
   */
  private calculateFunctionalSimilarity(source: ProductInfo, target: ProductInfo): SimilarityScore {
    const keyMatches: string[] = [];
    const keyDifferences: string[] = [];

    if (!source.intendedUse || !target.intendedUse) {
      return {
        type: SimilarityType.FUNCTIONAL,
        score: 0.5,
        confidence: 0.5,
        reasoning: '预期用途信息不完整',
        keyMatches,
        keyDifferences: ['缺少预期用途信息'],
      };
    }

    const similarity = this.calculateTextSimilarity(source.intendedUse, target.intendedUse);

    if (similarity > 0.8) {
      keyMatches.push('预期用途高度相似');
    } else if (similarity > 0.5) {
      keyMatches.push('预期用途部分相似');
    } else {
      keyDifferences.push('预期用途差异较大');
    }

    return {
      type: SimilarityType.FUNCTIONAL,
      score: similarity,
      confidence: 0.8,
      reasoning: `预期用途相似度: ${(similarity * 100).toFixed(1)}%`,
      keyMatches,
      keyDifferences,
    };
  }

  /**
   * 计算材料相似度
   */
  private calculateMaterialSimilarity(source: ProductInfo, target: ProductInfo): SimilarityScore {
    const keyMatches: string[] = [];
    const keyDifferences: string[] = [];

    if (!source.materials || !target.materials) {
      return {
        type: SimilarityType.MATERIAL,
        score: 0.5,
        confidence: 0.5,
        reasoning: '材料信息不完整',
        keyMatches,
        keyDifferences: ['缺少材料信息'],
      };
    }

    if (source.materials.length === 0 || target.materials.length === 0) {
      return {
        type: SimilarityType.MATERIAL,
        score: 0.5,
        confidence: 0.5,
        reasoning: '材料信息为空',
        keyMatches,
        keyDifferences: ['材料信息为空'],
      };
    }

    const commonMaterials = source.materials.filter((m) =>
      target.materials!.some((tm) => this.calculateTextSimilarity(m, tm) > 0.8)
    );

    const score = commonMaterials.length / Math.max(source.materials.length, target.materials.length);

    if (commonMaterials.length > 0) {
      keyMatches.push(`共同材料: ${commonMaterials.join(', ')}`);
    }

    const uniqueSource = source.materials.filter(
      (m) => !target.materials!.some((tm) => this.calculateTextSimilarity(m, tm) > 0.8)
    );
    const uniqueTarget = target.materials.filter(
      (m) => !source.materials!.some((sm) => this.calculateTextSimilarity(m, sm) > 0.8)
    );

    if (uniqueSource.length > 0) {
      keyDifferences.push(`源产品特有材料: ${uniqueSource.join(', ')}`);
    }
    if (uniqueTarget.length > 0) {
      keyDifferences.push(`目标产品特有材料: ${uniqueTarget.join(', ')}`);
    }

    return {
      type: SimilarityType.MATERIAL,
      score,
      confidence: 0.75,
      reasoning: `${commonMaterials.length} 种共同材料`,
      keyMatches,
      keyDifferences,
    };
  }

  /**
   * 计算标准相似度
   */
  private calculateStandardSimilarity(source: ProductInfo, target: ProductInfo): SimilarityScore {
    const keyMatches: string[] = [];
    const keyDifferences: string[] = [];

    if (!source.standards || !target.standards) {
      return {
        type: SimilarityType.STANDARD,
        score: 0.5,
        confidence: 0.5,
        reasoning: '标准信息不完整',
        keyMatches,
        keyDifferences: ['缺少标准信息'],
      };
    }

    if (source.standards.length === 0 || target.standards.length === 0) {
      return {
        type: SimilarityType.STANDARD,
        score: 0.5,
        confidence: 0.5,
        reasoning: '标准信息为空',
        keyMatches,
        keyDifferences: ['标准信息为空'],
      };
    }

    const commonStandards = source.standards.filter((s) =>
      target.standards!.some((ts) => this.calculateTextSimilarity(s, ts) > 0.9)
    );

    const score = commonStandards.length / Math.max(source.standards.length, target.standards.length);

    if (commonStandards.length > 0) {
      keyMatches.push(`共同标准: ${commonStandards.join(', ')}`);
    }

    return {
      type: SimilarityType.STANDARD,
      score,
      confidence: 0.85,
      reasoning: `${commonStandards.length} 项共同标准`,
      keyMatches,
      keyDifferences,
    };
  }

  /**
   * 计算文本相似度（使用Jaccard系数）
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // 标准化文本
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 0);

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * 确定匹配类型
   */
  private determineMatchType(score: number): MatchType {
    if (score >= 0.9) return MatchType.EQUIVALENT;
    if (score >= 0.75) return MatchType.HIGHLY_SIMILAR;
    if (score >= 0.5) return MatchType.MODERATELY_SIMILAR;
    if (score >= 0.25) return MatchType.LOW_SIMILARITY;
    return MatchType.DISSIMILAR;
  }

  /**
   * 判断是否可替代
   */
  private isSubstitutable(scores: SimilarityScore[], overallScore: number): boolean {
    // 综合分数高于0.8且功能相似度高于0.7
    const functionalScore = scores.find((s) => s.type === SimilarityType.FUNCTIONAL)?.score ?? 0;
    return overallScore >= 0.8 && functionalScore >= 0.7;
  }

  /**
   * 生成替代建议
   */
  private generateSubstitutionAdvice(scores: SimilarityScore[], overallScore: number): string {
    if (overallScore >= 0.9) {
      return '产品高度等价，可以直接替代使用。建议在替代前进行小规模验证。';
    } else if (overallScore >= 0.75) {
      return '产品高度相似，在大多数情况下可以替代。建议仔细核对规格差异。';
    } else if (overallScore >= 0.5) {
      return '产品有一定相似性，替代需要谨慎评估。建议进行全面的功能和性能测试。';
    } else {
      return '产品相似度较低，不建议直接替代。如需替代，需要进行完整的验证流程。';
    }
  }

  /**
   * 构建相似度提示词
   */
  private buildSimilarityPrompt(input: SimilarityInput): string {
    const { source, target } = input;

    return `请比较以下两个PPE产品的相似度：

## 源产品
- 名称: ${source.name}
- 描述: ${source.description || 'N/A'}
- 制造商: ${source.manufacturer || 'N/A'}
- 材料: ${source.materials?.join(', ') || 'N/A'}
- 标准: ${source.standards?.join(', ') || 'N/A'}
- 预期用途: ${source.intendedUse || 'N/A'}
- 产品代码: ${source.productCode || 'N/A'}
- 设备类别: ${source.deviceClass || 'N/A'}
- 规格: ${source.specifications ? JSON.stringify(source.specifications, null, 2) : 'N/A'}

## 目标产品
- 名称: ${target.name}
- 描述: ${target.description || 'N/A'}
- 制造商: ${target.manufacturer || 'N/A'}
- 材料: ${target.materials?.join(', ') || 'N/A'}
- 标准: ${target.standards?.join(', ') || 'N/A'}
- 预期用途: ${target.intendedUse || 'N/A'}
- 产品代码: ${target.productCode || 'N/A'}
- 设备类别: ${target.deviceClass || 'N/A'}
- 规格: ${target.specifications ? JSON.stringify(target.specifications, null, 2) : 'N/A'}

请从以下维度分析相似度：
1. 产品相似度（名称、描述、产品代码）
2. 制造商相似度
3. 规格相似度
4. 功能相似度（预期用途）
5. 材料相似度
6. 标准相似度

请以JSON格式输出分析结果。`;
  }

  /**
   * 解析相似度响应
   */
  private parseSimilarityResponse(response: string, input: SimilarityInput): SimilarityResult {
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        source: input.source,
        target: input.target,
        overallScore: data.overallScore ?? 0,
        matchType: data.matchType as MatchType,
        scores: data.scores || [],
        isSubstitutable: data.isSubstitutable ?? false,
        substitutionAdvice: data.substitutionAdvice,
        processingTime: 0,
      };
    } catch (error) {
      this.logger.error('Failed to parse similarity response', { error, response });
      // 返回默认结果
      return {
        source: input.source,
        target: input.target,
        overallScore: 0.5,
        matchType: MatchType.MODERATELY_SIMILAR,
        scores: [],
        isSubstitutable: false,
        substitutionAdvice: '解析失败，请人工评估',
        processingTime: 0,
      };
    }
  }

  /**
   * 从缓存获取
   */
  private getFromCache(input: SimilarityInput): SimilarityResult | undefined {
    const key = this.generateCacheKey(input);
    return this.cache.get(key);
  }

  /**
   * 设置缓存
   */
  private setCache(input: SimilarityInput, result: SimilarityResult): void {
    if (this.cache.size >= this.config.cacheMaxSize) {
      // LRU: 删除最早的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    const key = this.generateCacheKey(input);
    this.cache.set(key, result);
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(input: SimilarityInput): string {
    const sourceKey = `${input.source.name}_${input.source.manufacturer || ''}`;
    const targetKey = `${input.target.name}_${input.target.manufacturer || ''}`;
    return `${sourceKey}::${targetKey}`;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheMaxSize,
    };
  }
}

export default SimilarityMatcher;
