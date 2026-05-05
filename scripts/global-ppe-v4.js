#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/mask|n95|kn95|ffp|respir|呼吸|口罩|face.mask|surgical.mask|barrier.face/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套/i.test(n)) return '手部防护装备';
  if (/goggle|face.*shield|visor|护目镜|防护面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|保护衣/i.test(n)) return '身体防护装备';
  return '其他';
}

let existingKeys = new Set();
let existingMfrNames = new Set();
let totalInserted = 0, totalMfrInserted = 0;

async function insertProduct(product) {
  const key = `${product.name.toLowerCase()}|${(product.manufacturer_name || '').toLowerCase()}|${(product.product_code || '').toLowerCase()}`;
  if (existingKeys.has(key)) return false;
  const { error } = await supabase.from('ppe_products').insert(product);
  if (!error) {
    existingKeys.add(key); totalInserted++;
    const mfr = product.manufacturer_name;
    if (mfr && mfr !== 'Unknown' && !existingMfrNames.has(mfr.toLowerCase().trim())) {
      await supabase.from('ppe_manufacturers').insert({
        name: mfr.substring(0, 500), country: product.country_of_origin || 'US',
        data_source: product.data_source, last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'high',
      });
      existingMfrNames.add(mfr.toLowerCase().trim()); totalMfrInserted++;
    }
    return true;
  }
  return false;
}

async function openFDA510k(productCode, sourceName) {
  let inserted = 0, total = 0;
  for (let skip = 0; skip < 5000; skip += 100) {
    try {
      const url = `https://api.fda.gov/device/510k.json?search=product_code:"${productCode}"&limit=100&skip=${skip}`;
      const { data } = await axios.get(url, { timeout: 30000 });
      const items = data.results || [];
      if (items.length === 0) break;
      total += items.length;

      for (const item of items) {
        const name = item.device_name || item.trade_name || '';
        const applicant = item.applicant || '';
        const kNumber = item.k_number || '';
        if (!name || name.length < 3) continue;

        const category = categorizePPE(name);
        if (category === '其他') continue;

        const product = {
          name: name.substring(0, 500), category,
          manufacturer_name: applicant.substring(0, 500),
          product_code: `510(k) ${kNumber}`,
          country_of_origin: 'US', risk_level: category === '呼吸防护装备' ? 'high' : 'medium',
          data_source: sourceName, registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
        };
        if (await insertProduct(product)) inserted++;
      }
      if (items.length < 100) break;
      await sleep(300);
    } catch (e) { break; }
  }
  return { total, inserted };
}

async function eudamedByCountry(prefix, countryName, countryCode) {
  let inserted = 0;
  try {
    const url = `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?manufacturerSRN=${prefix}-&page=0&size=100`;
    const { data } = await axios.get(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, timeout: 30000,
    });
    const items = data?.content || data?.data || (Array.isArray(data) ? data : []);
    for (const item of items) {
      const name = item.tradeName || item.deviceName || '';
      const mfr = item.manufacturerName || item.actorName || '';
      if (!name || name.length < 3) continue;
      const category = categorizePPE(name);
      if (category === '其他') continue;

      const product = {
        name: name.substring(0, 500), category,
        manufacturer_name: (mfr || 'Unknown').substring(0, 500),
        product_code: (item.basicUdiDi || '').substring(0, 50),
        country_of_origin: countryCode, risk_level: 'medium',
        data_source: 'EUDAMED', registration_authority: 'EU Commission',
        last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
      };
      if (await insertProduct(product)) inserted++;
    }
  } catch (e) {}
  console.log(`  ${countryName} (${prefix}): +${inserted}条`);
  return inserted;
}

