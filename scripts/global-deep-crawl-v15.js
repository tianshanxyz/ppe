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
  console.log('全球PPE数据采集 v15 - 浏览器内API调用版');
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

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    // ===== PART 1: EUDAMED - 使用浏览器内fetch调用API =====
    console.log('\n========================================');
    console.log('PART 1: EUDAMED (浏览器内API调用)');
    console.log('========================================');

    let eudamedInserted = 0;
    const eudamedPage = await browser.newPage();
    await eudamedPage.setDefaultTimeout(60000);
    await eudamedPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
      console.log('  访问EUDAMED建立会话...');
      await eudamedPage.goto('https://ec.europa.eu/tools/eudamed/#/screen/search-device', {
        waitUntil: 'networkidle2',
        timeout: 90000,
      });
      await sleep(10000);

      console.log(`  页面标题: ${await eudamedPage.title()}`);

      const eudamedKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'N95', 'FFP2', 'coverall', 'gown', 'earplug', 'safety boot'];

      for (const keyword of eudamedKeywords) {
        let page = 0;
        let totalForKeyword = 0;
        const maxPages = 10;

        while (page < maxPages) {
          try {
            // Use browser's fetch API to call EUDAMED search endpoint directly
            const searchResult = await eudamedPage.evaluate(async (kw, pg) => {
              try {
                const searchPayload = {
                  deviceName: kw,
                  page: pg,
                  size: 50,
                  languageIso2Code: 'en',
                };

                const response = await fetch('/tools/eudamed/api/devices/search', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                  body: JSON.stringify(searchPayload),
                });

                if (!response.ok) {
                  return { error: `HTTP ${response.status}`, url: response.url };
                }

                const data = await response.json();
                return { data, url: response.url };
              } catch (e) {
                return { error: e.message };
              }
            }, keyword, page);

            if (searchResult.error) {
              if (page === 0) console.log(`  ${keyword}: API错误 - ${searchResult.error}`);
              break;
            }

            const data = searchResult.data;
            const devices = data?.content || data?.devices || data?.data || [];
            const totalPages = data?.totalPages || data?.total_pages || 0;
            const totalElements = data?.totalElements || data?.total_elements || 0;

            if (page === 0) {
              console.log(`\n  ${keyword}: 共${totalElements}条, ${totalPages}页`);
            }

            if (devices.length === 0) break;

            let pageInserted = 0;
            for (const device of devices) {
              const name = device.deviceName || device.name || device.tradeName || '';
              const mfrTexts = device.manufacturer?.actorDataPublicView?.name?.texts || [];
              const mfr = mfrTexts.find(t => t.language?.code === 'en')?.text
                || mfrTexts[0]?.text
                || device.manufacturerName || '';
              const basicUdi = device.basicUdi?.code || '';
              const riskClass = device.riskClass?.code || '';
              const countryCode = device.manufacturer?.actorDataPublicView?.country?.iso2Code || 'EU';

              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                product_code: basicUdi.substring(0, 50),
                country_of_origin: countryCode || 'EU',
                risk_level: determineRiskLevel(name, riskClass),
                data_source: 'EUDAMED API',
                registration_authority: 'EUDAMED',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) {
                pageInserted++;
                eudamedInserted++;
                totalForKeyword++;
              }
            }

            if (pageInserted > 0) console.log(`    第${page + 1}页: ${pageInserted}条`);

            if (totalPages > 0 && page >= totalPages - 1) break;
            if (devices.length < 50) break;
            page++;
            await sleep(1000);
          } catch (e) {
            if (page === 0) console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
            break;
          }
        }

        if (totalForKeyword > 0) console.log(`  ${keyword} 总计: ${totalForKeyword}条`);
        await sleep(500);
      }
    } catch (e) {
      console.log(`  EUDAMED失败: ${e.message?.substring(0, 200)}`);
    }

    await eudamedPage.close();
    console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

    // ===== PART 2: PMDA Japan - 使用浏览器内搜索 =====
    console.log('\n========================================');
    console.log('PART 2: PMDA Japan');
    console.log('========================================');

    let pmdaInserted = 0;
    const pmdaKeywords = ['マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓'];

    for (const keyword of pmdaKeywords) {
      let pmdaPage;
      try {
        pmdaPage = await browser.newPage();
        await pmdaPage.setDefaultTimeout(90000);
        await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        console.log(`\n  搜索: ${keyword}`);

        await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await sleep(5000);

        // Use evaluate to fill form and find the correct submit mechanism
        const formInfo = await pmdaPage.evaluate(() => {
          const form = document.querySelector('form');
          const inputs = [];
          document.querySelectorAll('input[type="submit"], button').forEach(b => {
            inputs.push({
              tag: b.tagName,
              type: b.type,
              value: b.value,
              text: b.textContent?.trim()?.substring(0, 30),
              id: b.id,
              name: b.name,
              onclick: b.getAttribute('onclick')?.substring(0, 100),
            });
          });
          return {
            formAction: form?.action,
            formMethod: form?.method,
            formOnsubmit: form?.getAttribute('onsubmit')?.substring(0, 100),
            buttons: inputs,
          };
        });
        console.log(`  表单: action=${formInfo.formAction}, method=${formInfo.method}`);
        console.log(`  按钮: ${JSON.stringify(formInfo.buttons)}`);

        // Fill the search input
        await pmdaPage.evaluate((kw) => {
          const input = document.getElementById('txtName');
          if (input) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(input, kw);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, keyword);
        await sleep(500);

        // Try clicking the submit button
        const clickResult = await pmdaPage.evaluate(() => {
          const submitBtns = document.querySelectorAll('input[type="submit"], button[type="submit"]');
          for (const btn of submitBtns) {
            btn.click();
            return { clicked: true, value: btn.value, text: btn.textContent?.trim() };
          }

          // Try finding a search button by text
          const allBtns = document.querySelectorAll('button, input[type="button"]');
          for (const btn of allBtns) {
            const text = (btn.value || btn.textContent || '').trim();
            if (text.includes('検索') || text.includes('search')) {
              btn.click();
              return { clicked: true, value: btn.value, text };
            }
          }

          return { clicked: false };
        });
        console.log(`  点击: ${JSON.stringify(clickResult)}`);

        // Wait for navigation or AJAX
        await sleep(15000);

        // Check if page changed
        const afterSearch = await pmdaPage.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          tableRows: document.querySelectorAll('table tr').length,
          bodySample: document.body.innerText.substring(0, 300),
        }));
        console.log(`  搜索后: ${afterSearch.tableRows}表格行`);

        // Extract results
        const results = await pmdaPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });

          if (items.length === 0) {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            const ppeLines = lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
            );
            ppeLines.slice(0, 50).forEach(line => items.push([line.trim().substring(0, 300)]));
          }

          return items.slice(0, 100);
        });

        console.log(`  结果: ${results.length} 条`);

        let keywordInserted = 0;
        for (const row of results) {
          const name = (row[0] || '').trim();
          const mfr = (row[2] || row[1] || '').trim();
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(name)) continue;

          const product = {
            name: name.substring(0, 500),
            category: category === '其他' ? categorizePPE(keyword) : category,
            manufacturer_name: mfr.substring(0, 500) || 'Unknown',
            country_of_origin: 'JP',
            risk_level: determineRiskLevel(name),
            data_source: 'PMDA Japan',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) {
            keywordInserted++;
            pmdaInserted++;
          }
        }

        console.log(`  ${keyword}: ${keywordInserted}条`);
        await pmdaPage.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        if (pmdaPage) await pmdaPage.close().catch(() => {});
      }
    }

    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

    // ===== PART 3: Korea MFDS =====
    console.log('\n========================================');
    console.log('PART 3: Korea MFDS');
    console.log('========================================');

    let mfdsInserted = 0;
    let mfdsPage;
    try {
      mfdsPage = await browser.newPage();
      await mfdsPage.setDefaultTimeout(30000);
      await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const mfdsApiData = [];
      mfdsPage.on('response', async (res) => {
        const url = res.url();
        if (res.status() === 200) {
          try {
            const ct = res.headers()['content-type'] || '';
            if (ct.includes('json')) {
              const json = await res.json();
              mfdsApiData.push({ url, data: json });
            }
          } catch (e) { /* skip */ }
        }
      });

      console.log('  尝试eMedi...');
      await mfdsPage.goto('https://emedi.mfds.go.kr/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(8000);

      const emediInfo = await mfdsPage.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        bodyLength: document.body.innerText.length,
      }));
      console.log(`  eMedi: ${JSON.stringify(emediInfo)}`);

      if (emediInfo.bodyLength > 100) {
        const koreanKeywords = ['마스크', '보호구', '장갑', '고글', '안전모', '보호복'];
        for (const kw of koreanKeywords) {
          try {
            const input = await mfdsPage.$('input[type="text"], input[type="search"], input:not([type])');
            if (input) {
              await input.click({ clickCount: 3 });
              await mfdsPage.keyboard.type(kw, { delay: 30 });
              await mfdsPage.keyboard.press('Enter');
              await sleep(8000);

              const tableData = await mfdsPage.evaluate(() => {
                const items = [];
                document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
                });
                return items.slice(0, 100);
              });

              if (tableData.length > 0) {
                console.log(`  ${kw}: ${tableData.length}行`);
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
            }
          } catch (e) {
            console.log(`  ${kw}: 错误 - ${e.message?.substring(0, 80)}`);
          }
        }
      }

      // Check API data
      console.log(`  拦截到 ${mfdsApiData.length} 个API响应`);
      for (const resp of mfdsApiData) {
        const items = Array.isArray(resp.data) ? resp.data
          : (resp.data?.list || resp.data?.data || resp.data?.items || resp.data?.content || []);
        if (items.length > 0) {
          console.log(`  API: ${resp.url.substring(0, 80)} - ${items.length}条`);
          for (const item of items.slice(0, 100)) {
            const name = item.productName || item.deviceName || item.name || item.ITEM_NAME || '';
            const mfr = item.manufacturer || item.manufacturerName || item.ENTP_NAME || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea API',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) mfdsInserted++;
          }
        }
      }

      await mfdsPage.close();
    } catch (e) {
      console.log(`  MFDS失败: ${e.message?.substring(0, 100)}`);
      if (mfdsPage) await mfdsPage.close().catch(() => {});
    }

    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

    // ===== PART 4: India / Saudi / Philippines =====
    console.log('\n========================================');
    console.log('PART 4: 印度/沙特/菲律宾');
    console.log('========================================');

    const countries = [
      { name: '印度', cc: 'IN', auth: 'CDSCO', slug: 'india',
        govUrl: 'https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostic/Medical-Device-Diagnostic' },
      { name: '沙特', cc: 'SA', auth: 'SFDA', slug: 'saudi-arabia',
        govUrl: 'https://www.sfda.gov.sa/en/medical-equipment-list' },
      { name: '菲律宾', cc: 'PH', auth: 'FDA Philippines', slug: 'philippines',
        govUrl: 'https://verification.fda.gov.ph/medical_deviceslist.php' },
    ];

    const ppeTerms = ['mask', 'respirator', 'N95', 'glove', 'goggle', 'face shield', 'helmet', 'protective suit', 'coverall', 'gown', 'PPE'];

    for (const country of countries) {
      console.log(`\n  === ${country.name} ===`);
      let countryInserted = 0;

      let cPage;
      try {
        cPage = await browser.newPage();
        await cPage.setDefaultTimeout(30000);
        await cPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        const cApiData = [];
        cPage.on('response', async (res) => {
          const url = res.url();
          if (res.status() === 200) {
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json')) {
                const json = await res.json();
                cApiData.push({ url, data: json });
              }
            } catch (e) { /* skip */ }
          }
        });

        console.log(`  尝试: ${country.govUrl}`);
        await cPage.goto(country.govUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(8000);

        const pageInfo = await cPage.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          inputs: document.querySelectorAll('input').length,
          tables: document.querySelectorAll('table').length,
          bodyLength: document.body.innerText.length,
        }));
        console.log(`  页面: ${JSON.stringify(pageInfo)}`);

        // Search
        for (const term of ppeTerms.slice(0, 3)) {
          try {
            const input = await cPage.$('input[type="text"], input[type="search"], input:not([type])');
            if (input) {
              await input.click({ clickCount: 3 });
              await cPage.keyboard.type(term, { delay: 30 });
              await cPage.keyboard.press('Enter');
              await sleep(8000);
            }
          } catch (e) { /* skip */ }
        }

        // Extract table data
        const tableData = await cPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });
          return items.slice(0, 200);
        });

        if (tableData.length > 0) {
          console.log(`  表格: ${tableData.length}行`);
          for (const row of tableData) {
            const name = (row[0] || row[1] || '').trim();
            const mfr = (row[2] || row[1] || '').trim();
            if (!name || name.length < 3) continue;
            if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe|n95|ffp/i.test(name.toLowerCase())) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              country_of_origin: country.cc,
              risk_level: determineRiskLevel(name),
              data_source: country.auth,
              registration_authority: country.auth,
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) countryInserted++;
          }
        }

        // Check API data
        console.log(`  拦截到 ${cApiData.length} 个API响应`);
        for (const resp of cApiData) {
          const items = Array.isArray(resp.data) ? resp.data
            : (resp.data?.data || resp.data?.devices || resp.data?.results || resp.data?.list || resp.data?.content || []);
          if (items.length > 0) {
            console.log(`  API: ${resp.url.substring(0, 80)} - ${items.length}条`);
            for (const item of items.slice(0, 100)) {
              const name = item.deviceName || item.name || item.productName || item.brandName || '';
              const mfr = item.manufacturer || item.manufacturerName || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                country_of_origin: country.cc,
                risk_level: determineRiskLevel(name, item.deviceClass || item.classification),
                data_source: `${country.auth} API`,
                registration_authority: country.auth,
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) countryInserted++;
            }
          }
        }

        // Try Pure Global AI
        if (countryInserted === 0) {
          console.log(`  尝试Pure Global AI...`);
          await cPage.goto(`https://www.pureglobal.ai/${country.slug}/medical-device/database`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          await sleep(8000);

          cApiData.length = 0;

          for (const term of ppeTerms.slice(0, 5)) {
            try {
              const input = await cPage.$('input[type="text"], input[type="search"], input:not([type])');
              if (input) {
                await input.click({ clickCount: 3 });
                await cPage.keyboard.type(term, { delay: 30 });
                await cPage.keyboard.press('Enter');
                await sleep(5000);
              }
            } catch (e) { /* skip */ }
          }

          console.log(`  PG AI 拦截到 ${cApiData.length} 个API响应`);
          for (const resp of cApiData) {
            const items = Array.isArray(resp.data) ? resp.data
              : (resp.data?.data || resp.data?.devices || resp.data?.results || []);
            if (items.length > 0) {
              console.log(`  PG API: ${resp.url.substring(0, 80)} - ${items.length}条`);
              for (const item of items.slice(0, 100)) {
                const name = item.deviceName || item.name || item.productName || '';
                const mfr = item.manufacturer || item.manufacturerName || '';
                if (!name || name.length < 3) continue;

                const category = categorizePPE(name);
                if (category === '其他') continue;

                const product = {
                  name: name.substring(0, 500),
                  category,
                  manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                  country_of_origin: country.cc,
                  risk_level: determineRiskLevel(name, item.deviceClass),
                  data_source: `Pure Global AI - ${country.name}`,
                  registration_authority: country.auth,
                  last_verified: new Date().toISOString().split('T')[0],
                  data_confidence_level: 'medium',
                };

                if (await insertProduct(product)) countryInserted++;
              }
            }
          }
        }

        await cPage.close();
      } catch (e) {
        console.log(`  ${country.name}失败: ${e.message?.substring(0, 100)}`);
        if (cPage) await cPage.close().catch(() => {});
      }

      console.log(`  ${country.name}总计插入: ${countryInserted}`);
    }

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
