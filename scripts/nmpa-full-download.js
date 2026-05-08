#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function isPPE(name) {
  return /口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩|面具|衣|镜|靴|面屏|围裙/i.test(name || '');
}

function cat(n) {
  const s = (n || '');
  if (/口罩|mask|n95|kn95|ffp/i.test(s)) return '呼吸防护装备';
  if (/手套|glove/i.test(s)) return '手部防护装备';
  if (/护目镜|面罩|面屏|goggle/i.test(s)) return '眼面部防护装备';
  if (/安全帽|防护帽|helmet/i.test(s)) return '头部防护装备';
  if (/耳塞|耳罩|earplug/i.test(s)) return '听觉防护装备';
  if (/防护鞋|安全鞋|boot/i.test(s)) return '足部防护装备';
  if (/反光衣|反光背心|vest/i.test(s)) return '躯干防护装备';
  if (/防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit/i.test(s)) return '身体防护装备';
  return '其他';
}

async function main() {
  console.log('=== NMPA Full Dataset Download & Parse ===');
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

  let ins = 0, mfrIns = 0, nmpaIns = 0;
  let batch = [], batchSize = 50;

  async function flushBatch() {
    if (batch.length === 0) return;
    const toInsert = [...batch];
    batch = [];
    for (const prod of toInsert) {
      const k = `${prod.name.toLowerCase()}|${(prod.manufacturer_name||'').toLowerCase()}|${(prod.product_code||'').toLowerCase()}`;
      if (keys.has(k)) continue;
      const { error } = await supabase.from('ppe_products').insert(prod);
      if (!error) {
        keys.add(k); ins++; nmpaIns++;
        const m = prod.manufacturer_name;
        if (m && m !== 'Unknown' && !mfrSet.has(m.toLowerCase().trim())) {
          await supabase.from('ppe_manufacturers').insert({
            name: m.substring(0,500), country: 'CN',
            data_source: 'NMPA UDI Full', last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          }).catch(()=>{});
          mfrSet.add(m.toLowerCase().trim()); mfrIns++;
        }
      }
    }
  }

  // Download
  const fullUrl = 'https://udid.nmpa.gov.cn/attachments/attachment/download.html?path=A2E0C4E371D356DC134BE4F49B806211AF5D12A4AF10DF7941511F9C2F682881E69FA130D049D6DF285981599B74F17AF00F35CAD4F50C33892882C9D905B2BA';
  
  const filePath = '/tmp/nmpa_full_final.zip';
  
  if (!fs.existsSync(filePath)) {
    console.log('下载全量数据(284MB)...');
    const resp = await axios.get(fullUrl, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://udi.nmpa.gov.cn/download.html' },
      timeout: 600000,
    });
    const writer = fs.createWriteStream(filePath);
    let dl = 0;
    resp.data.on('data', c => {
      dl += c.length;
      if (dl % (30*1024*1024) < 65536) process.stdout.write(`\r  ${(dl/1024/1024).toFixed(0)}MB...`);
    });
    resp.data.pipe(writer);
    await new Promise((res, rej) => { writer.on('finish', res); writer.on('error', rej); });
    console.log(`\n下载完成: ${(dl/1024/1024).toFixed(0)}MB`);
  } else {
    console.log('使用缓存: ' + filePath);
  }

  // Parse
  console.log('\n解析全量数据...');
  const parser = new xml2js.Parser({ explicitArray: false });
  const fullZip = new AdmZip(filePath);
  const entries = fullZip.getEntries().filter(e => e.entryName.endsWith('.zip'));
  console.log(`共${entries.length}个压缩包`);

  let processed = 0;
  for (let ei = 0; ei < entries.length; ei++) {
    const entry = entries[ei];
    try {
      const innerZip = new AdmZip(entry.getData());
      const xmlEntries = innerZip.getEntries().filter(e => e.entryName.endsWith('.xml'));
      
      for (const xmlE of xmlEntries) {
        const parsed = await parser.parseStringPromise(xmlE.getData().toString('utf-8'));
        const devices = parsed?.udid?.devices?.device;
        if (!devices) continue;
        
        const devList = Array.isArray(devices) ? devices : [devices];
        for (const dev of devList) {
          const name = dev.cpmctymc || dev.spmc || '';
          if (!isPPE(name)) continue;
          
          const c = cat(name);
          if (c === '其他') continue;
          
          batch.push({
            name: name.substring(0,500), category: c,
            manufacturer_name: (dev.ylqxzcrbarmc || dev.scqymc || 'Unknown').substring(0,500),
            product_code: (dev.zczbhhzbapzbh || dev.yxqz || '').substring(0,50),
            country_of_origin: 'CN', risk_level: 'medium',
            data_source: 'NMPA UDI Full', registration_authority: 'NMPA',
            last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
          });
        }
        
        if (batch.length >= batchSize) await flushBatch();
      }
    } catch (e) {}

    processed++;
    if (processed % 5 === 0) {
      await flushBatch();
      const pct = (processed / entries.length * 100).toFixed(0);
      console.log(`  进度: ${processed}/${entries.length} (${pct}%), NMPA+${nmpaIns}条`);
    }
  }

  await flushBatch();

  // Cleanup
  fs.unlinkSync(filePath);

  const elapsed = ((Date.now()-t0)/1000).toFixed(0);
  console.log(`\n=== NMPA全量完成(${elapsed}s) ===`);
  console.log(`NMPA新增: ${nmpaIns}, 总新增: ${ins}, 新制造商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
