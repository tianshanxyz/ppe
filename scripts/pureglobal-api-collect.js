#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0vCAIWoL5FdchU'
);

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  console.log('Pure Global AI 免费API数据采集');
  console.log('API: https://www.pureglobal.ai/api/devices');
  console.log('无需API Key，完全免费!');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number');
  const existingKeys = new Set();
  const existingRegKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
    if (p.registration_number) existingRegKeys.add(p.registration_number.trim());
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name || '').toLowerCase().trim()));

  let totalInserted = 0;
  let totalMfrInserted = 0;

  async function insertProduct(product) {
    const key = `${product.name.toLowerCase()}|${(product.manufacturer_name || '').toLowerCase()}|${(product.product_code || '').toLowerCase()}`;
    const regKey = product.registration_number || '';
    if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) return false;

    const { error } = await supabase.from('ppe_products').insert(product);
    if (!error) {
      existingKeys.add(key);
      if (regKey) existingRegKeys.add(regKey);
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

  // ===== Step 1: Get all specialties =====
  console.log('\n[Step 1] 获取所有专业分类...');
  let specialties = [];
  try {
    specialties = await fetchJSON('https://www.pureglobal.ai/api/devices/specialties');
    console.log(`  专业分类: ${specialties.length} 个`);
    specialties.forEach(s => console.log(`    ${s.name}: ${s.count} 设备`));
  } catch (e) {
    console.log(`  获取专业分类失败: ${e.message}`);
  }

  // ===== Step 2: Search PPE devices using the API =====
  console.log('\n[Step 2] 搜索PPE设备...');

  const ppeSearchTerms = [
    'mask', 'respirator', 'N95', 'FFP2', 'FFP3',
    'glove', 'nitrile glove', 'surgical glove',
    'goggle', 'face shield', 'safety glasses',
    'helmet', 'hard hat',
    'earplug', 'earmuff', 'hearing protector',
    'safety boot', 'safety shoe',
    'protective suit', 'coverall', 'gown', 'isolation gown',
    'safety vest', 'high visibility',
    'respiratory protection', 'breathing apparatus',
    'SCBA', 'air purifying',
    'chemical protective', 'hazmat suit',
  ];

  // PPE-related specialties
  const ppeSpecialties = [
    'general-hospital', 'anesthesiology', 'emergency-medicine',
    'physical-medicine', 'otolaryngology', 'orthopedic',
  ];

  let searchInserted = 0;

  for (const term of ppeSearchTerms) {
    console.log(`\n  搜索: "${term}"`);

    for (let pageNum = 1; pageNum <= 10; pageNum++) {
      try {
        const url = `https://www.pureglobal.ai/api/devices?page=${pageNum}&limit=50&specialty=all&classes=1,2,3&search=${encodeURIComponent(term)}`;
        const data = await fetchJSON(url);

        if (!data.devices || data.devices.length === 0) break;

        let termPageInserted = 0;

        for (const device of data.devices) {
          const name = (device.deviceName || '').trim();
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他' && !/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|earplug|earmuff|vest|scba|hazmat/i.test(name.toLowerCase())) continue;

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
            termPageInserted++;
            searchInserted++;
          }
        }

        if (termPageInserted > 0) {
          console.log(`    第${pageNum}页: ${termPageInserted} 条 (共${data.devices.length}条)`);
        }

        // If less than 50 results, no more pages
        if (data.devices.length < 50) break;

        await sleep(500);
      } catch (e) {
        console.log(`    第${pageNum}页错误: ${e.message.substring(0, 100)}`);
        break;
      }
    }

    await sleep(300);
  }

  console.log(`\n  搜索总计插入: ${searchInserted}`);

  // ===== Step 3: Browse PPE specialties =====
  console.log('\n[Step 3] 浏览PPE相关专业分类...');

  let specialtyInserted = 0;

  for (const specialty of ppeSpecialties) {
    console.log(`\n  专业: ${specialty}`);

    for (let pageNum = 1; pageNum <= 20; pageNum++) {
      try {
        const url = `https://www.pureglobal.ai/api/devices?page=${pageNum}&limit=50&specialty=${specialty}&classes=1,2,3`;
        const data = await fetchJSON(url);

        if (!data.devices || data.devices.length === 0) break;

        let pageInserted = 0;

        for (const device of data.devices) {
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
            specialtyInserted++;
          }
        }

        if (pageInserted > 0) {
          console.log(`    第${pageNum}页: ${pageInserted} 条`);
        }

        if (data.devices.length < 50) break;
        await sleep(500);
      } catch (e) {
        break;
      }
    }

    await sleep(300);
  }

  console.log(`\n  专业分类总计插入: ${specialtyInserted}`);

  // ===== Step 4: Get device details for country-specific data =====
  console.log('\n[Step 4] 获取设备详情（含国家信息）...');

  // The devices API returns a slug that we can use to get more details
  // Let's try to get device details which may include country-specific registration info
  let detailInserted = 0;

  // Try the agent.pureglobal.ai API for country-specific data
  const countries = [
    { slug: 'japan', cc: 'JP', auth: 'PMDA' },
    { slug: 'korea', cc: 'KR', auth: 'MFDS' },
    { slug: 'brazil', cc: 'BR', auth: 'ANVISA' },
    { slug: 'australia', cc: 'AU', auth: 'TGA' },
    { slug: 'united-kingdom', cc: 'GB', auth: 'MHRA' },
    { slug: 'china', cc: 'CN', auth: 'NMPA' },
    { slug: 'india', cc: 'IN', auth: 'CDSCO' },
    { slug: 'saudi-arabia', cc: 'SA', auth: 'SFDA' },
    { slug: 'philippines', cc: 'PH', auth: 'FDA Philippines' },
  ];

  for (const country of countries) {
    console.log(`\n  === ${country.slug.toUpperCase()} ===`);
    let countryCount = 0;

    for (const term of ppeSearchTerms.slice(0, 10)) {
      try {
        const url = `https://agent.pureglobal.ai/api/devices?search=${encodeURIComponent(term)}&country=${country.slug}&page=1&limit=50`;
        const data = await fetchJSON(url);

        const items = Array.isArray(data) ? data : (data.devices || data.data || data.results || []);

        if (items.length > 0) {
          let termCount = 0;
          for (const item of items.slice(0, 50)) {
            const name = item.deviceName || item.name || item.productName || '';
            const mfr = item.manufacturer || item.manufacturerName || item.company || '';
            const code = item.fdaCode || item.productCode || item.deviceCode || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他' && !/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety/i.test(name.toLowerCase())) continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              product_code: (code || '').substring(0, 50),
              country_of_origin: country.cc,
              risk_level: determineRiskLevel(name, item.deviceClass),
              data_source: `Pure Global AI - ${country.slug}`,
              registration_authority: country.auth,
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'medium',
            };

            if (await insertProduct(product)) {
              termCount++;
              detailInserted++;
              countryCount++;
            }
          }
          if (termCount > 0) console.log(`    ${term}: ${termCount} 条`);
        }

        await sleep(300);
      } catch (e) {
        // skip
      }
    }
    console.log(`  ${country.slug}: ${countryCount} 条`);
  }

  console.log(`\n  国家详情总计插入: ${detailInserted}`);

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  // Category distribution
  const finalProducts = await fetchAll('ppe_products', 'category,country_of_origin,data_source');
  const catStats = {};
  const countryStats = {};
  finalProducts.forEach(p => {
    catStats[p.category || 'Unknown'] = (catStats[p.category || 'Unknown'] || 0) + 1;
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
  });

  console.log('\n类别分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / finalProductCount * 100).toFixed(1)}%)`);
  });

  console.log('\n国家分布(前10):');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / finalProductCount * 100).toFixed(1)}%)`);
  });
}

main().catch(console.error);
