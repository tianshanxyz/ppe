#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function cat(name) {
  const n = (name || '').toLowerCase();
  if (/mask|n95|kn95|ffp|respir|呼吸|口罩/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套/i.test(n)) return '手部防护装备';
  if (/goggle|face.*shield|visor|护目镜|面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣/i.test(n)) return '身体防护装备';
  return '其他';
}

async function main() {
  console.log('=== 全球PPE采集 v5 ===');
  const t0 = Date.now();

  // Load existing
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
          name: m.substring(0,500), country: prod.country_of_origin||'US',
          data_source: prod.data_source, last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        });
        mfrSet.add(m.toLowerCase().trim()); mfrIns++;
      }
      return true;
    }
    return false;
  }

  // ===== FDA 510(k) =====
  console.log('\n--- FDA 510(k) ---');
  const codes = ['FXX','MSH','OUK','ONI','NZJ','QOZ','QKR','LZA','LZB','LZC','LYY','LYZ','FMC','OPC','OIG','OEA','FYA','FYB'];
  let fdaTot = 0;

  for (const code of codes) {
    try {
      const url = `https://api.fda.gov/device/510k.json?search=product_code:"${code}"&limit=100`;
      const { data } = await axios.get(url, { timeout: 15000 });
      const total = data?.meta?.results?.total || 0;
      let cIns = 0;

      if (total > 0) {
        for (let skip = 0; skip < Math.min(total, 500); skip += 100) {
          let items;
          if (skip === 0) {
            items = data.results || [];
          } else {
            const { data: d2 } = await axios.get(`https://api.fda.gov/device/510k.json?search=product_code:"${code}"&limit=100&skip=${skip}`, { timeout: 15000 });
            items = d2.results || [];
          }
          if (!items.length) break;

          for (const item of items) {
            const name = item.device_name || item.trade_name || '';
            if (!name || name.length < 2) continue;
            const c = cat(name);
            if (c === '其他') continue;
            const prod = {
              name: name.substring(0,500), category: c,
              manufacturer_name: (item.applicant||'').substring(0,500),
              product_code: `510(k) ${item.k_number||''}`,
              country_of_origin: 'US',
              risk_level: c === '呼吸防护装备' ? 'high' : 'medium',
              data_source: 'FDA 510(k)', registration_authority: 'FDA',
              last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
            };
            if (await insProd(prod)) cIns++;
          }
          if (items.length < 100) break;
          await sleep(200);
        }
      }
      console.log(`  ${code}: ${total}条 → +${cIns}`);
      fdaTot += cIns;
    } catch (e) {
      console.log(`  ${code}: 错误 ${e.response?.status||e.code}`);
    }
    await sleep(300);
  }
  console.log(`  FDA总计: +${fdaTot}`);

  // ===== EUDAMED =====
  console.log('\n--- EUDAMED ---');
  const eu = [
    ['DE','DE'],['FR','FR'],['IT','IT'],['ES','ES'],['NL','NL'],
    ['IE','IE'],['BE','BE'],['AT','AT'],['PL','PL'],['CZ','CZ'],
    ['HU','HU'],['PT','PT'],['GR','GR'],['FI','FI'],['DK','DK'],
    ['SE','SE'],['SK','SK'],['SI','SI'],['LT','LT'],['LV','LV'],
    ['EE','EE'],['BG','BG'],['RO','RO'],['HR','HR'],['MT','MT'],
    ['CY','CY'],['LU','LU'],['NO','NO'],['CH','CH'],['TR','TR'],
    ['GB','GB'],
  ];
  let euTot = 0;

  for (const [pfx, cc] of eu) {
    try {
      const url = `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?manufacturerSRN=${pfx}-&page=0&size=100`;
      const { data } = await axios.get(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, timeout: 15000,
      });
      const items = data?.content || data?.data || (Array.isArray(data) ? data : []);
      let eIns = 0;
      for (const item of items) {
        const name = item.tradeName || item.deviceName || '';
        if (!name || name.length < 2) continue;
        const c = cat(name);
        if (c === '其他') continue;
        const prod = {
          name: name.substring(0,500), category: c,
          manufacturer_name: (item.manufacturerName||item.actorName||'Unknown').substring(0,500),
          product_code: (item.basicUdiDi||'').substring(0,50),
          country_of_origin: cc, risk_level: 'medium',
          data_source: 'EUDAMED', registration_authority: 'EU Commission',
          last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
        };
        if (await insProd(prod)) eIns++;
      }
      if (eIns > 0) console.log(`  ${pfx}: +${eIns}`);
      euTot += eIns;
    } catch (e) {
      // Silent - many country prefixes won't have results
    }
    await sleep(500);
  }
  console.log(`  EUDAMED总计: +${euTot}`);

  // ===== NMPA UDI =====
  console.log('\n--- NMPA UDI Download ---');
  try {
    const url = 'https://udi.nmpa.gov.cn/download/UDID_MONTH_UPDATE_202604.zip';
    console.log(`  下载: ${url}`);
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/zip,*/*', 'Referer': 'https://udi.nmpa.gov.cn/download.html' },
      timeout: 60000, maxRedirects: 5,
    });
    if (resp.data?.length > 10000) {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(resp.data);
      const entries = zip.getEntries();
      console.log(`  文件: ${entries.length}个`);
      let nmpaIns = 0;
      for (const entry of entries) {
        if (entry.entryName.endsWith('.csv') || entry.entryName.endsWith('.txt')) {
          const text = entry.getData().toString('utf-8');
          const lines = text.split('\n');
          console.log(`  ${entry.entryName}: ${lines.length}行, 表头=${(lines[0]||'').substring(0,100)}`);
          for (let i = 1; i < lines.length; i++) {
            if (/口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩/i.test(lines[i])) {
              // Try CSV or tab-separated
              const sep = lines[0].includes('\t') ? '\t' : ',';
              const cols = lines[i].split(sep).map(c => c.replace(/^"|"$/g, '').trim());
              const name = (cols[2] || cols[1] || cols[0] || '');
              const mfr = (cols[5] || cols[4] || cols[3] || '');
              const regNo = (cols[3] || cols[2] || '');
              if (name.length >= 2) {
                const c = cat(name);
                if (c !== '其他') {
                  const prod = {
                    name: name.substring(0,500), category: c,
                    manufacturer_name: (mfr||'Unknown').substring(0,500),
                    product_code: regNo.substring(0,50),
                    country_of_origin: 'CN', risk_level: 'medium',
                    data_source: 'NMPA UDI', registration_authority: 'NMPA',
                    last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
                  };
                  if (await insProd(prod)) nmpaIns++;
                }
              }
            }
          }
          console.log(`    PPE: +${nmpaIns}`);
        }
      }
      console.log(`  NMPA总计: +${nmpaIns}`);
    } else {
      console.log(`  非数据: type=${resp.headers['content-type']}, size=${resp.data?.length}`);
    }
  } catch (e) {
    console.log(`  NMPA错误: ${e.response?.status||e.code||e.message?.substring(0,80)}`);
  }

  const elapsed = ((Date.now() - t0)/1000).toFixed(0);
  console.log(`\n=== 完成 (${elapsed}s) ===`);
  console.log(`新增产品: ${ins}, 新增制造商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(console.error);
