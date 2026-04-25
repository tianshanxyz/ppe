#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const FDA_BASE = 'https://api.fda.gov';
const HC_BASE = 'https://health-products.canada.ca/api/medical-devices';

const PPE_CODES = {
  'FXX': { name: 'Surgical Mask', cat: '呼吸防护装备', risk: 'II' },
  'FXS': { name: 'Surgical Respirator', cat: '呼吸防护装备', risk: 'II' },
  'MSH': { name: 'Patient Examination Glove', cat: '手部防护装备', risk: 'I' },
  'KZE': { name: "Surgeon's Glove", cat: '手部防护装备', risk: 'I' },
  'QKR': { name: 'Examination Glove', cat: '手部防护装备', risk: 'I' },
  'LYU': { name: 'Surgical Gown', cat: '身体防护装备', risk: 'II' },
  'OEA': { name: 'Surgical Cap', cat: '头部防护装备', risk: 'I' },
  'MSL': { name: 'Respirator', cat: '呼吸防护装备', risk: 'II' },
  'MSM': { name: 'Respirator, Non-Powered', cat: '呼吸防护装备', risk: 'II' },
  'JKA': { name: 'Protective Garment', cat: '身体防护装备', risk: 'II' },
  'JJC': { name: 'Protective Garment, Surgical', cat: '身体防护装备', risk: 'II' },
  'KIF': { name: 'Surgical Mask, Respirator', cat: '呼吸防护装备', risk: 'II' },
  'LIT': { name: 'Face Shield', cat: '眼面部防护装备', risk: 'I' },
  'LZG': { name: 'Protective Goggles', cat: '眼面部防护装备', risk: 'I' },
  'LXG': { name: 'Protective Eyewear', cat: '眼面部防护装备', risk: 'I' },
  'MFA': { name: 'Medical Glove', cat: '手部防护装备', risk: 'I' },
  'LZS': { name: 'Surgical Gown, Level 4', cat: '身体防护装备', risk: 'II' },
  'LZU': { name: 'Surgical Gown, Level 2', cat: '身体防护装备', risk: 'II' },
  'LZV': { name: 'Surgical Gown, Level 1', cat: '身体防护装备', risk: 'I' },
  'NHF': { name: 'N95 Respirator', cat: '呼吸防护装备', risk: 'II' },
  'NHL': { name: 'N99 Respirator', cat: '呼吸防护装备', risk: 'II' },
  'NHM': { name: 'N100 Respirator', cat: '呼吸防护装备', risk: 'II' },
  'NXF': { name: 'Non-Powered Air-Purifying Respirator', cat: '呼吸防护装备', risk: 'II' },
  'OEM': { name: 'Surgical Mask, Anti-Fog', cat: '呼吸防护装备', risk: 'II' },
  'LZJ': { name: 'Isolation Gown', cat: '身体防护装备', risk: 'I' },
  'KCC': { name: 'Protective Clothing', cat: '身体防护装备', risk: 'II' },
  'KCD': { name: 'Protective Clothing, Surgical', cat: '身体防护装备', risk: 'II' },
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function upsertRecords(table, records, uniqueKey) {
  if (!records || records.length === 0) return 0;
  let inserted = 0;
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase.from(table).insert(batch).select();
    if (error) {
      for (const record of batch) {
        const { error: singleErr } = await supabase.from(table).insert(record);
        if (!singleErr) inserted++;
      }
    } else {
      inserted += data.length;
    }
    await sleep(100);
  }
  return inserted;
}

