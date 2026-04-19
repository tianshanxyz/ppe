/**
 * Health Canada 数据采集器
 * 加拿大卫生部医疗器械数据库
 * 数据源: https://health-products.canada.ca/mdall-limh/
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

interface HealthCanadaProductInfo {
  deviceIdentifier: string;
  productName: string;
  companyName: string;
  deviceClass: string;
  approvalDate: string;
  detailUrl?: string;
}

interface HealthCanadaProductDetail {
  deviceIdentifier: string;
  productName: string;
  companyName: string;
  companyAddress: string;
  deviceClass: string;
  deviceType: string;
  gmdnCode: string;
  gmdnTerm: string;
  approvalDate: string;
  intendedUse: string;
}

export class HealthCanadaCollector extends BaseCollector {
  private readonly searchUrl = 'https://health-products.canada.ca/mdall-limh/';
  private readonly apiBaseUrl = 'https://health-products.canada.ca/api/mdall';

  constructor() {
    super(
      {
        sourceType: 'HealthCanada' as DataSourceType,
        baseUrl: 'https://health-products.canada.ca',
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

  async collect(filter?: CollectionFilter): Promise<CollectionResult> {
    this.taskId = uuidv4();
    this.status = 'running';
    this.startTime = Date.now();

    this.logger.info('开始 Health Canada 数据采集任务', { taskId: this.taskId, filter });

    try {
      await this.initBrowser();
      const products = await this.searchPPEProducts(filter);
      this.totalRecords = products.length;

      this.logger.info(`找到 ${products.length} 个 Health Canada PPE 产品`);

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
              if (manufacturer) this.collectedManufacturers.push(manufacturer);

              const certification = this.parseCertificationDetail(detail);
              if (certification) this.collectedCertifications.push(certification);
            }
          }

          await this.randomDelay();
        } catch (error) {
          this.failedRecords++;
          this.errors.push({
            sourceId: productInfo.deviceIdentifier,
            sourceType: 'HealthCanada',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            retryable: true,
          });
        }

        if (this.collectedProducts.length >= this.config.batchSize) {
          await this.batchSave();
        }
      }

      if (this.collectedProducts.length > 0) await this.batchSave();

      this.status = 'completed';
      return {
        taskId: this.taskId,
        sourceType: 'HealthCanada',
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
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  private async searchPPEProducts(filter?: CollectionFilter): Promise<HealthCanadaProductInfo[]> {
    const products: HealthCanadaProductInfo[] = [];
    const keywords = ['mask', 'respirator', 'gloves', 'gown', 'goggles', 'face shield', 'PPE'];

    if (filter?.keywords) keywords.unshift(...filter.keywords);

    for (const keyword of keywords) {
      try {
        const response = await this.axiosInstance.get(`${this.apiBaseUrl}/search`, {
          params: { term: keyword, type: 'device' },
        });

        const $ = cheerio.load(response.data);
        $('.result-item').each((_, el) => {
          const $el = $(el);
          products.push({
            deviceIdentifier: $el.find('.device-id').text().trim(),
            productName: $el.find('.device-name').text().trim(),
            companyName: $el.find('.company-name').text().trim(),
            deviceClass: $el.find('.device-class').text().trim(),
            approvalDate: $el.find('.approval-date').text().trim(),
            detailUrl: $el.find('a').attr('href'),
          });
        });

        await this.delay(this.getRandomDelay());
      } catch (error) {
        this.logger.error(`搜索失败: ${keyword}`, error);
      }
    }

    const unique = new Map<string, HealthCanadaProductInfo>();
    products.forEach((p) => unique.set(p.deviceIdentifier, p));
    return Array.from(unique.values());
  }

  private async getProductDetail(info: HealthCanadaProductInfo): Promise<HealthCanadaProductDetail | null> {
    try {
      if (!info.detailUrl) return null;
      const response = await this.axiosInstance.get(info.detailUrl);
      const $ = cheerio.load(response.data);

      return {
        deviceIdentifier: info.deviceIdentifier,
        productName: info.productName,
        companyName: info.companyName,
        companyAddress: $('.company-address').text().trim(),
        deviceClass: info.deviceClass,
        deviceType: $('.device-type').text().trim(),
        gmdnCode: $('.gmdn-code').text().trim(),
        gmdnTerm: $('.gmdn-term').text().trim(),
        approvalDate: info.approvalDate,
        intendedUse: $('.intended-use').text().trim(),
      };
    } catch (error) {
      this.logger.error(`获取详情失败: ${info.deviceIdentifier}`, error);
      return null;
    }
  }

  private parseProductDetail(detail: HealthCanadaProductDetail): PPEProduct {
    return {
      id: uuidv4(),
      productName: detail.productName,
      productNameEn: detail.productName,
      productCode: detail.deviceIdentifier,
      category: this.categorizeProduct(detail.productName, detail.intendedUse),
      ppeCategory: this.determinePPECategory(detail.deviceClass),
      riskLevel: this.determineRiskLevel(detail.deviceClass),
      description: detail.intendedUse,
      manufacturerName: detail.companyName,
      manufacturerCountry: 'Canada',
      dataSource: 'HealthCanada',
      sourceId: detail.deviceIdentifier,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataQualityScore: 80,
      isActive: true,
    };
  }

  private parseManufacturerDetail(detail: HealthCanadaProductDetail): PPEManufacturer {
    return {
      companyName: detail.companyName,
      address: detail.companyAddress,
      country: 'Canada',
      dataSource: 'HealthCanada',
      sourceId: `${detail.companyName}_${detail.deviceIdentifier}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataQualityScore: 80,
      isActive: true,
    };
  }

  private parseCertificationDetail(detail: HealthCanadaProductDetail): PPECertification {
    return {
      certificationType: 'HealthCanada',
      certificationNumber: detail.deviceIdentifier,
      standardCode: 'CSA Z94.4.1',
      issueDate: detail.approvalDate ? new Date(detail.approvalDate) : undefined,
      certBodyName: 'Health Canada',
      status: 'active',
      dataSource: 'HealthCanada',
      sourceId: detail.deviceIdentifier,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private categorizeProduct(name: string, purpose: string): string {
    const text = (name + ' ' + purpose).toLowerCase();
    if (text.includes('mask') || text.includes('respirator')) return '呼吸防护';
    if (text.includes('gloves')) return '手部防护';
    if (text.includes('gown') || text.includes('clothing')) return '身体防护';
    if (text.includes('goggles') || text.includes('shield')) return '眼部防护';
    return '其他防护';
  }

  private determinePPECategory(deviceClass: string): 'I' | 'II' | 'III' | undefined {
    const cls = deviceClass.toLowerCase();
    if (cls.includes('iv') || cls.includes('iii')) return 'III';
    if (cls.includes('ii')) return 'II';
    if (cls.includes('i')) return 'I';
    return undefined;
  }

  private determineRiskLevel(deviceClass: string): string {
    const cls = deviceClass.toLowerCase();
    if (cls.includes('iv')) return '高风险';
    if (cls.includes('iii')) return '中高风险';
    if (cls.includes('ii')) return '中风险';
    return '低风险';
  }

  private getRandomDelay(): number {
    return Math.floor(
      Math.random() * (this.antiCrawlConfig.maxDelay! - this.antiCrawlConfig.minDelay!) +
        this.antiCrawlConfig.minDelay!
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  parseProduct(): PPEProduct | null { return null; }
  parseManufacturer(): PPEManufacturer | null { return null; }
  parseCertification(): PPECertification | null { return null; }
}
