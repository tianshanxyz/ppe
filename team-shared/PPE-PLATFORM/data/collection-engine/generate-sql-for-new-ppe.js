#!/usr/bin/env node

/**
 * MDLooker PPE 数据SQL导入文件生成器 - 新PPE项目版本
 * 匹配新PPE项目的简化表结构
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
 * 数据清洗和转换 - 匹配新PPE项目结构
 */
function cleanAndTransform(data) {
  logger.info('开始数据清洗和转换...');

  const cleaned = {
    products: [],
    manufacturers: [],
    certifications: [],
  };

  // 清洗产品数据 - 新PPE项目结构
  for (const product of data.products) {
    if (!product.productName || product.productName === 'Unknown') continue;
    
    cleaned.products.push({
      id: generateUUID(),
      name: cleanString(product.productName),
      manufacturer: cleanString(product.manufacturerName) || null,
      model: cleanString(product.productCode) || null,
      category: cleanString(product.category) || '其他防护',
      certification: null, // 将在关联表中处理
      country: cleanString(product.manufacturerCountry) || null,
      description: cleanString(product.description) || null,
      metadata: JSON.stringify({
        ppe_category: product.ppeCategory || determinePPECategory(product.productName, product.description),
        data_source: product.dataSource || 'Unknown',
        source_id: product.sourceId || null,
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 清洗制造商数据 - 新PPE项目结构
  for (const mfg of data.manufacturers) {
    if (!mfg.companyName) continue;
    
    cleaned.manufacturers.push({
      id: generateUUID(),
      name: cleanString(mfg.companyName),
      country: cleanString(mfg.country) || null,
      contact_info: JSON.stringify({
        data_source: mfg.dataSource || 'Unknown',
        source_id: mfg.sourceId || null,
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 清洗认证数据 - 新PPE项目结构
  for (const cert of data.certifications) {
    cleaned.certifications.push({
      id: generateUUID(),
      name: `${cert.certificationType || 'Unknown'} - ${cert.certificationNumber || 'N/A'}`,
      body: cleanString(cert.certBodyName) || null,
      type: cert.certificationType || 'Unknown',
      standard: cleanString(cert.standardCode) || null,
      valid_from: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : null,
      valid_until: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : null,
      status: cert.status || 'unknown',
      metadata: JSON.stringify({
        certification_number: cert.certificationNumber || null,
        data_source: cert.dataSource || 'Unknown',
        source_id: cert.sourceId || null,
      }),
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

  // 产品去重（基于name + manufacturer）
  const productMap = new Map();
  for (const product of data.products) {
    const key = `${product.name}_${product.manufacturer}`;
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

  // 认证去重（基于name）
  const certMap = new Map();
  for (const cert of data.certifications) {
    const key = cert.name;
    if (!certMap.has(key)) {
      certMap.set(key, cert);
    }
  }
  deduped.certifications = Array.from(certMap.values());

  logger.info('数据去重完成:', {
    products: deduped.products.length,
    manufacturers: deduped.manufacturers.length,
    certifications: deduped.certifications.length,
  });

  return deduped;
}

/**
 * 生成SQL INSERT语句 - 新PPE项目结构
 */
function generateSQL(data) {
  logger.info('生成SQL导入文件...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sqlFile = path.join(CONFIG.outputDir, `import-ppe-data-new-${timestamp}.sql`);

  let sql = `-- =====================================================\n`;
  sql += `-- MDLooker PPE 数据导入 SQL - 新PPE项目版本\n`;
  sql += `-- 生成时间: ${new Date().toISOString()}\n`;
  sql += `-- 产品数量: ${data.products.length}\n`;
  sql += `-- 制造商数量: ${data.manufacturers.length}\n`;
  sql += `-- 认证数量: ${data.certifications.length}\n`;
  sql += `-- =====================================================\n\n`;

  // 生成产品INSERT语句 - 新PPE项目表结构
  sql += `-- 1. 导入产品数据 (${data.products.length}条)\n`;
  sql += `INSERT INTO ppe_products (id, name, manufacturer, model, category, certification, country, description, metadata, created_at, updated_at) VALUES\n`;
  
  const productValues = data.products.map((p, i) => {
    return `  ('${p.id}', ${escapeSQL(p.name)}, ${escapeSQL(p.manufacturer)}, ${escapeSQL(p.model)}, ${escapeSQL(p.category)}, ${escapeSQL(p.certification)}, ${escapeSQL(p.country)}, ${escapeSQL(p.description)}, ${escapeSQL(p.metadata)}, '${p.created_at}', '${p.updated_at}')${i < data.products.length - 1 ? ',' : ';'}`;
  });
  sql += productValues.join('\n');
  sql += '\n\n';

  // 生成制造商INSERT语句 - 新PPE项目表结构
  sql += `-- 2. 导入制造商数据 (${data.manufacturers.length}条)\n`;
  sql += `INSERT INTO ppe_manufacturers (id, name, country, contact_info, created_at, updated_at) VALUES\n`;
  
  const mfgValues = data.manufacturers.map((m, i) => {
    return `  ('${m.id}', ${escapeSQL(m.name)}, ${escapeSQL(m.country)}, ${escapeSQL(m.contact_info)}, '${m.created_at}', '${m.updated_at}')${i < data.manufacturers.length - 1 ? ',' : ';'}`;
  });
  sql += mfgValues.join('\n');
  sql += '\n\n';

  // 生成认证INSERT语句 - 新PPE项目表结构
  sql += `-- 3. 导入认证数据 (${data.certifications.length}条)\n`;
  sql += `INSERT INTO ppe_certifications (id, name, body, type, standard, valid_from, valid_until, status, metadata, created_at, updated_at) VALUES\n`;
  
  const certValues = data.certifications.map((c, i) => {
    return `  ('${c.id}', ${escapeSQL(c.name)}, ${escapeSQL(c.body)}, ${escapeSQL(c.type)}, ${escapeSQL(c.standard)}, ${escapeSQL(c.valid_from)}, ${escapeSQL(c.valid_until)}, ${escapeSQL(c.status)}, ${escapeSQL(c.metadata)}, '${c.created_at}', '${c.updated_at}')${i < data.certifications.length - 1 ? ',' : ';'}`;
  });
  sql += certValues.join('\n');
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

function determinePPECategory(productName, description) {
  const text = ((productName || '') + ' ' + (description || '')).toLowerCase();
  
  if (text.includes('n95') || text.includes('kn95') || text.includes('ffp3') || text.includes('respirator')) {
    return 'III';
  }
  if (text.includes('ffp2') || text.includes('surgical') || text.includes('medical')) {
    return 'II';
  }
  if (text.includes('mask') || text.includes('glove') || text.includes('gown')) {
    return 'I';
  }
  
  return 'II';
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
  logger.info('MDLooker PPE SQL导入文件生成器 - 新PPE项目');
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
    logger.info(`  - 产品: ${dedupedData.products.length}`);
    logger.info(`  - 制造商: ${dedupedData.manufacturers.length}`);
    logger.info(`  - 认证: ${dedupedData.certifications.length}`);

  } catch (error) {
    logger.error('程序执行失败', error);
    process.exit(1);
  }
}

// 执行主函数
main();
