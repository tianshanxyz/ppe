"use strict";
/**
 * MDLooker PPE 数据采集引擎
 * 全球PPE产品数据统一采集平台
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.SUPPORTED_SOURCES = exports.ENGINE_NAME = exports.VERSION = exports.HealthCanadaCollector = exports.TGACollector = exports.PMDACollector = exports.NMPACollector = exports.EUDAMEDCollector = exports.FDACollector = void 0;
exports.getEngineInfo = getEngineInfo;
// 导出类型定义
__exportStar(require("./types"), exports);
// 导出核心模块
__exportStar(require("./core"), exports);
// 导出工具模块
__exportStar(require("./utils"), exports);
// 导出验证器模块
__exportStar(require("./validators"), exports);
// 导出采集器
var FDACollector_1 = require("./collectors/FDACollector");
Object.defineProperty(exports, "FDACollector", { enumerable: true, get: function () { return FDACollector_1.FDACollector; } });
var EUDAMEDCollector_1 = require("./collectors/EUDAMEDCollector");
Object.defineProperty(exports, "EUDAMEDCollector", { enumerable: true, get: function () { return EUDAMEDCollector_1.EUDAMEDCollector; } });
var NMPACollector_1 = require("./collectors/NMPACollector");
Object.defineProperty(exports, "NMPACollector", { enumerable: true, get: function () { return NMPACollector_1.NMPACollector; } });
var PMDACollector_1 = require("./collectors/PMDACollector");
Object.defineProperty(exports, "PMDACollector", { enumerable: true, get: function () { return PMDACollector_1.PMDACollector; } });
var TGACollector_1 = require("./collectors/TGACollector");
Object.defineProperty(exports, "TGACollector", { enumerable: true, get: function () { return TGACollector_1.TGACollector; } });
var HealthCanadaCollector_1 = require("./collectors/HealthCanadaCollector");
Object.defineProperty(exports, "HealthCanadaCollector", { enumerable: true, get: function () { return HealthCanadaCollector_1.HealthCanadaCollector; } });
// 版本信息
exports.VERSION = '1.0.0';
exports.ENGINE_NAME = 'MDLooker PPE Collection Engine';
// 支持的数据源
exports.SUPPORTED_SOURCES = [
    'FDA',
    'EUDAMED',
    'NMPA',
    'PMDA',
    'TGA',
    'HealthCanada',
];
// 引擎信息
function getEngineInfo() {
    return {
        name: exports.ENGINE_NAME,
        version: exports.VERSION,
        supportedSources: exports.SUPPORTED_SOURCES,
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
var core_1 = require("./core");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return core_1.collectorManager; } });
//# sourceMappingURL=index.js.map