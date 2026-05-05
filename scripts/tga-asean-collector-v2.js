#!/usr/bin/env node
const axios = require('axios');
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|呼吸|防尘|防毒|口罩/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|护目镜|防护面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩|防噪/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋|足部/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|防护围裙/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (/n95|kn95|ffp/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear/i.test(n)) return 'medium';
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
  console.log('TGA澳大利亚 + 东南亚 PPE数据采集 v2');
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
        if (!mfrErr) { existingMfrNames.add(mfrName.toLowerCase().trim()); totalMfrInserted++; }
      }
      return true;
    }
    return false;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--disable-crashpad-for-testing', '--disable-breakpad',
    ],
  });

  try {
    // ===== PART 1: TGA Australia ARTG (with API reconnaissance) =====
    console.log('\n========================================');
    console.log('PART 1: TGA Australia ARTG (v2 - API reconnaissance)');
    console.log('========================================');

    let tgaInserted = 0;
    const seenSession = new Set();

    const page = await browser.newPage();
    await page.setDefaultTimeout(90000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    await page.setRequestInterception(true);

    let apiResponses = [];
    page.on('request', (req) => req.continue());
    page.on('response', async (res) => {
      const url = res.url();
      const ct = res.headers()['content-type'] || '';
      if ((ct.includes('json') || ct.includes('xml') || url.includes('/api/') || url.includes('/jsonapi/') || url.includes('_format=json')) && res.status() === 200) {
        try {
          const text = await res.text();
          if (text && text.length > 20 && text.length < 500000 && (text.startsWith('{') || text.startsWith('['))) {
            apiResponses.push({ url, length: text.length });
            try {
              apiResponses[apiResponses.length - 1].json = JSON.parse(text);
            } catch(e) {}
          }
        } catch(e) {}
      }
    });

    // Navigate to TGA ARTG search page
    const tgaBaseUrl = 'https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg';
    console.log(`  加载TGA ARTG: ${tgaBaseUrl}`);
    
    await page.goto(tgaBaseUrl, { waitUntil: 'networkidle2', timeout: 120000 });
    await sleep(10000);

    // Log API endpoints found
    const tgaApis = apiResponses.filter(r => r.json);
    console.log(`  发现API响应: ${tgaApis.length}个`);
    tgaApis.forEach(a => console.log(`    ${a.url.substring(0, 100)} (${a.length}B)`));

    // Search for PPE terms
    const tgaTerms = [
      'respirator', 'surgical mask', 'protective mask', 'N95 mask', 'face shield',
      'protective glove', 'surgical glove', 'examination glove',
      'protective gown', 'isolation gown', 'surgical gown', 'coverall',
      'protective suit', 'safety glasses', 'goggle', 'visor',
      'safety helmet', 'earplug', 'earmuff', 'safety boot'
    ];

    for (let ti = 0; ti < Math.min(tgaTerms.length, 8); ti++) {
      const term = tgaTerms[ti];
      apiResponses = [];

      console.log(`\n  TGA搜索 [${ti+1}/${Math.min(tgaTerms.length,8)}]: ${term}`);

      try {
        // Navigate with search term in URL
        const searchUrl = `${tgaBaseUrl}?search_api_fulltext=${encodeURIComponent(term)}&f%5B0%5D=type%3Amedical_device`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 120000 });
        await sleep(8000);

        // Check API responses
        const searchApis = apiResponses.filter(r => r.json);
        console.log(`    API响应: ${searchApis.length}个`);

        // Extract data from page content
        const results = await page.evaluate(() => {
          const items = [];
          
          // Try Drupal view rows
          document.querySelectorAll('.views-row, .artg-listing__item, .search-result, .listing-item, .artg-result, .au-body .artg-search-result').forEach(el => {
            const titleEl = el.querySelector('h2, h3, h4, .title, .artg-listing__title, a');
            const title = titleEl?.textContent?.trim() || '';
            const desc = el.textContent?.trim()?.substring(0, 500) || '';
            if (title.length > 3) items.push({ title, desc });
          });

          // Try links
          if (items.length === 0) {
            document.querySelectorAll('a').forEach(link => {
              const text = link.textContent.trim();
              const href = link.getAttribute('href') || '';
              if (text.length > 10 && (href.includes('artg') || href.includes('ARTG'))) {
                items.push({ title: text, href });
              }
            });
          }

          return items.slice(0, 200);
        });

        console.log(`    页面结果: ${results.length}条`);

        // Fallback to body text
        if (results.length === 0) {
          const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 10000));
          const lines = bodyText.split('\n').filter(l => 
            l.trim().length > 10 && 
            /mask|glove|gown|respir|helmet|visor|goggle|protective|safety|surgical/i.test(l)
          ).slice(0, 100);
          lines.forEach(l => results.push({ title: l.trim().substring(0, 500) }));
          if (lines.length > 0) console.log(`    文本匹配: ${lines.length}行`);
        }

        // Process results
        let keywordInserted = 0;
        for (const item of results) {
          const name = (item.title || item.name || '').trim();
          const mfr = (item.sponsor || item.sponsorName || item.manufacturer || '').trim();
          const code = (item.artgId || item.artg_id || item.code || '').trim();

          if (!name || name.length < 3) continue;
          const category = categorizePPE(name);
          if (category === '其他') continue;

          const sesKey = `${name.toLowerCase()}|${(mfr || 'Unknown').toLowerCase()}`;
          if (seenSession.has(sesKey)) continue;
          seenSession.add(sesKey);

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            product_code: code.substring(0, 50),
            country_of_origin: 'AU',
            risk_level: determineRiskLevel(name),
            data_source: 'TGA Australia ARTG',
            registration_authority: 'TGA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) {
            keywordInserted++;
            tgaInserted++;
          }
        }

        console.log(`    ${term}: 新增${keywordInserted}条 (累计${tgaInserted})`);

      } catch (e) {
        console.log(`    ${term}: 错误 - ${e.message?.substring(0, 100)}`);
      }
    }

    console.log(`\n  TGA总计插入: ${tgaInserted}`);
    await page.close();

    // ===== PART 2: Singapore HSA SMDR =====
    console.log('\n========================================');
    console.log('PART 2: Singapore HSA SMDR');
    console.log('========================================');

    let sgInserted = 0;
    const sgUrl = 'https://eservice.hsa.gov.sg/medics/md/mdEnquiry.do?action=loadClassA';

    try {
      const sgPage = await browser.newPage();
      await sgPage.setDefaultTimeout(120000);
      await sgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      console.log(`  访问: ${sgUrl}`);
      await sgPage.goto(sgUrl, { waitUntil: 'networkidle2', timeout: 120000 });
      await sleep(10000);

      // Try multiple extraction strategies
      const sgResults = await sgPage.evaluate(() => {
        const items = [];
        
        // Strategy 1: Table rows
        document.querySelectorAll('table tr, .listTable tr').forEach(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
          const fullText = row.textContent.trim();
          if (fullText.length > 5 && !fullText.includes('No records found')) {
            items.push(cells.length >= 2 ? cells : [fullText]);
          }
        });

        // Strategy 2: List elements
        if (items.length === 0) {
          document.querySelectorAll('li, .list-item, .data-row, .result-row').forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 5) items.push([text.substring(0, 500)]);
          });
        }

        // Strategy 3: Body text PPE filter
        if (items.length === 0) {
          const text = document.body.innerText;
          const lines = text.split('\n').filter(l => l.trim().length > 5);
          lines.filter(l => /mask|glove|gown|respir|goggle|face shield|visor|protective|safety/i.test(l))
            .slice(0, 100).forEach(l => items.push([l.trim().substring(0, 300)]));
        }
        return items;
      });

      console.log(`  HSA结果: ${sgResults.length}条`);

      for (const row of sgResults) {
        const name = (row[0] || '').trim();
        const mfr = (row.length > 2 ? row[2] : row.length > 1 ? row[1] : '').trim();
        if (!name || name.length < 3) continue;

        const category = categorizePPE(name);
        if (category === '其他') continue;

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (mfr || 'Unknown').substring(0, 500),
          country_of_origin: 'SG',
          risk_level: determineRiskLevel(name),
          data_source: 'HSA Singapore SMDR',
          registration_authority: 'HSA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) sgInserted++;
      }

      console.log(`  HSA总计插入: ${sgInserted}`);
      await sgPage.close();
    } catch (e) {
      console.log(`  HSA错误: ${e.message?.substring(0, 100)}`);
    }

    // ===== PART 3: Malaysia MDA =====
    console.log('\n========================================');
    console.log('PART 3: Malaysia MDA');
    console.log('========================================');

    let myInserted = 0;

    try {
      const myPage = await browser.newPage();
      await myPage.setDefaultTimeout(120000);
      await myPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const myUrl = 'https://mdar.mda.gov.my/frontend/web/index.php?r=carian%2Findex';
      console.log(`  访问: ${myUrl}`);
      await myPage.goto(myUrl, { waitUntil: 'networkidle2', timeout: 120000 });
      await sleep(10000);

      const myTerms = ['mask', 'glove', 'gown', 'respirator', 'visor', 'face shield', 'goggle', 'N95'];

      for (const term of myTerms) {
        try {
          // Try both text input and Enter key
          const inputEl = await myPage.$('input[type="text"], input[type="search"], input:not([type])');
          if (!inputEl) continue;

          await inputEl.click({ clickCount: 3 });
          await myPage.keyboard.press('Backspace');
          await sleep(200);
          await myPage.keyboard.type(term, { delay: 20 });
          await sleep(500);
          await myPage.keyboard.press('Enter');
          await sleep(8000);

          const results = await myPage.evaluate(() => {
            const items = [];
            document.querySelectorAll('table tr').forEach(row => {
              const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
              const text = row.textContent.trim();
              if (text.length > 5 && cells.length >= 2) items.push(cells);
            });
            return items.slice(0, 100);
          });

          for (const row of results) {
            const name = (row[1] || row[0] || '').trim();
            const mfr = (row.length > 3 ? row[3] : row.length > 2 ? row[2] : '').trim();
            const regNo = (row.length > 2 ? row[2] : row[1] || '').trim();

            if (!name || name.length < 3) continue;
            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              product_code: regNo.substring(0, 50),
              country_of_origin: 'MY',
              risk_level: determineRiskLevel(name),
              data_source: 'MDA Malaysia',
              registration_authority: 'MDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) myInserted++;
          }

        } catch (e) {
          console.log(`    ${term}: 跳过`);
        }
      }

      console.log(`  MDA总计插入: ${myInserted}`);
      await myPage.close();
    } catch (e) {
      console.log(`  MDA错误: ${e.message?.substring(0, 100)}`);
    }

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('采集完成');
  console.log('========================================');
  console.log(`新增产品: ${totalInserted}`);
  console.log(`新增制造商: ${totalMfrInserted}`);
  const { count: fCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品数: ${fCount}`);
}

main().catch(console.error);
