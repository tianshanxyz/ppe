/**
 * Health Canada 数据采集器
 * 加拿大卫生部医疗器械数据库
 * 数据源: https://health-products.canada.ca/mdall-limh/
 */
import { BaseCollector } from '../core/BaseCollector';
import { PPEProduct, PPEManufacturer, PPECertification, CollectionFilter, CollectionResult } from '../types';
export declare class HealthCanadaCollector extends BaseCollector {
    private readonly searchUrl;
    private readonly apiBaseUrl;
    constructor();
    collect(filter?: CollectionFilter): Promise<CollectionResult>;
    private searchPPEProducts;
    private getProductDetail;
    private parseProductDetail;
    private parseManufacturerDetail;
    private parseCertificationDetail;
    private categorizeProduct;
    private determinePPECategory;
    private determineRiskLevel;
    private getRandomDelay;
    private delay;
    parseProduct(): PPEProduct | null;
    parseManufacturer(): PPEManufacturer | null;
    parseCertification(): PPECertification | null;
}
//# sourceMappingURL=HealthCanadaCollector.d.ts.map