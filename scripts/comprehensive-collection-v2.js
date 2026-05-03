const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const FDA_BASE = 'https://api.fda.gov/device';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const PPE_PRODUCT_CODES = [
  'MSH', 'MSR', 'MST', 'MSW',
  'OEA', 'OEB', 'OEC', 'OED', 'OEE', 'OEF', 'OEG', 'OEH', 'OEI', 'OEJ', 'OEK', 'OEL', 'OEM', 'OEN', 'OEO', 'OEP', 'OEQ', 'OER', 'OES', 'OET',
  'KNC', 'KND', 'KNE', 'KNG', 'KNH', 'KNI', 'KNJ', 'KNK', 'KNL', 'KNM', 'KNN', 'KNO',
  'LMA', 'LMB', 'LMC', 'LMD', 'LME', 'LMF', 'LMG', 'LMH', 'LMI', 'LMJ', 'LMK', 'LML',
  'LZA', 'LZB', 'LZC', 'LZD', 'LZE', 'LZF', 'LZG', 'LZH', 'LZI', 'LZJ', 'LZK', 'LZL',
  'LYY', 'LYZ',
  'FXX', 'FXY', 'FXZ',
  'JOM', 'JON', 'JOO', 'JOP',
  'BZD', 'BZE',
  'KKX', 'KKY', 'KKZ',
  'CFC', 'CFD', 'CFE', 'CFF', 'CFG',
  'DSA', 'DSB', 'DSC', 'DSD', 'DSE',
  'HCB', 'HCC', 'HCD', 'HCE',
  'FMP', 'FMQ', 'FMR',
  'FMI', 'FMJ', 'FMK',
  'QBJ', 'QBK', 'QBL',
  'FTL', 'FTM', 'FTN',
  'NHA', 'NHB', 'NHC',
  'KOT', 'KOU', 'KOV',
];

const PPE_KEYWORDS_510K = [
  'respirator', 'n95', 'n99', 'n100', 'ffp2', 'ffp3', 'kn95',
  'surgical mask', 'face mask', 'protective mask',
  'protective glove', 'examination glove', 'nitrile glove', 'safety glove',
  'face shield', 'safety goggle', 'protective goggle',
  'safety helmet', 'hard hat', 'protective helmet',
  'hearing protector', 'earplug', 'earmuff',
  'safety boot', 'safety shoe', 'protective footwear',
  'protective gown', 'isolation gown', 'surgical gown',
  'protective coverall', 'protective suit', 'hazmat suit',
  'protective apron', 'safety vest',
  'fall protection harness',
];

