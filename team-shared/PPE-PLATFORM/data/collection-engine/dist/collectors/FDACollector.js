"use strict";
// FDA 510(k) PPE 数据采集器
// 数据源: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm
Object.defineProperty(exports, "__esModule", { value: true });
exports.FDACollector = void 0;
const BaseCollector_1 = require("../core/BaseCollector");
/**
 * FDA 510(k) 数据采集器
 * 采集美国 FDA 510(k) 预市场通知数据库中的 PPE 产品数据
 */
class FDACollector extends BaseCollector_1.BaseCollector {
    baseSearchUrl = 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm';
    detailBaseUrl = 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm';
    constructor() {
        super({
            sourceType: 'FDA',
            baseUrl: 'https://www.accessdata.fda.gov',
            headless: true,
            batchSize: 50,
            rateLimitPerSecond: 1, // FDA 网站限制较严
            requestTimeout: 60000,
        }, {
            enabled: true,
            rotateUserAgent: true,
            rotateProxy: false,
            randomDelay: true,
            minDelay: 2000,
            maxDelay: 5000,
            simulateHuman: true,
        });
    }
    /**
     * 执行 FDA 数据采集
     */
    async collect(filter) {
        this.startTime = Date.now();
        this.status = 'running';
        this.logger.info(`Task started: ${this.taskId}`, filter);
        try {
            // 1. 搜索 PPE 相关产品
            const searchResults = await this.searchPPEProducts(filter);
            this.totalRecords = searchResults.length;
            this.logger.info(`Found ${searchResults.length} products from FDA 510(k)`);
            // 2. 遍历每个产品获取详情
            for (let i = 0; i < searchResults.length; i++) {
                if (this.status === 'cancelled') {
                    this.logger.info('Task cancelled');
                    break;
                }
                const productInfo = searchResults[i];
                try {
                    // 获取产品详情
                    const detailHtml = await this.fetchProductDetail(productInfo.kNumber);
                    const $ = this.parseHTML(detailHtml);
                    // 解析产品数据
                    const product = this.parseProductFromDetail($, productInfo);
                    if (product) {
                        this.collectedProducts.push(product);
                        this.successRecords++;
                        // 解析制造商
                        const manufacturer = this.parseManufacturerFromDetail($, productInfo);
                        if (manufacturer) {
                            this.collectedManufacturers.push(manufacturer);
                        }
                        // 解析认证信息
                        const certification = this.parseCertificationFromDetail($, productInfo);
                        if (certification) {
                            this.collectedCertifications.push(certification);
                        }
                    }
                    // 更新进度
                    this.updateProgress(i + 1, searchResults.length, i + 1, searchResults.length);
                    // 批量保存
                    if (this.collectedProducts.length >= this.config.batchSize) {
                        await this.batchSave();
                    }
                }
                catch (error) {
                    this.recordError(error, productInfo.kNumber);
                }
                // 随机延迟，避免被封
                await this.randomDelay();
            }
            // 保存剩余数据
            if (this.collectedProducts.length > 0) {
                await this.batchSave();
            }
            this.status = 'completed';
            this.logger.info(`Task completed: ${this.taskId}`, {
                total: this.totalRecords,
                success: this.successRecords,
                failed: this.failedRecords,
            });
        }
        catch (error) {
            this.status = 'failed';
            this.logger.error(`Task failed: ${this.taskId}`, error);
            this.recordError(error);
        }
        finally {
            await this.closeBrowser();
        }
        return this.getResult();
    }
    /**
     * 搜索 PPE 产品
     */
    async searchPPEProducts(filter) {
        const results = [];
        // PPE 相关的产品代码前缀
        const ppeProductCodes = [
            'LYU', // 手术口罩
            'LYV', // N95 呼吸器
            'LYY', // 外科 N95 呼吸器
            'LZA', // 防护服
            'LZB', // 隔离服
            'LZC', // 手术服
            'LZD', // 手术单
            'LZE', // 手术手套
            'LZF', // 检查手套
            'LZG', // 护目镜
            'LZH', // 防护面罩
            'LZI', // 手术帽
            'LZJ', // 鞋套
        ];
        // 遍历每个产品代码进行搜索
        for (const productCode of ppeProductCodes) {
            try {
                const searchUrl = `${this.baseSearchUrl}?start_search=1&productcode=${productCode}`;
                const html = await this.fetchWithPuppeteer(searchUrl, 'table');
                const $ = this.parseHTML(html);
                // 解析搜索结果表格
                const products = this.parseSearchResults($);
                results.push(...products);
                this.logger.info(`Product code ${productCode}: found ${products.length} records`);
                // 检查是否有更多页面
                const hasMorePages = $('a:contains("Next")').length > 0;
                if (hasMorePages) {
                    // 处理分页（简化处理，实际可能需要递归或循环）
                    this.logger.info(`Multiple pages found for ${productCode}, processing first page only in this demo`);
                }
                await this.randomDelay();
            }
            catch (error) {
                this.logger.error(`Error searching product code ${productCode}`, error);
            }
        }
        return results;
    }
    /**
     * 解析搜索结果
     */
    parseSearchResults($) {
        const results = [];
        // FDA 510(k) 搜索结果表格
        $('table tr').each((index, element) => {
            if (index === 0)
                return; // 跳过表头
            const cells = $(element).find('td');
            if (cells.length >= 5) {
                const kNumber = $(cells[0]).text().trim();
                const deviceName = $(cells[1]).text().trim();
                const applicant = $(cells[2]).text().trim();
                const decisionDate = $(cells[3]).text().trim();
                const decision = $(cells[4]).text().trim();
                if (kNumber && kNumber.startsWith('K')) {
                    results.push({
                        kNumber,
                        deviceName,
                        applicant,
                        decisionDate,
                        decision,
                    });
                }
            }
        });
        return results;
    }
    /**
     * 获取产品详情
     */
    async fetchProductDetail(kNumber) {
        const detailUrl = `${this.detailBaseUrl}?id=${kNumber}`;
        return this.fetchWithPuppeteer(detailUrl, 'table');
    }
    /**
     * 从详情页解析产品数据
     */
    parseProductFromDetail($, info) {
        try {
            // 提取产品名称
            const deviceName = info.deviceName || $('h1').text().trim();
            // 确定产品分类
            const category = this.categorizeDevice(deviceName);
            // 提取产品描述
            const description = this.extractDescription($);
            return {
                id: undefined, // 由数据库生成
                productName: deviceName,
                productNameEn: deviceName,
                category,
                subcategory: this.extractSubcategory(deviceName),
                description,
                descriptionEn: description,
                manufacturerName: info.applicant,
                dataSource: 'FDA',
                sourceId: info.kNumber,
                sourceUrl: `${this.detailBaseUrl}?id=${info.kNumber}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
            };
        }
        catch (error) {
            this.logger.error(`Error parsing product ${info.kNumber}`, error);
            return null;
        }
    }
    /**
     * 从详情页解析制造商数据
     */
    parseManufacturerFromDetail($, info) {
        try {
            const applicant = info.applicant;
            if (!applicant)
                return null;
            // 提取地址信息
            const addressText = $('td:contains("Address")').next().text().trim();
            return {
                id: undefined,
                companyName: applicant,
                companyNameEn: applicant,
                address: addressText,
                country: this.extractCountry(addressText),
                dataSource: 'FDA',
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
            };
        }
        catch (error) {
            this.logger.error(`Error parsing manufacturer for ${info.kNumber}`, error);
            return null;
        }
    }
    /**
     * 从详情页解析认证数据
     */
    parseCertificationFromDetail($, info) {
        try {
            // 解析决定日期
            const decisionDate = this.parseDate(info.decisionDate);
            return {
                id: undefined,
                certificationType: 'FDA',
                certificationNumber: info.kNumber,
                issueDate: decisionDate,
                status: info.decision.toLowerCase().includes('substantially') ? 'active' : 'active',
                certBodyName: 'U.S. Food and Drug Administration',
                dataSource: 'FDA',
                sourceId: info.kNumber,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Error parsing certification for ${info.kNumber}`, error);
            return null;
        }
    }
    /**
     * 产品分类逻辑
     */
    categorizeDevice(deviceName) {
        const name = deviceName.toLowerCase();
        if (name.includes('respirator') || name.includes('mask') || name.includes('n95')) {
            return '呼吸防护';
        }
        if (name.includes('gown') || name.includes('coverall') || name.includes('apron')) {
            return '身体防护';
        }
        if (name.includes('glove')) {
            return '手部防护';
        }
        if (name.includes('goggle') || name.includes('shield') || name.includes('eyewear')) {
            return '眼面防护';
        }
        if (name.includes('cap') || name.includes('hood')) {
            return '头部防护';
        }
        if (name.includes('shoe') || name.includes('boot')) {
            return '足部防护';
        }
        return '其他防护';
    }
    /**
     * 提取子分类
     */
    extractSubcategory(deviceName) {
        const name = deviceName.toLowerCase();
        if (name.includes('n95'))
            return 'N95呼吸器';
        if (name.includes('surgical mask'))
            return '外科口罩';
        if (name.includes('procedure mask'))
            return '医用口罩';
        if (name.includes('isolation gown'))
            return '隔离服';
        if (name.includes('surgical gown'))
            return '手术服';
        if (name.includes('exam glove'))
            return '检查手套';
        if (name.includes('surgical glove'))
            return '外科手套';
        if (name.includes('face shield'))
            return '防护面罩';
        if (name.includes('goggle'))
            return '护目镜';
        return '';
    }
    /**
     * 提取产品描述
     */
    extractDescription($) {
        // 尝试从多个可能的位置提取描述
        const selectors = [
            'td:contains("Device Description") + td',
            'td:contains("Description") + td',
            '.device-description',
            '#deviceDescription',
        ];
        for (const selector of selectors) {
            const text = $(selector).text().trim();
            if (text && text.length > 10) {
                return text;
            }
        }
        return '';
    }
    /**
     * 提取国家信息
     */
    extractCountry(addressText) {
        const text = addressText.toLowerCase();
        if (text.includes('usa') || text.includes('united states'))
            return 'United States';
        if (text.includes('china'))
            return 'China';
        if (text.includes('mexico'))
            return 'Mexico';
        if (text.includes('canada'))
            return 'Canada';
        if (text.includes('germany'))
            return 'Germany';
        if (text.includes('malaysia'))
            return 'Malaysia';
        if (text.includes('vietnam'))
            return 'Vietnam';
        if (text.includes('thailand'))
            return 'Thailand';
        return '';
    }
    /**
     * 解析日期字符串
     */
    parseDate(dateStr) {
        if (!dateStr)
            return undefined;
        try {
            // 尝试多种日期格式
            const formats = [
                /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
                /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
                /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
            ];
            for (const format of formats) {
                const match = dateStr.match(format);
                if (match) {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
        }
        catch (error) {
            this.logger.warn(`Failed to parse date: ${dateStr}`);
        }
        return undefined;
    }
    // 实现抽象方法（简化版本）
    parseProduct(_element, _$) {
        // 在 collect 方法中直接处理，这里不需要实现
        return null;
    }
    parseManufacturer(_element, _$) {
        // 在 collect 方法中直接处理，这里不需要实现
        return null;
    }
    parseCertification(_element, _$) {
        // 在 collect 方法中直接处理，这里不需要实现
        return null;
    }
}
exports.FDACollector = FDACollector;
//# sourceMappingURL=FDACollector.js.map