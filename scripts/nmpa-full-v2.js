#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const AdmZip = require('adm-zip');
const sax = require('sax');
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

function parseXMLStream(xmlStr) {
  return new Promise((resolve) => {
    const results = [];
    let inDevice = false;
    let currentTag = '';
    let currentDevice = {};
    let textBuffer = '';

    const parser = sax.parser(true, { lowercase: false, trim: false });

    parser.onopentag = (node) => {
      if (node.name === 'device') {
        inDevice = true;
        currentDevice = {};
        return;
      }
      if (inDevice) {
        currentTag = node.name;
        textBuffer = '';
      }
    };

    parser.ontext = (text) => {
      if (inDevice && currentTag) {
        textBuffer += text;
      }
    };

    parser.onclosetag = (tagName) => {
      if (tagName === 'device') {
        inDevice = false;
        const name = currentDevice.cpmctymc || currentDevice.spmc || '';
        if (isPPE(name)) {
          const c = cat(name);
          if (c !== '其他') {
            results.push({
              name: name.substring(0, 500),
              category: c,
              manufacturer_name: (currentDevice.ylqxzcrbarmc || currentDevice.scqymc || 'Unknown').substring(0, 500),
              product_code: (currentDevice.zczbhhzbapzbh || currentDevice.yxqz || '').substring(0, 50),
              specification: (currentDevice.ggxh || '').substring(0, 500),
              description: (currentDevice.cpms || '').substring(0, 2000),
              classification_code: (currentDevice.flbm || '').substring(0, 50),
              product_category: (currentDevice.cplb || '').substring(0, 50),
              country_of_origin: 'CN',
              risk_level: 'medium',
              data_source: 'NMPA UDI Full',
              registration_authority: 'NMPA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
          }
        }
        return;
      }
      if (inDevice && tagName === currentTag) {
        currentDevice[tagName] = textBuffer.trim();
        currentTag = '';
        textBuffer = '';
      }
    };

    parser.onend = () => resolve(results);

    parser.write(xmlStr).close();
  });
}

async function main() {
  console.log('=== NMPA Full Dataset SAX Parse ===');
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

  let totalPPE = 0, ins = 0, mfrIns = 0, batch = [];
  const BATCH_SIZE = 50;

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

  const filePath = '/tmp/nmpa_full.zip';
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));
  console.log(`共${entries.length}个XML文件`);

  for (let i = 0; i < entries.length; i++) {
    const xmlData = entries[i].getData().toString('utf-8');
    const ppeResults = await parseXMLStream(xmlData);
    totalPPE += ppeResults.length;
    batch.push(...ppeResults);

    if (batch.length >= BATCH_SIZE) await flush();

    if ((i + 1) % 50 === 0) {
      await flush();
      const pct = ((i + 1) / entries.length * 100).toFixed(1);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  进度: ${i + 1}/${entries.length} (${pct}%), 耗时${elapsed}s, PPE: ${totalPPE}, 新增: ${ins}, 新厂商: ${mfrIns}`);
    }
  }

  await flush();

  fs.unlinkSync(filePath);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n=== NMPA全量完成(${elapsed}s) ===`);
  console.log(`PPE产品: ${totalPPE}, 新增: ${ins}, 新制造商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
