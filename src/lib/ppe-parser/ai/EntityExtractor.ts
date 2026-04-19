/**
 * AI 实体识别模型
 * Phase 3: AI 模型集成
 *
 * 基于大模型的 PPE 产品实体信息提取系统
 */

import { getLogger } from '../monitoring';

/**
 * 实体类型定义
 */
export enum EntityType {
  // 产品信息
  PRODUCT_NAME = 'product_name',
  MODEL_NUMBER = 'model_number',
  BRAND = 'brand',
  
  // 制造商信息
  MANUFACTURER = 'manufacturer',
  MANUFACTURER_ADDRESS = 'manufacturer_address',
  MANUFACTURER_COUNTRY = 'manufacturer_country',
  
  // 认证信息
  CERTIFICATION_NUMBER = 'certification_number',
  K_NUMBER = 'k_number',
  PRODUCT_CODE = 'product_code',
  
  // 日期信息
  APPROVAL_DATE = 'approval_date',
  EXPIRATION_DATE = 'expiration_date',
  
  // 规格信息
  MATERIAL = 'material',
  SIZE = 'size',
  COLOR = 'color',
  
  // 标准信息
  STANDARD = 'standard',
  REGULATION = 'regulation',
  
  // 联系信息
  CONTACT_PHONE = 'contact_phone',
  CONTACT_EMAIL = 'contact_email',
  CONTACT_FAX = 'contact_fax',
  
  // 其他
  INTENDED_USE = 'intended_use',
  INDICATIONS = 'indications',
  CONTRAINDICATIONS = 'contraindications',
  WARNINGS = 'warnings',
}

/**
 * 实体定义
 */
export interface Entity {
  /** 实体类型 */
  type: EntityType;
  /** 实体值 */
  value: string;
  /** 原始文本 */
  rawText: string;
  /** 在文本中的起始位置 */
  startPos: number;
  /** 在文本中的结束位置 */
  endPos: number;
  /** 置信度 */
  confidence: number;
}

/**
 * 实体提取结果
 */
export interface EntityExtractionResult {
  /** 提取的实体列表 */
  entities: Entity[];
  /** 处理时间（毫秒） */
  processingTime: number;
  /** 原始文本长度 */
  textLength: number;
  /** 实体数量统计 */
  entityCounts: Record<EntityType, number>;
}

/**
 * 实体提取输入
 */
export interface EntityExtractionInput {
  /** 要分析的文本 */
  text: string;
  /** 指定要提取的实体类型（可选，默认提取所有） */
  targetEntities?: EntityType[];
  /** 上下文信息 */
  context?: {
    sourceType?: string;
    market?: string;
    documentType?: string;
  };
}

/**
 * 实体提取器配置
 */
export interface EntityExtractorConfig {
  /** AI 模型名称 */
  model: string;
  /** API 端点 */
  apiEndpoint: string;
  /** API Key */
  apiKey: string;
  /** 最低置信度阈值 */
  minConfidence: number;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存 TTL（毫秒） */
  cacheTtl: number;
  /** 最大文本长度 */
  maxTextLength: number;
  /** 请求超时（毫秒） */
  timeout: number;
}

/**
 * 缓存项
 */
interface CacheItem {
  result: EntityExtractionResult;
  timestamp: number;
}

/**
 * AI 实体提取器
 * 使用大模型从文本中提取结构化实体信息
 */
export class EntityExtractor {
  readonly name = 'EntityExtractor';

  private config: EntityExtractorConfig;
  private cache: Map<string, CacheItem> = new Map();
  private logger = getLogger().child('EntityExtractor');

  constructor(config?: Partial<EntityExtractorConfig>) {
    this.config = {
      model: 'doubao-pro-32k',
      apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      apiKey: process.env.VOLCENGINE_API_KEY || '',
      minConfidence: 0.7,
      enableCache: true,
      cacheTtl: 3600000, // 1 hour
      maxTextLength: 8000,
      timeout: 30000,
      ...config,
    };

    this.logger.info('EntityExtractor initialized', { model: this.config.model });
  }

  /**
   * 提取实体
   */
  async extract(input: EntityExtractionInput): Promise<EntityExtractionResult> {
    const startTime = Date.now();

    // 检查文本长度
    if (input.text.length > this.config.maxTextLength) {
      this.logger.warn('Text too long, truncating', {
        originalLength: input.text.length,
        maxLength: this.config.maxTextLength,
      });
      input.text = input.text.substring(0, this.config.maxTextLength);
    }

    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.getFromCache(input);
      if (cached) {
        this.logger.debug('Cache hit for entity extraction');
        return cached;
      }
    }

