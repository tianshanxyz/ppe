import { BaseCollector } from '../core/BaseCollector';
import { CollectionResult, CollectionFilter, PPEProduct, PPEManufacturer, PPECertification } from '../types';
import * as cheerio from 'cheerio';
/**
 * FDA 510(k) 数据采集器
 * 采集美国 FDA 510(k) 预市场通知数据库中的 PPE 产品数据
 */
export declare class FDACollector extends BaseCollector {
    private readonly baseSearchUrl;
    private readonly detailBaseUrl;
    constructor();
    /**
     * 执行 FDA 数据采集
     */
    collect(filter?: CollectionFilter): Promise<CollectionResult>;
    /**
     * 搜索 PPE 产品
     */
    private searchPPEProducts;
    /**
     * 解析搜索结果
     */
    private parseSearchResults;
    /**
     * 获取产品详情
     */
    private fetchProductDetail;
    /**
     * 从详情页解析产品数据
     */
    private parseProductFromDetail;
    /**
     * 从详情页解析制造商数据
     */
    private parseManufacturerFromDetail;
    /**
     * 从详情页解析认证数据
     */
    private parseCertificationFromDetail;
    /**
     * 产品分类逻辑
     */
    private categorizeDevice;
    /**
     * 提取子分类
     */
    private extractSubcategory;
    /**
     * 提取产品描述
     */
    private extractDescription;
    /**
     * 提取国家信息
     */
    private extractCountry;
    /**
     * 解析日期字符串
     */
    private parseDate;
    parseProduct(_element: any, _$: cheerio.CheerioAPI): PPEProduct | null;
    parseManufacturer(_element: any, _$: cheerio.CheerioAPI): PPEManufacturer | null;
    parseCertification(_element: any, _$: cheerio.CheerioAPI): PPECertification | null;
}
//# sourceMappingURL=FDACollector.d.ts.map