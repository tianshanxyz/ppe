/**
 * MDLooker PPE 数据采集引擎
 * 全球PPE产品数据统一采集平台
 */

// 导出类型定义
export * from './types';

// 导出核心模块
export * from './core';

// 导出工具模块
export * from './utils';

// 导出验证器模块
export * from './validators';

// 导出采集器
export { FDACollector } from './collectors/FDACollector';
export { EUDAMEDCollector } from './collectors/EUDAMEDCollector';
export { NMPACollector } from './collectors/NMPACollector';
export { PMDACollector } from './collectors/PMDACollector';
export { TGACollector } from './collectors/TGACollector';
export { HealthCanadaCollector } from './collectors/HealthCanadaCollector';

// 版本信息
export const VERSION = '1.0.0';
export const ENGINE_NAME = 'MDLooker PPE Collection Engine';

// 支持的数据源
export const SUPPORTED_SOURCES = [
  'FDA',
  'EUDAMED',
  'NMPA',
  'PMDA',
  'TGA',
  'HealthCanada',
] as const;

// 引擎信息
export function getEngineInfo() {
  return {
    name: ENGINE_NAME,
    version: VERSION,
    supportedSources: SUPPORTED_SOURCES,
    features: [
      '多数据源采集',
      '反爬策略',
      '增量采集',
      '数据验证',
      '任务管理API',
      '浏览器指纹伪装',
      '动态速率限制',
      '验证码处理',
    ],
  };
}

// 默认导出
export { collectorManager as default } from './core';