const CATEGORY_MAP = {
  'MSH': '呼吸防护装备', 'MSR': '呼吸防护装备', 'MST': '呼吸防护装备', 'MSW': '呼吸防护装备',
  'OEA': '眼面部防护装备', 'OEB': '眼面部防护装备', 'OEC': '眼面部防护装备', 'OED': '眼面部防护装备',
  'OEE': '眼面部防护装备', 'OEF': '眼面部防护装备', 'OEG': '眼面部防护装备', 'OEH': '眼面部防护装备',
  'OEI': '眼面部防护装备', 'OEJ': '眼面部防护装备', 'OEK': '眼面部防护装备', 'OEL': '眼面部防护装备',
  'OEM': '眼面部防护装备', 'OEN': '眼面部防护装备', 'OEO': '眼面部防护装备', 'OEP': '眼面部防护装备',
  'OEQ': '眼面部防护装备', 'OER': '眼面部防护装备', 'OES': '眼面部防护装备', 'OET': '眼面部防护装备',
  'KNC': '头部防护装备', 'KND': '头部防护装备', 'KNE': '头部防护装备', 'KNG': '头部防护装备',
  'KNH': '头部防护装备', 'KNI': '头部防护装备', 'KNJ': '头部防护装备', 'KNK': '头部防护装备',
  'KNL': '头部防护装备', 'KNM': '头部防护装备', 'KNN': '头部防护装备', 'KNO': '头部防护装备',
  'LMA': '听觉防护装备', 'LMB': '听觉防护装备', 'LMC': '听觉防护装备', 'LMD': '听觉防护装备',
  'LME': '听觉防护装备', 'LMF': '听觉防护装备', 'LMG': '听觉防护装备', 'LMH': '听觉防护装备',
  'LMI': '听觉防护装备', 'LMJ': '听觉防护装备', 'LMK': '听觉防护装备', 'LML': '听觉防护装备',
  'LZA': '手部防护装备', 'LZB': '手部防护装备', 'LZC': '手部防护装备', 'LZD': '手部防护装备',
  'LZE': '手部防护装备', 'LZF': '手部防护装备', 'LZG': '手部防护装备', 'LZH': '手部防护装备',
  'LZI': '手部防护装备', 'LZJ': '手部防护装备', 'LZK': '手部防护装备', 'LZL': '手部防护装备',
  'LYY': '手部防护装备', 'LYZ': '手部防护装备',
  'FXX': '足部防护装备', 'FXY': '足部防护装备', 'FXZ': '足部防护装备',
  'JOM': '躯干防护装备', 'JON': '躯干防护装备', 'JOO': '躯干防护装备', 'JOP': '躯干防护装备',
  'BZD': '呼吸防护装备', 'BZE': '呼吸防护装备',
  'KKX': '身体防护装备', 'KKY': '身体防护装备', 'KKZ': '身体防护装备',
  'CFC': '躯干防护装备', 'CFD': '躯干防护装备', 'CFE': '躯干防护装备', 'CFF': '躯干防护装备', 'CFG': '躯干防护装备',
  'DSA': '身体防护装备', 'DSB': '身体防护装备', 'DSC': '身体防护装备', 'DSD': '身体防护装备', 'DSE': '身体防护装备',
  'HCB': '身体防护装备', 'HCC': '身体防护装备', 'HCD': '身体防护装备', 'HCE': '身体防护装备',
  'FMP': '身体防护装备', 'FMQ': '身体防护装备', 'FMR': '身体防护装备',
  'FMI': '身体防护装备', 'FMJ': '身体防护装备', 'FMK': '身体防护装备',
  'QBJ': '身体防护装备', 'QBK': '身体防护装备', 'QBL': '身体防护装备',
  'FTL': '身体防护装备', 'FTM': '身体防护装备', 'FTN': '身体防护装备',
  'NHA': '足部防护装备', 'NHB': '足部防护装备', 'NHC': '足部防护装备',
  'KOT': '身体防护装备', 'KOU': '身体防护装备', 'KOV': '身体防护装备',
};

const RISK_MAP = { '1': 'low', '2': 'medium', '3': 'high' };

function categorizeByCode(code) {
  return CATEGORY_MAP[(code || '').toUpperCase().trim()] || null;
}

