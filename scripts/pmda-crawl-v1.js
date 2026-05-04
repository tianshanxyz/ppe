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
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
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
  console.log('PMDA Japan 专用采集 v1');
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
    const pmdaKeywords = [
      'マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル',
      'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓', '保護めがね',
      '防毒マスク', '呼吸器', '防護帽', '安全手袋',
    ];

    const pmdaCategories = [
      { value: 'A0600', label: '呼吸補助器' },
      { value: 'A0800', label: 'その他' },
    ];

    let pmdaInserted = 0;

    for (const keyword of pmdaKeywords) {
      let page;
      try {
        page = await browser.newPage();
        await page.setDefaultTimeout(60000);
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`\n  搜索: ${keyword}`);

        await page.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await sleep(3000);

        await page.evaluate(() => {
          const form = document.getElementById('kikiSearchForm');
          if (form) form.setAttribute('target', '_self');
        });

        await page.focus('#txtName');
        await page.keyboard.type(keyword, { delay: 30 });
        await sleep(300);

        await page.evaluate(() => {
          const partialMatch = document.getElementById('howtoMatchRadioValue1');
          if (partialMatch) partialMatch.checked = true;
        });

        await page.evaluate(() => {
          const listRows = document.getElementById('ListRows');
          if (listRows) {
            listRows.value = '100';
          }
        });

        await page.evaluate(() => {
          const newStyle = document.getElementById('radioNew');
          if (newStyle) newStyle.checked = true;
        });

        console.log(`  提交搜索表单...`);

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
          page.evaluate(() => {
            const form = document.getElementById('kikiSearchForm');
            if (form) form.submit();
          }),
        ]);

        await sleep(5000);

        const currentUrl = page.url();
        console.log(`  结果页URL: ${currentUrl.substring(0, 80)}`);

        let allResults = [];

        const tableResults = await page.evaluate(() => {
          const items = [];
          const tables = document.querySelectorAll('table');
          tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
              const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
              if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                items.push(cells);
              }
            });
          });
          return items;
        });
        allResults.push(...tableResults);

        if (allResults.length === 0) {
          const listItems = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('li, dd, .result-item, .search-result').forEach(el => {
              const text = el.textContent.trim();
              if (text.length > 5) items.push(text);
            });
            return items;
          });
          listItems.forEach(text => allResults.push([text]));
        }

        if (allResults.length === 0) {
          const bodyResults = await page.evaluate((kw) => {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            const ppeLines = lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳|防塵|防毒/i.test(l)
            );
            return ppeLines.slice(0, 200).map(l => [l.trim().substring(0, 500)]);
          }, keyword);
          allResults.push(...bodyResults);
        }

        const totalHits = await page.evaluate(() => {
          const body = document.body.innerText;
          const match = body.match(/(\d+)\s*件/);
          return match ? parseInt(match[1]) : 0;
        });

        console.log(`  搜索结果: ${totalHits}件, 表格行: ${allResults.length}`);

        if (totalHits > 100) {
          const maxPages = Math.min(Math.ceil(totalHits / 100), 20);
          for (let p = 2; p <= maxPages; p++) {
            try {
              const nextBtn = await page.$('a.next, a[title="次へ"], input[value="次へ"]');
              if (!nextBtn) break;

              await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
                nextBtn.click(),
              ]);
              await sleep(3000);

              const moreResults = await page.evaluate(() => {
                const items = [];
                document.querySelectorAll('table tr').forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
                });
                return items;
              });
              allResults.push(...moreResults);

              if (p % 5 === 0) console.log(`    第${p}页: 累计${allResults.length}行`);
            } catch (e) {
              break;
            }
          }
        }

        let keywordInserted = 0;
        for (const row of allResults) {
          const name = (row[0] || '').trim();
          const mfr = (row.length > 2 ? row[2] : row.length > 1 ? row[1] : '').trim();
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳|防塵|防毒/i.test(name)) continue;

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
        await page.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        if (page) await page.close().catch(() => {});
      }
    }

    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('PMDA采集完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
