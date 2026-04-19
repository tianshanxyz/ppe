/**
 * TGA 数据采集器
 * 澳大利亚治疗用品管理局
 * 数据源: https://www.tga.gov.au/
 * ARTG 搜索: https://www.tga.gov.au/resources/artg
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

interface TGAProductInfo {
  artgId: string;
  productName: string;
  sponsor: string;
  manufacturer: string;
  approvalDate: string;
  deviceClass: string;
  detailUrl?: string;
}

interface TGAProductDetail {
  artgId: string;
  productName: string;
  sponsor: string;
  manufacturer: string;
  manufacturerAddress: string;
  manufacturerCountry: string;
  deviceClass: string;
  gmdnCode: string;
  gmdnTerm: string;
  approvalDate: string;
  intendedPurpose: string;
}

export class TGACollector extends BaseCollector {
  private readonly searchUrl = 'https://www.tga.gov.au/resources/artg';
  private readonly apiBaseUrl = 'https://www.tga.gov.au/api/artg';

  constructor() {
    super(
      {
        sourceType: 'TGA' as DataSourceType,
        baseUrl: 'https://www.tga.gov.au',
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

    this.logger.info('开始 TGA 数据采集任务', { taskId: this.taskId, filter });

    try {
      await this.initializeBrowser();
      const products = await this.searchPPEProducts(filter);
      this.totalRecords = products.length;

      this.logger.info(`找到 ${products.length} 个 TGA PPE 产品`);

      for (let i = 0; i < products.length; i++) {
        const productInfo = products[i];
        try {
          this.progress = {
            total: this.totalRecords,
            completed: i,
            failed: this.failedRecords,
            percentage: Math.round((i / this.totalRecords) * 100),
            currentItem: productInfo.artgId,
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

          await this.delay(this.getRandomDelay());
        } catch (error) {
          this.failedRecords++;
          this.errors.push({
            sourceId: productInfo.artgId,
            sourceType: 'TGA',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            retryable: true,
          });
        }

        if (this.collectedProducts.length >= this.config.batchSize) {
          await this.saveBatch();
        }
      }

      if (this.collectedProducts.length > 0) await this.saveBatch();

      this.status = 'completed';
      return {
        taskId: this.taskId,
        sourceType: 'TGA',
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

  private async searchPPEProducts(filter?: CollectionFilter): Promise<TGAProductInfo[]> {
    const products: TGAProductInfo[] = [];
    const keywords = ['mask', 'respirator', 'gloves', 'gown', 'goggles', 'face shield', 'PPE'];

    if (filter?.keywords) keywords.unshift(...filter.keywords);

    for (const keyword of keywords) {
      try {
        const response = await this.axiosInstance.get(`${this.apiBaseUrl}/search`, {
          params: { term: keyword, category: 'medical_device' },
        });

        const $ = cheerio.load(response.data);
        $('.artg-result').each((_, el) => {
          const $el = $(el);
          products.push({
            artgId: $el.find('.artg-id').text().trim(),
            productName: $el.find('.product-name').text().trim(),
            sponsor: $el.find('.sponsor').text().trim(),
            manufacturer: $el.find('.manufacturer').text().trim(),
            approvalDate: $el.find('.approval-date').text().trim(),
            deviceClass: $el.find('.device-class').text().trim(),
            detailUrl: $el.find('a').attr('href'),
          });
        });

        await this.delay(this.getRandomDelay());
      } catch (error) {
        this.logger.error(`搜索失败: ${keyword}`, error);
      }
    }

    const unique = new Map<string, TGAProductInfo>();
    products.forEach((p) => unique.set(p.artgId, p));
    return Array.from(unique.values());
  }

  private async getProductDetail(info: TGAProductInfo): Promise<TGAProductDetail | null> {
    try {
      if (!info.detailUrl) return null;
      const response = await this.axiosInstance.get(info.detailUrl);
      const $ = cheerio.load(response.data);

      return {
        artgId: info.artgId,
        productName: info.productName,
        sponsor: info.sponsor,
        manufacturer: info.manufacturer,
        manufacturerAddress: $('.manufacturer-address').text().trim(),
        manufacturerCountry: $('.manufacturer-country').text().trim() || 'Australia',
        deviceClass: info.deviceClass,
        gmdnCode: $('.gmdn-code').text().trim(),
        gmdnTerm: $('.gmdn-term').text().trim(),
        approvalDate: info.approvalDate,
        intendedPurpose: $('.intended-purpose').text().trim(),
      };
    } catch (error) {
      this.logger.error(`获取详情失败: ${info.artgId}`, error);
      return null;
    }
  }

  private parseProductDetail(detail: TGAProductDetail): PPEProduct {
    return {
      id: uuidv4(),
      productName: detail.productName,
      productNameEn: detail.productName,
      productCode: detail.artgId,
      category: this.categorizeProduct(detail.productName, detail.intendedPurpose),
      ppeCategory: this.determinePPECategory(detail.deviceClass),
      riskLevel: this.determineRiskLevel(detail.deviceClass),
      description: detail.intendedPurpose,
      manufacturerName: detail.manufacturer,
      manufacturerCountry: detail.manufacturerCountry,
      dataSource: 'TGA',
      sourceId: detail.artgId,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataQualityScore: 80,
      isActive: true,
    };
  }

  private parseManufacturerDetail(detail: TGAProductDetail): PPEManufacturer {
    return {
      companyName: detail.manufacturer,
      address: detail.manufacturerAddress,
      country: detail.manufacturerCountry,
      dataSource: 'TGA',
      sourceId: `${detail.manufacturer}_${detail.artgId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataQualityScore: 80,
      isActive: true,
    };
  }

  private parseCertificationDetail(detail: TGAProductDetail): PPECertification {
    return {
      certificationType: 'TGA',
      certificationNumber: detail.artgId,
      standardCode: 'AS/NZS 1716',
      issueDate: detail.approvalDate ? new Date(detail.approvalDate) : undefined,
      certBodyName: 'TGA',
      status: 'active',
      dataSource: 'TGA',
      sourceId: detail.artgId,
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

  private determinePPECategory(deviceClass: string): string {
    const cls = deviceClass.toLowerCase();
    if (cls.includes('iii')) return '高风险防护';
    if (cls.includes('ii')) return '医用防护';
    if (cls.includes('i')) return '一般防护';
    return '一般防护';
  }

  private determineRiskLevel(deviceClass: string): string {
    const cls = deviceClass.toLowerCase();
    if (cls.includes('iii')) return '高风险';
    if (cls.includes('iib')) return '中高风险';
    if (cls.includes('iia')) return '中风险';
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
