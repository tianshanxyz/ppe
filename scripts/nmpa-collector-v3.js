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
  if (/口罩|mask|n95|kn95|ffp|呼吸|防尘|防毒|respirat/i.test(n)) return '呼吸防护装备';
  if (/手套|glove|nitrile/i.test(n)) return '手部防护装备';
  if (/护目镜|防护面罩|面屏|goggle|visor|face.*shield/i.test(n)) return '眼面部防护装备';
  if (/安全帽|防护帽|helmet|hard.*hat/i.test(n)) return '头部防护装备';
  if (/耳塞|耳罩|earplug|earmuff/i.test(n)) return '听觉防护装备';
  if (/安全鞋|防护鞋|boot|shoe|foot/i.test(n)) return '足部防护装备';
  if (/反光|vest|high.*vis/i.test(n)) return '躯干防护装备';
  if (/防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit|isolation|hazmat/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/n95|kn95|ffp|医用防护口罩|防护服|respirat|scba/i.test(n)) return 'high';
  if (/外科口罩|helmet|goggle|glove|boot/i.test(n)) return 'medium';
  if (/一次性口罩|普通口罩|民用/i.test(n)) return 'low';
  return 'medium';
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
  console.log('NMPA 中国医疗器械PPE数据采集 v3');
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
      existingKeys.add(key); totalInserted++;
      const mfr = product.manufacturer_name;
      if (mfr && mfr !== 'Unknown' && !existingMfrNames.has(mfr.toLowerCase().trim())) {
        await supabase.from('ppe_manufacturers').insert({
          name: mfr.substring(0, 500), country: product.country_of_origin || 'CN',
          data_source: product.data_source, last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: product.data_confidence_level || 'medium',
        });
        existingMfrNames.add(mfr.toLowerCase().trim()); totalMfrInserted++;
      }
      return true;
    }
    return false;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--disable-crashpad-for-testing', '--disable-breakpad',
    ],
  });

  try {
    const keywords = [
      '口罩', '防护服', '医用手套', '护目镜', '防护面罩', '隔离衣',
      '手术衣', '检查手套', '外科手套', '呼吸器', '防护眼镜', '防护鞋',
      '防毒面具', '防护帽', '耳塞', '安全帽'
    ];

    let nmpaInserted = 0;
    const seenSession = new Set();

    const page = await browser.newPage();
    await page.setDefaultTimeout(90000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // Enable request interception to track ALL network activity
    await page.setRequestInterception(true);

    let apiResponses = [];
    let allRequests = [];

    page.on('request', (req) => {
      const url = req.url();
      allRequests.push({ url, method: req.method(), resourceType: req.resourceType() });
      req.continue();
    });

    page.on('response', async (res) => {
      const url = res.url();
      const ct = res.headers()['content-type'] || '';
      if ((url.includes('datasearch') || url.includes('search') || url.includes('api')) &&
          (ct.includes('json') || ct.includes('javascript') || res.status() === 200)) {
        try {
          const text = await res.text();
          if (text && text.length > 10 && (text.startsWith('{') || text.startsWith('['))) {
            apiResponses.push({ url, body: text.substring(0, 2000), length: text.length });
            try {
              const json = JSON.parse(text);
              apiResponses[apiResponses.length - 1].json = json;
            } catch(e) {}
          }
        } catch(e) {}
      }
    });

    // PHASE 1: Reconnaissance - load page and capture API endpoints
    console.log('\n[阶段1] 页面侦察 - 分析API端点...');
    
    const nmpaUrl = 'https://www.nmpa.gov.cn/datasearch/home-index.html?itemId=ff80808183cb8f8e0183e7ddba0c41a8#category=ylqx';
    console.log(`  加载: ${nmpaUrl}`);
    
    await page.goto(nmpaUrl, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(10000);

    // Log all captured API responses
    console.log(`  捕获响应: ${apiResponses.length}个`);
    const apiUrls = new Set();
    apiResponses.forEach(r => {
      if (!apiUrls.has(r.url)) {
        apiUrls.add(r.url);
        console.log(`    API: ${r.url.substring(0, 120)} (${r.length} bytes)`);
      }
    });

    // Log distinct request URLs
    const distinctReqs = new Map();
    allRequests.forEach(r => {
      const base = r.url.split('?')[0];
      if (r.resourceType === 'xhr' || r.resourceType === 'fetch') {
        const key = `${r.method} ${base}`;
        if (!distinctReqs.has(key)) distinctReqs.set(key, r.url);
      }
    });
    console.log(`  XHR/Fetch请求: ${distinctReqs.size}个`);
    for (const [key, url] of distinctReqs) {
      console.log(`    ${key}: ${url.substring(0, 100)}`);
    }

    // PHASE 2: Try search and capture API
    console.log('\n[阶段2] 搜索测试 - 尝试搜索并捕获数据API...');

    for (let ki = 0; ki < Math.min(keywords.length, 5); ki++) {
      const keyword = keywords[ki];
      apiResponses = [];
      allRequests = [];

      console.log(`\n  [${ki+1}/${Math.min(keywords.length,5)}] 搜索: ${keyword}`);

      // Reset page by reloading
      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(8000);

      // Find and clear search input
      const inputFound = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const inp of inputs) {
          if (inp.offsetParent !== null && !inp.readOnly && !inp.disabled) {
            inp.value = '';
            inp.focus();
            return true;
          }
        }
        return false;
      });

      if (inputFound) {
        // Type keyword into input
        const inputEl = await page.$('input[type="text"]:not([readonly]):not([disabled]), input:not([type]):not([readonly]):not([disabled])');
        if (inputEl) {
          await inputEl.click({ clickCount: 4 });
          await inputEl.press('Backspace');
          await sleep(300);
          await inputEl.type(keyword, { delay: 30 });
          await sleep(1000);

          // Press Enter to search
          await inputEl.press('Enter');
          await sleep(2000);

          // Also try clicking search button
          await page.evaluate(() => {
            const allEls = document.querySelectorAll('button, a, div, span, input[type="button"], input[type="submit"]');
            for (const el of allEls) {
              const txt = (el.textContent || el.value || '').trim();
              const title = (el.getAttribute('title') || '').trim();
              if (txt.includes('搜索') || txt.includes('查询') || title.includes('搜索')) {
                el.click();
                return;
              }
            }
          });

          await sleep(15000);
        }
      }

      // Check captured API responses
      const searchApis = apiResponses.filter(r => r.json);
      console.log(`    搜索API响应: ${searchApis.length}个`);
      
      let allItems = [];
      for (const api of searchApis) {
        const d = api.json;
        let items = d?.data || d?.list || d?.rows || d?.records || d?.result || d?.resultList || 
                    d?.datas || d?.content || (Array.isArray(d) ? d : []);
        if (items && Array.isArray(items) && items.length > 0) {
          console.log(`      ${api.url.substring(0,60)}: ${items.length}条`);
          // Log first item structure
          if (items[0]) {
            const keys = typeof items[0] === 'object' ? Object.keys(items[0]).slice(0, 10).join(', ') : typeof items[0];
            console.log(`        字段: ${keys}`);
          }
          allItems.push(...items);
        }
      }

      // Fallback: try to get data from page DOM
      if (allItems.length === 0) {
        const pageData = await page.evaluate(() => {
          const results = [];
          // Try various table/row selectors
          const tables = document.querySelectorAll('table tbody tr, .el-table__body tr, .ant-table-tbody tr, .table tr, .data-list li, .list-item');
          tables.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th, .cell, span')).map(c => c.textContent.trim());
            const text = row.textContent.trim();
            if (text.length > 5 && text.length < 500) results.push({ text, cells });
          });
          if (results.length === 0) {
            // Try Angular component selectors
            const allText = document.body.innerText;
            if (allText.includes('注册证编号') || allText.includes('产品名称')) {
              results.push({ text: 'PAGE_CONTAINS_DATA_TABLE', raw: allText.substring(0, 5000) });
            }
          }
          return results;
        });
        console.log(`    DOM数据: ${pageData.length}条`);
        if (pageData.length > 0 && pageData[0].raw) {
          console.log(`    页面内容预览(前200字): ${pageData[0].raw.substring(0, 200)}`);
        }
      }

      console.log(`    总数据: ${allItems.length}条`);

      // Process and insert
      let keywordInserted = 0;
      for (const item of allItems) {
        try {
          let name = '', mfr = '', regNo = '';

          if (typeof item === 'string') {
            name = item.trim();
          } else if (item && typeof item === 'object') {
            name = String(
              item.cpmc || item.CPMC || item.productName || item.name ||
              item['产品名称'] || item.qymc || item['器械名称'] || ''
            ).trim();
            mfr = String(
              item.qymc || item.QYMC || item.manufacturer || item.companyName ||
              item['生产企业'] || item['企业名称'] || item.scqymc || ''
            ).trim();
            regNo = String(
              item.yxqz || item.YXQZ || item.registrationNumber || item.productCode ||
              item['注册证编号'] || item['注册证号'] || item.zczbh || item.code || ''
            ).trim();
          }

          if (!name || name.length < 2) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const mfrClean = (mfr || 'Unknown').substring(0, 500);
          const sesKey = `${name}|${mfrClean}`;
          if (seenSession.has(sesKey)) continue;
          seenSession.add(sesKey);

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfrClean,
            product_code: (regNo || '').substring(0, 50),
            country_of_origin: 'CN',
            risk_level: determineRiskLevel(name),
            data_source: 'NMPA China',
            registration_authority: 'NMPA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) {
            keywordInserted++;
            nmpaInserted++;
          }
        } catch(e) {}
      }

      console.log(`    ${keyword}: 新增${keywordInserted}条 (累计${nmpaInserted})`);
    }

    console.log(`\n  NMPA总计插入: ${nmpaInserted}`);

  } finally {
    await browser.close();
  }

  console.log(`\n=== 完成 ===`);
  console.log(`新增产品: ${totalInserted}`);
  console.log(`新增制造商: ${totalMfrInserted}`);
}

main().catch(console.error);
