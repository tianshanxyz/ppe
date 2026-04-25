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
      if (res.statusCode === 302 || res.statusCode === 301) {
        const loc = res.headers.location;
        if (loc) { fetchJson(loc).then(resolve).catch(reject); } else { reject(new Error(`Redirect without location`)); }
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function enrichFrom510k() {
  console.log('\n=== Enrich Manufacturers from FDA 510k ===\n');
  let totalEnriched = 0;
  let totalNewMfrs = 0;

  const keywords = [
    'surgical mask', 'n95', 'respirator', 'examination glove', 'surgical gown',
    'face shield', 'isolation gown', 'protective goggle', 'nitrile glove',
    'latex glove', 'surgical cap', 'protective clothing', 'coverall',
    'disposable mask', 'medical mask', 'surgical glove', 'procedure glove',
    'safety goggle', 'medical face shield', 'sterile glove', 'shoe cover',
    'kn95', 'ffp2', 'ffp3', 'half mask', 'full facepiece',
    'patient examination glove', 'surgeon glove', 'chemotherapy glove',
    'protective garment', 'surgical drape', 'isolation drape',
    'bouffant cap', 'head cover', 'boot cover', 'overshoe',
    'protective hood', 'lab coat', 'scrub suit', 'apron',
  ];

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;

    for (let page = 0; page < 30; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_KEY}&search=device_name:${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.applicant || '';
          const country = (item.country_code || 'US').substring(0, 2);
          const kNumber = item.k_number || '';
          const productCode = item.product_code || '';

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

async function enrichFromDescription() {
  console.log('\n=== Enrich Manufacturers from Description ===\n');
  let enriched = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null);

  console.log(`Products without manufacturer_name: ${count.toLocaleString()}`);

  while (offset < count + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description')
      .is('manufacturer_name', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const desc = p.description || '';
      const ownerMatch = desc.match(/Owner:\s*([^,\n]+)/i);
      const applicantMatch = desc.match(/Applicant:\s*([^,\n]+)/i);
      const mfrMatch = desc.match(/Manufacturer:\s*([^,\n]+)/i);

      const mfrName = ownerMatch?.[1] || applicantMatch?.[1] || mfrMatch?.[1];
      if (mfrName && mfrName.trim().length > 2 && mfrName.trim() !== 'Unknown') {
        const { error } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName.trim() })
          .eq('id', p.id);
        if (!error) enriched++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  Offset ${offset}: enriched ${enriched}`);
    }
  }

  console.log(`  ✅ Enriched from description: ${enriched}`);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Manufacturer Enrichment V2');
  console.log('='.repeat(60));

  const command = process.argv[2] || 'all';

  if (command === 'all' || command === '510k') {
    await enrichFrom510k();
  }

  if (command === 'all' || command === 'desc') {
    await enrichFromDescription();
  }

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);

  console.log(`\n  Database: ${p.toLocaleString()} products, ${m.toLocaleString()} manufacturers`);
  console.log(`  Missing manufacturer_name: ${mfrNull.toLocaleString()} (${(mfrNull / p * 100).toFixed(1)}%)`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
