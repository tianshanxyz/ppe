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
  console.log('Pure Global AI 单页面API采集 v8');
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
    // Single page approach
    const page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Step 1: Visit Pure Global AI to establish session
    console.log('\n[1] 建立会话...');
    await page.goto('https://www.pureglobal.ai/devices', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(8000);
    console.log('  会话已建立');

    // Step 2: Use page.evaluate to make API calls from browser context
    console.log('\n[2] 通过浏览器内fetch调用API...');

    async function fetchDevicesFromBrowser(searchTerm, pageNum = 1, pageLimit = 50) {
      return await page.evaluate(async (term, pn, lim) => {
        try {
          const url = `/api/devices?page=${pn}&limit=${lim}&specialty=all&classes=1,2,3&search=${encodeURIComponent(term)}`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) return { error: `HTTP ${res.status}`, devices: [] };
          return await res.json();
        } catch (e) {
          return { error: e.message, devices: [] };
        }
      }, searchTerm, pageNum, pageLimit);
    }

    const ppeSearchTerms = [
      'mask', 'respirator', 'N95', 'glove', 'goggle',
      'face shield', 'helmet', 'earplug', 'safety boot',
      'protective suit', 'coverall', 'gown', 'safety vest',
      'SCBA', 'hearing protector', 'hazmat suit',
      'respiratory', 'breathing', 'air purifying',
      'safety glasses', 'hard hat', 'isolation',
      'surgical glove', 'nitrile', 'chemical protective',
    ];

    let searchInserted = 0;

    for (const term of ppeSearchTerms) {
      console.log(`\n  搜索: "${term}"`);
      let termTotal = 0;

      for (let pageNum = 1; pageNum <= 10; pageNum++) {
        try {
          const data = await fetchDevicesFromBrowser(term, pageNum);

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
            if (category === '其他' && !/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|earplug|earmuff|vest|scba|hazmat|breathing|purifying|isolation|nitrile|chemical/i.test(name.toLowerCase())) continue;

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
            console.log(`    第${pageNum}页: ${pageInserted}/${devices.length} 条`);
          }

          if (devices.length < 50) break;
          await sleep(200);
        } catch (e) {
          console.log(`    第${pageNum}页异常: ${e.message.substring(0, 80)}`);
          break;
        }
      }

      if (termTotal > 0) console.log(`  "${term}" 总计: ${termTotal} 条`);
      await sleep(100);
    }

    console.log(`\n  搜索总计插入: ${searchInserted}`);

    // Step 3: Browse specialties
    console.log('\n[3] 按专业分类浏览...');

    const specialties = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/devices/specialties', { headers: { 'Accept': 'application/json' } });
        return await res.json();
      } catch (e) {
        return [];
      }
    });

    console.log(`  专业分类: ${specialties.length} 个`);

    let specInserted = 0;

    for (const spec of specialties) {
      // Only browse specialties that might contain PPE
      if (!/general|hospital|anesthesi|emergency|physical|otolar|orthoped|surge/i.test(spec.name || '')) continue;

      console.log(`\n  专业: ${spec.name} (${spec.count} 设备)`);

      for (let pageNum = 1; pageNum <= 20; pageNum++) {
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

          if (pageInserted > 0) console.log(`    第${pageNum}页: ${pageInserted} 条`);
          if (devices.length < 50) break;
          await sleep(200);
        } catch (e) {
          break;
        }
      }
    }

    console.log(`\n  专业分类总计插入: ${specInserted}`);

    // Step 4: Try agent.pureglobal.ai for country data
    console.log('\n[4] 获取国家数据...');

    // Navigate to agent.pureglobal.ai
    await page.goto('https://agent.pureglobal.ai/medical-device/database', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
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

      // Navigate to country page
      try {
        await page.goto(`https://agent.pureglobal.ai/${country.slug}/medical-device/database`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await sleep(3000);
      } catch (e) {
        console.log(`  页面加载失败: ${e.message.substring(0, 80)}`);
        continue;
      }

      let countryCount = 0;

      for (const term of ppeSearchTerms.slice(0, 5)) {
        try {
          // Try fetch from agent domain
          const data = await page.evaluate(async (t) => {
            try {
              const patterns = [
                `/api/devices?search=${encodeURIComponent(t)}&page=1&limit=50`,
                `/api/${t}/devices?page=1&limit=50`,
              ];
              for (const url of patterns) {
                const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                  const json = await res.json();
                  if (json.devices || json.data || Array.isArray(json)) return json;
                }
              }
              return null;
            } catch (e) {
              return null;
            }
          }, term);

          if (!data) continue;

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
