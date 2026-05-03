#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const FDA_BASE = 'https://api.fda.gov/device';

const REMAINING_KEYWORDS = [
  'glove', 'gown', 'face shield', 'protective clothing',
  'safety glasses', 'hard hat', 'safety boot', 'safety shoe',
  'hearing protector', 'earplug', 'coverall', 'apron',
  'surgical mask', 'isolation gown', 'protective suit',
  'nitrile glove', 'safety goggle', 'welding helmet',
  'chemical protective', 'fall protection'
];

const CATEGORY_KEYWORDS = {
  '呼吸防护装备': ['mask', 'respirator', 'n95', 'kn95', 'breathing', 'filter face'],
  '手部防护装备': ['glove', 'nitrile', 'latex', 'hand protection'],
  '躯干防护装备': ['gown', 'coverall', 'apron', 'protective clothing', 'isolation', 'suit'],
  '眼面部防护装备': ['face shield', 'goggle', 'eyewear', 'eye protection', 'safety glasses'],
  '头部防护装备': ['hard hat', 'helmet', 'head protection', 'bump cap', 'welding helmet'],
  '足部防护装备': ['boot', 'shoe', 'foot protection', 'metatarsal'],
  '听觉防护装备': ['hearing protector', 'earplug', 'earmuff', 'hearing protection'],
};

const RISK_MAP = { '1': 'low', '2': 'medium', '3': 'high' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function categorizeProduct(name) {
  const lowerName = (name || '').toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerName.includes(kw))) return cat;
  }
  return '其他';
}

async function main() {
  console.log('========================================');
  console.log('  数据获取 - FDA 510(k) 剩余关键词');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  // 获取现有数据用于去重
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

  // FDA 510(k) 按关键词获取
  console.log('\nStep 2: FDA 510(k) 按关键词获取...');
  for (const kw of REMAINING_KEYWORDS) {
    let skip = 0;
    let kwCount = 0;
    let totalForKw = 0;
    let errors = 0;
    
    while (skip < 5000 && errors < 3) {
      const url = `${FDA_BASE}/510k.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(kw)}&limit=100&skip=${skip}`;
      let data;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          if (res.status === 404) break;
          errors++;
          await sleep(3000);
          continue;
        }
        data = await res.json();
      } catch (e) {
        errors++;
        await sleep(3000);
        continue;
      }
      
      if (!data.results || data.results.length === 0) break;
      totalForKw = data.meta?.results?.total || 0;
      errors = 0;
      
      for (const item of data.results) {
        const name = (item.device_name || '').toString().trim();
        const mfrName = (item.applicant || '').toString().trim();
        const productCode = (item.product_code || '').toString().trim();
        const regNum = item.k_number || '';
        
        if (!name || !mfrName) continue;
        
        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${productCode.toLowerCase()}`;
        const regKey = regNum ? `reg:${regNum}` : '';
        
        if (existingKeys.has(key) || (regKey && existingKeys.has(regKey))) {
          totalSkipped++;
          continue;
        }
        
        const category = categorizeProduct(name);
        const riskLevel = RISK_MAP[(item.device_class || '').toString()] || 'medium';
        const country = (item.country_code || '').toString().trim();
        
        const product = {
          name: name.substring(0, 500),
          model: (item.model_number || '').toString().trim().substring(0, 200) || null,
          category: category,
          subcategory: item.device_name || null,
          description: (item.statement_or_summary || '').toString().trim().substring(0, 2000) || null,
          manufacturer_name: mfrName.substring(0, 500),
          country_of_origin: country || 'US',
          product_code: productCode.substring(0, 100),
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
          if (regKey) existingKeys.add(regKey);
          kwCount++;
          totalInserted++;
          
          if (!existingMfrs.has(mfrName.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: mfrName.substring(0, 500),
              country: country || 'US',
              data_source: 'FDA 510(k) Database',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrs.add(mfrName.toLowerCase().trim());
              totalMfrsInserted++;
            }
          }
        }
      }
      
      if (data.results.length < 100) break;
      skip += 100;
      await sleep(800);
    }
    console.log(`  "${kw}": ${kwCount} 条新数据 (总匹配: ${totalForKw})`);
  }

  // Health Canada MDALL
  console.log('\nStep 3: Health Canada MDALL...');
  let hcInserted = 0;
  const HC_KEYWORDS = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'safety', 'coverall', 'helmet', 'goggle'];
  
  for (const kw of HC_KEYWORDS) {
    let hcPage = 0;
    let hcCount = 0;
    while (hcPage < 30) {
      try {
        const url = `https://health-products.canada.ca/api/medical-devices/licence/?lang=en&type=json&search=${encodeURIComponent(kw)}&page=${hcPage + 1}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
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
          
          if (existingKeys.has(key) || existingKeys.has(regKey)) continue;
          
          const category = categorizeProduct(name);
          
          const product = {
            name: name.substring(0, 500),
            category: category,
            manufacturer_name: mfrName.substring(0, 500),
            country_of_origin: 'CA',
            product_code: licenceNo.substring(0, 100),
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
            
            if (!existingMfrs.has(mfrName.toLowerCase().trim())) {
              await supabase.from('ppe_manufacturers').insert({
                name: mfrName.substring(0, 500),
                country: 'CA',
                data_source: 'Health Canada MDALL',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              });
              existingMfrs.add(mfrName.toLowerCase().trim());
              totalMfrsInserted++;
            }
          }
        }
        
        if (data.data.length < 30) break;
        hcPage++;
        await sleep(500);
      } catch (e) {
        break;
      }
    }
    if (hcCount > 0) console.log(`  "${kw}": ${hcCount} 条新数据`);
  }
  console.log(`  Health Canada 总计: ${hcInserted} 条`);

  // 最终统计
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  
  console.log('\n========================================');
  console.log('  数据获取完成');
  console.log('========================================');
  console.log(`产品: -> ${pAfter}`);
  console.log(`制造商: -> ${mAfter}`);
  console.log(`新插入产品: ${totalInserted + hcInserted}`);
  console.log(`新插入制造商: ${totalMfrsInserted}`);
  console.log(`跳过(重复): ${totalSkipped}`);
}

main().catch(console.error);
