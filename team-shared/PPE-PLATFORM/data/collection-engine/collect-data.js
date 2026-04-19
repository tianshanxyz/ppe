#!/usr/bin/env node

/**
 * MDLooker PPE 数据采集脚本
 * 直接执行数据采集任务
 */

const { collectorManager } = require('./dist/core/CollectorManager');
const { logger } = require('./dist/utils/Logger');
const fs = require('fs');
const path = require('path');

// 输出目录
const OUTPUT_DIR = path.join(__dirname, 'collected-data');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 保存采集结果到文件
 */
function saveResults(sourceType, result) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${sourceType.toLowerCase()}-${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const data = {
    sourceType,
    collectedAt: new Date().toISOString(),
    result: {
      totalRecords: result.totalRecords,
      successRecords: result.successRecords,
      failedRecords: result.failedRecords,
      products: result.data.products,
      manufacturers: result.data.manufacturers,
      certifications: result.data.certifications,
    },
  };

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  logger.info(`数据已保存到: ${filepath}`);
  return filepath;
}

/**
 * 生成采集报告
 */
function generateReport(allResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `collection-report-${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSources: Object.keys(allResults).length,
      totalProducts: Object.values(allResults).reduce(
        (sum, r) => sum + (r.successRecords || 0),
        0
      ),
      totalFailed: Object.values(allResults).reduce(
        (sum, r) => sum + (r.failedRecords || 0),
        0
      ),
    },
    details: allResults,
  };

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  logger.info(`采集报告已生成: ${filepath}`);
  return filepath;
}

/**
 * 主函数
 */
async function main() {
  logger.info('========================================');
  logger.info('MDLooker PPE 数据采集引擎启动');
  logger.info('========================================');

  // 要采集的数据源（从优先级高到低）
  const sources = ['FDA', 'EUDAMED', 'NMPA'];
  // const sources = ['FDA', 'EUDAMED', 'NMPA', 'PMDA', 'TGA', 'HealthCanada'];

  const allResults = {};

  for (const source of sources) {
    try {
      logger.info(`----------------------------------------`);
      logger.info(`开始采集: ${source}`);
      logger.info(`----------------------------------------`);

      const startTime = Date.now();

      // 执行采集
      const result = await collectorManager.collectFromSource(source, {
        ppeCategory: 'Category II', // 优先采集II类PPE
      });

      const duration = (Date.now() - startTime) / 1000;

      logger.info(`采集完成: ${source}`);
      logger.info(`  - 总记录数: ${result.totalRecords}`);
      logger.info(`  - 成功记录: ${result.successRecords}`);
      logger.info(`  - 失败记录: ${result.failedRecords}`);
      logger.info(`  - 耗时: ${duration.toFixed(2)}秒`);

      // 保存结果
      const filepath = saveResults(source, result);
      allResults[source] = {
        ...result,
        savedTo: filepath,
        duration,
      };
    } catch (error) {
      logger.error(`采集失败: ${source}`, error);
      allResults[source] = {
        error: error.message,
        status: 'failed',
      };
    }
  }

  // 生成报告
  const reportPath = generateReport(allResults);

  logger.info('========================================');
  logger.info('数据采集完成');
  logger.info('========================================');
  logger.info(`报告文件: ${reportPath}`);
  logger.info(`输出目录: ${OUTPUT_DIR}`);

  // 打印统计
  const totalProducts = Object.values(allResults).reduce(
    (sum, r) => sum + (r.successRecords || 0),
    0
  );
  logger.info(`总计采集产品: ${totalProducts} 个`);
}

// 执行主函数
main().catch((error) => {
  logger.error('程序执行失败', error);
  process.exit(1);
});
