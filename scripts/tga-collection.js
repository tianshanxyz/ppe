#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const CATEGORY_KEYWORDS = {
  '呼吸防护装备': ['mask', 'respirator', 'n95', 'breathing', 'filter face'],
  '手部防护装备': ['glove', 'nitrile', 'latex', 'hand protection'],
  '躯干防护装备': ['gown', 'coverall', 'apron', 'protective clothing', 'isolation', 'suit'],
  '眼面部防护装备': ['face shield', 'goggle', 'eyewear', 'eye protection'],
  '头部防护装备': ['hard hat', 'helmet', 'head protection'],
  '足部防护装备': ['boot', 'shoe', 'foot protection'],
  '听觉防护装备': ['hearing protector', 'earplug', 'earmuff'],
};

function categorizeProduct(name) {
  const lowerName = (name || '').toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerName.includes(kw))) return cat;
  }
  return '其他';
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('========================================');
  console.log('  TGA ARTG 数据获取 (通过网页API)');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

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
  console.log(`现有产品唯一键: ${existingKeys.size}, 现有制造商: ${existingMfrs.size}`);

  let totalInserted = 0;
  let totalMfrsInserted = 0;

  // TGA ARTG 通过 Funnelback 搜索API
  const TGA_KEYWORDS = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'safety', 'coverall', 'helmet', 'goggle', 'hearing protector', 'surgical mask', 'n95', 'nitrile glove', 'safety boot', 'safety glasses'];
  
  for (const kw of TGA_KEYWORDS) {
    let kwCount = 0;
    for (let startRank = 1; startRank <= 200; startRank += 50) {
      try {
        const url = `https://tga-search.clients.funnelback.com/s/search.json?collection=tga-artg&query=${encodeURIComponent(kw)}&num=50&start_rank=${startRank}`;
        const res = await fetch(url, { 
          signal: AbortSignal.timeout(20000),
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        if (!res.ok) {
          console.log(`  TGA "${kw}" rank=${startRank}: HTTP ${res.status}`);
          break;
        }
        const data = await res.json();
        if (!data.response?.resultPacket?.results) break;
        
        for (const item of data.response.resultPacket.results) {
          const name = (item.title || '').toString().trim();
          if (!name || name.length < 3) continue;
          
          const meta = item.metaData || {};
          const mfrName = (meta.manufacturer || meta.sponsor || meta.companyname || '').toString().trim();
          const artgId = (meta.artgid || item.listMetadata?.artgid?.[0] || '').toString().trim();
          const productType = (meta.producttype || '').toString().trim();
          
          const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|`;
          const regKey = artgId ? `reg:TGA-${artgId}` : '';
          
          if (existingKeys.has(key) || (regKey && existingKeys.has(regKey))) continue;
          
          const category = categorizeProduct(name);
          
          const product = {
            name: name.substring(0, 500),
            category: category,
            manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
            country_of_origin: 'AU',
            product_code: artgId.substring(0, 100),
            risk_level: 'medium',
            data_source: 'TGA ARTG',
            registration_number: artgId ? `TGA-${artgId}` : null,
            registration_authority: 'TGA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };
          
          const { error } = await supabase.from('ppe_products').insert(product);
          if (!error) {
            existingKeys.add(key);
            if (regKey) existingKeys.add(regKey);
            kwCount++;
            totalInserted++;
            
            if (mfrName && !existingMfrs.has(mfrName.toLowerCase().trim())) {
              await supabase.from('ppe_manufacturers').insert({
                name: mfrName.substring(0, 500),
                country: 'AU',
                data_source: 'TGA ARTG',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              });
              existingMfrs.add(mfrName.toLowerCase().trim());
              totalMfrsInserted++;
            }
          }
        }
        
        if (data.response.resultPacket.results.length < 50) break;
        await sleep(800);
      } catch (e) {
        console.log(`  TGA "${kw}" rank=${startRank}: ${e.message}`);
        break;
      }
    }
    if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
  }

  console.log(`\nTGA 总计: 插入 ${totalInserted} 条产品, ${totalMfrsInserted} 条制造商`);

  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n当前: 产品=${pAfter}, 制造商=${mAfter}`);
}

main().catch(console.error);
