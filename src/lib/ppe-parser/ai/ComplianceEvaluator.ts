/**
 * 合规性评估器
 * 
 * AI-005: 评估算法
 * 用于评估产品的合规性，识别潜在风险
 */

import { Logger } from '../monitoring/Logger';
import { VolcengineAIClient } from './AIClient';

/**
 * 评估维度
 */
export enum EvaluationDimension {
  // 法规符合性
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  // 标准符合性
  STANDARD_COMPLIANCE = 'standard_compliance',
  // 文档完整性
  DOCUMENTATION_COMPLETENESS = 'documentation_completeness',
  // 标签合规性
  LABELING_COMPLIANCE = 'labeling_compliance',
  // 质量体系
  QUALITY_SYSTEM = 'quality_system',
  // 临床评价
  CLINICAL_EVALUATION = 'clinical_evaluation',
  // 风险管理
  RISK_MANAGEMENT = 'risk_management',
  // 上市后监督
  POST_MARKET_SURVEILLANCE = 'post_market_surveillance',
}

/**
 * 风险等级
 */
export enum RiskLevel {
  // 无风险
  NONE = 'none',
  // 低风险
  LOW = 'low',
  // 中风险
  MEDIUM = 'medium',
  // 高风险
  HIGH = 'high',
  // 严重风险
  CRITICAL = 'critical',
}

/**
 * 评估状态
 */
export enum EvaluationStatus {
  // 通过
  PASSED = 'passed',
  // 有条件通过
  CONDITIONAL = 'conditional',
  // 不通过
  FAILED = 'failed',
  // 需要更多信息
  NEEDS_INFO = 'needs_info',
}

/**
 * 产品合规信息
 */
export interface ProductComplianceInfo {
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description?: string;
  /** 产品类别 */
  category?: string;
  /** 设备类别 */
  deviceClass?: string;
  /** 目标市场 */
  targetMarkets: string[];
  /** 认证信息 */
  certifications?: CertificationInfo[];
  /** 技术文档 */
  technicalDocumentation?: DocumentationInfo;
  /** 标签信息 */
  labeling?: LabelingInfo;
  /** 质量体系 */
  qualitySystem?: QualitySystemInfo;
  /** 临床数据 */
  clinicalData?: ClinicalDataInfo;
  /** 风险管理 */
  riskManagement?: RiskManagementInfo;
}

/**
 * 认证信息
 */
export interface CertificationInfo {
  /** 认证类型 */
  type: string;
  /** 认证编号 */
  number: string;
  /** 颁发机构 */
  issuingBody: string;
  /** 颁发日期 */
  issueDate?: string;
  /** 有效期至 */
  expiryDate?: string;
  /** 认证范围 */
  scope?: string;
  /** 认证状态 */
  status: 'active' | 'expired' | 'suspended' | 'withdrawn';
}

/**
 * 技术文档信息
 */
export interface DocumentationInfo {
  /** 设备描述 */
  deviceDescription?: boolean;
  /** 规格说明 */
  specifications?: boolean;
  /** 设计图纸 */
  designDrawings?: boolean;
  /** 测试报告 */
  testReports?: boolean;
  /** 生物相容性评估 */
  biocompatibility?: boolean;
  /** 灭菌验证 */
  sterilizationValidation?: boolean;
  /** 稳定性研究 */
  stabilityStudies?: boolean;
  /** 软件文档 */
  softwareDocumentation?: boolean;
  /** 临床评价报告 */
  clinicalEvaluationReport?: boolean;
}

/**
 * 标签信息
 */
export interface LabelingInfo {
  /** 产品标签 */
  productLabel?: boolean;
  /** 使用说明 */
  instructionsForUse?: boolean;
  /** 警告和注意事项 */
  warnings?: boolean;
  /** 符号和标识 */
  symbols?: boolean;
  /** UDI标识 */
  udi?: boolean;
  /** 制造商信息 */
  manufacturerInfo?: boolean;
}

/**
 * 质量体系信息
 */
export interface QualitySystemInfo {
  /** ISO 13485认证 */
  iso13485?: boolean;
  /** 质量手册 */
  qualityManual?: boolean;
  /** 程序文件 */
  procedures?: boolean;
  /** 记录控制 */
  recordControl?: boolean;
  /** 内部审核 */
  internalAudits?: boolean;
  /** 管理评审 */
  managementReview?: boolean;
  /** 纠正预防措施 */
  capa?: boolean;
}

