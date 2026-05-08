#!/usr/bin/env node
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== NIOSH CEL PPE Collector v2 ===');
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

  let ins = 0, mfrIns = 0;

  async function insProd(prod) {
    const k = `${prod.name.toLowerCase()}|${(prod.manufacturer_name||'').toLowerCase()}|${(prod.product_code||'').toLowerCase()}`;
    if (keys.has(k)) return false;
    const { error } = await supabase.from('ppe_products').insert(prod);
    if (!error) {
      keys.add(k); ins++;
      const m = prod.manufacturer_name;
      if (m && m !== 'Unknown' && !mfrSet.has(m.toLowerCase().trim())) {
        await supabase.from('ppe_manufacturers').insert({
          name: m.substring(0,500), country: 'US',
          data_source: 'NIOSH CEL', last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        });
        mfrSet.add(m.toLowerCase().trim()); mfrIns++;
      }
      return true;
    }
    return false;
  }

  console.log('\n=== NIOSH CEL - Filtering Facepiece Respirators ===');

  // Table: #altstripe
  // Cols: Schedule | Approval(TC#) | Manufacturer Name | Facepiece Type | Model
  const queries = [
    { label: 'All FFRs', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece' },
    { label: 'N95', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece&contaminants=40' },
    { label: 'N99', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece&contaminants=39' },
    { label: 'N100', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece&contaminants=38' },
    { label: 'R95', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece&contaminants=37' },
    { label: 'P95', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece&contaminants=34' },
    { label: 'P100', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece&contaminants=32' },
    { label: 'Surgical N95', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?Schedule=84A&FacepieceType=Filtering+Facepiece&contaminants=60&contaminants=40' },
    { label: 'Half Mask N95', url: 'https://wwwn.cdc.gov/NIOSH-CEL/Results?Schedule=84A&FacepieceType=Half+Mask&Precision=inclusive&contaminants=40' },
  ];

  let nioshTotal = 0;
  let allRows = new Set(); // dedup across queries

  for (const q of queries) {
    try {
      console.log(`\n  ${q.label}:`);
      const { data } = await axios.get(q.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        timeout: 30000,
      });

      const $ = cheerio.load(data);
      const rows = [];

      $('table#altstripe tbody tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 4) return;

        // Col 0: Schedule | Col 1: Approval(TC#) | Col 2: Manufacturer | Col 3: Facepiece Type | Col 4: Model
        const schedule = $(cells[0]).text().trim();
        const approval = $(cells[1]).text().trim();
        const mfr = $(cells[2]).text().trim();
        const facepieceType = $(cells[3]).text().trim();
        const model = $(cells[4]).text().trim();

        if (!model || model.length < 2 || !mfr || mfr.length < 2) return;
        if (mfr === 'Manufacturer Name') return;

        const rowKey = `${mfr}|${model}|${approval}`;
        if (allRows.has(rowKey)) return;
        allRows.add(rowKey);
        rows.push({ mfr, model, approval, schedule, facepieceType });
      });

      console.log(`    原始: ${rows.length}条`);

      let qIns = 0;
      for (const row of rows) {
        const name = `${row.mfr} ${row.model} NIOSH-Certified ${row.facepieceType || 'Respirator'}`.substring(0, 500);
        const prod = {
          name, category: '呼吸防护装备',
          manufacturer_name: row.mfr.substring(0, 500),
          product_code: `NIOSH ${row.approval}`,
          country_of_origin: 'US',
          risk_level: 'high',
          data_source: 'NIOSH CEL',
          registration_authority: 'NIOSH',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };
        if (await insProd(prod)) { qIns++; nioshTotal++; }
      }

      console.log(`    新增: +${qIns}条`);
      await sleep(1000);
    } catch (e) {
      console.log(`    错误: ${e.response?.status||e.code}`);
    }
  }

  console.log(`\n  NIOSH总计: +${nioshTotal}条 (去重后)`);

  const elapsed = ((Date.now()-t0)/1000).toFixed(0);
  console.log(`\n=== 完成(${elapsed}s) ===`);
  console.log(`总新增: ${ins}, 新制造商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(console.error);
