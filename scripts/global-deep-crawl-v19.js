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
  console.log('全球PPE数据采集 v19 - Puppeteer Pure Global AI');
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
    // ===== PART 1: Pure Global AI via Puppeteer =====
    console.log('\n========================================');
    console.log('PART 1: Pure Global AI (Puppeteer)');
    console.log('========================================');

    const pgCountries = [
      { name: '菲律宾', cc: 'PH', auth: 'FDA Philippines', slug: 'philippines' },
      { name: '印度', cc: 'IN', auth: 'CDSCO', slug: 'india' },
      { name: '沙特', cc: 'SA', auth: 'SFDA', slug: 'saudi-arabia' },
      { name: '韩国', cc: 'KR', auth: 'MFDS', slug: 'south-korea' },
      { name: '日本', cc: 'JP', auth: 'PMDA', slug: 'japan' },
    ];

    const ppeTerms = ['mask', 'respirator', 'N95', 'glove', 'goggle', 'face shield', 'helmet', 'safety boot', 'protective suit', 'coverall', 'gown', 'PPE', 'earplug', 'FFP2', 'FFP3'];

    let pgTotalInserted = 0;

    for (const country of pgCountries) {
      console.log(`\n  === ${country.name} ===`);
      let countryInserted = 0;

      let pgPage;
      try {
        pgPage = await browser.newPage();
        await pgPage.setDefaultTimeout(30000);
        await pgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const pgApiData = [];
        pgPage.on('response', async (res) => {
          const url = res.url();
          if (res.status() === 200) {
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json') && url.includes('api')) {
                const json = await res.json();
                pgApiData.push({ url, data: json });
              }
            } catch (e) { /* skip */ }
          }
        });

        // Visit Pure Global AI country page
        const pgUrl = `https://www.pureglobal.ai/${country.slug}/medical-device/database`;
        console.log(`  访问: ${pgUrl}`);
        await pgPage.goto(pgUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(8000);

        // Search for each PPE term
        for (const term of ppeTerms) {
          try {
            // Clear previous API data
            pgApiData.length = 0;

            // Find and fill search input
            const searchInput = await pgPage.$('input[type="text"], input[type="search"], input:not([type])');
            if (searchInput) {
              await searchInput.click({ clickCount: 3 });
              await pgPage.keyboard.press('Backspace');
              await sleep(200);
              await pgPage.keyboard.type(term, { delay: 30 });
              await pgPage.keyboard.press('Enter');
              await sleep(5000);
            }

            // Process intercepted API data
            for (const resp of pgApiData) {
              const items = Array.isArray(resp.data) ? resp.data
                : (resp.data?.data || resp.data?.devices || resp.data?.results || []);
              if (items.length > 0) {
                let termInserted = 0;
                for (const item of items.slice(0, 50)) {
                  const name = item.deviceName || item.name || item.productName || item.brandName || '';
                  const mfr = item.manufacturer || item.manufacturerName || '';
                  const deviceClass = item.deviceClass || item.classification || '';
                  const regNumber = item.registrationNumber || item.productCode || '';

                  if (!name || name.length < 3) continue;

                  const category = categorizePPE(name);
                  if (category === '其他') continue;

                  const product = {
                    name: name.substring(0, 500),
                    category,
                    manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                    product_code: (regNumber || '').substring(0, 50),
                    country_of_origin: country.cc,
                    risk_level: determineRiskLevel(name, deviceClass),
                    data_source: `Pure Global AI - ${country.name}`,
                    registration_authority: country.auth,
                    last_verified: new Date().toISOString().split('T')[0],
                    data_confidence_level: 'medium',
                  };

                  if (await insertProduct(product)) {
                    termInserted++;
                    countryInserted++;
                    pgTotalInserted++;
                  }
                }
                if (termInserted > 0) console.log(`  ${term}: ${termInserted}条 (API: ${resp.url.substring(0, 60)})`);
              }
            }
          } catch (e) {
            // skip
          }
        }

        await pgPage.close();
      } catch (e) {
        console.log(`  ${country.name}失败: ${e.message?.substring(0, 100)}`);
        if (pgPage) await pgPage.close().catch(() => {});
      }

      console.log(`  ${country.name}总计插入: ${countryInserted}`);
    }

    console.log(`\n  Pure Global AI总计插入: ${pgTotalInserted}`);

    // ===== PART 2: EUDAMED =====
    console.log('\n========================================');
    console.log('PART 2: EUDAMED');
    console.log('========================================');

    let eudamedInserted = 0;

    const eudamedKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'N95', 'FFP2', 'coverall', 'gown'];

    for (const keyword of eudamedKeywords) {
      let eudamedPage;
      try {
        eudamedPage = await browser.newPage();
        await eudamedPage.setDefaultTimeout(60000);
        await eudamedPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const capturedResponses = [];
        eudamedPage.on('response', async (res) => {
          const url = res.url();
          if (res.status() === 200) {
            try {
              const ct = res.headers()['content-type'] || '';
              if (ct.includes('json')) {
                const json = await res.json();
                capturedResponses.push({ url, data: json });
              }
            } catch (e) { /* skip */ }
          }
        });

        console.log(`\n  搜索: ${keyword}`);

        await eudamedPage.goto('https://ec.europa.eu/tools/eudamed/#/screen/search-device', {
          waitUntil: 'networkidle2',
          timeout: 90000,
        });
        await sleep(15000);

        // Type search term
        await eudamedPage.focus('#name');
        await eudamedPage.keyboard.type(keyword, { delay: 80 });
        await sleep(500);

        // Click Search
        await eudamedPage.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent?.trim() === 'Search') {
              btn.click();
              return;
            }
          }
        });

        await sleep(15000);

        // Process API responses
        const deviceResponses = capturedResponses.filter(r =>
          r.url.includes('device') &&
          !r.url.includes('referenceValues') &&
          !r.url.includes('configuration') &&
          !r.url.includes('nomenclature')
        );

        for (const resp of deviceResponses) {
          const data = resp.data;
          const items = Array.isArray(data) ? data
            : (data?.content || data?.devices || data?.data || data?.results || []);
          if (items.length > 0) {
            console.log(`  API: ${resp.url.substring(0, 120)} - ${items.length}条`);
            for (const item of items.slice(0, 200)) {
              const name = item.deviceName || item.name || item.tradeName || '';
              const mfrTexts = item.manufacturer?.actorDataPublicView?.name?.texts || [];
              const mfr = mfrTexts.find(t => t.language?.code === 'en')?.text
                || mfrTexts[0]?.text
                || item.manufacturerName || '';
              const basicUdi = item.basicUdi?.code || '';
              const riskClass = item.riskClass?.code || '';
              const countryCode = item.manufacturer?.actorDataPublicView?.country?.iso2Code || 'EU';

              if (!name || name.length < 3) continue;
              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                product_code: basicUdi.substring(0, 50),
                country_of_origin: countryCode || 'EU',
                risk_level: determineRiskLevel(name, riskClass),
                data_source: 'EUDAMED API',
                registration_authority: 'EUDAMED',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) eudamedInserted++;
            }
          }
        }

        // Log all API URLs
        console.log(`  捕获API: ${capturedResponses.length}, 设备API: ${deviceResponses.length}`);

        await eudamedPage.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 100)}`);
        if (eudamedPage) await eudamedPage.close().catch(() => {});
      }
    }

    console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

    // ===== PART 3: PMDA Japan =====
    console.log('\n========================================');
    console.log('PART 3: PMDA Japan');
    console.log('========================================');

    let pmdaInserted = 0;
    const pmdaKeywords = ['マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服', '耳栓'];

    for (const keyword of pmdaKeywords) {
      let pmdaPage;
      try {
        pmdaPage = await browser.newPage();
        await pmdaPage.setDefaultTimeout(90000);
        await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        console.log(`\n  搜索: ${keyword}`);

        await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await sleep(5000);

        // Fill search input
        await pmdaPage.focus('#txtName');
        await pmdaPage.keyboard.type(keyword, { delay: 30 });
        await sleep(500);

        // Click the search button: input[name="btnA"]
        await pmdaPage.click('input[name="btnA"]');
        console.log(`  已点击btnA`);
        await sleep(15000);

        // Check for iframes (PMDA may use frames)
        const frames = pmdaPage.frames();
        console.log(`  Frames: ${frames.length}`);

        let allResults = [];

        // Check main frame
        const mainResults = await pmdaPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });
          return items.slice(0, 100);
        });
        allResults.push(...mainResults);

        // Check all frames
        for (const frame of frames) {
          try {
            const frameResults = await frame.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              return { url: frame.url(), items: items.slice(0, 100) };
            });
            if (frameResults.items.length > 0) {
              console.log(`  Frame: ${frameResults.url.substring(0, 60)} - ${frameResults.items.length}行`);
              allResults.push(...frameResults.items);
            }
          } catch (e) { /* skip */ }
        }

        // If no table results, try body text
        if (allResults.length === 0) {
          const bodyResults = await pmdaPage.evaluate(() => {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            return lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
            ).slice(0, 50).map(l => [l.trim().substring(0, 300)]);
          });
          allResults.push(...bodyResults);
        }

        console.log(`  结果: ${allResults.length} 条`);

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
