/**
 * 解析器工厂
 * Phase 2: 智能解析模型开发
 */

import { PPEParser, DataSourceType, ParserConfig } from '../types';
import { BaseParser } from './BaseParser';
import { FDAParser } from '../parsers/FDAParser';

/**
 * 解析器构造器类型
 */
type ParserConstructor = new () => BaseParser;

/**
 * 解析器工厂类
 * 负责管理和创建各类解析器实例
 */
export class ParserFactory {
  private static parsers: Map<DataSourceType, ParserConstructor> = new Map();
  private static instances: Map<DataSourceType, BaseParser> = new Map();

  /**
   * 注册解析器
   */
  static register(sourceType: DataSourceType, parserClass: ParserConstructor): void {
    this.parsers.set(sourceType, parserClass);
    console.log(`[ParserFactory] Registered parser for ${sourceType}`);
  }

  /**
   * 创建解析器实例
   */
  static async createParser(
    sourceType: DataSourceType,
    config?: Partial<ParserConfig>
  ): Promise<PPEParser> {
    const ParserClass = this.parsers.get(sourceType);

    if (!ParserClass) {
      throw new Error(`No parser registered for source type: ${sourceType}`);
    }

    const parser = new ParserClass();

    // 合并默认配置
    const defaultConfig = this.getDefaultConfig(sourceType);
    const mergedConfig: ParserConfig = {
      ...defaultConfig,
      ...config,
      sourceType,
    };

    await parser.initialize(mergedConfig);

    return parser;
  }

  /**
   * 获取或创建单例解析器
   */
  static async getParser(
    sourceType: DataSourceType,
    config?: Partial<ParserConfig>
  ): Promise<PPEParser> {
    // 检查是否已有实例
    let parser = this.instances.get(sourceType);

    if (!parser) {
      parser = (await this.createParser(sourceType, config)) as BaseParser;
      this.instances.set(sourceType, parser);
    }

    return parser;
  }

  /**
   * 获取所有已注册的解析器类型
   */
  static getRegisteredTypes(): DataSourceType[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * 检查是否已注册解析器
   */
  static isRegistered(sourceType: DataSourceType): boolean {
    return this.parsers.has(sourceType);
  }

  /**
   * 关闭所有解析器
   */
  static async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [sourceType, parser] of this.instances) {
      console.log(`[ParserFactory] Closing parser for ${sourceType}...`);
      closePromises.push(parser.close());
    }

    await Promise.all(closePromises);
    this.instances.clear();
    console.log('[ParserFactory] All parsers closed');
  }

  /**
   * 获取默认配置
   */
  private static getDefaultConfig(sourceType: DataSourceType): ParserConfig {
    const baseConfig: ParserConfig = {
      sourceType,
      baseUrl: '',
      timeout: 30000,
      retryCount: 3,
      requestInterval: 1000,
      useProxy: false,
      respectRobotsTxt: true,
    };

    // 根据数据源类型设置特定配置
    switch (sourceType) {
      case DataSourceType.FDA:
        return {
          ...baseConfig,
          baseUrl: 'https://www.accessdata.fda.gov',
          timeout: 30000,
          requestInterval: 500,
        };

      case DataSourceType.EUDAMED:
        return {
          ...baseConfig,
          baseUrl: 'https://ec.europa.eu/tools/eudamed',
          timeout: 60000,
          requestInterval: 2000,
        };

      case DataSourceType.NMPA:
        return {
          ...baseConfig,
          baseUrl: 'https://www.nmpa.gov.cn',
          timeout: 30000,
          requestInterval: 2000,
        };

      case DataSourceType.PMDA:
        return {
          ...baseConfig,
          baseUrl: 'https://www.pmda.go.jp',
          timeout: 30000,
          requestInterval: 1000,
        };

      case DataSourceType.TGA:
        return {
          ...baseConfig,
          baseUrl: 'https://www.tga.gov.au',
          timeout: 30000,
          requestInterval: 1000,
        };

      case DataSourceType.HEALTH_CANADA:
        return {
          ...baseConfig,
          baseUrl: 'https://health-products.canada.ca',
          timeout: 30000,
          requestInterval: 1000,
        };

      default:
        return baseConfig;
    }
  }

  /**
   * 注册所有内置解析器
   * 在应用启动时调用
   */
  static registerAll(): void {
    // 注册 FDA 解析器
    this.register(DataSourceType.FDA, FDAParser);

    console.log('[ParserFactory] All built-in parsers registered');
  }

  /**
   * 获取数据源信息
   */
  static getDataSourceInfo(sourceType: DataSourceType): {
    name: string;
    region: string;
    language: string;
    estimatedRecords: number;
  } {
    const info: Record<DataSourceType, { name: string; region: string; language: string; estimatedRecords: number }> = {
      [DataSourceType.FDA]: {
        name: 'FDA',
        region: 'United States',
        language: 'English',
        estimatedRecords: 100000,
      },
      [DataSourceType.EUDAMED]: {
        name: 'EUDAMED',
        region: 'European Union',
        language: 'Multi-language',
        estimatedRecords: 500000,
      },
      [DataSourceType.NMPA]: {
        name: 'NMPA',
        region: 'China',
        language: 'Chinese',
        estimatedRecords: 200000,
      },
      [DataSourceType.PMDA]: {
        name: 'PMDA',
        region: 'Japan',
        language: 'Japanese',
        estimatedRecords: 50000,
      },
      [DataSourceType.TGA]: {
        name: 'TGA',
        region: 'Australia',
        language: 'English',
        estimatedRecords: 30000,
      },
      [DataSourceType.HEALTH_CANADA]: {
        name: 'Health Canada',
        region: 'Canada',
        language: 'English/French',
        estimatedRecords: 40000,
      },
    };

    return info[sourceType];
  }
}
