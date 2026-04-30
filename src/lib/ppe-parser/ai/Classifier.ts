/**
 * AI 自动分类模型
 * Phase 3: AI 模型集成
 *
 * 基于大模型的 PPE 产品自动分类系统
 */

import { getLogger } from '../monitoring';

/**
 * 产品类别定义
 */
export enum PPECategory {
  // 呼吸防护
  RESPIRATORY_MASK = 'respiratory_mask',
  RESPIRATOR = 'respirator',
  // 身体防护
  PROTECTIVE_GOWN = 'protective_gown',
  PROTECTIVE_SUIT = 'protective_suit',
  // 手部防护
  PROTECTIVE_GLOVES = 'protective_gloves',
  // 眼部防护
  SAFETY_GOGGLES = 'safety_goggles',
  FACE_SHIELD = 'face_shield',
  // 头部防护
  SAFETY_HELMET = 'safety_helmet',
  // 足部防护
  SAFETY_SHOES = 'safety_shoes',
  // 听力防护
  EAR_PROTECTION = 'ear_protection',
  // 其他
  MEDICAL_DEVICE = 'medical_device',
  UNKNOWN = 'unknown',
}

/**
 * 设备类别定义
 */
export enum DeviceClass {
  CLASS_I = 'Class I',
  CLASS_II = 'Class II',
  CLASS_III = 'Class III',
  UNKNOWN = 'Unknown',
}

/**
 * 分类结果
 */
export interface ClassificationResult {
  /** 产品类别 */
  category: PPECategory;
  /** 类别置信度 */
  categoryConfidence: number;
  /** 设备类别 */
  deviceClass: DeviceClass;
  /** 设备类别置信度 */
  deviceClassConfidence: number;
  /** 产品代码 */
  productCode?: string;
  /** 分类理由 */
  reasoning: string;
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 分类输入
 */
export interface ClassificationInput {
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description?: string;
  /** 制造商 */
  manufacturer?: string;
  /** 预期用途 */
  intendedUse?: string;
  /** 附加信息 */
  additionalInfo?: Record<string, any>;
}

/**
 * 分类器配置
 */
export interface ClassifierConfig {
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
  /** 最大重试次数 */
  maxRetries: number;
  /** 请求超时（毫秒） */
  timeout: number;
}

/**
 * 分类缓存项
 */
interface CacheItem {
  result: ClassificationResult;
  timestamp: number;
}

/**
 * AI 自动分类器
 * 使用大模型对产品进行智能分类
 */
export class Classifier {
  readonly name = 'PPEClassifier';

  private config: ClassifierConfig;
  private cache: Map<string, CacheItem> = new Map();
  private logger = getLogger().child('Classifier');

  constructor(config?: Partial<ClassifierConfig>) {
    this.config = {
      model: 'doubao-pro-32k',
      apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      apiKey: process.env.VOLCENGINE_ARK_API_KEY || '',
      minConfidence: 0.7,
      enableCache: true,
      cacheTtl: 3600000, // 1 hour
      maxRetries: 3,
      timeout: 30000,
      ...config,
    };

    this.logger.info('Classifier initialized', { model: this.config.model });
  }

  /**
   * 分类产品
   */
  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const startTime = Date.now();

    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.getFromCache(input);
      if (cached) {
        this.logger.debug('Cache hit for classification', { name: input.name });
        return cached;
      }
    }

