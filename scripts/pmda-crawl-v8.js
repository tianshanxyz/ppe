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
  console.log('PMDA Japan 采集 v8 (调试版)');
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
  let totalSkipped = 0;
  let totalErrors = 0;

  async function insertProduct(product) {
    const key = `${product.name.toLowerCase()}|${(product.manufacturer_name || '').toLowerCase()}|${(product.product_code || '').toLowerCase()}`;
    if (existingKeys.has(key)) {
      totalSkipped++;
      return false;
    }

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
    } else {
      totalErrors++;
      if (totalErrors <= 5) console.log(`    插入错误: ${error.message?.substring(0, 100)}`);
      return false;
    }
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const pmdaKeywords = [
      'マスク', '人工呼吸器用マスク', '手袋', '検査用手袋',
      '呼吸回路', '酸素カニューレ', 'ガウン',
    ];

    let pmdaInserted = 0;

    for (const keyword of pmdaKeywords) {
      let searchPage;
      try {
        searchPage = await browser.newPage();
        await searchPage.setDefaultTimeout(60000);
        await searchPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        console.log(`\n  搜索: ${keyword}`);

        await searchPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });
        await sleep(5000);

        await searchPage.evaluate(() => {
          const form = document.getElementById('kikiSearchForm');
          if (form) {
            form.removeAttribute('onsubmit');
            form.target = '_self';
          }
        });

        await searchPage.focus('#txtName');
        await searchPage.keyboard.type(keyword, { delay: 30 });
        await sleep(500);

        await searchPage.evaluate(() => {
          const listRows = document.getElementById('ListRows');
          if (listRows) listRows.value = '100';
        });

        await Promise.all([
          searchPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {}),
          searchPage.click('input[name="btnA"]'),
        ]);

        await sleep(8000);

        const resultInfo = await searchPage.evaluate(() => {
          const body = document.body.innerText;
          const hitMatch = body.match(/検索結果\s*(\d+)\s*件/);
          const hitCount = hitMatch ? parseInt(hitMatch[1]) : 0;

          const items = [];
          document.querySelectorAll('table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 4 && cells[0].length > 0) {
              items.push({
                generalName: cells[0] || '',
                salesName: cells[2] || '',
                manufacturer: cells[3] || '',
              });
            }
          });

          return { hitCount, items };
        });

        console.log(`  搜索结果: ${resultInfo.hitCount}件, 数据行: ${resultInfo.items.length}`);

        let keywordInserted = 0;
        let keywordSkipped = 0;
        let keywordOther = 0;

        for (const item of resultInfo.items) {
          const salesName = item.salesName || '';
          const generalName = item.generalName || '';
          const name = salesName || generalName;
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          const generalCategory = categorizePPE(generalName);
          const finalCategory = category !== '其他' ? category : (generalCategory !== '其他' ? generalCategory : categorizePPE(keyword));

          if (finalCategory === '其他') {
            keywordOther++;
            continue;
          }

          let mfrName = item.manufacturer.replace(/^製造販売／/, '').trim();
          mfrName = mfrName.split(/[,，、]/)[0].trim();

          const product = {
            name: name.substring(0, 500),
            category: finalCategory,
            manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
            product_code: generalName.substring(0, 50),
            country_of_origin: 'JP',
            risk_level: determineRiskLevel(name),
            data_source: 'PMDA Japan',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (keywordInserted < 3) {
            console.log(`    样本: name="${name.substring(0, 50)}", category="${finalCategory}", mfr="${mfrName.substring(0, 30)}", code="${generalName.substring(0, 30)}"`);
          }

          if (await insertProduct(product)) {
            keywordInserted++;
            pmdaInserted++;
          } else {
            keywordSkipped++;
          }
        }

        console.log(`  ${keyword}: 插入${keywordInserted}, 跳过${keywordSkipped}, 非PPE${keywordOther}`);
        await searchPage.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        if (searchPage) await searchPage.close().catch(() => {});
      }
    }

    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);
    console.log(`  总跳过(重复): ${totalSkipped}`);
    console.log(`  总错误: ${totalErrors}`);

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('PMDA采集完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
}

main().catch(console.error);
