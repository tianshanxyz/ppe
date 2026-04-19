/**
 * MDLooker PPE 数据采集引擎
 * 全球PPE产品数据统一采集平台
 */
export * from './types';
export * from './core';
export * from './utils';
export * from './validators';
export { FDACollector } from './collectors/FDACollector';
export { EUDAMEDCollector } from './collectors/EUDAMEDCollector';
export { NMPACollector } from './collectors/NMPACollector';
export { PMDACollector } from './collectors/PMDACollector';
export { TGACollector } from './collectors/TGACollector';
export { HealthCanadaCollector } from './collectors/HealthCanadaCollector';
export declare const VERSION = "1.0.0";
export declare const ENGINE_NAME = "MDLooker PPE Collection Engine";
export declare const SUPPORTED_SOURCES: readonly ["FDA", "EUDAMED", "NMPA", "PMDA", "TGA", "HealthCanada"];
export declare function getEngineInfo(): {
    name: string;
    version: string;
    supportedSources: readonly ["FDA", "EUDAMED", "NMPA", "PMDA", "TGA", "HealthCanada"];
    features: string[];
};
export { collectorManager as default } from './core';
//# sourceMappingURL=index.d.ts.map