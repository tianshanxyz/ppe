#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const BASE = 'https://health-products.canada.ca/api/medical-devices/device?lang=eng&type=json&state=active&limit=100';

function ppeFilter(name) {
  const n = (name || '').toLowerCase();
  if (/mask|respirator|respiratory|facepiece/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|latex|vinyl/i.test(n) && /exam|surgical|medical|procedure|chemotherapy/i.test(n)) return '手部防护装备';
  if (/goggle|face shield|faceshield|eye protector/i.test(n)) return '眼面部防护装备';
  if (/safety helmet|protective helmet|bump cap/i.test(n)) return '头部防护装备';
  if (/earplug|ear muff|ear plug|earmuff/i.test(n)) return '听觉防护装备';
  if (/safety shoe|safety boot|protective shoe/i.test(n)) return '足部防护装备';
  if (/gown|coverall|protective suit|protective clothing|protective apparel|apron/i.test(n)) return '身体防护装备';
  if (/shoe cover|boot cover|bouffant|hair cover/i.test(n)) return '其他';
  if (/surgical|medical|procedure|isolation|examination/i.test(n)) {
    if (/mask/i.test(n)) return '呼吸防护装备';
    if (/gown/i.test(n)) return '身体防护装备';
    if (/glove/i.test(n)) return '手部防护装备';
    if (/cap|hood|cover/i.test(n)) return '头部防护装备';
    return '其他';
  }
  return null;
}

const SEARCH_TERMS = [
  'surgical mask', 'medical mask', 'procedure mask', 'respirator', 'N95',
  'surgical glove', 'examination glove', 'medical glove', 'chemotherapy glove',
  'surgical gown', 'isolation gown', 'medical gown', 'protective gown',
  'face shield', 'faceshield', 'goggle', 'protective eyewear',
  'safety helmet', 'hearing protection', 'earplug', 'earmuff',
  'safety shoe', 'safety boot', 'shoe cover', 'boot cover',
  'bouffant cap', 'surgical cap', 'scrub cap', 'surgical hood',
  'medical apron', 'protective apron', 'disposable coverall',
];

async function main() {
  console.log('=== Health Canada MDALL PPE Collector ===');
  const t0 = Date.now();

  let keys = new Set(), mfrSet = new Set();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products').select('name,manufacturer_name,product_code').range(p*1000,(p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => keys.add(`${(r.name||'').toLowerCase().trim()}|${(r.manufacturer_name||'').toLowerCase().trim()}|${(r.product_code||'').toLowerCase().trim()}`));
    if (data.length < 1000) break;
  }
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_manufacturers').select('name').range(p*1000,(p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => mfrSet.add((r.name||'').toLowerCase().trim()));
    if (data.length < 1000) break;
  }
  console.log(`现有: ${keys.size}产品, ${mfrSet.size}制造商`);

  let total = 0, ins = 0, mfrIns = 0, seen = new Set();
  let batch = [];

  async function flush() {
    if (batch.length === 0) return;
    const toInsert = [...batch];
    batch = [];
    for (const prod of toInsert) {
      const k = `${prod.name.toLowerCase()}|${(prod.manufacturer_name||'').toLowerCase()}|${(prod.product_code||'').toLowerCase()}`;
      if (keys.has(k)) continue;
      const { error } = await supabase.from('ppe_products').insert(prod);
      if (!error) {
        keys.add(k); ins++;
        const m = prod.manufacturer_name;
        if (m && m !== 'Unknown' && !mfrSet.has(m.toLowerCase().trim())) {
          try {
            await supabase.from('ppe_manufacturers').insert({
              name: m.substring(0,500), country: prod.country_of_origin || 'CA',
              data_source: 'Health Canada MDALL', last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
          } catch(e) {}
          mfrSet.add(m.toLowerCase().trim()); mfrIns++;
        }
      }
    }
  }

  for (const term of SEARCH_TERMS) {
    try {
      const url = `${BASE}&term=${encodeURIComponent(term)}`;
      const resp = await axios.get(url, { timeout: 15000 });
      const devices = resp.data || [];

      for (const dev of devices) {
        const tradeName = (dev.trade_name || dev.device_name || '').trim();
        if (!tradeName || tradeName.length < 2) continue;

        const cat = ppeFilter(tradeName);
        if (!cat) continue;

        const dedupKey = `${tradeName}|${dev.original_licence_no}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        // Get company info
        let companyName = 'Unknown';
        try {
          const compResp = await axios.get(`https://health-products.canada.ca/api/medical-devices/licence?lang=eng&type=json&id=${dev.original_licence_no}`, { timeout: 10000 });
          if (compResp.data && compResp.data.length > 0) {
            companyName = compResp.data[0].company_name || 'Unknown';
          }
        } catch(e) {}

        batch.push({
          name: tradeName.substring(0, 500),
          category: cat,
          manufacturer_name: companyName.substring(0, 500),
          product_code: String(dev.original_licence_no || '').substring(0, 50),
          country_of_origin: 'CA',
          risk_level: 'medium',
          data_source: 'Health Canada MDALL',
          registration_authority: 'Health Canada',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        });

        total++;
        if (batch.length >= 30) await flush();
        await new Promise(r => setTimeout(r, 50));
      }

      console.log(`  "${term}": ${devices.length}条, PPE累计: ${total}, 新增: ${ins}`);
    } catch (e) {
      console.log(`  "${term}": ERROR ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  await flush();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n=== Health Canada完成(${elapsed}s) ===`);
  console.log(`PPE: ${total}, 新增: ${ins}, 新厂商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
