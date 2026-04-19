/**
 * 推荐引擎
 *
 * AI-006: 推荐算法
 * 用于推荐相似产品、替代产品、合规路径等
 */

import { Logger } from '../monitoring/Logger';
import { SimilarityMatcher, ProductInfo, SimilarityResult } from './SimilarityMatcher';
import { ComplianceEvaluator, ProductComplianceInfo, EvaluationResult } from './ComplianceEvaluator';

/**
 * 推荐类型
 */
export enum RecommendationType {
  // 相似产品推荐
  SIMILAR_PRODUCTS = 'similar_products',
  // 替代产品推荐
  SUBSTITUTE_PRODUCTS = 'substitute_products',
  // 合规路径推荐
  COMPLIANCE_PATH = 'compliance_path',
  // 供应商推荐
  SUPPLIER_RECOMMENDATION = 'supplier_recommendation',
  // 认证机构推荐
  CERTIFICATION_BODY_RECOMMENDATION = 'certification_body_recommendation',
  // 标准推荐
  STANDARD_RECOMMENDATION = 'standard_recommendation',
  // 法规更新推荐
  REGULATION_UPDATE = 'regulation_update',
}

/**
 * 推荐场景
 */
export enum RecommendationScenario {
  // 产品选型
  PRODUCT_SELECTION = 'product_selection',
  // 合规规划
  COMPLIANCE_PLANNING = 'compliance_planning',
  // 供应商评估
  SUPPLIER_EVALUATION = 'supplier_evaluation',
  // 市场进入
  MARKET_ENTRY = 'market_entry',
  // 产品替代
  PRODUCT_SUBSTITUTION = 'product_substitution',
  // 风险管理
  RISK_MANAGEMENT = 'risk_management',
}

/**
 * 推荐输入
 */
export interface RecommendationInput {
  /** 源产品 */
  sourceProduct: ProductInfo;
  /** 推荐类型 */
  type: RecommendationType;
  /** 推荐场景 */
  scenario: RecommendationScenario;
  /** 目标市场（可选） */
  targetMarkets?: string[];
  /** 约束条件（可选） */
  constraints?: RecommendationConstraints;
  /** 用户偏好（可选） */
  preferences?: UserPreferences;
  /** 上下文信息（可选） */
  context?: RecommendationContext;
}

/**
 * 推荐约束条件
 */
export interface RecommendationConstraints {
  /** 最大推荐数量 */
  maxRecommendations?: number;
  /** 最低相似度分数 */
  minSimilarityScore?: number;
  /** 允许的制造商 */
  allowedManufacturers?: string[];
  /** 排除的制造商 */
  excludedManufacturers?: string[];
  /** 价格范围 */
  priceRange?: { min?: number; max?: number };
  /** 认证要求 */
  requiredCertifications?: string[];
  /** 时间限制 */
  timeConstraints?: { maxDeliveryDays?: number };
}

/**
 * 用户偏好
 */
export interface UserPreferences {
  /** 偏好制造商 */
  preferredManufacturers?: string[];
  /** 偏好标准 */
  preferredStandards?: string[];
  /** 价格敏感度 */
  priceSensitivity?: 'low' | 'medium' | 'high';
  /** 质量优先级 */
  qualityPriority?: 'low' | 'medium' | 'high';
  /** 交付时间优先级 */
  deliveryPriority?: 'low' | 'medium' | 'high';
}

/**
 * 推荐上下文
 */
export interface RecommendationContext {
  /** 用户角色 */
  userRole?: string;
  /** 使用场景 */
  useCase?: string;
  /** 预算限制 */
  budgetLimit?: number;
  /** 项目时间线 */
  projectTimeline?: string;
  /** 历史选择 */
  historicalSelections?: string[];
}

/**
 * 推荐项
 */