    try {
      // 构建提示词
      const prompt = this.buildClassificationPrompt(input);

      // 调用 AI 模型
      const response = await this.callAIModel(prompt);

      // 解析结果
      const result = this.parseClassificationResponse(response, Date.now() - startTime);

      // 验证置信度
      if (result.categoryConfidence < this.config.minConfidence) {
        this.logger.warn('Low confidence classification', {
          name: input.name,
          confidence: result.categoryConfidence,
        });
      }

      // 缓存结果
      if (this.config.enableCache) {
        this.setCache(input, result);
      }

      this.logger.info('Classification completed', {
        name: input.name,
        category: result.category,
        confidence: result.categoryConfidence,
      });

      return result;
    } catch (error) {
      this.logger.error('Classification failed', { error, input });
      throw error;
    }
  }

  /**
   * 批量分类
   */
  async classifyBatch(inputs: ClassificationInput[]): Promise<ClassificationResult[]> {
    this.logger.info(`Starting batch classification of ${inputs.length} products`);

    const results: ClassificationResult[] = [];

    // 串行处理以避免 API 限流
    for (const input of inputs) {
      try {
        const result = await this.classify(input);
        results.push(result);
      } catch (error) {
        this.logger.error('Batch classification item failed', { error, input });
        // 添加失败标记的结果
        results.push({
          category: PPECategory.UNKNOWN,
          categoryConfidence: 0,
          deviceClass: DeviceClass.UNKNOWN,
          deviceClassConfidence: 0,
          reasoning: 'Classification failed',
          processingTime: 0,
        });
      }
    }

    this.logger.info(`Batch classification completed: ${results.length} products`);
    return results;
  }

  /**
   * 构建分类提示词
   */
  private buildClassificationPrompt(input: ClassificationInput): string {
    const { name, description, manufacturer, intendedUse, additionalInfo } = input;

    return `You are a PPE (Personal Protective Equipment) classification expert. Analyze the following product information and classify it into the appropriate category.

Product Information:
- Name: ${name}
${description ? `- Description: ${description}` : ''}
${manufacturer ? `- Manufacturer: ${manufacturer}` : ''}
${intendedUse ? `- Intended Use: ${intendedUse}` : ''}
${additionalInfo ? `- Additional Info: ${JSON.stringify(additionalInfo)}` : ''}

Available Categories:
1. respiratory_mask - Face masks for respiratory protection (e.g., surgical masks, dust masks)
2. respirator - Advanced respiratory protection (e.g., N95, FFP2, full-face respirators)
3. protective_gown - Protective gowns and aprons
4. protective_suit - Full protective suits and coveralls
5. protective_gloves - Protective gloves (e.g., medical gloves, chemical-resistant gloves)
6. safety_goggles - Safety goggles and glasses
7. face_shield - Face shields and visors
8. safety_helmet - Safety helmets and hard hats
9. safety_shoes - Safety shoes and boots
10. ear_protection - Ear plugs and ear muffs
11. medical_device - Other medical devices
12. unknown - Cannot be determined

Device Classes:
- Class I: Low risk (e.g., simple masks, examination gloves)
- Class II: Medium risk (e.g., surgical masks, respirators)
- Class III: High risk (e.g., life-supporting devices)

Please provide your classification in the following JSON format:
{
  "category": "category_name",
  "categoryConfidence": 0.95,
  "deviceClass": "Class II",
  "deviceClassConfidence": 0.88,
  "productCode": "optional_product_code",
  "reasoning": "Brief explanation of why this classification was chosen"
}

Respond with ONLY the JSON object, no additional text.`;
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
            content: 'You are a PPE classification expert. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 解析分类响应
   */
  private parseClassificationResponse(response: string, processingTime: number): ClassificationResult {
    try {
      // 清理响应文本
      const cleaned = response.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleaned);

      return {
        category: this.normalizeCategory(parsed.category),
        categoryConfidence: Math.min(1, Math.max(0, parsed.categoryConfidence || 0)),
        deviceClass: this.normalizeDeviceClass(parsed.deviceClass),
        deviceClassConfidence: Math.min(1, Math.max(0, parsed.deviceClassConfidence || 0)),
        productCode: parsed.productCode,
        reasoning: parsed.reasoning || 'No reasoning provided',
        processingTime,
      };
    } catch (error) {
      this.logger.error('Failed to parse classification response', { response, error });
      throw new Error('Invalid classification response format');
    }
  }

  /**
   * 标准化类别
   */
  private normalizeCategory(category: string): PPECategory {
    const normalized = category.toLowerCase().trim();

    const categoryMap: Record<string, PPECategory> = {
      'respiratory_mask': PPECategory.RESPIRATORY_MASK,
      'respirator': PPECategory.RESPIRATOR,
      'protective_gown': PPECategory.PROTECTIVE_GOWN,
      'protective_suit': PPECategory.PROTECTIVE_SUIT,
      'protective_gloves': PPECategory.PROTECTIVE_GLOVES,
      'safety_goggles': PPECategory.SAFETY_GOGGLES,
      'face_shield': PPECategory.FACE_SHIELD,
      'safety_helmet': PPECategory.SAFETY_HELMET,
      'safety_shoes': PPECategory.SAFETY_SHOES,
      'ear_protection': PPECategory.EAR_PROTECTION,
      'medical_device': PPECategory.MEDICAL_DEVICE,
      'unknown': PPECategory.UNKNOWN,
    };

    return categoryMap[normalized] || PPECategory.UNKNOWN;
  }

  /**
   * 标准化设备类别
   */
  private normalizeDeviceClass(deviceClass: string): DeviceClass {
    const normalized = deviceClass.toLowerCase().trim();

    if (normalized.includes('class i') || normalized.includes('class 1')) {
      return DeviceClass.CLASS_I;
    }
    if (normalized.includes('class ii') || normalized.includes('class 2')) {
      return DeviceClass.CLASS_II;
    }
    if (normalized.includes('class iii') || normalized.includes('class 3')) {
      return DeviceClass.CLASS_III;
    }

    return DeviceClass.UNKNOWN;
  }

  /**
   * 从缓存获取
   */
  private getFromCache(input: ClassificationInput): ClassificationResult | undefined {
    const key = this.generateCacheKey(input);
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.config.cacheTtl) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.result;
  }

  /**
   * 设置缓存
   */
  private setCache(input: ClassificationInput, result: ClassificationResult): void {
    const key = this.generateCacheKey(input);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // 清理过期缓存
    this.cleanExpiredCache();
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(input: ClassificationInput): string {
    const keyData = {
      name: input.name,
      description: input.description,
      manufacturer: input.manufacturer,
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
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // 需要实现统计逻辑
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ClassifierConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Configuration updated', config);
  }
}

/**
 * 创建分类器实例
 */
export function createClassifier(config?: Partial<ClassifierConfig>): Classifier {
  return new Classifier(config);
}
