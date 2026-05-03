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
  if (/respirat|mask|n95|n99|n100|ffp|kn95|kp95|breathing|air.purif|scba/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|latex.*hand|hand.*protect/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|safety.*glass|visor/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|bump.cap/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|noise.*reduc/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|safety.*foot|toe.*cap|steel.*toe/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|flame.*resist|arc.*flash/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|protective.*cloth|isolation|hazmat/i.test(n)) return '身体防护装备';
  if (/マスク|呼吸|防塵|防毒/i.test(n)) return '呼吸防护装备';
  if (/手袋|グローブ/i.test(n)) return '手部防护装备';
  if (/保護めがね|ゴーグル|眼鏡/i.test(n)) return '眼面部防护装备';
  if (/ヘルメット|安全帽/i.test(n)) return '头部防护装备';
  if (/耳栓|イヤーマフ|聴覚/i.test(n)) return '听觉防护装备';
  if (/安全靴|シューズ/i.test(n)) return '足部防护装备';
  if (/マスク|呼吸|防塵|防毒/i.test(n)) return '呼吸防护装备';
  if (/마스크|호흡|보호구/i.test(n)) return '呼吸防护装备';
  if (/장갑/i.test(n)) return '手部防护装备';
  if (/보호안경|고글/i.test(n)) return '眼面部防护装备';
  if (/안전모|헬멧/i.test(n)) return '头部防护装备';
  if (/귀마개|이어마프/i.test(n)) return '听觉防护装备';
  if (/안전화|부츠/i.test(n)) return '足部防护装备';
  if (/보호복|보호의/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical|arc flash|マスク|呼吸|호흡/i.test(n)) return 'high';
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

async function crawlPMDA(browser) {
  console.log('\n========================================');
  console.log('PMDA Japan 医療機器 添付文書検索');
  console.log('========================================');

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  const pmdaKeywords = [
    'マスク', '呼吸用保護具', '防塵マスク', '防毒マスク',
    '手袋', '保護手袋', 'ゴーグル', '保護めがね',
    'ヘルメット', '安全帽', '耳栓', '聴覚保護',
    '安全靴', '保護衣', '防護服', '保護面',
  ];

  let pmdaInserted = 0;

  for (const keyword of pmdaKeywords) {
    try {
      console.log(`  搜索: ${keyword}...`);
      await page.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);

      const searchInput = await page.$('input[name="searchKeyword"], input[type="text"], #searchKeyword');
      if (!searchInput) {
        console.log(`    未找到搜索框`);
        continue;
      }

      await searchInput.click({ clickCount: 3 });
      await searchInput.type(keyword);
      await sleep(500);

      const searchBtn = await page.$('input[type="submit"], button[type="submit"], .search-btn, #searchBtn');
      if (searchBtn) {
        await searchBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await sleep(3000);

      const results = await page.evaluate(() => {
        const items = [];
        const rows = document.querySelectorAll('table.result-table tr, .search-result-item, table.list tr, .result-list tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            items.push({
              name: cells[0]?.textContent?.trim() || '',
              detail: cells[1]?.textContent?.trim() || '',
              mfr: cells[2]?.textContent?.trim() || '',
              date: cells[3]?.textContent?.trim() || '',
            });
          }
        });

        if (items.length === 0) {
          const links = document.querySelectorAll('a[href*="kikiSearch"], a[href*="Result"], .result a');
          links.forEach(link => {
            items.push({
              name: link.textContent?.trim() || '',
              href: link.href || '',
            });
          });
        }

        return items;
      });

      console.log(`    找到 ${results.length} 条结果`);

      for (const item of results) {
        const name = item.name || '';
        if (!name || name.length < 3) continue;

        const category = categorizePPE(name);
        const riskLevel = determineRiskLevel(name);

        const key = `${name.toLowerCase()}|${(item.mfr || '').toLowerCase()}|`;
        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (item.mfr || 'Unknown').substring(0, 500),
          country_of_origin: 'JP',
          risk_level: riskLevel,
          data_source: 'PMDA Japan',
          registration_authority: 'PMDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) pmdaInserted++;
      }

      await sleep(2000);
    } catch (e) {
      console.log(`    错误: ${e.message}`);
    }
  }

  await page.close();
  console.log(`  PMDA总计: ${pmdaInserted}`);
  return pmdaInserted;
}

