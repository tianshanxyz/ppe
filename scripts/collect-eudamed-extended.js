#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const EUDAMED_API_BASE = 'https://ec.europa.eu/tools/eudamed/api';

let existingKeys = new Set();
let totalInserted = 0;

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
    'chemical suit', 'welding', 'gas mask', 'scba', 'breathing apparatus',
    'patient transfer', 'medical device', 'healthcare', 'hospital',
    'surgical', 'examination', 'diagnostic', 'patient monitoring'
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

async function insertBatch(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  const batchSize = 50;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (!error) {
      inserted += batch.length;
    } else {
      // 逐条插入
      for (const p of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) inserted++;
      }
    }
  }
  return inserted;
}

async function collectEUDAMEDDevicesExtended() {
  console.log('\n========== EUDAMED 扩展设备数据采集 ==========');
  let page = 101; // 从第101页开始（之前已经采集了1-100页）
  const maxPages = 500;
  const pageSize = 300;
  const products = [];

  while (page <= maxPages) {
    try {
      const url = `${EUDAMED_API_BASE}/devices/udiDiData?page=${page}&pageSize=${pageSize}&size=${pageSize}&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(url);
      
      if (!result || !result.content || result.content.length === 0) {
        console.log(`  第${page}页无数据，结束采集`);
        break;
      }

      let pageCount = 0;
      for (const device of result.content) {
        const name = device.tradeName || device.deviceName || '';
        if (!name) continue;
        
        // 扩大采集范围：所有医疗设备（不只是PPE关键词）
        const category = categorizePPE(name);
        const manufacturer = device.manufacturerName || 'Unknown';
        
        if (isDuplicate(name, manufacturer, 'EUDAMED Extended')) continue;
        markInserted(name, manufacturer, 'EUDAMED Extended');

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
          data_source: 'EUDAMED Extended API',
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

        products.push(product);
        pageCount++;
        
        if (products.length >= 100) {
          const inserted = await insertBatch(products.splice(0, products.length));
          totalInserted += inserted;
        }
      }

      if (page % 10 === 0) {
        console.log(`  已处理到第${page}页，累计新增: ${totalInserted}`);
      }
      
      if (result.last || result.content.length < pageSize) break;
      
      page++;
      await sleep(1500);
    } catch (e) {
      console.log(`  第${page}页错误: ${e.message}`);
      break;
    }
  }

  // 插入剩余数据
  if (products.length > 0) {
    const inserted = await insertBatch(products);
    totalInserted += inserted;
  }

  console.log(`  EUDAMED扩展采集总计: ${totalInserted}`);
  return totalInserted;
}

async function collectEUDAMEDBySearchTerms() {
  console.log('\n========== EUDAMED 按关键词搜索采集 ==========');
  
  const searchTerms = [
    'protective', 'safety equipment', 'medical glove', 'surgical mask',
    'respiratory', 'patient', 'healthcare', 'hospital', 'clinical',
    'examination', 'diagnostic', 'monitoring', 'therapy', 'surgical',
    'infection control', 'sterile', 'barrier', 'isolation'
  ];
  
  let termTotal = 0;
  
  for (const term of searchTerms) {
    try {
      const url = `${EUDAMED_API_BASE}/devices/udiDiData?page=1&pageSize=300&size=300&iso2Code=en&languageIso2Code=en&search=${encodeURIComponent(term)}`;
      const result = await fetchJSON(url);
      
      if (!result || !result.content) continue;
      
      const products = [];
      for (const device of result.content) {
        const name = device.tradeName || device.deviceName || '';
        if (!name) continue;
        
        const category = categorizePPE(name);
        const manufacturer = device.manufacturerName || 'Unknown';
        
        if (isDuplicate(name, manufacturer, 'EUDAMED Search')) continue;
        markInserted(name, manufacturer, 'EUDAMED Search');

        products.push({
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
          data_source: `EUDAMED Search: ${term}`,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({ search_term: term }),
        });
      }
      
      const inserted = await insertBatch(products);
      termTotal += inserted;
      
      if (inserted > 0) {
        console.log(`  "${term}": ${inserted}条`);
      }
      
      await sleep(2000);
    } catch (e) {
      // 继续下一个关键词
    }
  }
  
  console.log(`  关键词搜索总计: ${termTotal}`);
  totalInserted += termTotal;
  return termTotal;
}

async function main() {
  console.log('========================================');
  console.log('EUDAMED 扩展数据采集 - 最大化抓取');
  console.log('========================================');
  console.log(`开始时间: ${new Date().toISOString()}`);

  await loadExistingProducts();

  await collectEUDAMEDDevicesExtended();
  await collectEUDAMEDBySearchTerms();

  console.log('\n========================================');
  console.log(`EUDAMED扩展采集完成! 总计新增: ${totalInserted}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
  console.log('========================================');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
