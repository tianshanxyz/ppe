/**
 * NMPA 数据采集器
 * 中国国家药品监督管理局医疗器械注册数据
 * 数据源: https://www.nmpa.gov.cn/
 * 医疗器械查询: https://www.nmpa.gov.cn/datasearch/search-info.html
 */
import { BaseCollector } from '../core/BaseCollector';
import { PPEProduct, PPEManufacturer, PPECertification, CollectionFilter, CollectionResult } from '../types';
export declare class NMPACollector extends BaseCollector {
    private readonly searchUrl;
    private readonly apiBaseUrl;
    constructor();
    /**
     * 采集 NMPA 数据
     */
    collect(filter?: CollectionFilter): Promise<CollectionResult>;
    /**
     * 搜索 PPE 产品
     */
    private searchPPEProducts;
    /**
     * 获取产品详情
     */
    private getProductDetail;
    /**
     * 从页面提取字段
     */
    private extractField;
    /**
     * 提取国家信息
     */
    private extractCountry;
    /**
     * 解析产品详情为 PPEProduct
     */
    private parseProductDetail;
    /**
     * 解析制造商详情
     */
    private parseManufacturerDetail;
    /**
     * 解析认证详情
     */
    private parseCertificationDetail;
    /**
     * 产品分类
     */
    private categorizeProduct;
    /**
     * 获取子分类
     */
    private getSubcategory;
    /**
     * 确定 PPE 类别 (中国标准)
     */
    private determinePPECategory;
    /**
     * 确定风险等级
     */
    private determineRiskLevel;
    /**
     * 计算数据质量分数
     */
    private calculateDataQualityScore;
    /**
     * 获取随机延迟时间
     */
    private getRandomDelay;
    /**
     * 延迟函数
     */
    private delay;
    parseProduct(): PPEProduct | null;
    parseManufacturer(): PPEManufacturer | null;
    parseCertification(): PPECertification | null;
}
//# sourceMappingURL=NMPACollector.d.ts.map