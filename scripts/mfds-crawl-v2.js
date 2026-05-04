#!/usr/bin/env node
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

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

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear|harness/i.test(n)) return 'medium';
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
  console.log('韩国MFDS医疗器械采集 v2 (emedi.mfds.go.kr)');
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

  // Part 1: Try emedi.mfds.go.kr (new MFDS portal)
  console.log('\n=== Part 1: emedi.mfds.go.kr ===');

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  let mfdsInserted = 0;

  try {
    const mfdsKeywords = ['마스크', '보호장갑', '보호안경', '안전모', '보호복', '방호복'];

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

        console.log(`\n  搜索: ${keyword}`);

        const urls = [
          'https://emedi.mfds.go.kr/',
          'https://emedi.mfds.go.kr/search',
          'http://emedi.mfds.go.kr/',
        ];

        let pageLoaded = false;
        for (const url of urls) {
          try {
            await mfdsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await sleep(3000);
            pageLoaded = true;
            console.log(`  页面加载成功: ${url}`);
            break;
          } catch (e) {
            console.log(`  ${url} 失败: ${e.message?.substring(0, 60)}`);
          }
        }

        if (!pageLoaded) {
          await mfdsPage.close();
          continue;
        }

        const searchInput = await mfdsPage.$('input[type="text"], input[type="search"], input:not([type])');
        if (searchInput) {
          await searchInput.click({ clickCount: 3 });
          await mfdsPage.keyboard.press('Backspace');
          await sleep(200);
          await mfdsPage.keyboard.type(keyword, { delay: 30 });
          await mfdsPage.keyboard.press('Enter');
          await sleep(8000);

          for (const resp of capturedApiData) {
            const items = Array.isArray(resp.data) ? resp.data
              : (resp.data?.data || resp.data?.list || resp.data?.items || resp.data?.results || []);
            if (items.length > 0) {
              console.log(`  API: ${resp.url.substring(0, 60)} - ${items.length}条`);
              for (const item of items.slice(0, 200)) {
                const name = item.deviceName || item.productName || item.name || item.itemName || '';
                const mfr = item.manufacturer || item.manufacturerName || item.companyName || '';
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
                  risk_level: determineRiskLevel(name),
                  data_source: 'MFDS Korea',
                  registration_authority: 'MFDS',
                  last_verified: new Date().toISOString().split('T')[0],
                  data_confidence_level: 'high',
                };

                if (await insertProduct(product)) {
                  mfdsInserted++;
                }
              }
            }
          }
        }

        console.log(`  ${keyword}: 完成`);
        await mfdsPage.close();
      } catch (e) {
        console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 80)}`);
        if (mfdsPage) await mfdsPage.close().catch(() => {});
      }
    }
  } finally {
    await browser.close();
  }

  // Part 2: EUDAMED API - Korean manufacturers in EU
  console.log('\n=== Part 2: EUDAMED API - 韩国制造商 ===');

  const eudamedApi = axios.create({
    baseURL: 'https://ec.europa.eu/tools/eudamed/api/devices',
    timeout: 60000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  const koreanPPEKeywords = ['mask korea', 'glove korea', 'respirator korea', 'protective korea', 'safety korea', 'helmet korea', 'korean mask', 'korean glove'];

  for (const keyword of koreanPPEKeywords) {
    try {
      const resp = await eudamedApi.get('/udiDiData', {
        params: { tradeName: keyword, pageSize: 300, size: 300, page: 0, iso2Code: 'en', languageCode: 'en' },
      });

      const totalElements = resp.data?.totalElements || 0;
      console.log(`  ${keyword}: ${totalElements}条`);

      if (totalElements === 0) continue;

      const content = resp.data?.content || [];
      for (const item of content) {
        const tradeName = item.tradeName || '';
        const manufacturerName = item.manufacturerName || '';
        const manufacturerSrn = item.manufacturerSrn || '';
        const basicUdi = item.basicUdi || '';
        const primaryDi = item.primaryDi || '';
        const riskClassCode = item.riskClass?.code || '';

        if (!tradeName || tradeName.length < 3) continue;

        const category = categorizePPE(tradeName);
        if (category === '其他') continue;

        let countryCode = 'KR';
        if (manufacturerSrn) {
          const srnPrefix = manufacturerSrn.split('-')[0];
          if (srnPrefix.length === 2) countryCode = srnPrefix;
        }

        if (countryCode !== 'KR') continue;

        const riskClass = parseEudamedRiskClass(riskClassCode);

        const product = {
          name: tradeName.substring(0, 500),
          category,
          manufacturer_name: (manufacturerName || 'Unknown').substring(0, 500),
          product_code: (basicUdi || primaryDi || '').substring(0, 50),
          country_of_origin: 'KR',
          risk_level: determineRiskLevel(tradeName, riskClass),
          data_source: 'EUDAMED API (Korean Mfr)',
          registration_authority: 'EUDAMED',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) {
          mfdsInserted++;
        }
      }
    } catch (e) {
      console.log(`  ${keyword}: 错误 - ${e.message?.substring(0, 80)}`);
    }
  }

  // Part 3: EUDAMED API - Search for KR SRN prefix
  console.log('\n=== Part 3: EUDAMED API - KR SRN前缀搜索 ===');

  const ppeKeywords = ['mask', 'glove', 'respirator', 'gown', 'protective', 'safety', 'helmet', 'goggle', 'coverall', 'visor'];
  let krFromEudamed = 0;

  for (const keyword of ppeKeywords) {
    try {
      const firstResp = await eudamedApi.get('/udiDiData', {
        params: { tradeName: keyword, pageSize: 1, size: 1, page: 0, iso2Code: 'en', languageCode: 'en' },
      });

      const totalElements = firstResp.data?.totalElements || 0;
      if (totalElements === 0) continue;

      const realTotalPages = Math.ceil(totalElements / 300);
      const maxPages = Math.min(realTotalPages, 50);

      for (let page = 0; page < maxPages; page++) {
        try {
          const resp = await eudamedApi.get('/udiDiData', {
            params: { tradeName: keyword, pageSize: 300, size: 300, page, iso2Code: 'en', languageCode: 'en' },
          });

          const content = resp.data?.content || [];
          if (content.length === 0) break;

          for (const item of content) {
            const manufacturerSrn = item.manufacturerSrn || '';
            if (!manufacturerSrn.startsWith('KR-')) continue;

            const tradeName = item.tradeName || '';
            const manufacturerName = item.manufacturerName || '';
            const basicUdi = item.basicUdi || '';
            const primaryDi = item.primaryDi || '';
            const riskClassCode = item.riskClass?.code || '';

            if (!tradeName || tradeName.length < 3) continue;

            const category = categorizePPE(tradeName);
            if (category === '其他') continue;

            const riskClass = parseEudamedRiskClass(riskClassCode);

            const product = {
              name: tradeName.substring(0, 500),
              category,
              manufacturer_name: (manufacturerName || 'Unknown').substring(0, 500),
              product_code: (basicUdi || primaryDi || '').substring(0, 50),
              country_of_origin: 'KR',
              risk_level: determineRiskLevel(tradeName, riskClass),
              data_source: 'EUDAMED API (Korean Mfr)',
              registration_authority: 'EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };

            if (await insertProduct(product)) {
              krFromEudamed++;
              mfdsInserted++;
            }
          }

          if (content.length < 300) break;
          await sleep(300);
        } catch (e) {
          await sleep(2000);
        }
      }

      console.log(`  ${keyword}: KR产品累计${krFromEudamed}条`);
      await sleep(500);
    } catch (e) {
      console.log(`  ${keyword}: 错误`);
    }
  }

  console.log(`\n  韩国数据总计插入: ${mfdsInserted}`);

  console.log('\n========================================');
  console.log('采集完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
}

function parseEudamedRiskClass(code) {
  if (!code) return '';
  if (code.includes('class-iii')) return 'III';
  if (code.includes('class-iib')) return 'IIB';
  if (code.includes('class-iia')) return 'IIA';
  if (code.includes('class-i')) return 'I';
  return code.replace('refdata.risk-class.', '');
}

main().catch(console.error);
