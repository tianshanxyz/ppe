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
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|マスク|呼吸|防塵|防毒|마스크|호흡|보호구/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手袋|グローブ|장갑/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|safety.*glass|visor|保護めがね|ゴーグル|보호안경|고글/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|ヘルメット|安全帽|안전모|헬멧/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳栓|イヤーマフ|聴覚|귀마개|이어마프/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|safety.*foot|安全靴|シューズ|안전화|부츠/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|protective.*cloth|isolation|hazmat|保護衣|防護服|보호복|보호의/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical|マスク|呼吸|호흡/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear|harness|ヘルメット|手袋|安全靴|안전모|장갑|안전화/i.test(n)) return 'medium';
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
  console.log('Puppeteer 爬虫 v2 (优化超时)');
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
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    // ===== PMDA Japan =====
    console.log('\n========================================');
    console.log('PMDA Japan 医療機器検索');
    console.log('========================================');

    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(60000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const pmdaKeywords = ['マスク', '呼吸用保護具', '手袋', '保護めがね', 'ヘルメット', '耳栓', '安全靴', '保護衣', '防護服'];

    let pmdaInserted = 0;

    for (const keyword of pmdaKeywords) {
      try {
        console.log(`  搜索: ${keyword}...`);
        await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(5000);

        // Take screenshot to debug
        if (keyword === pmdaKeywords[0]) {
          await pmdaPage.screenshot({ path: '/tmp/pmda_search_page.png', fullPage: false });
          console.log('    截图已保存: /tmp/pmda_search_page.png');
        }

        // Try to find and fill search input
        const inputFound = await pmdaPage.evaluate((kw) => {
          const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
          for (const input of inputs) {
            if (input.offsetParent !== null) {
              input.value = kw;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          return false;
        }, keyword);

        if (!inputFound) {
          console.log(`    未找到搜索框`);
          continue;
        }

        await sleep(1000);

        // Click search button
        await pmdaPage.evaluate(() => {
          const btns = document.querySelectorAll('input[type="submit"], button[type="submit"], a.btn, input[value*="検索"]');
          for (const btn of btns) {
            if (btn.offsetParent !== null) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        await sleep(8000);

        // Parse results
        const results = await pmdaPage.evaluate(() => {
          const items = [];
          const allTables = document.querySelectorAll('table');
          for (const table of allTables) {
            const rows = table.querySelectorAll('tr');
            for (const row of rows) {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 2) {
                const texts = Array.from(cells).map(c => c.textContent.trim()).filter(t => t.length > 0);
                if (texts.length >= 2) {
                  items.push(texts);
                }
              }
            }
          }

          if (items.length === 0) {
            const links = document.querySelectorAll('a');
            for (const link of links) {
              const text = link.textContent.trim();
              if (text.length > 5 && text.length < 200) {
                const href = link.href || '';
                if (href.includes('kikiSearch') || href.includes('Result') || href.includes('detail')) {
                  items.push([text, href]);
                }
              }
            }
          }

          return items.slice(0, 50);
        });

        console.log(`    找到 ${results.length} 条结果`);

        for (const item of results) {
          const name = item[0] || '';
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          const riskLevel = determineRiskLevel(name);

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (item[1] || 'Unknown').substring(0, 500),
            country_of_origin: 'JP',
            risk_level: riskLevel,
            data_source: 'PMDA Japan',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) pmdaInserted++;
        }

        await sleep(3000);
      } catch (e) {
        console.log(`    错误: ${e.message.substring(0, 100)}`);
      }
    }

    await pmdaPage.close();
    console.log(`  PMDA总计: ${pmdaInserted}`);

    // ===== Pure Global AI =====
    console.log('\n========================================');
    console.log('Pure Global AI 免费数据爬取');
    console.log('========================================');

    const pgPage = await browser.newPage();
    await pgPage.setDefaultTimeout(60000);
    await pgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const PPE_CODES = ['MSH', 'MSR', 'OEA', 'OEB', 'KNC', 'KNG', 'LMA', 'LZA', 'LYY', 'FXX', 'BZD', 'KKX', 'DSA', 'HCC', 'FMI', 'FTL', 'NHA'];
    const countries = [
      { code: 'japan', cc: 'JP', auth: 'PMDA' },
      { code: 'korea', cc: 'KR', auth: 'MFDS' },
      { code: 'brazil', cc: 'BR', auth: 'ANVISA' },
    ];

    let pgInserted = 0;

    for (const country of countries) {
      console.log(`\n  爬取 ${country.code}...`);

      for (const code of PPE_CODES) {
        try {
          const url = `https://www.pureglobal.ai/${country.code}/medical-device/database?productCode=${code}`;
          await pgPage.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
          await sleep(5000);

          // Take screenshot for first page
          if (code === PPE_CODES[0] && country.code === countries[0].code) {
            await pgPage.screenshot({ path: '/tmp/pureglobal_page.png', fullPage: false });
            console.log('    截图已保存: /tmp/pureglobal_page.png');
          }

          // Wait for SPA to render
          await sleep(3000);

          // Try to extract device data from the rendered page
          const results = await pgPage.evaluate(() => {
            const items = [];

            // Try multiple selectors
            const selectors = [
              '.device-card', '.device-item', '.result-item',
              '[class*="device"]', '[class*="product"]',
              'table tbody tr', '.list-item',
            ];

            for (const sel of selectors) {
              const elements = document.querySelectorAll(sel);
              if (elements.length > 0) {
                elements.forEach(el => {
                  const nameEl = el.querySelector('h2, h3, h4, .name, .title, [class*="name"], [class*="title"]');
                  const mfrEl = el.querySelector('.manufacturer, .company, [class*="manufacturer"], [class*="company"]');
                  if (nameEl) {
                    items.push({
                      name: nameEl.textContent?.trim() || '',
                      manufacturer: mfrEl?.textContent?.trim() || '',
                    });
                  }
                });
                if (items.length > 0) break;
              }
            }

            // Fallback: extract from page text
            if (items.length === 0) {
              const body = document.body.innerText;
              const lines = body.split('\n').filter(l => l.trim().length > 5);
              const ppeLines = lines.filter(l =>
                /respirat|mask|glove|goggle|helmet|boot|gown|coverall|suit|protection|protective|safety/i.test(l)
              );
              ppeLines.slice(0, 30).forEach(line => {
                items.push({ name: line.trim().substring(0, 200), manufacturer: '' });
              });
            }

            return items;
          });

          let codeCount = 0;
          for (const item of results) {
            const name = item.name || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            const riskLevel = determineRiskLevel(name);

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (item.manufacturer || 'Unknown').substring(0, 500),
              country_of_origin: country.cc,
              product_code: code,
              risk_level: riskLevel,
              data_source: `Pure Global AI - ${country.code}`,
              registration_authority: country.auth,
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'medium',
            };

            if (await insertProduct(product)) {
              codeCount++;
              pgInserted++;
            }
          }

          if (codeCount > 0) console.log(`    ${code}: ${codeCount} 条`);
          await sleep(2000);
        } catch (e) {
          // skip
        }
      }
      console.log(`  ${country.code}: ${pgInserted} 条`);
    }

    await pgPage.close();
    console.log(`  Pure Global总计: ${pgInserted}`);

  } finally {
    await browser.close();
  }

  // Final Summary
  console.log('\n========================================');
  console.log('爬取完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'country_of_origin,data_source');
  const countryStats = {};
  const srcStats = {};
  finalProducts.forEach(p => {
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
    srcStats[p.data_source || 'Unknown'] = (srcStats[p.data_source || 'Unknown'] || 0) + 1;
  });

  console.log('\n国家分布(前10):');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n数据来源分布:');
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });
}

main().catch(console.error);
