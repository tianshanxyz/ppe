#!/usr/bin/env node
const axios = require('axios');
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|呼吸|防尘|防毒|口罩|máscara|respirador/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套|guante|luvas|sarung tangan/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|护目镜|防护面罩|面屏|óculos|anteojos/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽|capacete|casco/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩/protetor auricular|tapones/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋|botas|calçado/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|bata|macacão/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/n95|kn95|ffp|respirat|scba|防护服/i.test(n)) return 'high';
  if (/外科口罩|helmet|goggle|glove|boot|footwear/i.test(n)) return 'medium';
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
  console.log('P2+P3 全球PPE数据采集 (墨+俄+南非+土+阿联酋)');
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
          name: mfr.substring(0, 500), country: product.country_of_origin || 'Unknown',
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
    headless: 'new', protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-crashpad-for-testing'],
  });

  try {
    // ===== Mexico COFEPRIS =====
    console.log('\n=== Mexico COFEPRIS ===');
    let mxInserted = 0;
    try {
      const mxPage = await browser.newPage();
      await mxPage.setDefaultTimeout(60000);
      await mxPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      // COFEPRIS publishes Excel lists at gob.mx
      const mxUrls = [
        'https://www.gob.mx/cofepris/documentos/listados-de-registros-de-dispositivos-medicos',
        'https://www.gob.mx/cofepris/documentos/registros-dispositivos-medicos',
      ];

      for (const mxUrl of mxUrls) {
        try {
          console.log(`  URL: ${mxUrl}`);
          await mxPage.goto(mxUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          await sleep(5000);

          const links = await mxPage.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
              .filter(a => {
                const href = a.href || '';
                const text = (a.textContent || '').toLowerCase();
                return (href.endsWith('.xlsx') || href.endsWith('.xls') || href.endsWith('.csv')) &&
                  /dispositivo|medical.*device|registro/i.test(href + text);
              })
              .map(a => ({ text: a.textContent.trim().substring(0, 80), href: a.href }))
              .slice(0, 10);
          });
          console.log(`  找到${links.length}个下载链接`);
          if (links.length > 0) {
            for (const link of links) {
              console.log(`    ${link.text} -> ${link.href.substring(0, 80)}`);
            }
          }

          // Fallback: extract text
          const text = await mxPage.evaluate(() => {
            return document.body.innerText.split('\n')
              .filter(l => l.trim().length > 10)
              .filter(l => /máscara|guante|respirador|protector|careta|bata|mascarilla|lentes|gafas|botas|casco/i.test(l))
              .slice(0, 100).map(l => l.trim().substring(0, 500));
          });

          for (const line of text) {
            const category = categorizePPE(line);
            if (category === '其他') continue;
            const product = {
              name: line.substring(0, 500), category,
              manufacturer_name: 'Unknown', country_of_origin: 'MX',
              risk_level: determineRiskLevel(line),
              data_source: 'COFEPRIS Mexico', registration_authority: 'COFEPRIS',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'low',
            };
            if (await insertProduct(product)) mxInserted++;
          }
          if (text.length > 0) break;
        } catch (e) {
          console.log(`    失败: ${e.message?.substring(0, 60)}`);
        }
      }
      console.log(`  Mexico插入: ${mxInserted}`);
      await mxPage.close();
    } catch (e) {
      console.log(`  Mexico错误: ${e.message?.substring(0, 60)}`);
    }

    // ===== Russia Roszdravnadzor =====
    console.log('\n=== Russia Roszdravnadzor ===');
    let ruInserted = 0;
    try {
      const ruPage = await browser.newPage();
      await ruPage.setDefaultTimeout(60000);
      await ruPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const ruUrls = [
        'https://roszdravnadzor.gov.ru/services/misearch',
        'https://www.roszdravnadzor.ru/services/misearch',
      ];

      for (const ruUrl of ruUrls) {
        try {
          console.log(`  URL: ${ruUrl}`);
          await ruPage.goto(ruUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(5000);

          // Try to find search input
          const input = await ruPage.$('input[type="text"], input[type="search"]');
          if (input) {
            const russianTerms = ['маска', 'перчатки', 'респиратор', 'защитный', 'халат', 'очки', 'щиток',
              'средство защиты', 'противочумный', 'марлевая', 'медицинская маска'];
            for (const term of russianTerms.slice(0, 3)) {
              await input.click({ clickCount: 3 });
              await ruPage.keyboard.press('Backspace');
              await sleep(200);
              await ruPage.keyboard.type(term, { delay: 20 });
              await ruPage.keyboard.press('Enter');
              await sleep(5000);

              const results = await ruPage.evaluate(() => {
                const items = [];
                document.querySelectorAll('table tr').forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
                  if (cells.length >= 2 && cells.some(c => c.length > 2)) items.push(cells);
                });
                return items.slice(0, 50);
              });

              for (const row of results) {
                const name = (row[0] || '').trim();
                const mfr = (row.length > 2 ? row[2] : row.length > 1 ? row[1] : '').trim();
                if (!name || name.length < 3) continue;
                const category = categorizePPE(name);
                if (category === '其他') continue;

                const product = {
                  name: name.substring(0, 500), category,
                  manufacturer_name: (mfr || 'Unknown').substring(0, 500),
                  country_of_origin: 'RU', risk_level: determineRiskLevel(name),
                  data_source: 'Roszdravnadzor Russia', registration_authority: 'Roszdravnadzor',
                  last_verified: new Date().toISOString().split('T')[0],
                  data_confidence_level: 'high',
                };
                if (await insertProduct(product)) ruInserted++;
              }
            }
          }
          break;
        } catch (e) {
          console.log(`    失败: ${e.message?.substring(0, 60)}`);
        }
      }

      // Fallback: EUDAMED for Russian manufacturers
      if (ruInserted === 0) {
        const euResp = await axios.get('https://ec.europa.eu/tools/eudamed/api/devices/udiDiData', {
          params: { tradeName: 'mask', pageSize: 300, size: 300, page: 0, iso2Code: 'en', languageCode: 'en' },
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          timeout: 60000,
        });
        for (const item of (euResp.data?.content || [])) {
          if (item.manufacturerSrn?.startsWith('RU-')) {
            const name = item.tradeName || '';
            const category = categorizePPE(name);
            if (category === '其他') continue;
            const product = {
              name: name.substring(0, 500), category,
              manufacturer_name: (item.manufacturerName || 'Unknown').substring(0, 500),
              product_code: (item.basicUdi || '').substring(0, 50),
              country_of_origin: 'RU', risk_level: determineRiskLevel(name),
              data_source: 'EUDAMED (Russian Mfr)', registration_authority: 'Roszdravnadzor/EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };
            if (await insertProduct(product)) ruInserted++;
          }
        }
      }
      console.log(`  Russia插入: ${ruInserted}`);
      await ruPage.close();
    } catch (e) {
      console.log(`  Russia错误: ${e.message?.substring(0, 60)}`);
    }

    // ===== South Africa SAHPRA =====
    console.log('\n=== South Africa SAHPRA ===');
    let zaInserted = 0;
    try {
      const zaPage = await browser.newPage();
      await zaPage.setDefaultTimeout(60000);
      await zaPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const zaUrls = ['https://www.sahpra.org.za/medical-devices/', 'https://www.sahpra.org.za/registered-health-products/'];
      for (const zaUrl of zaUrls) {
        try {
          console.log(`  URL: ${zaUrl}`);
          await zaPage.goto(zaUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(5000);

          const text = await zaPage.evaluate(() => {
            return document.body.innerText.split('\n')
              .filter(l => l.trim().length > 5)
              .filter(l => /mask|glove|respirator|gown|protective|visor|goggle|surgical/i.test(l))
              .slice(0, 100).map(l => l.trim().substring(0, 500));
          });

          for (const line of text) {
            const category = categorizePPE(line);
            if (category === '其他') continue;
            const product = {
              name: line.substring(0, 500), category,
              manufacturer_name: 'Unknown', country_of_origin: 'ZA',
              risk_level: determineRiskLevel(line),
              data_source: 'SAHPRA South Africa', registration_authority: 'SAHPRA',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'low',
            };
            if (await insertProduct(product)) zaInserted++;
          }
          if (text.length > 0) break;
        } catch (e) { console.log(`    失败: ${e.message?.substring(0, 40)}`); }
      }
      console.log(`  SA插入: ${zaInserted}`);
      await zaPage.close();
    } catch (e) { console.log(`  SA错误: ${e.message?.substring(0, 60)}`); }

    // ===== Turkey TITCK =====
    console.log('\n=== Turkey TITCK ===');
    let trInserted = 0;
    try {
      const trPage = await browser.newPage();
      await trPage.setDefaultTimeout(60000);
      await trPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const trUrls = ['https://www.titck.gov.tr/kubkt', 'https://www.titck.gov.tr/titm'];
      for (const trUrl of trUrls) {
        try {
          console.log(`  URL: ${trUrl}`);
          await trPage.goto(trUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(5000);

          const text = await trPage.evaluate(() => {
            return document.body.innerText.split('\n')
              .filter(l => l.trim().length > 5)
              .filter(l => /maske|eldiven|koruyucu|tulum|gözlük|siperlik|önlük|bone|galoş/i.test(l))
              .slice(0, 100).map(l => l.trim().substring(0, 500));
          });

          for (const line of text) {
            const category = categorizePPE(line);
            if (category === '其他') continue;
            const product = {
              name: line.substring(0, 500), category,
              manufacturer_name: 'Unknown', country_of_origin: 'TR',
              risk_level: determineRiskLevel(line),
              data_source: 'TITCK Turkey', registration_authority: 'TITCK',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'low',
            };
            if (await insertProduct(product)) trInserted++;
          }
          if (text.length > 0) break;
        } catch (e) { console.log(`    失败: ${e.message?.substring(0, 40)}`); }
      }
      console.log(`  Turkey插入: ${trInserted}`);
      await trPage.close();
    } catch (e) { console.log(`  Turkey错误: ${e.message?.substring(0, 60)}`); }

    // ===== EUDAMED for MX/ZA/TR manufacturers =====
    console.log('\n=== EUDAMED扩展搜索(墨/南非/土制造商) ===');
    let euExtra = 0;
    try {
      const terms = ['mask', 'glove', 'gown', 'respirator', 'protective'];
      for (const term of terms) {
        const resp = await axios.get('https://ec.europa.eu/tools/eudamed/api/devices/udiDiData', {
          params: { tradeName: term, pageSize: 300, size: 300, page: 0, iso2Code: 'en', languageCode: 'en' },
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          timeout: 60000,
        });
        for (const item of (resp.data?.content || [])) {
          const srn = item.manufacturerSrn || '';
          const prefix = srn.split('-')[0];
          if (['MX', 'ZA', 'TR', 'AE'].includes(prefix)) {
            const name = item.tradeName || '';
            const category = categorizePPE(name);
            if (category === '其他') continue;
            const prodCountry = prefix === 'AE' ? 'AE' : prefix;
            const product = {
              name: name.substring(0, 500), category,
              manufacturer_name: (item.manufacturerName || 'Unknown').substring(0, 500),
              product_code: (item.basicUdi || '').substring(0, 50),
              country_of_origin: prodCountry, risk_level: determineRiskLevel(name),
              data_source: `EUDAMED (${prefix} Mfr)`, registration_authority: 'EUDAMED',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            };
            if (await insertProduct(product)) euExtra++;
          }
        }
        await sleep(500);
      }
      console.log(`  EUDAMED扩展插入: ${euExtra}`);
    } catch (e) { console.log(`  EUDAMED扩展错误: ${e.message?.substring(0, 60)}`); }

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('P2+P3采集完成');
  console.log('========================================');
  const { count: finalCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`新增产品: ${totalInserted}`);
  console.log(`新增制造商: ${totalMfrInserted}`);
  console.log(`总产品数: ${finalCount}`);
}

main().catch(console.error);
