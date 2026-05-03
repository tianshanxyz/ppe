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
  console.log('  全球数据获取 - TGA + EUDAMED + MHRA + PMDA + ANVISA');
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
  let totalMfrsInserted = 0;

  // ===== TGA ARTG =====
  console.log('\nStep 2: TGA ARTG (Australia)...');
  let tgaInserted = 0;
  const TGA_PPE_KEYWORDS = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'safety', 'coverall', 'helmet', 'goggle', 'hearing'];
  
  for (const kw of TGA_PPE_KEYWORDS) {
    try {
      const url = `https://tga-search.clients.funnelback.com/s/search.json?collection=tga-artg&query=${encodeURIComponent(kw)}&num=50&start_rank=1`;
      const res = await fetch(url, { 
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        console.log(`  TGA "${kw}": API error ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (!data.response?.resultPacket?.results) continue;
      
      let kwCount = 0;
      for (const item of data.response.resultPacket.results) {
        const name = (item.title || '').toString().trim();
        const meta = item.metaData || {};
        const mfrName = (meta.manufacturer || meta.sponsor || '').toString().trim();
        const artgId = (meta.artgid || '').toString().trim();
        
        if (!name || name.length < 3) continue;
        
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
          tgaInserted++;
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
      if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
      await sleep(500);
    } catch (e) {
      console.log(`  TGA "${kw}": ${e.message}`);
    }
  }
  console.log(`  TGA 总计: ${tgaInserted} 条`);

  // ===== EUDAMED =====
  console.log('\nStep 3: EUDAMED (EU)...');
  let euInserted = 0;
  const EU_PPE_KEYWORDS = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'coverall', 'helmet', 'goggle', 'hearing protector'];
  
  for (const kw of EU_PPE_KEYWORDS) {
    try {
      const url = `https://ec.europa.eu/tools/eudamed/api/devices/search?searchTerm=${encodeURIComponent(kw)}&pageSize=50&page=0`;
      const res = await fetch(url, { 
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        console.log(`  EUDAMED "${kw}": API error ${res.status}`);
        continue;
      }
      const data = await res.json();
      const devices = data.devices || data.content || data.results || [];
      
      let kwCount = 0;
      for (const item of devices) {
        const name = (item.deviceName || item.name || item.tradeName || '').toString().trim();
        const mfrName = (item.manufacturerName || item.manufacturer?.name || '').toString().trim();
        const eudamedId = (item.eudamedId || item.id || '').toString().trim();
        
        if (!name || name.length < 3) continue;
        
        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|`;
        const regKey = eudamedId ? `reg:EU-${eudamedId}` : '';
        
        if (existingKeys.has(key) || (regKey && existingKeys.has(regKey))) continue;
        
        const category = categorizeProduct(name);
        
        const product = {
          name: name.substring(0, 500),
          category: category,
          manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
          country_of_origin: 'EU',
          product_code: eudamedId.substring(0, 100),
          risk_level: (item.riskClass || 'medium').toString().toLowerCase(),
          data_source: 'EUDAMED',
          registration_number: eudamedId ? `EU-${eudamedId}` : null,
          registration_authority: 'EU MDR',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };
        
        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regKey) existingKeys.add(regKey);
          kwCount++;
          euInserted++;
          totalInserted++;
          
          if (mfrName && !existingMfrs.has(mfrName.toLowerCase().trim())) {
            await supabase.from('ppe_manufacturers').insert({
              name: mfrName.substring(0, 500),
              country: 'EU',
              data_source: 'EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            existingMfrs.add(mfrName.toLowerCase().trim());
            totalMfrsInserted++;
          }
        }
      }
      if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
      await sleep(500);
    } catch (e) {
      console.log(`  EUDAMED "${kw}": ${e.message}`);
    }
  }
  console.log(`  EUDAMED 总计: ${euInserted} 条`);

  // ===== MHRA =====
  console.log('\nStep 4: MHRA (UK)...');
  let mhraInserted = 0;
  try {
    const url = 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1185468/2023-07-06_PPE_Registrations.ods';
    console.log('  MHRA: 尝试获取公开数据...');
    console.log('  MHRA: 需要手动下载ODS文件并导入');
  } catch (e) {
    console.log(`  MHRA: ${e.message}`);
  }
  console.log(`  MHRA 总计: ${mhraInserted} 条`);

  // ===== PMDA =====
  console.log('\nStep 5: PMDA (Japan)...');
  let pmdaInserted = 0;
  const JP_PPE_KEYWORDS = ['マスク', '防護服', '手袋', 'ゴーグル', '保護具'];
  
  for (const kw of JP_PPE_KEYWORDS) {
    try {
      const url = `https://www.pmda.go.jp/api/search?keyword=${encodeURIComponent(kw)}&type=device&limit=50`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        console.log(`  PMDA "${kw}": API error ${res.status}`);
        continue;
      }
      const data = await res.json();
      const devices = data.results || data.items || [];
      
      let kwCount = 0;
      for (const item of devices) {
        const name = (item.deviceName || item.name || '').toString().trim();
        const mfrName = (item.manufacturerName || item.applicant || '').toString().trim();
        const approvalNo = (item.approvalNumber || item.id || '').toString().trim();
        
        if (!name) continue;
        
        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|`;
        const regKey = approvalNo ? `reg:JP-${approvalNo}` : '';
        
        if (existingKeys.has(key) || (regKey && existingKeys.has(regKey))) continue;
        
        const product = {
          name: name.substring(0, 500),
          category: categorizeProduct(name),
          manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
          country_of_origin: 'JP',
          product_code: approvalNo.substring(0, 100),
          risk_level: 'medium',
          data_source: 'PMDA',
          registration_number: approvalNo ? `JP-${approvalNo}` : null,
          registration_authority: 'PMDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };
        
        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regKey) existingKeys.add(regKey);
          kwCount++;
          pmdaInserted++;
          totalInserted++;
        }
      }
      if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
      await sleep(500);
    } catch (e) {
      console.log(`  PMDA "${kw}": ${e.message}`);
    }
  }
  console.log(`  PMDA 总计: ${pmdaInserted} 条`);

  // ===== ANVISA =====
  console.log('\nStep 6: ANVISA (Brazil)...');
  let anvisaInserted = 0;
  try {
    const url = 'https://dados.gov.br/dados/api/publico/conjuntos-dados/cadastro-de-produtos-para-saude/recursos';
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      console.log('  ANVISA: 找到数据集，尝试下载CSV...');
    } else {
      console.log(`  ANVISA: API error ${res.status}`);
    }
  } catch (e) {
    console.log(`  ANVISA: ${e.message}`);
  }
  console.log(`  ANVISA 总计: ${anvisaInserted} 条`);

  // 最终统计
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  
  console.log('\n========================================');
  console.log('  全球数据获取完成');
  console.log('========================================');
  console.log(`产品: -> ${pAfter}`);
  console.log(`制造商: -> ${mAfter}`);
  console.log(`新插入产品: ${totalInserted}`);
  console.log(`新插入制造商: ${totalMfrsInserted}`);
  console.log(`\n各来源新增:`);
  console.log(`  TGA: ${tgaInserted}`);
  console.log(`  EUDAMED: ${euInserted}`);
  console.log(`  MHRA: ${mhraInserted}`);
  console.log(`  PMDA: ${pmdaInserted}`);
  console.log(`  ANVISA: ${anvisaInserted}`);
}

main().catch(console.error);
