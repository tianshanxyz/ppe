#!/usr/bin/env node
/**
 * NMPA UDID PPE数据提取脚本
 * 从UDID_FULL_RELEASE XML文件中提取PPE相关产品数据
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parseString } = require('xml2js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// UDID数据目录
const UDID_DIR = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/UDID_FULL_RELEASE_20260501';

// PPE相关分类代码
const PPE_CATEGORY_CODES = [
  '14-14-01', // 医用口罩
  '14-14-02', // 医用防护服
  '14-14-03', // 医用隔离衣
  '14-14-04', // 医用手术衣
  '14-14-05', // 医用帽
  '14-14-06', // 医用鞋套
  '14-14-07', // 医用手套
  '14-13-04', // 外科口罩
  '14-13-05', // 外科手套
  '14-13-06', // 检查手套
];

// PPE关键词
const PPE_KEYWORDS = [
  '口罩', '手套', '防护服', '隔离衣', '手术衣', '防护面屏', '护目镜',
  '防护帽', '防护鞋', '鞋套', '头套', '面罩', '呼吸器', '防毒面具',
  '防尘', 'N95', 'KN95', 'FFP', '医用防护', '外科口罩', '检查手套',
  '外科手套', '医用手套', '防护眼镜', '防护面罩', '安全帽'
];

// 分类映射
function getCategoryFromName(name) {
  const n = (name || '').toLowerCase();
  if (/口罩|呼吸|N95|KN95|FFP|防毒|防尘|面罩/i.test(n)) return '呼吸防护装备';
  if (/手套/i.test(n)) return '手部防护装备';
  if (/护目镜|眼镜|面屏|眼/i.test(n)) return '眼面部防护装备';
  if (/安全帽|防护帽|头套/i.test(n)) return '头部防护装备';
  if (/耳塞|耳罩/i.test(n)) return '听觉防护装备';
  if (/防护鞋|鞋套/i.test(n)) return '足部防护装备';
  if (/防护服|隔离衣|手术衣/i.test(n)) return '身体防护装备';
  return '其他';
}

function getRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/N95|KN95|FFP|防毒|呼吸器|防护服/i.test(n)) return 'high';
  if (/口罩|手套|护目镜|安全帽/i.test(n)) return 'medium';
  return 'low';
}

// 提取设备数据
function extractDeviceData(device) {
  const name = device.cpmctymc?.[0] || '';
  const categoryCode = device.flbm?.[0] || '';
  
  // 检查是否是PPE产品
  const isPPEByCode = PPE_CATEGORY_CODES.includes(categoryCode);
  const isPPEByKeyword = PPE_KEYWORDS.some(kw => name.includes(kw));
  
  if (!isPPEByCode && !isPPEByKeyword) {
    return null;
  }

  const regNumber = device.zczbhhzbapzbh?.[0] || '';
  const manufacturer = device.ylqxzcrbarmc?.[0] || '';
  const manufacturerEn = device.ylqxzcrbarywmc?.[0] || '';
  
  return {
    name: name.substring(0, 500),
    model: device.ggxh?.[0]?.substring(0, 100) || '',
    category: getCategoryFromName(name),
    subcategory: categoryCode,
    description: device.cpms?.[0]?.substring(0, 1000) || '',
    manufacturer_name: manufacturer.substring(0, 500),
    country_of_origin: 'CN',
    product_code: device.zxxsdycpbs?.[0]?.substring(0, 100) || '',
    registration_number: regNumber,
    registration_authority: regNumber.startsWith('国械注进') ? 'NMPA (Imported)' : 'NMPA (Domestic)',
    risk_level: getRiskLevel(name),
    data_source: 'NMPA UDID Database',
    data_source_url: 'https://udi.nmpa.gov.cn/',
    last_verified: new Date().toISOString().split('T')[0],
    data_confidence_level: 'high',
    specifications: JSON.stringify({
      udi: device.zxxsdycpbs?.[0] || '',
      barcode_type: device.cpbsbmtxmc?.[0] || '',
      publish_date: device.cpbsfbrq?.[0] || '',
      version: device.versionNumber?.[0] || '',
      version_time: device.versionTime?.[0] || '',
      device_record_key: device.deviceRecordKey?.[0] || '',
      manufacturer_name_en: manufacturerEn,
    }),
  };
}

// 解析单个XML文件
async function parseXMLFile(filePath) {
  return new Promise((resolve, reject) => {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    parseString(xmlData, { explicitArray: true }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      const devices = result?.udid?.devices?.[0]?.device || [];
      const ppeDevices = [];
      
      for (const device of devices) {
        const data = extractDeviceData(device);
        if (data) {
          ppeDevices.push(data);
        }
      }
      
      resolve(ppeDevices);
    });
  });
}

// 获取所有XML文件
function getAllXMLFiles() {
  const files = fs.readdirSync(UDID_DIR)
    .filter(f => f.endsWith('.xml'))
    .map(f => path.join(UDID_DIR, f))
    .sort();
  return files;
}

// 批量插入数据库
async function batchInsert(products, batchSize = 100) {
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('ppe_products')
      .insert(batch, { onConflict: 'registration_number', ignoreDuplicates: true });
    
    if (error) {
      console.error(`  插入错误: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
    
    // 避免速率限制
    await new Promise(r => setTimeout(r, 100));
  }
  
  return { inserted, errors };
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('NMPA UDID PPE数据提取');
  console.log('========================================');
  
  const xmlFiles = getAllXMLFiles();
  console.log(`找到 ${xmlFiles.length} 个XML文件`);
  
  let totalPPE = 0;
  let allPPEDevices = [];
  
  // 处理每个文件
  for (let i = 0; i < xmlFiles.length; i++) {
    const file = xmlFiles[i];
    const fileName = path.basename(file);
    
    try {
      const devices = await parseXMLFile(file);
      if (devices.length > 0) {
        allPPEDevices.push(...devices);
        totalPPE += devices.length;
        console.log(`[${i + 1}/${xmlFiles.length}] ${fileName}: ${devices.length} 条PPE数据`);
      }
      
      // 每100个文件批量插入一次
      if (allPPEDevices.length >= 1000 || i === xmlFiles.length - 1) {
        console.log(`  批量插入 ${allPPEDevices.length} 条数据...`);
        const { inserted, errors } = await batchInsert(allPPEDevices);
        console.log(`  成功: ${inserted}, 错误: ${errors}`);
        allPPEDevices = []; // 清空已插入的数据
      }
    } catch (err) {
      console.error(`  解析错误: ${fileName} - ${err.message}`);
    }
  }
  
  console.log('\n========================================');
  console.log('提取完成');
  console.log('========================================');
  console.log(`总计PPE产品: ${totalPPE}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
