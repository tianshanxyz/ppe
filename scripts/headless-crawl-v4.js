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
  console.log('无头浏览器爬虫 v4 - PMDA + MFDS + Pure Global AI');
  console.log('免费数据获取方案（无需API Key）');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number');
  const existingKeys = new Set();
  const existingRegKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
    if (p.registration_number) existingRegKeys.add(p.registration_number.trim());
  });
  console.log(`现有产品: ${existingProducts.length}, 去重键: ${existingKeys.size}`);

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
    protocolTimeout: 180000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  try {
    // ===== PART 1: PMDA Japan =====
    await crawlPMDA(browser);

    // ===== PART 2: Korea MFDS =====
    await crawlMFDS(browser);

    // ===== PART 3: Pure Global AI (Free!) =====
    await crawlPureGlobal(browser);

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

async function crawlPMDA(browser) {
  console.log('\n========================================');
  console.log('PART 1: PMDA Japan 医療機器検索');
  console.log('========================================');

  const pmdaKeywords = [
    'マスク', '呼吸用保護具', '防塵マスク', '防毒マスク',
    '手袋', '保護手袋', 'ゴーグル', '保護めがね',
    'ヘルメット', '安全帽', '耳栓', '聴覚保護',
    '安全靴', '保護衣', '防護服', '保護面',
    'N95', 'FFP2', '防護手袋', '化学防護',
  ];

  let pmdaInserted = 0;

  // Strategy 1: PMDA Search (kikiSearch)
  const page = await browser.newPage();
  await page.setDefaultTimeout(60000);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('\n  [策略1] PMDA 添付文書検索...');
    await page.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);

    // Analyze page structure first
    const pageInfo = await page.evaluate(() => {
      const info = { title: document.title, url: window.location.href, inputs: [], buttons: [], forms: [] };
      document.querySelectorAll('form').forEach(f => {
        info.forms.push({ id: f.id, action: f.action, method: f.method });
      });
      document.querySelectorAll('input, select, textarea').forEach(i => {
        info.inputs.push({
          tag: i.tagName, type: i.type, name: i.name, id: i.id,
          value: i.value, placeholder: i.placeholder,
          visible: i.offsetParent !== null || i.type === 'hidden',
        });
      });
      document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(b => {
        info.buttons.push({
          tag: b.tagName, type: b.type, name: b.name, id: b.id,
          value: b.value, text: b.textContent?.trim()?.substring(0, 50),
          visible: b.offsetParent !== null,
        });
      });
      return info;
    });

    console.log(`  页面: ${pageInfo.title}`);
    console.log(`  表单: ${pageInfo.forms.length}`);
    console.log(`  输入: ${pageInfo.inputs.filter(i => i.visible).length} 可见`);
    console.log(`  按钮: ${pageInfo.buttons.filter(b => b.visible).length} 可见`);

    // Find visible text inputs
    const textInputs = pageInfo.inputs.filter(i => i.visible && (i.type === 'text' || i.type === 'search' || !i.type || i.type === ''));
    console.log(`  可搜索输入框: ${textInputs.length}`);

    if (textInputs.length > 0) {
      for (const keyword of pmdaKeywords) {
        try {
          console.log(`\n  搜索: ${keyword}`);

          // Clear and type
          const inputSel = textInputs[0].id ? `#${textInputs[0].id}` : `[name="${textInputs[0].name}"]`;
          await page.click(inputSel, { clickCount: 3 });
          await page.keyboard.press('Backspace');
          await sleep(300);
          await page.type(inputSel, keyword, { delay: 50 });
          await sleep(500);

          // Find and click search button or press Enter
          const submitBtn = pageInfo.buttons.find(b =>
            b.visible && (b.value?.includes('検索') || b.text?.includes('検索') || b.type === 'submit')
          );
          if (submitBtn) {
            const btnSel = submitBtn.id ? `#${submitBtn.id}` : (submitBtn.name ? `[name="${submitBtn.name}"]` : 'button[type="submit"], input[type="submit"]');
            await page.click(btnSel);
          } else {
            await page.keyboard.press('Enter');
          }

          // Wait for results
          await sleep(8000);

          // Extract results
          const results = await page.evaluate(() => {
            const items = [];

            // Try multiple table selectors
            const tableSelectors = [
              'table.result-table tbody tr',
              'table.list tbody tr',
              'table tbody tr',
              'table tr',
              '.search-result-item',
              '.result-item',
            ];

            for (const sel of tableSelectors) {
              const rows = document.querySelectorAll(sel);
              if (rows.length > 1) {
                rows.forEach((row, idx) => {
                  if (idx === 0) return; // skip header
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                    items.push(cells);
                  }
                });
                if (items.length > 0) break;
              }
            }

            // Fallback: look for links with device names
            if (items.length === 0) {
              document.querySelectorAll('a').forEach(a => {
                const text = a.textContent?.trim() || '';
                const href = a.href || '';
                if (text.length > 5 && (href.includes('kikiSearch') || href.includes('Result') || href.includes('detail'))) {
                  items.push([text, '', '', href]);
                }
              });
            }

            return items.slice(0, 50);
          });

          console.log(`  结果: ${results.length} 行`);

          for (const row of results) {
            const name = (row[0] || row[1] || '').trim();
            const mfr = (row[2] || row[1] || '').trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全/i.test(name)) continue;

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

          // Go back to search page for next keyword
          await page.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
          await sleep(3000);

        } catch (e) {
          console.log(`  错误: ${e.message.substring(0, 150)}`);
          // Reload search page
          try {
            await page.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
            await sleep(3000);
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.log(`  PMDA搜索页面加载失败: ${e.message.substring(0, 200)}`);
  }

  // Strategy 2: PMDA Approved Devices List
  try {
    console.log('\n  [策略2] PMDA 承認品目一覧...');
    await page.goto('https://www.pmda.go.jp/review-services/drug-reviews/review-information/devices/0018.html', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);

    // Find links to approved device lists by fiscal year
    const yearLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach(a => {
        const text = a.textContent?.trim() || '';
        const href = a.href || '';
        if ((text.includes('2024') || text.includes('2025') || text.includes('2023')) && href.includes('devices')) {
          links.push({ text, href });
        }
      });
      return links;
    });

    console.log(`  找到 ${yearLinks.length} 个年度链接`);

    for (const link of yearLinks.slice(0, 3)) {
      try {
        console.log(`  访问: ${link.text}`);
        await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(5000);

        // Look for PDF or table links with device data
        const deviceLinks = await page.evaluate(() => {
          const items = [];
          document.querySelectorAll('a').forEach(a => {
            const href = a.href || '';
            const text = a.textContent?.trim() || '';
            if (href.endsWith('.pdf') || href.includes('files')) {
              items.push({ text, href });
            }
          });
          // Also extract table data
          document.querySelectorAll('table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 3) {
              items.push({ text: cells.join(' | '), href: '' });
            }
          });
          return items.slice(0, 30);
        });

        console.log(`  找到 ${deviceLinks.length} 条数据`);

        for (const item of deviceLinks) {
          const text = item.text;
          if (!text || text.length < 5) continue;
          if (!/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|mask|glove|protect|respirat/i.test(text)) continue;

          const parts = text.split('|').map(s => s.trim());
          const name = parts[0] || '';
          const mfr = parts[1] || '';

          if (name.length < 3) continue;

          const category = categorizePPE(name);
          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfr.substring(0, 500) || 'Unknown',
            country_of_origin: 'JP',
            risk_level: determineRiskLevel(name),
            data_source: 'PMDA Japan Approved List',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) pmdaInserted++;
        }
      } catch (e) {
        console.log(`  年度页面错误: ${e.message.substring(0, 100)}`);
      }
    }
  } catch (e) {
    console.log(`  承認品目页面错误: ${e.message.substring(0, 150)}`);
  }

  await page.close();
  console.log(`\n  PMDA总计插入: ${pmdaInserted}`);
}

