#!/usr/bin/env node
const puppeteer = require('puppeteer');
const axios = require('axios');
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

function determineRiskLevel(name, deviceClass) {
  if (deviceClass === '3' || deviceClass === 'Class III' || deviceClass === 'C' || deviceClass === 'Class C') return 'high';
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (deviceClass === '2' || deviceClass === 'Class II' || deviceClass === 'B' || deviceClass === 'Class B' || /helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
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
  console.log('全球PPE数据深度采集 v10');
  console.log('EUDAMED API + PMDA + MFDS + 印度/沙特/菲律宾');
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

  // ===== PART 1: EUDAMED API =====
  console.log('\n========================================');
  console.log('PART 1: EUDAMED 欧盟医疗器械数据库 (API)');
  console.log('========================================');

  let eudamedInserted = 0;
  const eudamedKeywords = [
    'mask', 'respirator', 'glove', 'goggle', 'face shield',
    'helmet', 'earplug', 'safety boot', 'protective suit',
    'coverall', 'gown', 'hearing protector', 'N95', 'FFP2', 'FFP3',
    'safety glove', 'nitrile glove', 'safety helmet', 'protective clothing',
  ];

  const eudamedApiBase = 'https://ec.europa.eu/tools/eudamed/api';

  for (const keyword of eudamedKeywords) {
    let page = 0;
    let totalForKeyword = 0;
    const maxPages = 20;

    while (page < maxPages) {
      try {
        const searchPayload = {
          deviceName: keyword,
          page: page,
          size: 50,
        };

        const response = await axios.post(`${eudamedApiBase}/devices/search`, searchPayload, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Origin': 'https://ec.europa.eu',
            'Referer': 'https://ec.europa.eu/tools/eudamed/',
          },
          timeout: 30000,
          validateStatus: () => true,
        });

        if (response.status !== 200) {
          if (page === 0) console.log(`  ${keyword}: API返回 ${response.status}`);
          break;
        }

        const data = response.data;
        const devices = data.content || data.devices || data.data || [];
        const totalPages = data.totalPages || data.total_pages || 1;
        const totalElements = data.totalElements || data.total_elements || devices.length;

        if (page === 0) {
          console.log(`  ${keyword}: 共${totalElements}条, ${totalPages}页`);
        }

        if (devices.length === 0) break;

        let pageInserted = 0;
        for (const device of devices) {
          const name = device.deviceName || device.name || device.tradeName || '';
          const mfrData = device.manufacturer?.actorDataPublicView?.name?.texts || [];
          const mfrName = mfrData.find(t => t.language?.code === 'en')?.text
            || mfrData[0]?.text
            || device.manufacturerName
            || '';
          const basicUdi = device.basicUdi?.code || '';
          const riskClass = device.riskClass?.code || '';
          const countryCode = device.manufacturer?.actorDataPublicView?.country?.iso2Code || 'EU';

          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfrName || 'Unknown').substring(0, 500),
            product_code: basicUdi.substring(0, 50),
            country_of_origin: countryCode || 'EU',
            risk_level: determineRiskLevel(name, riskClass),
            data_source: 'EUDAMED API',
            registration_authority: 'EUDAMED',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) {
            pageInserted++;
            eudamedInserted++;
            totalForKeyword++;
          }
        }

        if (pageInserted > 0) console.log(`    第${page + 1}页: ${pageInserted}条`);

        if (page >= totalPages - 1) break;
        page++;
        await sleep(1000);
      } catch (e) {
        if (page === 0) console.log(`  ${keyword}: API错误 - ${e.message?.substring(0, 100)}`);
        break;
      }
    }

    if (totalForKeyword > 0) console.log(`  ${keyword} 总计: ${totalForKeyword}条`);
    await sleep(500);
  }

  // Try alternative EUDAMED API endpoint
  if (eudamedInserted === 0) {
    console.log('\n  主API未返回数据，尝试备用端点...');

    for (const keyword of eudamedKeywords.slice(0, 8)) {
      try {
        const altUrls = [
          `${eudamedApiBase}/udi-di/search?deviceName=${encodeURIComponent(keyword)}&page=0&size=50`,
          `${eudamedApiBase}/devices?deviceName=${encodeURIComponent(keyword)}&page=0&size=50`,
        ];

        for (const url of altUrls) {
          try {
            const resp = await axios.get(url, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': 'https://ec.europa.eu/tools/eudamed/',
              },
              timeout: 20000,
              validateStatus: () => true,
            });

            if (resp.status === 200 && resp.data) {
              const items = resp.data.content || resp.data.devices || resp.data.data || [];
              if (Array.isArray(resp.data) && resp.data.length > 0) {
                items.push(...resp.data);
              }

              if (items.length > 0) {
                console.log(`  ${keyword}: 备用API返回 ${items.length} 条`);
                let inserted = 0;
                for (const item of items.slice(0, 100)) {
                  const name = item.deviceName || item.name || item.tradeName || '';
                  const mfr = item.manufacturerName || '';
                  if (!name || name.length < 3) continue;

                  const category = categorizePPE(name);
                  if (category === '其他') continue;

                  const product = {
                    name: name.substring(0, 500),
                    category,
                    manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                    country_of_origin: 'EU',
                    risk_level: determineRiskLevel(name),
                    data_source: 'EUDAMED API',
                    registration_authority: 'EUDAMED',
                    last_verified: new Date().toISOString().split('T')[0],
                    data_confidence_level: 'high',
                  };

                  if (await insertProduct(product)) {
                    inserted++;
                    eudamedInserted++;
                  }
                }
                if (inserted > 0) console.log(`    插入: ${inserted}条`);
                break;
              }
            }
          } catch (e) { /* skip */ }
        }
        await sleep(500);
      } catch (e) { /* skip */ }
    }
  }

  // If API still failed, use Puppeteer with network interception
  if (eudamedInserted === 0) {
    console.log('\n  API均未返回数据，使用Puppeteer网络拦截...');
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        protocolTimeout: 300000,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setDefaultTimeout(60000);
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const interceptedApiData = [];
      page.on('response', async (res) => {
        const url = res.url();
        if (url.includes('eudamed') && url.includes('device') && res.status() === 200) {
          try {
            const ct = res.headers()['content-type'] || '';
            if (ct.includes('json')) {
              const json = await res.json();
              interceptedApiData.push({ url, data: json });
            }
          } catch (e) { /* skip */ }
        }
      });

      await page.goto('https://ec.europa.eu/tools/eudamed/#/screen/search-device', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await sleep(10000);

      console.log(`  页面标题: ${await page.title()}`);

      for (const keyword of eudamedKeywords.slice(0, 6)) {
        try {
          const input = await page.$('input[type="text"], input[type="search"], input:not([type])');
          if (input) {
            await input.click({ clickCount: 3 });
            await page.keyboard.type(keyword, { delay: 50 });
            await sleep(500);
            await page.keyboard.press('Enter');
            await sleep(10000);
          }
        } catch (e) {
          console.log(`  ${keyword}: 搜索错误 - ${e.message?.substring(0, 80)}`);
        }
      }

      console.log(`  拦截到 ${interceptedApiData.length} 个API响应`);
      for (const resp of interceptedApiData) {
        const items = Array.isArray(resp.data) ? resp.data
          : (resp.data?.content || resp.data?.devices || resp.data?.data || []);
        if (items.length > 0) {
          console.log(`  API: ${resp.url.substring(0, 80)} - ${items.length}条`);
          for (const item of items.slice(0, 200)) {
            const name = item.deviceName || item.name || item.tradeName || '';
            const mfr = item.manufacturerName || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              country_of_origin: 'EU',
              risk_level: determineRiskLevel(name),
              data_source: 'EUDAMED',
              registration_authority: 'EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) eudamedInserted++;
          }
        }
      }

      await browser.close();
    } catch (e) {
      console.log(`  Puppeteer EUDAMED失败: ${e.message?.substring(0, 150)}`);
      if (browser) await browser.close().catch(() => {});
    }
  }

  console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

  // ===== PART 2: PMDA Japan =====
  console.log('\n========================================');
  console.log('PART 2: PMDA Japan');
  console.log('========================================');

  let pmdaInserted = 0;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      protocolTimeout: 300000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(90000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const pmdaApiData = [];
    pmdaPage.on('response', async (res) => {
      const url = res.url();
      if (url.includes('pmda') && res.status() === 200) {
        try {
          const ct = res.headers()['content-type'] || '';
          if (ct.includes('json')) {
            const json = await res.json();
            pmdaApiData.push({ url, data: json });
          }
        } catch (e) { /* skip */ }
      }
    });

    console.log('  访问PMDA搜索页面...');
    await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await sleep(8000);

    const pageInfo = await pmdaPage.evaluate(() => {
      const info = { inputs: [], buttons: [], forms: [] };
      document.querySelectorAll('input[type="text"], input:not([type]), textarea').forEach(i => {
        if (i.offsetParent !== null) {
          const parent = i.closest('tr, div, li, dd, th');
          const label = parent ? parent.querySelector('label, th, .label, span') : null;
          info.inputs.push({
            id: i.id, name: i.name, placeholder: i.placeholder,
            label: label ? label.textContent.trim().substring(0, 80) : '',
            size: i.size, type: i.type,
          });
        }
      });
      document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn').forEach(b => {
        if (b.offsetParent !== null) {
          info.buttons.push({
            id: b.id, name: b.name, type: b.type,
            value: b.value, text: b.textContent?.trim()?.substring(0, 50),
            href: b.href || '',
          });
        }
      });
      document.querySelectorAll('form').forEach(f => {
        info.forms.push({ id: f.id, action: f.action, method: f.method });
      });
      return info;
    });

    console.log(`  输入框: ${pageInfo.inputs.length}, 按钮: ${pageInfo.buttons.length}, 表单: ${pageInfo.forms.length}`);
    pageInfo.inputs.forEach(i => console.log(`    input: id="${i.id}" name="${i.name}" label="${i.label}"`));
    pageInfo.buttons.forEach(b => console.log(`    button: id="${b.id}" text="${b.text}" value="${b.value}"`));

    const targetInput = pageInfo.inputs.find(i =>
      /販売名|一般的名称|名称|search|keyword|name/i.test(i.label || i.name || i.id || '')
    ) || pageInfo.inputs[0];

    if (targetInput) {
      console.log(`  搜索框: id="${targetInput.id}" name="${targetInput.name}" label="${targetInput.label}"`);

      const keywords = [
        'マスク', '防塵マスク', '呼吸用保護具', '保護手袋',
        'ゴーグル', 'ヘルメット', '安全靴', '保護衣',
        '防護服', '耳栓', '防毒マスク', '面体',
      ];

      for (const keyword of keywords) {
        try {
          console.log(`\n  搜索: ${keyword}`);

          await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
          await sleep(3000);

          const inputSel = targetInput.id ? `#${targetInput.id}` : `[name="${targetInput.name}"]`;
          await pmdaPage.waitForSelector(inputSel, { timeout: 10000 });
          await pmdaPage.click(inputSel, { clickCount: 3 });
          await pmdaPage.keyboard.type(keyword, { delay: 30 });
          await sleep(500);

          const submitBtn = pageInfo.buttons.find(b => /検索|submit|search/i.test(b.value || b.text || b.type || ''));
          if (submitBtn) {
            const btnSel = submitBtn.id ? `#${submitBtn.id}`
              : (submitBtn.name ? `[name="${submitBtn.name}"]` : 'input[type="submit"]');
            try {
              await pmdaPage.click(btnSel);
            } catch (e) {
              await pmdaPage.keyboard.press('Enter');
            }
          } else {
            await pmdaPage.keyboard.press('Enter');
          }

          await sleep(12000);

          const firstPageResults = await pmdaPage.evaluate(() => {
            const items = [];
            document.querySelectorAll('table tbody tr, table tr').forEach(row => {
              const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
              if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
            });
            if (items.length === 0) {
              const body = document.body.innerText;
              const lines = body.split('\n').filter(l => l.trim().length > 5);
              const ppeLines = lines.filter(l =>
                /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
              );
              ppeLines.slice(0, 30).forEach(line => items.push([line.trim().substring(0, 300)]));
            }
            return items.slice(0, 100);
          });

          console.log(`  第1页结果: ${firstPageResults.length} 行`);

          let keywordInserted = 0;
          for (const row of firstPageResults) {
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

            if (await insertProduct(product)) {
              keywordInserted++;
              pmdaInserted++;
            }
          }

          // Pagination: try clicking next page links
          for (let pageNum = 2; pageNum <= 10; pageNum++) {
            try {
              const hasNext = await pmdaPage.evaluate((pn) => {
                const nextLinks = document.querySelectorAll('a, button, span');
                for (const link of nextLinks) {
                  const text = link.textContent?.trim() || '';
                  if (text === String(pn) || text.includes('次') || text.includes('next')) {
                    link.click();
                    return true;
                  }
                }
                return false;
              }, pageNum);

              if (!hasNext) break;
              await sleep(8000);

              const pageResults = await pmdaPage.evaluate(() => {
                const items = [];
                document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
                });
                return items.slice(0, 100);
              });

              if (pageResults.length === 0) break;

              let pageInserted = 0;
              for (const row of pageResults) {
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

                if (await insertProduct(product)) {
                  pageInserted++;
                  keywordInserted++;
                  pmdaInserted++;
                }
              }
              if (pageInserted > 0) console.log(`  第${pageNum}页: ${pageInserted}条`);
            } catch (e) {
              break;
            }
          }

          console.log(`  ${keyword}: ${keywordInserted}条`);
        } catch (e) {
          console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        }
      }
    }

    // Check intercepted PMDA API data
    console.log(`\n  拦截到 ${pmdaApiData.length} 个PMDA API响应`);
    for (const resp of pmdaApiData) {
      const items = Array.isArray(resp.data) ? resp.data : (resp.data?.data || resp.data?.results || []);
      if (items.length > 0) {
        console.log(`  API: ${resp.url.substring(0, 80)} - ${items.length}条`);
        for (const item of items.slice(0, 100)) {
          const name = item.deviceName || item.name || item.productName || '';
          const mfr = item.manufacturer || item.manufacturerName || '';
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            country_of_origin: 'JP',
            risk_level: determineRiskLevel(name),
            data_source: 'PMDA API',
            registration_authority: 'PMDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) pmdaInserted++;
        }
      }
    }

    await pmdaPage.close();
  } catch (e) {
    console.log(`  PMDA失败: ${e.message?.substring(0, 200)}`);
  }

  console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

  // ===== PART 3: Korea MFDS =====
  console.log('\n========================================');
  console.log('PART 3: Korea MFDS');
  console.log('========================================');

  let mfdsInserted = 0;

  // Try MFDS API first
  const mfdsKeywords = ['마스크', '보호구', '장갑', '고글', '안전모', '보호복', '호흡보호구', '방호복', '안전화', '귀마개'];
  const mfdsApiUrls = [
    'https://emedi.mfds.go.kr/api/medicalDevice',
    'https://emedi.mfds.go.kr/CSBHA02/getList',
  ];

  for (const keyword of mfdsKeywords) {
    try {
      const searchUrl = `https://emedi.mfds.go.kr/CSBHA02/getList?searchWord=${encodeURIComponent(keyword)}&pageNo=1&pageSize=50`;
      const resp = await axios.get(searchUrl, {
        headers: {
          'Accept': 'application/json, text/html, */*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://emedi.mfds.go.kr/',
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (resp.status === 200) {
        const items = Array.isArray(resp.data) ? resp.data
          : (resp.data?.list || resp.data?.data || resp.data?.items || []);
        if (items.length > 0) {
          console.log(`  ${keyword}: API返回 ${items.length}条`);
          for (const item of items.slice(0, 50)) {
            const name = item.productName || item.deviceName || item.name || '';
            const mfr = item.manufacturer || item.manufacturerName || '';
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) mfdsInserted++;
          }
        }
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }

  // Fallback: use Puppeteer for MFDS
  if (mfdsInserted === 0 && browser) {
    console.log('\n  API未返回数据，使用Puppeteer...');
    const mfdsPage = await browser.newPage();
    await mfdsPage.setDefaultTimeout(30000);
    await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const mfdsApiData = [];
    mfdsPage.on('response', async (res) => {
      const url = res.url();
      if ((url.includes('mfds') || url.includes('emedi')) && res.status() === 200) {
        try {
          const ct = res.headers()['content-type'] || '';
          if (ct.includes('json')) {
            const json = await res.json();
            mfdsApiData.push({ url, data: json });
          }
        } catch (e) { /* skip */ }
      }
    });

    const mfdsUrls = [
      'https://emedi.mfds.go.kr/',
      'https://nedrug.mfds.go.kr/searchDrug?searchYn=true&SearchClass=5&SearchWord=마스크',
      'https://www.mfds.go.kr/eng/brd/m_41/list.do',
    ];

    for (const url of mfdsUrls) {
      try {
        console.log(`  尝试: ${url}`);
        await mfdsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(5000);

        const tableData = await mfdsPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tbody tr, table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });
          return items.slice(0, 100);
        });

        if (tableData.length > 0) {
          console.log(`  表格数据: ${tableData.length} 行`);

          for (const row of tableData) {
            const name = (row[0] || row[1] || '').trim();
            const mfr = (row[2] || row[1] || '').trim();
            if (!name || name.length < 3) continue;
            if (!/mask|respirat|glove|goggle|helmet|protect|safety|boot|gown|coverall|suit|shield|마스크|장갑|고글|안전|보호|방호|호흡/i.test(name)) continue;

            const category = categorizePPE(name);
            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: mfr.substring(0, 500) || 'Unknown',
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) mfdsInserted++;
          }
        }

        if (mfdsInserted > 0) break;
      } catch (e) {
        console.log(`  失败: ${e.message?.substring(0, 100)}`);
      }
    }

    // Check intercepted MFDS API data
    console.log(`  拦截到 ${mfdsApiData.length} 个MFDS API响应`);
    for (const resp of mfdsApiData) {
      const items = Array.isArray(resp.data) ? resp.data
        : (resp.data?.list || resp.data?.data || resp.data?.items || []);
      if (items.length > 0) {
        console.log(`  API: ${resp.url.substring(0, 80)} - ${items.length}条`);
        for (const item of items.slice(0, 100)) {
          const name = item.productName || item.deviceName || item.name || '';
          const mfr = item.manufacturer || item.manufacturerName || '';
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            country_of_origin: 'KR',
            risk_level: determineRiskLevel(name),
            data_source: 'MFDS Korea API',
            registration_authority: 'MFDS',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) mfdsInserted++;
        }
      }
    }

    await mfdsPage.close();
  }

  console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

  // ===== PART 4: India CDSCO =====
  console.log('\n========================================');
  console.log('PART 4: 印度 CDSCO');
  console.log('========================================');

  let indiaInserted = 0;

  // Try CDSCO direct API
  const cdscoKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'safety boot', 'protective suit', 'coverall', 'gown', 'N95', 'hearing protection'];

  for (const keyword of cdscoKeywords) {
    try {
      const cdscoUrl = `https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostic/Medical-Device-Diagnostic?searchKeyword=${encodeURIComponent(keyword)}`;
      const resp = await axios.get(cdscoUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (resp.status === 200 && resp.data && typeof resp.data === 'string') {
        const html = resp.data;
        const deviceMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        let found = 0;
        for (const match of deviceMatches) {
          const cells = match.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
          const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
          const name = cellTexts[0] || '';
          const mfr = cellTexts[1] || '';
          if (!name || name.length < 3) continue;
          if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe/i.test(name.toLowerCase())) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            country_of_origin: 'IN',
            risk_level: determineRiskLevel(name),
            data_source: 'CDSCO India',
            registration_authority: 'CDSCO',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'medium',
          };

          if (await insertProduct(product)) {
            indiaInserted++;
            found++;
          }
        }
        if (found > 0) console.log(`  ${keyword}: ${found}条`);
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }

  // Try Pure Global AI for India
  if (indiaInserted === 0) {
    console.log('\n  CDSCO直接访问失败，尝试Pure Global AI...');
    try {
      for (const keyword of cdscoKeywords) {
        const pgUrl = `https://agent.pureglobal.ai/api/devices?search=${encodeURIComponent(keyword)}&country=india&page=1&limit=50`;
        const resp = await axios.get(pgUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.pureglobal.ai/india/medical-device/database',
          },
          timeout: 15000,
          validateStatus: () => true,
        });

        if (resp.status === 200 && resp.data) {
          const items = Array.isArray(resp.data) ? resp.data
            : (resp.data?.devices || resp.data?.data || resp.data?.results || []);
          if (items.length > 0) {
            let found = 0;
            for (const item of items.slice(0, 50)) {
              const name = item.deviceName || item.name || item.productName || '';
              const mfr = item.manufacturer || item.manufacturerName || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                country_of_origin: 'IN',
                risk_level: determineRiskLevel(name, item.deviceClass),
                data_source: 'Pure Global AI - India',
                registration_authority: 'CDSCO',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) {
                indiaInserted++;
                found++;
              }
            }
            if (found > 0) console.log(`  ${keyword}: ${found}条`);
          }
        }
        await sleep(300);
      }
    } catch (e) {
      console.log(`  Pure Global AI India失败: ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n  印度总计插入: ${indiaInserted}`);

  // ===== PART 5: Saudi Arabia SFDA =====
  console.log('\n========================================');
  console.log('PART 5: 沙特 SFDA');
  console.log('========================================');

  let saudiInserted = 0;

  // Try SFDA medical equipment list API
  const sfdaKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'safety boot', 'protective suit', 'coverall', 'gown', 'N95', 'PPE'];

  for (const keyword of sfdaKeywords) {
    try {
      const sfdaApiUrl = `https://www.sfda.gov.sa/en/medical-equipment-list?keyword=${encodeURIComponent(keyword)}`;
      const resp = await axios.get(sfdaApiUrl, {
        headers: {
          'Accept': 'text/html, application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (resp.status === 200 && resp.data) {
        if (typeof resp.data === 'object' && !Array.isArray(resp.data)) {
          const items = resp.data.data || resp.data.devices || resp.data.results || resp.data.list || [];
          if (items.length > 0) {
            let found = 0;
            for (const item of items.slice(0, 50)) {
              const name = item.brandName || item.deviceName || item.name || '';
              const mfr = item.manufacturerName || item.manufacturer || '';
              const classification = item.classification || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                country_of_origin: 'SA',
                risk_level: determineRiskLevel(name, classification),
                data_source: 'SFDA Saudi Arabia',
                registration_authority: 'SFDA',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) {
                saudiInserted++;
                found++;
              }
            }
            if (found > 0) console.log(`  ${keyword}: ${found}条`);
          }
        } else if (typeof resp.data === 'string') {
          const html = resp.data;
          const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          let found = 0;
          for (const match of rowMatches) {
            const cells = match.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
            const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
            const name = cellTexts[0] || '';
            const mfr = cellTexts[2] || cellTexts[1] || '';
            if (!name || name.length < 3) continue;
            if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe/i.test(name.toLowerCase())) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: (mfr || 'Unknown').substring(0, 500),
              country_of_origin: 'SA',
              risk_level: determineRiskLevel(name),
              data_source: 'SFDA Saudi Arabia',
              registration_authority: 'SFDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              saudiInserted++;
              found++;
            }
          }
          if (found > 0) console.log(`  ${keyword}: ${found}条`);
        }
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }

  // Try Pure Global AI for Saudi
  if (saudiInserted === 0) {
    console.log('\n  SFDA直接访问失败，尝试Pure Global AI...');
    try {
      for (const keyword of sfdaKeywords.slice(0, 6)) {
        const pgUrl = `https://agent.pureglobal.ai/api/devices?search=${encodeURIComponent(keyword)}&country=saudi-arabia&page=1&limit=50`;
        const resp = await axios.get(pgUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.pureglobal.ai/saudi-arabia/medical-device/database',
          },
          timeout: 15000,
          validateStatus: () => true,
        });

        if (resp.status === 200 && resp.data) {
          const items = Array.isArray(resp.data) ? resp.data
            : (resp.data?.devices || resp.data?.data || resp.data?.results || []);
          if (items.length > 0) {
            let found = 0;
            for (const item of items.slice(0, 50)) {
              const name = item.deviceName || item.name || item.productName || '';
              const mfr = item.manufacturer || item.manufacturerName || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                country_of_origin: 'SA',
                risk_level: determineRiskLevel(name, item.deviceClass),
                data_source: 'Pure Global AI - Saudi Arabia',
                registration_authority: 'SFDA',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) {
                saudiInserted++;
                found++;
              }
            }
            if (found > 0) console.log(`  ${keyword}: ${found}条`);
          }
        }
        await sleep(300);
      }
    } catch (e) {
      console.log(`  Pure Global AI Saudi失败: ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n  沙特总计插入: ${saudiInserted}`);

  // ===== PART 6: Philippines FDA =====
  console.log('\n========================================');
  console.log('PART 6: 菲律宾 FDA');
  console.log('========================================');

  let phInserted = 0;

  // Try Philippines FDA verification site
  const phKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'safety boot', 'protective suit', 'coverall', 'gown', 'N95', 'PPE'];

  for (const keyword of phKeywords) {
    try {
      const phUrl = `https://verification.fda.gov.ph/medical_deviceslist.php?search=${encodeURIComponent(keyword)}`;
      const resp = await axios.get(phUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (resp.status === 200 && resp.data && typeof resp.data === 'string') {
        const html = resp.data;
        const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        let found = 0;
        for (const match of rowMatches) {
          const cells = match.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
          const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
          const name = cellTexts[0] || cellTexts[1] || '';
          const mfr = cellTexts[2] || cellTexts[1] || '';
          if (!name || name.length < 3) continue;
          if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe/i.test(name.toLowerCase())) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            country_of_origin: 'PH',
            risk_level: determineRiskLevel(name),
            data_source: 'FDA Philippines',
            registration_authority: 'FDA Philippines',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'medium',
          };

          if (await insertProduct(product)) {
            phInserted++;
            found++;
          }
        }
        if (found > 0) console.log(`  ${keyword}: ${found}条`);
      }
      await sleep(500);
    } catch (e) {
      // skip
    }
  }

  // Try Pure Global AI for Philippines
  if (phInserted === 0) {
    console.log('\n  FDA Philippines直接访问失败，尝试Pure Global AI...');
    try {
      for (const keyword of phKeywords.slice(0, 6)) {
        const pgUrl = `https://agent.pureglobal.ai/api/devices?search=${encodeURIComponent(keyword)}&country=philippines&page=1&limit=50`;
        const resp = await axios.get(pgUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.pureglobal.ai/philippines/medical-device/database',
          },
          timeout: 15000,
          validateStatus: () => true,
        });

        if (resp.status === 200 && resp.data) {
          const items = Array.isArray(resp.data) ? resp.data
            : (resp.data?.devices || resp.data?.data || resp.data?.results || []);
          if (items.length > 0) {
            let found = 0;
            for (const item of items.slice(0, 50)) {
              const name = item.deviceName || item.name || item.productName || '';
              const mfr = item.manufacturer || item.manufacturerName || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                country_of_origin: 'PH',
                risk_level: determineRiskLevel(name, item.deviceClass),
                data_source: 'Pure Global AI - Philippines',
                registration_authority: 'FDA Philippines',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) {
                phInserted++;
                found++;
              }
            }
            if (found > 0) console.log(`  ${keyword}: ${found}条`);
          }
        }
        await sleep(300);
      }
    } catch (e) {
      console.log(`  Pure Global AI Philippines失败: ${e.message?.substring(0, 100)}`);
    }
  }

  // Fallback: Use Puppeteer for Philippines
  if (phInserted === 0 && browser) {
    console.log('\n  使用Puppeteer访问菲律宾FDA...');
    try {
      const phPage = await browser.newPage();
      await phPage.setDefaultTimeout(30000);
      await phPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      await phPage.goto('https://verification.fda.gov.ph/medical_deviceslist.php', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(5000);

      for (const keyword of phKeywords.slice(0, 4)) {
        try {
          const searchInput = await phPage.$('input[type="text"], input[type="search"], input:not([type])');
          if (searchInput) {
            await searchInput.click({ clickCount: 3 });
            await phPage.keyboard.type(keyword, { delay: 30 });
            await phPage.keyboard.press('Enter');
            await sleep(8000);

            const results = await phPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              return items.slice(0, 50);
            });

            let found = 0;
            for (const row of results) {
              const name = (row[0] || row[1] || '').trim();
              const mfr = (row[2] || row[1] || '').trim();
              if (!name || name.length < 3) continue;
              if (!/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|ppe/i.test(name.toLowerCase())) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                country_of_origin: 'PH',
                risk_level: determineRiskLevel(name),
                data_source: 'FDA Philippines',
                registration_authority: 'FDA Philippines',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) {
                phInserted++;
                found++;
              }
            }
            if (found > 0) console.log(`  ${keyword}: ${found}条`);
          }
        } catch (e) {
          // skip
        }
      }

      await phPage.close();
    } catch (e) {
      console.log(`  Puppeteer Philippines失败: ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n  菲律宾总计插入: ${phInserted}`);

  // Close browser
  if (browser) {
    await browser.close().catch(() => {});
  }

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  EUDAMED: ${eudamedInserted}`);
  console.log(`  PMDA Japan: ${pmdaInserted}`);
  console.log(`  MFDS Korea: ${mfdsInserted}`);
  console.log(`  印度 CDSCO: ${indiaInserted}`);
  console.log(`  沙特 SFDA: ${saudiInserted}`);
  console.log(`  菲律宾 FDA: ${phInserted}`);
  console.log(`  ---`);
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
