#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const FDA_BASE = 'https://api.fda.gov/device';

const PPE_PRODUCT_CODES = [
  'DSZ', 'FXX', 'FXZ', 'FXY', 'MXK', 'MXL', 'MXM', 'MXN',
  'LXA', 'LXB', 'LXC', 'LXD', 'LXE', 'LXF', 'LXG',
  'KST', 'KSU', 'KSV', 'KSW', 'KSX', 'KSY',
  'MSH', 'MSI', 'MSJ', 'MSK', 'MSL', 'MSM',
  'JOM', 'JON', 'JOO', 'JOP', 'JOQ',
  'BZD', 'BZE', 'BZF', 'BZG',
  'QKR', 'QKS', 'QKT', 'QKU',
  'OEA', 'OEB', 'OEC', 'OED',
  'LNO', 'LNP', 'LNQ', 'LNR',
  'MZM', 'MZN', 'MZO', 'MZP',
  'NZC', 'NZD', 'NZE', 'NZF',
  'PBZ', 'PBY', 'PBX',
  'OUK', 'OUL', 'OUM',
  'FMR', 'FMS', 'FMT',
  'LZJ', 'LZK', 'LZL',
  'NSZ', 'NTA', 'NTB',
];

const PPE_KEYWORDS = [
  'mask', 'respirator', 'n95', 'kn95', 'glove', 'gown',
  'face shield', 'protective clothing', 'safety glasses',
  'hard hat', 'safety helmet', 'safety boot', 'safety shoe',
  'hearing protector', 'earplug', 'coverall', 'apron',
  'surgical mask', 'isolation gown', 'protective suit'
];

const CATEGORY_MAP = {
  'DSZ': '呼吸防护装备', 'FXX': '呼吸防护装备', 'FXZ': '呼吸防护装备',
  'FXY': '呼吸防护装备', 'MXK': '呼吸防护装备', 'MXL': '呼吸防护装备',
  'MXM': '呼吸防护装备', 'MXN': '呼吸防护装备',
  'LXA': '手部防护装备', 'LXB': '手部防护装备', 'LXC': '手部防护装备',
  'LXD': '手部防护装备', 'LXE': '手部防护装备', 'LXF': '手部防护装备',
  'LXG': '手部防护装备',
  'KST': '躯干防护装备', 'KSU': '躯干防护装备', 'KSV': '躯干防护装备',
  'KSW': '躯干防护装备', 'KSX': '躯干防护装备', 'KSY': '躯干防护装备',
  'MSH': '躯干防护装备', 'MSI': '躯干防护装备', 'MSJ': '躯干防护装备',
  'MSK': '躯干防护装备', 'MSL': '躯干防护装备', 'MSM': '躯干防护装备',
  'JOM': '眼面部防护装备', 'JON': '眼面部防护装备', 'JOO': '眼面部防护装备',
  'JOP': '眼面部防护装备', 'JOQ': '眼面部防护装备',
  'BZD': '头部防护装备', 'BZE': '头部防护装备', 'BZF': '头部防护装备',
  'BZG': '头部防护装备',
  'QKR': '足部防护装备', 'QKS': '足部防护装备', 'QKT': '足部防护装备',
  'QKU': '足部防护装备',
  'OEA': '听觉防护装备', 'OEB': '听觉防护装备', 'OEC': '听觉防护装备',
  'OED': '听觉防护装备',
};