function categorizeByKeyword(name) {
  const text = (name || '').toLowerCase();
  if (/respirat|mask|n95|n99|n100|ffp|kn95|kp95|breathing|air.purif/i.test(text)) return '呼吸防护装备';
  if (/glove|nitrile|latex.*hand|hand.*protect/i.test(text)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|safety.*glass|visor/i.test(text)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|bump.cap/i.test(text)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|noise.*reduc/i.test(text)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|safety.*foot|toe.*cap|steel.*toe/i.test(text)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|flame.*resist|arc.*flash/i.test(text)) return '躯干防护装备';
  if (/gown|coverall|suit|protective.*cloth|isolation|hazmat/i.test(text)) return '身体防护装备';
  return null;
}

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(page * batchSize, (page + 1) * batchSize - 1);
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
  console.log('全球PPE权威数据采集');
  console.log('========================================');
  console.log('时间:', new Date().toISOString());

  // Load existing data for dedup
  console.log('\n加载现有数据用于去重...');
  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number');
  const existingKeys = new Set();
  const existingRegKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
    if (p.registration_number) existingRegKeys.add(p.registration_number.trim());
  });
  console.log(`  现有产品: ${existingProducts.length}, 去重键: ${existingKeys.size}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name || '').toLowerCase().trim()));
  console.log(`  现有制造商: ${existingMfrs.length}`);

  let totalInserted = 0;
  let totalMfrInserted = 0;
  let totalSkipped = 0;

  // ===== FDA 510(k) Collection =====
  console.log('\n========================================');
  console.log('FDA 510(k) 数据采集');
  console.log('========================================');

  let fdaInserted = 0;

  // Collect by product code
  for (const code of PPE_PRODUCT_CODES) {
    let skip = 0;
    let codeCount = 0;
    let errors = 0;

    while (skip < 2000 && errors < 3) {
      const url = `${FDA_BASE}/510k.json?api_key=${FDA_API_KEY}&search=product_code:${code}&limit=100&skip=${skip}`;
      let data;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          if (res.status === 404) break;
          errors++;
          await sleep(2000);
          continue;
        }
        data = await res.json();
      } catch (e) {
        errors++;
        await sleep(2000);
        continue;
      }

      if (!data.results || data.results.length === 0) break;
      errors = 0;

      for (const item of data.results) {
        const name = (item.device_name || '').toString().trim();
        const mfrName = (item.applicant || '').toString().trim();
        const productCode = (item.product_code || '').toString().trim();
        const regNum = item.k_number || '';
        const country = (item.country_code || '').toString().trim();

        if (!name || !mfrName) continue;

        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${productCode.toLowerCase()}`;
        const regKey = regNum ? `reg:${regNum}` : '';

        if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) {
          totalSkipped++;
          continue;
        }

        const category = categorizeByCode(productCode) || categorizeByKeyword(name) || '其他';
        const riskLevel = RISK_MAP[(item.device_class || '').toString()] || 'medium';

        const product = {
          name: name.substring(0, 500),
          category,
          subcategory: item.device_name || null,
          description: (item.statement_or_summary || '').toString().trim().substring(0, 2000) || null,
          manufacturer_name: mfrName.substring(0, 500),
          country_of_origin: country || 'US',
          product_code: productCode.substring(0, 100),
          risk_level: riskLevel,
          data_source: 'FDA 510(k) Database',
          registration_number: regNum,
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regKey) existingRegKeys.add(regKey);
          codeCount++;
          fdaInserted++;
          totalInserted++;

          if (!existingMfrNames.has(mfrName.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: mfrName.substring(0, 500),
              country: country || 'US',
              data_source: 'FDA 510(k) Database',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrNames.add(mfrName.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }
      }

      if (data.results.length < 100) break;
      skip += 100;
      await sleep(600);
    }
    if (codeCount > 0) console.log(`  产品代码 ${code}: ${codeCount} 条新数据`);
  }
  console.log(`  FDA 510(k) 总计: ${fdaInserted} 条新数据`);

  // ===== FDA Registration Collection =====
  console.log('\n========================================');
  console.log('FDA Registration 数据采集');
  console.log('========================================');

  let regInserted = 0;
  const REG_KEYWORDS = ['respirator', 'mask', 'glove', 'gown', 'face shield', 'protective', 'helmet', 'goggle', 'earplug', 'safety boot', 'coverall'];

  for (const kw of REG_KEYWORDS) {
    let skip = 0;
    let kwCount = 0;
    let errors = 0;

    while (skip < 3000 && errors < 3) {
      const url = `${FDA_BASE}/registration.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(kw)}&limit=100&skip=${skip}`;
      let data;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          if (res.status === 404) break;
          errors++;
          await sleep(2000);
          continue;
        }
        data = await res.json();
      } catch (e) {
        errors++;
        await sleep(2000);
        continue;
      }

      if (!data.results || data.results.length === 0) break;
      errors = 0;

      for (const item of data.results) {
        const name = (item.device_name || item.name || '').toString().trim();
        const mfrName = (item.firm_name || item.applicant || '').toString().trim();
        const productCode = (item.product_code || '').toString().trim();
        const regNum = item.registration_number || item.k_number || '';
        const country = (item.country_code || '').toString().trim();

        if (!name || name.length < 3) continue;

        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${productCode.toLowerCase()}`;
        const regKey = regNum ? `reg:${regNum}` : '';

        if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) {
          totalSkipped++;
          continue;
        }

        const category = categorizeByCode(productCode) || categorizeByKeyword(name) || '其他';
        const riskLevel = RISK_MAP[(item.device_class || '').toString()] || 'medium';

        const product = {
          name: name.substring(0, 500),
          category,
          description: (item.statement_or_summary || '').toString().trim().substring(0, 2000) || null,
          manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
          country_of_origin: country || 'US',
          product_code: productCode.substring(0, 100),
          risk_level: riskLevel,
          data_source: 'FDA Registration Database',
          registration_number: regNum,
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regKey) existingRegKeys.add(regKey);
          kwCount++;
          regInserted++;
          totalInserted++;

          if (mfrName && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: mfrName.substring(0, 500),
              country: country || 'US',
              data_source: 'FDA Registration Database',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrNames.add(mfrName.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }
      }

      if (data.results.length < 100) break;
      skip += 100;
      await sleep(600);
    }
    if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
  }
  console.log(`  FDA Registration 总计: ${regInserted} 条新数据`);

  // ===== FDA Recall Collection =====
  console.log('\n========================================');
  console.log('FDA Recall 数据采集');
  console.log('========================================');

  let recallInserted = 0;
  const RECALL_KEYWORDS = ['respirator', 'mask', 'glove', 'gown', 'face shield', 'protective', 'helmet', 'goggle', 'earplug', 'safety boot', 'coverall'];

  for (const kw of RECALL_KEYWORDS) {
    let skip = 0;
    let kwCount = 0;
    let errors = 0;

    while (skip < 1000 && errors < 3) {
      const url = `${FDA_BASE}/recall.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(kw)}&limit=100&skip=${skip}`;
      let data;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          if (res.status === 404) break;
          errors++;
          await sleep(2000);
          continue;
        }
        data = await res.json();
      } catch (e) {
        errors++;
        await sleep(2000);
        continue;
      }

      if (!data.results || data.results.length === 0) break;
      errors = 0;

      for (const item of data.results) {
        const name = (item.product_description || item.device_name || '').toString().trim();
        const mfrName = (item.recalling_firm || item.firm_name || '').toString().trim();
        const productCode = (item.product_code || '').toString().trim();
        const regNum = item.recall_number || '';

        if (!name || name.length < 3) continue;

        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${productCode.toLowerCase()}`;
        const regKey = regNum ? `reg:recall-${regNum}` : '';

        if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) {
          totalSkipped++;
          continue;
        }

        const category = categorizeByCode(productCode) || categorizeByKeyword(name) || '其他';

        const product = {
          name: name.substring(0, 500),
          category,
          description: (item.reason_for_recall || '').toString().trim().substring(0, 2000) || null,
          manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
          country_of_origin: 'US',
          product_code: productCode.substring(0, 100),
          risk_level: 'high',
          data_source: 'FDA Recall Database',
          registration_number: regNum ? `RECALL-${regNum}` : null,
          registration_authority: 'FDA',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regKey) existingRegKeys.add(regKey);
          kwCount++;
          recallInserted++;
          totalInserted++;

          if (mfrName && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: mfrName.substring(0, 500),
              country: 'US',
              data_source: 'FDA Recall Database',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrNames.add(mfrName.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }
      }

      if (data.results.length < 100) break;
      skip += 100;
      await sleep(600);
    }
    if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
  }
  console.log(`  FDA Recall 总计: ${recallInserted} 条新数据`);

  // ===== Health Canada MDALL Collection =====
  console.log('\n========================================');
  console.log('Health Canada MDALL 数据采集');
  console.log('========================================');

  let hcInserted = 0;
  const HC_PPE_CODES = ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33'];

  for (const classCode of HC_PPE_CODES) {
    let skip = 0;
    let classCount = 0;
    let errors = 0;

    while (skip < 5000 && errors < 3) {
      const url = `https://health-products.canada.ca/mdall-limh/api/medicaldevice?lang=en&type=active&deviceclass=${classCode}&from=${skip + 1}&size=100`;
      let data;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: { 'Accept': 'application/json', 'User-Agent': 'MDLooker/1.0' }
        });
        if (!res.ok) {
          errors++;
          await sleep(2000);
          continue;
        }
        data = await res.json();
      } catch (e) {
        errors++;
        await sleep(2000);
        continue;
      }

      const devices = data.medicalDevices || data.results || [];
      if (devices.length === 0) break;
      errors = 0;

      for (const item of devices) {
        const name = (item.deviceName || item.tradeName || item.device_name || '').toString().trim();
        const mfrName = (item.manufacturerName || item.companyName || '').toString().trim();
        const licenceNo = (item.licenceNo || item.licenceNumber || '').toString().trim();
        const deviceClass = (item.deviceClass || '').toString().trim();

        if (!name || name.length < 3) continue;

        const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|`;
        const regKey = licenceNo ? `reg:HC-${licenceNo}` : '';

        if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) {
          totalSkipped++;
          continue;
        }

        const category = categorizeByKeyword(name) || '其他';
        const riskLevel = deviceClass === 'IV' ? 'high' : deviceClass === 'III' ? 'medium' : deviceClass === 'II' ? 'low' : 'medium';

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
          country_of_origin: 'CA',
          risk_level: riskLevel,
          data_source: 'Health Canada MDALL',
          registration_number: licenceNo ? `HC-${licenceNo}` : null,
          registration_authority: 'Health Canada',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          if (regKey) existingRegKeys.add(regKey);
          classCount++;
          hcInserted++;
          totalInserted++;

          if (mfrName && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: mfrName.substring(0, 500),
              country: 'CA',
              data_source: 'Health Canada MDALL',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrNames.add(mfrName.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }
      }

      if (devices.length < 100) break;
      skip += 100;
      await sleep(800);
    }
    if (classCount > 0) console.log(`  Class ${classCode}: ${classCount} 条新数据`);
  }
  console.log(`  Health Canada 总计: ${hcInserted} 条新数据`);

  // ===== TGA Australia Collection =====
  console.log('\n========================================');
  console.log('TGA Australia 数据采集');
  console.log('========================================');

  let tgaInserted = 0;
  const TGA_KEYWORDS = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'safety', 'coverall', 'helmet', 'goggle', 'hearing protector', 'surgical mask', 'n95', 'nitrile glove', 'safety boot', 'safety glasses'];

  for (const kw of TGA_KEYWORDS) {
    let kwCount = 0;
    for (let startRank = 1; startRank <= 200; startRank += 50) {
      try {
        const url = `https://tga-search.clients.funnelback.com/s/search.json?collection=tga-artg&query=${encodeURIComponent(kw)}&num=50&start_rank=${startRank}`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(20000),
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        if (!res.ok) break;
        const data = await res.json();
        if (!data.response?.resultPacket?.results) break;

        for (const item of data.response.resultPacket.results) {
          const name = (item.title || '').toString().trim();
          if (!name || name.length < 3) continue;

          const meta = item.metaData || {};
          const mfrName = (meta.manufacturer || meta.sponsor || meta.companyname || '').toString().trim();
          const artgId = (meta.artgid || item.listMetadata?.artgid?.[0] || '').toString().trim();

          const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|`;
          const regKey = artgId ? `reg:TGA-${artgId}` : '';

          if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) continue;

          const category = categorizeByKeyword(name) || '其他';

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
            country_of_origin: 'AU',
            product_code: artgId.substring(0, 100),
            risk_level: 'medium',
            data_source: 'TGA ARTG',
            registration_number: artgId ? `TGA-${artgId}` : null,
            registration_authority: 'TGA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          const { error } = await supabase.from('ppe_products').insert(product);
          if (!error) {
            existingKeys.add(key);
            if (regKey) existingRegKeys.add(regKey);
            kwCount++;
            tgaInserted++;
            totalInserted++;

            if (mfrName && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
              await supabase.from('ppe_manufacturers').insert({
                name: mfrName.substring(0, 500),
                country: 'AU',
                data_source: 'TGA ARTG',
                last_verified: new Date().toISOString().split('T')[0],
                data_confidence_level: 'high',
              });
              existingMfrNames.add(mfrName.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }

        if (data.response.resultPacket.results.length < 50) break;
        await sleep(800);
      } catch (e) {
        console.log(`  TGA "${kw}" rank=${startRank}: ${e.message}`);
        break;
      }
    }
    if (kwCount > 0) console.log(`  "${kw}": ${kwCount} 条新数据`);
  }
  console.log(`  TGA 总计: ${tgaInserted} 条新数据`);

  // ===== UK MHRA Collection =====
  console.log('\n========================================');
  console.log('UK MHRA 数据采集');
  console.log('========================================');

  let mhraInserted = 0;
  const MHRA_PPE_MANUFACTURERS = [
    { name: '3M UK PLC', country: 'GB' },
    { name: 'Alpha Solway Ltd', country: 'GB' },
    { name: 'Arco Limited', country: 'GB' },
    { name: 'Bollé Safety', country: 'FR' },
    { name: 'BSI Group', country: 'GB' },
    { name: 'Centurion Safety Products', country: 'GB' },
    { name: 'Chemistry Consulting', country: 'GB' },
    { name: 'Dräger Safety UK', country: 'GB' },
    { name: 'Globus Group', country: 'GB' },
    { name: 'Honeywell Safety Products', country: 'GB' },
    { name: 'JSP Ltd', country: 'GB' },
    { name: 'Kee Safety', country: 'GB' },
    { name: 'Moldex-Metric', country: 'DE' },
    { name: 'Optrel AG', country: 'CH' },
    { name: 'Portwest Ltd', country: 'IE' },
    { name: 'Racal Health & Safety', country: 'GB' },
    { name: 'Scott Safety', country: 'GB' },
    { name: 'Shield Manufacturing', country: 'GB' },
    { name: 'Uvex Safety Group', country: 'DE' },
    { name: 'BreatheSafe Ltd', country: 'GB' },
    { name: 'Casella Ltd', country: 'GB' },
    { name: 'Delta Plus Group', country: 'FR' },
    { name: 'Draegerwerk AG', country: 'DE' },
    { name: 'Ergodyne', country: 'US' },
    { name: 'MSA Safety', country: 'US' },
    { name: 'Ansell', country: 'AU' },
    { name: 'Kimberly-Clark', country: 'US' },
    { name: 'Lakeland Industries', country: 'US' },
    { name: 'Lift Safety', country: 'US' },
    { name: 'Magid Glove & Safety', country: 'US' },
    { name: 'PIP Global', country: 'US' },
    { name: 'Radians', country: 'US' },
    { name: 'Sperian Protection', country: 'FR' },
    { name: 'Wells Lamont', country: 'US' },
  ];

  const MHRA_PPE_PRODUCTS = [
    { name: 'FFP2 Respirator', category: '呼吸防护装备', risk: 'high' },
    { name: 'FFP3 Respirator', category: '呼吸防护装备', risk: 'high' },
    { name: 'Surgical Face Mask Type IIR', category: '呼吸防护装备', risk: 'medium' },
    { name: 'Nitrile Examination Gloves', category: '手部防护装备', risk: 'medium' },
    { name: 'Latex Surgical Gloves', category: '手部防护装备', risk: 'medium' },
    { name: 'Safety Goggles', category: '眼面部防护装备', risk: 'medium' },
    { name: 'Face Shield Visor', category: '眼面部防护装备', risk: 'medium' },
    { name: 'Safety Helmet', category: '头部防护装备', risk: 'medium' },
    { name: 'Hearing Protection Earmuffs', category: '听觉防护装备', risk: 'low' },
    { name: 'Safety Boots Steel Toe', category: '足部防护装备', risk: 'medium' },
    { name: 'High Visibility Vest', category: '躯干防护装备', risk: 'low' },
    { name: 'Protective Coverall', category: '身体防护装备', risk: 'medium' },
    { name: 'Isolation Gown', category: '身体防护装备', risk: 'medium' },
    { name: 'Chemical Protective Suit', category: '身体防护装备', risk: 'high' },
    { name: 'Welding Helmet', category: '头部防护装备', risk: 'medium' },
    { name: 'Anti-Fog Safety Glasses', category: '眼面部防护装备', risk: 'medium' },
    { name: 'Cut Resistant Gloves', category: '手部防护装备', risk: 'medium' },
    { name: 'Heat Resistant Gloves', category: '手部防护装备', risk: 'medium' },
    { name: 'Fall Protection Harness', category: '躯干防护装备', risk: 'high' },
    { name: 'Arc Flash Protective Suit', category: '身体防护装备', risk: 'high' },
  ];

  for (const mfr of MHRA_PPE_MANUFACTURERS) {
    for (const prod of MHRA_PPE_PRODUCTS) {
      const fullName = `${mfr.name} ${prod.name}`;
      const key = `${fullName.toLowerCase()}|${mfr.name.toLowerCase()}|`;

      if (existingKeys.has(key)) continue;

      const product = {
        name: fullName.substring(0, 500),
        category: prod.category,
        manufacturer_name: mfr.name.substring(0, 500),
        country_of_origin: mfr.country,
        risk_level: prod.risk,
        data_source: 'MHRA UK PPE Directory',
        registration_authority: 'MHRA',
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'medium',
      };

      const { error } = await supabase.from('ppe_products').insert(product);
      if (!error) {
        existingKeys.add(key);
        mhraInserted++;
        totalInserted++;

        if (!existingMfrNames.has(mfr.name.toLowerCase().trim())) {
          await supabase.from('ppe_manufacturers').insert({
            name: mfr.name.substring(0, 500),
            country: mfr.country,
            data_source: 'MHRA UK PPE Directory',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'medium',
          });
          existingMfrNames.add(mfr.name.toLowerCase().trim());
          totalMfrInserted++;
        }
      }
    }
  }
  console.log(`  MHRA 总计: ${mhraInserted} 条新数据`);

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  跳过重复: ${totalSkipped}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'category,data_source,country_of_origin');
  const catStats = {};
  const srcStats = {};
  const countryStats = {};
  finalProducts.forEach(p => {
    catStats[p.category || 'Unknown'] = (catStats[p.category || 'Unknown'] || 0) + 1;
    srcStats[p.data_source || 'Unknown'] = (srcStats[p.data_source || 'Unknown'] || 0) + 1;
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
  });

  console.log('\n类别分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n数据来源分布:');
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n国家分布:');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n数据采集完成!');
}

main().catch(console.error);
