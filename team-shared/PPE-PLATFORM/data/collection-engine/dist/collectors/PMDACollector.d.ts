/**
 * PMDA 数据采集器
 * 日本医药品医疗器械综合机构
 * 数据源: https://www.pmda.go.jp/
 * 医疗器械搜索: https://www.pmda.go.jp/PmdaSearch/iyakuSearch/
 */
import { BaseCollector } from '../core/BaseCollector';
import { PPEProduct, PPEManufacturer, PPECertification, CollectionFilter, CollectionResult } from '../types';
export declare class PMDACollector extends BaseCollector {
    private readonly searchUrl;
    private readonly baseUrl;
    constructor();
    /**
     * 采集 PMDA 数据
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
     * 确定 PPE 类别
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
//# sourceMappingURL=PMDACollector.d.ts.map