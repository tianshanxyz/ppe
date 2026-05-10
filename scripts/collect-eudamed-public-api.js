#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const EUDAMED_API_BASE = 'https://ec.europa.eu/tools/eudamed/api';

let existingKeys = new Set();

async function loadExistingProducts() {
  console.log('加载现有产品数据用于去重...');
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`已加载 ${existingKeys.size} 条现有产品记录`);
}

function isDuplicate(name, manufacturer, source) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(manufacturer || '').substring(0, 200).toLowerCase().trim()}|${(source || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

function markInserted(name, manufacturer, source) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(manufacturer || '').substring(0, 200).toLowerCase().trim()}|${(source || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|breathing|scba|gas.*mask|air.*purif/i.test(n)) return '呼吸防护装备';
  if (/glove|hand.*protect|nitrile|latex/i.test(n)) return '手部防护装备';
  if (/gown|coverall|suit|clothing|apparel|garment|isolation/i.test(n)) return '身体防护装备';
  if (/goggle|shield|eyewear|eye.*protect|face.*shield/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.*hat|head.*protect|bump.*cap/i.test(n)) return '头部防护装备';
  if (/boot|shoe|foot.*protect|safety.*shoe/i.test(n)) return '足部防护装备';
  if (/earplug|earmuff|hearing.*protect/i.test(n)) return '听觉防护装备';
  if (/harness|lanyard|fall.*protect|safety.*belt/i.test(n)) return '坠落防护装备';
  if (/vest|high.*vis|reflective/i.test(n)) return '躯干防护装备';
  return '其他';
}

function isPPERelated(name) {
  const n = (name || '').toLowerCase();
  const ppeKeywords = [
    'protective', 'safety', 'ppe', 'respirator', 'mask', 'glove', 'gown',
    'coverall', 'helmet', 'hard hat', 'goggle', 'shield', 'harness',
    'lanyard', 'fall protection', 'earplug', 'earmuff', 'safety shoe',
    'safety boot', 'protective clothing', 'high visibility', 'reflective',
    'chemical suit', 'welding', 'gas mask', 'scba', 'breathing apparatus'
  ];
  return ppeKeywords.some(kw => n.includes(kw));
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) {
        console.log('    Rate limited, waiting 10s...');
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function collectEUDAMEDDevices() {
  console.log('\n========== EUDAMED 公开API设备数据采集 ==========');
  let totalInserted = 0;
  let page = 1;
  const maxPages = 100;
  const pageSize = 300;

  while (page <= maxPages) {
    try {
      const url = `${EUDAMED_API_BASE}/devices/udiDiData?page=${page}&pageSize=${pageSize}&size=${pageSize}&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(url);
      
      if (!result || !result.content || result.content.length === 0) {
        console.log(`  第${page}页无数据，结束采集`);
        break;
      }

      let pageInserted = 0;
      for (const device of result.content) {
        const name = device.tradeName || device.deviceName || '';
        if (!name) continue;
        
        // 只采集PPE相关设备
        if (!isPPERelated(name)) continue;

        const category = categorizePPE(name);
        const manufacturer = device.manufacturerName || 'Unknown';
        
        if (isDuplicate(name, manufacturer, 'EUDAMED Public API')) continue;
        markInserted(name, manufacturer, 'EUDAMED Public API');

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: manufacturer.substring(0, 500),
          country_of_origin: 'EU',
          risk_level: device.riskClass?.code?.includes('class-iii') ? 'high' : 
                     device.riskClass?.code?.includes('class-iib') ? 'high' :
                     device.riskClass?.code?.includes('class-iia') ? 'medium' : 'low',
          product_code: device.basicUdi || '',
          registration_number: device.primaryDi || device.uuid || '',
          registration_authority: 'EUDAMED',
          data_source: 'EUDAMED Public API',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            eudamed_uuid: device.uuid || '',
            basic_udi: device.basicUdi || '',
            primary_di: device.primaryDi || '',
            risk_class: device.riskClass?.code || '',
            device_status: device.deviceStatusType?.code || '',
            manufacturer_srn: device.manufacturerSrn || '',
          }),
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          pageInserted++;
          totalInserted++;
        }
      }

      console.log(`  第${page}页: ${pageInserted}/${result.content.length}条`);
      
      if (result.last || result.content.length < pageSize) break;
      
      page++;
      await sleep(2000);
    } catch (e) {
      console.log(`  第${page}页错误: ${e.message}`);
      break;
    }
  }

  console.log(`  EUDAMED设备总计: ${totalInserted}`);
  return totalInserted;
}

async function collectEUDAMEDActors() {
  console.log('\n========== EUDAMED 公开API制造商数据采集 ==========');
  let totalInserted = 0;
  let page = 1;
  const maxPages = 50;
  const pageSize = 300;

  while (page <= maxPages) {
    try {
      const url = `${EUDAMED_API_BASE}/actors?page=${page}&pageSize=${pageSize}&size=${pageSize}&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(url);
      
      if (!result || !result.content || result.content.length === 0) {
        console.log(`  第${page}页无数据，结束采集`);
        break;
      }

      let pageInserted = 0;
      for (const actor of result.content) {
        const name = actor.name?.texts?.[0]?.text || actor.name || '';
        if (!name) continue;

        const country = actor.country?.iso2Code || 'EU';
        const actorType = actor.type?.code || '';
        
        // 只采集制造商
        if (!actorType.includes('manufacturer')) continue;

        // 检查是否已存在
        const { data: existing } = await supabase.from('ppe_manufacturers')
          .select('id')
          .eq('name', name)
          .maybeSingle();
        
        if (existing) continue;

        const manufacturer = {
          name: name.substring(0, 500),
          country,
          website: actor.website || '',
          contact_info: JSON.stringify({
            email: actor.electronicMail || '',
            telephone: actor.telephone || '',
            address: actor.actorAddress || {},
          }),
          certifications: JSON.stringify({
            srn: actor.srn || '',
            eudamed_id: actor.eudamedIdentifier || '',
            actor_type: actorType,
            actor_status: actor.actorStatus?.code || '',
          }),
          data_confidence_level: 'high',
          last_verified: new Date().toISOString().split('T')[0],
        };

        const { error } = await supabase.from('ppe_manufacturers').insert(manufacturer);
        if (!error) {
          pageInserted++;
          totalInserted++;
        }
      }

      console.log(`  第${page}页: ${pageInserted}/${result.content.length}条`);
      
      if (result.last || result.content.length < pageSize) break;
      
      page++;
      await sleep(2000);
    } catch (e) {
      console.log(`  第${page}页错误: ${e.message}`);
      break;
    }
  }

  console.log(`  EUDAMED制造商总计: ${totalInserted}`);
  return totalInserted;
}

async function main() {
  console.log('========================================');
  console.log('EUDAMED 公开API数据采集');
  console.log('========================================');
  console.log(`开始时间: ${new Date().toISOString()}`);

  await loadExistingProducts();

  let grandTotal = 0;
  grandTotal += await collectEUDAMEDDevices();
  grandTotal += await collectEUDAMEDActors();

  console.log('\n========================================');
  console.log(`EUDAMED数据采集完成! 总计新增: ${grandTotal}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
  console.log('========================================');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
