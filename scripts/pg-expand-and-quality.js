#!/usr/bin/env node
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|マスク|呼吸|防塵|防毒|마스크|호흡|보호구|máscara|respirador/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手袋|グローブ|장갑|luva/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|safety.*glass|visor|保護めがね|ゴーグル|보호안경|고글|óculos/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|ヘルメット|安全帽|안전모|헬멧|capacete/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳栓|イヤーマフ|聴覚|귀마개|이어마프|protetor auricular/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|safety.*foot|安全靴|シューズ|안전화|부츠|bota/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|protective.*cloth|isolation|hazmat|保護衣|防護服|보호복|보호의|macacão|vestimenta/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name, deviceClass) {
  if (deviceClass === '3') return 'high';
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (deviceClass === '2' || /helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
  return 'low';
}

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('Pure Global AI 扩展采集 + 数据质量提升');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code');
  const existingKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name || '').toLowerCase().trim()));

  let totalInserted = 0;
  let totalMfrInserted = 0;

  async function insertProduct(product) {
    const key = `${product.name.toLowerCase()}|${(product.manufacturer_name || '').toLowerCase()}|${(product.product_code || '').toLowerCase()}`;
    if (existingKeys.has(key)) return false;

    const { error } = await supabase.from('ppe_products').insert(product);
    if (!error) {
      existingKeys.add(key);
      totalInserted++;

      const mfrName = product.manufacturer_name;
      if (mfrName && mfrName !== 'Unknown' && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
        const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
          name: mfrName.substring(0, 500),
          country: product.country_of_origin || 'Unknown',
          data_source: product.data_source,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: product.data_confidence_level || 'medium',
        });
        if (!mfrErr) {
          existingMfrNames.add(mfrName.toLowerCase().trim());
          totalMfrInserted++;
        }
      }
      return true;
    }
    return false;
  }

  console.log('\n启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Step 1: Establish session
    console.log('\n[1] 建立会话...');
    await page.goto('https://www.pureglobal.ai/devices', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(8000);
    console.log('  会话已建立');

    // Step 2: Search by FDA product codes (PPE-specific)
    console.log('\n[2] 按FDA产品代码搜索PPE设备...');

    const ppeProductCodes = {
      'MSH': 'Surgical Mask',
      'MSR': 'Respirator',
      'MST': 'Respirator, Air Purifying',
      'MSW': 'Respirator, Supply Air',
      'OEA': 'Glove, Surgeon\'s',
      'OEB': 'Glove, Patient Examination',
      'OEC': 'Glove, Surgeon\'s, Specialty',
      'OED': 'Glove, Surgeon\'s, Rubber',
      'OEE': 'Glove, Surgeon\'s, Plastic',
      'OEF': 'Glove, Patient Examination, Plastic',
      'OEG': 'Glove, Patient Examination, Rubber',
      'KNC': 'Goggle, Protective',
      'KND': 'Shield, Face, Surgical',
      'KNE': 'Glasses, Protective',
      'KNG': 'Glasses, Safety',
      'LMA': 'Helmet, Safety',
      'LMB': 'Hat, Hard',
      'LMC': 'Helmet, Protective',
      'LZA': 'Earplug, Hearing',
      'LZB': 'Earmuff, Hearing',
      'LZC': 'Protector, Hearing',
      'FMI': 'Boot, Safety',
      'FMJ': 'Shoe, Safety',
      'FMK': 'Footwear, Protective',
      'QBJ': 'Vest, Safety',
      'QBK': 'Vest, High Visibility',
      'QBL': 'Jacket, Protective',
      'FTL': 'Gown, Surgical',
      'FTM': 'Gown, Isolation',
      'FTN': 'Coverall, Protective',
      'NHA': 'Apparatus, Breathing',
      'NHB': 'Respirator, Self-Contained',
      'NHC': 'Respirator, Air-Line',
      'KKX': 'Suit, Protective, Chemical',
      'KKY': 'Suit, Protective, Radiation',
      'KKZ': 'Suit, Protective, Biological',
      'CFC': 'Mask, Surgical',
      'CFD': 'Mask, Surgical, With Antimicrobial',
      'CFE': 'Mask, Oxygen',
      'CFF': 'Mask, Anesthetic',
      'DSA': 'Shield, Eye, Laser',
      'DSB': 'Glasses, Laser, Protective',
      'HCB': 'Cap, Surgical',
      'HCC': 'Cover, Head, Surgical',
      'HCD': 'Cover, Shoe, Surgical',
    };

    let codeInserted = 0;

    for (const [code, description] of Object.entries(ppeProductCodes)) {
      console.log(`\n  代码: ${code} (${description})`);

      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        try {
          const data = await page.evaluate(async (c, pn) => {
            try {
              const url = `/api/devices?page=${pn}&limit=50&specialty=all&classes=1,2,3&search=${c}`;
              const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
              if (!res.ok) return { error: `HTTP ${res.status}`, devices: [] };
              return await res.json();
            } catch (e) {
              return { error: e.message, devices: [] };
            }
          }, code, pageNum);

          if (data.error) break;

          const devices = data.devices || [];
          if (devices.length === 0) break;

          let pageInserted = 0;

          for (const device of devices) {
            const name = (device.deviceName || '').trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: 'Unknown',
              product_code: (device.fdaCode || code).substring(0, 50),
              country_of_origin: 'US',
              risk_level: determineRiskLevel(name, device.deviceClass),
              data_source: 'Pure Global AI API',
              registration_authority: 'FDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              pageInserted++;
              codeInserted++;
            }
          }

          if (pageInserted > 0) {
            console.log(`    第${pageNum}页: ${pageInserted}/${devices.length} 条`);
          }

          if (devices.length < 50) break;
          await sleep(200);
        } catch (e) {
          break;
        }
      }
      await sleep(100);
    }

    console.log(`\n  FDA产品代码搜索总计插入: ${codeInserted}`);

    // Step 3: Search by PPE keywords (expanded)
    console.log('\n[3] 扩展关键词搜索...');

    const expandedTerms = [
      'mask', 'respirator', 'N95', 'FFP2', 'FFP3', 'KN95',
      'glove', 'nitrile', 'surgical glove', 'examination glove',
      'goggle', 'face shield', 'safety glasses', 'eye protection',
      'helmet', 'hard hat', 'bump cap', 'head protection',
      'earplug', 'earmuff', 'hearing protection',
      'safety boot', 'safety shoe', 'foot protection',
      'protective suit', 'coverall', 'hazmat', 'isolation gown',
      'safety vest', 'high visibility', 'life jacket',
      'SCBA', 'air purifying respirator', 'breathing apparatus',
      'surgical cap', 'shoe cover', 'scrub suit',
      'fall protection', 'harness', 'lanyard',
      'welding helmet', 'welding glove', 'welding jacket',
      'chemical suit', 'radiation protection', 'biological protection',
    ];

    let keywordInserted = 0;

    for (const term of expandedTerms) {
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        try {
          const data = await page.evaluate(async (t, pn) => {
            try {
              const url = `/api/devices?page=${pn}&limit=50&specialty=all&classes=1,2,3&search=${encodeURIComponent(t)}`;
              const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
              if (!res.ok) return { error: `HTTP ${res.status}`, devices: [] };
              return await res.json();
            } catch (e) {
              return { error: e.message, devices: [] };
            }
          }, term, pageNum);

          if (data.error) break;

          const devices = data.devices || [];
          if (devices.length === 0) break;

          let pageInserted = 0;

          for (const device of devices) {
            const name = (device.deviceName || '').trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他' && !/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|earplug|earmuff|vest|scba|hazmat|breathing|purifying|isolation|nitrile|chemical|welding|fall|harness|lanyard|cap|shoe cover|scrub|radiation|biological|life jacket|bump/i.test(name.toLowerCase())) continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: 'Unknown',
              product_code: (device.fdaCode || '').substring(0, 50),
              country_of_origin: 'US',
              risk_level: determineRiskLevel(name, device.deviceClass),
              data_source: 'Pure Global AI API',
              registration_authority: 'FDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              pageInserted++;
              keywordInserted++;
            }
          }

          if (pageInserted > 0) {
            console.log(`  ${term} 第${pageNum}页: ${pageInserted}/${devices.length} 条`);
          }

          if (devices.length < 50) break;
          await sleep(200);
        } catch (e) {
          break;
        }
      }
      await sleep(100);
    }

    console.log(`\n  关键词搜索总计插入: ${keywordInserted}`);

    // Step 4: Browse ALL specialties for PPE devices
    console.log('\n[4] 浏览所有专业分类中的PPE设备...');

    const allSpecialties = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/devices/specialties', { headers: { 'Accept': 'application/json' } });
        return await res.json();
      } catch (e) {
        return [];
      }
    });

    console.log(`  专业分类: ${allSpecialties.length} 个`);

    let specInserted = 0;

    for (const spec of allSpecialties) {
      for (let pageNum = 1; pageNum <= Math.ceil(spec.count / 50); pageNum++) {
        try {
          const data = await page.evaluate(async (slug, pn) => {
            try {
              const url = `/api/devices?page=${pn}&limit=50&specialty=${slug}&classes=1,2,3`;
              const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
              return await res.json();
            } catch (e) {
              return { devices: [] };
            }
          }, spec.slug, pageNum);

          const devices = data.devices || [];
          if (devices.length === 0) break;

          let pageInserted = 0;

          for (const device of devices) {
            const name = (device.deviceName || '').trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: 'Unknown',
              product_code: (device.fdaCode || '').substring(0, 50),
              country_of_origin: 'US',
              risk_level: determineRiskLevel(name, device.deviceClass),
              data_source: 'Pure Global AI API',
              registration_authority: 'FDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              pageInserted++;
              specInserted++;
            }
          }

          if (devices.length < 50) break;
          await sleep(150);
        } catch (e) {
          break;
        }
      }
    }

    console.log(`\n  专业分类浏览总计插入: ${specInserted}`);

    await page.close();

  } finally {
    await browser.close();
  }

  // ===== Data Quality Improvement =====
  console.log('\n========================================');
  console.log('数据质量提升');
  console.log('========================================');

  // Fix "其他" category - reclassify based on keywords
  console.log('\n[5] 重新分类"其他"类别...');
  const otherProducts = await fetchAll('ppe_products', 'id,name,category,product_code');
  const otherItems = otherProducts.filter(p => p.category === '其他');
  console.log(`  "其他"类别: ${otherItems.length} 条`);

  let reclassified = 0;
  for (const p of otherItems) {
    const name = (p.name || '').toLowerCase();
    let newCategory = null;

    if (/needle.*protect|safety.*needle|syringe.*protect/i.test(name)) newCategory = '手部防护装备';
    else if (/laser.*protect|laser.*shield|laser.*glass/i.test(name)) newCategory = '眼面部防护装备';
    else if (/splash.*shield|splash.*guard|fluid.*shield/i.test(name)) newCategory = '眼面部防护装备';
    else if (/surgical.*cap|scrub.*cap|head.*cover/i.test(name)) newCategory = '头部防护装备';
    else if (/shoe.*cover|boot.*cover|foot.*cover/i.test(name)) newCategory = '足部防护装备';
    else if (/drape|protective.*drape|surgical.*drape/i.test(name)) newCategory = '身体防护装备';
    else if (/kit.*protect|protection.*kit|biohazard.*kit|ppe.*kit/i.test(name)) newCategory = '身体防护装备';
    else if (/fall.*protect|harness|lanyard|anchor/i.test(name)) newCategory = '躯干防护装备';
    else if (/welding/i.test(name)) newCategory = '身体防护装备';
    else if (/radiation.*protect|lead.*apron|lead.*glove/i.test(name)) newCategory = '身体防护装备';

    if (newCategory) {
      const { error } = await supabase.from('ppe_products').update({ category: newCategory }).eq('id', p.id);
      if (!error) reclassified++;
    }
  }
  console.log(`  重新分类: ${reclassified} 条`);

  // Delete non-PPE products from "其他"
  console.log('\n[6] 删除非PPE产品...');
  const nonPPEDeleted = await supabase.from('ppe_products')
    .delete()
    .eq('category', '其他')
    .not('name', 'ilike', '%protect%')
    .not('name', 'ilike', '%safety%')
    .not('name', 'ilike', '%mask%')
    .not('name', 'ilike', '%glove%')
    .not('name', 'ilike', '%goggle%')
    .not('name', 'ilike', '%shield%')
    .not('name', 'ilike', '%helmet%')
    .not('name', 'ilike', '%respirat%')
    .not('name', 'ilike', '%boot%')
    .not('name', 'ilike', '%gown%')
    .not('name', 'ilike', '%coverall%')
    .not('name', 'ilike', '%suit%')
    .not('name', 'ilike', '%earplug%')
    .not('name', 'ilike', '%earmuff%')
    .not('name', 'ilike', '%vest%')
    .not('name', 'ilike', '%hazmat%')
    .not('name', 'ilike', '%scba%');
  console.log(`  删除非PPE: ${nonPPEDeleted.data?.length || 0} 条`);

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  重新分类: ${reclassified}`);
  console.log(`  删除非PPE: ${nonPPEDeleted.data?.length || 0}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
