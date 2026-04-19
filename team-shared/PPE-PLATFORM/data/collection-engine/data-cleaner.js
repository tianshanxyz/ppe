#!/usr/bin/env node

/**
 * MDLooker PPE 数据清洗与导入脚本
 * 功能：数据清洗、去重、标准化、导入Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 配置
const CONFIG = {
  supabaseUrl: 'https://tiosujipxpvivdjmwtfa.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb3N1amlweHB2aXZkam13dGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDQ3MDEsImV4cCI6MjA4NTQ4MDcwMX0.u6_dYapbthkcTppJWONF91W6-MLMBR4DqymQXAxEyTQ',
  dataDir: path.join(__dirname, 'collected-data'),
  batchSize: 100,
};

// 初始化Supabase客户端
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
    .filter(f => f.endsWith('.json') && !f.includes('collection-report'))
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
 * 数据清洗：去除空值、标准化字段
 */
function cleanData(data) {
  logger.info('开始数据清洗...');

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
      created_at: product.createdAt || new Date().toISOString(),
      updated_at: product.updatedAt || new Date().toISOString(),
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
      created_at: mfg.createdAt || new Date().toISOString(),
      updated_at: mfg.updatedAt || new Date().toISOString(),
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
      issue_date: cert.issueDate || null,
      expiry_date: cert.expiryDate || null,
      data_source: cert.dataSource || 'Unknown',
      source_id: cleanString(cert.sourceId) || null,
      created_at: cert.createdAt || new Date().toISOString(),
      updated_at: cert.updatedAt || new Date().toISOString(),
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

  // 制造商去重（基于company_name + country）
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
 * 数据标准化
 */
function standardizeData(data) {
  logger.info('开始数据标准化...');

  // 标准化国家名称
  const countryMapping = {
    'USA': 'United States',
    'US': 'United States',
    'UK': 'United Kingdom',
    'EU': 'European Union',
    'CN': 'China',
    'JP': 'Japan',
    'AU': 'Australia',
    'CA': 'Canada',
    'China': 'China',
    'Germany': 'Germany',
    'France': 'France',
    'Japan': 'Japan',
    'Australia': 'Australia',
    'Canada': 'Canada',
    'Belgium': 'Belgium',
  };

  // 标准化产品分类
  const categoryMapping = {
    '呼吸防护': 'Respiratory Protection',
    '身体防护': 'Body Protection',
    '手部防护': 'Hand Protection',
    '眼面防护': 'Eye & Face Protection',
    '其他防护': 'Other Protection',
  };

  for (const product of data.products) {
    // 标准化国家
    if (product.manufacturer_country && countryMapping[product.manufacturer_country]) {
      product.manufacturer_country = countryMapping[product.manufacturer_country];
    }
    
    // 标准化分类
    if (product.category && categoryMapping[product.category]) {
      product.category_en = categoryMapping[product.category];
    }
  }

  for (const mfg of data.manufacturers) {
    if (mfg.country && countryMapping[mfg.country]) {
      mfg.country = countryMapping[mfg.country];
    }
  }

  logger.info('数据标准化完成');
  return data;
}

/**
 * 生成质量报告
 */
function generateQualityReport(data) {
  logger.info('生成数据质量报告...');

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts: data.products.length,
      totalManufacturers: data.manufacturers.length,
      totalCertifications: data.certifications.length,
    },
    dataQuality: {
      products: analyzeProductQuality(data.products),
      manufacturers: analyzeManufacturerQuality(data.manufacturers),
      certifications: analyzeCertificationQuality(data.certifications),
    },
    dataSourceDistribution: analyzeSourceDistribution(data),
    categoryDistribution: analyzeCategoryDistribution(data.products),
    countryDistribution: analyzeCountryDistribution(data),
  };

  const reportPath = path.join(CONFIG.dataDir, `quality-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logger.info(`质量报告已保存: ${reportPath}`);

  return report;
}

/**
 * 导入数据到Supabase
 */
async function importToSupabase(data) {
  logger.info('开始导入数据到Supabase...');

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
      const { error } = await supabase
        .from('ppe_products')
        .upsert(batch, { onConflict: 'source_id,data_source' });
      
      if (error) {
        logger.error(`产品导入批次失败`, error);
        results.products.failed += batch.length;
        results.products.errors.push(error.message);
      } else {
        results.products.success += batch.length;
        logger.info(`已导入 ${Math.min(i + CONFIG.batchSize, data.products.length)}/${data.products.length} 个产品`);
      }
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
      const { error } = await supabase
        .from('ppe_manufacturers')
        .upsert(batch, { onConflict: 'company_name,country' });
      
      if (error) {
        logger.error(`制造商导入批次失败`, error);
        results.manufacturers.failed += batch.length;
        results.manufacturers.errors.push(error.message);
      } else {
        results.manufacturers.success += batch.length;
        logger.info(`已导入 ${Math.min(i + CONFIG.batchSize, data.manufacturers.length)}/${data.manufacturers.length} 个制造商`);
      }
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
      const { error } = await supabase
        .from('ppe_certifications')
        .upsert(batch, { onConflict: 'certification_type,certification_number' });
      
      if (error) {
        logger.error(`认证导入批次失败`, error);
        results.certifications.failed += batch.length;
        results.certifications.errors.push(error.message);
      } else {
        results.certifications.success += batch.length;
        logger.info(`已导入 ${Math.min(i + CONFIG.batchSize, data.certifications.length)}/${data.certifications.length} 个认证`);
      }
    } catch (error) {
      logger.error(`认证导入异常`, error);
      results.certifications.failed += batch.length;
    }
  }

  logger.info('数据导入完成:', results);
  return results;
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

function analyzeProductQuality(products) {
  const fields = ['product_name', 'category', 'manufacturer_name', 'data_source'];
  const quality = {};
  
  for (const field of fields) {
    const filled = products.filter(p => p[field] && p[field] !== 'Unknown').length;
    quality[field] = {
      filled: filled,
      total: products.length,
      rate: Math.round((filled / products.length) * 100) + '%',
    };
  }
  
  return quality;
}

function analyzeManufacturerQuality(manufacturers) {
  const filled = manufacturers.filter(m => m.company_name).length;
  return {
    filled: filled,
    total: manufacturers.length,
    rate: Math.round((filled / manufacturers.length) * 100) + '%',
  };
}

function analyzeCertificationQuality(certifications) {
  const filled = certifications.filter(c => c.certification_number).length;
  return {
    filled: filled,
    total: certifications.length,
    rate: Math.round((filled / certifications.length) * 100) + '%',
  };
}

function analyzeSourceDistribution(data) {
  const distribution = {};
  
  for (const product of data.products) {
    const source = product.data_source || 'Unknown';
    distribution[source] = (distribution[source] || 0) + 1;
  }
  
  return distribution;
}

function analyzeCategoryDistribution(products) {
  const distribution = {};
  
  for (const product of products) {
    const category = product.category || 'Unknown';
    distribution[category] = (distribution[category] || 0) + 1;
  }
  
  return distribution;
}

function analyzeCountryDistribution(data) {
  const distribution = {};
  
  for (const product of data.products) {
    const country = product.manufacturer_country || 'Unknown';
    distribution[country] = (distribution[country] || 0) + 1;
  }
  
  return distribution;
}

/**
 * 主函数
 */
async function main() {
  logger.info('========================================');
  logger.info('MDLooker PPE 数据清洗与导入');
  logger.info('========================================');

  try {
    // 1. 加载数据
    const rawData = loadCollectedData();

    // 2. 清洗数据
    const cleanedData = cleanData(rawData);

    // 3. 去重
    const dedupedData = deduplicateData(cleanedData);

    // 4. 标准化
    const standardizedData = standardizeData(dedupedData);

    // 5. 生成质量报告
    const qualityReport = generateQualityReport(standardizedData);

    // 6. 导入到Supabase
    const importResults = await importToSupabase(standardizedData);

    logger.info('========================================');
    logger.info('数据清洗与导入完成');
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
