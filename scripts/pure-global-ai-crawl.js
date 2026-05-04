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
  console.log('Pure Global AI 专用采集 v20');
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
    const pgCountries = [
      { name: '菲律宾', cc: 'PH', auth: 'FDA Philippines', slug: 'philippines' },
      { name: '印度', cc: 'IN', auth: 'CDSCO', slug: 'india' },
      { name: '沙特', cc: 'SA', auth: 'SFDA', slug: 'saudi-arabia' },
      { name: '韩国', cc: 'KR', auth: 'MFDS', slug: 'south-korea' },
      { name: '日本', cc: 'JP', auth: 'PMDA', slug: 'japan' },
    ];

    const ppeTerms = ['mask', 'respirator', 'N95', 'glove', 'goggle', 'face shield', 'helmet', 'safety boot', 'protective suit', 'coverall', 'gown', 'PPE', 'earplug', 'FFP2', 'FFP3'];

    for (const country of pgCountries) {
      console.log(`\n=== ${country.name} ===`);
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

        const pgUrl = `https://www.pureglobal.ai/${country.slug}/medical-device/database`;
        console.log(`  访问: ${pgUrl}`);
        await pgPage.goto(pgUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(8000);

        for (const term of ppeTerms) {
          try {
            pgApiData.length = 0;

            const searchInput = await pgPage.$('input[type="text"], input[type="search"], input:not([type])');
            if (searchInput) {
              await searchInput.click({ clickCount: 3 });
              await pgPage.keyboard.press('Backspace');
              await sleep(200);
              await pgPage.keyboard.type(term, { delay: 30 });
              await pgPage.keyboard.press('Enter');
              await sleep(5000);
            }

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
                  }
                }
                if (termInserted > 0) console.log(`  ${term}: ${termInserted}条`);
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
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('采集完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
