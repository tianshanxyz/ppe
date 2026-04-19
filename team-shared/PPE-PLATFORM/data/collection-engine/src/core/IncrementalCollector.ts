/**
 * 增量采集管理器
 * 实现智能的增量数据更新机制，只采集新增或变更的数据
 */

import { DataSourceType, CollectionFilter, PPEProduct, PPEManufacturer, PPECertification } from '../types';
import { Logger } from '../utils/Logger';

export interface IncrementalConfig {
  // 数据源类型
  sourceType: DataSourceType;
  // 上次采集时间
  lastCollectTime?: Date;
  // 上次采集的最大ID/版本号
  lastMaxId?: string;
  // 上次采集的校验和
  lastChecksum?: string;
  // 增量采集模式
  mode: 'time-based' | 'id-based' | 'checksum-based' | 'hybrid';
  // 时间窗口（用于time-based模式，单位：小时）
  timeWindowHours: number;
  // 是否检测变更
  detectChanges: boolean;
  // 变更检测字段
  changeDetectionFields: string[];
}

export interface DataCheckpoint {
  sourceType: DataSourceType;
  timestamp: Date;
  maxId?: string;
  checksum?: string;
  recordCount: number;
  metadata: Record<string, any>;
}

export interface IncrementalResult {
  newRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  unchangedRecords: number;
  checkpoint: DataCheckpoint;
  changes: DataChange[];
}

export interface DataChange {
  type: 'new' | 'updated' | 'deleted';
  sourceId: string;
  sourceType: DataSourceType;
  oldData?: any;
  newData?: any;
  changedFields?: string[];
  timestamp: Date;
}

/**
 * 增量采集管理器类
 */
export class IncrementalCollector {
  private logger: Logger;
  private checkpoints: Map<DataSourceType, DataCheckpoint> = new Map();

  constructor() {
    this.logger = new Logger('IncrementalCollector');
  }

  /**
   * 加载检查点（从数据库或文件）
   */
  async loadCheckpoint(sourceType: DataSourceType): Promise<DataCheckpoint | undefined> {
    // 从内存缓存获取
    if (this.checkpoints.has(sourceType)) {
      return this.checkpoints.get(sourceType);
    }

    // TODO: 从数据库或文件加载检查点
    // 这里可以实现从 Supabase 或本地文件加载

    return undefined;
  }

  /**
   * 保存检查点
   */
  async saveCheckpoint(checkpoint: DataCheckpoint): Promise<void> {
    this.checkpoints.set(checkpoint.sourceType, checkpoint);

    // TODO: 持久化到数据库或文件
    this.logger.info(`检查点已保存: ${checkpoint.sourceType}`, {
      timestamp: checkpoint.timestamp,
      recordCount: checkpoint.recordCount,
    });
  }

  /**
   * 计算数据校验和
   */
  calculateChecksum(data: any): string {
    const crypto = require('crypto');
    const content = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 检测数据变更
   */
  detectChanges(
    oldData: any,
    newData: any,
    fields: string[]
  ): { hasChanged: boolean; changedFields: string[] } {
    const changedFields: string[] = [];

    for (const field of fields) {
      const oldValue = oldData[field];
      const newValue = newData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(field);
      }
    }

    return {
      hasChanged: changedFields.length > 0,
      changedFields,
    };
  }

  /**
   * 生成增量采集过滤器
   */
  generateIncrementalFilter(config: IncrementalConfig): CollectionFilter {
    const filter: CollectionFilter = {};

    switch (config.mode) {
      case 'time-based':
        if (config.lastCollectTime) {
          filter.dateFrom = config.lastCollectTime;
        }
        break;

      case 'id-based':
        if (config.lastMaxId) {
          filter.lastId = config.lastMaxId;
        }
        break;

      case 'hybrid':
        if (config.lastCollectTime) {
          filter.dateFrom = config.lastCollectTime;
        }
        if (config.lastMaxId) {
          filter.lastId = config.lastMaxId;
        }
        break;
    }

    return filter;
  }

