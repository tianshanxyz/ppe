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
  console.log('全球PPE数据采集 v18 - Pure Global AI + PMDA修复');
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

  // ===== PART 1: Pure Global AI API - All Countries =====
  console.log('\n========================================');
  console.log('PART 1: Pure Global AI API (所有国家)');
  console.log('========================================');

  const pgCountries = [
    { name: '菲律宾', cc: 'PH', auth: 'FDA Philippines', slug: 'philippines', searchSlug: 'philippines' },
    { name: '印度', cc: 'IN', auth: 'CDSCO', slug: 'india', searchSlug: 'india' },
    { name: '沙特', cc: 'SA', auth: 'SFDA', slug: 'saudi-arabia', searchSlug: 'saudi-arabia' },
    { name: '韩国', cc: 'KR', auth: 'MFDS', slug: 'south-korea', searchSlug: 'south-korea' },
    { name: '日本', cc: 'JP', auth: 'PMDA', slug: 'japan', searchSlug: 'japan' },
  ];

  const ppeTerms = ['mask', 'respirator', 'N95', 'glove', 'goggle', 'face shield', 'helmet', 'safety boot', 'protective suit', 'coverall', 'gown', 'PPE', 'earplug', 'FFP2', 'FFP3', 'safety helmet', 'nitrile glove'];

  let pgTotalInserted = 0;

  for (const country of pgCountries) {
    console.log(`\n  === ${country.name} ===`);
    let countryInserted = 0;

    for (const term of ppeTerms) {
      try {
        let offset = 0;
        const limit = 50;
        let termInserted = 0;

        while (offset < 500) {
          const apiUrl = `https://www.pureglobal.ai/api/${country.searchSlug}-search?q=${encodeURIComponent(term)}&limit=${limit}&offset=${offset}`;

          const resp = await axios.get(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Referer': `https://www.pureglobal.ai/${country.slug}/medical-device/database`,
            },
            timeout: 15000,
            validateStatus: () => true,
          });

          if (resp.status !== 200 || !resp.data) break;

          const items = Array.isArray(resp.data) ? resp.data : [];
          if (items.length === 0) break;

          if (offset === 0) {
            console.log(`  ${term}: ${items.length}条`);
          }

          for (const item of items) {
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

          if (items.length < limit) break;
          offset += limit;
          await sleep(300);
        }

        if (termInserted > 0) console.log(`  ${term}: 插入${termInserted}条`);
      } catch (e) {
        // skip
      }
      await sleep(200);
    }

    console.log(`  ${country.name}总计插入: ${countryInserted}`);
  }

  console.log(`\n  Pure Global AI总计插入: ${pgTotalInserted}`);

  // ===== PART 2: EUDAMED via Puppeteer =====
  console.log('\n========================================');
  console.log('PART 2: EUDAMED');
  console.log('========================================');

  let eudamedInserted = 0;
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const eudamedPage = await browser.newPage();
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

    try {
      console.log('  访问EUDAMED...');
      await eudamedPage.goto('https://ec.europa.eu/tools/eudamed/#/screen/search-device', {
        waitUntil: 'networkidle2',
        timeout: 90000,
      });
      await sleep(15000);

      const eudamedKeywords = ['mask', 'respirator', 'glove', 'goggle', 'face shield', 'helmet', 'N95', 'FFP2', 'coverall', 'gown'];

      for (const keyword of eudamedKeywords) {
        try {
          // Use Puppeteer type to trigger Angular change detection
          await eudamedPage.focus('#name');
          await eudamedPage.keyboard.down('Control');
          await eudamedPage.keyboard.press('a');
          await eudamedPage.keyboard.up('Control');
          await eudamedPage.keyboard.press('Backspace');
          await sleep(300);
          await eudamedPage.keyboard.type(keyword, { delay: 80 });
          await sleep(500);

          // Click Search button
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

          // Process captured API responses
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

          console.log(`  ${keyword}: 完成`);
        } catch (e) {
          console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 80)}`);
        }
      }

      // Log all captured API URLs
      console.log(`\n  总捕获API: ${capturedResponses.length}`);
      const deviceApis = capturedResponses.filter(r => r.url.includes('device'));
      console.log(`  设备API: ${deviceApis.length}`);
      for (const resp of deviceApis) {
        const data = resp.data;
        const items = Array.isArray(data) ? data : (data?.content || data?.data || []);
        console.log(`  ${resp.url.substring(0, 120)} -> ${items.length}条`);
      }
    } catch (e) {
      console.log(`  EUDAMED失败: ${e.message?.substring(0, 200)}`);
    }

    await eudamedPage.close();
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

        // Fill the search input
        await pmdaPage.focus('#txtName');
        await pmdaPage.keyboard.type(keyword, { delay: 30 });
        await sleep(500);

        // Click the search button: input[name="btnA"] with src SearchBtn07.gif
        const btnAClicked = await pmdaPage.evaluate(() => {
          const btnA = document.querySelector('input[name="btnA"]');
          if (btnA) {
            btnA.click();
            return { clicked: true, name: btnA.name, value: btnA.value, src: btnA.src };
          }
          return { clicked: false };
        });
        console.log(`  btnA: ${JSON.stringify(btnAClicked)}`);

        await sleep(15000);

        // Check page after search
        const afterSearch = await pmdaPage.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          tableRows: document.querySelectorAll('table tr').length,
          iframes: document.querySelectorAll('iframe').length,
          bodySample: document.body.innerText.substring(0, 500),
        }));
        console.log(`  搜索后: ${afterSearch.tableRows}表格行, ${afterSearch.iframes}个iframe`);

        // Check if PMDA uses iframes for results
        if (afterSearch.iframes > 0) {
          console.log('  PMDA使用iframe，尝试切换到结果iframe...');
          const frames = pmdaPage.frames();
          for (const frame of frames) {
            try {
              const frameData = await frame.evaluate(() => {
                const items = [];
                document.querySelectorAll('table tr').forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
                });
                return { url: window.location.href, items: items.slice(0, 10) };
              });

              if (frameData.items.length > 0) {
                console.log(`  iframe: ${frameData.url.substring(0, 80)} - ${frameData.items.length}行`);
                console.log(`  示例: ${JSON.stringify(frameData.items.slice(0, 2))}`);
              }
            } catch (e) { /* skip */ }
          }
        }

        // Extract results from main page
        const results = await pmdaPage.evaluate(() => {
          const items = [];
          document.querySelectorAll('table tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
            if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
          });

          if (items.length === 0) {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            const ppeLines = lines.filter(l =>
              /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸|靴|耳/i.test(l)
            );
            ppeLines.slice(0, 50).forEach(line => items.push([line.trim().substring(0, 300)]));
          }

          return items.slice(0, 100);
        });

        console.log(`  结果: ${results.length} 条`);

        let keywordInserted = 0;
        for (const row of results) {
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
  console.log(`  Pure Global AI: ${pgTotalInserted}`);
  console.log(`  EUDAMED: ${eudamedInserted}`);
  console.log(`  PMDA Japan: ${pmdaInserted}`);
  console.log(`  ---`);
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
