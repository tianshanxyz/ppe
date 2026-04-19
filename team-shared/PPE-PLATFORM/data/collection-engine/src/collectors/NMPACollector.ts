/**
 * NMPA 数据采集器
 * 中国国家药品监督管理局医疗器械注册数据
 * 数据源: https://www.nmpa.gov.cn/
 * 医疗器械查询: https://www.nmpa.gov.cn/datasearch/search-info.html
 */

import { BaseCollector } from '../core/BaseCollector';
import {
  PPEProduct,
  PPEManufacturer,
  PPECertification,
  DataSourceType,
  CollectionFilter,
  CollectionResult,
} from '../types';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

// NMPA 产品信息接口
interface NMPAProductInfo {
  registrationNumber: string;
  productName: string;
  manufacturer: string;
  registrationDate: string;
  approvalDepartment: string;
  productType: 'domestic' | 'import';
  detailUrl?: string;
}

// NMPA 产品详情
interface NMPAProductDetail {
  registrationNumber: string;
  productName: string;
  productNameEn?: string;
  manufacturer: string;
  manufacturerAddress: string;
  manufacturerCountry: string;
  registrationAddress: string;
  modelSpecification: string;
  structureComposition: string;
  scopeApplication: string;
  approvalDate: string;
  validityDate: string;
  approvalDepartment: string;
  remarks?: string;
}

export class NMPACollector extends BaseCollector {
  private readonly searchUrl = 'https://www.nmpa.gov.cn/datasearch/search-info.html';
  private readonly apiBaseUrl = 'https://www.nmpa.gov.cn/datasearch';

  constructor() {
    super(
      {
        sourceType: 'NMPA' as DataSourceType,
        baseUrl: 'https://www.nmpa.gov.cn',
        headless: true,
        batchSize: 30,
        rateLimitPerSecond: 1,
        requestTimeout: 60000,
      },
      {
        enabled: true,
        rotateUserAgent: true,
        rotateProxy: false,
        randomDelay: true,
        minDelay: 3000,
        maxDelay: 6000,
        simulateHuman: true,
      }
    );
  }

