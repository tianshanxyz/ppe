#!/usr/bin/env node

/**
 * MDLooker PPE 数据采集脚本 - 简化版
 * 直接执行数据采集任务，不依赖TypeScript编译
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 输出目录
const OUTPUT_DIR = path.join(__dirname, 'collected-data');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 简单的日志记录
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error ? error.message || error : ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data) : ''),
};

/**
 * FDA 数据采集器
 */
class FDACollector {
  constructor() {
    this.name = 'FDA';
    this.baseUrl = 'https://api.fda.gov/device/510k.json';
  }

  async collect(filter = {}) {
    logger.info(`开始采集 FDA 数据...`);
    
    const products = [];
    const manufacturers = [];
    const certifications = [];

    try {
      // FDA 510(k) API 查询 PPE 相关产品
      const searchTerms = ['respirator', 'mask', 'gown', 'glove', 'shield', 'ppe'];
      
      for (const term of searchTerms) {
        try {
          const response = await axios.get(this.baseUrl, {
            params: {
              search: `device_name:${term}`,
              limit: 100,
            },
            timeout: 30000,
          });

          if (response.data && response.data.results) {
            for (const item of response.data.results) {
              const product = {
                productName: item.device_name || 'Unknown',
                productCode: item.k_number || '',
                category: this.categorizeDevice(item.device_name),
                description: item.device_description || '',
                manufacturerName: item.applicant || '',
                dataSource: 'FDA',
                sourceId: item.k_number || '',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              products.push(product);

              if (item.applicant) {
                manufacturers.push({
                  companyName: item.applicant,
                  country: 'USA',
                  dataSource: 'FDA',
                  sourceId: item.applicant,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }

              certifications.push({
                certificationType: 'FDA',
                certificationNumber: item.k_number || '',
                certBodyName: 'U.S. Food and Drug Administration',
                status: item.decision === 'Substantially Equivalent' ? 'active' : 'pending',
                issueDate: item.date_received ? new Date(item.date_received) : undefined,
                dataSource: 'FDA',
                sourceId: item.k_number || '',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
          
          logger.info(`FDA 搜索 "${term}" 完成，找到 ${response.data.results?.length || 0} 条记录`);
          
          // 延迟避免请求过快
          await this.delay(1000);
        } catch (error) {
          logger.error(`FDA 搜索 "${term}" 失败`, error);
        }
      }
    } catch (error) {
      logger.error('FDA 采集失败', error);
    }

    return {
      sourceType: 'FDA',
      totalRecords: products.length,
      successRecords: products.length,
      failedRecords: 0,
      data: {
        products,
        manufacturers,
        certifications,
      },
    };
  }

  categorizeDevice(deviceName) {
    const name = (deviceName || '').toLowerCase();
    if (name.includes('respirator') || name.includes('mask')) return '呼吸防护';
    if (name.includes('gown')) return '身体防护';
    if (name.includes('glove')) return '手部防护';
    if (name.includes('shield') || name.includes('goggle')) return '眼面防护';
    return '其他防护';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * EUDAMED 数据采集器 (模拟)
 */
class EUDAMEDCollector {
  constructor() {
    this.name = 'EUDAMED';
  }

  async collect(filter = {}) {
    logger.info(`开始采集 EUDAMED 数据...`);
    
    // EUDAMED 需要特殊处理，这里返回模拟数据
    // 实际实现需要使用 Puppeteer 或专用 API
    
    const products = [
      {
        productName: 'FFP2 Respirator',
        productNameEn: 'FFP2 Respirator',
        category: '呼吸防护',
        ppeCategory: 'II',
        manufacturerName: 'Sample EU Manufacturer',
        manufacturerCountry: 'Germany',
        dataSource: 'EUDAMED',
        sourceId: 'EU-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productName: 'Surgical Mask Type IIR',
        productNameEn: 'Surgical Mask Type IIR',
        category: '呼吸防护',
        ppeCategory: 'II',
        manufacturerName: 'Another EU Manufacturer',
        manufacturerCountry: 'France',
        dataSource: 'EUDAMED',
        sourceId: 'EU-002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const manufacturers = [
      {
        companyName: 'Sample EU Manufacturer',
        country: 'Germany',
        dataSource: 'EUDAMED',
        sourceId: 'EU-MFG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        companyName: 'Another EU Manufacturer',
        country: 'France',
        dataSource: 'EUDAMED',
        sourceId: 'EU-MFG-002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const certifications = products.map(p => ({
      certificationType: 'CE',
      certificationNumber: `CE-${p.sourceId}`,
      certBodyName: 'Notified Body 0123',
      status: 'active',
      dataSource: 'EUDAMED',
      sourceId: p.sourceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    logger.info(`EUDAMED 采集完成，生成 ${products.length} 条模拟数据`);

    return {
      sourceType: 'EUDAMED',
      totalRecords: products.length,
      successRecords: products.length,
      failedRecords: 0,
      data: {
        products,
        manufacturers,
        certifications,
      },
    };
  }
}

/**
 * NMPA 数据采集器 (模拟)
 */
class NMPACollector {
  constructor() {
    this.name = 'NMPA';
  }

  async collect(filter = {}) {
    logger.info(`开始采集 NMPA 数据...`);
    
    // NMPA 需要特殊处理，这里返回模拟数据
    
    const products = [
      {
        productName: '医用防护口罩',
        productNameEn: 'Medical Protective Mask',
        productNameLocal: '医用防护口罩',
        category: '呼吸防护',
        ppeCategory: 'II',
        manufacturerName: 'Sample CN Manufacturer',
        manufacturerCountry: 'China',
        dataSource: 'NMPA',
        sourceId: 'CN-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productName: 'KN95口罩',
        productNameEn: 'KN95 Mask',
        productNameLocal: 'KN95口罩',
        category: '呼吸防护',
        ppeCategory: 'II',
        manufacturerName: 'Another CN Manufacturer',
        manufacturerCountry: 'China',
        dataSource: 'NMPA',
        sourceId: 'CN-002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const manufacturers = [
      {
        companyName: 'Sample CN Manufacturer',
        country: 'China',
        dataSource: 'NMPA',
        sourceId: 'CN-MFG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        companyName: 'Another CN Manufacturer',
        country: 'China',
        dataSource: 'NMPA',
        sourceId: 'CN-MFG-002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const certifications = products.map(p => ({
      certificationType: 'NMPA',
      certificationNumber: `国械注准${p.sourceId}`,
      standardCode: 'GB 19083',
      certBodyName: '国家药品监督管理局',
      status: 'active',
      dataSource: 'NMPA',
      sourceId: p.sourceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    logger.info(`NMPA 采集完成，生成 ${products.length} 条模拟数据`);

    return {
      sourceType: 'NMPA',
      totalRecords: products.length,
      successRecords: products.length,
      failedRecords: 0,
      data: {
        products,
        manufacturers,
        certifications,
      },
    };
  }
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
  logger.info('MDLooker PPE 数据采集引擎启动 (简化版)');
  logger.info('========================================');

  // 创建采集器
  const collectors = [
    new FDACollector(),
    new EUDAMEDCollector(),
    new NMPACollector(),
  ];

  const allResults = {};

  for (const collector of collectors) {
    try {
      logger.info(`----------------------------------------`);
      logger.info(`开始采集: ${collector.name}`);
      logger.info(`----------------------------------------`);

      const startTime = Date.now();

      // 执行采集
      const result = await collector.collect({
        ppeCategory: 'Category II',
      });

      const duration = (Date.now() - startTime) / 1000;

      logger.info(`采集完成: ${collector.name}`);
      logger.info(`  - 总记录数: ${result.totalRecords}`);
      logger.info(`  - 成功记录: ${result.successRecords}`);
      logger.info(`  - 失败记录: ${result.failedRecords}`);
      logger.info(`  - 耗时: ${duration.toFixed(2)}秒`);

      // 保存结果
      const filepath = saveResults(collector.name, result);
      allResults[collector.name] = {
        ...result,
        savedTo: filepath,
        duration,
      };
    } catch (error) {
      logger.error(`采集失败: ${collector.name}`, error);
      allResults[collector.name] = {
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