  /**
   * 处理增量采集结果
   */
  async processIncrementalData<T extends { sourceId: string; updatedAt?: Date }>(
    config: IncrementalConfig,
    newData: T[],
    existingData: Map<string, T>
  ): Promise<IncrementalResult> {
    const result: IncrementalResult = {
      newRecords: 0,
      updatedRecords: 0,
      deletedRecords: 0,
      unchangedRecords: 0,
      checkpoint: {
        sourceType: config.sourceType,
        timestamp: new Date(),
        recordCount: 0,
        metadata: {},
      },
      changes: [],
    };

    const processedIds = new Set<string>();
    let maxId = config.lastMaxId || '';

    for (const item of newData) {
      processedIds.add(item.sourceId);

      // 更新最大ID
      if (item.sourceId > maxId) {
        maxId = item.sourceId;
      }

      const existing = existingData.get(item.sourceId);

      if (!existing) {
        // 新记录
        result.newRecords++;
        result.changes.push({
          type: 'new',
          sourceId: item.sourceId,
          sourceType: config.sourceType,
          newData: item,
          timestamp: new Date(),
        });
      } else if (config.detectChanges) {
        // 检测变更
        const { hasChanged, changedFields } = this.detectChanges(
          existing,
          item,
          config.changeDetectionFields
        );

        if (hasChanged) {
          result.updatedRecords++;
          result.changes.push({
            type: 'updated',
            sourceId: item.sourceId,
            sourceType: config.sourceType,
            oldData: existing,
            newData: item,
            changedFields,
            timestamp: new Date(),
          });
        } else {
          result.unchangedRecords++;
        }
      } else {
        result.unchangedRecords++;
      }
    }

    // 检测删除的记录
    for (const [id, data] of existingData) {
      if (!processedIds.has(id)) {
        result.deletedRecords++;
        result.changes.push({
          type: 'deleted',
          sourceId: id,
          sourceType: config.sourceType,
          oldData: data,
          timestamp: new Date(),
        });
      }
    }

    // 更新检查点
    result.checkpoint.maxId = maxId;
    result.checkpoint.recordCount = newData.length;
    result.checkpoint.metadata = {
      newRecords: result.newRecords,
      updatedRecords: result.updatedRecords,
      deletedRecords: result.deletedRecords,
      unchangedRecords: result.unchangedRecords,
    };

    // 保存检查点
    await this.saveCheckpoint(result.checkpoint);

    this.logger.info(`增量采集完成: ${config.sourceType}`, {
      newRecords: result.newRecords,
      updatedRecords: result.updatedRecords,
      deletedRecords: result.deletedRecords,
      unchangedRecords: result.unchangedRecords,
    });

    return result;
  }

  /**
   * 合并增量数据到现有数据集
   */
  mergeIncrementalData<T extends { sourceId: string }>(
    existingData: T[],
    incrementalResult: IncrementalResult,
    newData: T[]
  ): T[] {
    const dataMap = new Map<string, T>();

    // 将现有数据放入Map
    for (const item of existingData) {
      dataMap.set(item.sourceId, item);
    }

    // 应用变更
    for (const change of incrementalResult.changes) {
      switch (change.type) {
        case 'new':
          const newItem = newData.find((d) => d.sourceId === change.sourceId);
          if (newItem) {
            dataMap.set(change.sourceId, newItem);
          }
          break;

        case 'updated':
          const updatedItem = newData.find((d) => d.sourceId === change.sourceId);
          if (updatedItem) {
            dataMap.set(change.sourceId, updatedItem);
          }
          break;

        case 'deleted':
          dataMap.delete(change.sourceId);
          break;
      }
    }

    return Array.from(dataMap.values());
  }

  /**
   * 创建增量采集配置
   */
  createConfig(
    sourceType: DataSourceType,
    mode: IncrementalConfig['mode'] = 'hybrid',
    options?: Partial<IncrementalConfig>
  ): IncrementalConfig {
    return {
      sourceType,
      mode,
      timeWindowHours: 24,
      detectChanges: true,
      changeDetectionFields: ['productName', 'description', 'certificationStatus', 'updatedAt'],
      ...options,
    };
  }

