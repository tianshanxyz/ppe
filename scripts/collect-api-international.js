#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

function fetchJSON(url, timeout = 25000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'application/json' },
      timeout,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch { resolve(null); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|scba|breathing|air-purif|gas mask|papr|filter|cartridge/i.test(n)) return '呼吸防护装备';
  if (/glove|hand|luva|mangote|gauntlet/i.test(n)) return '手部防护装备';
  if (/goggle|eye|face shield|visor|ocular|spectacle/i.test(n)) return '眼面部防护装备';
  if (/helmet|head|capacete|hard hat|bump cap|hood/i.test(n)) return '头部防护装备';
  if (/boot|foot|shoe|bota|calçado|footwear|clog|wellington/i.test(n)) return '足部防护装备';
  if (/earplug|hearing|ear muff|auric|noise|acoustic/i.test(n)) return '听觉防护装备';
  if (/fall|harness|lanyard|anchor|queda|talabarte|cinto|srl|lifeline|arrest/i.test(n)) return '坠落防护装备';
  if (/coverall|suit|body|vestimenta|macacão|gown|apron|chemical suit|arc flash|thermal/i.test(n)) return '身体防护装备';
  if (/vest|jacket|coat|torso|colete|jaleco|shirt|rainwear/i.test(n)) return '躯干防护装备';
  return '其他';
}

function determineRisk(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|gas mask|papr|n95|ffp3|self-contained|breathing apparatus|fall|harness|chemical suit|arc flash|radiation/i.test(n)) return 'high';
  if (/helmet|boot|glove|goggle|eye|hearing|lanyard|srl/i.test(n)) return 'medium';
  return 'low';
}

