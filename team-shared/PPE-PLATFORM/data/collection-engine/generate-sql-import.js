#!/usr/bin/env node

/**
 * MDLooker PPE 数据SQL导入文件生成器
 * 生成INSERT语句用于直接导入数据库
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
 * 数据清洗和转换
 */
function cleanAndTransform(data) {
  logger.info('开始数据清洗和转换...');

  const cleaned = {
    products: [],
    manufacturers: [],
    certifications: [],
  };

  // 清洗产品数据
  for (const product of data.products) {
    if (!product.productName || product.productName === 'Unknown') continue;
    
    cleaned.products.push({
      id: generateUUID(),
      product_name: cleanString(product.productName),
      product_name_en: cleanString(product.productNameEn) || null,
      product_name_local: cleanString(product.productNameLocal) || null,
      product_code: cleanString(product.productCode) || null,
      category: cleanString(product.category) || '其他防护',
      ppe_category: product.ppeCategory || determinePPECategory(product.productName, product.description),
      description: cleanString(product.description) || null,
      manufacturer_name: cleanString(product.manufacturerName) || null,
      manufacturer_country: cleanString(product.manufacturerCountry) || null,
      data_source: product.dataSource || 'Unknown',
      source_id: cleanString(product.sourceId) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    });
  }

  // 清洗制造商数据
  for (const mfg of data.manufacturers) {
    if (!mfg.companyName) continue;
    
    cleaned.manufacturers.push({
      id: generateUUID(),
      company_name: cleanString(mfg.companyName),
      country: cleanString(mfg.country) || null,
      data_source: mfg.dataSource || 'Unknown',
      source_id: cleanString(mfg.sourceId) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    });
  }

  // 清洗认证数据
  for (const cert of data.certifications) {
    cleaned.certifications.push({
      id: generateUUID(),
      certification_type: cert.certificationType || 'Unknown',
      certification_number: cleanString(cert.certificationNumber) || null,
      standard_code: cleanString(cert.standardCode) || null,
      cert_body_name: cleanString(cert.certBodyName) || null,
      status: cert.status || 'unknown',
      issue_date: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : null,
      expiry_date: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : null,
      data_source: cert.dataSource || 'Unknown',
      source_id: cleanString(cert.sourceId) || null,
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

  // 产品去重（基于source_id + data_source）
  const productMap = new Map();
  for (const product of data.products) {
    const key = `${product.data_source}_${product.source_id}`;
    if (!productMap.has(key)) {
      productMap.set(key, product);
    }
  }
  deduped.products = Array.from(productMap.values());

  // 制造商去重（基于company_name）
  const mfgMap = new Map();
  for (const mfg of data.manufacturers) {
    const key = `${mfg.company_name}_${mfg.country}`;
    if (!mfgMap.has(key)) {
      mfgMap.set(key, mfg);
    }
  }
  deduped.manufacturers = Array.from(mfgMap.values());

  // 认证去重（基于certification_number + certification_type）
  const certMap = new Map();
  for (const cert of data.certifications) {
    const key = `${cert.certification_type}_${cert.certification_number}`;
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
 * 生成SQL INSERT语句
 */
function generateSQL(data) {
  logger.info('生成SQL导入文件...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sqlFile = path.join(CONFIG.outputDir, `import-ppe-data-${timestamp}.sql`);

  let sql = `-- =====================================================\n`;
  sql += `-- MDLooker PPE 数据导入 SQL\n`;
  sql += `-- 生成时间: ${new Date().toISOString()}\n`;
  sql += `-- 产品数量: ${data.products.length}\n`;
  sql += `-- 制造商数量: ${data.manufacturers.length}\n`;
  sql += `-- 认证数量: ${data.certifications.length}\n`;
  sql += `-- =====================================================\n\n`;

  // 生成产品INSERT语句
  sql += `-- 1. 导入产品数据 (${data.products.length}条)\n`;
  sql += `INSERT INTO ppe_products (id, product_name, product_name_en, product_name_local, product_code, category, ppe_category, description, manufacturer_name, manufacturer_country, data_source, source_id, created_at, updated_at, is_active) VALUES\n`;
  
  const productValues = data.products.map((p, i) => {
    return `  ('${p.id}', ${escapeSQL(p.product_name)}, ${escapeSQL(p.product_name_en)}, ${escapeSQL(p.product_name_local)}, ${escapeSQL(p.product_code)}, ${escapeSQL(p.category)}, ${escapeSQL(p.ppe_category)}, ${escapeSQL(p.description)}, ${escapeSQL(p.manufacturer_name)}, ${escapeSQL(p.manufacturer_country)}, ${escapeSQL(p.data_source)}, ${escapeSQL(p.source_id)}, '${p.created_at}', '${p.updated_at}', ${p.is_active})${i < data.products.length - 1 ? ',' : ';'}`;
  });
  sql += productValues.join('\n');
  sql += '\n\n';

  // 生成制造商INSERT语句
  sql += `-- 2. 导入制造商数据 (${data.manufacturers.length}条)\n`;
  sql += `INSERT INTO ppe_manufacturers (id, company_name, country, data_source, source_id, created_at, updated_at, is_active) VALUES\n`;
  
  const mfgValues = data.manufacturers.map((m, i) => {
    return `  ('${m.id}', ${escapeSQL(m.company_name)}, ${escapeSQL(m.country)}, ${escapeSQL(m.data_source)}, ${escapeSQL(m.source_id)}, '${m.created_at}', '${m.updated_at}', ${m.is_active})${i < data.manufacturers.length - 1 ? ',' : ';'}`;
  });
  sql += mfgValues.join('\n');
  sql += '\n\n';

  // 生成认证INSERT语句
  sql += `-- 3. 导入认证数据 (${data.certifications.length}条)\n`;
  sql += `INSERT INTO ppe_certifications (id, certification_type, certification_number, standard_code, cert_body_name, status, issue_date, expiry_date, data_source, source_id, created_at, updated_at) VALUES\n`;
  
  const certValues = data.certifications.map((c, i) => {
    return `  ('${c.id}', ${escapeSQL(c.certification_type)}, ${escapeSQL(c.certification_number)}, ${escapeSQL(c.standard_code)}, ${escapeSQL(c.cert_body_name)}, ${escapeSQL(c.status)}, ${escapeSQL(c.issue_date)}, ${escapeSQL(c.expiry_date)}, ${escapeSQL(c.data_source)}, ${escapeSQL(c.source_id)}, '${c.created_at}', '${c.updated_at}')${i < data.certifications.length - 1 ? ',' : ';'}`;
  });
  sql += certValues.join('\n');
  sql += '\n';

  fs.writeFileSync(sqlFile, sql);
  logger.info(`SQL文件已生成: ${sqlFile}`);
  
  return sqlFile;
}

/**
 * 生成CSV文件
 */
function generateCSV(data) {
  logger.info('生成CSV导入文件...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 产品CSV
  const productsCSV = generateProductsCSV(data.products);
  const productsFile = path.join(CONFIG.outputDir, `products-${timestamp}.csv`);
  fs.writeFileSync(productsFile, productsCSV);
  logger.info(`产品CSV已生成: ${productsFile}`);

  // 制造商CSV
  const manufacturersCSV = generateManufacturersCSV(data.manufacturers);
  const manufacturersFile = path.join(CONFIG.outputDir, `manufacturers-${timestamp}.csv`);
  fs.writeFileSync(manufacturersFile, manufacturersCSV);
  logger.info(`制造商CSV已生成: ${manufacturersFile}`);

  // 认证CSV
  const certificationsCSV = generateCertificationsCSV(data.certifications);
  const certificationsFile = path.join(CONFIG.outputDir, `certifications-${timestamp}.csv`);
  fs.writeFileSync(certificationsFile, certificationsCSV);
  logger.info(`认证CSV已生成: ${certificationsFile}`);

  return { productsFile, manufacturersFile, certificationsFile };
}

function generateProductsCSV(products) {
  const headers = ['id', 'product_name', 'product_name_en', 'product_name_local', 'product_code', 'category', 'ppe_category', 'description', 'manufacturer_name', 'manufacturer_country', 'data_source', 'source_id', 'created_at', 'updated_at', 'is_active'];
  
  let csv = headers.join(',') + '\n';
  
  for (const p of products) {
    const row = [
      p.id,
      escapeCSV(p.product_name),
      escapeCSV(p.product_name_en),
      escapeCSV(p.product_name_local),
      escapeCSV(p.product_code),
      escapeCSV(p.category),
      escapeCSV(p.ppe_category),
      escapeCSV(p.description),
      escapeCSV(p.manufacturer_name),
      escapeCSV(p.manufacturer_country),
      escapeCSV(p.data_source),
      escapeCSV(p.source_id),
      p.created_at,
      p.updated_at,
      p.is_active,
    ];
    csv += row.join(',') + '\n';
  }
  
  return csv;
}

function generateManufacturersCSV(manufacturers) {
  const headers = ['id', 'company_name', 'country', 'data_source', 'source_id', 'created_at', 'updated_at', 'is_active'];
  
  let csv = headers.join(',') + '\n';
  
  for (const m of manufacturers) {
    const row = [
      m.id,
      escapeCSV(m.company_name),
      escapeCSV(m.country),
      escapeCSV(m.data_source),
      escapeCSV(m.source_id),
      m.created_at,
      m.updated_at,
      m.is_active,
    ];
    csv += row.join(',') + '\n';
  }
  
  return csv;
}

function generateCertificationsCSV(certifications) {
  const headers = ['id', 'certification_type', 'certification_number', 'standard_code', 'cert_body_name', 'status', 'issue_date', 'expiry_date', 'data_source', 'source_id', 'created_at', 'updated_at'];
  
  let csv = headers.join(',') + '\n';
  
  for (const c of certifications) {
    const row = [
      c.id,
      escapeCSV(c.certification_type),
      escapeCSV(c.certification_number),
      escapeCSV(c.standard_code),
      escapeCSV(c.cert_body_name),
      escapeCSV(c.status),
      escapeCSV(c.issue_date),
      escapeCSV(c.expiry_date),
      escapeCSV(c.data_source),
      escapeCSV(c.source_id),
      c.created_at,
      c.updated_at,
    ];
    csv += row.join(',') + '\n';
  }
  
  return csv;
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

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 主函数
 */
async function main() {
  logger.info('========================================');
  logger.info('MDLooker PPE SQL/CSV导入文件生成器');
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

    // 5. 生成CSV文件
    const csvFiles = generateCSV(dedupedData);

    logger.info('========================================');
    logger.info('导入文件生成完成');
    logger.info('========================================');
    logger.info('生成的文件:');
    logger.info(`  - SQL文件: ${sqlFile}`);
    logger.info(`  - 产品CSV: ${csvFiles.productsFile}`);
    logger.info(`  - 制造商CSV: ${csvFiles.manufacturersFile}`);
    logger.info(`  - 认证CSV: ${csvFiles.certificationsFile}`);
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
