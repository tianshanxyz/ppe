#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function cat(n) {
  const s = (n || '').toLowerCase();
  if (/mask|n95|kn95|ffp|respir|口罩|máscara|masque|mascher|maske/i.test(s)) return '呼吸防护装备';
  if (/glove|nitrile|guante|luvas|gant|手袋|手套|handsch/i.test(s)) return '手部防护装备';
  if (/goggle|visor|face.*shield|护目镜|面罩|面屏|óculos|brille/i.test(s)) return '眼面部防护装备';
  if (/helmet|hard.hat|casco|capacete|安全帽|防护帽|helm/i.test(s)) return '头部防护装备';
  if (/earplug|earmuff|耳塞|耳罩|tapones|tampon/i.test(s)) return '听觉防护装备';
  if (/boot|shoe|footwear|安全鞋|防护鞋|zapato|calçado|schuh/i.test(s)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|chaleco|反光|reflective/i.test(s)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|traje|overol|macacão/i.test(s)) return '身体防护装备';
  return '其他';
}

async function main() {
  console.log('=== 全球PPE多源并发采集 v6 ===');
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
          name: m.substring(0,500), country: prod.country_of_origin||'Unknown',
          data_source: prod.data_source, last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        });
        mfrSet.add(m.toLowerCase().trim()); mfrIns++;
      }
      return true;
    }
    return false;
  }

  // Source configs: { name, country, countryCode, urls to try, parser }
  const sources = [
    // ===== Thailand TFDA Web Service =====
    {
      name: 'Thailand TFDA', country: 'TH',
      urls: [
        { url: 'https://data.go.th/api/3/action/package_show?id=web-service-medical-reg', headers: { 'Accept': 'application/json' } },
        { url: 'https://data.go.th/he/api/3/action/datastore_search?resource_id=medical-reg&limit=100', headers: { 'Accept': 'application/json' } },
      ],
      extract: (data) => {
        const records = data?.result?.records || [];
        return records.map(r => ({ name: r.product_name || r.name || r['ชื่อผลิตภัณฑ์'] || '', mfr: r.company || r.manufacturer || '', code: r.reg_no || '' }));
      }
    },
    // ===== Swissmedic Open Data =====
    {
      name: 'Swissmedic', country: 'CH',
      urls: [
        { url: 'https://opendata.swiss/api/3/action/package_show?id=swissmedic-medical-devices', headers: { 'Accept': 'application/json' } },
        { url: 'https://opendata.swiss/dataset/swissmedic-medical-devices/resource/latest', headers: { 'Accept': 'application/json' } },
      ],
      extract: (data) => {
        return []; // Will try downloading the actual data files
      }
    },
    // ===== India CDSCO via NIH GUDID =====
    {
      name: 'India CDSCO', country: 'IN',
      urls: [
        { url: 'https://accessgudid.nlm.nih.gov/api/v2/devices/search.json?brand_name=mask&country=IN&limit=5', headers: { 'Accept': 'application/json' } },
      ],
      extract: (data) => {
        const items = data?.gudid?.device || [];
        return items.map(r => ({ name: r.brandName || r.deviceName || '', mfr: r.companyName || '', code: r.primaryDi || '' }));
      }
    },
    // ===== Indonesia KEMKES =====
    {
      name: 'Indonesia KEMKES', country: 'ID',
      urls: [
        { url: 'https://infoalkes.kemkes.go.id/api/search?q=masker', headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } },
      ],
      extract: (data) => {
        return []; // Try API 
      }
    },
    // ===== Mexico COFEPRIS =====
    {
      name: 'Mexico COFEPRIS', country: 'MX',
      urls: [
        { url: 'https://www.gob.mx/cms/api/v1/tags/search?tag=cubrebocas', headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } },
      ],
      extract: (data) => {
        return [];
      }
    },
    // ===== EUDAMED deeper search by device category =====
    {
      name: 'EUDAMED Categories', country: 'EU',
      urls: [
        { url: 'https://ec.europa.eu/tools/eudamed/api/devices/basicUdiDiData?search=device_name:mask&size=100', headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } },
      ],
      extract: (data) => {
        const items = data?.content || [];
        return items.map(r => ({ name: r.tradeName || r.deviceName || '', mfr: r.manufacturerName || '', code: r.basicUdiDi || '' }));
      }
    },
  ];

  // Try each source
  for (const source of sources) {
    console.log(`\n--- ${source.name} ---`);
    let srcIns = 0;

    for (const endpoint of source.urls) {
      try {
        const { data } = await axios.get(endpoint.url, {
          headers: endpoint.headers || { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000,
        });
        
        if (!data) { console.log(`  ${endpoint.url.substring(0,60)}: 空响应`); continue; }
        
        const items = source.extract(data);
        if (!items || items.length === 0) {
          // If extraction returned nothing, try generic extraction
          const genericItems = data?.data || data?.results || data?.items || data?.content || data?.records || [];
          if (Array.isArray(genericItems) && genericItems.length > 0) {
            console.log(`  ${endpoint.url.substring(0,40)}: ${genericItems.length}条通用数据`);
            for (const item of genericItems.slice(0, 100)) {
              const name = item.name || item.title || item.product_name || item.deviceName || item.tradeName || '';
              if (!name || name.length < 2) continue;
              const c = cat(name);
              if (c === '其他') continue;
              const prod = {
                name: name.substring(0,500), category: c,
                manufacturer_name: (item.manufacturer||item.company||item.applicant||'Unknown').substring(0,500),
                product_code: (item.code||item.id||'').substring(0,50),
                country_of_origin: source.country, risk_level: 'medium',
                data_source: source.name, registration_authority: source.name,
                last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'medium',
              };
              if (await insProd(prod)) srcIns++;
            }
          } else {
            console.log(`  ${endpoint.url.substring(0,40)}: 无数据`);
          }
          continue;
        }

        for (const item of items.slice(0, 200)) {
          const name = item.name || '';
          if (!name || name.length < 2) continue;
          const c = cat(name);
          if (c === '其他') continue;
          const prod = {
            name: name.substring(0,500), category: c,
            manufacturer_name: (item.mfr||'Unknown').substring(0,500),
            product_code: (item.code||'').substring(0,50),
            country_of_origin: source.country, risk_level: 'medium',
            data_source: source.name, registration_authority: source.name,
            last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'medium',
          };
          if (await insProd(prod)) srcIns++;
        }
        console.log(`  ${endpoint.url.substring(0,40)}: +${srcIns}条`);
      } catch (e) {
        const msg = e.response?.status ? `HTTP ${e.response.status}` : (e.code || e.message?.substring(0,50));
        console.log(`  ${endpoint.url.substring(0,40)}: ${msg}`);
      }
    }
    if (srcIns > 0) console.log(`  ${source.name}总计: +${srcIns}条`);
    await sleep(1000);
  }

  // ===== NMPA Full Dataset Download (background-style) =====
  console.log('\n--- NMPA Full Dataset Download ---');
  try {
    const fullUrl = 'https://udid.nmpa.gov.cn/attachments/attachment/download.html?path=A2E0C4E371D356DC134BE4F49B806211AF5D12A4AF10DF7941511F9C2F6828818E69FA130D049D6DF285981599B74F17AF00F35CAD4F50C33892882C9D905B2BA';
    console.log(`  尝试下载全量数据 (284MB)...`);
    const resp = await axios.get(fullUrl, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://udi.nmpa.gov.cn/download.html' },
      timeout: 300000, // 5 min timeout
    });
    
    const filePath = '/tmp/nmpa_full.zip';
    const writer = require('fs').createWriteStream(filePath);
    let downloaded = 0;
    resp.data.on('data', chunk => { downloaded += chunk.length; });
    resp.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      resp.data.on('error', reject);
    });
    console.log(`  下载完成: ${(downloaded/1024/1024).toFixed(1)}MB`);

    // Quick parse - sample first daily ZIP
    const AdmZip = require('adm-zip');
    const fullZip = new AdmZip(filePath);
    const entries = fullZip.getEntries().filter(e => e.entryName.endsWith('.zip')).slice(0, 2);
    console.log(`  包含: ${fullZip.getEntries().length}个文件, 采样${entries.length}个`);

    const xml2js = require('xml2js');
    const parser = new xml2js.Parser({ explicitArray: false });
    let nmpaFullIns = 0;

    for (const entry of entries) {
      const innerZip = new AdmZip(entry.getData());
      const xmlEntries = innerZip.getEntries().filter(e => e.entryName.endsWith('.xml'));
      for (const xmlE of xmlEntries) {
        const parsed = await parser.parseStringPromise(xmlE.getData().toString('utf-8'));
        const devices = parsed?.udid?.devices?.device;
        if (!devices) continue;
        const devList = Array.isArray(devices) ? devices : [devices];
        for (const dev of devList) {
          const name = dev.cpmctymc || dev.spmc || '';
          if (!/口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩/i.test(name)) continue;
          const c = cat(name);
          if (c === '其他') continue;
          const prod = {
            name: name.substring(0,500), category: c,
            manufacturer_name: (dev.ylqxzcrbarmc||'Unknown').substring(0,500),
            product_code: (dev.zczbhhzbapzbh||'').substring(0,50),
            country_of_origin: 'CN', risk_level: 'medium',
            data_source: 'NMPA UDI Full', registration_authority: 'NMPA',
            last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
          };
          if (await insProd(prod)) nmpaFullIns++;
        }
      }
    }
    console.log(`  NMPA全量采样: +${nmpaFullIns}条 (仅${entries.length}个文件)`);
  } catch (e) {
    console.log(`  NMPA全量错误: ${e.response?.status||e.code||e.message?.substring(0,60)}`);
  }

  const elapsed = ((Date.now()-t0)/1000).toFixed(0);
  console.log(`\n=== 完成(${elapsed}s) ===`);
  console.log(`总新增: ${ins}, 新制造商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(console.error);
