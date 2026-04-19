/**
 * FDA 510(k) 解析器
 * Phase 2: 智能解析模型开发
 *
 * 数据源: FDA 510(k) Premarket Notification Database
 * URL: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm
 */

import { BaseParser } from '../core/BaseParser';
import { CheerioExtractor } from '../extractors/CheerioExtractor';
import * as cheerio from 'cheerio';
import {
  DataSourceType,
  ParserConfig,
  ListPageResult,
  DetailPageResult,
  PPEProduct,
  PPEProductDetail,
  FieldExtractionRule,
  ManufacturerInfo,
} from '../types';

/**
 * FDA 510(k) 产品信息
 */
export interface FDA510kProduct extends PPEProduct {
  kNumber: string;
  applicant: string;
  decisionDate?: string;
  decision: string;
  productCode: string;
  deviceClass: string;
  summaryUrl?: string;
  statementUrl?: string;
}

/**
 * FDA 510(k) 产品详情
 */
export interface FDA510kProductDetail extends PPEProductDetail, FDA510kProduct {
  contactInfo?: {
    phone?: string;
    fax?: string;
    email?: string;
  };
  predicates?: string[];
  indications?: string[];
  deviceDescription?: string;
  substantialEquivalence?: string;
}

/**
 * FDA 解析器
 * 用于解析 FDA 510(k) 数据库
 */
export class FDAParser extends BaseParser {
  readonly name = 'FDAParser';
  readonly sourceType = DataSourceType.FDA;
  readonly version = '1.0.0';

  private extractor: CheerioExtractor;

  constructor() {
    super();
    this.extractor = new CheerioExtractor();
  }

  /**
   * 获取默认配置
   */
  protected getDefaultConfig(): Partial<ParserConfig> {
    return {
      baseUrl: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm',
      timeout: 30000,
      retryCount: 3,
      requestInterval: 500,
      respectRobotsTxt: true,
    };
  }

  /**
   * 初始化钩子
   */
  protected async onInitialize(): Promise<void> {
    console.log(`[${this.name}] Initialized for FDA 510(k) database`);
  }

  /**
   * 获取列表页
   */
  async fetchListPage(
    page: number,
    filters?: Record<string, any>
  ): Promise<ListPageResult> {
    const startTime = Date.now();

    try {
      // 构建搜索 URL
      const searchUrl = this.buildSearchUrl(page, filters);

      // 发送请求
      const response = await this.fetchWithRetry(searchUrl);
      const html = await response.text();

      // 解析列表数据
      const products = await this.parseList(html);

      // 提取分页信息
      const pagination = this.extractPagination(html);

      const duration = Date.now() - startTime;

      return {
        items: products,
        totalCount: pagination.totalCount,
        currentPage: page,
        totalPages: pagination.totalPages,
        hasNextPage: page < pagination.totalPages,
        nextPageUrl: page < pagination.totalPages
          ? this.buildSearchUrl(page + 1, filters)
          : undefined,
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch list page ${page}:`, error);
      throw error;
    }
  }

  /**
   * 获取详情页
   */
  async fetchDetailPage(id: string): Promise<DetailPageResult> {
    const startTime = Date.now();

    try {
      // 构建详情页 URL
      const detailUrl = this.buildDetailUrl(id);

      // 发送请求
      const response = await this.fetchWithRetry(detailUrl);
      const html = await response.text();

      // 解析详情数据
      const product = await this.parseDetail(html);

      const duration = Date.now() - startTime;

      return {
        product: {
          ...product,
          id,
          sourceUrl: detailUrl,
        },
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch detail page for ${id}:`, error);
      throw error;
    }
  }