/**
 * 临床数据信息
 */
export interface ClinicalDataInfo {
  /** 临床评价报告 */
  clinicalEvaluationReport?: boolean;
  /** 临床试验数据 */
  clinicalTrialData?: boolean;
  /** 文献综述 */
  literatureReview?: boolean;
  /** 上市后临床随访 */
  postMarketClinicalFollowUp?: boolean;
  /** 不良事件数据 */
  adverseEventData?: boolean;
}

/**
 * 风险管理信息
 */
export interface RiskManagementInfo {
  /** 风险管理计划 */
  riskManagementPlan?: boolean;
  /** 风险分析 */
  riskAnalysis?: boolean;
  /** 风险评估 */
  riskEvaluation?: boolean;
  /** 风险控制措施 */
  riskControlMeasures?: boolean;
  /** 剩余风险评估 */
  residualRiskAssessment?: boolean;
  /** 风险管理报告 */
  riskManagementReport?: boolean;
}

/**
 * 评估输入
 */
export interface EvaluationInput {
  /** 产品信息 */
  product: ProductComplianceInfo;
  /** 评估维度（可选，默认全部） */
  dimensions?: EvaluationDimension[];
  /** 目标法规（可选） */
  targetRegulations?: string[];
  /** 参考标准（可选） */
  referenceStandards?: string[];
}

/**
 * 维度评估结果
 */
export interface DimensionEvaluation {
  /** 评估维度 */
  dimension: EvaluationDimension;
  /** 评估状态 */
  status: EvaluationStatus;
  /** 分数 (0-100) */
  score: number;
  /** 风险等级 */
  riskLevel: RiskLevel;
  /** 评估说明 */
  description: string;
  /** 发现的问题 */
  findings: Finding[];
  /** 改进建议 */
  recommendations: string[];
  /** 置信度 */
  confidence: number;
}

/**
 * 发现问题
 */
export interface Finding {
  /** 问题ID */
  id: string;
  /** 问题描述 */
  description: string;
  /** 严重程度 */
  severity: 'minor' | 'major' | 'critical';
  /** 相关法规/标准 */
  relatedRegulations?: string[];
  /** 建议措施 */
  recommendedActions?: string[];
}

/**
 * 评估结果
 */
export interface EvaluationResult {
  /** 产品信息 */
  product: ProductComplianceInfo;
  /** 综合分数 (0-100) */
  overallScore: number;
  /** 总体评估状态 */
  overallStatus: EvaluationStatus;
  /** 总体风险等级 */
  overallRiskLevel: RiskLevel;
  /** 各维度评估结果 */
  dimensions: DimensionEvaluation[];
  /** 关键发现 */
  keyFindings: Finding[];
  /** 优先建议 */
  priorityRecommendations: string[];
  /** 合规差距分析 */
  gapAnalysis: GapAnalysis;
  /** 处理时间（毫秒） */
  processingTime: number;
  /** 评估时间戳 */
  evaluatedAt: string;
}

/**
 * 差距分析
 */
export interface GapAnalysis {
  /** 已满足的要求 */
  metRequirements: string[];
  /** 部分满足的要求 */
  partiallyMetRequirements: string[];
  /** 未满足的要求 */
  unmetRequirements: string[];
  /** 不适用要求 */
  notApplicableRequirements: string[];
}

/**
 * 批量评估输入
 */
export interface BatchEvaluationInput {
  /** 产品列表 */
  products: ProductComplianceInfo[];
  /** 评估维度（可选） */
  dimensions?: EvaluationDimension[];
}

/**
 * 批量评估结果
 */
export interface BatchEvaluationResult {
  /** 评估结果列表 */
  results: EvaluationResult[];
  /** 处理时间（毫秒） */
  processingTime: number;
  /** 统计信息 */
  statistics: EvaluationStatistics;
}

/**
 * 评估统计
 */
export interface EvaluationStatistics {
  /** 总产品数 */
  totalProducts: number;
  /** 通过数 */
  passedCount: number;
  /** 有条件通过数 */
  conditionalCount: number;
  /** 不通过数 */
  failedCount: number;
  /** 平均分数 */
  averageScore: number;
  /** 高风险产品数 */
  highRiskCount: number;
}

