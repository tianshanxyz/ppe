"use strict";
// EUDAMED PPE 数据采集器
// 数据源: https://ec.europa.eu/tools/eudamed
Object.defineProperty(exports, "__esModule", { value: true });
exports.EUDAMEDCollector = void 0;
const BaseCollector_1 = require("../core/BaseCollector");
/**
 * EUDAMED 数据采集器
 * 采集欧盟医疗器械数据库(EUDAMED)中的 PPE 产品数据
 */
class EUDAMEDCollector extends BaseCollector_1.BaseCollector {
    searchUrl = 'https://ec.europa.eu/tools/eudamed/#/screen/search-device';
    constructor() {
        super({
            sourceType: 'EUDAMED',
            baseUrl: 'https://ec.europa.eu/tools/eudamed',
            headless: true,
            batchSize: 50,
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
     * 执行 EUDAMED 数据采集
     */
    async collect(filter) {
        this.startTime = Date.now();
        this.status = 'running';
        this.logger.logTaskStart(this.taskId, filter);
        try {
            // EUDAMED 使用 Angular 框架，需要等待动态内容加载
            await this.initBrowser();
            // 搜索 PPE 相关产品
            const searchResults = await this.searchPPEDevices(filter);
            this.totalRecords = searchResults.length;
            this.logger.info(`Found ${searchResults.length} devices from EUDAMED`);
            // 遍历每个设备获取详情
            for (let i = 0; i < searchResults.length; i++) {
                if (this.status === 'cancelled')
                    break;
                const deviceInfo = searchResults[i];
                try {
                    // 获取设备详情
                    const detailData = await this.fetchDeviceDetail(deviceInfo);
                    // 解析产品数据
                    const product = this.parseProductFromDetail(detailData);
                    if (product) {
                        this.collectedProducts.push(product);
                        this.successRecords++;
                        // 解析制造商
                        const manufacturer = this.parseManufacturerFromDetail(detailData);
                        if (manufacturer) {
                            this.collectedManufacturers.push(manufacturer);
                        }
                        // 解析认证信息
                        const certification = this.parseCertificationFromDetail(detailData);
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
                    this.recordError(error, deviceInfo.basicUdiDi);
                }
                await this.randomDelay();
            }
            // 保存剩余数据
            if (this.collectedProducts.length > 0) {
                await this.batchSave();
            }
            this.status = 'completed';
            this.logger.logTaskComplete(this.taskId, {
                total: this.totalRecords,
                success: this.successRecords,
                failed: this.failedRecords,
            });
        }
        catch (error) {
            this.status = 'failed';
            this.logger.logTaskFailed(this.taskId, error);
            this.recordError(error);
        }
        finally {
            await this.closeBrowser();
        }
        return this.getResult();
    }
    /**
     * 搜索 PPE 设备
     */
    async searchPPEDevices(filter) {
        const results = [];
        try {
            if (!this.page) {
                throw new Error('Browser page not initialized');
            }
            // 访问搜索页面
            await this.page.goto(this.searchUrl, {
                waitUntil: 'networkidle2',
                timeout: this.config.requestTimeout,
            });
            // 等待 Angular 应用加载
            await this.page.waitForTimeout(5000);
            // PPE 相关的 MDR 分类代码
            const mdrCodes = [
                'MDR 2017/745', // 医疗器械法规
            ];
            // 搜索 PPE 相关设备
            // 注意：EUDAMED 需要处理 Angular 动态渲染
            const searchInput = await this.page.$('input[placeholder*="Search"]');
            if (searchInput) {
                await searchInput.type('PPE');
                await this.page.keyboard.press('Enter');
                await this.page.waitForTimeout(3000);
            }
            // 获取搜索结果
            const html = await this.page.content();
            const $ = this.parseHTML(html);
            // 解析设备列表
            results.push(...this.parseDeviceList($));
        }
        catch (error) {
            this.logger.error('Error searching EUDAMED devices', error);
        }
        return results;
    }
    /**
     * 解析设备列表
     */
    parseDeviceList($) {
        const results = [];
        // EUDAMED 设备列表选择器（需要根据实际页面结构调整）
        $('.device-item, [data-testid="device-row"], tr.device-row').each((_, element) => {
            const $el = $(element);
            const basicUdiDi = $el.find('.udi-di, [data-field="basicUdiDi"]').text().trim();
            const tradeName = $el.find('.trade-name, [data-field="tradeName"]').text().trim();
            const manufacturerName = $el.find('.manufacturer, [data-field="manufacturer"]').text().trim();
            const deviceRiskClass = $el.find('.risk-class, [data-field="riskClass"]').text().trim();
            const notifiedBody = $el.find('.notified-body, [data-field="notifiedBody"]').text().trim();
            if (basicUdiDi || tradeName) {
                results.push({
                    basicUdiDi: basicUdiDi || '',
                    tradeName: tradeName || '',
                    manufacturerName: manufacturerName || '',
                    deviceRiskClass: deviceRiskClass || '',
                    notifiedBody: notifiedBody || '',
                });
            }
        });
        return results;
    }
    /**
     * 获取设备详情
     */
    async fetchDeviceDetail(deviceInfo) {
        // 模拟返回详情数据
        // 实际实现需要点击设备链接并解析详情页
        return {
            ...deviceInfo,
            deviceDescription: '',
            modelVersion: '',
            deviceStatus: '',
            certificateNumber: '',
            issueDate: '',
            expiryDate: '',
            manufacturerAddress: '',
            manufacturerCountry: '',
        };
    }
    /**
     * 从详情解析产品数据
     */
    parseProductFromDetail(detail) {
        try {
            const category = this.categorizeDevice(detail.tradeName, detail.deviceDescription);
            return {
                id: undefined,
                productName: detail.tradeName,
                productNameEn: detail.tradeName,
                category,
                subcategory: this.extractSubcategory(detail.tradeName),
                description: detail.deviceDescription,
                descriptionEn: detail.deviceDescription,
                modelNumber: detail.modelVersion,
                manufacturerName: detail.manufacturerName,
                dataSource: 'EUDAMED',
                sourceId: detail.basicUdiDi,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
            };
        }
        catch (error) {
            this.logger.error(`Error parsing product ${detail.basicUdiDi}`, error);
            return null;
        }
    }
    /**
     * 从详情解析制造商数据
     */
    parseManufacturerFromDetail(detail) {
        try {
            if (!detail.manufacturerName)
                return null;
            return {
                id: undefined,
                companyName: detail.manufacturerName,
                companyNameEn: detail.manufacturerName,
                address: detail.manufacturerAddress,
                country: detail.manufacturerCountry,
                dataSource: 'EUDAMED',
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
            };
        }
        catch (error) {
            this.logger.error(`Error parsing manufacturer for ${detail.basicUdiDi}`, error);
            return null;
        }
    }
    /**
     * 从详情解析认证数据
     */
    parseCertificationFromDetail(detail) {
        try {
            return {
                id: undefined,
                certificationType: 'CE',
                certificationNumber: detail.certificateNumber,
                issueDate: this.parseDate(detail.issueDate),
                expiryDate: this.parseDate(detail.expiryDate),
                status: detail.deviceStatus === 'Active' ? 'active' : 'expired',
                certBodyName: detail.notifiedBody,
                dataSource: 'EUDAMED',
                sourceId: detail.basicUdiDi,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Error parsing certification for ${detail.basicUdiDi}`, error);
            return null;
        }
    }
    /**
     * 产品分类逻辑
     */
    categorizeDevice(tradeName, description) {
        const text = (tradeName + ' ' + description).toLowerCase();
        if (text.includes('respirator') || text.includes('mask') || text.includes('ffp') || text.includes('filtering')) {
            return '呼吸防护';
        }
        if (text.includes('gown') || text.includes('coverall') || text.includes('protective clothing')) {
            return '身体防护';
        }
        if (text.includes('glove')) {
            return '手部防护';
        }
        if (text.includes('goggle') || text.includes('shield') || text.includes('face protection')) {
            return '眼面防护';
        }
        if (text.includes('cap') || text.includes('helmet') || text.includes('head protection')) {
            return '头部防护';
        }
        if (text.includes('shoe') || text.includes('boot') || text.includes('foot protection')) {
            return '足部防护';
        }
        return '其他防护';
    }
    /**
     * 提取子分类
     */
    extractSubcategory(tradeName) {
        const name = tradeName.toLowerCase();
        if (name.includes('ffp2'))
            return 'FFP2呼吸器';
        if (name.includes('ffp3'))
            return 'FFP3呼吸器';
        if (name.includes('surgical mask'))
            return '外科口罩';
        if (name.includes('type iir'))
            return 'IIR型口罩';
        if (name.includes('type ii'))
            return 'II型口罩';
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
     * 解析日期
     */
    parseDate(dateStr) {
        if (!dateStr)
            return undefined;
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        catch (error) {
            this.logger.warning(`Failed to parse date: ${dateStr}`);
        }
        return undefined;
    }
    // 实现抽象方法
    parseProduct(_element, _$) {
        return null;
    }
    parseManufacturer(_element, _$) {
        return null;
    }
    parseCertification(_element, _$) {
        return null;
    }
}
exports.EUDAMEDCollector = EUDAMEDCollector;
//# sourceMappingURL=EUDAMEDCollector.js.map