  /**
   * 解析列表数据
   */
  async parseList(html: string): Promise<FDA510kProduct[]> {
    const $ = this.extractor.load(html);
    const products: FDA510kProduct[] = [];

    // FDA 510(k) 列表页表格选择器
    const tableSelector = 'table#pmnResults';
    const table = $(tableSelector);

    if (table.length === 0) {
      console.warn(`[${this.name}] No results table found`);
      return products;
    }

    // 遍历表格行（跳过表头）
    table.find('tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 5) {
        return;
      }

      try {
        const kNumber = this.cleanText($(cells[0]).text());
        const applicant = this.cleanText($(cells[1]).text());
        const deviceName = this.cleanText($(cells[2]).text());
        const decisionDate = this.cleanText($(cells[3]).text());
        const decision = this.cleanText($(cells[4]).text());

        // 提取详情页链接
        const detailLink = $(cells[0]).find('a').attr('href');
        const detailUrl = detailLink
          ? this.resolveUrl(detailLink, this.config.baseUrl)
          : '';

        // 提取 K 号
        const kNumberMatch = kNumber.match(/K\d{6}/);
        const normalizedKNumber = kNumberMatch ? kNumberMatch[0] : kNumber;

        const product: FDA510kProduct = {
          id: this.generateId(),
          kNumber: normalizedKNumber,
          name: deviceName,
          companyName: applicant,
          registrationNumber: normalizedKNumber,
          deviceClass: this.inferDeviceClass(deviceName),
          market: 'US',
          productType: this.inferProductType(deviceName),
          approvalDate: this.parseDate(decisionDate),
          status: this.mapDecisionToStatus(decision),
          sourceUrl: detailUrl,
          sourceType: this.sourceType,
          extractedAt: new Date().toISOString(),
          applicant,
          decision,
          productCode: '',
        };

        products.push(product);
      } catch (error) {
        console.warn(`[${this.name}] Failed to parse row:`, error);
      }
    });

    console.log(`[${this.name}] Parsed ${products.length} products from list page`);
    return products;
  }

  /**
   * 解析详情数据
   */
  async parseDetail(html: string): Promise<FDA510kProductDetail> {
    const $ = this.extractor.load(html);

    // 定义字段提取规则
    const rules: FieldExtractionRule[] = [
      {
        field: 'kNumber',
        selectors: ['td:contains("510(k) Number") + td', '.panel-heading:contains("510(k)")'],
        required: true,
      },
      {
        field: 'applicant',
        selectors: ['td:contains("Applicant") + td', 'td:contains("Manufacturer") + td'],
        required: true,
      },
      {
        field: 'deviceName',
        selectors: ['td:contains("Device Name") + td', 'h1', '.device-name'],
        required: true,
      },
      {
        field: 'decisionDate',
        selectors: ['td:contains("Decision Date") + td', 'td:contains("Date Received") + td'],
        required: false,
      },
      {
        field: 'decision',
        selectors: ['td:contains("Decision") + td', 'td:contains("Clearance") + td'],
        required: false,
      },
      {
        field: 'productCode',
        selectors: ['td:contains("Product Code") + td', 'a[href*="product_code"]'],
        required: false,
      },
      {
        field: 'deviceClass',
        selectors: ['td:contains("Device Class") + td'],
        required: false,
      },
      {
        field: 'indications',
        selectors: ['td:contains("Indications for Use") + td', '#indications'],
        required: false,
      },
      {
        field: 'deviceDescription',
        selectors: ['td:contains("Device Description") + td', '#description'],
        required: false,
      },
    ];

    // 提取字段
    const extracted = await this.extractor.extract(html, rules);

    // 提取制造商信息
    const manufacturerInfo = this.extractManufacturerInfo($);

    // 提取联系信息
    const contactInfo = this.extractContactInfo($);

    // 提取 predicate devices
    const predicates = this.extractPredicates($);

    // 提取附件链接
    const summaryUrl = this.extractDocumentLink($, 'Summary');
    const statementUrl = this.extractDocumentLink($, 'Statement');

    const product: FDA510kProductDetail = {
      id: this.generateId(),
      kNumber: this.cleanText(extracted.kNumber) || '',
      name: this.cleanText(extracted.deviceName) || '',
      companyName: this.cleanText(extracted.applicant) || '',
      registrationNumber: this.cleanText(extracted.kNumber) || '',
      deviceClass: this.cleanText(extracted.deviceClass) || this.inferDeviceClass(extracted.deviceName),
      market: 'US',
      productType: this.inferProductType(extracted.deviceName),
      approvalDate: this.parseDate(extracted.decisionDate),
      status: this.mapDecisionToStatus(extracted.decision),
      sourceUrl: '',
      sourceType: this.sourceType,
      extractedAt: new Date().toISOString(),
      applicant: this.cleanText(extracted.applicant) || '',
      decision: this.cleanText(extracted.decision) || '',
      productCode: this.cleanText(extracted.productCode) || '',
      manufacturerInfo,
      contactInfo,
      indications: this.cleanText(extracted.indications) ? [this.cleanText(extracted.indications)] : undefined,
      deviceDescription: this.cleanText(extracted.deviceDescription),
      predicates,
      summaryUrl,
      statementUrl,
      description: this.cleanText(extracted.deviceDescription),
    };

    return product;
  }

  /**
   * 检查是否需要动态渲染
   */
  requiresDynamicRendering(): boolean {
    // FDA 510(k) 数据库是静态页面，不需要动态渲染
    return false;
  }

  /**
   * 构建搜索 URL
   */
  private buildSearchUrl(page: number, filters?: Record<string, any>): string {
    const params = new URLSearchParams();

    // 基础参数
    params.set('start_search', '1');
    params.set('page', page.toString());

    // 应用过滤器
    if (filters) {
      if (filters.applicant) {
        params.set('applicant', filters.applicant);
      }
      if (filters.deviceName) {
        params.set('deviceName', filters.deviceName);
      }
      if (filters.productCode) {
        params.set('productCode', filters.productCode);
      }
      if (filters.kNumber) {
        params.set('kNumber', filters.kNumber);
      }
      if (filters.decision) {
        params.set('decision', filters.decision);
      }
      if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.set('dateTo', filters.dateTo);
      }
    }

    return `${this.config.baseUrl}?${params.toString()}`;
  }

  /**
   * 构建详情页 URL
   */
  private buildDetailUrl(kNumber: string): string {
    return `${this.config.baseUrl}?id=${kNumber}`;
  }

  /**
   * 提取分页信息
   */
  private extractPagination(html: string): { totalCount: number; totalPages: number } {
    const $ = this.extractor.load(html);

    // 尝试从页面中提取总记录数
    const countText = $('.results-info, .pagination-info').text();
    const countMatch = countText.match(/(\d+)\s*results?/i);
    const totalCount = countMatch ? parseInt(countMatch[1], 10) : 0;

    // 估算总页数（每页约 10 条）
    const totalPages = Math.ceil(totalCount / 10) || 1;

    return { totalCount, totalPages };
  }

  /**
   * 提取制造商信息
   */
  private extractManufacturerInfo($: cheerio.CheerioAPI): ManufacturerInfo | undefined {
    const applicant = $('td:contains("Applicant") + td').text().trim();
    const address = $('td:contains("Address") + td').text().trim();

    if (!applicant) {
      return undefined;
    }

    return {
      name: this.cleanText(applicant),
      address: this.cleanText(address) || undefined,
      country: 'US', // FDA 主要是美国市场
    };
  }

  /**
   * 提取联系信息
   */
  private extractContactInfo($: cheerio.CheerioAPI): { phone?: string; fax?: string; email?: string } | undefined {
    const contactText = $('td:contains("Contact") + td, .contact-info').text();

    if (!contactText) {
      return undefined;
    }

    const phoneMatch = contactText.match(/Phone:\s*([^\n]+)/i);
    const faxMatch = contactText.match(/Fax:\s*([^\n]+)/i);
    const emailMatch = contactText.match(/Email:\s*([^\n]+)/i);

    const contact: { phone?: string; fax?: string; email?: string } = {};

    if (phoneMatch) {
      contact.phone = this.cleanText(phoneMatch[1]);
    }
    if (faxMatch) {
      contact.fax = this.cleanText(faxMatch[1]);
    }
    if (emailMatch) {
      contact.email = this.cleanText(emailMatch[1]);
    }

    return Object.keys(contact).length > 0 ? contact : undefined;
  }

  /**
   * 提取 predicate devices
   */
  private extractPredicates($: cheerio.CheerioAPI): string[] {
    const predicates: string[] = [];

    $('td:contains("Predicate") + td, .predicate-device').each((_, elem) => {
      const text = $(elem).text().trim();
      const kNumbers = text.match(/K\d{6}/g);
      if (kNumbers) {
        predicates.push(...kNumbers);
      }
    });

    return [...new Set(predicates)]; // 去重
  }

  /**
   * 提取文档链接
   */
  private extractDocumentLink($: cheerio.CheerioAPI, docType: string): string | undefined {
    const link = $(`a:contains("${docType}"), a[href*="${docType.toLowerCase()}"]`).attr('href');
    return link ? this.resolveUrl(link, this.config.baseUrl) : undefined;
  }

  /**
   * 推断设备类别
   */
  private inferDeviceClass(deviceName: string): string {
    const name = deviceName.toLowerCase();

    // 根据产品名称推断类别
    if (name.includes('surgical') || name.includes('implant')) {
      return 'Class II';
    }
    if (name.includes('mask') || name.includes('gown') || name.includes('glove')) {
      return 'Class I';
    }
    if (name.includes('ventilator') || name.includes('defibrillator')) {
      return 'Class III';
    }

    return 'Class II'; // 默认类别
  }

  /**
   * 推断产品类型
   */
  private inferProductType(deviceName: string): string {
    const name = deviceName.toLowerCase();

    if (name.includes('mask')) return 'Face Mask';
    if (name.includes('respirator')) return 'Respirator';
    if (name.includes('gown')) return 'Protective Gown';
    if (name.includes('glove')) return 'Protective Glove';
    if (name.includes('shield')) return 'Face Shield';
    if (name.includes('goggle')) return 'Protective Goggles';
    if (name.includes('ventilator')) return 'Ventilator';
    if (name.includes('thermometer')) return 'Thermometer';

    return 'Medical Device';
  }

  /**
   * 映射决策到状态
   */
  private mapDecisionToStatus(decision: string): 'active' | 'inactive' | 'expired' | 'recalled' {
    if (!decision) return 'inactive';

    const normalized = decision.toLowerCase();

    if (normalized.includes('substantially equivalent') || normalized.includes('clearance')) {
      return 'active';
    }
    if (normalized.includes('withdrawn') || normalized.includes('declined')) {
      return 'inactive';
    }
    if (normalized.includes('recall')) {
      return 'recalled';
    }

    return 'active';
  }

  /**
   * 解析相对 URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }

    return `${baseUrl}${url.startsWith('?') ? '' : '/'}${url}`;
  }
}

/**
 * 创建 FDA 解析器实例
 */
export function createFDAParser(): FDAParser {
  return new FDAParser();
}
