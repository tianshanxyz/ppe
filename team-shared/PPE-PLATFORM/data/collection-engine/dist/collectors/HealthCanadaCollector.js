"use strict";
/**
 * Health Canada 数据采集器
 * 加拿大卫生部医疗器械数据库
 * 数据源: https://health-products.canada.ca/mdall-limh/
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCanadaCollector = void 0;
const BaseCollector_1 = require("../core/BaseCollector");
const cheerio = __importStar(require("cheerio"));
const uuid_1 = require("uuid");
class HealthCanadaCollector extends BaseCollector_1.BaseCollector {
    searchUrl = 'https://health-products.canada.ca/mdall-limh/';
    apiBaseUrl = 'https://health-products.canada.ca/api/mdall';
    constructor() {
        super({
            sourceType: 'HealthCanada',
            baseUrl: 'https://health-products.canada.ca',
            headless: true,
            batchSize: 30,
            rateLimitPerSecond: 1,
            requestTimeout: 60000,
        }, {
            enabled: true,
            rotateUserAgent: true,
            rotateProxy: false,
            randomDelay: true,
            minDelay: 3000,
            maxDelay: 6000,
            simulateHuman: true,
        });
    }
    async collect(filter) {
        this.taskId = (0, uuid_1.v4)();
        this.status = 'running';
        this.startTime = Date.now();
        this.logger.info('开始 Health Canada 数据采集任务', { taskId: this.taskId, filter });
        try {
            await this.initializeBrowser();
            const products = await this.searchPPEProducts(filter);
            this.totalRecords = products.length;
            this.logger.info(`找到 ${products.length} 个 Health Canada PPE 产品`);
            for (let i = 0; i < products.length; i++) {
                const productInfo = products[i];
                try {
                    this.progress = {
                        total: this.totalRecords,
                        completed: i,
                        failed: this.failedRecords,
                        percentage: Math.round((i / this.totalRecords) * 100),
                        currentItem: productInfo.deviceIdentifier,
                    };
                    const detail = await this.getProductDetail(productInfo);
                    if (detail) {
                        const ppeProduct = this.parseProductDetail(detail);
                        if (ppeProduct) {
                            this.collectedProducts.push(ppeProduct);
                            this.successRecords++;
                            const manufacturer = this.parseManufacturerDetail(detail);
                            if (manufacturer)
                                this.collectedManufacturers.push(manufacturer);
                            const certification = this.parseCertificationDetail(detail);
                            if (certification)
                                this.collectedCertifications.push(certification);
                        }
                    }
                    await this.delay(this.getRandomDelay());
                }
                catch (error) {
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
                    await this.saveBatch();
                }
            }
            if (this.collectedProducts.length > 0)
                await this.saveBatch();
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
        }
        catch (error) {
            this.status = 'failed';
            throw error;
        }
        finally {
            await this.closeBrowser();
        }
    }
    async searchPPEProducts(filter) {
        const products = [];
        const keywords = ['mask', 'respirator', 'gloves', 'gown', 'goggles', 'face shield', 'PPE'];
        if (filter?.keywords)
            keywords.unshift(...filter.keywords);
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
            }
            catch (error) {
                this.logger.error(`搜索失败: ${keyword}`, error);
            }
        }
        const unique = new Map();
        products.forEach((p) => unique.set(p.deviceIdentifier, p));
        return Array.from(unique.values());
    }
    async getProductDetail(info) {
        try {
            if (!info.detailUrl)
                return null;
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
        }
        catch (error) {
            this.logger.error(`获取详情失败: ${info.deviceIdentifier}`, error);
            return null;
        }
    }
    parseProductDetail(detail) {
        return {
            id: (0, uuid_1.v4)(),
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
    parseManufacturerDetail(detail) {
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
    parseCertificationDetail(detail) {
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
    categorizeProduct(name, purpose) {
        const text = (name + ' ' + purpose).toLowerCase();
        if (text.includes('mask') || text.includes('respirator'))
            return '呼吸防护';
        if (text.includes('gloves'))
            return '手部防护';
        if (text.includes('gown') || text.includes('clothing'))
            return '身体防护';
        if (text.includes('goggles') || text.includes('shield'))
            return '眼部防护';
        return '其他防护';
    }
    determinePPECategory(deviceClass) {
        const cls = deviceClass.toLowerCase();
        if (cls.includes('iv'))
            return '高风险防护';
        if (cls.includes('ii') || cls.includes('iii'))
            return '医用防护';
        if (cls.includes('i'))
            return '一般防护';
        return '一般防护';
    }
    determineRiskLevel(deviceClass) {
        const cls = deviceClass.toLowerCase();
        if (cls.includes('iv'))
            return '高风险';
        if (cls.includes('iii'))
            return '中高风险';
        if (cls.includes('ii'))
            return '中风险';
        return '低风险';
    }
    getRandomDelay() {
        return Math.floor(Math.random() * (this.antiCrawlConfig.maxDelay - this.antiCrawlConfig.minDelay) +
            this.antiCrawlConfig.minDelay);
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    parseProduct() { return null; }
    parseManufacturer() { return null; }
    parseCertification() { return null; }
}
exports.HealthCanadaCollector = HealthCanadaCollector;
//# sourceMappingURL=HealthCanadaCollector.js.map