async function collectFDA510kWithManufacturers() {
  console.log('\n=== FDA 510(k) + Manufacturers ===\n');
  let totalProducts = 0;
  let totalMfrs = 0;

  for (const [code, info] of Object.entries(PPE_CODES)) {
    const limit = 100;
    let skip = 0;
    let codeProducts = 0;
    let codeMfrs = 0;

    for (let page = 0; page < 100; page++) {
      const url = `${FDA_BASE}/device/510k.json?api_key=${FDA_KEY}&search=product_code:${code}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        const mfrRecords = [];
        const prodRecords = [];

        for (const item of data.results) {
          const mfrName = item.applicant || item.contact || '';
          const mfrCountry = (item.country_code || item.country || 'US').substring(0, 2);
          
          if (mfrName) {
            mfrRecords.push({
              name: mfrName,
              country: mfrCountry || 'US',
              website: '',
            });
          }

          prodRecords.push({
            name: item.device_name || info.name,
            model: `${item.product_code || code}_${item.k_number || ''}`,
            category: info.cat,
            subcategory: info.name,
            description: item.statement_or_summary || '',
            manufacturer_name: mfrName,
            country_of_origin: mfrCountry || 'US',
            product_code: item.product_code || code,
            product_category: info.name,
            risk_level: info.risk,
            updated_at: new Date().toISOString(),
          });
        }

        if (mfrRecords.length > 0) {
          const mfrInserted = await upsertRecords('ppe_manufacturers', mfrRecords);
          codeMfrs += mfrInserted;
        }

        const prodInserted = await upsertRecords('ppe_products', prodRecords);
        codeProducts += prodInserted;
        totalProducts += prodInserted;

        skip += limit;
        await sleep(400);
      } catch (e) {
        if (e.message.includes('400') || e.message.includes('404')) break;
        await sleep(2000);
      }
    }

    totalMfrs += codeMfrs;
    if (codeProducts > 0 || codeMfrs > 0) {
      console.log(`  ${code} (${info.name}): ${codeProducts} products, ${codeMfrs} manufacturers`);
    }
  }

  console.log(`\n  Total: ${totalProducts} products, ${totalMfrs} manufacturers`);
  return { products: totalProducts, manufacturers: totalMfrs };
}

async function collectFDARegistrationWithManufacturers() {
  console.log('\n=== FDA Registration + Manufacturers ===\n');
  let totalProducts = 0;
  let totalMfrs = 0;

  for (const [code, info] of Object.entries(PPE_CODES)) {
    const limit = 100;
    let skip = 0;
    let codeProducts = 0;
    let codeMfrs = 0;

    for (let page = 0; page < 30; page++) {
      const url = `${FDA_BASE}/device/registrationlisting.json?api_key=${FDA_KEY}&search=products.product_code:${code}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        const mfrRecords = [];
        const prodRecords = [];

        for (const item of data.results) {
          const mfrName = item.owner_operator_name || '';
          const mfrCountry = item.owner_operator_country || 'US';
          const regNumber = item.registration_number || '';

          if (mfrName) {
            mfrRecords.push({
              name: mfrName,
              country: mfrCountry,
              website: '',
            });
          }

          const products = item.products || [];
          for (const prod of products) {
            if (prod.product_code === code || PPE_CODES[prod.product_code]) {
              prodRecords.push({
                name: prod.product_name || info.name,
                model: prod.product_code || code,
                category: PPE_CODES[prod.product_code]?.cat || info.cat,
                subcategory: PPE_CODES[prod.product_code]?.name || info.name,
                description: `Registration: ${regNumber}, Owner: ${mfrName}`,
                manufacturer_name: mfrName,
                country_of_origin: mfrCountry,
                product_code: prod.product_code || code,
                product_category: PPE_CODES[prod.product_code]?.name || info.name,
                risk_level: PPE_CODES[prod.product_code]?.risk || info.risk,
                updated_at: new Date().toISOString(),
              });
            }
          }
        }

        if (mfrRecords.length > 0) {
          const mfrInserted = await upsertRecords('ppe_manufacturers', mfrRecords);
          codeMfrs += mfrInserted;
        }

        const prodInserted = await upsertRecords('ppe_products', prodRecords);
        codeProducts += prodInserted;
        totalProducts += prodInserted;

        skip += limit;
        await sleep(400);
      } catch (e) {
        if (e.message.includes('400') || e.message.includes('404')) break;
        await sleep(2000);
      }
    }

    totalMfrs += codeMfrs;
    if (codeProducts > 0 || codeMfrs > 0) {
      console.log(`  ${code} (${info.name}): ${codeProducts} products, ${codeMfrs} manufacturers`);
    }
  }

  console.log(`\n  Total: ${totalProducts} products, ${totalMfrs} manufacturers`);
  return { products: totalProducts, manufacturers: totalMfrs };
}

