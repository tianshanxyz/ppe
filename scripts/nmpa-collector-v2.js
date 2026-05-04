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
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|呼吸|防尘|防毒|口罩/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|护目镜|防护面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|防护围裙/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/n95|kn95|ffp|医用防护口罩|防护服|respirat|scba/i.test(n)) return 'high';
  if (/外科口罩|helmet|goggle|glove|boot|footwear/i.test(n)) return 'medium';
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
  console.log('NMPA 中国医疗器械PPE数据采集 v2');
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
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--disable-crashpad-for-testing', '--disable-breakpad',
    ],
  });

  try {
    const keywords = ['口罩', '防护服', '医用手套', '护目镜', '防护面罩', '隔离衣',
      '手术衣', '检查手套', '外科手套', '呼吸器', '防护眼镜', '防护鞋'];

    let nmpaInserted = 0;
    const seenSession = new Set();

    const page = await browser.newPage();
    await page.setDefaultTimeout(90000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    for (const keyword of keywords) {
      try {
        const capturedData = [];

        page.on('response', async (res) => {
          try {
            const ct = res.headers()['content-type'] || '';
            if (ct.includes('json') && (res.url().includes('search') || res.url().includes('datasearch'))) {
              const json = await res.json();
              capturedData.push({ url: res.url().substring(0, 150), data: json });
            }
          } catch (e) { /* skip */ }
        });

        console.log(`\n  NMPA搜索: ${keyword}`);

        await page.goto('https://www.nmpa.gov.cn/datasearch/home-index.html?itemId=ff80808183cb8f8e0183e7ddba0c41a8#category=ylqx', {
          waitUntil: 'networkidle2', timeout: 60000,
        });
        await sleep(8000);

        const searchInput = await page.$('input[type="text"], input:not([type]):not([type="hidden"])');
        if (searchInput) {
          await searchInput.click({ clickCount: 4 });
          await searchInput.press('Backspace');
          await sleep(500);
          await searchInput.type(keyword, { delay: 20 });
          await sleep(1000);

          await page.evaluate(() => {
            const allBtns = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, .search-btn, div[onclick]');
            for (const btn of allBtns) {
              const txt = (btn.textContent || btn.value || btn.getAttribute('title') || '').trim();
              if (txt.includes('搜索') || txt.includes('查询')) { btn.click(); return; }
            }
          });

          await sleep(15000);
        }

        let allItems = [];
        for (const cap of capturedData) {
          const d = cap.data;
          let items = d?.data || d?.list || d?.rows || d?.records || d?.result || (Array.isArray(d) ? d : []);
          if (Array.isArray(items) && items.length > 0) {
            console.log(`    API返回: ${items.length}条`);
            allItems.push(...items);
          }
        }

        if (allItems.length <= 4) {
          try {
            const textResults = await page.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tr, .list tr, .dataTable tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 2) && !cells.some(c => c.includes('序号') || c.includes('操作'))) {
                  items.push(cells);
                }
              });
              return items;
            });
            if (textResults.length > 0) {
              console.log(`    页面表格: ${textResults.length}行`);
              textResults.forEach(r => allItems.push(r));
            }
          } catch (e) { /* skip */ }
        }

        if (allItems.length === 0) {
          try {
            const fullText = await page.evaluate(() => document.body.innerText.substring(0, 5000));
            const lines = fullText.split('\n').filter(l => l.trim().length > 5 && /口罩|防护|手套|护目|隔离|手术|呼吸|面罩|眼镜|面屏|鞋|帽|围裙/i.test(l));
            lines.slice(0, 200).forEach(l => allItems.push([l.trim().substring(0, 500)]));
            if (lines.length > 0) console.log(`    页面文字: ${lines.length}行PPE相关`);
          } catch (e) { /* skip */ }
        }

        console.log(`    总数据: ${allItems.length}条`);

        let keywordInserted = 0;
        for (const item of allItems) {
          let name, mfr, regNo;

          if (Array.isArray(item)) {
            name = String(item[0] || '').trim();
            mfr = String(item[2] || item[1] || '').trim();
            regNo = String(item[1] || '').trim();
          } else if (typeof item === 'string') {
            name = item.trim();
            mfr = '';
            regNo = '';
          } else {
            name = String(item.CPMC || item.cpmc || item.name || item.productName || item['产品名称'] || '').trim();
            mfr = String(item.QYMC || item.qymc || item.manufacturer || item.companyName || item['生产企业'] || '').trim();
            regNo = String(item.YXQZ || item.yxqz || item.registrationNumber || item['注册证号'] || '').trim();
          }

          if (!name || name.length < 2) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const mfrClean = String(mfr || 'Unknown').trim();
          const sesKey = `${name}|${mfrClean}`;
          if (seenSession.has(sesKey)) continue;
          seenSession.add(sesKey);

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfrClean.substring(0, 500),
            product_code: regNo.substring(0, 50),
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
        }

        console.log(`    ${keyword}: 新增${keywordInserted}条 (累计${nmpaInserted})`);
      } catch (e) {
        console.log(`    ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
      }
    }

    console.log(`\n  NMPA总计插入: ${nmpaInserted}`);
    await page.close();
  } finally {
    await browser.close();
  }

  console.log(`\n=== 完成 ===`);
  console.log(`新增产品: ${totalInserted}`);
  console.log(`新增制造商: ${totalMfrInserted}`);
}

main().catch(console.error);
