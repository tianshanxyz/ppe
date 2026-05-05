#!/usr/bin/env node
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|呼吸|防尘|防毒|口罩|face.mask|surgical.mask/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套|examination.*glove|surgical.*glove/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|护目镜|防护面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋|足部/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|防护围裙|protective.cloth/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical|n95|kn95|ffp/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear|surgical.mask/i.test(n)) return 'medium';
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

async function openFDASearch(endpoint, searchQuery, limit = 100, skip = 0) {
  const url = `https://api.fda.gov${endpoint}?search=${encodeURIComponent(searchQuery)}&limit=${limit}&skip=${skip}`;
  try {
    const { data } = await axios.get(url, { timeout: 30000 });
    return data;
  } catch (e) {
    if (e.response?.status === 404) return { results: [], meta: { results: { total: 0 } } };
    throw e;
  }
}

async function main() {
  console.log('========================================');
  console.log('openFDA + EUDAMED 全球PPE数据采集');
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
          name: mfr.substring(0, 500), country: product.country_of_origin || 'US',
          data_source: product.data_source, last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: product.data_confidence_level || 'medium',
        });
        existingMfrNames.add(mfr.toLowerCase().trim()); totalMfrInserted++;
      }
      return true;
    }
    return false;
  }

  // ===== PART 1: FDA Classification - Get all PPE product codes =====
  console.log('\n[第1部分] FDA设备分类 - PPE产品代码');
  
  const ppeSearchTerms = [
    'surgical mask', 'respirator', 'N95', 'face shield', 'safety glasses',
    'protective glove', 'surgical glove', 'examination glove', 'medical glove',
    'surgical gown', 'isolation gown', 'protective gown', 'coverall', 'protective suit',
    'safety helmet', 'hard hat', 'earplug', 'earmuff', 'safety boot',
    'protective footwear', 'face mask', 'barrier face covering'
  ];

  const ppeProductCodes = new Map(); // product_code -> { device_name, device_class, definition }

  for (const term of ppeSearchTerms) {
    try {
      const data = await openFDASearch('/device/classification.json', `device_name:"${term}"`, 100);
      const total = data.meta?.results?.total || 0;
      console.log(`  "${term}": ${total}个分类`);

      for (const item of data.results || []) {
        if (!ppeProductCodes.has(item.product_code)) {
          ppeProductCodes.set(item.product_code, {
            device_name: item.device_name,
            device_class: item.device_class,
            definition: (item.definition || '').substring(0, 500),
            regulation_number: item.regulation_number || '',
            medical_specialty: item.medical_specialty_description || '',
          });
        }
      }
      await sleep(200);
    } catch (e) {
      console.log(`  "${term}": 错误`);
    }
  }

  console.log(`\n  去重PPE产品代码: ${ppeProductCodes.size}个`);
  for (const [code, info] of ppeProductCodes) {
    console.log(`    ${code}: ${info.device_name} (Class ${info.device_class})`);
  }

  // ===== PART 2: FDA 510(k) - Get actual products with manufacturers =====
  console.log('\n[第2部分] FDA 510(k) - 获取实际产品和制造商');
  let fdaInserted = 0;
  const seen510k = new Set();

  for (const [productCode, classInfo] of ppeProductCodes) {
    try {
      console.log(`\n  产品代码: ${productCode} - ${classInfo.device_name}`);
      
      let total510k = 0;
      for (let skip = 0; skip < 5000; skip += 100) {
        const data510k = await openFDASearch('/device/510k.json', `product_code:"${productCode}"`, 100, skip);
        const items = data510k.results || [];
        if (items.length === 0) break;

        total510k += items.length;

        let codeInserted = 0;
        for (const item of items) {
          const deviceName = item.device_name || item.trade_name || '';
          const applicant = item.applicant || '';
          const kNumber = item.k_number || '';
          const decisionDate = item.decision_date || '';
          const address = item.address || '';
          
          if (!deviceName || deviceName.length < 2) continue;
          
          const category = categorizePPE(deviceName);
          if (category === '其他' && !classInfo.definition.toLowerCase().includes('mask') && 
              !classInfo.definition.toLowerCase().includes('respirator') && 
              !classInfo.definition.toLowerCase().includes('glove')) {
            continue;
          }

          const finalCategory = category === '其他' ? '呼吸防护装备' : category;

          const kKey = kNumber;
          if (seen510k.has(kKey)) continue;
          seen510k.add(kKey);

          const product = {
            name: deviceName.substring(0, 500),
            category: finalCategory,
            manufacturer_name: applicant.substring(0, 500),
            product_code: `510(k) ${kNumber}`,
            country_of_origin: 'US',
            risk_level: determineRiskLevel(deviceName),
            data_source: 'FDA 510(k)',
            registration_authority: 'FDA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) {
            codeInserted++;
            fdaInserted++;
          }
        }

        if (codeInserted > 0) console.log(`    510(k) skip=${skip}: +${codeInserted}条`);
        
        if (items.length < 100) break;
        await sleep(300);
      }

      console.log(`  ${productCode} 总计: ${total510k}个510(k), 新增${fdaInserted}条`);
      await sleep(500);
    } catch (e) {
      console.log(`  ${productCode}: 错误 - ${e.message?.substring(0,80)}`);
    }
  }

  console.log(`\n  FDA总计插入: ${fdaInserted}`);

  // ===== PART 3: EUDAMED extension - search by more SRN prefixes =====
  console.log('\n[第3部分] EUDAMED - 扩展制造商SRN前缀搜索');
  
  // Extended SRN prefixes for more countries (previous script already covered basic ones)
  const euCountries = [
    { prefix: 'DE', name: 'Germany' }, { prefix: 'FR', name: 'France' },
    { prefix: 'ES', name: 'Spain' }, { prefix: 'NL', name: 'Netherlands' },
    { prefix: 'IE', name: 'Ireland' }, { prefix: 'BE', name: 'Belgium' },
    { prefix: 'AT', name: 'Austria' }, { prefix: 'PL', name: 'Poland' },
    { prefix: 'CZ', name: 'Czech Republic' }, { prefix: 'HU', name: 'Hungary' },
    { prefix: 'PT', name: 'Portugal' }, { prefix: 'GR', name: 'Greece' },
    { prefix: 'FI', name: 'Finland' }, { prefix: 'DK', name: 'Denmark' },
    { prefix: 'SK', name: 'Slovakia' }, { prefix: 'SI', name: 'Slovenia' },
    { prefix: 'LT', name: 'Lithuania' }, { prefix: 'LV', name: 'Latvia' },
    { prefix: 'EE', name: 'Estonia' }, { prefix: 'BG', name: 'Bulgaria' },
    { prefix: 'RO', name: 'Romania' }, { prefix: 'HR', name: 'Croatia' },
    { prefix: 'MT', name: 'Malta' }, { prefix: 'CY', name: 'Cyprus' },
    { prefix: 'LU', name: 'Luxembourg' }, { prefix: 'IS', name: 'Iceland' },
    { prefix: 'NO', name: 'Norway' }, { prefix: 'CH', name: 'Switzerland' },
    { prefix: 'TR', name: 'Turkey' }, { prefix: 'UK', name: 'United Kingdom' },
    { prefix: 'SE', name: 'Sweden' },
  ];

  let eudamedInserted = 0;

  for (const country of euCountries) {
    try {
      console.log(`\n  EUDAMED搜索: ${country.name} (${country.prefix}-SRN)`);
      
      const url = `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?manufacturerSRN=${country.prefix}-&page=0&size=100`;
      const { data } = await axios.get(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000,
      });

      const items = data?.content || data?.data || (Array.isArray(data) ? data : []);
      console.log(`    返回: ${items.length}条`);

      let countryInserted = 0;
      for (const item of items) {
        const name = item.tradeName || item.deviceName || item.nomenclatureDescription || item.basicUdiDi || '';
        const mfr = item.manufacturerName || item.actorName || '';

        if (!name || name.length < 3) continue;
        const category = categorizePPE(name);
        if (category === '其他') continue;

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (mfr || 'Unknown').substring(0, 500),
          product_code: (item.basicUdiDi || item.primaryDi || '').substring(0, 50),
          country_of_origin: country.prefix,
          risk_level: determineRiskLevel(name),
          data_source: 'EUDAMED',
          registration_authority: 'EU Commission',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        if (await insertProduct(product)) {
          countryInserted++;
          eudamedInserted++;
        }
      }

      console.log(`    ${country.name}: 新增${countryInserted}条 (累计${eudamedInserted})`);
      await sleep(500);
    } catch (e) {
      console.log(`    ${country.name}: 错误 - ${e.response?.status || e.message?.substring(0,50)}`);
    }
  }

  console.log(`\n  EUDAMED总计插入: ${eudamedInserted}`);

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('采集完成');
  console.log('========================================');
  console.log(`FDA新增: ${fdaInserted}`);
  console.log(`EUDAMED新增: ${eudamedInserted}`);
  console.log(`总新增产品: ${totalInserted}`);
  console.log(`总新增制造商: ${totalMfrInserted}`);
  const { count: fCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`数据库总产品数: ${fCount}`);
}

main().catch(console.error);