  /**
   * 获取数据源默认配置
   */
  getDefaultConfig(sourceType: DataSourceType): IncrementalConfig {
    const configs: Record<DataSourceType, Partial<IncrementalConfig>> = {
      FDA: {
        mode: 'time-based',
        timeWindowHours: 24,
        changeDetectionFields: ['deviceName', 'deviceClass', 'productCode', 'receivedDate'],
      },
      EUDAMED: {
        mode: 'hybrid',
        timeWindowHours: 12,
        changeDetectionFields: ['versionNumber', 'status', 'lastUpdatedDate'],
      },
      NMPA: {
        mode: 'time-based',
        timeWindowHours: 48,
        changeDetectionFields: ['productName', 'approvalDate', 'validityPeriod'],
      },
      PMDA: {
        mode: 'time-based',
        timeWindowHours: 72,
        changeDetectionFields: ['approvalNumber', 'approvalDate', 'productName'],
      },
      TGA: {
        mode: 'hybrid',
        timeWindowHours: 24,
        changeDetectionFields: ['artgId', 'productName', 'sponsorName', 'entryDate'],
      },
      HealthCanada: {
        mode: 'time-based',
        timeWindowHours: 48,
        changeDetectionFields: ['deviceIdentifier', 'productName', 'companyName'],
      },
    };

    return this.createConfig(sourceType, configs[sourceType]?.mode, configs[sourceType]);
  }

  /**
   * 生成变更报告
   */
  generateChangeReport(result: IncrementalResult): string {
    const lines: string[] = [
      `=== 增量采集变更报告: ${result.checkpoint.sourceType} ===`,
      `采集时间: ${result.checkpoint.timestamp.toISOString()}`,
      ``,
      `统计:`,
      `  - 新增记录: ${result.newRecords}`,
      `  - 更新记录: ${result.updatedRecords}`,
      `  - 删除记录: ${result.deletedRecords}`,
      `  - 未变更: ${result.unchangedRecords}`,
      ``,
    ];

    if (result.changes.length > 0) {
      lines.push(`变更详情:`);

      const newChanges = result.changes.filter((c) => c.type === 'new');
      const updatedChanges = result.changes.filter((c) => c.type === 'updated');
      const deletedChanges = result.changes.filter((c) => c.type === 'deleted');

      if (newChanges.length > 0) {
        lines.push(`\n  新增 (${newChanges.length}):`);
        newChanges.slice(0, 10).forEach((c) => {
          lines.push(`    - ${c.sourceId}`);
        });
        if (newChanges.length > 10) {
          lines.push(`    ... 还有 ${newChanges.length - 10} 条`);
        }
      }

      if (updatedChanges.length > 0) {
        lines.push(`\n  更新 (${updatedChanges.length}):`);
        updatedChanges.slice(0, 10).forEach((c) => {
          lines.push(`    - ${c.sourceId}: ${c.changedFields?.join(', ')}`);
        });
        if (updatedChanges.length > 10) {
          lines.push(`    ... 还有 ${updatedChanges.length - 10} 条`);
        }
      }

      if (deletedChanges.length > 0) {
        lines.push(`\n  删除 (${deletedChanges.length}):`);
        deletedChanges.slice(0, 10).forEach((c) => {
          lines.push(`    - ${c.sourceId}`);
        });
        if (deletedChanges.length > 10) {
          lines.push(`    ... 还有 ${deletedChanges.length - 10} 条`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * 清理过期检查点
   */
  async cleanupOldCheckpoints(maxAgeDays: number = 30): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sourceType, checkpoint] of this.checkpoints) {
      const age = (now.getTime() - checkpoint.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (age > maxAgeDays) {
        this.checkpoints.delete(sourceType);
        cleanedCount++;
        this.logger.info(`清理过期检查点: ${sourceType}`, { age: Math.round(age) });
      }
    }

    return cleanedCount;
  }
}

// 导出单例实例
export const incrementalCollector = new IncrementalCollector();
