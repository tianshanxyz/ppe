#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const BASE = 'https://health-products.canada.ca/api/medical-devices/device?lang=eng&type=json&state=active&limit=100&term=';

function ppeFilter(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('mask') && (n.includes('surgical') || n.includes('medical') || n.includes('procedure') || n.includes('face'))) return '呼吸防护装备';
  if (n.includes('respirator') || n.includes('n95') || n.includes('respiratory')) return '呼吸防护装备';
  if (n.includes('glove') && (n.includes('surgical') || n.includes('examination') || n.includes('exam') || n.includes('medical') || n.includes('procedure'))) return '手部防护装备';
  if (n.includes('goggle') || n.includes('face shield') || n.includes('faceshield') || n.includes('eye protector')) return '眼面部防护装备';
  if (n.includes('safety helmet') || n.includes('protective helmet')) return '头部防护装备';
  if (n.includes('earplug') || n.includes('ear muff') || n.includes('earmuff') || n.includes('hearing protect')) return '听觉防护装备';
  if (n.includes('safety shoe') || n.includes('safety boot') || n.includes('protective foot')) return '足部防护装备';
  if ((n.includes('gown') || n.includes('coverall') || n.includes('protective suit') || n.includes('protective clothing') || n.includes('protective apparel') || n.includes('isolation')) && (n.includes('surgical') || n.includes('medical') || n.includes('protective') || n.includes('disposable') || n.includes('isolation'))) return '身体防护装备';
  if (n.includes('shoe cover') || n.includes('boot cover') || n.includes('bouffant') || n.includes('surgical cap') || n.includes('surgical hood') || n.includes('scrub cap')) return '其他';
  return null;
}

async function main() {
  console.log('=== Health Canada MDALL PPE v2 ===');
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
      try {
        const { error } = await supabase.from('ppe_products').insert(prod);
        if (!error) {
          keys.add(k); ins++;
          const m = prod.manufacturer_name;
          if (m && m !== 'Unknown' && !mfrSet.has(m.toLowerCase().trim())) {
            try {
              await supabase.from('ppe_manufacturers').insert({
                name: m.substring(0,500), country: 'CA',
                data_source: 'Health Canada MDALL', last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              });
            } catch(e) {}
            mfrSet.add(m.toLowerCase().trim()); mfrIns++;
          }
        }
      } catch(e) {}
    }
  }

  const terms = ['surgical mask', 'respirator', 'N95', 'face shield', 'surgical gown', 'isolation gown', 'surgical glove', 'examination glove', 'goggle', 'shoe cover', 'coverall', 'bouffant cap', 'surgical cap', 'earplug'];

  for (const term of terms) {
    try {
      console.log(`  搜索: "${term}"...`);
      const { data } = await axios.get(BASE + encodeURIComponent(term), { timeout: 15000 });
      const devices = data || [];
      console.log(`    返回: ${devices.length}条`);

      for (const dev of devices) {
        const name = (dev.trade_name || dev.device_name || '').trim();
        if (!name || name.length < 2) continue;

        const cat = ppeFilter(name);
        if (!cat) continue;

        const dedupKey = `${name}|${dev.original_licence_no}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        batch.push({
          name: name.substring(0, 500),
          category: cat,
          manufacturer_name: 'Health Canada Licensee',
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
      }

      await flush();
      console.log(`    PPE累计: ${total}, 新增: ${ins}`);
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  await flush();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n=== HC完成(${elapsed}s): ${total}PPE, +${ins}新, +${mfrIns}厂商 ===`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