    try {
      // 构建提示词
      const prompt = this.buildExtractionPrompt(input);

      // 调用 AI 模型
      const response = await this.callAIModel(prompt);

      // 解析结果
      const result = this.parseExtractionResponse(
        response,
        input.text,
        Date.now() - startTime
      );

      // 过滤低置信度实体
      result.entities = result.entities.filter(
        (entity) => entity.confidence >= this.config.minConfidence
      );

      // 更新统计
      result.entityCounts = this.countEntities(result.entities);

      // 缓存结果
      if (this.config.enableCache) {
        this.setCache(input, result);
      }

      this.logger.info('Entity extraction completed', {
        entityCount: result.entities.length,
        processingTime: result.processingTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Entity extraction failed', { error });
      throw error;
    }
  }

  /**
   * 批量提取
   */
  async extractBatch(inputs: EntityExtractionInput[]): Promise<EntityExtractionResult[]> {
    this.logger.info(`Starting batch entity extraction of ${inputs.length} texts`);

    const results: EntityExtractionResult[] = [];

    for (const input of inputs) {
      try {
        const result = await this.extract(input);
        results.push(result);
      } catch (error) {
        this.logger.error('Batch extraction item failed', { error });
        results.push({
          entities: [],
          processingTime: 0,
          textLength: input.text.length,
          entityCounts: {} as Record<EntityType, number>,
        });
      }
    }

    this.logger.info(`Batch extraction completed: ${results.length} texts`);
    return results;
  }

  /**
   * 提取特定类型的实体
   */
  async extractByType(
    text: string,
    entityType: EntityType
  ): Promise<Entity[]> {
    const result = await this.extract({
      text,
      targetEntities: [entityType],
    });

    return result.entities.filter((entity) => entity.type === entityType);
  }

  /**
   * 提取制造商信息
   */
  async extractManufacturerInfo(text: string): Promise<{
    name?: string;
    address?: string;
    country?: string;
    phone?: string;
    email?: string;
  }> {
    const result = await this.extract({
      text,
      targetEntities: [
        EntityType.MANUFACTURER,
        EntityType.MANUFACTURER_ADDRESS,
        EntityType.MANUFACTURER_COUNTRY,
        EntityType.CONTACT_PHONE,
        EntityType.CONTACT_EMAIL,
      ],
    });

    const getFirstValue = (type: EntityType) =>
      result.entities.find((e) => e.type === type)?.value;

    return {
      name: getFirstValue(EntityType.MANUFACTURER),
      address: getFirstValue(EntityType.MANUFACTURER_ADDRESS),
      country: getFirstValue(EntityType.MANUFACTURER_COUNTRY),
      phone: getFirstValue(EntityType.CONTACT_PHONE),
      email: getFirstValue(EntityType.CONTACT_EMAIL),
    };
  }

  /**
   * 提取认证信息
   */
  async extractCertificationInfo(text: string): Promise<{
    kNumber?: string;
    productCode?: string;
    certificationNumber?: string;
    approvalDate?: string;
    expirationDate?: string;
  }> {
    const result = await this.extract({
      text,
      targetEntities: [
        EntityType.K_NUMBER,
        EntityType.PRODUCT_CODE,
        EntityType.CERTIFICATION_NUMBER,
        EntityType.APPROVAL_DATE,
        EntityType.EXPIRATION_DATE,
      ],
    });

    const getFirstValue = (type: EntityType) =>
      result.entities.find((e) => e.type === type)?.value;

    return {
      kNumber: getFirstValue(EntityType.K_NUMBER),
      productCode: getFirstValue(EntityType.PRODUCT_CODE),
      certificationNumber: getFirstValue(EntityType.CERTIFICATION_NUMBER),
      approvalDate: getFirstValue(EntityType.APPROVAL_DATE),
      expirationDate: getFirstValue(EntityType.EXPIRATION_DATE),
    };
  }

  /**
   * 构建提取提示词
   */
  private buildExtractionPrompt(input: EntityExtractionInput): string {
    const { text, targetEntities, context } = input;

    const entityTypes = targetEntities || Object.values(EntityType);

    const entityDescriptions: Record<EntityType, string> = {
      [EntityType.PRODUCT_NAME]: 'Product name or model name',
      [EntityType.MODEL_NUMBER]: 'Model number or catalog number',
      [EntityType.BRAND]: 'Brand or trade name',
      [EntityType.MANUFACTURER]: 'Manufacturer or applicant name',
      [EntityType.MANUFACTURER_ADDRESS]: 'Manufacturer address',
      [EntityType.MANUFACTURER_COUNTRY]: 'Manufacturer country',
      [EntityType.CERTIFICATION_NUMBER]: 'Certification or registration number',
      [EntityType.K_NUMBER]: 'FDA 510(k) number (format: K######)',
      [EntityType.PRODUCT_CODE]: 'FDA product code (3 letters)',
      [EntityType.APPROVAL_DATE]: 'Approval or clearance date',
      [EntityType.EXPIRATION_DATE]: 'Expiration or expiry date',
      [EntityType.MATERIAL]: 'Material composition',
      [EntityType.SIZE]: 'Size or dimensions',
      [EntityType.COLOR]: 'Color',
      [EntityType.STANDARD]: 'Applicable standards (e.g., ASTM, ISO)',
      [EntityType.REGULATION]: 'Applicable regulations',
      [EntityType.CONTACT_PHONE]: 'Contact phone number',
      [EntityType.CONTACT_EMAIL]: 'Contact email address',
      [EntityType.CONTACT_FAX]: 'Contact fax number',
      [EntityType.INTENDED_USE]: 'Intended use or purpose',
      [EntityType.INDICATIONS]: 'Indications for use',
      [EntityType.CONTRAINDICATIONS]: 'Contraindications',
      [EntityType.WARNINGS]: 'Warnings and precautions',
    };

    return `You are an expert in extracting structured information from medical device documents. Extract the following entities from the text.

${context ? `Context: ${JSON.stringify(context)}` : ''}

Text to analyze:
"""
${text}
"""

Extract the following entity types:
${entityTypes.map((type) => `- ${type}: ${entityDescriptions[type]}`).join('\n')}

For each entity found, provide:
1. type: The entity type
2. value: The normalized/cleaned value
3. rawText: The exact text as it appears in the document
4. startPos: Start position in the text
5. endPos: End position in the text
6. confidence: Confidence score (0-1)

Respond with ONLY a JSON array of entities, no additional text:
[
  {
    "type": "manufacturer",
    "value": "Acme Medical Devices",
    "rawText": "Acme Medical Devices, Inc.",
    "startPos": 45,
    "endPos": 68,
    "confidence": 0.95
  }
]`;
  }

  /**
   * 调用 AI 模型
   */
  private async callAIModel(prompt: string): Promise<string> {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in extracting structured information from medical device documents. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 解析提取响应
   */
  private parseExtractionResponse(
    response: string,
    originalText: string,
    processingTime: number
  ): EntityExtractionResult {
    try {
      // 清理响应文本
      const cleaned = response.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      const entities: Entity[] = parsed.map((item: any) => ({
        type: this.normalizeEntityType(item.type),
        value: String(item.value || '').trim(),
        rawText: String(item.rawText || item.value || '').trim(),
        startPos: Number(item.startPos) || 0,
        endPos: Number(item.endPos) || 0,
        confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0)),
      }));

      return {
        entities,
        processingTime,
        textLength: originalText.length,
        entityCounts: this.countEntities(entities),
      };
    } catch (error) {
      this.logger.error('Failed to parse extraction response', { response, error });
      throw new Error('Invalid extraction response format');
    }
  }

