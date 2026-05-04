#!/usr/bin/env node
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

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
  if (deviceClass === '3' || deviceClass === 'Class III' || deviceClass === 'C' || deviceClass === 'Class C') return 'high';
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (deviceClass === '2' || deviceClass === 'Class II' || deviceClass === 'B' || deviceClass === 'Class B' || /helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
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
  console.log('全球PPE数据深度采集 v9');
  console.log('EUDAMED + PMDA + MFDS + 印度/沙特/菲律宾');
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
    // ===== PART 1: EUDAMED =====
    console.log('\n========================================');
    console.log('PART 1: EUDAMED 欧盟医疗器械数据库');
    console.log('========================================');

    let eudamedInserted = 0;
    const eudamedPage = await browser.newPage();
    await eudamedPage.setDefaultTimeout(60000);
    await eudamedPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Intercept API responses
    const eudamedApiData = [];
    eudamedPage.on('response', async (res) => {
      const url = res.url();
      if (url.includes('eudamed') && url.includes('device') && res.status() === 200) {
        try {
          const contentType = res.headers()['content-type'] || '';
          if (contentType.includes('json')) {
            const json = await res.json();
            eudamedApiData.push({ url, data: json });
          }
        } catch (e) {}
      }
    });

    try {
      console.log('\n  访问EUDAMED公开搜索页面...');
      await eudamedPage.goto('https://ec.europa.eu/tools/eudamed/#/search', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await sleep(8000);

      console.log(`  页面标题: ${await eudamedPage.title()}`);

      // Try to navigate to device search
      const deviceSearchUrl = 'https://ec.europa.eu/tools/eudamed/#/screen/search/device';
      await eudamedPage.goto(deviceSearchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await sleep(8000);

      // Search for PPE keywords
      const eudamedKeywords = [
        'mask', 'respirator', 'glove', 'goggle', 'face shield',
        'helmet', 'earplug', 'safety boot', 'protective suit',
        'coverall', 'gown', 'hearing protector',
      ];

      for (const keyword of eudamedKeywords) {
        try {
          console.log(`\n  搜索: ${keyword}`);

          // Try to find and fill search input
          const searchInput = await eudamedPage.$('input[type="text"], input[type="search"], input:not([type])');
          if (searchInput) {
            await searchInput.click({ clickCount: 3 });
            await eudamedPage.keyboard.type(keyword, { delay: 30 });
            await sleep(500);

            // Try to click search button
            const searchBtn = await eudamedPage.$('button[type="submit"], .search-btn, [class*="search"]');
            if (searchBtn) {
              await searchBtn.click();
            } else {
              await eudamedPage.keyboard.press('Enter');
            }

            await sleep(8000);

            // Extract results from page
            const results = await eudamedPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, .result-item, [class*="device"], [class*="result"]').forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.length > 5 && text.length < 500) {
                  const nameEl = el.querySelector('td:first-child, .name, .title, a');
                  const mfrEl = el.querySelector('td:nth-child(2), .manufacturer, [class*="manufacturer"]');
                  if (nameEl) {
                    items.push({
                      name: nameEl.textContent?.trim() || '',
                      mfr: mfrEl?.textContent?.trim() || '',
                    });
                  }
                }
              });
              return items;
            });

            let termInserted = 0;
            for (const item of results) {
              const name = item.name.trim();
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (item.mfr || 'Unknown').substring(0, 500),
                country_of_origin: 'EU',
                risk_level: determineRiskLevel(name),
                data_source: 'EUDAMED',
                registration_authority: 'EUDAMED',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) {
                termInserted++;
                eudamedInserted++;
              }
            }

            if (termInserted > 0) console.log(`    ${keyword}: ${termInserted} 条`);
          }
        } catch (e) {
          console.log(`    错误: ${e.message.substring(0, 100)}`);
        }
      }

      // Check intercepted API data
      console.log(`\n  拦截到 ${eudamedApiData.length} 个EUDAMED API响应`);
      for (const resp of eudamedApiData) {
        const data = resp.data;
        const items = Array.isArray(data) ? data : (data?.content || data?.devices || data?.data || []);
        if (items.length > 0) {
          console.log(`  API: ${resp.url.substring(0, 100)}`);
          console.log(`  数据量: ${items.length}`);
          let apiInserted = 0;
          for (const item of items.slice(0, 100)) {
            const name = item.deviceName || item.name || item.tradeName || '';
            const mfr = item.manufacturerName || item.manufacturer || '';
            const code = item.udiDi || item.basicUdiDi || '';
            const riskClass = item.riskClass || item.deviceClass || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              product_code: (code || '').substring(0, 50),
              country_of_origin: 'EU',
              risk_level: determineRiskLevel(name, riskClass),
              data_source: 'EUDAMED API',
              registration_authority: 'EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              apiInserted++;
              eudamedInserted++;
            }
          }
          if (apiInserted > 0) console.log(`  API插入: ${apiInserted} 条`);
        }
      }
    } catch (e) {
      console.log(`  EUDAMED加载失败: ${e.message.substring(0, 200)}`);
    }

    await eudamedPage.close();
    console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

    // ===== PART 2: PMDA Japan =====
    console.log('\n========================================');
    console.log('PART 2: PMDA Japan');
    console.log('========================================');

    let pmdaInserted = 0;
    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(90000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const pmdaApiData = [];
    pmdaPage.on('response', async (res) => {
      const url = res.url();
      if (url.includes('pmda') && res.status() === 200) {
        try {
          const contentType = res.headers()['content-type'] || '';
          if (contentType.includes('json')) {
            const json = await res.json();
            pmdaApiData.push({ url, data: json });
          }
        } catch (e) {}
      }
    });

    try {
      console.log('  访问PMDA搜索页面...');
      await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });
      await sleep(8000);

      // Get page structure
      const pageInfo = await pmdaPage.evaluate(() => {
        const info = { inputs: [], buttons: [] };
        document.querySelectorAll('input[type="text"], input:not([type])').forEach(i => {
          if (i.offsetParent !== null) {
            const parent = i.closest('tr, div, li, dd');
            const label = parent ? parent.querySelector('label, th, .label') : null;
            info.inputs.push({
              id: i.id, name: i.name, placeholder: i.placeholder,
              label: label ? label.textContent.trim().substring(0, 80) : '',
              size: i.size,
            });
          }
        });
        document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(b => {
          if (b.offsetParent !== null) {
            info.buttons.push({
              id: b.id, name: b.name, type: b.type,
              value: b.value, text: b.textContent?.trim()?.substring(0, 50),
            });
          }
        });
        return info;
      });

      console.log(`  输入框: ${pageInfo.inputs.length}, 按钮: ${pageInfo.buttons.length}`);

      // Find the right search input
      const targetInput = pageInfo.inputs.find(i =>
        /販売名|一般的名称|名称|search|keyword|name/i.test(i.label || i.name || i.id || '')
      ) || pageInfo.inputs[0];

      if (targetInput) {
        console.log(`  搜索框: id="${targetInput.id}" label="${targetInput.label}"`);

        const keywords = ['マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓'];

        for (const keyword of keywords) {
          try {
            console.log(`  搜索: ${keyword}`);

            await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
              waitUntil: 'domcontentloaded',
              timeout: 60000,
            });
            await sleep(3000);

            const inputSel = targetInput.id ? `#${targetInput.id}` : `[name="${targetInput.name}"]`;
            await pmdaPage.waitForSelector(inputSel, { timeout: 10000 });
            await pmdaPage.click(inputSel, { clickCount: 3 });
            await pmdaPage.keyboard.type(keyword, { delay: 30 });
            await sleep(500);

            const submitBtn = pageInfo.buttons.find(b => /検索|submit/i.test(b.value || b.text || b.type || ''));
            if (submitBtn) {
              const btnSel = submitBtn.id ? `#${submitBtn.id}` : (submitBtn.name ? `[name="${submitBtn.name}"]` : 'input[type="submit"]');
              await pmdaPage.click(btnSel);
            } else {
              await pmdaPage.keyboard.press('Enter');
            }

            await sleep(10000);

            const results = await pmdaPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              if (items.length === 0) {
                const body = document.body.innerText;
                const lines = body.split('\n').filter(l => l.trim().length > 5);
                const ppeLines = lines.filter(l => /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸/i.test(l));
                ppeLines.slice(0, 30).forEach(line => items.push([line.trim().substring(0, 300)]));
              }
              return items.slice(0, 50);
            });

            console.log(`  结果: ${results.length} 行`);

            for (const row of results) {
              const name = (row[0] || '').trim();
              const mfr = (row[2] || row[1] || '').trim();
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸/i.test(name)) continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: mfr.substring(0, 500) || 'Unknown',
                country_of_origin: 'JP',
                risk_level: determineRiskLevel(name),
                data_source: 'PMDA Japan',
                registration_authority: 'PMDA',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) pmdaInserted++;
            }
          } catch (e) {
            console.log(`  错误: ${e.message.substring(0, 100)}`);
          }
        }
      }

      // Check intercepted PMDA API data
      console.log(`\n  拦截到 ${pmdaApiData.length} 个PMDA API响应`);
      for (const resp of pmdaApiData) {
        const items = Array.isArray(resp.data) ? resp.data : (resp.data?.data || resp.data?.results || []);
        if (items.length > 0) {
          console.log(`  API: ${resp.url.substring(0, 100)} - ${items.length} 条`);
          for (const item of items.slice(0, 50)) {
            const name = item.deviceName || item.name || item.productName || '';
            const mfr = item.manufacturer || item.manufacturerName || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              country_of_origin: 'JP',
              risk_level: determineRiskLevel(name),
              data_source: 'PMDA API',
              registration_authority: 'PMDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) pmdaInserted++;
          }
        }
      }
    } catch (e) {
      console.log(`  PMDA加载失败: ${e.message.substring(0, 200)}`);
    }

    await pmdaPage.close();
    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

    // ===== PART 3: Korea MFDS =====
    console.log('\n========================================');
    console.log('PART 3: Korea MFDS');
    console.log('========================================');

    let mfdsInserted = 0;
    const mfdsPage = await browser.newPage();
    await mfdsPage.setDefaultTimeout(30000);
    await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const mfdsApiData = [];
    mfdsPage.on('response', async (res) => {
      const url = res.url();
      if ((url.includes('mfds') || url.includes('emedi')) && res.status() === 200) {
        try {
          const contentType = res.headers()['content-type'] || '';
          if (contentType.includes('json')) {
            const json = await res.json();
            mfdsApiData.push({ url, data: json });
          }
        } catch (e) {}
      }
    });

    // Try multiple MFDS URLs
    const mfdsUrls = [
      'https://emedi.mfds.go.kr',
      'https://www.mfds.go.kr/eng/brd/m_41/list.do',
    ];

    for (const url of mfdsUrls) {
      try {
        console.log(`  尝试: ${url}`);
        await mfdsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(5000);

        const tableData = await mfdsPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });
          return items.slice(0, 100);
        });

        if (tableData.length > 0) {
          console.log(`  表格数据: ${tableData.length} 行`);

          for (const row of tableData) {
            const name = (row[0] || row[1] || '').trim();
            const mfr = (row[2] || row[1] || '').trim();
            if (!name || name.length < 3) continue;
            if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit|shield|마스크|장갑|고글|안전|보호|방호|호흡/i.test(name)) continue;

            const category = categorizePPE(name);
            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: mfr.substring(0, 500) || 'Unknown',
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) mfdsInserted++;
          }
        }

        // Try pagination
        for (let p = 2; p <= 10; p++) {
          try {
            const pageUrl = url.includes('?') ? `${url}&pageIndex=${p}` : `${url}?pageIndex=${p}`;
            await mfdsPage.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await sleep(3000);

            const pageData = await mfdsPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              return items.slice(0, 100);
            });

            if (pageData.length === 0) break;

            let pageInserts = 0;
            for (const row of pageData) {
              const name = (row[0] || row[1] || '').trim();
              const mfr = (row[2] || row[1] || '').trim();
              if (!name || name.length < 3) continue;
              if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit|shield|마스크|장갑|고글|안전|보호|방호|호흡/i.test(name)) continue;

              const category = categorizePPE(name);
              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: mfr.substring(0, 500) || 'Unknown',
                country_of_origin: 'KR',
                risk_level: determineRiskLevel(name),
                data_source: 'MFDS Korea',
                registration_authority: 'MFDS',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) { mfdsInserted++; pageInserts++; }
            }
            if (pageInserts > 0) console.log(`  第${p}页: ${pageInserts} 条`);
            await sleep(2000);
          } catch (e) { break; }
        }

        if (mfdsInserted > 0) break;
      } catch (e) {
        console.log(`  失败: ${e.message.substring(0, 100)}`);
      }
    }

    // Check intercepted MFDS API data
    console.log(`\n  拦截到 ${mfdsApiData.length} 个MFDS API响应`);

    await mfdsPage.close();
    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

    // ===== PART 4: India/Saudi/Philippines via Pure Global AI =====
    console.log('\n========================================');
    console.log('PART 4: 印度/沙特/菲律宾 (via Pure Global AI)');
    console.log('========================================');

    let pgInserted = 0;
    const pgPage = await browser.newPage();
    await pgPage.setDefaultTimeout(60000);
    await pgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // Establish session on Pure Global AI
    await pgPage.goto('https://www.pureglobal.ai/devices', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(8000);

    const countries = [
      { slug: 'india', cc: 'IN', auth: 'CDSCO' },
      { slug: 'saudi-arabia', cc: 'SA', auth: 'SFDA' },
      { slug: 'philippines', cc: 'PH', auth: 'FDA Philippines' },
    ];

    const ppeTerms = [
      'mask', 'respirator', 'N95', 'glove', 'goggle',
      'face shield', 'helmet', 'safety boot', 'protective suit',
      'coverall', 'gown', 'hearing protection',
    ];

    for (const country of countries) {
      console.log(`\n  === ${country.slug.toUpperCase()} ===`);
      let countryCount = 0;

      // First try the Pure Global AI country-specific database
      await pgPage.goto(`https://agent.pureglobal.ai/${country.slug}/medical-device/database`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(5000);

      for (const term of ppeTerms) {
        try {
          // Use browser fetch to call Pure Global AI API
          const data = await pgPage.evaluate(async (t, slug) => {
            try {
              const urls = [
                `https://agent.pureglobal.ai/api/devices?search=${encodeURIComponent(t)}&country=${slug}&page=1&limit=50`,
                `https://agent.pureglobal.ai/api/${slug}/devices?search=${encodeURIComponent(t)}&page=1&limit=50`,
              ];
              for (const url of urls) {
                const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                  const json = await res.json();
                  if (json.devices || json.data || json.results || Array.isArray(json)) return json;
                }
              }
              return null;
            } catch (e) {
              return null;
            }
          }, term, country.slug);

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
              pgInserted++;
              countryCount++;
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

    // Also try SFDA Saudi Arabia directly
    console.log('\n  尝试SFDA沙特直接访问...');
    try {
      await pgPage.goto('https://www.sfda.gov.sa/en/medical-equipment-list', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(5000);

      // Intercept SFDA API calls
      const sfdaData = await pgPage.evaluate(() => {
        const items = [];
        document.querySelectorAll('table tbody tr, table tr').forEach(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
          if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
        });
        return items;
      });

      console.log(`  SFDA表格数据: ${sfdaData.length} 行`);

      for (const row of sfdaData) {
        const name = (row[0] || '').trim();
        const mfr = (row[2] || row[1] || '').trim();
        const classification = (row[1] || '').trim();
        if (!name || name.length < 3) continue;

        if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit|shield|ppe/i.test(name.toLowerCase())) continue;

        const category = categorizePPE(name);
        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: mfr.substring(0, 500) || 'Unknown',
          country_of_origin: 'SA',
          risk_level: determineRiskLevel(name, classification),
          data_source: 'SFDA Saudi Arabia',
          registration_authority: 'SFDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) pgInserted++;
      }
    } catch (e) {
      console.log(`  SFDA直接访问失败: ${e.message.substring(0, 100)}`);
    }

    await pgPage.close();
    console.log(`\n  印度/沙特/菲律宾总计插入: ${pgInserted}`);

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