/**
 * 评估器配置
 */
export interface EvaluatorConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存最大条目数 */
  cacheMaxSize: number;
  /** 通过分数阈值 */
  passThreshold: number;
  /** 有条件通过分数阈值 */
  conditionalThreshold: number;
  /** 是否使用AI模型 */
  useAIModel: boolean;
  /** AI模型配置 */
  aiModel?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  /** 默认评估维度 */
  defaultDimensions: EvaluationDimension[];
}

/**
 * 合规性评估器
 */
export class ComplianceEvaluator {
  private logger: Logger;
  private aiClient: VolcengineAIClient;
  private config: EvaluatorConfig;
  private cache: Map<string, EvaluationResult>;

  constructor(config?: Partial<EvaluatorConfig>) {
    this.logger = new Logger('ComplianceEvaluator');
    this.aiClient = new VolcengineAIClient();
    this.config = {
      enableCache: true,
      cacheMaxSize: 500,
      passThreshold: 80,
      conditionalThreshold: 60,
      useAIModel: true,
      defaultDimensions: Object.values(EvaluationDimension),
      ...config,
    };
    this.cache = new Map();
  }

  /**
   * 评估产品合规性
   */
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const startTime = Date.now();

    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.getFromCache(input);
      if (cached) {
        this.logger.debug('Cache hit for compliance evaluation');
        return cached;
      }
    }

    try {
      let result: EvaluationResult;

      if (this.config.useAIModel) {
        // 使用AI模型评估
        result = await this.evaluateWithAI(input);
      } else {
        // 使用规则评估
        result = await this.evaluateWithRules(input);
      }

      // 缓存结果
      if (this.config.enableCache) {
        this.setCache(input, result);
      }

      this.logger.info('Compliance evaluation completed', {
        productName: input.product.name,
        overallScore: result.overallScore,
        overallStatus: result.overallStatus,
        overallRiskLevel: result.overallRiskLevel,
      });

      return result;
    } catch (error) {
      this.logger.error('Compliance evaluation failed', { error });
      throw error;
    }
  }

  /**
   * 批量评估
   */
  async batchEvaluate(input: BatchEvaluationInput): Promise<BatchEvaluationResult> {
    const startTime = Date.now();

    this.logger.info('Starting batch compliance evaluation', {
      productCount: input.products.length,
    });

    // 评估所有产品
    const promises = input.products.map((product) =>
      this.evaluate({
        product,
        dimensions: input.dimensions,
      })
    );

    const results = await Promise.all(promises);

    // 计算统计信息
    const statistics = this.calculateStatistics(results);

    const processingTime = Date.now() - startTime;

    this.logger.info('Batch evaluation completed', {
      totalProducts: results.length,
      passedCount: statistics.passedCount,
      averageScore: statistics.averageScore,
      processingTime,
    });

    return {
      results,
      processingTime,
      statistics,
    };
  }

  /**
   * 快速评估（仅规则）
   */
  async quickEvaluate(product: ProductComplianceInfo): Promise<{
    score: number;
    status: EvaluationStatus;
    riskLevel: RiskLevel;
  }> {
    const result = await this.evaluateWithRules({
      product,
      useAIModel: false,
    } as EvaluationInput);

    return {
      score: result.overallScore,
      status: result.overallStatus,
      riskLevel: result.overallRiskLevel,
    };
  }

  /**
   * 使用AI模型评估
   */
  private async evaluateWithAI(input: EvaluationInput): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(input);

    const response = await this.aiClient.generateContent({
      model: this.config.aiModel?.model || 'doubao-pro-32k-241215',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的医疗器械合规性评估专家。你需要根据提供的产品信息，
从多个维度评估产品的合规性，识别潜在风险，并给出详细的评估报告。

请以JSON格式输出结果，包含以下字段：
- overallScore: 综合分数 (0-100)
- overallStatus: 总体状态 (passed, conditional, failed, needs_info)
- overallRiskLevel: 总体风险等级 (none, low, medium, high, critical)
- dimensions: 各维度评估结果数组
- keyFindings: 关键发现数组
- priorityRecommendations: 优先建议数组
- gapAnalysis: 差距分析对象`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: this.config.aiModel?.temperature ?? 0.3,
      maxTokens: this.config.aiModel?.maxTokens ?? 3000,
    });

    return this.parseEvaluationResponse(response, input);
  }

  /**
   * 使用规则评估
   */
  private async evaluateWithRules(input: EvaluationInput): Promise<EvaluationResult> {
    const dimensions = input.dimensions || this.config.defaultDimensions;
    const dimensionResults: DimensionEvaluation[] = [];

    // 评估每个维度
    for (const dimension of dimensions) {
      const result = await this.evaluateDimension(dimension, input.product);
      dimensionResults.push(result);
    }

    // 计算综合分数
    const overallScore = this.calculateOverallScore(dimensionResults);

    // 确定总体状态
    const overallStatus = this.determineOverallStatus(overallScore, dimensionResults);

    // 确定总体风险等级
    const overallRiskLevel = this.determineOverallRiskLevel(dimensionResults);

    // 收集关键发现
    const keyFindings = this.collectKeyFindings(dimensionResults);

    // 生成优先建议
    const priorityRecommendations = this.generatePriorityRecommendations(dimensionResults);

    // 进行差距分析
    const gapAnalysis = this.performGapAnalysis(input.product, dimensionResults);

    return {
      product: input.product,
      overallScore,
      overallStatus,
      overallRiskLevel,
      dimensions: dimensionResults,
      keyFindings,
      priorityRecommendations,
      gapAnalysis,
      processingTime: 0,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * 评估单个维度
   */
  private async evaluateDimension(
    dimension: EvaluationDimension,
    product: ProductComplianceInfo
  ): Promise<DimensionEvaluation> {
    switch (dimension) {
      case EvaluationDimension.REGULATORY_COMPLIANCE:
        return this.evaluateRegulatoryCompliance(product);
      case EvaluationDimension.STANDARD_COMPLIANCE:
        return this.evaluateStandardCompliance(product);
      case EvaluationDimension.DOCUMENTATION_COMPLETENESS:
        return this.evaluateDocumentationCompleteness(product);
      case EvaluationDimension.LABELING_COMPLIANCE:
        return this.evaluateLabelingCompliance(product);
      case EvaluationDimension.QUALITY_SYSTEM:
        return this.evaluateQualitySystem(product);
      case EvaluationDimension.CLINICAL_EVALUATION:
        return this.evaluateClinicalEvaluation(product);
      case EvaluationDimension.RISK_MANAGEMENT:
        return this.evaluateRiskManagement(product);
      case EvaluationDimension.POST_MARKET_SURVEILLANCE:
        return this.evaluatePostMarketSurveillance(product);
      default:
        return this.createDefaultDimensionEvaluation(dimension);
    }
  }

  /**
   * 评估法规符合性
   */
  private evaluateRegulatoryCompliance(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    // 检查认证信息
    if (!product.certifications || product.certifications.length === 0) {
      findings.push({
        id: 'REG-001',
        description: '缺少产品认证信息',
        severity: 'critical',
        recommendedActions: ['获取目标市场的产品认证'],
      });
      recommendations.push('尽快申请目标市场的产品认证');
    } else {
      // 检查认证状态
      const expiredCerts = product.certifications.filter(
        (cert) => cert.status === 'expired'
      );
      if (expiredCerts.length > 0) {
        findings.push({
          id: 'REG-002',
          description: `发现 ${expiredCerts.length} 个过期认证`,
          severity: 'major',
          recommendedActions: ['更新过期认证'],
        });
        recommendations.push('及时更新过期的产品认证');
      }
    }

    // 检查目标市场
    if (!product.targetMarkets || product.targetMarkets.length === 0) {
      findings.push({
        id: 'REG-003',
        description: '未指定目标市场',
        severity: 'major',
        recommendedActions: ['明确产品的目标市场'],
      });
    }

    // 计算分数
    const score = Math.max(0, 100 - findings.length * 20);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.REGULATORY_COMPLIANCE,
      status,
      score,
      riskLevel,
      description: `法规符合性评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.85,
    };
  }

  /**
   * 评估标准符合性
   */
  private evaluateStandardCompliance(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    // 检查设备类别
    if (!product.deviceClass) {
      findings.push({
        id: 'STD-001',
        description: '未指定设备类别',
        severity: 'major',
        recommendedActions: ['根据产品风险等级确定设备类别'],
      });
    }

    // 检查产品类别
    if (!product.category) {
      findings.push({
        id: 'STD-002',
        description: '未指定产品类别',
        severity: 'minor',
        recommendedActions: ['明确产品类别'],
      });
    }

    const score = Math.max(0, 100 - findings.length * 15);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.STANDARD_COMPLIANCE,
      status,
      score,
      riskLevel,
      description: `标准符合性评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.8,
    };
  }

  /**
   * 评估文档完整性
   */
  private evaluateDocumentationCompleteness(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    const docs = product.technicalDocumentation;
    if (!docs) {
      findings.push({
        id: 'DOC-001',
        description: '缺少技术文档信息',
        severity: 'critical',
        recommendedActions: ['准备完整的技术文档'],
      });
      recommendations.push('建立完善的技术文档体系');
    } else {
      // 检查必需文档
      const requiredDocs = [
        'deviceDescription',
        'specifications',
        'testReports',
        'clinicalEvaluationReport',
      ];

      for (const doc of requiredDocs) {
        if (!docs[doc as keyof DocumentationInfo]) {
          findings.push({
            id: `DOC-${doc}`,
            description: `缺少${this.getDocName(doc)}`,
            severity: 'major',
            recommendedActions: [`准备${this.getDocName(doc)}`],
          });
        }
      }

      if (findings.length > 0) {
        recommendations.push('补充缺失的技术文档');
      }
    }

    const score = Math.max(0, 100 - findings.length * 10);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.DOCUMENTATION_COMPLETENESS,
      status,
      score,
      riskLevel,
      description: `文档完整性评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.9,
    };
  }

  /**
   * 评估标签合规性
   */
  private evaluateLabelingCompliance(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    const labeling = product.labeling;
    if (!labeling) {
      findings.push({
        id: 'LBL-001',
        description: '缺少标签信息',
        severity: 'major',
        recommendedActions: ['准备符合法规要求的标签'],
      });
    } else {
      if (!labeling.productLabel) {
        findings.push({
          id: 'LBL-002',
          description: '缺少产品标签',
          severity: 'major',
        });
      }
      if (!labeling.instructionsForUse) {
        findings.push({
          id: 'LBL-003',
          description: '缺少使用说明',
          severity: 'major',
        });
      }
      if (!labeling.warnings) {
        findings.push({
          id: 'LBL-004',
          description: '缺少警告和注意事项',
          severity: 'minor',
        });
      }
    }

    const score = Math.max(0, 100 - findings.length * 15);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.LABELING_COMPLIANCE,
      status,
      score,
      riskLevel,
      description: `标签合规性评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.85,
    };
  }

  /**
   * 评估质量体系
   */
  private evaluateQualitySystem(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    const qs = product.qualitySystem;
    if (!qs) {
      findings.push({
        id: 'QS-001',
        description: '缺少质量体系信息',
        severity: 'major',
        recommendedActions: ['建立符合ISO 13485的质量管理体系'],
      });
      recommendations.push('建立ISO 13485质量管理体系');
    } else {
      if (!qs.iso13485) {
        findings.push({
          id: 'QS-002',
          description: '未获得ISO 13485认证',
          severity: 'major',
          recommendedActions: ['申请ISO 13485认证'],
        });
        recommendations.push('申请ISO 13485质量管理体系认证');
      }
      if (!qs.capa) {
        findings.push({
          id: 'QS-003',
          description: '缺少纠正预防措施程序',
          severity: 'minor',
        });
      }
    }

    const score = Math.max(0, 100 - findings.length * 15);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.QUALITY_SYSTEM,
      status,
      score,
      riskLevel,
      description: `质量体系评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.8,
    };
  }

  /**
   * 评估临床评价
   */
  private evaluateClinicalEvaluation(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    const clinical = product.clinicalData;
    if (!clinical) {
      findings.push({
        id: 'CLN-001',
        description: '缺少临床数据信息',
        severity: 'major',
        recommendedActions: ['准备临床评价报告'],
      });
      recommendations.push('根据产品风险等级准备相应的临床评价资料');
    } else {
      if (!clinical.clinicalEvaluationReport) {
        findings.push({
          id: 'CLN-002',
          description: '缺少临床评价报告',
          severity: 'major',
          recommendedActions: ['编制临床评价报告'],
        });
      }
    }

    const score = Math.max(0, 100 - findings.length * 20);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.CLINICAL_EVALUATION,
      status,
      score,
      riskLevel,
      description: `临床评价评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.75,
    };
  }

  /**
   * 评估风险管理
   */
  private evaluateRiskManagement(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    const risk = product.riskManagement;
    if (!risk) {
      findings.push({
        id: 'RISK-001',
        description: '缺少风险管理信息',
        severity: 'critical',
        recommendedActions: ['建立符合ISO 14971的风险管理体系'],
      });
      recommendations.push('建立完整的风险管理体系');
    } else {
      if (!risk.riskManagementReport) {
        findings.push({
          id: 'RISK-002',
          description: '缺少风险管理报告',
          severity: 'major',
        });
      }
      if (!risk.riskControlMeasures) {
        findings.push({
          id: 'RISK-003',
          description: '缺少风险控制措施',
          severity: 'major',
        });
      }
    }

    const score = Math.max(0, 100 - findings.length * 20);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.RISK_MANAGEMENT,
      status,
      score,
      riskLevel,
      description: `风险管理评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.85,
    };
  }

  /**
   * 评估上市后监督
   */
  private evaluatePostMarketSurveillance(product: ProductComplianceInfo): DimensionEvaluation {
    const findings: Finding[] = [];
    const recommendations: string[] = [];

    // 上市后监督通常适用于已上市产品
    // 对于新产品，主要检查是否有上市后监督计划

    const clinical = product.clinicalData;
    if (clinical && !clinical.postMarketClinicalFollowUp) {
      findings.push({
        id: 'PMS-001',
        description: '缺少上市后临床随访计划',
        severity: 'minor',
        recommendedActions: ['制定上市后监督计划'],
      });
    }

    const score = Math.max(0, 100 - findings.length * 10);
    const status = this.scoreToStatus(score);
    const riskLevel = this.findingsToRiskLevel(findings);

    return {
      dimension: EvaluationDimension.POST_MARKET_SURVEILLANCE,
      status,
      score,
      riskLevel,
      description: `上市后监督评估：${findings.length} 个问题发现`,
      findings,
      recommendations,
      confidence: 0.7,
    };
  }

  /**
   * 创建默认维度评估
   */
  private createDefaultDimensionEvaluation(dimension: EvaluationDimension): DimensionEvaluation {
    return {
      dimension,
      status: EvaluationStatus.NEEDS_INFO,
      score: 50,
      riskLevel: RiskLevel.MEDIUM,
      description: '未实现该维度的评估',
      findings: [],
      recommendations: ['需要人工评估该维度'],
      confidence: 0.5,
    };
  }

  /**
   * 计算综合分数
   */
  private calculateOverallScore(dimensions: DimensionEvaluation[]): number {
    if (dimensions.length === 0) return 0;
    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
    return Math.round(totalScore / dimensions.length);
  }

  /**
   * 确定总体状态
   */
  private determineOverallStatus(
    score: number,
    dimensions: DimensionEvaluation[]
  ): EvaluationStatus {
    // 如果有任何关键发现，状态降级
    const hasCriticalFinding = dimensions.some((d) =>
      d.findings.some((f) => f.severity === 'critical')
    );

    if (hasCriticalFinding) {
      return EvaluationStatus.FAILED;
    }

    if (score >= this.config.passThreshold) {
      return EvaluationStatus.PASSED;
    } else if (score >= this.config.conditionalThreshold) {
      return EvaluationStatus.CONDITIONAL;
    } else {
      return EvaluationStatus.FAILED;
    }
  }

  /**
   * 确定总体风险等级
   */
  private determineOverallRiskLevel(dimensions: DimensionEvaluation[]): RiskLevel {
    const riskLevels = dimensions.map((d) => d.riskLevel);

    if (riskLevels.includes(RiskLevel.CRITICAL)) {
      return RiskLevel.CRITICAL;
    } else if (riskLevels.includes(RiskLevel.HIGH)) {
      return RiskLevel.HIGH;
    } else if (riskLevels.includes(RiskLevel.MEDIUM)) {
      return RiskLevel.MEDIUM;
    } else if (riskLevels.includes(RiskLevel.LOW)) {
      return RiskLevel.LOW;
    }
    return RiskLevel.NONE;
  }

  /**
   * 收集关键发现
   */
  private collectKeyFindings(dimensions: DimensionEvaluation[]): Finding[] {
    const allFindings = dimensions.flatMap((d) => d.findings);
    // 按严重程度排序
    const severityOrder = { critical: 0, major: 1, minor: 2 };
    return allFindings.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * 生成优先建议
   */
  private generatePriorityRecommendations(dimensions: DimensionEvaluation[]): string[] {
    const recommendations = dimensions.flatMap((d) => d.recommendations);
    // 去重
    return [...new Set(recommendations)];
  }

  /**
   * 进行差距分析
   */
  private performGapAnalysis(
    product: ProductComplianceInfo,
    dimensions: DimensionEvaluation[]
  ): GapAnalysis {
    const metRequirements: string[] = [];
    const partiallyMetRequirements: string[] = [];
    const unmetRequirements: string[] = [];
    const notApplicableRequirements: string[] = [];

    for (const dimension of dimensions) {
      const reqName = this.getDimensionName(dimension.dimension);
      if (dimension.status === EvaluationStatus.PASSED) {
        metRequirements.push(reqName);
      } else if (dimension.status === EvaluationStatus.CONDITIONAL) {
        partiallyMetRequirements.push(reqName);
      } else if (dimension.status === EvaluationStatus.FAILED) {
        unmetRequirements.push(reqName);
      } else {
        notApplicableRequirements.push(reqName);
      }
    }

    return {
      metRequirements,
      partiallyMetRequirements,
      unmetRequirements,
      notApplicableRequirements,
    };
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(results: EvaluationResult[]): EvaluationStatistics {
    const totalProducts = results.length;
    const passedCount = results.filter(
      (r) => r.overallStatus === EvaluationStatus.PASSED
    ).length;
    const conditionalCount = results.filter(
      (r) => r.overallStatus === EvaluationStatus.CONDITIONAL
    ).length;
    const failedCount = results.filter(
      (r) => r.overallStatus === EvaluationStatus.FAILED
    ).length;
    const averageScore =
      results.reduce((sum, r) => sum + r.overallScore, 0) / totalProducts;
    const highRiskCount = results.filter(
      (r) => r.overallRiskLevel === RiskLevel.HIGH || r.overallRiskLevel === RiskLevel.CRITICAL
    ).length;

    return {
      totalProducts,
      passedCount,
      conditionalCount,
      failedCount,
      averageScore: Math.round(averageScore * 10) / 10,
      highRiskCount,
    };
  }

  /**
   * 分数转状态
   */
  private scoreToStatus(score: number): EvaluationStatus {
    if (score >= this.config.passThreshold) {
      return EvaluationStatus.PASSED;
    } else if (score >= this.config.conditionalThreshold) {
      return EvaluationStatus.CONDITIONAL;
    } else {
      return EvaluationStatus.FAILED;
    }
  }

  /**
   * 发现转风险等级
   */
  private findingsToRiskLevel(findings: Finding[]): RiskLevel {
    if (findings.some((f) => f.severity === 'critical')) {
      return RiskLevel.CRITICAL;
    } else if (findings.some((f) => f.severity === 'major')) {
      return RiskLevel.HIGH;
    } else if (findings.some((f) => f.severity === 'minor')) {
      return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
  }

  /**
   * 获取文档名称
   */
  private getDocName(doc: string): string {
    const docNames: Record<string, string> = {
      deviceDescription: '设备描述',
      specifications: '规格说明',
      designDrawings: '设计图纸',
      testReports: '测试报告',
      biocompatibility: '生物相容性评估',
      sterilizationValidation: '灭菌验证',
      stabilityStudies: '稳定性研究',
      softwareDocumentation: '软件文档',
      clinicalEvaluationReport: '临床评价报告',
    };
    return docNames[doc] || doc;
  }

  /**
   * 获取维度名称
   */
  private getDimensionName(dimension: EvaluationDimension): string {
    const dimensionNames: Record<EvaluationDimension, string> = {
      [EvaluationDimension.REGULATORY_COMPLIANCE]: '法规符合性',
      [EvaluationDimension.STANDARD_COMPLIANCE]: '标准符合性',
      [EvaluationDimension.DOCUMENTATION_COMPLETENESS]: '文档完整性',
      [EvaluationDimension.LABELING_COMPLIANCE]: '标签合规性',
      [EvaluationDimension.QUALITY_SYSTEM]: '质量体系',
      [EvaluationDimension.CLINICAL_EVALUATION]: '临床评价',
      [EvaluationDimension.RISK_MANAGEMENT]: '风险管理',
      [EvaluationDimension.POST_MARKET_SURVEILLANCE]: '上市后监督',
    };
    return dimensionNames[dimension] || dimension;
  }

  /**
   * 构建评估提示词
   */
  private buildEvaluationPrompt(input: EvaluationInput): string {
    const { product } = input;

    return `请评估以下PPE产品的合规性：

## 产品信息
- 名称: ${product.name}
- 描述: ${product.description || 'N/A'}
- 类别: ${product.category || 'N/A'}
- 设备类别: ${product.deviceClass || 'N/A'}
- 目标市场: ${product.targetMarkets.join(', ')}

## 认证信息
${product.certifications ? product.certifications.map(c => `- ${c.type}: ${c.number} (${c.status})`).join('\n') : '无'}

## 技术文档
${product.technicalDocumentation ? Object.entries(product.technicalDocumentation).map(([k, v]) => `- ${k}: ${v ? '有' : '无'}`).join('\n') : '无'}

## 标签信息
${product.labeling ? Object.entries(product.labeling).map(([k, v]) => `- ${k}: ${v ? '有' : '无'}`).join('\n') : '无'}

## 质量体系
${product.qualitySystem ? Object.entries(product.qualitySystem).map(([k, v]) => `- ${k}: ${v ? '有' : '无'}`).join('\n') : '无'}

## 临床数据
${product.clinicalData ? Object.entries(product.clinicalData).map(([k, v]) => `- ${k}: ${v ? '有' : '无'}`).join('\n') : '无'}

## 风险管理
${product.riskManagement ? Object.entries(product.riskManagement).map(([k, v]) => `- ${k}: ${v ? '有' : '无'}`).join('\n') : '无'}

请从以下维度评估合规性：
1. 法规符合性
2. 标准符合性
3. 文档完整性
4. 标签合规性
5. 质量体系
6. 临床评价
7. 风险管理
8. 上市后监督

请以JSON格式输出评估结果。`;
  }

  /**
   * 解析评估响应
   */
  private parseEvaluationResponse(response: string, input: EvaluationInput): EvaluationResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        product: input.product,
        overallScore: data.overallScore ?? 0,
        overallStatus: data.overallStatus as EvaluationStatus,
        overallRiskLevel: data.overallRiskLevel as RiskLevel,
        dimensions: data.dimensions || [],
        keyFindings: data.keyFindings || [],
        priorityRecommendations: data.priorityRecommendations || [],
        gapAnalysis: data.gapAnalysis || {
          metRequirements: [],
          partiallyMetRequirements: [],
          unmetRequirements: [],
          notApplicableRequirements: [],
        },
        processingTime: 0,
        evaluatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to parse evaluation response', { error, response });
      // 返回默认结果
      return {
        product: input.product,
        overallScore: 50,
        overallStatus: EvaluationStatus.NEEDS_INFO,
        overallRiskLevel: RiskLevel.MEDIUM,
        dimensions: [],
        keyFindings: [],
        priorityRecommendations: ['解析失败，请人工评估'],
        gapAnalysis: {
          metRequirements: [],
          partiallyMetRequirements: [],
          unmetRequirements: [],
          notApplicableRequirements: [],
        },
        processingTime: 0,
        evaluatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 从缓存获取
   */
  private getFromCache(input: EvaluationInput): EvaluationResult | undefined {
    const key = this.generateCacheKey(input);
    return this.cache.get(key);
  }

  /**
   * 设置缓存
   */
  private setCache(input: EvaluationInput, result: EvaluationResult): void {
    if (this.cache.size >= this.config.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    const key = this.generateCacheKey(input);
    this.cache.set(key, result);
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(input: EvaluationInput): string {
    return `${input.product.name}_${input.product.targetMarkets.join('_')}`;
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

export default ComplianceEvaluator;
