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
    if (error) { console.log('fetchAll error:', error.message); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('Pure Global AI 浏览器内API采集');
  console.log('使用page.evaluate在浏览器上下文中调用API');
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
    // First, visit Pure Global AI to establish session
    console.log('\n[1] 建立浏览器会话...');
    const page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://www.pureglobal.ai/devices', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);
    console.log('  会话已建立');

    // Helper: fetch API from browser context
    async function fetchAPI(url) {
      return await page.evaluate(async (fetchUrl) => {
        try {
          const res = await fetch(fetchUrl, {
            headers: { 'Accept': 'application/json' },
          });
          if (!res.ok) return { error: `HTTP ${res.status}` };
          return await res.json();
        } catch (e) {
          return { error: e.message };
        }
      }, url);
    }

    // ===== Step 2: Get specialties =====
    console.log('\n[2] 获取专业分类...');
    const specialties = await fetchAPI('https://www.pureglobal.ai/api/devices/specialties');
    if (specialties.error) {
      console.log('  获取专业分类失败:', specialties.error);
    } else if (Array.isArray(specialties)) {
      console.log(`  专业分类: ${specialties.length} 个`);
      specialties.slice(0, 10).forEach(s => console.log(`    ${s.name}: ${s.count}`));
    }

    // ===== Step 3: Search PPE devices =====
    console.log('\n[3] 搜索PPE设备...');

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

    let searchInserted = 0;

    for (const term of ppeSearchTerms) {
      console.log(`\n  搜索: "${term}"`);
      let termTotal = 0;

      for (let pageNum = 1; pageNum <= 10; pageNum++) {
        try {
          const url = `https://www.pureglobal.ai/api/devices?page=${pageNum}&limit=50&specialty=all&classes=1,2,3&search=${encodeURIComponent(term)}`;
          const data = await fetchAPI(url);

          if (data.error) {
            console.log(`    第${pageNum}页错误: ${data.error}`);
            break;
          }

          const devices = data.devices || [];
          if (devices.length === 0) break;

          let pageInserted = 0;

          for (const device of devices) {
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
              pageInserted++;
              searchInserted++;
              termTotal++;
            }
          }

          if (pageInserted > 0) {
            console.log(`    第${pageNum}页: ${pageInserted} 条 (共${devices.length}条)`);
          }

          if (devices.length < 50) break;
          await sleep(300);
        } catch (e) {
          console.log(`    第${pageNum}页异常: ${e.message.substring(0, 80)}`);
          break;
        }
      }

      if (termTotal > 0) console.log(`  "${term}" 总计: ${termTotal} 条`);
      await sleep(200);
    }

    console.log(`\n  搜索总计插入: ${searchInserted}`);

    // ===== Step 4: Browse PPE specialties =====
    console.log('\n[4] 浏览PPE相关专业分类...');

    const ppeSpecialties = [
      'general-hospital', 'anesthesiology', 'emergency-medicine',
      'physical-medicine', 'otolaryngology', 'orthopedic',
    ];

    let specInserted = 0;

    for (const specialty of ppeSpecialties) {
      console.log(`\n  专业: ${specialty}`);

      for (let pageNum = 1; pageNum <= 20; pageNum++) {
        try {
          const url = `https://www.pureglobal.ai/api/devices?page=${pageNum}&limit=50&specialty=${specialty}&classes=1,2,3`;
          const data = await fetchAPI(url);

          if (data.error) break;

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

          if (pageInserted > 0) console.log(`    第${pageNum}页: ${pageInserted} 条`);
          if (devices.length < 50) break;
          await sleep(300);
        } catch (e) {
          break;
        }
      }
    }

    console.log(`\n  专业分类总计插入: ${specInserted}`);

    // ===== Step 5: Try agent.pureglobal.ai for country-specific data =====
    console.log('\n[5] 尝试agent.pureglobal.ai获取国家数据...');

    // First visit agent.pureglobal.ai to establish session
    await page.goto('https://agent.pureglobal.ai/medical-device/database', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);

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

    let countryInserted = 0;

    for (const country of countries) {
      console.log(`\n  === ${country.slug.toUpperCase()} ===`);

      // Visit the country page first
      await page.goto(`https://agent.pureglobal.ai/${country.slug}/medical-device/database`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(3000);

      let countryCount = 0;

      for (const term of ppeSearchTerms.slice(0, 8)) {
        try {
          // Try to use the search API from the agent domain
          const agentUrl = `https://agent.pureglobal.ai/api/devices?search=${encodeURIComponent(term)}&country=${country.slug}&page=1&limit=50`;
          const data = await fetchAPI(agentUrl);

          if (data.error) {
            // Try alternative API patterns
            const altUrl = `https://agent.pureglobal.ai/api/${country.slug}/devices?search=${encodeURIComponent(term)}&page=1&limit=50`;
            const altData = await fetchAPI(altUrl);

            if (altData.error) continue;

            const items = Array.isArray(altData) ? altData : (altData.devices || altData.data || altData.results || []);
            if (items.length === 0) continue;

            for (const item of items.slice(0, 50)) {
              const name = item.deviceName || item.name || item.productName || '';
              const mfr = item.manufacturer || item.manufacturerName || '';
              const code = item.fdaCode || item.productCode || '';
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
                countryCount++;
                countryInserted++;
              }
            }
            continue;
          }

          const items = Array.isArray(data) ? data : (data.devices || data.data || data.results || []);
          if (items.length === 0) continue;

          let termCount = 0;
          for (const item of items.slice(0, 50)) {
            const name = item.deviceName || item.name || item.productName || '';
            const mfr = item.manufacturer || item.manufacturerName || '';
            const code = item.fdaCode || item.productCode || '';
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
              countryCount++;
              countryInserted++;
            }
          }
          if (termCount > 0) console.log(`    ${term}: ${termCount} 条`);
          await sleep(200);
        } catch (e) {
          // skip
        }
      }
      console.log(`  ${country.slug}: ${countryCount} 条`);
    }

    console.log(`\n  国家数据总计插入: ${countryInserted}`);

    await page.close();

  } finally {
    await browser.close();
  }

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
}

main().catch(console.error);