const RISK_MAP = {
  '1': 'low', '2': 'low', '3': 'medium', '4': 'medium',
  'class i': 'low', 'class ii': 'medium', 'class iii': 'high',
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFDA510k(productCode, skip = 0) {
  const url = `${FDA_BASE}/510k.json?api_key=${FDA_API_KEY}&search=device_class:"2"+AND+product_code:"${productCode}"&limit=100&skip=${skip}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`  FDA 510k fetch error for ${productCode}:`, e.message);
    return null;
  }
}

async function fetchFDA510kByKeyword(keyword, skip = 0) {
  const url = `${FDA_BASE}/510k.json?api_key=${FDA_API_KEY}&search="${keyword}"+AND+device_class:("2"+"3")&limit=100&skip=${skip}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function fetchFDARegistration(skip = 0) {
  const url = `${FDA_BASE}/registration.json?api_key=${FDA_API_KEY}&limit=100&skip=${skip}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function fetchFDAClassification(productCode, skip = 0) {
  const url = `${FDA_BASE}/classification.json?api_key=${FDA_API_KEY}&search=product_code:"${productCode}"&limit=100&skip=${skip}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('========================================');
  console.log('  全面数据获取 - FDA + Health Canada');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  // Step 1: 获取现有数据的注册号集合，用于去重
  console.log('Step 1: 获取现有数据用于去重...');
  const existingKeys = new Set();
  const existingMfrs = new Set();
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('name,manufacturer_name,product_code,registration_number')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`;
      existingKeys.add(key);
      if (p.registration_number) existingKeys.add(`reg:${p.registration_number}`);
      if (p.manufacturer_name) existingMfrs.add(p.manufacturer_name.toLowerCase().trim());
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`  现有产品唯一键: ${existingKeys.size}`);
  console.log(`  现有制造商: ${existingMfrs.size}`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalMfrsInserted = 0;

  // Step 2: FDA 510(k) 按产品代码获取
  console.log('\nStep 2: FDA 510(k) 按产品代码获取...');
  for (const code of PPE_PRODUCT_CODES) {
    let skip = 0;
    let codeCount = 0;
    while (true) {
      const data = await fetchFDA510k(code, skip);
      if (!data || !data.results || data.results.length === 0) break;
      
      for (const item of data.results) {
        const name = (item.device_name || item.k_number_assign_date || '').toString().trim();
        const mfrName = (item.applicant || '').toString().trim();
        const productCode = (item.product_code || code).toString().trim();
        const regNum = item.k_number || '';
        
        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${productCode.toLowerCase()}`;
        const regKey = `reg:${regNum}`;
        
        if (existingKeys.has(key) || existingKeys.has(regKey) || !name || !mfrName) {
          totalSkipped++;
          continue;
        }
        
        const category = CATEGORY_MAP[productCode] || '其他';
        const riskLevel = RISK_MAP[(item.device_class || '').toLowerCase()] || 'medium';
        const country = (item.country_code || '').trim();
        
        const product = {
          name: name,
          model: (item.model_number || '').toString().trim() || null,
          category: category,
          subcategory: item.device_name || null,
          description: null,
          manufacturer_name: mfrName,
          country_of_origin: country || 'US',
          product_code: productCode,
          risk_level: riskLevel,
          data_source: 'FDA 510(k) Database',
          registration_number: regNum,
          registration_authority: 'FDA',
          registration_valid_until: null,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };
        
        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regNum) existingKeys.add(regKey);
          codeCount++;
          totalInserted++;
          
          if (!existingMfrs.has(mfrName.toLowerCase())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: mfrName,
              country: country || 'US',
              data_source: 'FDA 510(k) Database',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrs.add(mfrName.toLowerCase());
              totalMfrsInserted++;
            }
          }
        }
      }
      
      if (data.results.length < 100) break;
      skip += 100;
      await sleep(500);
    }
    if (codeCount > 0) console.log(`  ${code}: ${codeCount} 条新数据`);
  }
  console.log(`  FDA 510(k) 总计: 插入 ${totalInserted}, 跳过 ${totalSkipped}`);

  // Step 3: FDA 510(k) 按关键词获取
  console.log('\nStep 3: FDA 510(k) 按关键词获取...');
  let keywordInserted = 0;
  for (const kw of PPE_KEYWORDS) {
    let skip = 0;
    let kwCount = 0;
    while (true) {
      const data = await fetchFDA510kByKeyword(kw, skip);
      if (!data || !data.results || data.results.length === 0) break;
      
      for (const item of data.results) {
        const name = (item.device_name || '').toString().trim();
        const mfrName = (item.applicant || '').toString().trim();
        const productCode = (item.product_code || '').toString().trim();
        const regNum = item.k_number || '';
        
        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${productCode.toLowerCase()}`;
        const regKey = `reg:${regNum}`;
        
        if (existingKeys.has(key) || existingKeys.has(regKey) || !name || !mfrName) continue;
        
        const category = CATEGORY_MAP[productCode] || '其他';
        const riskLevel = RISK_MAP[(item.device_class || '').toLowerCase()] || 'medium';
        
        const product = {
          name: name,
          model: (item.model_number || '').toString().trim() || null,
          category: category,
          subcategory: item.device_name || null,
          description: null,
          manufacturer_name: mfrName,
          country_of_origin: (item.country_code || '').trim() || 'US',
          product_code: productCode,
          risk_level: riskLevel,
          data_source: 'FDA 510(k) Database',
          registration_number: regNum,
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };
        
        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regNum) existingKeys.add(regKey);
          kwCount++;
          keywordInserted++;
          
          if (!existingMfrs.has(mfrName.toLowerCase())) {
            await supabase.from('ppe_manufacturers').insert({
              name: mfrName,
              country: (item.country_code || '').trim() || 'US',
              data_source: 'FDA 510(k) Database',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            existingMfrs.add(mfrName.toLowerCase());
            totalMfrsInserted++;
          }
        }
      }
      
      if (data.results.length < 100) break;
      skip += 100;
      await sleep(500);
    }
    if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
  }
  console.log(`  关键词搜索总计: ${keywordInserted} 条`);

  // Step 4: Health Canada MDALL
  console.log('\nStep 4: Health Canada MDALL...');
  let hcInserted = 0;
  let hcSkip = 0;
  const HC_PPE_KEYWORDS = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'safety', 'coverall', 'helmet', 'goggle'];
  
  for (const kw of HC_PPE_KEYWORDS) {
    let hcPage = 0;
    let hcCount = 0;
    while (hcPage < 50) {
      try {
        const url = `https://health-products.canada.ca/api/medical-devices/licence/?lang=en&type=json&search=${encodeURIComponent(kw)}&page=${hcPage + 1}`;
        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        if (!data || !data.data || data.data.length === 0) break;
        
        for (const item of data.data) {
          const name = (item.device_name || '').toString().trim();
          const mfrName = (item.company_name || '').toString().trim();
          const licenceNo = (item.licence_number || '').toString().trim();
          
          if (!name || !mfrName) continue;
          
          const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|`;
          const regKey = `reg:HC-${licenceNo}`;
          
          if (existingKeys.has(key) || existingKeys.has(regKey)) {
            hcSkip++;
            continue;
          }
          
          const product = {
            name: name,
            category: '其他',
            manufacturer_name: mfrName,
            country_of_origin: 'CA',
            product_code: licenceNo,
            risk_level: 'medium',
            data_source: 'Health Canada MDALL',
            registration_number: `HC-${licenceNo}`,
            registration_authority: 'Health Canada',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };
          
          const { error } = await supabase.from('ppe_products').insert(product);
          if (!error) {
            existingKeys.add(key);
            existingKeys.add(regKey);
            hcCount++;
            hcInserted++;
            
            if (!existingMfrs.has(mfrName.toLowerCase())) {
              await supabase.from('ppe_manufacturers').insert({
                name: mfrName,
                country: 'CA',
                data_source: 'Health Canada MDALL',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              });
              existingMfrs.add(mfrName.toLowerCase());
              totalMfrsInserted++;
            }
          }
        }
        
        if (data.data.length < 30) break;
        hcPage++;
        await sleep(300);
      } catch (e) {
        console.error(`  HC error for "${kw}":`, e.message);
        break;
      }
    }
    if (hcCount > 0) console.log(`  "${kw}": ${hcCount} 条新数据`);
  }
  console.log(`  Health Canada 总计: ${hcInserted} 条, 跳过 ${hcSkip}`);

  // Step 5: FDA Classification
  console.log('\nStep 5: FDA Classification...');
  let classInserted = 0;
  for (const code of PPE_PRODUCT_CODES.slice(0, 20)) {
    const data = await fetchFDAClassification(code);
    if (!data || !data.results) continue;
    for (const item of data.results) {
      const name = (item.device_name || '').toString().trim();
      if (!name) continue;
      const key = `class:${name.toLowerCase()}|${code.toLowerCase()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      classInserted++;
    }
    await sleep(300);
  }
  console.log(`  FDA Classification: ${classInserted} 条分类信息`);

  // 最终统计
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  
  console.log('\n========================================');
  console.log('  数据获取完成');
  console.log('========================================');
  console.log(`产品: 4564 -> ${pAfter} (+${pAfter - 4564})`);
  console.log(`制造商: 55 -> ${mAfter} (+${mAfter - 55})`);
  console.log(`新插入产品: ${totalInserted + keywordInserted + hcInserted}`);
  console.log(`新插入制造商: ${totalMfrsInserted}`);
  console.log(`跳过(重复): ${totalSkipped + hcSkip}`);
}

main().catch(console.error);
