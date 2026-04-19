"use strict";
/**
 * NMPA 数据采集器
 * 中国国家药品监督管理局医疗器械注册数据
 * 数据源: https://www.nmpa.gov.cn/
 * 医疗器械查询: https://www.nmpa.gov.cn/datasearch/search-info.html
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
exports.NMPACollector = void 0;
const BaseCollector_1 = require("../core/BaseCollector");
const cheerio = __importStar(require("cheerio"));
const uuid_1 = require("uuid");
class NMPACollector extends BaseCollector_1.BaseCollector {
    searchUrl = 'https://www.nmpa.gov.cn/datasearch/search-info.html';
    apiBaseUrl = 'https://www.nmpa.gov.cn/datasearch';
    constructor() {
        super({
            sourceType: 'NMPA',
            baseUrl: 'https://www.nmpa.gov.cn',
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
     * 采集 NMPA 数据
     */
    async collect(filter) {
        this.taskId = (0, uuid_1.v4)();
        this.status = 'running';
        this.startTime = Date.now();
        this.logger.info('开始 NMPA 数据采集任务', {
            taskId: this.taskId,
            filter,
        });
        try {
            await this.initializeBrowser();
            const products = await this.searchPPEProducts(filter);
            this.totalRecords = products.length;
            this.logger.info(`找到 ${products.length} 个 NMPA PPE 产品`);
            for (let i = 0; i < products.length; i++) {
                const productInfo = products[i];
                try {
                    this.progress = {
                        total: this.totalRecords,
                        completed: i,
                        failed: this.failedRecords,
                        percentage: Math.round((i / this.totalRecords) * 100),
                        currentItem: productInfo.registrationNumber,
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
                        sourceId: productInfo.registrationNumber,
                        sourceType: 'NMPA',
                        error: error instanceof Error ? error.message : '未知错误',
                        timestamp: new Date(),
                        retryable: true,
                    };
                    this.errors.push(errorInfo);
                    this.logger.error(`采集产品 ${productInfo.registrationNumber} 失败`, errorInfo);
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
        }
        catch (error) {
            this.status = 'failed';
            this.logger.error('NMPA 数据采集任务失败', error);
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
                const searchResponse = await this.axiosInstance.post(`${this.apiBaseUrl}/search`, {
                    tableId: 26, // 医疗器械注册证表
                    searchText: keyword,
                    pageSize: 100,
                    pageNum: 1,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        Referer: this.searchUrl,
                    },
                });
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
            }
            catch (error) {
                this.logger.error(`搜索关键词 ${keyword} 失败`, error);
            }
        }
        // 去重
        const uniqueProducts = new Map();
        for (const product of products) {
            uniqueProducts.set(product.registrationNumber, product);
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
            // 解析详情页面
            const detail = {
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
        }
        catch (error) {
            this.logger.error(`获取产品详情 ${productInfo.registrationNumber} 失败`, error);
            return null;
        }
    }
    /**
     * 从页面提取字段
     */
    extractField($, fieldName) {
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
    extractCountry($) {
        const countryText = this.extractField($, '注册人所在地') || this.extractField($, '生产国');
        if (countryText) {
            return countryText;
        }
        return '未知';
    }
    /**
     * 解析产品详情为 PPEProduct
     */
    parseProductDetail(detail) {
        const category = this.categorizeProduct(detail.productName, detail.scopeApplication);
        return {
            id: (0, uuid_1.v4)(),
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
    parseManufacturerDetail(detail) {
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
    parseCertificationDetail(detail) {
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
    categorizeProduct(productName, description) {
        const text = (productName + ' ' + description).toLowerCase();
        if (text.includes('口罩') || text.includes('呼吸'))
            return '呼吸防护';
        if (text.includes('手套') || text.includes('手部'))
            return '手部防护';
        if (text.includes('防护服') || text.includes('隔离衣') || text.includes('手术衣'))
            return '身体防护';
        if (text.includes('护目镜') || text.includes('眼镜') || text.includes('面罩'))
            return '眼部防护';
        if (text.includes('安全帽') || text.includes('头盔'))
            return '头部防护';
        if (text.includes('耳塞') || text.includes('耳罩'))
            return '听力防护';
        if (text.includes('鞋套') || text.includes('靴'))
            return '足部防护';
        return '其他防护';
    }
    /**
     * 获取子分类
     */
    getSubcategory(productName) {
        const text = productName.toLowerCase();
        if (text.includes('n95') || text.includes('kn95'))
            return 'N95/KN95口罩';
        if (text.includes('外科') || text.includes('surgical'))
            return '外科口罩';
        if (text.includes('医用'))
            return '医用口罩';
        if (text.includes('一次性'))
            return '一次性口罩';
        if (text.includes('乳胶'))
            return '乳胶手套';
        if (text.includes('丁腈'))
            return '丁腈手套';
        if (text.includes('pvc'))
            return 'PVC手套';
        return '';
    }
    /**
     * 确定 PPE 类别 (中国标准)
     */
    determinePPECategory(productName, description) {
        const text = (productName + ' ' + description).toLowerCase();
        // 根据风险等级分类
        if (text.includes('n95') || text.includes('kn95') || text.includes('ffp')) {
            return '高风险防护';
        }
        if (text.includes('医用') || text.includes('surgical') || text.includes('医疗')) {
            return '医用防护';
        }
        if (text.includes('工业') || text.includes('防尘')) {
            return '工业防护';
        }
        return '一般防护';
    }
    /**
     * 确定风险等级
     */
    determineRiskLevel(productName, description) {
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
    calculateDataQualityScore(detail) {
        let score = 70; // 基础分
        if (detail.productName)
            score += 10;
        if (detail.manufacturer)
            score += 10;
        if (detail.modelSpecification)
            score += 5;
        if (detail.scopeApplication)
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
exports.NMPACollector = NMPACollector;
//# sourceMappingURL=NMPACollector.js.map