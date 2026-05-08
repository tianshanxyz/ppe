#!/usr/bin/env node
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name, desc) {
  const n = ((name || '') + ' ' + (desc || '')).toLowerCase();
  if (/respirat|mask|n95|n99|n100|r95|r99|r100|p95|p99|p100|ffp|kn95|filtering.facepiece|half.mask|full.face|breathing|air.purif|scba|口罩/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|手套/i.test(n)) return '手部防护装备';
  if (/goggle|face.shield|visor|护目镜|面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|安全帽|防护帽|head/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|耳塞|耳罩|hearing/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|footwear|安全鞋|防护鞋/i.test(n)) return '足部防护装备';
  if (/suit|coverall|gown|isolation|hazmat|防护服|隔离衣|手术衣/i.test(n)) return '身体防护装备';
  if (/vest|jacket|high.vis|反光/i.test(n)) return '躯干防护装备';
  return '其他';
}

async function main() {
  console.log('=== NIOSH CEL + NMPA Full PPE Collector ===');
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

  // ===== PART 1: NIOSH CEL - All Filtering Facepiece Respirators =====
  console.log('\n=== Part 1: NIOSH CEL ===');
  
  const nioshQueries = [
    { label: 'All FFRs', params: 'facepieceType=Filtering+Facepiece' },
    { label: 'N95 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=40' },
    { label: 'N99 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=39' },
    { label: 'N100 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=38' },
    { label: 'R95 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=37' },
    { label: 'R99 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=36' },
    { label: 'P95 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=34' },
    { label: 'P99 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=33' },
    { label: 'P100 FFRs', params: 'facepieceType=Filtering+Facepiece&contaminants=32' },
    { label: 'Surgical N95', params: 'Schedule=84A&FacepieceType=Filtering+Facepiece&contaminants=60&contaminants=40' },
    { label: 'Half Mask AP N95', params: 'Schedule=84A&FacepieceType=Half+Mask&Precision=inclusive&contaminants=40' },
    { label: 'NV EHM Rs', params: 'Schedule=84A&FacepieceType=Half+Mask&Valveless=true&Precision=inclusive&contaminants=32&contaminants=33&contaminants=34&contaminants=35&contaminants=36&contaminants=37&contaminants=38&contaminants=39&contaminants=40' },
    { label: 'PAPR particulate', params: 'Schedule=21C&FacepieceType=All&Precision=inclusive' },
  ];

  let nioshTotal = 0;

  for (const q of nioshQueries) {
    try {
      const url = `https://wwwn.cdc.gov/NIOSH-CEL/Results?${q.params}`;
      console.log(`  ${q.label}: 请求...`);
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        timeout: 30000,
      });

      const $ = cheerio.load(data);
      let qIns = 0;

      // Parse results table
      $('table.resultsTable tbody tr, table#resultsTable tbody tr, table.generic tbody tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 3) return;

        const mfr = $(cells[0]).text().trim();
        const model = $(cells[1]).text().trim();
        const tcNumber = $(cells[2]).text().trim();
        const approvalDate = cells.length > 3 ? $(cells[3]).text().trim() : '';
        const protection = cells.length > 4 ? $(cells[4]).text().trim() : '';

        if (!model || model.length < 2) return;

        // Build a descriptive name
        const name = `${mfr} ${model} NIOSH Respirator`.substring(0, 500).trim();
        const category = categorizePPE(name, protection);

        qIns++;
        nioshTotal++;

        // We don't insert individual rows here to avoid flooding - batch later
        // Each row is a manufacturer-model combination with TC number
      });

      console.log(`  ${q.label}: ${qIns}条`);

      // Try to find a "download" link for bulk data
      const downloadLinks = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (href.includes('.csv') || href.includes('.xls') || href.includes('.txt') || text.includes('Export') || text.includes('Download')) {
          downloadLinks.push({ href, text });
        }
      });
      if (downloadLinks.length > 0) {
        console.log(`    下载链接: ${JSON.stringify(downloadLinks.slice(0,3))}`);
      }

      await sleep(1000);
    } catch (e) {
      console.log(`  ${q.label}: 错误 - ${e.response?.status||e.code}`);
    }
  }

  console.log(`  NIOSH总计: ${nioshTotal}条 (注意:NIOSH数据为原始行数，去重后较少)`);

  // Now actually process and insert NIOSH data properly
  console.log('\n  处理NIOSH数据并入库...');
  
  // Get the main "All FFRs" page which has the most data
  try {
    const { data } = await axios.get('https://wwwn.cdc.gov/NIOSH-CEL/Results?facepieceType=Filtering+Facepiece', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 30000,
    });
    const $ = cheerio.load(data);
    let nioshIns = 0;

    // Collect rows first, then process sequentially (cheerio's each is sync)
    const rows = [];
    $('table tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;
      const mfr = $(cells[0]).text().trim();
      const model = $(cells[1]).text().trim();
      const tcNumber = $(cells[2]).text().trim();
      const protection = cells.length > 4 ? $(cells[4]).text().trim() : '';
      if (!model || model.length < 2 || !mfr || mfr.length < 2) return;
      if (mfr === 'Manufacturer' || model === 'Model') return;
      rows.push({ mfr, model, tcNumber, protection });
    });

    for (const row of rows) {
      const name = `${row.mfr} ${row.model} NIOSH-Certified Respirator`.substring(0, 500);
      const prod = {
        name, category: '呼吸防护装备',
        manufacturer_name: row.mfr.substring(0, 500),
        product_code: `NIOSH TC-${row.tcNumber}`,
        country_of_origin: 'US',
        risk_level: 'high',
        data_source: 'NIOSH CEL',
        registration_authority: 'NIOSH',
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'high',
      };
      if (await insProd(prod)) nioshIns++;
    }

    console.log(`  NIOSH实际插入: +${nioshIns}条`);
  } catch (e) {
    console.log(`  NIOSH处理错误: ${e.message?.substring(0,60)}`);
  }

  // ===== PART 2: NMPA Full Dataset Download =====
  console.log('\n=== Part 2: NMPA Full Dataset (284MB) ===');
  
  try {
    const fullUrl = 'https://udid.nmpa.gov.cn/attachments/attachment/download.html?path=A2E0C4E371D356DC134BE4F49B806211AF5D12A4AF10DF7941511F9C2F682881E69FA130D049D6DF285981599B74F17AF00F35CAD4F50C33892882C9D905B2BA';
    console.log('  下载中...');
    
    const resp = await axios.get(fullUrl, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://udi.nmpa.gov.cn/download.html' },
      timeout: 600000, // 10 minutes
    });

    const fs = require('fs');
    const path = '/tmp/nmpa_full_new.zip';
    const writer = fs.createWriteStream(path);
    let downloaded = 0;
    
    resp.data.on('data', chunk => {
      downloaded += chunk.length;
      if (downloaded % (50*1024*1024) < 65536) {
        process.stdout.write(`\r  下载: ${(downloaded/1024/1024).toFixed(0)}MB`);
      }
    });
    resp.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log(`\n  完成: ${(downloaded/1024/1024).toFixed(1)}MB`);

    // Parse full dataset - sampling approach (5.67M records is too many)
    console.log('  解析全量数据(采样5% ~280K条)...');
    const AdmZip = require('adm-zip');
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser({ explicitArray: false });
    
    const fullZip = new AdmZip(path);
    const allEntries = fullZip.getEntries().filter(e => e.entryName.endsWith('.zip'));
    console.log(`  共${allEntries.length}个包`);
    
    let nmpaFullIns = 0;
    let sampled = 0;

    for (let ei = 0; ei < allEntries.length; ei++) {
      const entry = allEntries[ei];
      try {
        const innerZip = new AdmZip(entry.getData());
        const xmlEntries = innerZip.getEntries().filter(e => e.entryName.endsWith('.xml'));
        
        for (const xmlE of xmlEntries) {
          const xmlStr = xmlE.getData().toString('utf-8');
          const parsed = await parser.parseStringPromise(xmlStr);
          const devices = parsed?.udid?.devices?.device;
          if (!devices) continue;
          
          const devList = Array.isArray(devices) ? devices : [devices];
          for (const dev of devList) {
            const name = dev.cpmctymc || dev.spmc || '';
            if (!/口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩|面具|衣|镜|靴/i.test(name)) continue;
            
            const category = categorizePPE(name, '');
            if (category === '其他') continue;
            
            const prod = {
              name: name.substring(0, 500), category,
              manufacturer_name: (dev.ylqxzcrbarmc || dev.scqymc || 'Unknown').substring(0, 500),
              product_code: (dev.zczbhhzbapzbh || dev.yxqz || '').substring(0, 50),
              country_of_origin: 'CN', risk_level: 'medium',
              data_source: 'NMPA UDI Full', registration_authority: 'NMPA',
              last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
            };
            if (await insProd(prod)) nmpaFullIns++;
          }
          sampled++;
        }
      } catch (e) {}

      if ((ei + 1) % 10 === 0) {
        console.log(`  进度: ${ei+1}/${allEntries.length}包, NMPA新增${nmpaFullIns}条`);
      }
    }

    console.log(`  NMPA全量新增: +${nmpaFullIns}条`);

    // Cleanup
    fs.unlinkSync(path);
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