async function crawlMFDS(browser) {
  console.log('\n========================================');
  console.log('PART 2: Korea MFDS 의료기기안심책방');
  console.log('========================================');

  let mfdsInserted = 0;

  // Strategy 1: emedi.mfds.go.kr (의료기기안심책방)
  const page = await browser.newPage();
  await page.setDefaultTimeout(60000);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('\n  [策略1] 의료기기안심책방 (emedi.mfds.go.kr)...');
    await page.goto('https://emedi.mfds.go.kr', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);

    const pageInfo = await page.evaluate(() => {
      const info = { title: document.title, url: window.location.href, inputs: [], buttons: [], links: [] };
      document.querySelectorAll('input, select, textarea').forEach(i => {
        info.inputs.push({
          tag: i.tagName, type: i.type, name: i.name, id: i.id,
          value: i.value, placeholder: i.placeholder,
          visible: i.offsetParent !== null,
        });
      });
      document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(b => {
        info.buttons.push({
          tag: b.tagName, type: b.type, name: b.name, id: b.id,
          value: b.value, text: b.textContent?.trim()?.substring(0, 50),
          visible: b.offsetParent !== null,
        });
      });
      document.querySelectorAll('a').forEach(a => {
        const text = a.textContent?.trim() || '';
        const href = a.href || '';
        if (text.length > 2 && text.length < 100) {
          info.links.push({ text: text.substring(0, 80), href });
        }
      });
      return info;
    });

    console.log(`  页面: ${pageInfo.title}`);
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  输入: ${pageInfo.inputs.filter(i => i.visible).length} 可见`);
    console.log(`  按钮: ${pageInfo.buttons.filter(b => b.visible).length} 可见`);

    // Look for search or product search links
    const searchLinks = pageInfo.links.filter(l =>
      /품목|검색|제품|의료기기|search|product|device/i.test(l.text)
    );
    console.log(`  相关链接: ${searchLinks.slice(0, 10).map(l => l.text).join(', ')}`);

    // Try to navigate to the product search page
    const productSearchLink = searchLinks.find(l =>
      /품목.*검색|제품검색|의료기기.*검색/i.test(l.text)
    );

    if (productSearchLink) {
      console.log(`  导航到: ${productSearchLink.text}`);
      await page.goto(productSearchLink.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(5000);
    }

    // Try Korean PPE keywords
    const koreanKeywords = [
      '마스크', '호흡보호구', '방진마스크', '방독마스크',
      '보호장갑', '안전고글', '보호안경', '안전모',
      '귀마개', '청력보호구', '안전화', '보호복',
      '방호복', '보호의', '면갑', '보호면',
    ];

    const searchInput = pageInfo.inputs.find(i => i.visible && (i.type === 'text' || i.type === 'search'));
    if (searchInput) {
      for (const keyword of koreanKeywords) {
        try {
          console.log(`\n  搜索: ${keyword}`);
          const inputSel = searchInput.id ? `#${searchInput.id}` : `[name="${searchInput.name}"]`;

          await page.click(inputSel, { clickCount: 3 });
          await page.keyboard.press('Backspace');
          await sleep(200);
          await page.type(inputSel, keyword, { delay: 30 });
          await sleep(300);

          // Try to find and click search button
          const searchBtn = await page.$('button[type="submit"], input[type="submit"], .search-btn, [class*="search"]');
          if (searchBtn) {
            await searchBtn.click();
          } else {
            await page.keyboard.press('Enter');
          }

          await sleep(6000);

          const results = await page.evaluate(() => {
            const items = [];
            const tableSels = ['table tbody tr', 'table tr', '.result-item', '.list-item', '[class*="result"]', '[class*="item"]'];
            for (const sel of tableSels) {
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
            return items.slice(0, 50);
          });

          console.log(`  结果: ${results.length} 行`);

          for (const row of results) {
            const name = (row[0] || row[1] || '').trim();
            const mfr = (row[2] || row[1] || '').trim();
            if (!name || name.length < 2) continue;

            const category = categorizePPE(name);
            if (category === '其他' && !/마스크|장갑|고글|안전|보호|방호|호흡/i.test(name)) continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: mfr.substring(0, 500) || 'Unknown',
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea (emedi)',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) mfdsInserted++;
          }

          // Go back
          await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(3000);
        } catch (e) {
          console.log(`  错误: ${e.message.substring(0, 100)}`);
          try {
            await page.goto('https://emedi.mfds.go.kr', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(3000);
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.log(`  emedi.mfds.go.kr 加载失败: ${e.message.substring(0, 200)}`);
  }

  // Strategy 2: MFDS English approved devices list
  try {
    console.log('\n  [策略2] MFDS English Approved Devices...');
    await page.goto('https://www.mfds.go.kr/eng/brd/m_41/list.do', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);

    // Extract table data from the English page
    const englishResults = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('table tbody tr, table tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
        if (cells.length >= 2 && cells.some(c => c.length > 0)) {
          items.push(cells);
        }
      });
      return items.slice(0, 100);
    });

    console.log(`  English页面结果: ${englishResults.length} 行`);

    for (const row of englishResults) {
      const name = (row[0] || row[1] || '').trim();
      const mfr = (row[2] || row[1] || '').trim();
      if (!name || name.length < 3) continue;

      if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit/i.test(name)) continue;

      const category = categorizePPE(name);
      const product = {
        name: name.substring(0, 500),
        category,
        manufacturer_name: mfr.substring(0, 500) || 'Unknown',
        country_of_origin: 'KR',
        risk_level: determineRiskLevel(name),
        data_source: 'MFDS Korea (English)',
        registration_authority: 'MFDS',
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'high',
      };

      if (await insertProduct(product)) mfdsInserted++;
    }

    // Try pagination
    for (let pageNum = 2; pageNum <= 5; pageNum++) {
      try {
        await page.goto(`https://www.mfds.go.kr/eng/brd/m_41/list.do?pageIndex=${pageNum}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await sleep(3000);

        const pageResults = await page.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) {
              items.push(cells);
            }
          });
          return items.slice(0, 100);
        });

        if (pageResults.length === 0) break;

        let pageInserts = 0;
        for (const row of pageResults) {
          const name = (row[0] || row[1] || '').trim();
          const mfr = (row[2] || row[1] || '').trim();
          if (!name || name.length < 3) continue;
          if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit/i.test(name)) continue;

          const category = categorizePPE(name);
          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfr.substring(0, 500) || 'Unknown',
            country_of_origin: 'KR',
            risk_level: determineRiskLevel(name),
            data_source: 'MFDS Korea (English)',
            registration_authority: 'MFDS',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) { mfdsInserted++; pageInserts++; }
        }
        console.log(`  第${pageNum}页: ${pageInserts} 条插入`);
        await sleep(2000);
      } catch (e) {
        break;
      }
    }
  } catch (e) {
    console.log(`  MFDS English页面错误: ${e.message.substring(0, 150)}`);
  }

  await page.close();
  console.log(`\n  MFDS总计插入: ${mfdsInserted}`);
}

async function crawlPureGlobal(browser) {
  console.log('\n========================================');
  console.log('PART 3: Pure Global AI 免费数据库');
  console.log('(无需API Key，完全免费!)');
  console.log('========================================');

  let pgInserted = 0;

  const page = await browser.newPage();
  await page.setDefaultTimeout(60000);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Strategy 1: Pure Global AI Universal Database (agent.pureglobal.ai)
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

  const ppeSearchTerms = [
    'mask', 'respirator', 'N95', 'glove', 'goggle',
    'face shield', 'helmet', 'safety boot', 'protective suit',
    'coverall', 'hearing protection', 'safety vest',
  ];

  console.log('\n  [策略1] agent.pureglobal.ai 国家数据库...');

  for (const country of countries) {
    console.log(`\n  === ${country.slug.toUpperCase()} (${country.cc}) ===`);
    let countryCount = 0;

    for (const term of ppeSearchTerms) {
      try {
        const url = `https://agent.pureglobal.ai/${country.slug}/medical-device/database?search=${encodeURIComponent(term)}`;
        console.log(`  搜索: ${term}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await sleep(5000);

        // Wait for dynamic content to load
        await page.waitForSelector('table, .device-card, .result-item, [class*="device"], [class*="product"]', {
          timeout: 10000,
        }).catch(() => {});

        await sleep(2000);

        const results = await page.evaluate(() => {
          const items = [];

          // Try structured selectors
          const selectors = [
            { sel: 'table tbody tr', type: 'table' },
            { sel: '.device-card', type: 'card' },
            { sel: '.device-item', type: 'card' },
            { sel: '.result-item', type: 'card' },
            { sel: '[class*="device"]', type: 'card' },
            { sel: '[class*="product"]', type: 'card' },
            { sel: '.list-item', type: 'card' },
          ];

          for (const { sel, type } of selectors) {
            const elements = document.querySelectorAll(sel);
            if (elements.length > 0) {
              elements.forEach(el => {
                if (type === 'table') {
                  const cells = Array.from(el.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                    items.push({
                      name: cells[0] || cells[1] || '',
                      manufacturer: cells[2] || cells[1] || '',
                      code: cells[3] || '',
                    });
                  }
                } else {
                  const nameEl = el.querySelector('h2, h3, h4, .name, .title, [class*="name"], [class*="title"], a');
                  const mfrEl = el.querySelector('.manufacturer, .company, [class*="manufacturer"], [class*="company"]');
                  const codeEl = el.querySelector('.code, .product-code, [class*="code"]');
                  if (nameEl) {
                    items.push({
                      name: nameEl.textContent?.trim() || '',
                      manufacturer: mfrEl?.textContent?.trim() || '',
                      code: codeEl?.textContent?.trim() || '',
                    });
                  }
                }
              });
              if (items.length > 0) break;
            }
          }

          // Fallback: extract from page text
          if (items.length === 0) {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 10);
            const ppeLines = lines.filter(l =>
              /respirat|mask|glove|goggle|helmet|boot|gown|coverall|suit|protection|protective|safety|shield|earplug|earmuff/i.test(l)
            );
            ppeLines.slice(0, 30).forEach(line => {
              items.push({ name: line.trim().substring(0, 300), manufacturer: '', code: '' });
            });
          }

          return items.slice(0, 50);
        });

        let termCount = 0;
        for (const item of results) {
          const name = (item.name || '').trim();
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (item.manufacturer || 'Unknown').substring(0, 500),
            country_of_origin: country.cc,
            product_code: (item.code || '').substring(0, 50),
            risk_level: determineRiskLevel(name),
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
        await sleep(2000);
      } catch (e) {
        // skip silently
      }
    }
    console.log(`  ${country.slug}: ${countryCount} 条`);
  }

  // Strategy 2: Pure Global AI Global Device Directory (www.pureglobal.ai/devices)
  console.log('\n  [策略2] www.pureglobal.ai/devices 全球设备目录...');

  for (const term of ppeSearchTerms) {
    try {
      const url = `https://www.pureglobal.ai/devices?search=${encodeURIComponent(term)}`;
      console.log(`  搜索: ${term}`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      await sleep(5000);

      await page.waitForSelector('table, .device-card, .result-item, [class*="device"], [class*="product"]', {
        timeout: 10000,
      }).catch(() => {});

      await sleep(2000);

      const results = await page.evaluate(() => {
        const items = [];

        const selectors = [
          { sel: 'table tbody tr', type: 'table' },
          { sel: '.device-card, .device-item, .result-item', type: 'card' },
          { sel: '[class*="device"], [class*="product"]', type: 'card' },
        ];

        for (const { sel, type } of selectors) {
          const elements = document.querySelectorAll(sel);
          if (elements.length > 0) {
            elements.forEach(el => {
              if (type === 'table') {
                const cells = Array.from(el.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                  items.push({
                    name: cells[0] || cells[1] || '',
                    manufacturer: cells[2] || cells[1] || '',
                    code: cells[3] || '',
                  });
                }
              } else {
                const nameEl = el.querySelector('h2, h3, h4, .name, .title, [class*="name"], [class*="title"], a');
                const mfrEl = el.querySelector('.manufacturer, .company, [class*="manufacturer"]');
                if (nameEl) {
                  items.push({
                    name: nameEl.textContent?.trim() || '',
                    manufacturer: mfrEl?.textContent?.trim() || '',
                    code: '',
                  });
                }
              }
            });
            if (items.length > 0) break;
          }
        }

        if (items.length === 0) {
          const body = document.body.innerText;
          const lines = body.split('\n').filter(l => l.trim().length > 10);
          const ppeLines = lines.filter(l =>
            /respirat|mask|glove|goggle|helmet|boot|gown|coverall|suit|protection|protective|safety|shield/i.test(l)
          );
          ppeLines.slice(0, 30).forEach(line => {
            items.push({ name: line.trim().substring(0, 300), manufacturer: '', code: '' });
          });
        }

        return items.slice(0, 50);
      });

      let termCount = 0;
      for (const item of results) {
        const name = (item.name || '').trim();
        if (!name || name.length < 3) continue;

        const category = categorizePPE(name);
        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (item.manufacturer || 'Unknown').substring(0, 500),
          product_code: (item.code || '').substring(0, 50),
          risk_level: determineRiskLevel(name),
          data_source: 'Pure Global AI (Global Directory)',
          registration_authority: 'Multi-country',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'medium',
        };

        if (await insertProduct(product)) {
          termCount++;
          pgInserted++;
        }
      }

      if (termCount > 0) console.log(`    ${term}: ${termCount} 条`);
      await sleep(2000);
    } catch (e) {
      // skip
    }
  }

  // Strategy 3: Pure Global AI Company Registry
  console.log('\n  [策略3] Pure Global AI 公司注册库...');

  const ppeCompanies = [
    '3M', 'Honeywell', 'Moldex', 'MSA Safety', 'Drager',
    'Ansell', 'Kimberly-Clark', 'Delta Plus', 'Lakeland',
    'Uvex', 'Bullard', 'Gateway Safety', 'Pyramex',
    'Howard Leight', 'Sperian', 'North Safety', 'Cabot',
    'Shigematsu', 'Koken', 'Sanko', 'Suzhou Sanical',
    'Winner Medical', 'Kangcheng', 'Weini',
  ];

  for (const company of ppeCompanies) {
    try {
      const url = `https://www.pureglobal.ai/company-registry?search=${encodeURIComponent(company)}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(4000);

      const results = await page.evaluate(() => {
        const items = [];
        const selectors = ['table tbody tr', '.company-card', '.result-item', '[class*="company"]'];
        for (const sel of selectors) {
          const elements = document.querySelectorAll(sel);
          if (elements.length > 0) {
            elements.forEach(el => {
              const nameEl = el.querySelector('h2, h3, h4, .name, .title, a, [class*="name"]');
              const countryEl = el.querySelector('.country, [class*="country"]');
              if (nameEl) {
                items.push({
                  name: nameEl.textContent?.trim() || '',
                  country: countryEl?.textContent?.trim() || '',
                });
              }
            });
            if (items.length > 0) break;
          }
        }
        return items.slice(0, 20);
      });

      for (const item of results) {
        const name = (item.name || '').trim();
        if (!name || name.length < 3) continue;

        const mfrName = name;
        if (!existingMfrNames.has(mfrName.toLowerCase().trim())) {
          const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
            name: mfrName.substring(0, 500),
            country: item.country || 'Unknown',
            data_source: 'Pure Global AI Company Registry',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'medium',
          });
          if (!mfrErr) {
            existingMfrNames.add(mfrName.toLowerCase().trim());
            totalMfrInserted++;
          }
        }
      }
      await sleep(1500);
    } catch (e) {
      // skip
    }
  }

  await page.close();
  console.log(`\n  Pure Global AI总计插入: ${pgInserted}`);
}

main().catch(console.error);