async function main() {
  console.log('========================================');
  console.log('全球PPE数据采集 - 多源并行 v4');
  console.log('========================================');

  // Load existing data
  let allP = [];
  let pg = 0;
  while (true) {
    const { data } = await supabase.from('ppe_products').select('name,manufacturer_name,product_code').range(pg*1000, (pg+1)*1000-1);
    if (!data || data.length === 0) break;
    allP.push(...data);
    if (data.length < 1000) break;
    pg++;
  }
  allP.forEach(p => {
    existingKeys.add(`${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`);
  });
  console.log(`现有产品: ${allP.length}`);

  pg = 0;
  while (true) {
    const { data } = await supabase.from('ppe_manufacturers').select('name').range(pg*1000, (pg+1)*1000-1);
    if (!data || data.length === 0) break;
    data.forEach(m => existingMfrNames.add((m.name||'').toLowerCase().trim()));
    if (data.length < 1000) break;
    pg++;
  }

  // ===== PART 1: FDA 510(k) - PPE masks and gloves only =====
  console.log('\n[第1部分] FDA 510(k) - PPE产品');
  
  const fdaCodes = [
    'MSH',  // Respirator, Surgical
    'FXX',  // Surgical Mask (most common)
    'OUK',  // Surgical Mask with antimicrobial
    'ONI',  // N95 filtering facepiece respirator
    'NZJ',  // N95 for general public
    'QOZ',  // Barrier face covering
    'QKR',  // Face mask
    'LZA',  // Polymer patient exam glove
    'LZB',  // Finger cot
    'LZC',  // Medical glove specialty
    'LYY',  // Latex patient exam glove
    'LYZ',  // Vinyl patient exam glove
    'FMC',  // Patient examination glove
    'OPC',  // Powder-free polychloroprene glove
    'OIG',  // Powder-free guayle rubber glove
    'OEA',  // Non-surgical gown
    'FYA',  // Surgical gown
    'FYB',  // Isolation gown
  ];

  let fdaTotal = 0;
  for (const code of fdaCodes) {
    const { inserted } = await openFDA510k(code, 'FDA 510(k)');
    if (inserted > 0) console.log(`  ${code}: +${inserted}条`);
    fdaTotal += inserted;
    await sleep(300);
  }
  console.log(`  FDA总计: +${fdaTotal}条`);

  // ===== PART 2: EUDAMED - all European countries =====
  console.log('\n[第2部分] EUDAMED - 欧洲各国');
  
  const euPrefixes = [
    ['DE','Germany','DE'],['FR','France','FR'],['IT','Italy','IT'],['ES','Spain','ES'],
    ['NL','Netherlands','NL'],['IE','Ireland','IE'],['BE','Belgium','BE'],['AT','Austria','AT'],
    ['PL','Poland','PL'],['CZ','Czechia','CZ'],['HU','Hungary','HU'],['PT','Portugal','PT'],
    ['GR','Greece','GR'],['FI','Finland','FI'],['DK','Denmark','DK'],['SE','Sweden','SE'],
    ['SK','Slovakia','SK'],['SI','Slovenia','SI'],['LT','Lithuania','LT'],['LV','Latvia','LV'],
    ['EE','Estonia','EE'],['BG','Bulgaria','BG'],['RO','Romania','RO'],['HR','Croatia','HR'],
    ['MT','Malta','MT'],['CY','Cyprus','CY'],['LU','Luxembourg','LU'],['NO','Norway','NO'],
    ['CH','Switzerland','CH'],['TR','Turkey','TR'],['UK','United Kingdom','GB'],
  ];

  let euTotal = 0;
  for (const [prefix, name, code] of euPrefixes) {
    euTotal += await eudamedByCountry(prefix, name, code);
    await sleep(500);
  }
  console.log(`  EUDAMED总计: +${euTotal}条`);

  // ===== PART 3: NMPA UDI Download =====
  console.log('\n[第3部分] NMPA UDI数据下载');
  try {
    const downloadUrl = 'https://udi.nmpa.gov.cn/download/UDID_WEEKLY_UPDATE_20260427_20260503.zip';
    console.log(`  尝试下载: ${downloadUrl}`);
    const resp = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/zip,application/octet-stream,*/*' },
      timeout: 60000,
    });
    if (resp.headers['content-type']?.includes('zip') || resp.data.length > 100000) {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(resp.data);
      const entries = zip.getEntries();
      console.log(`  ZIP包含: ${entries.length}个文件`);
      for (const entry of entries) {
        console.log(`    ${entry.entryName} (${entry.getData().length} bytes)`);
        if (entry.entryName.endsWith('.csv') || entry.entryName.endsWith('.txt')) {
          const content = entry.getData().toString('utf-8').substring(0, 5000);
          const lines = content.split('\n');
          console.log(`    CSV列名: ${lines[0]?.substring(0, 200) || '(无)'}`);
          console.log(`    CSV行数: ${lines.length}`);
          // Filter for PPE
          let nmpaInserted = 0;
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (/口罩|防护|手套|护目|隔离|手术|面罩|呼吸/i.test(line)) {
              const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)|,(?![^"]*")/);
              const name = (cols[2] || cols[1] || '').replace(/^"|"$/g, '').trim();
              const mfr = (cols[5] || cols[4] || '').replace(/^"|"$/g, '').trim();
              const regNo = (cols[3] || '').replace(/^"|"$/g, '').trim();
              if (name.length >= 2) {
                const cat = categorizePPE(name);
                if (cat !== '其他') {
                  const product = {
                    name: name.substring(0,500), category: cat,
                    manufacturer_name: (mfr||'Unknown').substring(0,500),
                    product_code: regNo.substring(0,50),
                    country_of_origin: 'CN', risk_level: 'medium',
                    data_source: 'NMPA UDI', registration_authority: 'NMPA',
                    last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
                  };
                  if (await insertProduct(product)) nmpaInserted++;
                }
              }
            }
          }
          console.log(`    PPE过滤: +${nmpaInserted}条`);
        }
      }
    } else {
      console.log(`  非ZIP响应: ${resp.headers['content-type']}, ${resp.data.length} bytes`);
    }
  } catch (e) {
    console.log(`  NMPA下载错误: ${e.response?.status || e.message?.substring(0,80)}`);
  }

  console.log('\n========================================');
  console.log('采集完成');
  console.log('========================================');
  console.log(`总新增产品: ${totalInserted}`);
  console.log(`总新增制造商: ${totalMfrInserted}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`数据库总产品: ${count}`);
}

main().catch(console.error);
