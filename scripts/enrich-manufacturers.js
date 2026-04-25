#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function enrichManufacturersFromFDA510k() {
  console.log('\n=== Enrich Manufacturers from FDA 510k ===\n');
  let totalEnriched = 0;
  let totalNewMfrs = 0;

  const ppeKeywords = [
    'surgical mask', 'n95', 'respirator', 'examination glove', 'surgical gown',
    'face shield', 'isolation gown', 'protective goggle', 'nitrile glove',
    'latex glove', 'surgical cap', 'protective clothing', 'coverall',
    'disposable mask', 'medical mask', 'surgical glove', 'procedure glove',
    'safety goggle', 'medical face shield', 'sterile glove', 'shoe cover',
  ];

  for (const keyword of ppeKeywords) {
    const limit = 100;
    let skip = 0;

    for (let page = 0; page < 20; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_KEY}&search=device_name:${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.applicant || '';
          const country = (item.country_code || 'US').substring(0, 2);
          const kNumber = item.k_number || '';
          const productCode = item.product_code || '';
          const deviceName = item.device_name || '';

          if (!applicant) continue;

          const { error: mfrError } = await supabase
            .from('ppe_manufacturers')
            .insert({ name: applicant, country, website: '' });
          if (!mfrError) totalNewMfrs++;

          if (kNumber) {
            const { data: existing } = await supabase
              .from('ppe_products')
              .select('id, manufacturer_name')
              .like('model', `%${kNumber}%`)
              .is('manufacturer_name', null)
              .limit(1);

            if (existing && existing.length > 0) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ manufacturer_name: applicant, product_code: productCode || undefined, country_of_origin: country })
                .eq('id', existing[0].id);
              if (!error) totalEnriched++;
            }
          }
        }

        skip += limit;
        await sleep(400);
      } catch (e) {
        break;
      }
    }

    console.log(`  "${keyword}": enriched ${totalEnriched}, new mfrs ${totalNewMfrs}`);
  }

  console.log(`\n  ✅ Total enriched: ${totalEnriched}, new manufacturers: ${totalNewMfrs}`);
}

async function enrichManufacturersFromFDARegistration() {
  console.log('\n=== Enrich Manufacturers from FDA Registration ===\n');
  let totalEnriched = 0;
  let totalNewMfrs = 0;

  const ppeCodes = ['FXX', 'FXS', 'MSH', 'KZE', 'QKR', 'LYU', 'OEA', 'MSL', 'LIT', 'LZG', 'LZJ', 'KCC', 'JKA', 'NHF', 'MFA', 'KIF', 'MSM', 'LXG', 'LZS', 'LZU', 'LZV', 'NHL', 'NHM', 'NXF', 'OEM'];

  for (const code of ppeCodes) {
    const url = `https://api.fda.gov/device/registrationlisting.json?api_key=${FDA_KEY}&search=product_codes:${code}&limit=100`;
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      for (const item of data.results) {
        const firms = item.firm || [];
        for (const firm of firms) {
          const name = firm.firm_name || '';
          const country = (firm.country_code || 'US').substring(0, 2);

          if (!name) continue;

          const { error } = await supabase
            .from('ppe_manufacturers')
            .insert({ name, country, website: firm.website || '' });
          if (!error) totalNewMfrs++;

          const devices = firm.device || [];
          for (const dev of devices) {
            if (dev.product_code === code) {
              const { data: existing } = await supabase
                .from('ppe_products')
                .select('id, manufacturer_name')
                .eq('product_code', code)
                .is('manufacturer_name', null)
                .limit(1);

              if (existing && existing.length > 0) {
                const { error: uErr } = await supabase
                  .from('ppe_products')
                  .update({ manufacturer_name: name, country_of_origin: country })
                  .eq('id', existing[0].id);
                if (!uErr) totalEnriched++;
              }
            }
          }
        }
      }

      console.log(`  ${code}: enriched ${totalEnriched}, new mfrs ${totalNewMfrs}`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${code}: ${e.message}`);
    }
  }

  console.log(`\n  ✅ Total enriched: ${totalEnriched}, new manufacturers: ${totalNewMfrs}`);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Manufacturer Enrichment');
  console.log('='.repeat(60));

  const command = process.argv[2] || 'all';

  if (command === 'all' || command === '510k') {
    await enrichManufacturersFromFDA510k();
  }

  if (command === 'all' || command === 'reg') {
    await enrichManufacturersFromFDARegistration();
  }

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);

  console.log(`\n  Database: ${p} products, ${m} manufacturers`);
  console.log(`  Missing manufacturer_name: ${mfrNull}`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
