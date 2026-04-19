#!/usr/bin/env node

/**
 * MDLooker PPE 数据SQL导入文件生成器 - 修复外键约束版本
 * 确保制造商和产品的UUID一致
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
 * 数据清洗和转换 - 修复版本
 */
function cleanAndTransform(data) {
  logger.info('开始数据清洗和转换...');

  const cleaned = {
    products: [],
    manufacturers: [],
  };

  // 第一步：收集所有制造商并去重，建立稳定的ID映射
  const manufacturerMap = new Map(); // companyName -> {id, data}
  
  for (const mfg of data.manufacturers) {
    if (!mfg.companyName) continue;
    
    const companyName = cleanString(mfg.companyName);
    if (!manufacturerMap.has(companyName)) {
      const mfgId = generateUUID();
      manufacturerMap.set(companyName, {
        id: mfgId,
        data: {
          id: mfgId,
          name: companyName,
          country: cleanString(mfg.country) || null,
          website: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      });
    }
  }

  // 转换制造商Map为数组
  cleaned.manufacturers = Array.from(manufacturerMap.values()).map(m => m.data);

  // 第二步：处理产品数据，使用相同的制造商ID映射
  const productMap = new Map(); // 用于去重
  
  for (const product of data.products) {
    if (!product.productName || product.productName === 'Unknown') continue;
    
    const productName = cleanString(product.productName);
    const manufacturerName = cleanString(product.manufacturerName);
    const model = cleanString(product.productCode);
    
    // 产品去重键
    const productKey = `${productName}_${model}`;
    if (productMap.has(productKey)) continue;
    
    // 获取制造商ID
    const mfgEntry = manufacturerMap.get(manufacturerName);
    const manufacturerId = mfgEntry ? mfgEntry.id : null;
    
    const productData = {
      id: generateUUID(),
      name: productName,
      model: model,
      category: cleanString(product.category) || '其他防护',
      subcategory: null,
      description: cleanString(product.description) || null,
      manufacturer_id: manufacturerId,
      country_of_origin: cleanString(product.manufacturerCountry) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    productMap.set(productKey, productData);
    cleaned.products.push(productData);
  }

  logger.info('数据清洗完成:', {
    products: cleaned.products.length,
    manufacturers: cleaned.manufacturers.length,
  });

  return cleaned;
}

/**
 * 生成SQL INSERT语句
 */
function generateSQL(data) {
  logger.info('生成SQL导入文件...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sqlFile = path.join(CONFIG.outputDir, `import-ppe-fixed-${timestamp}.sql`);

  let sql = `-- =====================================================\n`;
  sql += `-- MDLooker PPE 数据导入 SQL - 修复外键约束版本\n`;
  sql += `-- 生成时间: ${new Date().toISOString()}\n`;
  sql += `-- 产品数量: ${data.products.length}\n`;
  sql += `-- 制造商数量: ${data.manufacturers.length}\n`;
  sql += `-- =====================================================\n\n`;

  // 生成制造商INSERT语句
  sql += `-- 1. 导入制造商数据 (${data.manufacturers.length}条)\n`;
  sql += `INSERT INTO ppe_manufacturers (id, name, country, website, created_at, updated_at) VALUES\n`;
  
  const mfgValues = data.manufacturers.map((m, i) => {
    return `  ('${m.id}', ${escapeSQL(m.name)}, ${escapeSQL(m.country)}, ${escapeSQL(m.website)}, '${m.created_at}', '${m.updated_at}')${i < data.manufacturers.length - 1 ? ',' : ';'}`;
  });
  sql += mfgValues.join('\n');
  sql += '\n\n';

  // 生成产品INSERT语句
  sql += `-- 2. 导入产品数据 (${data.products.length}条)\n`;
  sql += `INSERT INTO ppe_products (id, name, model, category, subcategory, description, manufacturer_id, country_of_origin, created_at, updated_at) VALUES\n`;
  
  const productValues = data.products.map((p, i) => {
    const mfgId = p.manufacturer_id ? `'${p.manufacturer_id}'` : 'NULL';
    return `  ('${p.id}', ${escapeSQL(p.name)}, ${escapeSQL(p.model)}, ${escapeSQL(p.category)}, ${escapeSQL(p.subcategory)}, ${escapeSQL(p.description)}, ${mfgId}, ${escapeSQL(p.country_of_origin)}, '${p.created_at}', '${p.updated_at}')${i < data.products.length - 1 ? ',' : ';'}`;
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
  logger.info('MDLooker PPE SQL导入文件生成器 - 修复版本');
  logger.info('========================================');

  try {
    // 1. 加载数据
    const rawData = loadCollectedData();

    // 2. 清洗数据（包含去重）
    const cleanedData = cleanAndTransform(rawData);

    // 3. 生成SQL文件
    const sqlFile = generateSQL(cleanedData);

    logger.info('========================================');
    logger.info('导入文件生成完成');
    logger.info('========================================');
    logger.info('生成的文件:');
    logger.info(`  - SQL文件: ${sqlFile}`);
    logger.info('');
    logger.info('数据量:');
    logger.info(`  - 制造商: ${cleanedData.manufacturers.length}`);
    logger.info(`  - 产品: ${cleanedData.products.length}`);

  } catch (error) {
    logger.error('程序执行失败', error);
    process.exit(1);
  }
}

// 执行主函数
main();
