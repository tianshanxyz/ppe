#!/usr/bin/env node

/**
 * MDLooker PPE 数据导入脚本 - 导入到新PPE项目
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 新PPE项目配置
const CONFIG = {
  supabaseUrl: 'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU',
  dataDir: path.join(__dirname, 'collected-data'),
  batchSize: 50,
};

// 初始化Supabase客户端（使用service_role密钥）
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// 日志记录
const logger = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, error) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, error ? error.message || error : ''),
  warn: (msg, data) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
};

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
      issue_date: cert.issueDate ? new Date(cert.issueDate).toISOString() : null,
      expiry_date: cert.expiryDate ? new Date(cert.expiryDate).toISOString() : null,
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
 * 导入数据到Supabase
 */
async function importToSupabase(data) {
  logger.info('开始导入数据到Supabase PPE项目...');

  const results = {
    products: { success: 0, failed: 0, errors: [] },
    manufacturers: { success: 0, failed: 0, errors: [] },
    certifications: { success: 0, failed: 0, errors: [] },
  };

  // 导入产品
  logger.info(`导入 ${data.products.length} 个产品...`);
  for (let i = 0; i < data.products.length; i += CONFIG.batchSize) {
    const batch = data.products.slice(i, i + CONFIG.batchSize);
    try {
      const { data: inserted, error } = await supabase
        .from('ppe_products')
        .upsert(batch, { 
          onConflict: 'source_id,data_source',
          ignoreDuplicates: false 
        });
      
      if (error) {
        logger.error(`产品导入批次失败`, error);
        results.products.failed += batch.length;
        results.products.errors.push(error.message);
      } else {
        results.products.success += batch.length;
        logger.info(`已导入 ${Math.min(i + CONFIG.batchSize, data.products.length)}/${data.products.length} 个产品`);
      }
      
      // 延迟避免请求过快
      await delay(500);
    } catch (error) {
      logger.error(`产品导入异常`, error);
      results.products.failed += batch.length;
    }
  }

  // 导入制造商
  logger.info(`导入 ${data.manufacturers.length} 个制造商...`);
  for (let i = 0; i < data.manufacturers.length; i += CONFIG.batchSize) {
    const batch = data.manufacturers.slice(i, i + CONFIG.batchSize);
    try {
      const { data: inserted, error } = await supabase
        .from('ppe_manufacturers')
        .upsert(batch, { 
          onConflict: 'company_name',
          ignoreDuplicates: false 
        });
      
      if (error) {
        logger.error(`制造商导入批次失败`, error);
        results.manufacturers.failed += batch.length;
        results.manufacturers.errors.push(error.message);
      } else {
        results.manufacturers.success += batch.length;
        logger.info(`已导入 ${Math.min(i + CONFIG.batchSize, data.manufacturers.length)}/${data.manufacturers.length} 个制造商`);
      }
      
      await delay(500);
    } catch (error) {
      logger.error(`制造商导入异常`, error);
      results.manufacturers.failed += batch.length;
    }
  }

  // 导入认证
  logger.info(`导入 ${data.certifications.length} 个认证...`);
  for (let i = 0; i < data.certifications.length; i += CONFIG.batchSize) {
    const batch = data.certifications.slice(i, i + CONFIG.batchSize);
    try {
      const { data: inserted, error } = await supabase
        .from('ppe_certifications')
        .upsert(batch, { 
          onConflict: 'certification_type,certification_number',
          ignoreDuplicates: false 
        });
      
      if (error) {
        logger.error(`认证导入批次失败`, error);
        results.certifications.failed += batch.length;
        results.certifications.errors.push(error.message);
      } else {
        results.certifications.success += batch.length;
        logger.info(`已导入 ${Math.min(i + CONFIG.batchSize, data.certifications.length)}/${data.certifications.length} 个认证`);
      }
      
      await delay(500);
    } catch (error) {
      logger.error(`认证导入异常`, error);
      results.certifications.failed += batch.length;
    }
  }

  logger.info('数据导入完成:', results);
  return results;
}

/**
 * 验证导入结果
 */
async function verifyImport() {
  logger.info('验证导入结果...');
  
  try {
    const { data: products, error: pError } = await supabase
      .from('ppe_products')
      .select('count');
    
    const { data: manufacturers, error: mError } = await supabase
      .from('ppe_manufacturers')
      .select('count');
    
    const { data: certifications, error: cError } = await supabase
      .from('ppe_certifications')
      .select('count');
    
    if (pError || mError || cError) {
      logger.error('验证失败', { pError, mError, cError });
      return;
    }
    
    logger.info('数据库当前数据量:', {
      products: products?.length || 0,
      manufacturers: manufacturers?.length || 0,
      certifications: certifications?.length || 0,
    });
  } catch (error) {
    logger.error('验证异常', error);
  }
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
  logger.info('========================================');
  logger.info('MDLooker PPE 数据导入 - 新PPE项目');
  logger.info('========================================');

  try {
    // 1. 加载数据
    const rawData = loadCollectedData();

    // 2. 清洗数据
    const cleanedData = cleanAndTransform(rawData);

    // 3. 去重
    const dedupedData = deduplicateData(cleanedData);

    // 4. 导入到Supabase
    const importResults = await importToSupabase(dedupedData);

    // 5. 验证导入结果
    await verifyImport();

    logger.info('========================================');
    logger.info('数据导入完成');
    logger.info('========================================');
    logger.info('最终统计:');
    logger.info(`  - 产品: ${importResults.products.success} 成功, ${importResults.products.failed} 失败`);
    logger.info(`  - 制造商: ${importResults.manufacturers.success} 成功, ${importResults.manufacturers.failed} 失败`);
    logger.info(`  - 认证: ${importResults.certifications.success} 成功, ${importResults.certifications.failed} 失败`);

  } catch (error) {
    logger.error('程序执行失败', error);
    process.exit(1);
  }
}

// 执行主函数
main();
