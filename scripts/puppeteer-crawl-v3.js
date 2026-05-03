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
  console.log('Puppeteer 爬虫 v3 (PMDA分析 + Pure Global扩展)');
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    // ===== Step 1: Analyze PMDA page structure =====
    console.log('\n========================================');
    console.log('Step 1: 分析PMDA页面结构');
    console.log('========================================');

    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(90000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    try {
      console.log('  加载PMDA搜索页面...');
      await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', { waitUntil: 'domcontentloaded', timeout: 90000 });
      await sleep(8000);

      const pageInfo = await pmdaPage.evaluate(() => {
        const info = {
          title: document.title,
          url: window.location.href,
          forms: [],
          inputs: [],
          buttons: [],
          tables: [],
        };

        document.querySelectorAll('form').forEach(f => {
          info.forms.push({ id: f.id, action: f.action, method: f.method });
        });

        document.querySelectorAll('input').forEach(i => {
          info.inputs.push({ type: i.type, name: i.name, id: i.id, value: i.value, placeholder: i.placeholder, visible: i.offsetParent !== null });
        });

        document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(b => {
          info.buttons.push({ type: b.type, name: b.name, id: b.id, value: b.value, text: b.textContent?.trim(), visible: b.offsetParent !== null });
        });

        document.querySelectorAll('table').forEach(t => {
          info.tables.push({ id: t.id, class: t.className, rows: t.querySelectorAll('tr').length });
        });

        return info;
      });

      console.log('  页面标题:', pageInfo.title);
      console.log('  URL:', pageInfo.url);
      console.log('  表单:', JSON.stringify(pageInfo.forms));
      console.log('  输入框:');
      pageInfo.inputs.forEach(i => {
        if (i.visible || i.type === 'hidden') console.log(`    type=${i.type}, name=${i.name}, id=${i.id}, placeholder=${i.placeholder}, visible=${i.visible}`);
      });
      console.log('  按钮:');
      pageInfo.buttons.forEach(b => {
        console.log(`    type=${b.type}, name=${b.name}, id=${b.id}, value=${b.value}, text=${b.text}, visible=${b.visible}`);
      });
      console.log('  表格:', JSON.stringify(pageInfo.tables));

      // Try to search using the identified input
      const searchInput = pageInfo.inputs.find(i => i.visible && (i.type === 'text' || !i.type));
      if (searchInput) {
        console.log(`\n  使用搜索框: name=${searchInput.name}, id=${searchInput.id}`);

        await pmdaPage.type(`#${searchInput.id || `[name="${searchInput.name}"]`}`, 'マスク');
        await sleep(1000);

        const searchBtn = pageInfo.buttons.find(b => b.visible && (b.value?.includes('検索') || b.text?.includes('検索') || b.type === 'submit'));
        if (searchBtn) {
          console.log(`  点击搜索按钮: ${searchBtn.id || searchBtn.name || searchBtn.value}`);
          await pmdaPage.click(`#${searchBtn.id || `[name="${searchBtn.name}"]`}`);
        } else {
          await pmdaPage.keyboard.press('Enter');
        }

        await sleep(10000);

        const searchResults = await pmdaPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) {
              items.push(cells);
            }
          });
          return items.slice(0, 20);
        });

        console.log(`  搜索结果: ${searchResults.length} 行`);
        searchResults.forEach((row, i) => {
          console.log(`    行${i}: ${row.slice(0, 4).join(' | ')}`);
        });

        // Insert PMDA results
        let pmdaInserted = 0;
        for (const row of searchResults) {
          const name = row[0] || row[1] || '';
          const mfr = row[2] || '';
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          const riskLevel = determineRiskLevel(name);

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfr.substring(0, 500) || 'Unknown',
            country_of_origin: 'JP',
            risk_level: riskLevel,
            data_source: 'PMDA Japan',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) pmdaInserted++;
        }
        console.log(`  PMDA插入: ${pmdaInserted}`);
      }
    } catch (e) {
      console.log(`  PMDA错误: ${e.message.substring(0, 200)}`);
    }
    await pmdaPage.close();

    // ===== Step 2: Pure Global AI extended search =====
    console.log('\n========================================');
    console.log('Step 2: Pure Global AI 扩展搜索');
    console.log('========================================');

    const pgPage = await browser.newPage();
    await pgPage.setDefaultTimeout(60000);
    await pgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const ALL_PPE_CODES = [
      'MSH', 'MSR', 'MST', 'MSW',
      'OEA', 'OEB', 'OEC', 'OED', 'OEE', 'OEF', 'OEG', 'OEH', 'OEI', 'OEJ', 'OEK', 'OEL', 'OEM', 'OEN', 'OEO', 'OEP', 'OEQ', 'OER', 'OES', 'OET',
      'KNC', 'KND', 'KNE', 'KNG', 'KNH', 'KNI', 'KNJ', 'KNK', 'KNL', 'KNM', 'KNN', 'KNO',
      'LMA', 'LMB', 'LMC', 'LMD', 'LME', 'LMF', 'LMG', 'LMH', 'LMI', 'LMJ', 'LMK', 'LML',
      'LZA', 'LZB', 'LZC', 'LZD', 'LZE', 'LZF', 'LZG', 'LZH', 'LZI', 'LZJ', 'LZK', 'LZL',
      'LYY', 'LYZ',
      'FXX', 'FXY', 'FXZ',
      'JOM', 'JON', 'JOO', 'JOP',
      'BZD', 'BZE',
      'KKX', 'KKY', 'KKZ',
      'CFC', 'CFD', 'CFE', 'CFF', 'CFG',
      'DSA', 'DSB', 'DSC', 'DSD', 'DSE',
      'HCB', 'HCC', 'HCD', 'HCE',
      'FMP', 'FMQ', 'FMR',
      'FMI', 'FMJ', 'FMK',
      'QBJ', 'QBK', 'QBL',
      'FTL', 'FTM', 'FTN',
      'NHA', 'NHB', 'NHC',
      'KOT', 'KOU', 'KOV',
    ];

    const countries = [
      { code: 'japan', cc: 'JP', auth: 'PMDA' },
      { code: 'korea', cc: 'KR', auth: 'MFDS' },
      { code: 'brazil', cc: 'BR', auth: 'ANVISA' },
      { code: 'australia', cc: 'AU', auth: 'TGA' },
      { code: 'united-kingdom', cc: 'GB', auth: 'MHRA' },
      { code: 'china', cc: 'CN', auth: 'NMPA' },
      { code: 'india', cc: 'IN', auth: 'CDSCO' },
    ];

    let pgInserted = 0;

    for (const country of countries) {
      console.log(`\n  爬取 ${country.code}...`);
      let countryCount = 0;

      for (const code of ALL_PPE_CODES) {
        try {
          const url = `https://www.pureglobal.ai/${country.code}/medical-device/database?productCode=${code}`;
          await pgPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(4000);

          const results = await pgPage.evaluate(() => {
            const items = [];

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
              countryCount++;
            }
          }

          if (codeCount > 0) console.log(`    ${code}: ${codeCount} 条`);
          await sleep(1500);
        } catch (e) {
          // skip
        }
      }
      console.log(`  ${country.code}: ${countryCount} 条`);
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