export interface RecommendationItem {
  /** 推荐ID */
  id: string;
  /** 推荐产品 */
  product: ProductInfo;
  /** 推荐类型 */
  type: RecommendationType;
  /** 推荐分数 (0-100) */
  score: number;
  /** 推荐理由 */
  reasoning: string;
  /** 推荐理由详情 */
  reasoningDetails: string[];
  /** 置信度 */
  confidence: number;
  /** 相似度信息（如适用） */
  similarityInfo?: SimilarityResult;
  /** 合规评估（如适用） */
  complianceEvaluation?: EvaluationResult;
  /** 排名 */
  rank: number;
  /** 标签 */
  tags: string[];
  /** 操作建议 */
  actionItems?: string[];
}

/**
 * 推荐结果
 */
export interface RecommendationResult {
  /** 源产品 */
  sourceProduct: ProductInfo;
  /** 推荐类型 */
  type: RecommendationType;
  /** 推荐场景 */
  scenario: RecommendationScenario;
  /** 推荐列表 */
  recommendations: RecommendationItem[];
  /** 推荐总数 */
  totalCount: number;
  /** 处理时间（毫秒） */
  processingTime: number;
  /** 生成时间戳 */
  generatedAt: string;
  /** 推荐摘要 */
  summary: string;
  /** 免责声明 */
  disclaimer: string;
}

/**
 * 合规路径推荐
 */
export interface CompliancePathRecommendation {
  /** 路径ID */
  id: string;
  /** 路径名称 */
  name: string;
  /** 目标市场 */
  targetMarket: string;
  /** 路径描述 */
  description: string;
  /** 所需步骤 */
  steps: ComplianceStep[];
  /** 预计时间 */
  estimatedTime: string;
  /** 预计成本 */
  estimatedCost: string;
  /** 难度等级 */
  difficultyLevel: 'easy' | 'medium' | 'hard';
  /** 成功概率 */
  successProbability: number;
  /** 推荐分数 */
  score: number;
}

/**
 * 合规步骤
 */
export interface ComplianceStep {
  /** 步骤编号 */
  stepNumber: number;
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 所需文档 */
  requiredDocuments: string[];
  /** 预计时间 */
  estimatedTime: string;
  /** 负责方 */
  responsibleParty: string;
  /** 依赖步骤 */
  dependencies?: number[];
}

/**
 * 供应商推荐
 */
export interface SupplierRecommendation {
  /** 供应商ID */
  id: string;
  /** 供应商名称 */
  name: string;
  /** 供应商评分 */
  rating: number;
  /** 产品匹配度 */
  productMatchScore: number;
  /** 合规能力评分 */
  complianceCapabilityScore: number;
  /** 交付能力评分 */
  deliveryCapabilityScore: number;
  /** 价格竞争力 */
  priceCompetitiveness: number;
  /** 认证情况 */
  certifications: string[];
  /** 推荐理由 */
  reasoning: string[];
  /** 联系信息 */
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

/**
 * 推荐引擎配置
 */
export interface RecommendationEngineConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存最大条目数 */
  cacheMaxSize: number;
  /** 默认推荐数量 */
  defaultRecommendationCount: number;
  /** 最小推荐分数 */
  minRecommendationScore: number;
  /** 是否使用AI模型 */
  useAIModel: boolean;
  /** AI模型配置 */
  aiModel?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  /** 相似度匹配器配置 */
  similarityMatcherConfig?: {
    useAIModel: boolean;
    defaultThreshold: number;
  };
  /** 评估器配置 */
  evaluatorConfig?: {
    useAIModel: boolean;
    passThreshold: number;
  };
}

/**
 * 推荐引擎
 */
export class RecommendationEngine {
  private logger: Logger;
  private similarityMatcher: SimilarityMatcher;
  private complianceEvaluator: ComplianceEvaluator;
  private config: RecommendationEngineConfig;
  private cache: Map<string, RecommendationResult>;