  /**
   * 标准化实体类型
   */
  private normalizeEntityType(type: string): EntityType {
    const normalized = type.toLowerCase().trim().replace(/\s+/g, '_');

    const typeMap: Record<string, EntityType> = {
      'product_name': EntityType.PRODUCT_NAME,
      'model_number': EntityType.MODEL_NUMBER,
      'brand': EntityType.BRAND,
      'manufacturer': EntityType.MANUFACTURER,
      'manufacturer_address': EntityType.MANUFACTURER_ADDRESS,
      'manufacturer_country': EntityType.MANUFACTURER_COUNTRY,
      'certification_number': EntityType.CERTIFICATION_NUMBER,
      'k_number': EntityType.K_NUMBER,
      'product_code': EntityType.PRODUCT_CODE,
      'approval_date': EntityType.APPROVAL_DATE,
      'expiration_date': EntityType.EXPIRATION_DATE,
      'material': EntityType.MATERIAL,
      'size': EntityType.SIZE,
      'color': EntityType.COLOR,
      'standard': EntityType.STANDARD,
      'regulation': EntityType.REGULATION,
      'contact_phone': EntityType.CONTACT_PHONE,
      'contact_email': EntityType.CONTACT_EMAIL,
      'contact_fax': EntityType.CONTACT_FAX,
      'intended_use': EntityType.INTENDED_USE,
      'indications': EntityType.INDICATIONS,
      'contraindications': EntityType.CONTRAINDICATIONS,
      'warnings': EntityType.WARNINGS,
    };

    return typeMap[normalized] || EntityType.PRODUCT_NAME;
  }

  /**
   * 统计实体数量
   */
  private countEntities(entities: Entity[]): Record<EntityType, number> {
    const counts = {} as Record<EntityType, number>;

    // 初始化所有类型为 0
    Object.values(EntityType).forEach((type) => {
      counts[type] = 0;
    });

    // 统计
    entities.forEach((entity) => {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    });

    return counts;
  }

  /**
   * 从缓存获取
   */
  private getFromCache(input: EntityExtractionInput): EntityExtractionResult | undefined {
    const key = this.generateCacheKey(input);
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    if (Date.now() - cached.timestamp > this.config.cacheTtl) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.result;
  }

  /**
   * 设置缓存
   */
  private setCache(input: EntityExtractionInput, result: EntityExtractionResult): void {
    const key = this.generateCacheKey(input);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    this.cleanExpiredCache();
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(input: EntityExtractionInput): string {
    const keyData = {
      text: input.text.substring(0, 200), // 只取前200字符
      targetEntities: input.targetEntities,
      context: input.context,
    };
    return JSON.stringify(keyData);
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.cacheTtl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number } {
    return {
      size: this.cache.size,
    };
  }
}

/**
 * 创建实体提取器实例
 */
export function createEntityExtractor(config?: Partial<EntityExtractorConfig>): EntityExtractor {
  return new EntityExtractor(config);
}
