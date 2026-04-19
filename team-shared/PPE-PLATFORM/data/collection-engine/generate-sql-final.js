#!/usr/bin/env node

/**
 * MDLooker PPE 数据SQL导入文件生成器 - 最终版本
 * 匹配新PPE项目的实际表结构
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  dataDir: path.join(__dirname, 'collected-data'),
  outputDir: path.join(__dirname, 'sql-import'),
};

// 日志记录
const logger = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, error) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, error ? error.message || error : ''),
};

// 确保输出目录存在
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * 读取所有采集的数据文件
 */
function loadCollectedData() {
  logger.info('加载采集的数据文件...');
  
  const files = fs.readdirSync(CONFIG.dataDir)
    .filter(f => f.endsWith('.json') && !f.includes('collection-report') && !f.includes('quality-report'))
    .map(f => path.join(CONFIG.dataDir, f));

  const allData = {
    products: [],
    manufacturers: [],
    certifications: [],
  };

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (content.result) {
        allData.products.push(...(content.result.products || []));
        allData.manufacturers.push(...(content.result.manufacturers || []));
        allData.certifications.push(...(content.result.certifications || []));
      }
      logger.info(`已加载: ${path.basename(file)}`);
    } catch (error) {
      logger.error(`加载文件失败: ${file}`, error);
    }
  }

  logger.info(`原始数据加载完成:`, {
    products: allData.products.length,
    manufacturers: allData.manufacturers.length,
    certifications: allData.certifications.length,
  });

  return allData;
}

/**
 * 数据清洗和转换 - 匹配实际表结构
 */
