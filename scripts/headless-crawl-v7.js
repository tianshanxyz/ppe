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
  if (deviceClass === '3') return 'high';
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (deviceClass === '2' || /helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
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
  console.log('Pure Global AI 网络拦截采集 v7');
  console.log('通过拦截浏览器网络请求获取API数据');
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

  console.log('\n启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    // ===== Step 1: Collect device data via network interception =====
    console.log('\n[1] 通过搜索页面拦截API数据...');

    const ppeSearchTerms = [
      'mask', 'respirator', 'N95', 'glove', 'goggle',
      'face shield', 'helmet', 'earplug', 'safety boot',
      'protective suit', 'coverall', 'gown', 'safety vest',
      'SCBA', 'hearing protector', 'hazmat suit',
    ];

    let searchInserted = 0;

    for (const term of ppeSearchTerms) {
      console.log(`\n  搜索: "${term}"`);

      // Create a fresh page for each search
      const searchPage = await browser.newPage();
      await searchPage.setDefaultTimeout(30000);
      await searchPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      // Intercept API responses
      const apiData = [];
      searchPage.on('response', async (res) => {
        const url = res.url();
        if (url.includes('/api/devices') && res.status() === 200) {
          try {
            const contentType = res.headers()['content-type'] || '';
            if (contentType.includes('json')) {
              const json = await res.json();
              apiData.push(json);
            }
          } catch (e) {}
        }
      });

      try {
        // Navigate to search page
        const searchUrl = `https://www.pureglobal.ai/devices?search=${encodeURIComponent(term)}`;
        await searchPage.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await sleep(6000);

        // Process intercepted API data
        let termInserted = 0;

        for (const data of apiData) {
          const devices = data.devices || [];
          if (devices.length === 0) continue;

          for (const device of devices) {
            const name = (device.deviceName || '').trim();
            if (!name || name.length < 3) continue;

            const category = categorizePPE(name);
            if (category === '其他' && !/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety|earplug|earmuff|vest|scba|hazmat/i.test(name.toLowerCase())) continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: 'Unknown',
              product_code: (device.fdaCode || '').substring(0, 50),
              country_of_origin: 'US',
              risk_level: determineRiskLevel(name, device.deviceClass),
              data_source: 'Pure Global AI API',
              registration_authority: 'FDA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              termInserted++;
              searchInserted++;
            }
          }
        }

        if (termInserted > 0) {
          console.log(`    ${termInserted} 条 (拦截到 ${apiData.length} 个API响应)`);
        } else {
          console.log(`    0 条 (拦截到 ${apiData.length} 个API响应)`);
        }
      } catch (e) {
        console.log(`    错误: ${e.message.substring(0, 100)}`);
      }

      await searchPage.close();
      await sleep(1000);
    }

    console.log(`\n  搜索总计插入: ${searchInserted}`);

    // ===== Step 2: Browse by specialty =====
    console.log('\n[2] 按专业分类浏览...');

    const ppeSpecialties = [
      'general-hospital', 'anesthesiology',
    ];

    let specInserted = 0;

    for (const specialty of ppeSpecialties) {
      console.log(`\n  专业: ${specialty}`);

      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        const specPage = await browser.newPage();
        await specPage.setDefaultTimeout(30000);
        await specPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        const specApiData = [];
        specPage.on('response', async (res) => {
          const url = res.url();
          if (url.includes('/api/devices') && res.status() === 200) {
            try {
              const json = await res.json();
              specApiData.push(json);
            } catch (e) {}
          }
        });

        try {
          const url = `https://www.pureglobal.ai/devices?specialty=${specialty}&page=${pageNum}`;
          await specPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(5000);

          let pageInserted = 0;

          for (const data of specApiData) {
            const devices = data.devices || [];
            if (devices.length === 0) continue;

            for (const device of devices) {
              const name = (device.deviceName || '').trim();
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他') continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: 'Unknown',
                product_code: (device.fdaCode || '').substring(0, 50),
                country_of_origin: 'US',
                risk_level: determineRiskLevel(name, device.deviceClass),
                data_source: 'Pure Global AI API',
                registration_authority: 'FDA',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              };

              if (await insertProduct(product)) {
                pageInserted++;
                specInserted++;
              }
            }
          }

          if (pageInserted > 0) console.log(`    第${pageNum}页: ${pageInserted} 条`);
          if (specApiData.length === 0 || (specApiData[0]?.devices?.length || 0) < 50) break;
        } catch (e) {
          break;
        }

        await specPage.close();
        await sleep(1000);
      }
    }

    console.log(`\n  专业分类总计插入: ${specInserted}`);

    // ===== Step 3: Country-specific data via agent.pureglobal.ai =====
    console.log('\n[3] 获取国家特定数据...');

    const countries = [
      { slug: 'japan', cc: 'JP', auth: 'PMDA' },
      { slug: 'korea', cc: 'KR', auth: 'MFDS' },
      { slug: 'brazil', cc: 'BR', auth: 'ANVISA' },
      { slug: 'australia', cc: 'AU', auth: 'TGA' },
      { slug: 'united-kingdom', cc: 'GB', auth: 'MHRA' },
      { slug: 'china', cc: 'CN', auth: 'NMPA' },
      { slug: 'india', cc: 'IN', auth: 'CDSCO' },
      { slug: 'saudi-arabia', cc: 'SA', auth: 'SFDA' },
      { slug: 'philippines', cc: 'PH', auth: 'FDA Philippines' },
    ];

    let countryInserted = 0;

    for (const country of countries) {
      console.log(`\n  === ${country.slug.toUpperCase()} ===`);
      let countryCount = 0;

      for (const term of ppeSearchTerms.slice(0, 5)) {
        const countryPage = await browser.newPage();
        await countryPage.setDefaultTimeout(30000);
        await countryPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        const countryApiData = [];
        countryPage.on('response', async (res) => {
          const url = res.url();
          if ((url.includes('/api/') || url.includes('/device')) && res.status() === 200) {
            try {
              const contentType = res.headers()['content-type'] || '';
              if (contentType.includes('json')) {
                const json = await res.json();
                countryApiData.push({ url, data: json });
              }
            } catch (e) {}
          }
        });

        try {
          const url = `https://agent.pureglobal.ai/${country.slug}/medical-device/database?search=${encodeURIComponent(term)}`;
          await countryPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(6000);

          let termCount = 0;

          for (const resp of countryApiData) {
            const items = Array.isArray(resp.data) ? resp.data :
              (resp.data?.devices || resp.data?.data || resp.data?.results || resp.data?.items || []);

            for (const item of items.slice(0, 50)) {
              const name = item.deviceName || item.name || item.productName || '';
              const mfr = item.manufacturer || item.manufacturerName || '';
              const code = item.fdaCode || item.productCode || '';
              if (!name || name.length < 3) continue;

              const category = categorizePPE(name);
              if (category === '其他' && !/mask|respirat|glove|goggle|shield|helmet|boot|gown|coverall|suit|protect|safety/i.test(name.toLowerCase())) continue;

              const product = {
                name: name.substring(0, 500),
                category,
                manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                product_code: (code || '').substring(0, 50),
                country_of_origin: country.cc,
                risk_level: determineRiskLevel(name, item.deviceClass),
                data_source: `Pure Global AI - ${country.slug}`,
                registration_authority: country.auth,
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'medium',
              };

              if (await insertProduct(product)) {
                termCount++;
                countryCount++;
                countryInserted++;
              }
            }
          }

          if (termCount > 0) console.log(`    ${term}: ${termCount} 条`);
        } catch (e) {
          // skip
        }

        await countryPage.close();
        await sleep(500);
      }
      console.log(`  ${country.slug}: ${countryCount} 条`);
    }

    console.log(`\n  国家数据总计插入: ${countryInserted}`);

    // ===== Step 4: PMDA Japan =====
    console.log('\n[4] PMDA Japan...');

    let pmdaInserted = 0;
    const pmdaPage = await browser.newPage();
    await pmdaPage.setDefaultTimeout(60000);
    await pmdaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    try {
      await pmdaPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await sleep(5000);

      // Get page structure
      const pageInfo = await pmdaPage.evaluate(() => {
        const info = { inputs: [], buttons: [] };
        document.querySelectorAll('input[type="text"], input:not([type])').forEach(i => {
          if (i.offsetParent !== null) {
            const parent = i.closest('tr, div, li, dd');
            const label = parent ? parent.querySelector('label, th, .label') : null;
            info.inputs.push({
              id: i.id, name: i.name, placeholder: i.placeholder,
              label: label ? label.textContent.trim().substring(0, 80) : '',
              size: i.size,
            });
          }
        });
        document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(b => {
          if (b.offsetParent !== null) {
            info.buttons.push({
              id: b.id, name: b.name, type: b.type,
              value: b.value, text: b.textContent?.trim()?.substring(0, 50),
            });
          }
        });
        return info;
      });

      console.log(`  输入框: ${pageInfo.inputs.length}, 按钮: ${pageInfo.buttons.length}`);

      const targetInput = pageInfo.inputs.find(i =>
        /販売名|一般的名称|名称|search|keyword|name/i.test(i.label || i.name || i.id || '')
      ) || pageInfo.inputs[0];

      if (targetInput) {
        console.log(`  搜索框: id="${targetInput.id}" label="${targetInput.label}"`);

        const keywords = ['マスク', '防塵マスク', '呼吸用保護具', '保護手袋', 'ゴーグル', 'ヘルメット', '安全靴', '保護衣', '防護服'];

        for (const keyword of keywords) {
          try {
            console.log(`  搜索: ${keyword}`);

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

            const submitBtn = pageInfo.buttons.find(b => /検索|submit/i.test(b.value || b.text || b.type || ''));
            if (submitBtn) {
              const btnSel = submitBtn.id ? `#${submitBtn.id}` : (submitBtn.name ? `[name="${submitBtn.name}"]` : 'input[type="submit"]');
              await pmdaPage.click(btnSel);
            } else {
              await pmdaPage.keyboard.press('Enter');
            }

            await sleep(10000);

            const results = await pmdaPage.evaluate(() => {
              const items = [];
              document.querySelectorAll('table tbody tr, table tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                if (cells.length >= 2 && cells.some(c => c.length > 0)) items.push(cells);
              });
              if (items.length === 0) {
                const body = document.body.innerText;
                const lines = body.split('\n').filter(l => l.trim().length > 5);
                const ppeLines = lines.filter(l => /マスク|手袋|ゴーグル|ヘルメット|保護|防護|安全|呼吸/i.test(l));
                ppeLines.slice(0, 30).forEach(line => items.push([line.trim().substring(0, 300)]));
              }
              return items.slice(0, 50);
            });

            console.log(`  结果: ${results.length} 行`);

            for (const row of results) {
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

              if (await insertProduct(product)) pmdaInserted++;
            }
          } catch (e) {
            console.log(`  错误: ${e.message.substring(0, 100)}`);
          }
        }
      }
    } catch (e) {
      console.log(`  PMDA加载失败: ${e.message.substring(0, 150)}`);
    }

    await pmdaPage.close();
    console.log(`\n  PMDA总计插入: ${pmdaInserted}`);

    // ===== Step 5: MFDS Korea =====
    console.log('\n[5] MFDS Korea...');

    let mfdsInserted = 0;
    const mfdsUrls = [
      'https://www.mfds.go.kr/eng/brd/m_41/list.do',
      'https://emedi.mfds.go.kr',
    ];

    for (const url of mfdsUrls) {
      const mfdsPage = await browser.newPage();
      await mfdsPage.setDefaultTimeout(30000);
      await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

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

        if (mfdsInserted > 0) break;
      } catch (e) {
        console.log(`  失败: ${e.message.substring(0, 100)}`);
      }

      await mfdsPage.close();
    }

    console.log(`\n  MFDS总计插入: ${mfdsInserted}`);

  } finally {
    await browser.close();
  }

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