async function main() {
  console.log('========================================');
  console.log('通过openFDA API获取国际PPE数据');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number');
  const existingKeys = new Set();
  const existingRegKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}`;
    existingKeys.add(key);
    if (p.registration_number) existingRegKeys.add(p.registration_number.trim());
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name || '').toLowerCase().trim()));

  let totalInserted = 0;
  let totalMfrInserted = 0;

  async function insertProduct(product) {
    const key = `${product.name.toLowerCase()}|${(product.manufacturer_name || '').toLowerCase()}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);

    const { error } = await supabase.from('ppe_products').insert(product);
    if (!error) {
      totalInserted++;
      const mfrName = product.manufacturer_name;
      if (mfrName && mfrName !== 'Unknown' && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
        const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
          name: mfrName.substring(0, 500),
          country: product.country_of_origin || 'Unknown',
          data_source: product.data_source,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: product.data_confidence_level || 'high',
        });
        if (!mfrErr) {
          existingMfrNames.add(mfrName.toLowerCase().trim());
          totalMfrInserted++;
        }
      }
      return true;
    }
    return false;
  }

  // ===== openFDA 510(k) - 获取国际制造商PPE产品 =====
  console.log('\n========== openFDA 510(k) 国际PPE数据 ==========');

  const ppeProductCodes = [
    'MSH', 'MSR', 'MST', 'OEA', 'OEB', 'OEC', 'OED',
    'KNC', 'KNG', 'KNK', 'LMA', 'LMB', 'LMC', 'LMD',
    'LZA', 'LZG', 'LYY', 'LYZ', 'FXX', 'JOM',
    'BZD', 'BZE', 'KKX', 'CFC', 'CFE', 'DSA', 'DSB',
    'HCC', 'FMI', 'FMK', 'FTL', 'FTM', 'NHA', 'NHB',
    'NSZ', 'LXG', 'LXH', 'LXI', 'LXJ', 'LXK',
  ];

  const targetCountries = ['BR', 'AU', 'IN', 'JP', 'KR', 'DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI'];
  let fdaCount = 0;

  for (const code of ppeProductCodes) {
    try {
      const url = `https://api.fda.gov/device/510k.json?search=device_class:2+AND+product_code:${code}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const device of result.results) {
        const name = device.device_name || device.trade_name || '';
        if (!name) continue;

        const mfrName = device.applicant || device.contact || 'Unknown';
        const country = device.country_code || device.countryoforigin || '';

        if (!targetCountries.includes(country)) continue;

        const product = {
          name: name.substring(0, 500),
          category: categorizePPE(name),
          manufacturer_name: mfrName.substring(0, 500),
          country_of_origin: country,
          product_code: code,
          risk_level: 'medium',
          data_source: 'FDA 510(k) International',
          registration_number: device.k_number || '',
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            k_number: device.k_number || '',
            product_code: code,
            device_class: device.device_class || '',
            decision_date: device.decision_date || '',
            review_panel: device.review_panel || '',
          }),
        };

        if (await insertProduct(product)) fdaCount++;
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }
  console.log(`  FDA 510(k) 国际PPE: ${fdaCount} 条`);

  // ===== openFDA PMA - 获取高风险PPE产品 =====
  console.log('\n========== openFDA PMA 国际PPE数据 ==========');
  let pmaCount = 0;

  for (const code of ppeProductCodes.slice(0, 15)) {
    try {
      const url = `https://api.fda.gov/device/pma.json?search=product_code:${code}&limit=50`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const device of result.results) {
        const name = device.trade_name || device.generic_name || '';
        if (!name) continue;

        const mfrName = device.applicant || 'Unknown';
        const country = device.country_code || '';

        if (!targetCountries.includes(country)) continue;

        const product = {
          name: name.substring(0, 500),
          category: categorizePPE(name),
          manufacturer_name: mfrName.substring(0, 500),
          country_of_origin: country,
          product_code: code,
          risk_level: 'high',
          data_source: 'FDA PMA International',
          registration_number: device.pma_number || '',
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            pma_number: device.pma_number || '',
            product_code: code,
            decision_date: device.decision_date || '',
            supplement_type: device.supplement_type || '',
          }),
        };

        if (await insertProduct(product)) pmaCount++;
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }
  console.log(`  FDA PMA 国际PPE: ${pmaCount} 条`);

  // ===== openFDA 注册列名 - 获取国际制造商 =====
  console.log('\n========== openFDA 注册列名 国际PPE数据 ==========');
  let regCount = 0;

  const regKeywords = ['respirator', 'glove', 'safety goggle', 'safety helmet', 'fall protection', 'hearing protection', 'safety boot'];

  for (const keyword of regKeywords) {
    try {
      const url = `https://api.fda.gov/device/registrationlisting.json?search=device_name:"${keyword}"&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const entry of result.results) {
        const devices = entry.devices || [];
        const owner = entry.owner_operator || {};
        const country = owner.country_code || '';

        if (!targetCountries.includes(country)) continue;

        for (const device of devices) {
          const name = device.device_name || '';
          if (!name) continue;

          const mfrName = owner.name_of_owner_operator || owner.name_of_company || 'Unknown';
          const productCode = device.product_code || '';

          const product = {
            name: name.substring(0, 500),
            category: categorizePPE(name),
            manufacturer_name: mfrName.substring(0, 500),
            country_of_origin: country,
            product_code: productCode,
            risk_level: determineRisk(name),
            data_source: 'FDA Registration International',
            registration_number: device.registration_number || '',
            registration_authority: 'FDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'medium',
            specifications: JSON.stringify({
              registration_number: device.registration_number || '',
              product_code: productCode,
              fei_number: owner.fei_number || '',
            }),
          };

          if (await insertProduct(product)) regCount++;
        }
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }
  console.log(`  FDA 注册列名 国际PPE: ${regCount} 条`);

  // ===== EUDAMED API - 获取更多国际PPE数据 =====
  console.log('\n========== EUDAMED API 国际PPE数据 ==========');
  let eudaCount = 0;

  const eudaKeywords = ['respirator', 'glove', 'safety', 'protection', 'ppe', 'mask', 'helmet', 'goggle', 'harness'];

  for (const keyword of eudaKeywords) {
    try {
      const url = `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?page=0&pageSize=100&iso2Code=en&languageIso2Code=en&keyword=${encodeURIComponent(keyword)}`;
      const result = await fetchJSON(url);
      if (!result || !result.content) continue;

      for (const device of result.content) {
        const name = device.tradeName || device.deviceName || '';
        if (!name) continue;

        const mfrName = device.manufacturerName || 'Unknown';
        const mfrCountry = device.manufacturerCountry || '';

        if (!targetCountries.includes(mfrCountry)) continue;

        const product = {
          name: name.substring(0, 500),
          category: categorizePPE(name),
          manufacturer_name: mfrName.substring(0, 500),
          country_of_origin: mfrCountry || 'EU',
          product_code: device.basicUdi || '',
          risk_level: device.riskClass?.code?.includes('class-iii') ? 'high' : device.riskClass?.code?.includes('class-iib') ? 'high' : 'medium',
          data_source: 'EUDAMED International',
          registration_number: device.primaryDi || device.uuid || '',
          registration_authority: 'EUDAMED',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            eudamed_uuid: device.uuid || '',
            basic_udi: device.basicUdi || '',
            primary_di: device.primaryDi || '',
            risk_class: device.riskClass?.code || '',
          }),
        };

        if (await insertProduct(product)) eudaCount++;
      }
      await sleep(1000);
    } catch (e) {
      // skip
    }
  }
  console.log(`  EUDAMED 国际PPE: ${eudaCount} 条`);

  // ===== 最终统计 =====
  console.log('\n========================================');
  console.log('API数据采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'category,country_of_origin');
  const catStats = {};
  const countryStats = {};
  finalProducts.forEach(p => {
    catStats[p.category || 'Unknown'] = (catStats[p.category || 'Unknown'] || 0) + 1;
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
  });

  console.log('\n缺口国家更新:');
  const gapCountries = { BR: '巴西', AU: '澳大利亚', IN: '印度', JP: '日本', KR: '韩国' };
  Object.entries(gapCountries).forEach(([code, name]) => {
    console.log(`  ${name}(${code}): ${countryStats[code] || 0} 条`);
  });

  const fallCount = catStats['坠落防护装备'] || 0;
  console.log(`  坠落防护装备: ${fallCount} 条`);

  console.log('\n全部API数据采集完成!');
}

main().catch(console.error);
