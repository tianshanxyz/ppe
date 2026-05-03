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
  console.log('无头浏览器爬虫 v5 - 优化版');
  console.log('PMDA + MFDS + Pure Global AI (免费)');
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
    console.log('\n========================================');
    console.log('PART 1: PMDA Japan');
    console.log('========================================');

    let pmdaInserted = 0;
    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(60000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Step 1: Analyze PMDA page in detail
    console.log('\n  [步骤1] 详细分析PMDA页面结构...');
    try {
      await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
        waitUntil: 'networkidle2',
        timeout: 90000,
      });
      await sleep(5000);

      // Take screenshot for debugging
      await pmdaPage.screenshot({ path: '/tmp/pmda_search.png', fullPage: false });
      console.log('  截图保存: /tmp/pmda_search.png');

      // Get detailed page structure
      const pageStructure = await pmdaPage.evaluate(() => {
        const result = {
          title: document.title,
          url: window.location.href,
          html: document.body.innerHTML.substring(0, 5000),
          allTextInputs: [],
          allButtons: [],
          allSelects: [],
        };

        // Get ALL text inputs with full context
        document.querySelectorAll('input[type="text"], input:not([type]), input[type="search"]').forEach(input => {
          const parent = input.closest('tr, div, li, dd, section');
          const label = parent ? parent.querySelector('label, th, .label, .title') : null;
          result.allTextInputs.push({
            id: input.id,
            name: input.name,
            placeholder: input.placeholder,
            value: input.value,
            label: label ? label.textContent.trim().substring(0, 100) : '',
            size: input.size,
            maxLength: input.maxLength,
            visible: input.offsetParent !== null,
            rect: input.getBoundingClientRect(),
          });
        });

        // Get all buttons
        document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, [role="button"]').forEach(btn => {
          result.allButtons.push({
            tag: btn.tagName,
            id: btn.id,
            name: btn.name,
            type: btn.type,
            value: btn.value,
            text: btn.textContent?.trim()?.substring(0, 80),
            class: btn.className?.substring(0, 100),
            visible: btn.offsetParent !== null,
          });
        });

        // Get all selects
        document.querySelectorAll('select').forEach(sel => {
          const options = Array.from(sel.options).map(o => ({ value: o.value, text: o.textContent.trim() }));
          result.allSelects.push({
            id: sel.id,
            name: sel.name,
            visible: sel.offsetParent !== null,
            optionCount: options.length,
            firstOptions: options.slice(0, 5),
          });
        });

        return result;
      });

      console.log(`  页面标题: ${pageStructure.title}`);
      console.log(`  URL: ${pageStructure.url}`);
      console.log(`  文本输入框: ${pageStructure.allTextInputs.length}`);
      console.log(`  按钮: ${pageStructure.allButtons.length}`);
      console.log(`  下拉框: ${pageStructure.allSelects.length}`);

      // Print all text inputs with labels
      console.log('\n  --- 文本输入框详情 ---');
      pageStructure.allTextInputs.forEach((input, i) => {
        if (input.visible) {
          console.log(`  [${i}] id="${input.id}" name="${input.name}" label="${input.label}" placeholder="${input.placeholder}" size=${input.size}`);
        }
      });

      // Print all buttons
      console.log('\n  --- 按钮详情 ---');
      pageStructure.allButtons.forEach((btn, i) => {
        if (btn.visible) {
          console.log(`  [${i}] tag=${btn.tag} id="${btn.id}" name="${btn.name}" type="${btn.type}" text="${btn.text}" class="${btn.class}"`);
        }
      });

      // Print select dropdowns
      console.log('\n  --- 下拉框详情 ---');
      pageStructure.allSelects.forEach((sel, i) => {
        if (sel.visible) {
          console.log(`  [${i}] id="${sel.id}" name="${sel.name}" options=${sel.optionCount} first=[${sel.firstOptions.map(o => o.text).join(', ')}]`);
        }
      });

      // Step 2: Try to search using the correct input
      // Based on analysis, find the "販売名" (sales name) or "一般的名称" (generic name) input
      const nameInput = pageStructure.allTextInputs.find(i =>
        i.visible && (i.name?.includes('hanbai') || i.name?.includes('ippan') || i.name?.includes('search') || i.id?.includes('search') || i.id?.includes('keyword') || i.id?.includes('name'))
      );
      const firstVisibleInput = pageStructure.allTextInputs.find(i => i.visible && i.size > 5);

      const targetInput = nameInput || firstVisibleInput;

      if (targetInput) {
        console.log(`\n  [步骤2] 使用搜索框: id="${targetInput.id}" name="${targetInput.name}" label="${targetInput.label}"`);

        const pmdaKeywords = [
          'マスク', '防塵マスク', '防毒マスク', '呼吸用保護具',
          '保護手袋', 'ゴーグル', '保護めがね', 'ヘルメット',
          '安全靴', '保護衣', '防護服', '耳栓',
        ];

        for (const keyword of pmdaKeywords) {
          try {
            console.log(`\n  搜索: ${keyword}`);

            // Navigate to search page fresh each time
            await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
              waitUntil: 'networkidle2',
              timeout: 60000,
            });
            await sleep(3000);

            // Type into the search input
            const inputSel = targetInput.id ? `#${targetInput.id}` : `[name="${targetInput.name}"]`;
            await pmdaPage.waitForSelector(inputSel, { timeout: 10000 });
            await pmdaPage.click(inputSel, { clickCount: 3 });
            await pmdaPage.keyboard.press('Backspace');
            await sleep(200);
            await pmdaPage.type(inputSel, keyword, { delay: 30 });
            await sleep(500);

            // Click the search/submit button
            const submitBtn = pageStructure.allButtons.find(b =>
              b.visible && (b.value?.includes('検索') || b.text?.includes('検索') || b.type === 'submit')
            );

            if (submitBtn) {
              const btnSel = submitBtn.id ? `#${submitBtn.id}` : (submitBtn.name ? `[name="${submitBtn.name}"]` : 'input[type="submit"]');
              console.log(`  点击按钮: ${submitBtn.text || submitBtn.value || btnSel}`);
              await pmdaPage.click(btnSel);
            } else {
              console.log('  按Enter键搜索');
              await pmdaPage.keyboard.press('Enter');
            }

            // Wait for results
            await sleep(10000);

            // Take screenshot of results
            await pmdaPage.screenshot({ path: `/tmp/pmda_result_${keyword}.png`, fullPage: false });

            // Extract results
            const results = await pmdaPage.evaluate(() => {
              const items = [];

              // Try various result selectors
              const resultSelectors = [
                'table.tbl_search_result tbody tr',
                'table.result tbody tr',
                'table.search tbody tr',
                'table.list tbody tr',
                'table tbody tr',
                'table tr',
                '.search-result tr',
                '#resultArea tr',
              ];

              for (const sel of resultSelectors) {
                const rows = document.querySelectorAll(sel);
                if (rows.length > 1) {
                  rows.forEach((row, idx) => {
                    if (idx === 0) return;
                    const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim());
                    if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                      items.push(cells);
                    }
                  });
                  if (items.length > 0) break;
                }
              }

              // Fallback: try to find any links or text that look like device names
              if (items.length === 0) {
                const bodyText = document.body.innerText;
                const lines = bodyText.split('\n').filter(l => l.trim().length > 5);
                const deviceLines = lines.filter(l =>
                  /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|防塵|防毒/i.test(l)
                );
                deviceLines.slice(0, 30).forEach(line => {
                  items.push([line.trim().substring(0, 300)]);
                });
              }

              return {
                items: items.slice(0, 50),
                pageText: document.body.innerText.substring(0, 3000),
                url: window.location.href,
              };
            });

            console.log(`  URL: ${results.url}`);
            console.log(`  结果行数: ${results.items.length}`);

            // Print first few results for debugging
            if (results.items.length > 0) {
              results.items.slice(0, 3).forEach((row, i) => {
                console.log(`    行${i}: ${row.slice(0, 4).join(' | ').substring(0, 200)}`);
              });
            } else {
              console.log(`  页面文本前500字: ${results.pageText.substring(0, 500)}`);
            }

            // Insert results
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

            await sleep(2000);
          } catch (e) {
            console.log(`  搜索错误: ${e.message.substring(0, 150)}`);
          }
        }
      } else {
        console.log('  未找到合适的搜索输入框');
      }
    } catch (e) {
      console.log(`  PMDA页面加载失败: ${e.message.substring(0, 200)}`);
    }

    await pmdaPage.close();
    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

    // ===== PART 2: Korea MFDS =====
    console.log('\n========================================');
    console.log('PART 2: Korea MFDS');
    console.log('========================================');

    let mfdsInserted = 0;
    const mfdsPage = await browser.newPage();
    await mfdsPage.setDefaultTimeout(60000);
    await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Strategy 1: MFDS English approved devices
    console.log('\n  [策略1] MFDS English Approved Devices...');
    try {
      await mfdsPage.goto('https://www.mfds.go.kr/eng/brd/m_41/list.do', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await sleep(5000);

      await mfdsPage.screenshot({ path: '/tmp/mfds_english.png', fullPage: false });

      // Extract table data
      for (let pageNum = 1; pageNum <= 10; pageNum++) {
        try {
          const url = pageNum === 1
            ? 'https://www.mfds.go.kr/eng/brd/m_41/list.do'
            : `https://www.mfds.go.kr/eng/brd/m_41/list.do?pageIndex=${pageNum}`;

          await mfdsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(3000);

          const results = await mfdsPage.evaluate(() => {
            const items = [];
            document.querySelectorAll('table tbody tr, table tr').forEach(row => {
              const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
              if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                items.push(cells);
              }
            });
            return items;
          });

          if (results.length === 0) break;

          let pageInserts = 0;
          for (const row of results) {
            const name = (row[0] || row[1] || '').trim();
            const mfr = (row[2] || row[1] || '').trim();
            if (!name || name.length < 3) continue;

            if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit|shield|earplug/i.test(name.toLowerCase())) continue;

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
          console.log(`  第${pageNum}页: ${results.length} 行, ${pageInserts} 条插入`);
          await sleep(2000);
        } catch (e) {
          break;
        }
      }
    } catch (e) {
      console.log(`  MFDS English页面错误: ${e.message.substring(0, 150)}`);
    }

    // Strategy 2: emedi.mfds.go.kr
    console.log('\n  [策略2] 의료기기안심책방 (emedi.mfds.go.kr)...');
    try {
      await mfdsPage.goto('https://emedi.mfds.go.kr', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await sleep(5000);

      await mfdsPage.screenshot({ path: '/tmp/mfds_emedi.png', fullPage: false });

      const emediInfo = await mfdsPage.evaluate(() => {
        const info = { title: document.title, url: window.location.href, inputs: [], buttons: [], links: [] };
        document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])').forEach(i => {
          if (i.offsetParent !== null) {
            info.inputs.push({ id: i.id, name: i.name, placeholder: i.placeholder, type: i.type });
          }
        });
        document.querySelectorAll('button, input[type="submit"]').forEach(b => {
          if (b.offsetParent !== null) {
            info.buttons.push({ id: b.id, name: b.name, text: b.textContent?.trim()?.substring(0, 50), type: b.type });
          }
        });
        document.querySelectorAll('a').forEach(a => {
          const text = a.textContent?.trim() || '';
          if (text.length > 2 && text.length < 80 && /품목|검색|제품|의료기기|search|product/i.test(text)) {
            info.links.push({ text, href: a.href });
          }
        });
        return info;
      });

      console.log(`  页面: ${emediInfo.title}`);
      console.log(`  URL: ${emediInfo.url}`);
      console.log(`  输入框: ${emediInfo.inputs.length}`);
      console.log(`  按钮: ${emediInfo.buttons.length}`);
      console.log(`  相关链接: ${emediInfo.links.slice(0, 10).map(l => l.text).join(', ')}`);

      // Try to find and use the search functionality
      if (emediInfo.inputs.length > 0) {
        const koreanKeywords = ['마스크', '호흡보호구', '보호장갑', '안전고글', '안전모', '보호복', '방호복'];

        for (const keyword of koreanKeywords) {
          try {
            const input = emediInfo.inputs[0];
            const inputSel = input.id ? `#${input.id}` : `[name="${input.name}"]`;

            await mfdsPage.click(inputSel, { clickCount: 3 });
            await mfdsPage.keyboard.press('Backspace');
            await sleep(200);
            await mfdsPage.type(inputSel, keyword, { delay: 30 });
            await sleep(300);

            const searchBtn = emediInfo.buttons[0];
            if (searchBtn) {
              const btnSel = searchBtn.id ? `#${searchBtn.id}` : (searchBtn.name ? `[name="${searchBtn.name}"]` : 'button');
              await mfdsPage.click(btnSel);
            } else {
              await mfdsPage.keyboard.press('Enter');
            }

            await sleep(6000);

            const results = await mfdsPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                  items.push(cells);
                }
              });
              return items.slice(0, 50);
            });

            console.log(`  "${keyword}": ${results.length} 行`);

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

            // Go back for next search
            await mfdsPage.goto('https://emedi.mfds.go.kr', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(3000);
          } catch (e) {
            console.log(`  错误: ${e.message.substring(0, 100)}`);
            try {
              await mfdsPage.goto('https://emedi.mfds.go.kr', { waitUntil: 'domcontentloaded', timeout: 30000 });
              await sleep(3000);
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.log(`  emedi页面错误: ${e.message.substring(0, 150)}`);
    }

    await mfdsPage.close();
    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

    // ===== PART 3: Pure Global AI (Free!) =====
    console.log('\n========================================');
    console.log('PART 3: Pure Global AI (免费!)');
    console.log('========================================');

    let pgInserted = 0;
    const pgPage = await browser.newPage();
    await pgPage.setDefaultTimeout(60000);
    await pgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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

    // Strategy 1: agent.pureglobal.ai country databases
    console.log('\n  [策略1] agent.pureglobal.ai 国家数据库...');

    for (const country of countries) {
      console.log(`\n  === ${country.slug.toUpperCase()} ===`);
      let countryCount = 0;

      for (const term of ppeSearchTerms) {
        try {
          const url = `https://agent.pureglobal.ai/${country.slug}/medical-device/database?search=${encodeURIComponent(term)}`;
          await pgPage.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
          await sleep(5000);

          // Wait for content to render
          await pgPage.waitForSelector('table, [class*="device"], [class*="product"], [class*="result"]', {
            timeout: 8000,
          }).catch(() => {});
          await sleep(2000);

          const results = await pgPage.evaluate(() => {
            const items = [];

            // Try structured selectors
            const strategies = [
              () => {
                const rows = document.querySelectorAll('table tbody tr');
                rows.forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                    items.push({ name: cells[0] || cells[1] || '', manufacturer: cells[2] || cells[1] || '', code: cells[3] || '' });
                  }
                });
                return items.length > 0;
              },
              () => {
                const cards = document.querySelectorAll('[class*="device"], [class*="product"], [class*="result"]');
                cards.forEach(card => {
                  const nameEl = card.querySelector('h2, h3, h4, .name, .title, [class*="name"], a');
                  const mfrEl = card.querySelector('[class*="manufacturer"], [class*="company"]');
                  if (nameEl) {
                    items.push({ name: nameEl.textContent?.trim() || '', manufacturer: mfrEl?.textContent?.trim() || '', code: '' });
                  }
                });
                return items.length > 0;
              },
              () => {
                const body = document.body.innerText;
                const lines = body.split('\n').filter(l => l.trim().length > 10);
                const ppeLines = lines.filter(l =>
                  /respirat|mask|glove|goggle|helmet|boot|gown|coverall|suit|protection|protective|safety|shield|earplug|earmuff/i.test(l)
                );
                ppeLines.slice(0, 30).forEach(line => {
                  items.push({ name: line.trim().substring(0, 300), manufacturer: '', code: '' });
                });
                return items.length > 0;
              },
            ];

            for (const strategy of strategies) {
              if (strategy()) break;
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
          // skip
        }
      }
      console.log(`  ${country.slug}: ${countryCount} 条`);
    }

    // Strategy 2: www.pureglobal.ai/devices
    console.log('\n  [策略2] www.pureglobal.ai/devices 全球设备目录...');

    for (const term of ppeSearchTerms) {
      try {
        const url = `https://www.pureglobal.ai/devices?search=${encodeURIComponent(term)}`;
        await pgPage.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await sleep(5000);

        await pgPage.waitForSelector('table, [class*="device"], [class*="product"]', {
          timeout: 8000,
        }).catch(() => {});
        await sleep(2000);

        const results = await pgPage.evaluate(() => {
          const items = [];
          const strategies = [
            () => {
              document.querySelectorAll('table tbody tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2) items.push({ name: cells[0] || '', manufacturer: cells[2] || cells[1] || '', code: cells[3] || '' });
              });
              return items.length > 0;
            },
            () => {
              document.querySelectorAll('[class*="device"], [class*="product"]').forEach(el => {
                const nameEl = el.querySelector('h2, h3, h4, .name, .title, a');
                const mfrEl = el.querySelector('[class*="manufacturer"]');
                if (nameEl) items.push({ name: nameEl.textContent?.trim() || '', manufacturer: mfrEl?.textContent?.trim() || '', code: '' });
              });
              return items.length > 0;
            },
            () => {
              const body = document.body.innerText;
              const lines = body.split('\n').filter(l => l.trim().length > 10);
              const ppeLines = lines.filter(l => /respirat|mask|glove|goggle|helmet|boot|gown|coverall|suit|protection|safety|shield/i.test(l));
              ppeLines.slice(0, 30).forEach(line => {
                items.push({ name: line.trim().substring(0, 300), manufacturer: '', code: '' });
              });
              return items.length > 0;
            },
          ];
          for (const s of strategies) { if (s()) break; }
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

          if (await insertProduct(product)) { termCount++; pgInserted++; }
        }

        if (termCount > 0) console.log(`    ${term}: ${termCount} 条`);
        await sleep(2000);
      } catch (e) {
        // skip
      }
    }

    await pgPage.close();
    console.log(`\n  Pure Global AI总计插入: ${pgInserted}`);

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
