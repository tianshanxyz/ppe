import { BaseCollector } from '../core/BaseCollector';
import { CollectionResult, CollectionFilter, PPEProduct, PPEManufacturer, PPECertification } from '../types';
import * as cheerio from 'cheerio';
/**
 * EUDAMED 数据采集器
 * 采集欧盟医疗器械数据库(EUDAMED)中的 PPE 产品数据
 */
export declare class EUDAMEDCollector extends BaseCollector {
    private readonly searchUrl;
    constructor();
    /**
     * 执行 EUDAMED 数据采集
     */
    collect(filter?: CollectionFilter): Promise<CollectionResult>;
    /**
     * 搜索 PPE 设备
     */
    private searchPPEDevices;
    /**
     * 解析设备列表
     */
    private parseDeviceList;
    /**
     * 获取设备详情
     */
    private fetchDeviceDetail;
    /**
     * 从详情解析产品数据
     */
    private parseProductFromDetail;
    /**
     * 从详情解析制造商数据
     */
    private parseManufacturerFromDetail;
    /**
     * 从详情解析认证数据
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
     * 解析日期
     */
    private parseDate;
    parseProduct(_element: cheerio.Element, _$: cheerio.CheerioAPI): PPEProduct | null;
    parseManufacturer(_element: cheerio.Element, _$: cheerio.CheerioAPI): PPEManufacturer | null;
    parseCertification(_element: cheerio.Element, _$: cheerio.CheerioAPI): PPECertification | null;
}
//# sourceMappingURL=EUDAMEDCollector.d.ts.map