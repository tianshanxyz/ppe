#!/usr/bin/env node
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

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
  if (/iia|class-iia|class-ii/i.test(deviceClass)) return 'medium';
  if (deviceClass === '2' || deviceClass === 'Class II' || deviceClass === 'B' || deviceClass === 'Class B' || /helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
  return 'low';
}

function parseEudamedRiskClass(code) {
  if (!code) return '';
  if (code.includes('class-iii')) return 'III';
  if (code.includes('class-iib')) return 'IIB';
  if (code.includes('class-iia')) return 'IIA';
  if (code.includes('class-i')) return 'I';
  if (code.includes('class-c')) return 'C';
  if (code.includes('class-b')) return 'B';
  if (code.includes('class-a')) return 'A';
  return code.replace('refdata.risk-class.', '');
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

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  console.log('========================================');
  console.log('全球PPE数据采集 v20 - EUDAMED API + PMDA + MFDS');
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

  // ===== PART 1: EUDAMED API (Direct HTTP) =====
  console.log('\n========================================');
  console.log('PART 1: EUDAMED API (Direct HTTP GET)');
  console.log('========================================');

  let eudamedInserted = 0;
  const eudamedKeywords = [
    'mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet',
    'FFP2', 'FFP3', 'coverall', 'gown', 'protective clothing',
    'safety glove', 'nitrile', 'safety helmet', 'earmuff',
    'breathing', 'surgical mask', 'safety shoe', 'visor',
    'protective suit', 'isolation gown', 'safety glasses',
  ];

  for (const keyword of eudamedKeywords) {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const firstPageUrl = `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?tradeName=${encodedKeyword}&pageSize=1&size=1&page=0&iso2Code=en&languageCode=en`;
      const firstPage = await httpGet(firstPageUrl);

      if (!firstPage || !firstPage.content) {
        console.log(`  ${keyword}: API无响应`);
        continue;
      }

      const totalElements = firstPage.totalElements || 0;
      const totalPages = firstPage.totalPages || 0;
      console.log(`  ${keyword}: 共${totalElements}条, ${totalPages}页`);

      if (totalElements === 0) continue;

      const maxPages = Math.min(totalPages, 100);
      let keywordInserted = 0;

      for (let page = 0; page < maxPages; page++) {
        try {
          const pageUrl = `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?tradeName=${encodedKeyword}&pageSize=300&size=300&page=${page}&iso2Code=en&languageCode=en`;
          const pageData = await httpGet(pageUrl);

          if (!pageData || !pageData.content || pageData.content.length === 0) break;

          for (const item of pageData.content) {
            const tradeName = item.tradeName || '';
            const manufacturerName = item.manufacturerName || '';
            const basicUdi = item.basicUdi || '';
            const riskClassCode = item.riskClass?.code || '';
            const primaryDi = item.primaryDi || '';
            const manufacturerSrn = item.manufacturerSrn || '';

            if (!tradeName || tradeName.length < 3) continue;

            const category = categorizePPE(tradeName);
            if (category === '其他') continue;

            let countryCode = 'EU';
            if (manufacturerSrn) {
              const srnPrefix = manufacturerSrn.split('-')[0];
              if (srnPrefix.length === 2) countryCode = srnPrefix;
            }

            const riskClass = parseEudamedRiskClass(riskClassCode);

            const product = {
              name: tradeName.substring(0, 500),
              category,
              manufacturer_name: (manufacturerName || 'Unknown').substring(0, 500),
              product_code: (basicUdi || primaryDi || '').substring(0, 50),
              country_of_origin: countryCode,
              risk_level: determineRiskLevel(tradeName, riskClass),
              data_source: 'EUDAMED API',
              registration_authority: 'EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              keywordInserted++;
              eudamedInserted++;
            }
          }

          if (pageData.content.length < 300) break;

          if (page > 0 && page % 10 === 0) {
            console.log(`    第${page}页: 累计${keywordInserted}条`);
          }

          await sleep(500);
        } catch (pageErr) {
          console.log(`    第${page}页错误: ${pageErr.message?.substring(0, 80)}`);
          await sleep(2000);
        }
      }

      console.log(`  ${keyword}: 新增${keywordInserted}条`);
      await sleep(1000);
    } catch (e) {
      console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

  // ===== PART 2: PMDA Japan (Puppeteer) =====
  console.log('\n========================================');
  console.log('PART 2: PMDA Japan');
  console.log('========================================');

  let pmdaInserted = 0;
  const pmdaKeywords = ['マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓', '保護めがね'];

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    for (const keyword of pmdaKeywords) {
      let pmdaPage;
      try {
        pmdaPage = await browser.newPage();
        await pmdaPage.setDefaultTimeout(60000);
        await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const capturedResponses = [];
        pmdaPage.on('response', async (res) => {
          const url = res.url();
          if (res.status() === 200) {
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json') || ct.includes('javascript')) {
                const text = await res.text();
                if (text.length < 500000) {
                  capturedResponses.push({ url, body: text.substring(0, 5000) });
                }
              }
            } catch (e) { /* skip */ }
          }
        });

        console.log(`\n  搜索: ${keyword}`);

        await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await sleep(5000);

        const inputExists = await pmdaPage.$('#txtName');
        if (inputExists) {
          await pmdaPage.focus('#txtName');
          await pmdaPage.keyboard.type(keyword, { delay: 30 });
          await sleep(500);
          await pmdaPage.click('input[name="btnA"]');
          console.log(`  已点击搜索按钮`);
          await sleep(15000);
        } else {
          const newInputExists = await pmdaPage.$('input[type="text"], input[type="search"]');
          if (newInputExists) {
            await newInputExists.click({ clickCount: 3 });
            await pmdaPage.keyboard.press('Backspace');
            await sleep(200);
            await pmdaPage.keyboard.type(keyword, { delay: 30 });
            await pmdaPage.keyboard.press('Enter');
            console.log(`  已在新界面搜索`);
            await sleep(15000);
          } else {
            console.log(`  未找到搜索输入框`);
            await pmdaPage.close();
            continue;
          }
        }

        let allResults = [];

        const frames = pmdaPage.frames();
        for (const frame of frames) {
          try {
            const frameResults = await frame.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              return { url: frame.url(), items: items.slice(0, 200) };
            });
            if (frameResults.items.length > 0) {
              console.log(`  Frame: ${frameResults.url.substring(0, 60)} - ${frameResults.items.length}行`);
              allResults.push(...frameResults.items);
            }
          } catch (e) { /* skip */ }
        }

        if (allResults.length === 0) {
          const bodyResults = await pmdaPage.evaluate(() => {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            return lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
            ).slice(0, 100).map(l => [l.trim().substring(0, 300)]);
          });
          allResults.push(...bodyResults);
        }

        if (allResults.length === 0) {
          for (const resp of capturedResponses) {
            if (resp.url.includes('search') || resp.url.includes('result') || resp.url.includes('kiki')) {
              console.log(`  API: ${resp.url.substring(0, 80)}`);
            }
          }
        }

        console.log(`  结果: ${allResults.length}条`);

        let keywordInserted = 0;
        for (const row of allResults) {
          const name = (row[0] || '').trim();
          const mfr = (row[2] || row[1] || '').trim();
          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他' && !/マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(name)) continue;

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
        await pmdaPage.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        if (pmdaPage) await pmdaPage.close().catch(() => {});
      }
    }

    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

    // ===== PART 3: Korean MFDS =====
    console.log('\n========================================');
    console.log('PART 3: Korean MFDS');
    console.log('========================================');

    let mfdsInserted = 0;
    const mfdsKeywords = ['마스크', '호흡보호구', '보호장갑', '보호안경', '안전모', '보호복', '안전화', '귀마개', '고글', '방호복'];

    const mfdsUrls = [
      'https://emed.mfds.go.kr/CFEBB01F01',
      'https://www.mfds.go.kr/med-info',
      'https://emed.mfds.go.kr/',
    ];

    for (const keyword of mfdsKeywords) {
      let mfdsPage;
      try {
        mfdsPage = await browser.newPage();
        await mfdsPage.setDefaultTimeout(30000);
        await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        const capturedApiData = [];
        mfdsPage.on('response', async (res) => {
          const url = res.url();
          if (res.status() === 200) {
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json')) {
                const json = await res.json();
                capturedApiData.push({ url, data: json });
              }
            } catch (e) { /* skip */ }
          }
        });

        let searchSuccess = false;

        for (const baseUrl of mfdsUrls) {
          try {
            console.log(`\n  尝试: ${baseUrl} - ${keyword}`);
            await mfdsPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await sleep(5000);

            const searchInput = await mfdsPage.$('input[type="text"], input[type="search"], input:not([type])');
            if (searchInput) {
              await searchInput.click({ clickCount: 3 });
              await mfdsPage.keyboard.press('Backspace');
              await sleep(200);
              await mfdsPage.keyboard.type(keyword, { delay: 30 });
              await mfdsPage.keyboard.press('Enter');
              await sleep(8000);
              searchSuccess = true;
              break;
            }
          } catch (e) {
            console.log(`  ${baseUrl} 失败: ${e.message?.substring(0, 60)}`);
          }
        }

        if (!searchSuccess) {
          console.log(`  ${keyword}: 所有URL都无法访问`);
          await mfdsPage.close();
          continue;
        }

        let keywordInserted = 0;

        for (const resp of capturedApiData) {
          const items = Array.isArray(resp.data) ? resp.data
            : (resp.data?.data || resp.data?.list || resp.data?.items || resp.data?.results || []);
          if (items.length > 0) {
            for (const item of items.slice(0, 100)) {
              const name = item.deviceName || item.productName || item.name || item.itemName || '';
              const mfr = item.manufacturer || item.manufacturerName || item.companyName || '';
              const deviceClass = item.deviceClass || item.classification || '';
              const regNumber = item.registrationNumber || item.productCode || item.permitNo || '';

              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                product_code: (regNumber || '').substring(0, 50),
                country_of_origin: 'KR',
                risk_level: determineRiskLevel(name, deviceClass),
                data_source: 'MFDS Korea',
                registration_authority: 'MFDS',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) {
                keywordInserted++;
                mfdsInserted++;
              }
            }
          }
        }

        if (keywordInserted === 0) {
          const bodyResults = await mfdsPage.evaluate(() => {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            return lines.filter(l =>
              /마스크|호흡|보호|안전|방호|장갑|고글|모|복|화|귀/i.test(l)
            ).slice(0, 50).map(l => [l.trim().substring(0, 300)]);
          });

          for (const row of bodyResults) {
            const name = (row[0] || '').trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他') continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: 'Unknown',
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(name),
              data_source: 'MFDS Korea',
              registration_authority: 'MFDS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'low',
            };

            if (await insertProduct(product)) {
              keywordInserted++;
              mfdsInserted++;
            }
          }
        }

        console.log(`  ${keyword}: ${keywordInserted}条`);
        await mfdsPage.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        if (mfdsPage) await mfdsPage.close().catch(() => {});
      }
    }

    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

  } finally {
    await browser.close();
  }

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
