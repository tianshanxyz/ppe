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
  console.log('韩国MFDS医疗器械采集 v1');
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
    const mfdsKeywords = [
      '마스크', '호흡보호구', '보호장갑', '보호안경', '안전모',
      '보호복', '안전화', '귀마개', '고글', '방호복',
      '방진마스크', '면마스크', '의료용마스크', '수술용마스크',
      '보호면', '방호장갑', '의료용장갑', '안전보호구',
    ];

    let mfdsInserted = 0;

    const mfdsSearchUrls = [
      'https://emed.mfds.go.kr/CFEBB01F01',
      'http://emed.mfds.go.kr/CFEBB01F01',
    ];

    for (const keyword of mfdsKeywords) {
      let mfdsPage;
      try {
        mfdsPage = await browser.newPage();
        await mfdsPage.setDefaultTimeout(45000);
        await mfdsPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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

        let pageLoaded = false;
        for (const baseUrl of mfdsSearchUrls) {
          try {
            console.log(`  尝试: ${baseUrl}`);
            await mfdsPage.goto(baseUrl, {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
            await sleep(5000);
            pageLoaded = true;
            console.log(`  页面加载成功`);
            break;
          } catch (e) {
            console.log(`  ${baseUrl} 失败: ${e.message?.substring(0, 60)}`);
          }
        }

        if (!pageLoaded) {
          console.log(`  ${keyword}: 所有URL都无法访问`);
          await mfdsPage.close();
          continue;
        }

        const searchInput = await mfdsPage.$('input[type="text"], input[type="search"], input:not([type])');
        if (searchInput) {
          await searchInput.click({ clickCount: 3 });
          await mfdsPage.keyboard.press('Backspace');
          await sleep(200);
          await mfdsPage.keyboard.type(keyword, { delay: 30 });

          const searchBtn = await mfdsPage.$('button[type="submit"], input[type="submit"], button.search, button.btn-search, a.btn-search');
          if (searchBtn) {
            await searchBtn.click();
          } else {
            await mfdsPage.keyboard.press('Enter');
          }

          console.log(`  已搜索`);
          await sleep(8000);
        } else {
          console.log(`  未找到搜索框`);
          await mfdsPage.close();
          continue;
        }

        let keywordInserted = 0;

        for (const resp of capturedApiData) {
          const items = Array.isArray(resp.data) ? resp.data
            : (resp.data?.data || resp.data?.list || resp.data?.items || resp.data?.results || resp.data?.body || []);
          if (items.length > 0) {
            console.log(`  API: ${resp.url.substring(0, 60)} - ${items.length}条`);
            for (const item of items.slice(0, 200)) {
              const name = item.deviceName || item.productName || item.name || item.itemName || item.ITEM_NAME || item.PRDLST_NM || '';
              const mfr = item.manufacturer || item.manufacturerName || item.companyName || item.BSSH_NM || item.ENTRPS_NM || '';
              const deviceClass = item.deviceClass || item.classification || item.CLSCD || item.ITEM_SEQ || '';
              const regNumber = item.registrationNumber || item.productCode || item.permitNo || item.ITEM_PERMIT_NO || '';

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
          const bodyResults = await mfdsPage.evaluate((kw) => {
            const body = document.body.innerText;
            const lines = body.split('\n').filter(l => l.trim().length > 5);
            return lines.filter(l =>
              /마스크|호흡|보호|안전|방호|장갑|고글|모|복|화|귀|방진|면|의료|수술/i.test(l)
            ).slice(0, 100).map(l => [l.trim().substring(0, 500)]);
          }, keyword);

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

  console.log('\n========================================');
  console.log('MFDS采集完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
}

main().catch(console.error);
