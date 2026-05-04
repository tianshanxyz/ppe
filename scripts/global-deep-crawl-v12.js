#!/usr/bin/env node
const puppeteer = require('puppeteer');
const axios = require('axios');
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

const axiosInstance = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
  }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});

async function main() {
  console.log('========================================');
  console.log('全球PPE数据深度采集 v12 - 精准版');
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
    console.log('PART 1: EUDAMED');
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
          if (ct.includes('json')) {
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
      await sleep(12000);

      console.log(`  页面标题: ${await eudamedPage.title()}`);

      // Debug: find all visible inputs
      const inputDebug = await eudamedPage.evaluate(() => {
        const inputs = [];
        document.querySelectorAll('input').forEach(i => {
          const rect = i.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            inputs.push({
              tag: i.tagName,
              type: i.type,
              id: i.id,
              name: i.name,
              class: i.className.substring(0, 80),
              placeholder: i.placeholder,
              rect: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
              visible: rect.width > 0,
            });
          }
        });
        return inputs;
      });
      console.log(`  可见输入框: ${JSON.stringify(inputDebug)}`);

      // Debug: find all buttons
      const btnDebug = await eudamedPage.evaluate(() => {
        const btns = [];
        document.querySelectorAll('button, a[role="button"]').forEach(b => {
          const rect = b.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            btns.push({
              text: (b.textContent || '').trim().substring(0, 50),
              class: b.className.substring(0, 80),
              type: b.type,
              ariaLabel: b.getAttribute('aria-label'),
            });
          }
        });
        return btns;
      });
      console.log(`  可见按钮: ${JSON.stringify(btnDebug)}`);

      const eudamedKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'N95', 'FFP2', 'coverall', 'gown'];

      for (const keyword of eudamedKeywords) {
        try {
          console.log(`\n  搜索: ${keyword}`);

          // Use Puppeteer's type method which triggers Angular change detection
          const inputSelector = 'input.form-control, input[type="text"], input:not([type])';

          // Clear and type using Puppeteer (not evaluate)
          await eudamedPage.click(inputSelector, { clickCount: 3 });
          await eudamedPage.keyboard.press('Backspace');
          await sleep(300);
          await eudamedPage.type(inputSelector, keyword, { delay: 50 });
          await sleep(1000);

          // Try clicking search button or pressing Enter
          const searchBtnClicked = await eudamedPage.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              const text = (btn.textContent || '').toLowerCase().trim();
              const icon = btn.querySelector('eui-icon, [class*="icon"], [class*="search"]');
              if (text.includes('search') || icon || btn.classList.contains('search-button') || btn.getAttribute('aria-label')?.toLowerCase().includes('search')) {
                btn.click();
                return true;
              }
            }
            return false;
          });

          if (!searchBtnClicked) {
            await eudamedPage.keyboard.press('Enter');
          }

          console.log(`  已触发搜索 (按钮: ${searchBtnClicked})`);
          await sleep(15000);

          // Debug: check what's on the page after search
          const pageContent = await eudamedPage.evaluate(() => {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 3);
            return {
              totalLines: lines.length,
              first20Lines: lines.slice(0, 20),
              hasResults: body.includes('result') || body.includes('device') || body.includes('found'),
              tableRows: document.querySelectorAll('table tr').length,
              cardElements: document.querySelectorAll('[class*="card"], [class*="device"], [class*="result"]').length,
            };
          });
          console.log(`  页面内容: ${pageContent.totalLines}行, 表格行:${pageContent.tableRows}, 卡片:${pageContent.cardElements}`);
          if (pageContent.first20Lines.length > 0) {
            console.log(`  前20行: ${JSON.stringify(pageContent.first20Lines.slice(0, 10))}`);
          }

          // Extract results from page
          const results = await eudamedPage.evaluate(() => {
            const items = [];

            // Try table rows
            document.querySelectorAll('table tbody tr, table tr').forEach(row => {
              const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
              if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                items.push({ type: 'table', cells });
              }
            });

            // Try card/list elements
            document.querySelectorAll('[class*="device"], [class*="result"], [class*="card"], [class*="item"]').forEach(el => {
              const text = el.textContent?.trim() || '';
              if (text.length > 5 && text.length < 1000) {
                const nameEl = el.querySelector('[class*="name"], [class*="title"], a, strong, b');
                const mfrEl = el.querySelector('[class*="manufacturer"], [class*="company"]');
                if (nameEl) {
                  items.push({
                    type: 'card',
                    name: nameEl.textContent?.trim() || '',
                    mfr: mfrEl?.textContent?.trim() || '',
                  });
                }
              }
            });

            // Try any visible text that looks like a device name
            if (items.length === 0) {
              const allText = document.body.innerText;
              const lines = allText.split('\n').filter(l => l.trim().length > 10 && l.trim().length < 200);
              const ppeLines = lines.filter(l =>
                /mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|n95|ffp/i.test(l)
              );
              ppeLines.slice(0, 30).forEach(line => {
                items.push({ type: 'text', name: line.trim(), mfr: '' });
              });
            }

            return items.slice(0, 100);
          });

          console.log(`  提取结果: ${results.length} 条`);
          if (results.length > 0) {
            console.log(`  示例: ${JSON.stringify(results.slice(0, 3))}`);
          }

          let inserted = 0;
          for (const item of results) {
            let name, mfr;
            if (item.type === 'table') {
              name = (item.cells[0] || '').trim();
              mfr = (item.cells[1] || '').trim();
            } else {
              name = item.name || '';
              mfr = item.mfr || '';
            }

            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
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
        } catch (e) {
          console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        }
      }

      // Check intercepted API data
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
    const pmdaKeywords = ['マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓', '防毒マスク'];

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

        // Click the search button
        const submitBtn = await pmdaPage.$('input[type="submit"], button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
        } else {
          await pmdaPage.keyboard.press('Enter');
        }

        await sleep(12000);

        // Debug: check page content
        const debugInfo = await pmdaPage.evaluate(() => {
          const rows = document.querySelectorAll('table tr');
          const sampleRows = [];
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const cells = Array.from(rows[i].querySelectorAll('td, th')).map(c => c.textContent.trim().substring(0, 80));
            sampleRows.push(cells);
          }
          return {
            totalRows: rows.length,
            sampleRows,
            pageTitle: document.title,
            bodyTextLength: document.body.innerText.length,
          };
        });
        console.log(`  调试: ${debugInfo.totalRows}行, 标题:${debugInfo.pageTitle}`);
        if (debugInfo.sampleRows.length > 0) {
          console.log(`  示例行: ${JSON.stringify(debugInfo.sampleRows.slice(0, 3))}`);
        }

        // Extract results with better parsing
        const results = await pmdaPage.evaluate(() => {
          const items = [];
          const rows = document.querySelectorAll('table tr');

          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length < 2) continue;

            // PMDA table structure: 販売名, 一般的名称, 承認番号, 製造販売業者名, etc.
            const salesName = cells[0] || '';
            const genericName = cells[1] || '';
            const approvalNo = cells[2] || '';
            const mfrName = cells[3] || cells[2] || '';

            if (!salesName && !genericName) continue;

            items.push({
              salesName,
              genericName,
              approvalNo,
              mfrName,
              allCells: cells.map(c => c.substring(0, 100)),
            });
          }

          if (items.length === 0) {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            const ppeLines = lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
            );
            for (const line of ppeLines.slice(0, 50)) {
              items.push({
                salesName: line.trim().substring(0, 300),
                genericName: '',
                approvalNo: '',
                mfrName: '',
                allCells: [line.trim().substring(0, 300)],
              });
            }
          }

          return items.slice(0, 100);
        });

        console.log(`  结果: ${results.length} 条`);
        if (results.length > 0) {
          console.log(`  示例: ${JSON.stringify(results.slice(0, 2).map(r => r.allCells))}`);
        }

        let keywordInserted = 0;
        for (const item of results) {
          const name = item.salesName || item.genericName || '';
          const mfr = item.mfrName || '';
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          // For PMDA, also accept items that match keyword even if category is 其他
          if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(name)) continue;

          const product = {
            name: name.substring(0, 500),
            category: category === '其他' ? categorizePPE(item.genericName || name) : category,
            manufacturer_name: mfr.substring(0, 500) || 'Unknown',
            product_code: item.approvalNo?.substring(0, 50) || '',
            country_of_origin: 'JP',
            risk_level: determineRiskLevel(name),
            data_source: 'PMDA Japan',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (product.category === '其他') product.category = categorizePPE(keyword);

          if (await insertProduct(product)) {
            keywordInserted++;
            pmdaInserted++;
          }
        }

        // Pagination
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
              document.querySelectorAll('table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2) {
                  items.push({
                    salesName: cells[0] || '',
                    genericName: cells[1] || '',
                    approvalNo: cells[2] || '',
                    mfrName: cells[3] || cells[2] || '',
                  });
                }
              });
              return items.slice(0, 100);
            });

            if (pageResults.length === 0) break;

            let pageInserted = 0;
            for (const item of pageResults) {
              const name = item.salesName || item.genericName || '';
              const mfr = item.mfrName || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(name)) continue;

              const product = {
                name: name.substring(0, 500),
                category: category === '其他' ? categorizePPE(keyword) : category,
                manufacturer_name: mfr.substring(0, 500) || 'Unknown',
                product_code: item.approvalNo?.substring(0, 50) || '',
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

    // Try MFDS with Puppeteer and different approach
    let mfdsPage;
    try {
      mfdsPage = await browser.newPage();
      await mfdsPage.setDefaultTimeout(30000);
      await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await mfdsPage.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      });

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

      // Try eMedi
      console.log('  尝试eMedi...');
      await mfdsPage.goto('https://emedi.mfds.go.kr/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(8000);

      const emediDebug = await mfdsPage.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        bodyLength: document.body.innerText.length,
        inputs: document.querySelectorAll('input').length,
        tables: document.querySelectorAll('table').length,
      }));
      console.log(`  eMedi: ${JSON.stringify(emediDebug)}`);

      // Try searching on eMedi
      if (emediDebug.inputs > 0) {
        const koreanKeywords = ['마스크', '보호구', '장갑', '고글', '안전모', '보호복'];
        for (const kw of koreanKeywords.slice(0, 3)) {
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
    } catch (e) {
      console.log(`  MFDS Puppeteer失败: ${e.message?.substring(0, 100)}`);
      if (mfdsPage) await mfdsPage.close().catch(() => {});
    }

    // Try MFDS with axios
    if (mfdsInserted === 0) {
      console.log('\n  尝试MFDS axios...');
      try {
        const resp = await axiosInstance.get('https://www.mfds.go.kr/eng/brd/m_41/list.do');
        if (resp.status === 200 && typeof resp.data === 'string') {
          const html = resp.data;
          const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          console.log(`  MFDS英文: ${rowMatches.length}行`);
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
        console.log(`  MFDS axios失败: ${e.message?.substring(0, 100)}`);
      }
    }

    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

    // ===== PART 4: India / Saudi / Philippines =====
    console.log('\n========================================');
    console.log('PART 4: 印度/沙特/菲律宾');
    console.log('========================================');

    const countries = [
      { name: '印度', cc: 'IN', auth: 'CDSCO', slug: 'india',
        urls: ['https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostic/Medical-Device-Diagnostic'] },
      { name: '沙特', cc: 'SA', auth: 'SFDA', slug: 'saudi-arabia',
        urls: ['https://www.sfda.gov.sa/en/medical-equipment-list'] },
      { name: '菲律宾', cc: 'PH', auth: 'FDA Philippines', slug: 'philippines',
        urls: ['https://verification.fda.gov.ph/medical_deviceslist.php'] },
    ];

    const ppeTerms = ['mask', 'respirator', 'N95', 'glove', 'goggle', 'face shield', 'helmet', 'protective suit', 'coverall', 'gown', 'PPE'];

    for (const country of countries) {
      console.log(`\n  === ${country.name} ===`);
      let countryInserted = 0;

      // Strategy 1: Try with Puppeteer
      let cPage;
      try {
        cPage = await browser.newPage();
        await cPage.setDefaultTimeout(30000);
        await cPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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

        for (const url of country.urls) {
          try {
            console.log(`  尝试: ${url}`);
            await cPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(8000);

            const debugInfo = await cPage.evaluate(() => ({
              title: document.title,
              url: window.location.href,
              inputs: document.querySelectorAll('input').length,
              tables: document.querySelectorAll('table').length,
              bodyLength: document.body.innerText.length,
            }));
            console.log(`  页面信息: ${JSON.stringify(debugInfo)}`);

            // Try searching
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
              console.log(`  示例: ${JSON.stringify(tableData.slice(0, 2))}`);

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

            // Check intercepted API data
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

            if (countryInserted > 0) break;
          } catch (e) {
            console.log(`  失败: ${e.message?.substring(0, 100)}`);
          }
        }

        // Strategy 2: Try Pure Global AI
        if (countryInserted === 0) {
          console.log(`  尝试Pure Global AI...`);
          try {
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

            // Also extract from page DOM
            const pgData = await cPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('[class*="device"], [class*="result"], [class*="card"], [class*="item"]').forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.length > 5 && text.length < 1000) {
                  const nameEl = el.querySelector('[class*="name"], [class*="title"], a, strong');
                  const mfrEl = el.querySelector('[class*="manufacturer"]');
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

            for (const item of pgData) {
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
          } catch (e) {
            console.log(`  Pure Global AI失败: ${e.message?.substring(0, 100)}`);
          }
        }

        await cPage.close();
      } catch (e) {
        console.log(`  ${country.name}失败: ${e.message?.substring(0, 100)}`);
        if (cPage) await cPage.close().catch(() => {});
      }

      // Strategy 3: Try axios for countries that failed
      if (countryInserted === 0) {
        console.log(`  尝试axios直接访问...`);
        try {
          if (country.slug === 'saudi-arabia') {
            const resp = await axiosInstance.get('https://www.sfda.gov.sa/en/medical-equipment-list');
            if (resp.status === 200 && typeof resp.data === 'string') {
              const html = resp.data;
              const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
              console.log(`  SFDA HTML: ${rowMatches.length}行`);
              for (const match of rowMatches) {
                const cells = match.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
                const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
                const name = cellTexts[0] || '';
                const mfr = cellTexts[2] || cellTexts[1] || '';
                if (!name || name.length < 3) continue;
                if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe/i.test(name.toLowerCase())) continue;

                const category = categorizePPE(name);
                if (category === '其他') continue;

                const product = {
                  name: name.substring(0, 500),
                  category,
                  manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                  country_of_origin: country.cc,
                  risk_level: determineRiskLevel(name),
                  data_source: 'SFDA Saudi Arabia',
                  registration_authority: 'SFDA',
                  last_verified: new Date().toISOString().split('T')[0],
                  data_confidence_level: 'high',
                };

                if (await insertProduct(product)) countryInserted++;
              }
            }
          } else if (country.slug === 'philippines') {
            const resp = await axiosInstance.get('https://verification.fda.gov.ph/medical_deviceslist.php');
            if (resp.status === 200 && typeof resp.data === 'string') {
              const html = resp.data;
              const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
              console.log(`  FDA PH HTML: ${rowMatches.length}行`);
              for (const match of rowMatches) {
                const cells = match.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
                const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
                const name = cellTexts[0] || cellTexts[1] || '';
                const mfr = cellTexts[2] || cellTexts[1] || '';
                if (!name || name.length < 3) continue;
                if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe/i.test(name.toLowerCase())) continue;

                const category = categorizePPE(name);
                if (category === '其他') continue;

                const product = {
                  name: name.substring(0, 500),
                  category,
                  manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                  country_of_origin: country.cc,
                  risk_level: determineRiskLevel(name),
                  data_source: 'FDA Philippines',
                  registration_authority: 'FDA Philippines',
                  last_verified: new Date().toISOString().split('T')[0],
                  data_confidence_level: 'medium',
                };

                if (await insertProduct(product)) countryInserted++;
              }
            }
          }
        } catch (e) {
          console.log(`  axios失败: ${e.message?.substring(0, 100)}`);
        }
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