async function crawlMFDS(browser) {
  console.log('\n========================================');
  console.log('MFDS Korea 의료기기 검색');
  console.log('========================================');

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  const mfdsKeywords = [
    '마스크', '호흡보호구', '방진마스크',
    '장갑', '보호장갑', '보호안경', '고글',
    '안전모', '헬멧', '귀마개', '청력보호',
    '안전화', '보호복', '보호의', '보호면',
  ];

  let mfdsInserted = 0;

  for (const keyword of mfdsKeywords) {
    try {
      console.log(`  搜索: ${keyword}...`);

      await page.goto('https://emed.mfds.go.kr/', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);

      const searchInput = await page.$('input[name="searchKeyword"], input[type="text"], #searchKeyword, input[placeholder*="검색"]');
      if (!searchInput) {
        console.log(`    未找到搜索框，尝试其他URL...`);
        await page.goto('https://www.mfds.go.kr/eng/index.do', { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);
        continue;
      }

      await searchInput.click({ clickCount: 3 });
      await searchInput.type(keyword);
      await sleep(500);
      await page.keyboard.press('Enter');

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await sleep(3000);

      const results = await page.evaluate(() => {
        const items = [];
        const rows = document.querySelectorAll('table tbody tr, .result-list tr, .search-result tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            items.push({
              name: cells[0]?.textContent?.trim() || '',
              mfr: cells[1]?.textContent?.trim() || '',
              classType: cells[2]?.textContent?.trim() || '',
              regNum: cells[3]?.textContent?.trim() || '',
            });
          }
        });
        return items;
      });

      console.log(`    找到 ${results.length} 条结果`);

      for (const item of results) {
        const name = item.name || '';
        if (!name || name.length < 3) continue;

        const category = categorizePPE(name);
        const riskLevel = determineRiskLevel(name);

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (item.mfr || 'Unknown').substring(0, 500),
          country_of_origin: 'KR',
          risk_level: riskLevel,
          data_source: 'MFDS Korea',
          registration_number: item.regNum || null,
          registration_authority: 'MFDS',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) mfdsInserted++;
      }

      await sleep(2000);
    } catch (e) {
      console.log(`    错误: ${e.message}`);
    }
  }

  await page.close();
  console.log(`  MFDS总计: ${mfdsInserted}`);
  return mfdsInserted;
}

async function crawlPureGlobal(browser) {
  console.log('\n========================================');
  console.log('Pure Global AI 免费数据爬取');
  console.log('========================================');

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

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
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(3000);

        const results = await page.evaluate(() => {
          const items = [];
          const cards = document.querySelectorAll('.device-card, .device-item, .result-item, [class*="device"], [class*="product"]');
          cards.forEach(card => {
            const nameEl = card.querySelector('h2, h3, .device-name, .product-name, [class*="name"], [class*="title"]');
            const mfrEl = card.querySelector('.manufacturer, .company, [class*="manufacturer"], [class*="company"]');
            const classEl = card.querySelector('.device-class, [class*="class"]');
            items.push({
              name: nameEl?.textContent?.trim() || '',
              manufacturer: mfrEl?.textContent?.trim() || '',
              deviceClass: classEl?.textContent?.trim() || '',
            });
          });

          if (items.length === 0) {
            const allText = document.body.innerText;
            const lines = allText.split('\n').filter(l => l.trim().length > 5);
            const deviceLines = lines.filter(l =>
              /respirat|mask|glove|goggle|helmet|boot|gown|coverall|suit|protection|protective|safety/i.test(l)
            );
            deviceLines.slice(0, 20).forEach(line => {
              items.push({ name: line.trim().substring(0, 200), manufacturer: '', deviceClass: '' });
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

          const { error } = await supabase.from('ppe_products').insert(product);
          if (!error) {
            codeCount++;
            pgInserted++;
          }
        }

        if (codeCount > 0) console.log(`    ${code}: ${codeCount} 条`);
        await sleep(1500);
      } catch (e) {
        // skip
      }
    }
    console.log(`  ${country.code}: ${pgInserted} 条`);
  }

  await page.close();
  console.log(`  Pure Global总计: ${pgInserted}`);
  return pgInserted;
}

async function main() {
  console.log('========================================');
  console.log('Puppeteer 无头浏览器爬虫');
  console.log('========================================');
  console.log('时间:', new Date().toISOString());

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

  console.log('\n启动无头浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const pmdaCount = await crawlPMDA(browser);
    totalInserted += pmdaCount;

    const mfdsCount = await crawlMFDS(browser);
    totalInserted += mfdsCount;

    const pgCount = await crawlPureGlobal(browser);
    totalInserted += pgCount;
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('爬取完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
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

  console.log('\n全部爬取完成!');
}

main().catch(console.error);
