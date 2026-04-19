/**
 * TGA 数据采集器
 * 澳大利亚治疗用品管理局
 * 数据源: https://www.tga.gov.au/
 * ARTG 搜索: https://www.tga.gov.au/resources/artg
 */
import { BaseCollector } from '../core/BaseCollector';
import { PPEProduct, PPEManufacturer, PPECertification, CollectionFilter, CollectionResult } from '../types';
export declare class TGACollector extends BaseCollector {
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
//# sourceMappingURL=TGACollector.d.ts.map