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

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical|マスク|呼吸|호흡|respirador/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear|harness|ヘルメット|手袋|安全靴|안전모|장갑|안전화|capacete|luva|bota|óculos/i.test(n)) return 'medium';
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
  console.log('无头浏览器爬虫 v6 - API拦截版');
  console.log('通过拦截网络请求发现Pure Global AI内部API');
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
          data_confidence_level: product.data_confidence_level || 'high',
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

  console.log('\n启动无头浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  try {
    // ===== PHASE 1: Discover Pure Global AI API =====
    console.log('\n========================================');
    console.log('PHASE 1: 发现Pure Global AI内部API');
    console.log('========================================');

    const discoverPage = await browser.newPage();
    await discoverPage.setDefaultTimeout(60000);
    await discoverPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Intercept network requests
    const apiRequests = [];
    discoverPage.on('request', req => {
      const url = req.url();
      if (url.includes('api') || url.includes('search') || url.includes('device') || url.includes('product') || url.includes('database')) {
        if (!url.includes('.js') && !url.includes('.css') && !url.includes('.png') && !url.includes('.svg') && !url.includes('.ico')) {
          apiRequests.push({
            url: url.substring(0, 300),
            method: req.method(),
            headers: Object.keys(req.headers()).join(','),
          });
        }
      }
    });

    const apiResponses = [];
    discoverPage.on('response', async res => {
      const url = res.url();
      if ((url.includes('api') || url.includes('search') || url.includes('device') || url.includes('product')) && res.status() === 200) {
        try {
          const contentType = res.headers()['content-type'] || '';
          if (contentType.includes('json')) {
            const text = await res.text();
            apiResponses.push({
              url: url.substring(0, 300),
              status: res.status(),
              contentType,
              bodyPreview: text.substring(0, 2000),
            });
          }
        } catch (e) {}
      }
    });

    // Visit Pure Global AI and trigger a search
    console.log('\n  访问Pure Global AI...');
    await discoverPage.goto('https://agent.pureglobal.ai/medical-device/database', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(8000);

    // Try to find and use the search input
    console.log('  尝试搜索 "mask"...');
    try {
      const searchInput = await discoverPage.$('input[type="text"], input[type="search"], input:not([type])');
      if (searchInput) {
        await searchInput.click({ clickCount: 3 });
        await discoverPage.keyboard.type('mask', { delay: 50 });
        await sleep(1000);

        const searchBtn = await discoverPage.$('button[type="submit"], input[type="submit"], [class*="search"]');
        if (searchBtn) {
          await searchBtn.click();
        } else {
          await discoverPage.keyboard.press('Enter');
        }
        await sleep(8000);
      }
    } catch (e) {
      console.log('  搜索交互失败:', e.message.substring(0, 100));
    }

    // Also try the devices page
    console.log('  访问devices页面...');
    await discoverPage.goto('https://www.pureglobal.ai/devices', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(8000);

    try {
      const searchInput2 = await discoverPage.$('input[type="text"], input[type="search"]');
      if (searchInput2) {
        await searchInput2.click({ clickCount: 3 });
        await discoverPage.keyboard.type('mask', { delay: 50 });
        await sleep(1000);
        await discoverPage.keyboard.press('Enter');
        await sleep(8000);
      }
    } catch (e) {}

    // Report discovered APIs
    console.log('\n  === 发现的API请求 ===');
    apiRequests.forEach((req, i) => {
      console.log(`  [${i}] ${req.method} ${req.url}`);
    });

    console.log('\n  === 发现的API响应 ===');
    apiResponses.forEach((res, i) => {
      console.log(`  [${i}] ${res.url}`);
      console.log(`    Content-Type: ${res.contentType}`);
      console.log(`    Body预览: ${res.bodyPreview.substring(0, 500)}`);
    });

    await discoverPage.close();

    // ===== PHASE 2: Use discovered APIs =====
    console.log('\n========================================');
    console.log('PHASE 2: 使用发现的API获取数据');
    console.log('========================================');

    // Extract API base URL from discovered responses
    let apiBaseUrl = null;
    for (const res of apiResponses) {
      const url = new URL(res.url);
      if (res.bodyPreview.includes('device') || res.bodyPreview.includes('product') || res.bodyPreview.includes('name')) {
        apiBaseUrl = `${url.protocol}//${url.host}`;
        console.log(`  发现API基础URL: ${apiBaseUrl}`);
        console.log(`  API路径: ${url.pathname}`);
        console.log(`  响应示例: ${res.bodyPreview.substring(0, 500)}`);
        break;
      }
    }

    if (apiBaseUrl) {
      // Try to use the discovered API directly
      const apiPage = await browser.newPage();
      await apiPage.setDefaultTimeout(60000);

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
        { slug: 'usa', cc: 'US', auth: 'FDA' },
        { slug: 'european-union', cc: 'EU', auth: 'EUDAMED' },
        { slug: 'canada', cc: 'CA', auth: 'Health Canada' },
      ];

      const ppeTerms = [
        'mask', 'respirator', 'N95', 'glove', 'goggle',
        'face shield', 'helmet', 'safety boot', 'protective suit',
        'coverall', 'hearing protection', 'safety vest',
      ];

      let apiInserted = 0;

      for (const res of apiResponses) {
        if (!res.bodyPreview.includes('{') && !res.bodyPreview.includes('[')) continue;

        const url = new URL(res.url);
        const basePath = url.pathname;

        // Try to extract data from the response
        try {
          const jsonData = JSON.parse(res.bodyPreview);
          if (Array.isArray(jsonData)) {
            console.log(`  API返回数组: ${jsonData.length} 条`);
            for (const item of jsonData.slice(0, 50)) {
              const name = item.name || item.deviceName || item.productName || item.title || '';
              const mfr = item.manufacturer || item.manufacturerName || item.company || '';
              const code = item.productCode || item.deviceCode || item.code || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                product_code: (code || '').substring(0, 50),
                risk_level: determineRiskLevel(name),
                data_source: 'Pure Global AI API',
                registration_authority: 'Multi-country',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) apiInserted++;
            }
          } else if (jsonData.data || jsonData.results || jsonData.items) {
            const items = jsonData.data || jsonData.results || jsonData.items || [];
            console.log(`  API返回对象: ${items.length} 条`);
            for (const item of items.slice(0, 50)) {
              const name = item.name || item.deviceName || item.productName || item.title || '';
              const mfr = item.manufacturer || item.manufacturerName || item.company || '';
              const code = item.productCode || item.deviceCode || item.code || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                product_code: (code || '').substring(0, 50),
                risk_level: determineRiskLevel(name),
                data_source: 'Pure Global AI API',
                registration_authority: 'Multi-country',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) apiInserted++;
            }
          }
        } catch (e) {
          // Not valid JSON or no useful data
        }
      }

      // If we found an API pattern, try to use it for all countries and terms
      if (apiResponses.length > 0) {
        const sampleUrl = new URL(apiResponses[0].url);
        const apiPath = sampleUrl.pathname;

        for (const country of countries) {
          console.log(`\n  === ${country.slug.toUpperCase()} ===`);
          let countryCount = 0;

          for (const term of ppeTerms) {
            try {
              // Try various API URL patterns
              const tryUrls = [
                `${apiBaseUrl}${apiPath}?search=${encodeURIComponent(term)}&country=${country.slug}`,
                `${apiBaseUrl}${apiPath}?q=${encodeURIComponent(term)}&country=${country.cc}`,
                `${apiBaseUrl}/api/devices?search=${encodeURIComponent(term)}&country=${country.slug}`,
                `${apiBaseUrl}/api/v1/devices?search=${encodeURIComponent(term)}&country=${country.slug}`,
                `${apiBaseUrl}/api/search?query=${encodeURIComponent(term)}&country=${country.slug}`,
              ];

              for (const tryUrl of tryUrls) {
                await apiPage.goto(tryUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                const bodyText = await apiPage.evaluate(() => document.body.innerText);

                try {
                  const data = JSON.parse(bodyText);
                  const items = Array.isArray(data) ? data : (data.data || data.results || data.items || []);

                  if (items.length > 0) {
                    let termCount = 0;
                    for (const item of items.slice(0, 50)) {
                      const name = item.name || item.deviceName || item.productName || item.title || '';
                      const mfr = item.manufacturer || item.manufacturerName || item.company || '';
                      const code = item.productCode || item.deviceCode || item.code || '';
                      if (!name || name.length < 3) continue;

                      const category = categorizePPE(name);
                      const product = {
                        name: name.substring(0, 500),
                        category,
                        manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                        product_code: (code || '').substring(0, 50),
                        country_of_origin: country.cc,
                        risk_level: determineRiskLevel(name),
                        data_source: `Pure Global AI API - ${country.slug}`,
                        registration_authority: country.auth,
                        last_verified: new Date().toISOString().split('T')[0],
                        data_confidence_level: 'medium',
                      };

                      if (await insertProduct(product)) {
                        termCount++;
                        apiInserted++;
                        countryCount++;
                      }
                    }
                    if (termCount > 0) {
                      console.log(`    ${term}: ${termCount} 条 (via ${tryUrl.substring(0, 80)})`);
                      break; // Found working URL, no need to try others
                    }
                  }
                } catch (e) {
                  // Not JSON
                }
              }
              await sleep(1000);
            } catch (e) {
              // skip
            }
          }
          console.log(`  ${country.slug}: ${countryCount} 条`);
        }
      }

      await apiPage.close();
      console.log(`\n  API直接获取总计: ${apiInserted}`);
    }

    // ===== PHASE 3: PMDA Japan (optimized) =====
    console.log('\n========================================');
    console.log('PHASE 3: PMDA Japan (优化版)');
    console.log('========================================');

    let pmdaInserted = 0;
    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(90000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
      console.log('  加载PMDA搜索页面...');
      await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });
      await sleep(8000);

      // Get page structure without screenshot
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

      // Find the right search input - look for one related to device name
      const nameInput = pageInfo.inputs.find(i =>
        /販売名|一般的名称|名称|search|keyword|name/i.test(i.label || i.name || i.id || i.placeholder || '')
      );
      const targetInput = nameInput || pageInfo.inputs[0];

      if (targetInput) {
        console.log(`  搜索框: id="${targetInput.id}" name="${targetInput.name}" label="${targetInput.label}"`);

        const keywords = ['マスク', '防塵マスク', '防毒マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓'];

        for (const keyword of keywords) {
          try {
            console.log(`\n  搜索: ${keyword}`);

            // Reload page for each search
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

            // Click search button or press Enter
            const submitBtn = pageInfo.buttons.find(b =>
              /検索|submit/i.test(b.value || b.text || b.type || '')
            );
            if (submitBtn) {
              const btnSel = submitBtn.id ? `#${submitBtn.id}` : (submitBtn.name ? `[name="${submitBtn.name}"]` : 'input[type="submit"]');
              await pmdaPage.click(btnSel);
            } else {
              await pmdaPage.keyboard.press('Enter');
            }

            await sleep(10000);

            // Extract results
            const results = await pmdaPage.evaluate(() => {
              const items = [];
              const sels = ['table tbody tr', 'table tr', '.result-item'];
              for (const sel of sels) {
                const rows = document.querySelectorAll(sel);
                if (rows.length > 1) {
                  rows.forEach((row, idx) => {
                    if (idx === 0) return;
                    const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                    if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                      items.push(cells);
                    }
                  });
                  if (items.length > 0) break;
                }
              }

              // Fallback: extract from page text
              if (items.length === 0) {
                const body = document.body.innerText;
                const lines = body.split('\n').filter(l => l.trim().length > 5);
                const ppeLines = lines.filter(l => /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|防塵|防毒/i.test(l));
                ppeLines.slice(0, 30).forEach(line => items.push([line.trim().substring(0, 300)]));
              }

              return { items: items.slice(0, 50), url: window.location.href };
            });

            console.log(`  结果: ${results.items.length} 行, URL: ${results.url}`);

            for (const row of results.items) {
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
            console.log(`  错误: ${e.message.substring(0, 120)}`);
          }
        }
      }
    } catch (e) {
      console.log(`  PMDA加载失败: ${e.message.substring(0, 200)}`);
    }

    await pmdaPage.close();
    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

    // ===== PHASE 4: MFDS Korea (alternative approaches) =====
    console.log('\n========================================');
    console.log('PHASE 4: Korea MFDS (替代方案)');
    console.log('========================================');

    let mfdsInserted = 0;

    // Try multiple MFDS URLs
    const mfdsUrls = [
      'https://www.mfds.go.kr/eng/brd/m_41/list.do',
      'https://emedi.mfds.go.kr',
      'https://www.mfds.go.kr/brd/m_41/list.do',
      'https://md.kfda.go.kr/item',
    ];

    const mfdsPage = await browser.newPage();
    await mfdsPage.setDefaultTimeout(30000);
    await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const url of mfdsUrls) {
      try {
        console.log(`\n  尝试: ${url}`);
        await mfdsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(5000);

        const pageData = await mfdsPage.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.substring(0, 2000),
            tables: document.querySelectorAll('table').length,
          };
        });

        console.log(`  标题: ${pageData.title}`);
        console.log(`  表格: ${pageData.tables}`);
        console.log(`  文本预览: ${pageData.text.substring(0, 300)}`);

        // Try to extract data from tables
        if (pageData.tables > 0) {
          const tableData = await mfdsPage.evaluate(() => {
            const items = [];
            document.querySelectorAll('table tbody tr, table tr').forEach(row => {
              const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
              if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                items.push(cells);
              }
            });
            return items.slice(0, 100);
          });

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
        for (let p = 2; p <= 5; p++) {
          try {
            const pageUrl = url.includes('?') ? `${url}&pageIndex=${p}` : `${url}?pageIndex=${p}`;
            await mfdsPage.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await sleep(3000);

            const pageTableData = await mfdsPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              return items.slice(0, 100);
            });

            if (pageTableData.length === 0) break;

            let pageInserts = 0;
            for (const row of pageTableData) {
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

        if (mfdsInserted > 0) break; // Found working URL
      } catch (e) {
        console.log(`  失败: ${e.message.substring(0, 100)}`);
      }
    }

    await mfdsPage.close();
    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('爬取完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