function cleanAndTransform(data) {
  logger.info('开始数据清洗和转换...');

  const cleaned = {
    products: [],
    manufacturers: [],
    certifications: [],
  };

  // 先处理制造商数据，建立ID映射
  const manufacturerMap = new Map();
  
  for (const mfg of data.manufacturers) {
    if (!mfg.companyName) continue;
    
    const mfgId = generateUUID();
    manufacturerMap.set(mfg.companyName, mfgId);
    
    cleaned.manufacturers.push({
      id: mfgId,
      name: cleanString(mfg.companyName),
      country: cleanString(mfg.country) || null,
      website: null, // 表中有此字段但无数据
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 清洗产品数据 - 实际表结构
  for (const product of data.products) {
    if (!product.productName || product.productName === 'Unknown') continue;
    
    const manufacturerId = manufacturerMap.get(product.manufacturerName) || null;
    
    cleaned.products.push({
      id: generateUUID(),
      name: cleanString(product.productName),
      model: cleanString(product.productCode) || null,
      category: cleanString(product.category) || '其他防护',
      subcategory: null, // 表中有此字段
      description: cleanString(product.description) || null,
      manufacturer_id: manufacturerId,
      country_of_origin: cleanString(product.manufacturerCountry) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  logger.info('数据清洗完成:', {
    products: cleaned.products.length,
    manufacturers: cleaned.manufacturers.length,
    certifications: cleaned.certifications.length,
  });

  return cleaned;
}

/**
 * 数据去重
 */
function deduplicateData(data) {
  logger.info('开始数据去重...');

  const deduped = {
    products: [],
    manufacturers: [],
    certifications: [],
  };

  // 产品去重（基于name + model）
  const productMap = new Map();
  for (const product of data.products) {
    const key = `${product.name}_${product.model}`;
    if (!productMap.has(key)) {
      productMap.set(key, product);
    }
  }
  deduped.products = Array.from(productMap.values());

  // 制造商去重（基于name）
  const mfgMap = new Map();
  for (const mfg of data.manufacturers) {
    const key = mfg.name;
    if (!mfgMap.has(key)) {
      mfgMap.set(key, mfg);
    }
  }
  deduped.manufacturers = Array.from(mfgMap.values());

  logger.info('数据去重完成:', {
    products: deduped.products.length,
    manufacturers: deduped.manufacturers.length,
    certifications: deduped.certifications.length,
  });

  return deduped;
}

/**
 * 生成SQL INSERT语句 - 实际表结构
 */
function generateSQL(data) {
  logger.info('生成SQL导入文件...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sqlFile = path.join(CONFIG.outputDir, `import-ppe-final-${timestamp}.sql`);

  let sql = `-- =====================================================\n`;
  sql += `-- MDLooker PPE 数据导入 SQL - 最终版本\n`;
  sql += `-- 生成时间: ${new Date().toISOString()}\n`;
  sql += `-- 产品数量: ${data.products.length}\n`;
  sql += `-- 制造商数量: ${data.manufacturers.length}\n`;
  sql += `-- 注意: ppe_certifications表不存在，跳过认证数据\n`;
  sql += `-- =====================================================\n\n`;

  // 生成制造商INSERT语句 - 先插入制造商，因为产品需要引用
  sql += `-- 1. 导入制造商数据 (${data.manufacturers.length}条)\n`;
  sql += `INSERT INTO ppe_manufacturers (id, name, country, website, created_at, updated_at) VALUES\n`;
  
  const mfgValues = data.manufacturers.map((m, i) => {
    return `  ('${m.id}', ${escapeSQL(m.name)}, ${escapeSQL(m.country)}, ${escapeSQL(m.website)}, '${m.created_at}', '${m.updated_at}')${i < data.manufacturers.length - 1 ? ',' : ';'}`;
  });
  sql += mfgValues.join('\n');
  sql += '\n\n';

  // 生成产品INSERT语句 - 实际表结构
  sql += `-- 2. 导入产品数据 (${data.products.length}条)\n`;
  sql += `INSERT INTO ppe_products (id, name, model, category, subcategory, description, manufacturer_id, country_of_origin, created_at, updated_at) VALUES\n`;
  
  const productValues = data.products.map((p, i) => {
    return `  ('${p.id}', ${escapeSQL(p.name)}, ${escapeSQL(p.model)}, ${escapeSQL(p.category)}, ${escapeSQL(p.subcategory)}, ${escapeSQL(p.description)}, ${p.manufacturer_id ? `'${p.manufacturer_id}'` : 'NULL'}, ${escapeSQL(p.country_of_origin)}, '${p.created_at}', '${p.updated_at}')${i < data.products.length - 1 ? ',' : ';'}`;
  });
  sql += productValues.join('\n');
  sql += '\n';

  fs.writeFileSync(sqlFile, sql);
  logger.info(`SQL文件已生成: ${sqlFile}`);
  
  return sqlFile;
}

// 辅助函数
function cleanString(str) {
  if (!str) return null;
  return str.trim().replace(/\s+/g, ' ').substring(0, 500);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * 主函数
 */
async function main() {
  logger.info('========================================');
  logger.info('MDLooker PPE SQL导入文件生成器 - 最终版本');
  logger.info('========================================');

  try {
    // 1. 加载数据
    const rawData = loadCollectedData();

    // 2. 清洗数据
    const cleanedData = cleanAndTransform(rawData);

    // 3. 去重
    const dedupedData = deduplicateData(cleanedData);

    // 4. 生成SQL文件
    const sqlFile = generateSQL(dedupedData);

    logger.info('========================================');
    logger.info('导入文件生成完成');
    logger.info('========================================');
    logger.info('生成的文件:');
    logger.info(`  - SQL文件: ${sqlFile}`);
    logger.info('');
    logger.info('数据量:');
    logger.info(`  - 制造商: ${dedupedData.manufacturers.length}`);
    logger.info(`  - 产品: ${dedupedData.products.length}`);
    logger.info('');
    logger.info('注意: ppe_certifications表在新项目中不存在，认证数据已跳过');

  } catch (error) {
    logger.error('程序执行失败', error);
    process.exit(1);
  }
}

// 执行主函数
main();
