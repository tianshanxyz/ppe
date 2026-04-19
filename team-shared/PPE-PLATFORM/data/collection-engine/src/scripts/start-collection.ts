/**
 * 数据采集启动脚本
 * 用于启动全球PPE数据采集任务
 */

import { collectorManager } from '../core/CollectorManager';
import { dataValidator } from '../validators/DataValidator';
import { Logger } from '../utils/Logger';
import { DataSourceType, CollectionFilter } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('DataCollection');

interface CollectionConfig {
  sources: DataSourceType[];
  filter?: CollectionFilter;
  outputDir: string;
  validateData: boolean;
  saveRawData: boolean;
}

/**
 * 启动数据采集
 */
async function startCollection(config: CollectionConfig): Promise<void> {
  logger.info('========================================');
  logger.info('MDLooker PPE 数据采集引擎启动');
  logger.info('========================================');
  logger.info(`数据源: ${config.sources.join(', ')}`);
  logger.info(`输出目录: ${config.outputDir}`);
  logger.info(`数据验证: ${config.validateData ? '启用' : '禁用'}`);
  logger.info('');

  // 确保输出目录存在
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const allResults: Record<string, any> = {};

  for (const source of config.sources) {
    try {
      logger.info(`----------------------------------------`);
      logger.info(`开始采集: ${source}`);
      logger.info(`----------------------------------------`);

      const startTime = Date.now();

      // 执行采集
      const result = await collectorManager.collectFromSource(source, config.filter);

      const duration = (Date.now() - startTime) / 1000;

      logger.info(`采集完成: ${source}`);
      logger.info(`  - 总记录数: ${result.totalRecords}`);
      logger.info(`  - 成功记录: ${result.successRecords}`);
      logger.info(`  - 失败记录: ${result.failedRecords}`);
      logger.info(`  - 耗时: ${duration.toFixed(2)}秒`);

      // 数据验证
      if (config.validateData && result.data.products.length > 0) {
        logger.info(`正在验证数据质量...`);
        const validation = dataValidator.validateProducts(result.data.products);

        logger.info(`验证结果:`);
        logger.info(`  - 有效记录: ${validation.metrics.validRecords}/${validation.metrics.totalRecords}`);
        logger.info(`  - 平均质量评分: ${validation.metrics.averageScore}/100`);

        // 保存验证报告
        const reportPath = path.join(config.outputDir, `${source.toLowerCase()}-validation-report.txt`);
        fs.writeFileSync(reportPath, dataValidator.generateValidationReport(validation.metrics));
        logger.info(`  - 验证报告已保存: ${reportPath}`);

        // 清洗数据
        const sanitizedProducts = result.data.products.map((p) => dataValidator.sanitizeProduct(p));
        result.data.products = sanitizedProducts;
      }

      // 保存数据
      const dataPath = path.join(config.outputDir, `${source.toLowerCase()}-data.json`);
      fs.writeFileSync(dataPath, JSON.stringify(result, null, 2));
      logger.info(`  - 数据已保存: ${dataPath}`);

      allResults[source] = result;
    } catch (error) {
      logger.error(`采集失败: ${source}`, error);
    }
  }

  // 保存汇总报告
  const summaryPath = path.join(config.outputDir, 'collection-summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config,
        results: Object.entries(allResults).map(([source, result]) => ({
          source,
          totalRecords: result.totalRecords,
          successRecords: result.successRecords,
          failedRecords: result.failedRecords,
          productCount: result.data.products.length,
          manufacturerCount: result.data.manufacturers.length,
          certificationCount: result.data.certifications.length,
        })),
      },
      null,
      2
    )
  );

  logger.info('');
  logger.info('========================================');
  logger.info('数据采集任务完成');
  logger.info(`汇总报告: ${summaryPath}`);
  logger.info('========================================');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const sources: DataSourceType[] = [];
  let filter: CollectionFilter = {};
  let outputDir = './output';
  let validateData = true;
  let saveRawData = true;

  // 解析参数
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--source' || arg === '-s') {
      const source = args[++i] as DataSourceType;
      if (source) sources.push(source);
    } else if (arg === '--all' || arg === '-a') {
      sources.push('FDA', 'EUDAMED', 'NMPA', 'PMDA', 'TGA', 'HealthCanada');
    } else if (arg === '--output' || arg === '-o') {
      outputDir = args[++i] || outputDir;
    } else if (arg === '--category' || arg === '-c') {
      filter.ppeCategory = args[++i];
    } else if (arg === '--date-from') {
      filter.dateFrom = new Date(args[++i]);
    } else if (arg === '--no-validate') {
      validateData = false;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  // 如果没有指定数据源，默认采集FDA
  if (sources.length === 0) {
    sources.push('FDA');
  }

  const config: CollectionConfig = {
    sources,
    filter,
    outputDir,
    validateData,
    saveRawData,
  };

  try {
    await startCollection(config);
    process.exit(0);
  } catch (error) {
    logger.error('采集任务失败', error);
    process.exit(1);
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
MDLooker PPE 数据采集引擎

用法: ts-node start-collection.ts [选项]

选项:
  -s, --source <source>    指定数据源 (FDA, EUDAMED, NMPA, PMDA, TGA, HealthCanada)
  -a, --all                采集所有数据源
  -o, --output <dir>       输出目录 (默认: ./output)
  -c, --category <cat>     按PPE类别过滤
  --date-from <date>       按日期过滤 (格式: YYYY-MM-DD)
  --no-validate            禁用数据验证
  -h, --help               显示帮助信息

示例:
  ts-node start-collection.ts -s FDA                    # 仅采集FDA数据
  ts-node start-collection.ts -a                        # 采集所有数据源
  ts-node start-collection.ts -s FDA -c "Category II"   # 采集FDA Category II数据
  ts-node start-collection.ts -a -o ./data              # 采集所有数据到指定目录
`);
}

// 运行主函数
main();
