#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const FDA_BASE = 'https://api.fda.gov/device';

const PPE_KEYWORDS = [
  'mask', 'respirator', 'n95', 'glove', 'gown',
  'face shield', 'protective clothing', 'safety glasses',
  'hard hat', 'safety helmet', 'safety boot', 'safety shoe',
  'hearing protector', 'earplug', 'coverall', 'apron',
  'surgical mask', 'isolation gown', 'protective suit',
  'safety glove', 'nitrile glove', 'latex glove',
  'protective eyewear', 'safety goggle', 'welding helmet',
  'chain saw protective', 'fall protection', 'life jacket',
  'chemical protective', 'biological protective'
];

const CATEGORY_KEYWORDS = {
  '呼吸防护装备': ['mask', 'respirator', 'n95', 'kn95', 'breathing', 'filter face piece'],
  '手部防护装备': ['glove', 'nitrile', 'latex', 'hand protection'],
  '躯干防护装备': ['gown', 'coverall', 'apron', 'protective clothing', 'isolation', 'suit'],
  '眼面部防护装备': ['face shield', 'goggle', 'eyewear', 'eye protection', 'safety glasses'],
  '头部防护装备': ['hard hat', 'helmet', 'head protection', 'bump cap'],
  '足部防护装备': ['boot', 'shoe', 'foot protection', 'metatarsal'],
  '听觉防护装备': ['hearing protector', 'earplug', 'earmuff', 'hearing protection'],
};

const RISK_MAP = { '1': 'low', '2': 'medium', '3': 'high', 'class i': 'low', 'class ii': 'medium', 'class iii': 'high' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function categorizeProduct(name, productCode) {
  const lowerName = (name || '').toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerName.includes(kw))) return cat;
  }
  return '其他';
}

async function main() {
  console.log('========================================');
  console.log('  全面数据获取 - FDA 510(k)');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  // Step 1: 获取现有数据用于去重
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

  // Step 2: FDA 510(k) 按关键词获取
  console.log('\nStep 2: FDA 510(k) 按关键词获取...');
  for (const kw of PPE_KEYWORDS) {
    let skip = 0;
    let kwCount = 0;
    let totalForKw = 0;
    
    while (skip < 9000) {
      const url = `${FDA_BASE}/510k.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(kw)}&limit=100&skip=${skip}`;
      let data;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) break;
          console.error(`  FDA API error for "${kw}" skip=${skip}: ${res.status}`);
          await sleep(2000);
          continue;
        }
        data = await res.json();
      } catch (e) {
        console.error(`  FDA fetch error:`, e.message);
        await sleep(2000);
        continue;
      }
      
      if (!data.results || data.results.length === 0) break;
      totalForKw = data.meta?.results?.total || 0;
      
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
        
        const category = categorizeProduct(name, productCode);
        const riskLevel = RISK_MAP[(item.device_class || '').toString().toLowerCase()] || 'medium';
        const country = (item.country_code || '').toString().trim();
        const decisionDate = item.decision_date || '';
        const description = item.statement_or_summary || '';
        
        const product = {
          name: name.substring(0, 500),
          model: (item.model_number || '').toString().trim().substring(0, 200) || null,
          category: category,
          subcategory: item.device_name || null,
          description: description ? description.substring(0, 2000) : null,
          manufacturer_name: mfrName.substring(0, 500),
          country_of_origin: country || 'US',
          product_code: productCode.substring(0, 100),
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
        } else {
          console.error(`  Insert error:`, error.message);
        }
      }
      
      if (data.results.length < 100) break;
      skip += 100;
      await sleep(600);
    }
    console.log(`  "${kw}": ${kwCount} 条新数据 (总匹配: ${totalForKw})`);
  }

  // 最终统计
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  
  console.log('\n========================================');
  console.log('  FDA 510(k) 数据获取完成');
  console.log('========================================');
  console.log(`产品: -> ${pAfter}`);
  console.log(`制造商: -> ${mAfter}`);
  console.log(`新插入产品: ${totalInserted}`);
  console.log(`新插入制造商: ${totalMfrsInserted}`);
  console.log(`跳过(重复): ${totalSkipped}`);
}

main().catch(console.error);