  /**
   * 采集 NMPA 数据
   */
  async collect(filter?: CollectionFilter): Promise<CollectionResult> {
    this.taskId = uuidv4();
    this.status = 'running';
    this.startTime = Date.now();

    this.logger.info('开始 NMPA 数据采集任务', {
      taskId: this.taskId,
      filter,
    });

    try {
      await this.initBrowser();
      const products = await this.searchPPEProducts(filter);
      this.totalRecords = products.length;

      this.logger.info(`找到 ${products.length} 个 NMPA PPE 产品`);

      for (let i = 0; i < products.length; i++) {
        const productInfo = products[i];
        try {
          this.progress = {
            taskId: this.taskId,
            currentPage: i,
            totalPages: this.totalRecords,
            processedRecords: i,
            totalRecords: this.totalRecords,
            percentage: Math.round((i / this.totalRecords) * 100),
            status: 'running',
          };

          const detail = await this.getProductDetail(productInfo);
          if (detail) {
            const ppeProduct = this.parseProductDetail(detail);
            if (ppeProduct) {
              this.collectedProducts.push(ppeProduct);
              this.successRecords++;

              const manufacturer = this.parseManufacturerDetail(detail);
              if (manufacturer) {
                this.collectedManufacturers.push(manufacturer);
              }

              const certification = this.parseCertificationDetail(detail);
              if (certification) {
                this.collectedCertifications.push(certification);
              }
            }
          }

          await this.randomDelay();
        } catch (error) {
          this.failedRecords++;
          const errorInfo = {
            sourceId: productInfo.registrationNumber,
            sourceType: 'NMPA' as DataSourceType,
            error: error instanceof Error ? error.message : '未知错误',
            timestamp: new Date(),
            retryable: true,
          };
          this.errors.push(errorInfo);
          this.logger.error(`采集产品 ${productInfo.registrationNumber} 失败`, errorInfo);
        }

        if (this.collectedProducts.length >= this.config.batchSize) {
          await this.batchSave();
        }
      }

      if (this.collectedProducts.length > 0) {
        await this.saveBatch();
      }

      this.status = 'completed';
      const duration = Date.now() - this.startTime;

      this.logger.info('NMPA 数据采集任务完成', {
        taskId: this.taskId,
        total: this.totalRecords,
        success: this.successRecords,
        failed: this.failedRecords,
        duration: `${duration}ms`,
      });

      return {
        taskId: this.taskId,
        sourceType: 'NMPA',
        status: this.status,
        startTime: new Date(this.startTime),
        endTime: new Date(),
        totalRecords: this.totalRecords,
        successRecords: this.successRecords,
        failedRecords: this.failedRecords,
        errors: this.errors,
        data: {
          products: this.collectedProducts,
          manufacturers: this.collectedManufacturers,
          certifications: this.collectedCertifications,
        },
      };
    } catch (error) {
      this.status = 'failed';
      this.logger.error('NMPA 数据采集任务失败', error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * 搜索 PPE 产品
   */
  private async searchPPEProducts(filter?: CollectionFilter): Promise<NMPAProductInfo[]> {
    const products: NMPAProductInfo[] = [];

    const ppeKeywords = [
      '口罩', '防护服', '护目镜', '防护面罩', '医用手套',
      '隔离衣', '手术衣', '防护帽', '防护鞋套', '呼吸器',
      '防毒面具', '安全帽', '防护眼镜', '耳塞', '防护手套',
    ];

    if (filter?.keywords && filter.keywords.length > 0) {
      ppeKeywords.unshift(...filter.keywords);
    }

    for (const keyword of ppeKeywords) {
      try {
        this.logger.info(`搜索关键词: ${keyword}`);
        
        // NMPA 网站使用 POST 请求进行搜索
        const searchResponse = await this.axiosInstance.post(
          `${this.apiBaseUrl}/search`,
          {
            tableId: 26, // 医疗器械注册证表
            searchText: keyword,
            pageSize: 100,
            pageNum: 1,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Referer: this.searchUrl,
            },
          }
        );

        if (searchResponse.data && searchResponse.data.data) {
          const items = searchResponse.data.data;
          for (const item of items) {
            products.push({
              registrationNumber: item.ZCZBM || item.zczbh || '',
              productName: item.CPMC || item.cpmc || '',
              manufacturer: item.SCQYMC || item.scqymc || '',
              registrationDate: item.ZCRQ || item.zcrq || '',
              approvalDepartment: item.SPDW || item.spdw || '',
              productType: item.ZCZBM?.includes('进') || item.zczbh?.includes('进') ? 'import' : 'domestic',
              detailUrl: item.ID ? `${this.apiBaseUrl}/detail/${item.ID}` : undefined,
            });
          }
        }

        await this.delay(this.getRandomDelay());
      } catch (error) {
        this.logger.error(`搜索关键词 ${keyword} 失败`, error);
      }
    }

    // 去重
    const uniqueProducts = new Map<string, NMPAProductInfo>();
    for (const product of products) {
      uniqueProducts.set(product.registrationNumber, product);
    }

    return Array.from(uniqueProducts.values());
  }

  /**
   * 获取产品详情
   */
  private async getProductDetail(productInfo: NMPAProductInfo): Promise<NMPAProductDetail | null> {
    try {
      if (!productInfo.detailUrl) {
        return null;
      }

      const response = await this.axiosInstance.get(productInfo.detailUrl, {
        headers: {
          Referer: this.searchUrl,
        },
      });

      const $ = cheerio.load(response.data);
      
      // 解析详情页面
      const detail: NMPAProductDetail = {
        registrationNumber: productInfo.registrationNumber,
        productName: productInfo.productName,
        productNameEn: this.extractField($, '产品名称(英文)') || '',
        manufacturer: productInfo.manufacturer,
        manufacturerAddress: this.extractField($, '注册人住所') || this.extractField($, '生产企业地址') || '',
        manufacturerCountry: productInfo.productType === 'import' ? this.extractCountry($) : '中国',
        registrationAddress: this.extractField($, '生产地址') || '',
        modelSpecification: this.extractField($, '型号规格') || '',
        structureComposition: this.extractField($, '结构及组成') || this.extractField($, '主要组成成分') || '',
        scopeApplication: this.extractField($, '适用范围') || this.extractField($, '预期用途') || '',
        approvalDate: productInfo.registrationDate,
        validityDate: this.extractField($, '有效期至') || '',
        approvalDepartment: productInfo.approvalDepartment,
        remarks: this.extractField($, '备注') || '',
      };

      return detail;
    } catch (error) {
      this.logger.error(`获取产品详情 ${productInfo.registrationNumber} 失败`, error);
      return null;
    }
  }

  /**
   * 从页面提取字段
   */
  private extractField($: cheerio.CheerioAPI, fieldName: string): string {
    const selectors = [
      `td:contains("${fieldName}") + td`,
      `th:contains("${fieldName}") + td`,
      `label:contains("${fieldName}") + span`,
      `.info-row:contains("${fieldName}") .info-value`,
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        return element.text().trim();
      }
    }

    return '';
  }

  /**
   * 提取国家信息
   */
  private extractCountry($: cheerio.CheerioAPI): string {
    const countryText = this.extractField($, '注册人所在地') || this.extractField($, '生产国');
    if (countryText) {
      return countryText;
    }
    return '未知';
  }

  /**
   * 解析产品详情为 PPEProduct
   */
  private parseProductDetail(detail: NMPAProductDetail): PPEProduct | null {
    const category = this.categorizeProduct(detail.productName, detail.scopeApplication);

    return {
      id: uuidv4(),
      productName: detail.productName,
      productNameEn: detail.productNameEn,
      productNameLocal: detail.productName,
      productCode: detail.registrationNumber,
      modelNumber: detail.modelSpecification,
      category: category,
      subcategory: this.getSubcategory(detail.productName),
      ppeCategory: this.determinePPECategory(detail.productName, detail.scopeApplication),
      riskLevel: this.determineRiskLevel(detail.productName, detail.scopeApplication),
      description: detail.scopeApplication,
      descriptionEn: '',
      specifications: {
        modelSpecification: detail.modelSpecification,
        structureComposition: detail.structureComposition,
      },
      features: {
        scopeApplication: detail.scopeApplication,
      },
      images: [],
      manufacturerId: undefined,
      manufacturerName: detail.manufacturer,
      manufacturerAddress: detail.manufacturerAddress,
      manufacturerCountry: detail.manufacturerCountry,
      brandName: detail.manufacturer,
      brandOwner: detail.manufacturer,
      dataSource: 'NMPA',
      sourceId: detail.registrationNumber,
      sourceUrl: `${this.apiBaseUrl}/detail/${detail.registrationNumber}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataQualityScore: this.calculateDataQualityScore(detail),
      isActive: true,
    };
  }

  /**
   * 解析制造商详情
   */
  private parseManufacturerDetail(detail: NMPAProductDetail): PPEManufacturer | null {
    if (!detail.manufacturer) {
      return null;
    }

    return {
      companyName: detail.manufacturer,
      address: detail.manufacturerAddress,
      country: detail.manufacturerCountry,
      dataSource: 'NMPA',
      sourceId: `${detail.manufacturer}_${detail.registrationNumber}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataQualityScore: 80,
      isActive: true,
    };
  }

  /**
   * 解析认证详情
   */
  private parseCertificationDetail(detail: NMPAProductDetail): PPECertification | null {
    if (!detail.registrationNumber) {
      return null;
    }

    return {
      certificationType: 'NMPA',
      certificationNumber: detail.registrationNumber,
      standardCode: 'GB 19083', // 中国医用防护口罩标准
      issueDate: detail.approvalDate ? new Date(detail.approvalDate) : undefined,
      expiryDate: detail.validityDate ? new Date(detail.validityDate) : undefined,
      certBodyName: detail.approvalDepartment,
      status: 'active',
      dataSource: 'NMPA',
      sourceId: detail.registrationNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 产品分类
   */
  private categorizeProduct(productName: string, description: string): string {
    const text = (productName + ' ' + description).toLowerCase();

    if (text.includes('口罩') || text.includes('呼吸')) return '呼吸防护';
    if (text.includes('手套') || text.includes('手部')) return '手部防护';
    if (text.includes('防护服') || text.includes('隔离衣') || text.includes('手术衣')) return '身体防护';
    if (text.includes('护目镜') || text.includes('眼镜') || text.includes('面罩')) return '眼部防护';
    if (text.includes('安全帽') || text.includes('头盔')) return '头部防护';
    if (text.includes('耳塞') || text.includes('耳罩')) return '听力防护';
    if (text.includes('鞋套') || text.includes('靴')) return '足部防护';

    return '其他防护';
  }

  /**
   * 获取子分类
   */
  private getSubcategory(productName: string): string {
    const text = productName.toLowerCase();

    if (text.includes('n95') || text.includes('kn95')) return 'N95/KN95口罩';
    if (text.includes('外科') || text.includes('surgical')) return '外科口罩';
    if (text.includes('医用')) return '医用口罩';
    if (text.includes('一次性')) return '一次性口罩';
    if (text.includes('乳胶')) return '乳胶手套';
    if (text.includes('丁腈')) return '丁腈手套';
    if (text.includes('pvc')) return 'PVC手套';

    return '';
  }

  /**
   * 确定 PPE 类别 (中国标准)
   */
  private determinePPECategory(productName: string, description: string): 'I' | 'II' | 'III' | undefined {
    const text = (productName + ' ' + description).toLowerCase();

    // 根据风险等级分类
    if (text.includes('n95') || text.includes('kn95') || text.includes('ffp3')) {
      return 'III';
    }
    if (text.includes('ffp2') || text.includes('医用') || text.includes('surgical') || text.includes('医疗')) {
      return 'II';
    }
    if (text.includes('工业') || text.includes('防尘') || text.includes('ffp1')) {
      return 'I';
    }

    return undefined;
  }

  /**
   * 确定风险等级
   */
  private determineRiskLevel(productName: string, description: string): string {
    const text = (productName + ' ' + description).toLowerCase();

    if (text.includes('n95') || text.includes('kn95') || text.includes('ffp3')) {
      return '高风险';
    }
    if (text.includes('ffp2') || text.includes('医用') || text.includes('surgical')) {
      return '中高风险';
    }
    if (text.includes('ffp1') || text.includes('一般')) {
      return '中风险';
    }

    return '低风险';
  }

  /**
   * 计算数据质量分数
   */
  private calculateDataQualityScore(detail: NMPAProductDetail): number {
    let score = 70; // 基础分

    if (detail.productName) score += 10;
    if (detail.manufacturer) score += 10;
    if (detail.modelSpecification) score += 5;
    if (detail.scopeApplication) score += 5;
    if (detail.approvalDate) score += 5;
    if (detail.validityDate) score += 5;

    return Math.min(score, 100);
  }

  /**
   * 获取随机延迟时间
   */
  private getRandomDelay(): number {
    return Math.floor(
      Math.random() * (this.antiCrawlConfig.maxDelay! - this.antiCrawlConfig.minDelay!) +
        this.antiCrawlConfig.minDelay!
    );
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 实现抽象方法
  parseProduct(): PPEProduct | null {
    return null;
  }

  parseManufacturer(): PPEManufacturer | null {
    return null;
  }

  parseCertification(): PPECertification | null {
    return null;
  }
}
