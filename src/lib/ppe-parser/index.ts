/**
 * PPE 智能解析系统
 * Phase 2: 智能解析模型开发
 *
 * 使用示例:
 * ```typescript
 * import { ParserFactory, DataSourceType } from '@/lib/ppe-parser';
 *
 * // 创建 FDA 解析器
 * const parser = await ParserFactory.createParser(DataSourceType.FDA);
 *
 * // 获取列表页
 * const listResult = await parser.fetchListPage(1);
 *
 * // 获取详情页
 * const detailResult = await parser.fetchDetailPage('K123456');
 *
 * // 关闭解析器
 * await parser.close();
 * ```
 */

// 类型定义
export * from './types';

// 核心模块
export * from './core';

// 提取器模块
export * from './extractors';

// 解析器模块
export * from './parsers';

// 调度器模块
export * from './scheduler';

// 监控模块
export * from './monitoring';

// AI 模块 (Phase 3)
export * from './ai';

// 版本信息
export const VERSION = '3.0.0';
export const PHASE = 'Phase 3';