async function collectHealthCanadaWithManufacturers() {
  console.log('\n=== Health Canada MDALL + Manufacturers ===\n');
  let totalProducts = 0;
  let totalMfrs = 0;

  const keywords = [
    'glove', 'mask', 'respirator', 'gown', 'face shield', 'goggle',
    'surgical', 'isolation', 'protective', 'nitrile', 'n95',
    'coverall', 'examination', 'disposable', 'ppe', 'cap', 'boot'
  ];

  for (const keyword of keywords) {
    try {
      const url = `${HC_BASE}/device/?device_name=${encodeURIComponent(keyword)}&state=active&type=json`;
      const data = await fetchJson(url);
      const items = Array.isArray(data) ? data : [];

      const mfrRecords = [];
      const prodRecords = [];

      for (const item of items) {
        const mfrName = item.company_name || item.licence_name || '';
        const mfrCountry = 'CA';

        if (mfrName && mfrName !== item.device_name) {
          mfrRecords.push({ name: mfrName, country: mfrCountry, website: '' });
        }

        prodRecords.push({
          name: item.device_name || item.trade_name || 'Unknown',
          model: item.device_identifier || item.device_id || '',
          category: categorizeHC(item.device_name || ''),
          subcategory: 'Health Canada MDALL',
          description: `Licence: ${item.original_licence_no || ''}, Class: ${item.appl_risk_class || ''}`,
          manufacturer_name: mfrName,
          country_of_origin: 'CA',
          product_code: item.device_identifier || '',
          product_category: item.device_name || '',
          risk_level: item.appl_risk_class ? `Class ${item.appl_risk_class}` : '',
          updated_at: new Date().toISOString(),
        });
      }

      if (mfrRecords.length > 0) {
        const mfrInserted = await upsertRecords('ppe_manufacturers', mfrRecords);
        totalMfrs += mfrInserted;
      }

      const prodInserted = await upsertRecords('ppe_products', prodRecords);
      totalProducts += prodInserted;

      if (prodInserted > 0) console.log(`  ${keyword}: ${prodInserted} products, ${mfrRecords.length} manufacturers`);
      await sleep(500);
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }

  console.log(`\n  Total: ${totalProducts} products, ${totalMfrs} manufacturers`);
  return { products: totalProducts, manufacturers: totalMfrs };
}

async function collectHealthCanadaCompanies() {
  console.log('\n=== Health Canada Companies ===\n');
  let totalMfrs = 0;

  const keywords = ['glove', 'mask', 'respirator', 'gown', 'surgical', 'ppe', 'protective', 'nitrile', 'disposable'];

  for (const keyword of keywords) {
    try {
      const url = `${HC_BASE}/company/?company_name=${encodeURIComponent(keyword)}&type=json`;
      const data = await fetchJson(url);
      const items = Array.isArray(data) ? data : [];

      const mfrRecords = items.map(item => ({
        name: item.company_name || 'Unknown',
        country: item.country_cd || 'CA',
        website: '',
      }));

      if (mfrRecords.length > 0) {
        const mfrInserted = await upsertRecords('ppe_manufacturers', mfrRecords);
        totalMfrs += mfrInserted;
        console.log(`  ${keyword}: ${mfrInserted} companies`);
      }
      await sleep(500);
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }

  console.log(`\n  Total: ${totalMfrs} companies`);
  return totalMfrs;
}

function categorizeHC(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap')) return '头部防护装备';
  return '其他';
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Exhaustive Data Collection Engine');
  console.log('  Products + Manufacturers + Regulations');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  const results = {};

  if (command === 'all' || command === 'fda-510k') {
    results['fda-510k'] = await collectFDA510kWithManufacturers();
  }

  if (command === 'all' || command === 'fda-reg') {
    results['fda-reg'] = await collectFDARegistrationWithManufacturers();
  }

  if (command === 'all' || command === 'hc') {
    results['hc'] = await collectHealthCanadaWithManufacturers();
  }

  if (command === 'all' || command === 'hc-companies') {
    results['hc-companies'] = await collectHealthCanadaCompanies();
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Collection Summary');
  console.log('='.repeat(60));
  for (const [source, data] of Object.entries(results)) {
    if (data.products !== undefined) {
      console.log(`  ${source}: ${data.products} products, ${data.manufacturers} manufacturers`);
    } else {
      console.log(`  ${source}: ${data} records`);
    }
  }

  const { count: productCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: regCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log(`\n  Database totals:`);
  console.log(`    Products: ${productCount}`);
  console.log(`    Manufacturers: ${mfrCount}`);
  console.log(`    Regulations: ${regCount}`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
