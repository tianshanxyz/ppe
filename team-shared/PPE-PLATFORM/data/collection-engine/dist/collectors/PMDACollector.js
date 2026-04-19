"use strict";
/**
 * PMDA 数据采集器
 * 日本医药品医疗器械综合机构
 * 数据源: https://www.pmda.go.jp/
 * 医疗器械搜索: https://www.pmda.go.jp/PmdaSearch/iyakuSearch/
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
exports.PMDACollector = void 0;
const BaseCollector_1 = require("../core/BaseCollector");
const cheerio = __importStar(require("cheerio"));
const uuid_1 = require("uuid");
class PMDACollector extends BaseCollector_1.BaseCollector {
    searchUrl = 'https://www.pmda.go.jp/PmdaSearch/iyakuSearch/';
    baseUrl = 'https://www.pmda.go.jp';
    constructor() {
        super({
            sourceType: 'PMDA',
            baseUrl: 'https://www.pmda.go.jp',
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
    /**
     * 采集 PMDA 数据
     */
    async collect(filter) {
        this.taskId = (0, uuid_1.v4)();
        this.status = 'running';
        this.startTime = Date.now();
        this.logger.info('开始 PMDA 数据采集任务', {
            taskId: this.taskId,
            filter,
        });
        try {
            await this.initializeBrowser();
            const products = await this.searchPPEProducts(filter);
            this.totalRecords = products.length;
            this.logger.info(`找到 ${products.length} 个 PMDA PPE 产品`);
            for (let i = 0; i < products.length; i++) {
                const productInfo = products[i];
                try {
                    this.progress = {
                        total: this.totalRecords,
                        completed: i,
                        failed: this.failedRecords,
                        percentage: Math.round((i / this.totalRecords) * 100),
                        currentItem: productInfo.approvalNumber,
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
                    await this.delay(this.getRandomDelay());
                }
                catch (error) {
                    this.failedRecords++;
                    const errorInfo = {
                        sourceId: productInfo.approvalNumber,
                        sourceType: 'PMDA',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: new Date(),
                        retryable: true,
                    };
                    this.errors.push(errorInfo);
                    this.logger.error(`采集产品 ${productInfo.approvalNumber} 失败`, errorInfo);
                }
                if (this.collectedProducts.length >= this.config.batchSize) {
                    await this.saveBatch();
                }
            }
            if (this.collectedProducts.length > 0) {
                await this.saveBatch();
            }
            this.status = 'completed';
            const duration = Date.now() - this.startTime;
            this.logger.info('PMDA 数据采集任务完成', {
                taskId: this.taskId,
                total: this.totalRecords,
                success: this.successRecords,
                failed: this.failedRecords,
                duration: `${duration}ms`,
            });
            return {
                taskId: this.taskId,
                sourceType: 'PMDA',
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
            this.logger.error('PMDA 数据采集任务失败', error);
            throw error;
        }
        finally {
            await this.closeBrowser();
        }
    }
    /**
     * 搜索 PPE 产品
     */
    async searchPPEProducts(filter) {
        const products = [];
        const ppeKeywords = [
            'マスク', 'mask', '防護服', 'protective clothing',
            'ゴーグル', 'goggles', '手袋', 'gloves',
            'フェイスシールド', 'face shield', '防毒マスク', 'respirator',
            'ヘルメット', 'helmet', '安全靴', 'safety shoes',
        ];
        if (filter?.keywords && filter.keywords.length > 0) {
            ppeKeywords.unshift(...filter.keywords);
        }
        for (const keyword of ppeKeywords) {
            try {
                this.logger.info(`搜索关键词: ${keyword}`);
                const searchResponse = await this.axiosInstance.get(`${this.searchUrl}GeneralList`, {
                    params: {
                        keyword: keyword,
                        category: 'medical_device',
                        page: 1,
                    },
                    headers: {
                        Referer: this.searchUrl,
                    },
                });
                const $ = cheerio.load(searchResponse.data);
                // 解析搜索结果
                $('.result-item').each((_, element) => {
                    const $item = $(element);
                    const approvalNumber = $item.find('.approval-number').text().trim();
                    const productName = $item.find('.product-name').text().trim();
                    const manufacturer = $item.find('.manufacturer').text().trim();
                    const approvalDate = $item.find('.approval-date').text().trim();
                    const detailLink = $item.find('a').attr('href');
                    if (approvalNumber && productName) {
                        products.push({
                            approvalNumber,
                            productName,
                            productNameJp: productName,
                            manufacturer,
                            approvalDate,
                            category: 'Medical Device',
                            detailUrl: detailLink ? `${this.baseUrl}${detailLink}` : undefined,
                        });
                    }
                });
                await this.delay(this.getRandomDelay());
            }
            catch (error) {
                this.logger.error(`搜索关键词 ${keyword} 失败`, error);
            }
        }
        // 去重
        const uniqueProducts = new Map();
        for (const product of products) {
            uniqueProducts.set(product.approvalNumber, product);
        }
        return Array.from(uniqueProducts.values());
    }
    /**
     * 获取产品详情
     */
    async getProductDetail(productInfo) {
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
            const detail = {
                approvalNumber: productInfo.approvalNumber,
                productName: productInfo.productName,
                productNameJp: productInfo.productNameJp,
                genericName: this.extractField($, '一般名') || this.extractField($, 'Generic name') || '',
                manufacturer: productInfo.manufacturer,
                manufacturerAddress: this.extractField($, '製造販売業者住所') || '',
                manufacturerCountry: 'Japan',
                marketingAuthorizationHolder: this.extractField($, '販売名') || '',
                approvalDate: productInfo.approvalDate,
                validityDate: this.extractField($, '有効期限') || '',
                category: productInfo.category,
                intendedUse: this.extractField($, '効能効果') || this.extractField($, '用途') || '',
                specifications: this.extractField($, '規格') || '',
                precautions: this.extractField($, '使用上の注意') || '',
            };
            return detail;
        }
        catch (error) {
            this.logger.error(`获取产品详情 ${productInfo.approvalNumber} 失败`, error);
            return null;
        }
    }
    /**
     * 从页面提取字段
     */
    extractField($, fieldName) {
        const selectors = [
            `th:contains("${fieldName}") + td`,
            `dt:contains("${fieldName}") + dd`,
            `.label:contains("${fieldName}") + .value`,
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
     * 解析产品详情为 PPEProduct
     */
    parseProductDetail(detail) {
        const category = this.categorizeProduct(detail.productName, detail.intendedUse);
        return {
            id: (0, uuid_1.v4)(),
            productName: detail.productName,
            productNameEn: detail.genericName || detail.productName,
            productNameLocal: detail.productNameJp,
            productCode: detail.approvalNumber,
            modelNumber: detail.specifications,
            category: category,
            subcategory: this.getSubcategory(detail.productName),
            ppeCategory: this.determinePPECategory(detail.productName, detail.intendedUse),
            riskLevel: this.determineRiskLevel(detail.productName, detail.intendedUse),
            description: detail.intendedUse,
            descriptionEn: detail.intendedUse,
            specifications: {
                specifications: detail.specifications,
                precautions: detail.precautions,
            },
            features: {
                intendedUse: detail.intendedUse,
            },
            images: [],
            manufacturerId: undefined,
            manufacturerName: detail.manufacturer,
            manufacturerAddress: detail.manufacturerAddress,
            manufacturerCountry: detail.manufacturerCountry,
            brandName: detail.marketingAuthorizationHolder || detail.manufacturer,
            brandOwner: detail.manufacturer,
            dataSource: 'PMDA',
            sourceId: detail.approvalNumber,
            sourceUrl: `${this.searchUrl}Detail/${detail.approvalNumber}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            dataQualityScore: this.calculateDataQualityScore(detail),
            isActive: true,
        };
    }
    /**
     * 解析制造商详情
     */
    parseManufacturerDetail(detail) {
        if (!detail.manufacturer) {
            return null;
        }
        return {
            companyName: detail.manufacturer,
            address: detail.manufacturerAddress,
            country: detail.manufacturerCountry,
            dataSource: 'PMDA',
            sourceId: `${detail.manufacturer}_${detail.approvalNumber}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            dataQualityScore: 80,
            isActive: true,
        };
    }
    /**
     * 解析认证详情
     */
    parseCertificationDetail(detail) {
        if (!detail.approvalNumber) {
            return null;
        }
        return {
            certificationType: 'PMDA',
            certificationNumber: detail.approvalNumber,
            standardCode: 'JIS T 8151', // 日本防护口罩标准
            issueDate: detail.approvalDate ? new Date(detail.approvalDate) : undefined,
            expiryDate: detail.validityDate ? new Date(detail.validityDate) : undefined,
            certBodyName: 'PMDA',
            status: 'active',
            dataSource: 'PMDA',
            sourceId: detail.approvalNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    /**
     * 产品分类
     */
    categorizeProduct(productName, description) {
        const text = (productName + ' ' + description).toLowerCase();
        if (text.includes('マスク') || text.includes('mask') || text.includes('respirator'))
            return '呼吸防护';
        if (text.includes('手袋') || text.includes('gloves'))
            return '手部防护';
        if (text.includes('防護服') || text.includes('clothing') || text.includes('gown'))
            return '身体防护';
        if (text.includes('ゴーグル') || text.includes('goggles') || text.includes('shield'))
            return '眼部防护';
        if (text.includes('ヘルメット') || text.includes('helmet'))
            return '头部防护';
        if (text.includes('耳') || text.includes('ear'))
            return '听力防护';
        if (text.includes('靴') || text.includes('shoes'))
            return '足部防护';
        return '其他防护';
    }
    /**
     * 获取子分类
     */
    getSubcategory(productName) {
        const text = productName.toLowerCase();
        if (text.includes('n95') || text.includes('ds2') || text.includes('ds3'))
            return 'N95/DS2口罩';
        if (text.includes('外科') || text.includes('surgical'))
            return '外科口罩';
        if (text.includes('乳胶') || text.includes('latex'))
            return '乳胶手套';
        if (text.includes('ニトリル') || text.includes('nitrile'))
            return '丁腈手套';
        return '';
    }
    /**
     * 确定 PPE 类别
     */
    determinePPECategory(productName, description) {
        const text = (productName + ' ' + description).toLowerCase();
        if (text.includes('n95') || text.includes('ds3') || text.includes('high')) {
            return '高风险防护';
        }
        if (text.includes('ds2') || text.includes('医用') || text.includes('medical')) {
            return '医用防护';
        }
        if (text.includes('工业') || text.includes('industrial')) {
            return '工业防护';
        }
        return '一般防护';
    }
    /**
     * 确定风险等级
     */
    determineRiskLevel(productName, description) {
        const text = (productName + ' ' + description).toLowerCase();
        if (text.includes('n95') || text.includes('ds3') || text.includes('class iii')) {
            return '高风险';
        }
        if (text.includes('ds2') || text.includes('class ii')) {
            return '中高风险';
        }
        if (text.includes('ds1') || text.includes('class i')) {
            return '中风险';
        }
        return '低风险';
    }
    /**
     * 计算数据质量分数
     */
    calculateDataQualityScore(detail) {
        let score = 70;
        if (detail.productName)
            score += 10;
        if (detail.manufacturer)
            score += 10;
        if (detail.specifications)
            score += 5;
        if (detail.intendedUse)
            score += 5;
        if (detail.approvalDate)
            score += 5;
        if (detail.validityDate)
            score += 5;
        return Math.min(score, 100);
    }
    /**
     * 获取随机延迟时间
     */
    getRandomDelay() {
        return Math.floor(Math.random() * (this.antiCrawlConfig.maxDelay - this.antiCrawlConfig.minDelay) +
            this.antiCrawlConfig.minDelay);
    }
    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    // 实现抽象方法
    parseProduct() {
        return null;
    }
    parseManufacturer() {
        return null;
    }
    parseCertification() {
        return null;
    }
}
exports.PMDACollector = PMDACollector;
//# sourceMappingURL=PMDACollector.js.map