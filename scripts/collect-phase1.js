#!/usr/bin/env node
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Accept': 'application/json' },
      timeout: 30000,
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Parse error: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|scba/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|protective.cloth/i.test(n)) return '身体防护装备';
  if (/harness|lanyard|fall.*protect|safety.*belt/i.test(n)) return '坠落防护装备';
  return '其他';
}

function getRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas.mask|chemical|n95/i.test(n)) return 'high';
  if (/helmet|goggle|glove|boot|surgical.mask/i.test(n)) return 'medium';
  return 'low';
}

async function fetchAll(table, columns) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('TGA澳大利亚 + FDA MAUDE + 坠落防护 + MHRA英国 综合采集');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number');
  const existingKeys = new Set();
  const existingRegKeys = new Set();
  existingProducts.forEach(p => {
    existingKeys.add(`${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}`);
    if (p.registration_number) existingRegKeys.add(p.registration_number.trim());
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name||'').toLowerCase().trim()));

  let totalInserted = 0;

  async function insertProduct(product) {
    const key = `${product.name.toLowerCase()}|${(product.manufacturer_name||'').toLowerCase()}`;
    const regKey = product.registration_number || '';
    if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) return false;

    const { error } = await supabase.from('ppe_products').insert(product);
    if (!error) {
      existingKeys.add(key);
      if (regKey) existingRegKeys.add(regKey);
      totalInserted++;

      const mfrName = product.manufacturer_name;
      if (mfrName && mfrName !== 'Unknown' && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
        await supabase.from('ppe_manufacturers').insert({
          name: mfrName.substring(0, 500),
          country: product.country_of_origin || 'Unknown',
          data_source: product.data_source,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: product.data_confidence_level || 'medium',
        });
        existingMfrNames.add(mfrName.toLowerCase().trim());
      }
      return true;
    }
    return false;
  }

  // ===== 1. TGA Australia =====
  console.log('\n========== 1. TGA澳大利亚 ==========');
  const tgaKeywords = [
    'surgical mask', 'respirator', 'protective glove', 'examination glove',
    'protective gown', 'isolation gown', 'face shield', 'safety helmet',
    'hearing protection', 'protective clothing', 'safety boot', 'safety glasses',
    'fall protection', 'safety harness', 'nitrile glove', 'latex glove',
    'coverall', 'hazmat suit', 'welding helmet', 'hard hat'
  ];

  let tgaInserted = 0;
  for (const keyword of tgaKeywords) {
    try {
      const url = `https://tga-search.clients.funnelback.com/s/search.json?collection=tga-artg&query=${encodeURIComponent(keyword)}&num=100&start_rank=1`;
      console.log(`  搜索: ${keyword}...`);
      const result = await fetchJSON(url);

      const items = result?.response?.resultPacket?.results || [];
      let kwCount = 0;
      for (const item of items) {
        const name = item.title || item.metadata?.c?.artgProductName?.[0] || '';
        const mfr = item.metadata?.c?.artgSponsor?.[0] || 'Unknown';
        const regNum = item.metadata?.c?.artgId?.[0] || '';

        if (!name) continue;
        const category = categorizePPE(name);
        const riskLevel = getRiskLevel(name);

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: mfr.substring(0, 500),
          country_of_origin: 'AU',
          product_code: regNum.substring(0, 100),
          risk_level: riskLevel,
          data_source: 'TGA ARTG',
          registration_number: regNum ? `TGA-${regNum}` : '',
          registration_authority: 'TGA Australia',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) { kwCount++; tgaInserted++; }
      }
      if (kwCount > 0) console.log(`    ${keyword}: ${kwCount}条`);
      await sleep(500);
    } catch (e) {
      console.log(`    ${keyword}: ${e.message}`);
    }
  }
  console.log(`  TGA总计: ${tgaInserted}`);

  // ===== 2. FDA MAUDE Adverse Events =====
  console.log('\n========== 2. FDA MAUDE不良事件 ==========');
  const maudeProductCodes = ['MSH', 'MWI', 'FXX', 'CXS', 'DXC', 'KZE', 'LZG', 'LXG', 'LZJ', 'LXJ', 'LZC', 'LXC', 'LZF', 'LXF', 'LZS', 'LXS', 'LZT', 'LXT', 'LZU', 'LXU', 'LZV', 'LXV', 'LZW', 'LXW', 'LZY', 'LXY', 'LZZ', 'LXZ', 'LYA', 'LYB', 'LYC', 'LYD', 'LYE', 'LYF', 'LYG', 'LYH', 'LYI', 'LYJ', 'LYK', 'LYL', 'LYM', 'LYN', 'LYO', 'LYP', 'LYQ', 'LYR', 'LYS', 'LYT', 'LYU', 'LYV', 'LYW', 'LYX', 'LYY', 'LYZ'];

  let maudeInserted = 0;
  for (const code of maudeProductCodes.slice(0, 20)) {
    try {
      const url = `https://api.fda.gov/device/event.json?search=device.product_code:${code}&limit=100`;
      const result = await fetchJSON(url);
      const events = result?.results || [];

      let codeCount = 0;
      for (const event of events) {
        const device = event.device?.[0] || {};
        const name = device.brand_name || device.generic_name || '';
        const mfr = device.manufacturer_d_name || 'Unknown';
        const regNum = device.device_report_product_code || code;

        if (!name) continue;
        const category = categorizePPE(name);

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: mfr.substring(0, 500),
          country_of_origin: 'US',
          product_code: regNum.substring(0, 100),
          risk_level: 'high',
          data_source: 'FDA MAUDE',
          registration_number: `MAUDE-${event.mdr_report_key || ''}`,
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'medium',
          specifications: JSON.stringify({
            event_type: event.event_type || '',
            report_date: event.date_received || '',
            report_key: event.mdr_report_key || '',
          }),
        };

        if (await insertProduct(product)) { codeCount++; maudeInserted++; }
      }
      if (codeCount > 0) console.log(`    ${code}: ${codeCount}条`);
      await sleep(600);
    } catch (e) {
      // Rate limited or no data
    }
  }
  console.log(`  MAUDE总计: ${maudeInserted}`);

  // ===== 3. Fall Protection PPE (FDA product codes) =====
  console.log('\n========== 3. 坠落防护PPE ==========');
  const fallProtectionCodes = ['DPF', 'LSJ', 'LPK', 'LQE', 'LXH', 'LZH', 'LXI', 'LZI', 'LXK', 'LZK'];

  let fallInserted = 0;
  for (const code of fallProtectionCodes) {
    try {
      const url = `https://api.fda.gov/device/510k.json?search=device.product_code:${code}&limit=100`;
      const result = await fetchJSON(url);
      const items = result?.results || [];

      let codeCount = 0;
      for (const item of items) {
        const name = item.device_name || '';
        const mfr = item.applicant || 'Unknown';
        const kNumber = item.k_number || '';

        if (!name) continue;

        const product = {
          name: name.substring(0, 500),
          category: '坠落防护装备',
          manufacturer_name: mfr.substring(0, 500),
          country_of_origin: 'US',
          product_code: code,
          risk_level: 'high',
          data_source: 'FDA 510(k) Database',
          registration_number: kNumber,
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) { codeCount++; fallInserted++; }
      }
      if (codeCount > 0) console.log(`    ${code}: ${codeCount}条`);
      await sleep(600);
    } catch (e) {
      // Rate limited or no data
    }
  }
  console.log(`  坠落防护总计: ${fallInserted}`);

  // ===== 4. UK MHRA =====
  console.log('\n========== 4. 英国MHRA ==========');
  const mhraKeywords = [
    'surgical mask', 'respirator', 'protective glove', 'face shield',
    'protective gown', 'isolation gown', 'safety helmet', 'safety boot',
    'hearing protection', 'protective clothing', 'fall protection',
    'nitrile glove', 'coverall', 'safety glasses', 'welding helmet'
  ];

  let mhraInserted = 0;
  for (const keyword of mhraKeywords) {
    try {
      const url = `https://devices.mhra.gov.uk/api/devices?search=${encodeURIComponent(keyword)}&pageSize=100&page=0`;
      console.log(`  搜索: ${keyword}...`);
      const result = await fetchJSON(url);
      const items = result?.devices || result?.content || result?.data || [];

      let kwCount = 0;
      for (const item of Array.isArray(items) ? items : []) {
        const name = item.deviceName || item.name || item.tradeName || '';
        const mfr = item.manufacturerName || item.manufacturer || 'Unknown';
        const regNum = item.deviceId || item.id || '';

        if (!name) continue;
        const category = categorizePPE(name);
        const riskLevel = getRiskLevel(name);

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: mfr.substring(0, 500),
          country_of_origin: 'GB',
          product_code: regNum.substring(0, 100),
          risk_level: riskLevel,
          data_source: 'MHRA UK',
          registration_number: regNum ? `MHRA-${regNum}` : '',
          registration_authority: 'MHRA UK',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) { kwCount++; mhraInserted++; }
      }
      if (kwCount > 0) console.log(`    ${keyword}: ${kwCount}条`);
      await sleep(500);
    } catch (e) {
      console.log(`    ${keyword}: ${e.message}`);
    }
  }
  console.log(`  MHRA总计: ${mhraInserted}`);

  // ===== Summary =====
  console.log('\n========================================');
  console.log('Phase 1 采集完成');
  console.log('========================================');
  console.log(`  TGA澳大利亚: ${tgaInserted}`);
  console.log(`  FDA MAUDE: ${maudeInserted}`);
  console.log(`  坠落防护: ${fallInserted}`);
  console.log(`  MHRA英国: ${mhraInserted}`);
  console.log(`  新增产品总计: ${totalInserted}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
