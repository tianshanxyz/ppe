#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const xml2js = require('xml2js');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const os = require('os');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const TMP = path.join(os.tmpdir(), 'nmpa_udi_parse');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PPE_KEYWORDS = /\u53e3\u7f69|\u9632\u62a4\u670d|\u9632\u62a4\u9762\u7f69|\u624b\u672f\u8863|\u9694\u79bb\u8863|\u62a4\u76ee\u955c|\u624b\u5957|\u547c\u5438\u5668|\u9632\u62a4\u978b|\u5b89\u5168\u5e3d|\u9632\u62a4\u5e3d|\u8003\u585e|\u8003\u7f69|\u9632\u6bd2\u9762\u5177|\u53cd\u5149\u8863|\u53cd\u5149\u80cc\u5fc3|\u9632\u62a4\u773c\u955c|\u9632\u62a4\u9762\u5c4f|\u9762\u5c4f|\u533b\u7528\u5916\u79d1\u53e3\u7f69|\u533b\u7528\u9632\u62a4\u53e3\u7f69|\u68c0\u67e5\u624b\u5957|\u5916\u79d1\u624b\u5957|\u4e00\u6b21\u6027\u53e3\u7f69|\u9632\u62a4\u56f4\u88d9|\u9632\u62a4\u9774/i;

function isPPE(name) {
  return PPE_KEYWORDS.test(name || '');
}

function categorizePPE(name) {
  const n = (name || '');
  if (/口罩|mask|n95|kn95|ffp/i.test(n)) return '呼吸防护装备';
  if (/手套|glove/i.test(n)) return '手部防护装备';
  if (/护目镜|防护面罩|面屏|goggle|visor|face.*shield/i.test(n)) return '眼面部防护装备';
  if (/安全帽|防护帽|helmet/i.test(n)) return '头部防护装备';
  if (/耳塞|耳罩|earplug|earmuff/i.test(n)) return '听觉防护装备';
  if (/防护鞋|安全鞋|boot|shoe/i.test(n)) return '足部防护装备';
  if (/反光衣|反光背心|vest|high.*vis/i.test(n)) return '躯干防护装备';
  if (/防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit/i.test(n)) return '身体防护装备';
  return '其他';
}

async function main() {
  console.log('=== NMPA UDI PPE Parser ===');
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
  let nmpaIns = 0;

  async function insProd(prod) {
    const k = `${prod.name.toLowerCase()}|${(prod.manufacturer_name||'').toLowerCase()}|${(prod.product_code||'').toLowerCase()}`;
    if (keys.has(k)) return false;
    const { error } = await supabase.from('ppe_products').insert(prod);
    if (!error) {
      keys.add(k); ins++; nmpaIns++;
      const m = prod.manufacturer_name;
      if (m && m !== 'Unknown' && !mfrSet.has(m.toLowerCase().trim())) {
        await supabase.from('ppe_manufacturers').insert({
          name: m.substring(0,500), country: 'CN',
          data_source: 'NMPA UDI', last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        });
        mfrSet.add(m.toLowerCase().trim()); mfrIns++;
      }
      return true;
    }
    return false;
  }

  // Clean tmp dir
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  // Download monthly ZIP
  const monthlyPath = path.join(TMP, 'monthly.zip');
  console.log('\n[1/3] 下载月度数据...');

  if (!fs.existsSync('/tmp/nmpa_monthly.zip')) {
    console.log('  重新下载...');
    const resp = await axios.get('https://udid.nmpa.gov.cn/attachments/attachment/download.html?path=A2E0C4E371D356DC134BE4F49B806211AF5D12A4AF10DF7941511F9C2F6828818CF732AC7E3CBABB22B4E3F855164A87496B4D9575E4CCFAE3EDB5CBF4CC0183', {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://udi.nmpa.gov.cn/download.html' },
      timeout: 120000,
    });
    fs.writeFileSync(monthlyPath, resp.data);
    console.log(`  下载: ${(resp.data.length/1024/1024).toFixed(1)}MB`);
  } else {
    fs.copyFileSync('/tmp/nmpa_monthly.zip', monthlyPath);
    console.log('  使用缓存文件');
  }

  // Extract monthly ZIP
  console.log('\n[2/3] 解压并解析XML...');
  const monthlyZip = new AdmZip(monthlyPath);
  const dailyEntries = monthlyZip.getEntries();

  let ppeProducts = [];
  const xmlParser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

  for (let di = 0; di < dailyEntries.length; di++) {
    const entry = dailyEntries[di];
    if (!entry.entryName.endsWith('.zip')) continue;

    try {
      const dailyBuf = entry.getData();
      const dailyZip = new AdmZip(dailyBuf);
      const xmlEntries = dailyZip.getEntries();

      for (const xmlEntry of xmlEntries) {
        if (!xmlEntry.entryName.endsWith('.xml')) continue;

        const xmlStr = xmlEntry.getData().toString('utf-8');
        const parsed = await xmlParser.parseStringPromise(xmlStr);

        const devices = parsed?.udid?.devices?.device;
        if (!devices) continue;
        const deviceList = Array.isArray(devices) ? devices : [devices];

        let ppeFound = 0;
        for (const dev of deviceList) {
          const name = dev.cpmctymc || dev.spmc || '';
          if (!isPPE(name)) continue;

          ppeFound++;
          const mfr = dev.ylqxzcrbarmc || dev.scqymc || '';
          const regNo = dev.zczbhhzbapzbh || dev.yxqz || '';
          const spec = dev.ggxh || '';
          const desc = dev.cpms || '';
          const catCode = dev.flbm || '';
          const devType = dev.qxlb || '';

          const category = categorizePPE(name);
          const riskLevel = /3|III|三类/i.test(catCode) ? 'high' : /2|II|二类/i.test(catCode) ? 'medium' : 'low';

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            product_code: regNo.substring(0, 50),
            country_of_origin: 'CN',
            risk_level: riskLevel,
            data_source: 'NMPA UDI',
            registration_authority: 'NMPA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          await insProd(product);
        }

        if (ppeFound > 0) {
          console.log(`  ${entry.entryName}: ${ppeFound}条PPE (共${deviceList.length}条)`);
        }
      }
    } catch (e) {
      console.log(`  ${entry.entryName}: 跳过 - ${e.message?.substring(0,60)}`);
    }

    if ((di + 1) % 5 === 0) {
      console.log(`  进度: ${di+1}/${dailyEntries.length}, 已插入${nmpaIns}条`);
    }
  }

  console.log(`\n[3/3] NMPA总计: +${nmpaIns}条`);

  // Cleanup
  fs.rmSync(TMP, { recursive: true });

  const elapsed = ((Date.now()-t0)/1000).toFixed(0);
  console.log(`\n=== 完成(${elapsed}s) ===`);
  console.log(`NMPA新增: ${nmpaIns}, 总新增: ${ins}, 新制造商: ${mfrIns}`);
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品: ${count}`);
}

main().catch(console.error);
