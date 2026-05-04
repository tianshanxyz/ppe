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
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩|防噪/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋|足部/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|防护围裙/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (/n95|kn95|ffp|医用防护口罩|防护服/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear|外科口罩/i.test(n)) return 'medium';
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
  console.log('NMPA 中国医疗器械PPE数据采集');
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
          country: product.country_of_origin || 'CN',
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
    const nmpaKeywords = [
      '口罩', '防护服', '医用手套', '护目镜', '防护面罩', '防护面屏',
      '隔离衣', '手术衣', '外科口罩', 'KN95', 'N95',
      '检查手套', '外科手套', '防护手套', '呼吸器', '防护眼镜',
      '防护屏', '防护鞋', '面罩', '防护围裙',
    ];

    const Tables = {
      domestic: { tableId: '26', itemId: 'ff80808183cb8f8e0183e7ddba0c41a8', tableName: '26' },
      imported: { tableId: '27', itemId: 'ff80808183cb8f8e0183e7ddba0c41a8', tableName: '27' },
    };

    let nmpaInserted = 0;
    const seenInSession = new Set();

    for (const keyword of nmpaKeywords) {
      for (const [tableType, tableConfig] of Object.entries(Tables)) {
        let page;
        try {
          page = await browser.newPage();
          await page.setDefaultTimeout(90000);
          await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

          const capturedData = [];
          page.on('response', async (res) => {
            const url = res.url();
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json') && (url.includes('search') || url.includes('datasearch'))) {
                const json = await res.json();
                capturedData.push({ url: url.substring(0, 100), data: json, time: Date.now() });
              }
            } catch (e) { /* skip */ }
          });

          const searchUrl = `https://www.nmpa.gov.cn/datasearch/home-index.html?itemId=${tableConfig.itemId}#category=ylqx`;
          console.log(`\n  NMPA ${tableType === 'domestic' ? '国产' : '进口'}: ${keyword}`);
          await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          await sleep(8000);

          const inputExists = await page.$('input[type="text"], input[type="search"], input:not([type])');
          if (inputExists) {
            await inputExists.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await sleep(300);
            await page.keyboard.type(keyword, { delay: 20 });
            await sleep(500);

            await page.evaluate(() => {
              const buttons = document.querySelectorAll('button, .search-btn, .searchBox button, input[type="button"], a.btn');
              for (const btn of buttons) {
                const text = btn.textContent?.trim() || btn.value || '';
                if (text.includes('搜索') || text.includes('查询') || text.includes('Search')) {
                  btn.click();
                  return;
                }
              }
            });

            await sleep(5000);
          } else {
            console.log(`    未找到搜索框`);
          }

          await sleep(12000);

          let allItems = [];

          for (const captured of capturedData) {
            const data = captured.data;
            const items = data?.data || data?.list || data?.rows || data?.records || data?.result || (Array.isArray(data) ? data : []);
            if (Array.isArray(items) && items.length > 0) {
              console.log(`    API响应: ${items.length}条`);
              allItems.push(...items);
            }
          }

          if (allItems.length === 0) {
            allItems.push(...capturedData.map(c => {
              const d = c.data;
              if (Array.isArray(d)) return d;
              if (Array.isArray(d?.data)) return d.data;
              if (Array.isArray(d?.list)) return d.list;
              return [];
            }).flat());
          }

          if (allItems.length === 0) {
            try {
              const textResults = await page.evaluate(() => {
                const tables = document.querySelectorAll('table');
                const items = [];
                tables.forEach(table => {
                  const rows = table.querySelectorAll('tr');
                  rows.forEach(row => {
                    const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                    if (cells.length >= 2 && cells.some(c => c.length > 2)) {
                      items.push(cells);
                    }
                  });
                });
                return items.slice(0, 200);
              });

              if (textResults.length > 0) {
                console.log(`    表格文本: ${textResults.length}行`);
                textResults.forEach(row => {
                  allItems.push({
                    CPMC: row[0] || '',
                    QYMC: row[2] || row[1] || '',
                    YXQZ: row[1] || '',
                  });
                });
              }
            } catch (e) {
              console.log(`    文本提取失败: ${e.message?.substring(0, 60)}`);
            }
          }

          if (allItems.length === 0) {
            const url = page.url();
            console.log(`    当前URL: ${url.substring(0, 80)}`);
            console.log(`    拦截到${capturedData.length}个API响应`);
            capturedData.forEach(c => {
              console.log(`      ${c.url} - ${JSON.stringify(c.data).substring(0, 80)}`);
            });
          }

          console.log(`    总计: ${allItems.length}条`);

          let keywordInserted = 0;
          for (const item of allItems) {
            const name = item.CPMC || item.cpmc || item.name || item.productName || item.product_name ||
              item.medicalDeviceName || item['产品名称'] || item.deviceName || '';
            const mfr = item.QYMC || item.qymc || item.manufacturer || item.company || item.companyName ||
              item['生产企业'] || item.manufacturerName || item.enterpriseName || '';
            const regNumber = item.YXQZ || item.yxqz || item.registrationNumber || item.regNo ||
              item['注册证号'] || item.certNo || item.certificateNumber || item.permitNumber || '';

            if (!name || name.length < 2) continue;
            const cleanName = String(name).trim();

            const category = categorizePPE(cleanName);
            if (category === '其他') continue;

            const mfrClean = String(mfr || 'Unknown').trim();

            const sessionKey = `${cleanName}|${mfrClean}`;
            if (seenInSession.has(sessionKey)) continue;
            seenInSession.add(sessionKey);

            const product = {
              name: cleanName.substring(0, 500),
              category,
              manufacturer_name: mfrClean.substring(0, 500),
              product_code: String(regNumber).substring(0, 50) || '',
              country_of_origin: 'CN',
              risk_level: determineRiskLevel(cleanName),
              data_source: `NMPA ${tableType === 'domestic' ? '国产' : '进口'}`,
              registration_authority: 'NMPA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              keywordInserted++;
              nmpaInserted++;
            }
          }

          console.log(`    ${keyword}/${tableType}: 新增${keywordInserted}条 (累计${nmpaInserted})`);
          await page.close();
        } catch (e) {
          console.log(`    ${keyword}/${tableType}: 错误 - ${e.message?.substring(0, 100)}`);
          if (page) await page.close().catch(() => {});
        }
      }
    }

    console.log(`\n  NMPA总计插入: ${nmpaInserted}`);
  } finally {
    await browser.close();
  }

  console.log(`\n=== NMPA采集完成 ===`);
  const { count: finalCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`新增产品: ${totalInserted}`);
  console.log(`新增制造商: ${totalMfrInserted}`);
  console.log(`总产品数: ${finalCount}`);
}

main().catch(console.error);
