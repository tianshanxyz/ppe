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

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove') || t.includes('nitrile') || t.includes('latex') || t.includes('vinyl')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95') || t.includes('ffp') || t.includes('filtering')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing') || t.includes('garment') || t.includes('apron') || t.includes('isolation')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear') || t.includes('visor')) return '眼面部防护装备';
  if (t.includes('cap') || t.includes('hood') || t.includes('bouffant')) return '头部防护装备';
  if (t.includes('boot') || t.includes('shoe') || t.includes('overshoe')) return '足部防护装备';
  return '其他';
}

async function collect510kKeywords() {
  console.log('\n=== FDA 510(k) Keyword Deep Search ===\n');
  let totalProducts = 0;
  let totalMfrs = 0;

  const keywords = [
    'surgical mask', 'n95 respirator', 'examination glove', 'surgical gown',
    'face shield', 'isolation gown', 'protective goggle', 'nitrile glove',
    'latex glove', 'surgical cap', 'protective clothing', 'coverall',
    'respirator', 'surgical glove', 'disposable mask', 'medical mask',
    'ffp2', 'ffp3', 'n99 respirator', 'n100 respirator',
    'half mask', 'full face respirator', 'powered respirator',
    'surgical scrub', 'shoe cover', 'bouffant cap',
    'protective eyewear', 'safety goggle', 'medical face shield',
    'patient examination glove', 'chemotherapy glove', 'cleanroom glove',
    'sterile glove', 'surgical hand glove', 'procedure glove',
    'level 1 gown', 'level 2 gown', 'level 3 gown', 'level 4 gown',
    'surgical isolation', 'non-surgical gown', 'protective apparel',
    'medical protective', 'ppe mask', 'ppe glove', 'ppe gown',
    'antiviral mask', 'bacterial filtration', 'particulate respirator',
    'air purifying respirator', 'supplied air respirator',
    'surgical respirator', 'healthcare mask', 'dental mask',
    'procedure mask', 'isolation mask', 'visitor mask',
  ];

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;
    let keywordTotal = 0;

    for (let page = 0; page < 30; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_KEY}&search=device_name:${encodeURIComponent(`"${keyword}"`)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const mfrName = item.applicant || item.contact || '';
          const mfrCountry = (item.country_code || 'US').substring(0, 2);

          if (mfrName) {
            const { error } = await supabase.from('ppe_manufacturers').insert({ name: mfrName, country: mfrCountry, website: '' });
            if (!error) totalMfrs++;
          }

          const record = {
            name: item.device_name || keyword,
            model: `${item.product_code || ''}_${item.k_number || ''}`,
            category: categorize(item.device_name || keyword),
            subcategory: `FDA 510k - ${keyword}`,
            description: `${item.statement_or_summary || ''} | Applicant: ${mfrName} | Date: ${item.decision_date || ''}`,
            manufacturer_name: mfrName,
            country_of_origin: mfrCountry,
            product_code: item.product_code || '',
            product_category: item.device_name || keyword,
            risk_level: '',
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('ppe_products').insert(record);
          if (!error) {
            totalProducts++;
            keywordTotal++;
          }
        }

        skip += limit;
        await sleep(400);
      } catch (e) {
        if (e.message.includes('404') || e.message.includes('400')) break;
        await sleep(2000);
      }
    }

    if (keywordTotal > 0) {
      console.log(`  "${keyword}": ${keywordTotal} products`);
    }
  }

  console.log(`\n  Total: ${totalProducts} products, ${totalMfrs} manufacturers`);
  return { products: totalProducts, manufacturers: totalMfrs };
}

async function collect510kByApplicant() {
  console.log('\n=== FDA 510(k) Top Applicant Search ===\n');
  let totalProducts = 0;
  let totalMfrs = 0;

  const topApplicants = [
    '3M', 'Kimberly Clark', 'Cardinal Health', 'Medline', 'Halyard',
    'Ansell', 'Molnlycke', 'Hartmann', 'Lohmann', 'KCI',
    'Mckesson', 'Owens Minor', 'Henry Schein', 'Patterson Dental',
    'Alpha Pro Tech', 'Lakeland Industries', 'DuPont', 'Honeywell',
    'Moldex', 'Gerson', 'Prestige Ameritech', 'Magnetrol',
    'Shanghai Dasheng', 'Suzhou Sanical', 'Tianjin Berens',
    'Nantong Runxin', 'Jiangsu Teyin', 'Guangzhou Powecom',
    'Weini Technology', 'Makrite', 'Crosstex', 'Curad',
    'Dynarex', 'Koch Filter', 'Matalex', 'Bio-Medical Devices',
  ];

  for (const applicant of topApplicants) {
    const limit = 100;
    let skip = 0;
    let applicantTotal = 0;

    for (let page = 0; page < 10; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_KEY}&search=applicant:${encodeURIComponent(`"${applicant}"`)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        const ppeResults = data.results.filter(item => {
          const name = (item.device_name || '').toLowerCase();
          return name.includes('mask') || name.includes('respirator') || name.includes('glove') ||
            name.includes('gown') || name.includes('protective') || name.includes('shield') ||
            name.includes('goggle') || name.includes('cap') || name.includes('isolation') ||
            name.includes('coverall') || name.includes('garment');
        });

        if (ppeResults.length === 0) { skip += limit; continue; }

        for (const item of ppeResults) {
          const mfrName = item.applicant || applicant;
          const mfrCountry = (item.country_code || 'US').substring(0, 2);

          const record = {
            name: item.device_name || 'PPE Device',
            model: `${item.product_code || ''}_${item.k_number || ''}`,
            category: categorize(item.device_name || ''),
            subcategory: `FDA 510k - ${applicant}`,
            description: `${item.statement_or_summary || ''} | K-Number: ${item.k_number || ''} | Date: ${item.decision_date || ''}`,
            manufacturer_name: mfrName,
            country_of_origin: mfrCountry,
            product_code: item.product_code || '',
            product_category: item.device_name || '',
            risk_level: '',
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('ppe_products').insert(record);
          if (!error) {
            totalProducts++;
            applicantTotal++;
          }
        }

        skip += limit;
        await sleep(400);
      } catch (e) {
        break;
      }
    }

    if (applicantTotal > 0) {
      console.log(`  "${applicant}": ${applicantTotal} PPE products`);
    }
  }

  console.log(`\n  Total: ${totalProducts} products`);
  return { products: totalProducts, manufacturers: totalMfrs };
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE FDA 510k Deep Keyword Collection');
  console.log('='.repeat(60));

  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'keywords') {
    await collect510kKeywords();
  }

  if (command === 'all' || command === 'applicants') {
    await collect510kByApplicant();
  }

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log(`\n  Database: ${p} products, ${m} manufacturers`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