  constructor(config?: Partial<RecommendationEngineConfig>) {
    this.logger = new Logger();
    this.config = {
      enableCache: true,
      cacheMaxSize: 500,
      defaultRecommendationCount: 10,
      minRecommendationScore: 60,
      useAIModel: false,
      ...config,
    };
    this.cache = new Map();

    // 初始化相似度匹配器和评估器
    this.similarityMatcher = new SimilarityMatcher({
      useAIModel: this.config.similarityMatcherConfig?.useAIModel ?? false,
      defaultThreshold: this.config.similarityMatcherConfig?.defaultThreshold ?? 0.6,
    });

    this.complianceEvaluator = new ComplianceEvaluator({
      useAIModel: this.config.evaluatorConfig?.useAIModel ?? true,
      passThreshold: this.config.evaluatorConfig?.passThreshold ?? 80,
    });
  }

  /**
   * 生成推荐
   */
  async recommend(input: RecommendationInput): Promise<RecommendationResult> {
    const startTime = Date.now();

    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.getFromCache(input);
      if (cached) {
        this.logger.debug('Cache hit for recommendation');
        return cached;
      }
    }

    try {
      let result: RecommendationResult;

      // 根据推荐类型选择不同的推荐策略
      switch (input.type) {
        case RecommendationType.SIMILAR_PRODUCTS:
          result = await this.recommendSimilarProducts(input);
          break;
        case RecommendationType.SUBSTITUTE_PRODUCTS:
          result = await this.recommendSubstituteProducts(input);
          break;
        case RecommendationType.COMPLIANCE_PATH:
          result = await this.recommendCompliancePath(input);
          break;
        case RecommendationType.SUPPLIER_RECOMMENDATION:
          result = await this.recommendSuppliers(input);
          break;
        case RecommendationType.STANDARD_RECOMMENDATION:
          result = await this.recommendStandards(input);
          break;
        default:
          result = await this.generateGenericRecommendations(input);
      }

      // 缓存结果
      if (this.config.enableCache) {
        this.setCache(input, result);
      }

      this.logger.info('Recommendation generated', {
        type: input.type,
        scenario: input.scenario,
        recommendationCount: result.recommendations.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Recommendation generation failed', { error });
      throw error;
    }
  }

  /**
   * 推荐相似产品
   */
  private async recommendSimilarProducts(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    // 获取候选产品（这里应该从数据库或API获取）
    const candidates = await this.getCandidateProducts(input);

    // 使用相似度匹配器计算相似度
    const matchResult = await this.similarityMatcher.batchMatch({
      source: input.sourceProduct,
      candidates,
      threshold: input.constraints?.minSimilarityScore ?? 0.6,
      limit: input.constraints?.maxRecommendations ?? this.config.defaultRecommendationCount,
    });

    // 转换为推荐项
    const recommendations: RecommendationItem[] = matchResult.matches.map(
      (match, index) => ({
        id: `rec_${Date.now()}_${index}`,
        product: match.target,
        type: RecommendationType.SIMILAR_PRODUCTS,
        score: Math.round(match.overallScore * 100),
        reasoning: this.generateSimilarityReasoning(match),
        reasoningDetails: match.scores.flatMap((s) => s.keyMatches),
        confidence: Math.min(
          ...match.scores.map((s) => s.confidence),
          match.overallScore
        ),
        similarityInfo: match,
        rank: index + 1,
        tags: this.generateTags(match),
        actionItems: match.isSubstitutable
          ? ['可以直接替代使用', '建议进行小规模验证']
          : ['需要进一步评估', '建议对比规格差异'],
      })
    );

    return {
      sourceProduct: input.sourceProduct,
      type: RecommendationType.SIMILAR_PRODUCTS,
      scenario: input.scenario,
      recommendations,
      totalCount: recommendations.length,
      processingTime: matchResult.processingTime,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(recommendations, 'similar'),
      disclaimer: this.generateDisclaimer(),
    };
  }

  /**
   * 推荐替代产品
   */
  private async recommendSubstituteProducts(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    // 获取候选产品
    const candidates = await this.getCandidateProducts(input);

    // 查找可替代产品
    const equivalents = await this.similarityMatcher.findEquivalents(
      input.sourceProduct,
      candidates,
      input.constraints?.minSimilarityScore ?? 0.75
    );

    // 转换为推荐项
    const recommendations: RecommendationItem[] = equivalents.map((match, index) => ({
      id: `sub_${Date.now()}_${index}`,
      product: match.target,
      type: RecommendationType.SUBSTITUTE_PRODUCTS,
      score: Math.round(match.overallScore * 100),
      reasoning: match.substitutionAdvice || '产品高度相似，可以替代',
      reasoningDetails: match.scores.flatMap((s) => s.keyMatches),
      confidence: match.overallScore,
      similarityInfo: match,
      rank: index + 1,
      tags: ['可替代', ...this.generateTags(match)],
      actionItems: [
        '验证替代产品的规格参数',
        '确认认证状态',
        '评估供应链稳定性',
        '进行小规模试用',
      ],
    }));

    return {
      sourceProduct: input.sourceProduct,
      type: RecommendationType.SUBSTITUTE_PRODUCTS,
      scenario: input.scenario,
      recommendations,
      totalCount: recommendations.length,
      processingTime: 0,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(recommendations, 'substitute'),
      disclaimer: this.generateDisclaimer(),
    };
  }

  /**
   * 推荐合规路径
   */
  private async recommendCompliancePath(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    const targetMarkets = input.targetMarkets || ['US', 'EU'];

    // 为每个目标市场生成合规路径推荐
    const recommendations: RecommendationItem[] = [];

    for (const market of targetMarkets) {
      const path = await this.generateCompliancePath(input.sourceProduct, market);

      recommendations.push({
        id: `path_${market}_${Date.now()}`,
        product: input.sourceProduct,
        type: RecommendationType.COMPLIANCE_PATH,
        score: path.score,
        reasoning: `${market}市场准入路径：${path.description}`,
        reasoningDetails: path.steps.map((s) => s.name),
        confidence: path.successProbability,
        rank: recommendations.length + 1,
        tags: [market, `难度:${path.difficultyLevel}`, `预计${path.estimatedTime}`],
        actionItems: path.steps.slice(0, 3).map((s) => s.name),
      });
    }

    // 按分数排序
    recommendations.sort((a, b) => b.score - a.score);

    return {
      sourceProduct: input.sourceProduct,
      type: RecommendationType.COMPLIANCE_PATH,
      scenario: input.scenario,
      recommendations,
      totalCount: recommendations.length,
      processingTime: 0,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(recommendations, 'compliance'),
      disclaimer: this.generateDisclaimer(),
    };
  }

  /**
   * 推荐供应商
   */
  private async recommendSuppliers(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    // 获取候选供应商（这里应该从数据库获取）
    const suppliers = await this.getCandidateSuppliers(input);

    // 评估每个供应商
    const recommendations: RecommendationItem[] = await Promise.all(
      suppliers.map(async (supplier, index) => {
        const score = await this.evaluateSupplier(supplier, input);

        return {
          id: `sup_${supplier.id}`,
          product: input.sourceProduct,
          type: RecommendationType.SUPPLIER_RECOMMENDATION,
          score: Math.round(score.overall * 100),
          reasoning: `供应商 ${supplier.name} 综合评分: ${(score.overall * 100).toFixed(1)}`,
          reasoningDetails: [
            `产品匹配度: ${(score.productMatch * 100).toFixed(1)}`,
            `合规能力: ${(score.complianceCapability * 100).toFixed(1)}`,
            `交付能力: ${(score.deliveryCapability * 100).toFixed(1)}`,
          ],
          confidence: score.overall,
          rank: index + 1,
          tags: supplier.certifications,
          actionItems: ['联系供应商获取报价', '要求提供资质证明', '评估样品质量'],
        };
      })
    );

    // 过滤和排序
    const filtered = recommendations
      .filter((r) => r.score >= this.config.minRecommendationScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.constraints?.maxRecommendations ?? 5);

    // 重新设置排名
    filtered.forEach((r, i) => (r.rank = i + 1));

    return {
      sourceProduct: input.sourceProduct,
      type: RecommendationType.SUPPLIER_RECOMMENDATION,
      scenario: input.scenario,
      recommendations: filtered,
      totalCount: filtered.length,
      processingTime: 0,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(filtered, 'supplier'),
      disclaimer: this.generateDisclaimer(),
    };
  }

  /**
   * 推荐适用标准
   */
  private async recommendStandards(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    // 使用规则推荐（AI 功能已禁用）
    if (this.config.useAIModel) {
      console.warn('AI recommendation is currently disabled, using rule-based recommendation');
      return this.recommendStandardsWithRules(input);
    }

    // 使用规则推荐
    return this.recommendStandardsWithRules(input);
  }

  /**
   * 使用规则推荐标准
   */
  private async recommendStandardsWithRules(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    // 基于产品类别推荐标准
    const standards = this.getStandardsByProductType(input.sourceProduct);

    const recommendations: RecommendationItem[] = standards.map((standard, index) => ({
      id: `std_${standard.code}`,
      product: input.sourceProduct,
      type: RecommendationType.STANDARD_RECOMMENDATION,
      score: standard.relevanceScore,
      reasoning: standard.description,
      reasoningDetails: [standard.scope, standard.requirements],
      confidence: standard.relevanceScore / 100,
      rank: index + 1,
      tags: [standard.type, standard.mandatory ? '强制性' : '推荐性'],
      actionItems: [`获取${standard.code}标准全文`, '评估产品符合性'],
    }));

    return {
      sourceProduct: input.sourceProduct,
      type: RecommendationType.STANDARD_RECOMMENDATION,
      scenario: input.scenario,
      recommendations,
      totalCount: recommendations.length,
      processingTime: 0,
      generatedAt: new Date().toISOString(),
      summary: `基于产品类型推荐 ${recommendations.length} 项适用标准`,
      disclaimer: this.generateDisclaimer(),
    };
  }

  /**
   * 生成通用推荐
   */
  private async generateGenericRecommendations(
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    // 综合多种推荐类型
    const recommendations: RecommendationItem[] = [];

    // 添加相似产品推荐
    const similarProducts = await this.recommendSimilarProducts({
      ...input,
      constraints: { ...input.constraints, maxRecommendations: 3 },
    });
    recommendations.push(...similarProducts.recommendations);

    // 添加标准推荐
    const standards = await this.recommendStandards({
      ...input,
      constraints: { ...input.constraints, maxRecommendations: 3 },
    });
    recommendations.push(...standards.recommendations);

    // 按分数排序
    recommendations.sort((a, b) => b.score - a.score);

    return {
      sourceProduct: input.sourceProduct,
      type: input.type,
      scenario: input.scenario,
      recommendations,
      totalCount: recommendations.length,
      processingTime: 0,
      generatedAt: new Date().toISOString(),
      summary: `综合推荐：${recommendations.length} 项建议`,
      disclaimer: this.generateDisclaimer(),
    };
  }

  /**
   * 获取候选产品
   */
  private async getCandidateProducts(
    input: RecommendationInput
  ): Promise<ProductInfo[]> {
    // 这里应该从数据库或API获取候选产品
    // 暂时返回模拟数据
    return [];
  }

  /**
   * 获取候选供应商
   */
  private async getCandidateSuppliers(
    input: RecommendationInput
  ): Promise<SupplierRecommendation[]> {
    // 这里应该从数据库获取供应商列表
    // 暂时返回空数组
    return [];
  }

  /**
   * 评估供应商
   */
  private async evaluateSupplier(
    supplier: SupplierRecommendation,
    input: RecommendationInput
  ): Promise<{
    overall: number;
    productMatch: number;
    complianceCapability: number;
    deliveryCapability: number;
  }> {
    // 基于供应商信息和产品需求计算评分
    const productMatch = supplier.productMatchScore;
    const complianceCapability = supplier.complianceCapabilityScore;
    const deliveryCapability = supplier.deliveryCapabilityScore;

    // 加权计算综合分数
    const weights = {
      productMatch: 0.4,
      complianceCapability: 0.35,
      deliveryCapability: 0.25,
    };

    const overall =
      productMatch * weights.productMatch +
      complianceCapability * weights.complianceCapability +
      deliveryCapability * weights.deliveryCapability;

    return { overall, productMatch, complianceCapability, deliveryCapability };
  }

  /**
   * 生成合规路径
   */
  private async generateCompliancePath(
    product: ProductInfo,
    targetMarket: string
  ): Promise<CompliancePathRecommendation> {
    // 基于目标市场生成合规路径
    const paths: Record<string, CompliancePathRecommendation> = {
      US: {
        id: 'us_510k',
        name: 'FDA 510(k) 上市前通知',
        targetMarket: 'US',
        description: '通过FDA 510(k)途径获得美国市场准入',
        steps: [
          {
            stepNumber: 1,
            name: '确定产品代码和设备类别',
            description: '在FDA数据库中查找对应的产品代码',
            requiredDocuments: ['产品描述', '预期用途说明'],
            estimatedTime: '1-2周',
            responsibleParty: '法规事务团队',
          },
          {
            stepNumber: 2,
            name: '识别谓词设备',
            description: '查找与产品实质等价的已上市设备',
            requiredDocuments: ['谓词设备清单'],
            estimatedTime: '2-4周',
            responsibleParty: '法规事务团队',
          },
          {
            stepNumber: 3,
            name: '准备510(k)申请文件',
            description: '编制完整的510(k)提交文件',
            requiredDocuments: ['设备描述', '实质等价比较', '性能数据'],
            estimatedTime: '8-12周',
            responsibleParty: '法规事务团队',
          },
          {
            stepNumber: 4,
            name: '提交FDA审核',
            description: '通过eSubmitter系统提交申请',
            requiredDocuments: ['510(k)申请文件'],
            estimatedTime: '2-4周',
            responsibleParty: 'FDA',
          },
          {
            stepNumber: 5,
            name: 'FDA审核',
            description: 'FDA进行实质性审核',
            requiredDocuments: ['补充资料（如需要）'],
            estimatedTime: '12-16周',
            responsibleParty: 'FDA',
          },
        ],
        estimatedTime: '6-9个月',
        estimatedCost: '$10,000 - $50,000',
        difficultyLevel: 'medium',
        successProbability: 0.85,
        score: 85,
      },
      EU: {
        id: 'eu_mdr',
        name: 'EU MDR CE标记',
        targetMarket: 'EU',
        description: '通过MDR法规获得欧盟CE标记',
        steps: [
          {
            stepNumber: 1,
            name: '确定医疗器械分类',
            description: '根据MDR Annex VIII确定产品分类',
            requiredDocuments: ['产品描述', '预期用途', '风险分析'],
            estimatedTime: '1-2周',
            responsibleParty: '法规事务团队',
          },
          {
            stepNumber: 2,
            name: '选择公告机构',
            description: '选择合适的Notified Body',
            requiredDocuments: ['Notified Body申请表'],
            estimatedTime: '2-4周',
            responsibleParty: '法规事务团队',
          },
          {
            stepNumber: 3,
            name: '建立质量管理体系',
            description: '实施ISO 13485质量管理体系',
            requiredDocuments: ['质量手册', '程序文件'],
            estimatedTime: '12-16周',
            responsibleParty: '质量团队',
          },
          {
            stepNumber: 4,
            name: '编制技术文档',
            description: '准备符合MDR要求的技术文档',
            requiredDocuments: ['技术文档', '临床评价报告', '风险管理文件'],
            estimatedTime: '16-24周',
            responsibleParty: '法规事务团队',
          },
          {
            stepNumber: 5,
            name: '公告机构审核',
            description: 'Notified Body进行符合性评估',
            requiredDocuments: ['技术文档', '质量管理体系文件'],
            estimatedTime: '8-12周',
            responsibleParty: 'Notified Body',
          },
        ],
        estimatedTime: '12-18个月',
        estimatedCost: '€50,000 - €200,000',
        difficultyLevel: 'hard',
        successProbability: 0.75,
        score: 75,
      },
    };

    return (
      paths[targetMarket] || {
        id: `generic_${targetMarket}`,
        name: `${targetMarket}市场准入`,
        targetMarket,
        description: `${targetMarket}市场的通用合规路径`,
        steps: [],
        estimatedTime: '未知',
        estimatedCost: '未知',
        difficultyLevel: 'medium',
        successProbability: 0.5,
        score: 50,
      }
    );
  }

  /**
   * 根据产品类型获取标准
   */
  private getStandardsByProductType(product: ProductInfo): Array<{
    code: string;
    description: string;
    scope: string;
    requirements: string;
    type: string;
    mandatory: boolean;
    relevanceScore: number;
  }> {
    // 基于产品名称和描述匹配相关标准
    const standards = [
      {
        code: 'EN 149',
        description: '呼吸防护装置 - 过滤半面罩以防止颗粒 - 要求、测试、标记',
        scope: '颗粒过滤半面罩',
        requirements: '过滤效率、呼吸阻力、贴合性',
        type: 'PPE',
        mandatory: true,
        relevanceScore: 95,
      },
      {
        code: 'EN 14683',
        description: '医用口罩 - 要求和测试方法',
        scope: '医用口罩',
        requirements: '细菌过滤效率、压差、微生物清洁度',
        type: '医疗器械',
        mandatory: true,
        relevanceScore: 90,
      },
      {
        code: 'ASTM F2100',
        description: '医用口罩材料性能标准规范',
        scope: '医用口罩材料',
        requirements: '细菌过滤效率、压差、抗合成血液渗透',
        type: 'ASTM',
        mandatory: false,
        relevanceScore: 85,
      },
      {
        code: 'GB 19083',
        description: '医用防护口罩技术要求',
        scope: '医用防护口罩',
        requirements: '过滤效率、气流阻力、表面抗湿性',
        type: '国标',
        mandatory: true,
        relevanceScore: 80,
      },
      {
        code: 'ISO 13485',
        description: '医疗器械 - 质量管理体系 - 监管要求',
        scope: '医疗器械质量管理体系',
        requirements: '质量管理体系要求',
        type: 'ISO',
        mandatory: false,
        relevanceScore: 75,
      },
    ];

    // 根据产品名称匹配相关度
    return standards
      .map((std) => ({
        ...std,
        relevanceScore: this.calculateStandardRelevance(std, product),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * 计算标准相关度
   */
  private calculateStandardRelevance(
    standard: { code: string; description: string; scope: string },
    product: ProductInfo
  ): number {
    const productText = `${product.name} ${product.description || ''}`.toLowerCase();
    const standardText = `${standard.code} ${standard.description} ${standard.scope}`.toLowerCase();

    // 简单的关键词匹配
    const keywords = ['mask', 'respirator', '防护', '口罩', '呼吸'];
    let matchCount = 0;

    for (const keyword of keywords) {
      if (productText.includes(keyword) && standardText.includes(keyword)) {
        matchCount++;
      }
    }

    return Math.min(100, 50 + matchCount * 15);
  }

  /**
   * 生成相似度推荐理由
   */
  private generateSimilarityReasoning(match: SimilarityResult): string {
    const parts: string[] = [];

    if (match.overallScore >= 0.9) {
      parts.push('产品高度相似');
    } else if (match.overallScore >= 0.75) {
      parts.push('产品较为相似');
    } else {
      parts.push('产品有一定相似性');
    }

    // 添加关键匹配点
    const keyMatches = match.scores.flatMap((s) => s.keyMatches).slice(0, 2);
    if (keyMatches.length > 0) {
      parts.push(`，${keyMatches.join('、')}`);
    }

    return parts.join('');
  }

  /**
   * 生成标签
   */
  private generateTags(match: SimilarityResult): string[] {
    const tags: string[] = [];

    if (match.isSubstitutable) {
      tags.push('可替代');
    }

    if (match.overallScore >= 0.9) {
      tags.push('高度相似');
    } else if (match.overallScore >= 0.75) {
      tags.push('中度相似');
    }

    // 添加高相似度维度标签
    for (const score of match.scores) {
      if (score.score >= 0.8) {
        tags.push(score.type);
      }
    }

    return [...new Set(tags)];
  }

  /**
   * 生成推荐摘要
   */
  private generateSummary(
    recommendations: RecommendationItem[],
    type: string
  ): string {
    if (recommendations.length === 0) {
      return '未找到符合条件的推荐';
    }

    const avgScore =
      recommendations.reduce((sum, r) => sum + r.score, 0) /
      recommendations.length;

    switch (type) {
      case 'similar':
        return `找到 ${recommendations.length} 个相似产品，平均相似度 ${avgScore.toFixed(1)}%`;
      case 'substitute':
        return `找到 ${recommendations.length} 个可替代产品，建议进行验证后使用`;
      case 'compliance':
        return `生成 ${recommendations.length} 条合规路径建议`;
      case 'supplier':
        return `推荐 ${recommendations.length} 家供应商`;
      default:
        return `共 ${recommendations.length} 项推荐`;
    }
  }

  /**
   * 生成免责声明
   */
  private generateDisclaimer(): string {
    return '本推荐结果基于算法分析生成，仅供参考。实际决策请结合具体情况和专业意见。';
  }

  /**
   * 构建标准推荐提示词
   */
  private buildStandardRecommendationPrompt(input: RecommendationInput): string {
    const { sourceProduct } = input;

    return `请为以下PPE产品推荐适用的标准和法规：

## 产品信息
- 名称: ${sourceProduct.name}
- 描述: ${sourceProduct.description || 'N/A'}
- 材料: ${sourceProduct.materials?.join(', ') || 'N/A'}
- 预期用途: ${sourceProduct.intendedUse || 'N/A'}
- 目标市场: ${input.targetMarkets?.join(', ') || '未指定'}

请以JSON格式输出推荐结果，包含：
- standards: 标准列表，每个标准包含code、name、description、mandatory、relevanceScore
- regulations: 法规要求列表
- priority: 优先级排序`;
  }

  /**
   * 解析标准推荐响应
   */
  private parseStandardRecommendationResponse(
    response: string,
    input: RecommendationInput
  ): RecommendationResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      const standards = data.standards || [];

      const recommendations: RecommendationItem[] = standards.map(
        (std: any, index: number) => ({
          id: `std_${std.code}`,
          product: input.sourceProduct,
          type: RecommendationType.STANDARD_RECOMMENDATION,
          score: std.relevanceScore || 70,
          reasoning: std.description || '',
          reasoningDetails: [std.scope || '', std.requirements || ''],
          confidence: (std.relevanceScore || 70) / 100,
          rank: index + 1,
          tags: [std.type || '标准', std.mandatory ? '强制性' : '推荐性'],
          actionItems: [`获取${std.code}标准全文`, '评估产品符合性'],
        })
      );

      return {
        sourceProduct: input.sourceProduct,
        type: RecommendationType.STANDARD_RECOMMENDATION,
        scenario: input.scenario,
        recommendations,
        totalCount: recommendations.length,
        processingTime: 0,
        generatedAt: new Date().toISOString(),
        summary: `AI推荐 ${recommendations.length} 项适用标准`,
        disclaimer: this.generateDisclaimer(),
      };
    } catch (error) {
      this.logger.error('Failed to parse standard recommendation response', {
        error,
      });
      return {
        sourceProduct: input.sourceProduct,
        type: RecommendationType.STANDARD_RECOMMENDATION,
        scenario: input.scenario,
        recommendations: [],
        totalCount: 0,
        processingTime: 0,
        generatedAt: new Date().toISOString(),
        summary: '解析失败，请重试',
        disclaimer: this.generateDisclaimer(),
      };
    }
  }

  /**
   * 从缓存获取
   */
  private getFromCache(input: RecommendationInput): RecommendationResult | undefined {
    const key = this.generateCacheKey(input);
    return this.cache.get(key);
  }

  /**
   * 设置缓存
   */
  private setCache(input: RecommendationInput, result: RecommendationResult): void {
    if (this.cache.size >= this.config.cacheMaxSize) {
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
  private generateCacheKey(input: RecommendationInput): string {
    return `${input.sourceProduct.name}_${input.type}_${input.scenario}`;
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

export default RecommendationEngine;
