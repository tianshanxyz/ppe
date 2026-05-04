#!/usr/bin/env node
const puppeteer = require('puppeteer');
const axios = require('axios');
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
  console.log('全球PPE数据深度采集 v11');
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

    const eudamedApiData = [];
    eudamedPage.on('response', async (res) => {
      const url = res.url();
      if (res.status() === 200) {
        try {
          const ct = res.headers()['content-type'] || '';
          if (ct.includes('json') && (url.includes('device') || url.includes('udi'))) {
            const json = await res.json();
            eudamedApiData.push({ url, data: json });
          }
        } catch (e) { /* skip */ }
      }
    });

    try {
      console.log('  访问EUDAMED设备搜索页面...');
      await eudamedPage.goto('https://ec.europa.eu/tools/eudamed/#/screen/search-device', {
        waitUntil: 'networkidle2',
        timeout: 90000,
      });
      await sleep(10000);

      console.log(`  页面标题: ${await eudamedPage.title()}`);

      const eudamedKeywords = [
        'mask', 'respirator', 'glove', 'goggle', 'face shield',
        'helmet', 'earplug', 'safety boot', 'protective suit',
        'coverall', 'gown', 'N95', 'FFP2', 'FFP3',
      ];

      for (const keyword of eudamedKeywords) {
        try {
          console.log(`\n  搜索: ${keyword}`);

          const searchResult = await eudamedPage.evaluate(async (kw) => {
            try {
              const inputSelectors = [
                'input[type="text"]',
                'input[type="search"]',
                'input:not([type])',
                'input[placeholder]',
                '[class*="search"] input',
                '[class*="input"] input',
                'eui-input-text input',
              ];

              let searchInput = null;
              for (const sel of inputSelectors) {
                const inputs = document.querySelectorAll(sel);
                for (const input of inputs) {
                  if (input.offsetParent !== null && !input.disabled) {
                    const rect = input.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                      searchInput = input;
                      break;
                    }
                  }
                }
                if (searchInput) break;
              }

              if (!searchInput) {
                const allInputs = document.querySelectorAll('input');
                for (const input of allInputs) {
                  const rect = input.getBoundingClientRect();
                  if (rect.width > 50 && rect.height > 10) {
                    searchInput = input;
                    break;
                  }
                }
              }

              if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                searchInput.value = kw;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.dispatchEvent(new Event('change', { bubbles: true }));

                await new Promise(r => setTimeout(r, 500));

                const searchButtons = document.querySelectorAll('button, a[role="button"], [class*="search"]');
                let clicked = false;
                for (const btn of searchButtons) {
                  const text = (btn.textContent || '').toLowerCase().trim();
                  const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                  if (text.includes('search') || ariaLabel.includes('search') || btn.classList.contains('search') || btn.type === 'submit') {
                    btn.click();
                    clicked = true;
                    break;
                  }
                }

                if (!clicked) {
                  const form = searchInput.closest('form');
                  if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  }
                }

                return { found: true, clicked, inputType: searchInput.type, inputClass: searchInput.className };
              }

              return { found: false };
            } catch (e) {
              return { found: false, error: e.message };
            }
          }, keyword);

          console.log(`  搜索结果: ${JSON.stringify(searchResult)}`);
          await sleep(10000);

          const pageResults = await eudamedPage.evaluate(() => {
            const items = [];
            const rows = document.querySelectorAll('table tbody tr, [class*="device"], [class*="result"], [class*="card"]');
            rows.forEach(row => {
              const text = row.textContent?.trim() || '';
              if (text.length > 5 && text.length < 1000) {
                const nameEl = row.querySelector('td:first-child a, td:first-child, [class*="name"], [class*="title"], a');
                const mfrEl = row.querySelector('td:nth-child(2), [class*="manufacturer"]');
                if (nameEl) {
                  items.push({
                    name: nameEl.textContent?.trim() || '',
                    mfr: mfrEl?.textContent?.trim() || '',
                    fullText: text.substring(0, 500),
                  });
                }
              }
            });
            return items;
          });

          if (pageResults.length > 0) {
            console.log(`  页面结果: ${pageResults.length} 条`);
            let inserted = 0;
            for (const item of pageResults) {
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
                inserted++;
                eudamedInserted++;
              }
            }
            if (inserted > 0) console.log(`  ${keyword}: 插入 ${inserted} 条`);
          }
        } catch (e) {
          console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        }
      }

      console.log(`\n  拦截到 ${eudamedApiData.length} 个API响应`);
      for (const resp of eudamedApiData) {
        const data = resp.data;
        const items = Array.isArray(data) ? data
          : (data?.content || data?.devices || data?.data || data?.results || []);
        if (items.length > 0) {
          console.log(`  API: ${resp.url.substring(0, 100)} - ${items.length}条`);
          let apiInserted = 0;
          for (const item of items.slice(0, 200)) {
            const name = item.deviceName || item.name || item.tradeName || '';
            const mfrTexts = item.manufacturer?.actorDataPublicView?.name?.texts || [];
            const mfr = mfrTexts.find(t => t.language?.code === 'en')?.text
              || mfrTexts[0]?.text
              || item.manufacturerName || '';
            const basicUdi = item.basicUdi?.code || '';
            const riskClass = item.riskClass?.code || '';

            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              product_code: basicUdi.substring(0, 50),
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
          if (apiInserted > 0) console.log(`  API插入: ${apiInserted}条`);
        }
      }
    } catch (e) {
      console.log(`  EUDAMED失败: ${e.message?.substring(0, 200)}`);
    }

    await eudamedPage.close();
    console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

    // ===== PART 2: PMDA Japan =====
    console.log('\n========================================');
    console.log('PART 2: PMDA Japan');
    console.log('========================================');

    let pmdaInserted = 0;
    const pmdaKeywords = [
      'マスク', '防塵マスク', '呼吸用保護具', '保護手袋',
      'ゴーグル', 'ヘルメット', '安全靴', '保護衣',
      '防護服', '耳栓', '防毒マスク',
    ];

    for (const keyword of pmdaKeywords) {
      let pmdaPage;
      try {
        pmdaPage = await browser.newPage();
        await pmdaPage.setDefaultTimeout(60000);
        await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        console.log(`\n  搜索: ${keyword}`);

        await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await sleep(5000);

        await pmdaPage.waitForSelector('#txtName', { timeout: 15000 });
        await pmdaPage.click('#txtName', { clickCount: 3 });
        await pmdaPage.keyboard.type(keyword, { delay: 30 });
        await sleep(500);

        await pmdaPage.keyboard.press('Enter');
        await sleep(12000);

        const results = await pmdaPage.evaluate(() => {
          const items = [];
          const rows = document.querySelectorAll('table tbody tr, table tr');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) {
              items.push(cells);
            }
          });

          if (items.length === 0) {
            const allText = document.body.innerText;
            const lines = allText.split('\n').filter(l => l.trim().length > 3);
            const ppeLines = lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
            );
            for (const line of ppeLines.slice(0, 50)) {
              items.push([line.trim().substring(0, 300)]);
            }
          }

          return items.slice(0, 100);
        });

        console.log(`  结果: ${results.length} 行`);

        let keywordInserted = 0;
        for (const row of results) {
          const name = (row[0] || '').trim();
          const mfr = (row[2] || row[1] || '').trim();
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(name)) continue;

          const product = {
            name: name.substring(0, 500),
            category: category === '其他' ? '其他' : category,
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

        // Pagination for PMDA
        for (let pageNum = 2; pageNum <= 5; pageNum++) {
          try {
            const hasNext = await pmdaPage.evaluate((pn) => {
              const links = document.querySelectorAll('a, button, span, li');
              for (const link of links) {
                const text = (link.textContent || '').trim();
                if (text === String(pn) || text.includes('次へ') || text.includes('次')) {
                  link.click();
                  return true;
                }
              }
              return false;
            }, pageNum);

            if (!hasNext) break;
            await sleep(8000);

            const pageResults = await pmdaPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              return items.slice(0, 100);
            });

            if (pageResults.length === 0) break;

            let pageInserted = 0;
            for (const row of pageResults) {
              const name = (row[0] || '').trim();
              const mfr = (row[2] || row[1] || '').trim();
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(name)) continue;

              const product = {
                name: name.substring(0, 500),
                category: category === '其他' ? '其他' : category,
                manufacturer_name: mfr.substring(0, 500) || 'Unknown',
                country_of_origin: 'JP',
                risk_level: determineRiskLevel(name),
                data_source: 'PMDA Japan',
                registration_authority: 'PMDA',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) {
                pageInserted++;
                keywordInserted++;
                pmdaInserted++;
              }
            }
            if (pageInserted > 0) console.log(`  第${pageNum}页: ${pageInserted}条`);
          } catch (e) {
            break;
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

    const mfdsSearchUrls = [
      { url: 'https://emedi.mfds.go.kr/', desc: 'eMedi首页' },
      { url: 'https://nedrug.mfds.go.kr/searchDrug?searchYn=true&SearchClass=5&SearchWord=%EB%A7%88%EC%8A%A4%ED%81%AC', desc: 'Nedrug 마스크' },
    ];

    for (const searchUrl of mfdsSearchUrls) {
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
              if (ct.includes('json') && (url.includes('mfds') || url.includes('emedi') || url.includes('nedrug'))) {
                const json = await res.json();
                mfdsApiData.push({ url, data: json });
              }
            } catch (e) { /* skip */ }
          }
        });

        console.log(`  尝试: ${searchUrl.desc}`);
        await mfdsPage.goto(searchUrl.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(8000);

        const tableData = await mfdsPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
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

        // Check intercepted API data
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
        if (mfdsInserted > 0) break;
      } catch (e) {
        console.log(`  失败: ${e.message?.substring(0, 100)}`);
        if (mfdsPage) await mfdsPage.close().catch(() => {});
      }
    }

    // Try MFDS English page with axios
    if (mfdsInserted === 0) {
      console.log('\n  尝试MFDS英文页面...');
      try {
        const resp = await axios.get('https://www.mfds.go.kr/eng/brd/m_41/list.do', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
          timeout: 20000,
          validateStatus: () => true,
        });

        if (resp.status === 200 && typeof resp.data === 'string') {
          const html = resp.data;
          const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          for (const match of rowMatches) {
            const cells = match.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
            const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
            const name = cellTexts[1] || cellTexts[0] || '';
            if (!name || name.length < 3) continue;
            if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit|shield|ppe/i.test(name.toLowerCase())) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: 'Unknown',
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'medium',
            };

            if (await insertProduct(product)) mfdsInserted++;
          }
        }
      } catch (e) {
        console.log(`  MFDS英文页面失败: ${e.message?.substring(0, 100)}`);
      }
    }

    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

    // ===== PART 4: India / Saudi / Philippines =====
    console.log('\n========================================');
    console.log('PART 4: 印度/沙特/菲律宾');
    console.log('========================================');

    const countries = [
      { name: '印度', cc: 'IN', auth: 'CDSCO', slug: 'india' },
      { name: '沙特', cc: 'SA', auth: 'SFDA', slug: 'saudi-arabia' },
      { name: '菲律宾', cc: 'PH', auth: 'FDA Philippines', slug: 'philippines' },
    ];

    const ppeTerms = [
      'mask', 'respirator', 'N95', 'glove', 'goggle',
      'face shield', 'helmet', 'safety boot', 'protective suit',
      'coverall', 'gown', 'hearing protection', 'PPE',
    ];

    for (const country of countries) {
      console.log(`\n  === ${country.name} ===`);
      let countryInserted = 0;

      // Strategy 1: Direct government website
      const directUrls = {
        india: 'https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostic/Medical-Device-Diagnostic',
        'saudi-arabia': 'https://www.sfda.gov.sa/en/medical-equipment-list',
        philippines: 'https://verification.fda.gov.ph/medical_deviceslist.php',
      };

      // Strategy 2: Pure Global AI
      const pgUrl = `https://www.pureglobal.ai/${country.slug}/medical-device/database`;

      // Try Puppeteer with network interception for each country
      let countryPage;
      try {
        countryPage = await browser.newPage();
        await countryPage.setDefaultTimeout(30000);
        await countryPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        const countryApiData = [];
        countryPage.on('response', async (res) => {
          const url = res.url();
          if (res.status() === 200) {
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json')) {
                const json = await res.json();
                countryApiData.push({ url, data: json });
              }
            } catch (e) { /* skip */ }
          }
        });

        // First try direct government URL
        const directUrl = directUrls[country.slug];
        console.log(`  尝试政府网站: ${directUrl}`);
        await countryPage.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(8000);

        // Try searching on the government site
        for (const term of ppeTerms.slice(0, 4)) {
          try {
            const searchResult = await countryPage.evaluate((kw) => {
              const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
              for (const input of inputs) {
                if (input.offsetParent !== null) {
                  input.value = '';
                  input.focus();
                  input.value = kw;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));

                  const form = input.closest('form');
                  if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  }

                  const buttons = document.querySelectorAll('button, input[type="submit"]');
                  for (const btn of buttons) {
                    const text = (btn.textContent || btn.value || '').toLowerCase();
                    if (text.includes('search') || text.includes('検索') || btn.type === 'submit') {
                      btn.click();
                      break;
                    }
                  }
                  return true;
                }
              }
              return false;
            }, term);

            if (searchResult) await sleep(8000);
          } catch (e) { /* skip */ }
        }

        // Extract table data from government site
        const tableData = await countryPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });
          return items.slice(0, 200);
        });

        if (tableData.length > 0) {
          console.log(`  政府网站表格: ${tableData.length} 行`);
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
              data_source: `${country.auth}`,
              registration_authority: country.auth,
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) countryInserted++;
          }
        }

        // Check intercepted API data
        console.log(`  拦截到 ${countryApiData.length} 个API响应`);
        for (const resp of countryApiData) {
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

        // Strategy 2: Try Pure Global AI
        if (countryInserted === 0) {
          console.log(`  尝试Pure Global AI...`);
          await countryPage.goto(pgUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(8000);

          // Clear previous API data
          countryApiData.length = 0;

          // Try searching on Pure Global AI
          for (const term of ppeTerms.slice(0, 5)) {
            try {
              const searchResult = await countryPage.evaluate((kw) => {
                const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
                for (const input of inputs) {
                  if (input.offsetParent !== null) {
                    input.value = '';
                    input.focus();
                    input.value = kw;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    return true;
                  }
                }
                return false;
              }, term);

              if (searchResult) await sleep(5000);
            } catch (e) { /* skip */ }
          }

          // Check Pure Global AI API data
          console.log(`  Pure Global AI 拦截到 ${countryApiData.length} 个API响应`);
          for (const resp of countryApiData) {
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

          // Also extract from page DOM
          const pgTableData = await countryPage.evaluate(() => {
            const items = [];
            document.querySelectorAll('table tbody tr, [class*="device"], [class*="result"], [class*="card"]').forEach(el => {
              const text = el.textContent?.trim() || '';
              if (text.length > 5 && text.length < 1000) {
                const nameEl = el.querySelector('[class*="name"], [class*="title"], td:first-child, a');
                const mfrEl = el.querySelector('[class*="manufacturer"], td:nth-child(2)');
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

          for (const item of pgTableData) {
            const name = item.name.trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (item.mfr || 'Unknown').substring(0, 500),
              country_of_origin: country.cc,
              risk_level: determineRiskLevel(name),
              data_source: `Pure Global AI - ${country.name}`,
              registration_authority: country.auth,
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'medium',
            };

            if (await insertProduct(product)) countryInserted++;
          }
        }

        await countryPage.close();
      } catch (e) {
        console.log(`  ${country.name}失败: ${e.message?.substring(0, 100)}`);
        if (countryPage) await countryPage.close().catch(() => {});
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
