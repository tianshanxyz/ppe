#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_PRODUCT_CODES = {
  respiratory: ['FXX', 'MSH', 'MZC', 'ONW', 'MSE', 'QKR', 'QKS', 'QKT', 'QKU', 'QKV', 'QKW', 'QKX', 'QKY', 'QNZ', 'QPA', 'QPB', 'QPC', 'QPD', 'QPE', 'NSH', 'OHV', 'OUG', 'OUK', 'CCK', 'CCL', 'CCM', 'CCN', 'CCW', 'CCX', 'CCY', 'CCZ', 'CDA'],
  gloves: ['LYY', 'LZA', 'LZC', 'LZD', 'LZE', 'FZQ', 'KGC', 'KGD', 'KGE', 'KGF', 'KGG', 'KGH', 'KGI', 'KGJ', 'KGK', 'KGL', 'KGM', 'KGN', 'KGO', 'KGP', 'KGQ', 'KGR', 'KGS', 'KGT', 'KGU', 'KGV', 'KGW', 'KGX', 'KGY', 'KGZ', 'LZA', 'LZB', 'LZC', 'LZD', 'LZE', 'LZF', 'LZG', 'LZH', 'LZI', 'LZJ', 'LZK', 'LZL', 'LZM', 'LZN', 'LZO', 'LZP', 'LZQ', 'LZR', 'LZS', 'LZT', 'LZU', 'LZV', 'LZW', 'LZX', 'LZY', 'LZZ'],
  gowns: ['QPC', 'QPD', 'QPE', 'FTE', 'FYK', 'FYA', 'FYB', 'FYC', 'FYD', 'FYE', 'FYF', 'FYG', 'FYH', 'FYI', 'FYJ'],
  eye_face: ['FQA', 'FQD', 'FQE', 'FQF', 'FQG', 'FQH', 'FQI', 'FQJ', 'FQK', 'FQL', 'FQM', 'FQN', 'FQO', 'FQP', 'FQQ', 'FQR', 'FQS', 'FQT', 'HFE', 'HFF', 'HFG', 'HFH', 'HFI', 'HFJ', 'HFK', 'HFL', 'HFM', 'HFN', 'HFO', 'HFP', 'HFQ', 'HFR', 'HFS', 'HFT', 'HFU', 'HFV', 'HFW', 'HFX', 'HFY', 'HFZ'],
  head: ['FZM', 'FZN', 'FZO', 'FZP', 'FZQ', 'FZR', 'FZS', 'FZT', 'FZU', 'FZV', 'FZW', 'FZX', 'FZY', 'FZZ', 'GAA', 'GAB', 'GAC', 'GAD', 'GAE', 'GAF', 'GAG', 'GAH', 'GAI', 'GAJ', 'GAK', 'GAL', 'GAM', 'GAN', 'GAO'],
  foot: ['FZA', 'FZB', 'FZC', 'FZD', 'FZE', 'FZF', 'FZG', 'FZH', 'FZI', 'FZJ', 'FZK', 'FZL'],
  hearing: ['GAX', 'GAY', 'GAZ', 'GBA', 'GBB', 'GBC', 'GBD', 'GBE', 'GBF', 'GBG', 'GBH', 'GBI', 'GBJ', 'GBK', 'GBL', 'GBM', 'GBN', 'GBO', 'GBP', 'GBQ', 'GBR', 'GBS', 'GBT', 'GBU', 'GBV', 'GBW', 'GBX', 'GBY', 'GBZ'],
  fall: ['GCA', 'GCB', 'GCC', 'GCD', 'GCE', 'GCF', 'GCG', 'GCH', 'GCI', 'GCJ', 'GCK', 'GCL', 'GCM', 'GCN', 'GCO', 'GCP', 'GCQ', 'GCR', 'GCS', 'GCT', 'GCU', 'GCV', 'GCW', 'GCX', 'GCY', 'GCZ', 'GDA', 'GDB', 'GDC', 'GDD', 'GDE', 'GDF', 'GDG', 'GDH', 'GDI', 'GDJ', 'GDK', 'GDL', 'GDM', 'GDN', 'GDO', 'GDP', 'GDQ', 'GDR', 'GDS', 'GDT', 'GDU', 'GDV', 'GDW', 'GDX', 'GDY', 'GDZ'],
};

const PPE_KEYWORDS = [
  'surgical+mask', 'respirator+n95', 'n95+respirator', 'kn95+mask',
  'protective+glove', 'nitrile+glove', 'examination+glove', 'surgical+glove',
  'protective+gown', 'isolation+gown', 'surgical+gown',
  'face+shield', 'safety+glasses', 'protective+eyewear', 'goggles',
  'hard+hat', 'safety+helmet', 'bump+cap',
  'safety+shoe', 'protective+boot', 'steel+toe',
  'earplug', 'earmuff', 'hearing+protection',
  'fall+protection+harness', 'safety+harness', 'lanyard',
  'protective+clothing', 'coverall', 'chemical+suit',
  'welding+helmet', 'welding+mask',
  'gas+mask', 'self+contained+breathing+apparatus', 'scba',
  'high+visibility+vest', 'reflective+vest',
  'cut+resistant+glove', 'chainmail+glove',
  'arc+flash+suit', 'fire+resistant+clothing',
];

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|n95|kn95|ffp2|ffp3|mask|breathing|scba|gas mask|air purif/i.test(n)) return '呼吸防护装备';
  if (/glove|gloves|hand protect|nitrile|latex|cut.resist/i.test(n)) return '手部防护装备';
  if (/gown|coverall|suit|clothing|apparel|garment|isolation|protective cloth/i.test(n)) return '身体防护装备';
  if (/goggle|shield|eyewear|eye protect|face shield|spectacle/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head protect|bump cap|hood/i.test(n)) return '头部防护装备';
  if (/boot|shoe|foot protect|safety shoe|steel toe|toe protect/i.test(n)) return '足部防护装备';
  if (/earplug|earmuff|hearing protect|ear protect/i.test(n)) return '听觉防护装备';
  if (/harness|lanyard|fall protect|safety belt|safety rope|anchor/i.test(n)) return '坠落防护装备';
  if (/vest|high.vis|reflective|torso/i.test(n)) return '躯干防护装备';
  return '其他';
}

function determineRiskLevel(productCode, name) {
  const n = (name || '').toLowerCase();
  if (/respirat|n95|scba|gas mask|self.contained|breathing/i.test(n)) return 'high';
  if (/surgical|sterile|implant/i.test(n)) return 'high';
  if (/glove|gown|coverall|face shield/i.test(n)) return 'medium';
  if (/hard.hat|safety shoe|earplug|vest/i.test(n)) return 'medium';
  return 'low';
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MDLooker-PPE-Collector/6.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) {
        console.log(`    Rate limited, waiting 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let existingKeys = new Set();

async function loadExistingProducts() {
  console.log('加载现有产品数据用于去重...');
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`已加载 ${existingKeys.size} 条现有产品记录`);
}

function isDuplicate(name, manufacturer, source) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(manufacturer || '').substring(0, 200).toLowerCase().trim()}|${(source || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

function markInserted(name, manufacturer, source) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(manufacturer || '').substring(0, 200).toLowerCase().trim()}|${(source || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

async function insertProduct(product) {
  if (isDuplicate(product.name, product.manufacturer_name, product.data_source)) return false;
  markInserted(product.name, product.manufacturer_name, product.data_source);
  const { error } = await supabase.from('ppe_products').insert(product);
  if (error) {
    if (error.code === '23505') return false;
    return false;
  }
  return true;
}

async function collect510kByProductCodes() {
  console.log('\n========== 1. FDA 510(k) 按产品代码采集 ==========');
  let totalInserted = 0;
  const allCodes = Object.values(PPE_PRODUCT_CODES).flat();
  const uniqueCodes = [...new Set(allCodes)];

  for (const code of uniqueCodes) {
    try {
      let page = 0;
      let codeTotal = 0;
      while (true) {
        const url = `https://api.fda.gov/device/510k.json?search=product_code:${code}&limit=100&skip=${page * 100}`;
        const result = await fetchJSON(url);
        if (!result || !result.results || result.results.length === 0) break;

        for (const item of result.results) {
          const name = item.device_name || '';
          if (!name) continue;
          const category = categorizePPE(name);
          if (category === '其他' && !PPE_KEYWORDS.some(kw => name.toLowerCase().includes(kw.split('+')[0]))) continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (item.applicant || '').substring(0, 500),
            country_of_origin: item.country_code || 'US',
            risk_level: determineRiskLevel(code, name),
            product_code: code,
            registration_number: item.k_number || '',
            registration_authority: 'FDA',
            data_source: 'FDA 510(k) Database',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
            specifications: JSON.stringify({
              k_number: item.k_number || '',
              decision_date: item.decision_date || '',
              review_panel: item.review_panel || '',
              product_code: code,
              regulation_number: item.regulation_number || '',
              device_class: item.device_class || '',
              contact: item.contact || '',
              expedited_review_flag: item.expedited_review_flag || '',
            }),
          };

          if (await insertProduct(product)) { codeTotal++; totalInserted++; }
        }

        if (result.results.length < 100) break;
        page++;
        await sleep(400);
      }
      if (codeTotal > 0) console.log(`    ${code}: ${codeTotal}条`);
      await sleep(300);
    } catch (e) {
      // skip
    }
  }
  console.log(`  510(k)产品代码总计: ${totalInserted}`);
  return totalInserted;
}

async function collect510kByKeywords() {
  console.log('\n========== 2. FDA 510(k) 按关键词采集 ==========');
  let totalInserted = 0;

  for (const keyword of PPE_KEYWORDS) {
    try {
      let page = 0;
      let kwTotal = 0;
      while (page < 10) {
        const url = `https://api.fda.gov/device/510k.json?search=device_name:${keyword}&limit=100&skip=${page * 100}`;
        const result = await fetchJSON(url);
        if (!result || !result.results || result.results.length === 0) break;

        for (const item of result.results) {
          const name = item.device_name || '';
          if (!name) continue;
          const category = categorizePPE(name);
          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (item.applicant || '').substring(0, 500),
            country_of_origin: item.country_code || 'US',
            risk_level: determineRiskLevel(item.product_code, name),
            product_code: item.product_code || '',
            registration_number: item.k_number || '',
            registration_authority: 'FDA',
            data_source: 'FDA 510(k) Database',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
            specifications: JSON.stringify({
              k_number: item.k_number || '',
              decision_date: item.decision_date || '',
              review_panel: item.review_panel || '',
              product_code: item.product_code || '',
              regulation_number: item.regulation_number || '',
            }),
          };

          if (await insertProduct(product)) { kwTotal++; totalInserted++; }
        }

        if (result.results.length < 100) break;
        page++;
        await sleep(400);
      }
      if (kwTotal > 0) console.log(`    ${keyword}: ${kwTotal}条`);
      await sleep(300);
    } catch (e) {
      // skip
    }
  }
  console.log(`  510(k)关键词总计: ${totalInserted}`);
  return totalInserted;
}

async function collectClassificationData() {
  console.log('\n========== 3. FDA 设备分类数据采集 ==========');
  let totalInserted = 0;
  const allCodes = Object.values(PPE_PRODUCT_CODES).flat();
  const uniqueCodes = [...new Set(allCodes)];

  for (const code of uniqueCodes) {
    try {
      const url = `https://api.fda.gov/device/classification.json?search=product_code:${code}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const item of result.results) {
        const name = item.device_name || '';
        if (!name) continue;
        const category = categorizePPE(name);
        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: 'Various',
          country_of_origin: 'US',
          risk_level: item.device_class === '3' ? 'high' : item.device_class === '2' ? 'medium' : 'low',
          product_code: code,
          registration_number: `CLASS-${code}`,
          registration_authority: 'FDA',
          data_source: 'FDA Classification Database',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            device_class: item.device_class || '',
            regulation_number: item.regulation_number || '',
            review_panel: item.review_panel || '',
            medical_specialty: item.medical_specialty_description || '',
            definition: item.definition || '',
          }),
        };

        if (await insertProduct(product)) { totalInserted++; }
      }
      await sleep(300);
    } catch (e) {
      // skip
    }
  }
  console.log(`  分类数据总计: ${totalInserted}`);
  return totalInserted;
}

async function collectRegistrationListing() {
  console.log('\n========== 4. FDA 注册和列名数据采集 ==========');
  let totalInserted = 0;

  for (const keyword of PPE_KEYWORDS.slice(0, 20)) {
    try {
      const url = `https://api.fda.gov/device/registrationlisting.json?search=device_name:${keyword}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const item of result.results) {
        const devices = item.devices || [];
        for (const dev of devices) {
          const name = dev.device_name || dev.generic_name || '';
          if (!name) continue;
          const category = categorizePPE(name);
          if (category === '其他') continue;

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (item.firm_name || '').substring(0, 500),
            country_of_origin: item.country_code || 'US',
            risk_level: determineRiskLevel(dev.product_code, name),
            product_code: dev.product_code || '',
            registration_number: dev.registration_number || item.registration_number || '',
            registration_authority: 'FDA',
            data_source: 'FDA Registration Listing',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
            specifications: JSON.stringify({
              fei_number: item.fei_number || '',
              firm_type: item.firm_type || '',
              device_class: dev.device_class || '',
              regulation_number: dev.regulation_number || '',
            }),
          };

          if (await insertProduct(product)) { totalInserted++; }
        }
      }
      if (totalInserted > 0 && totalInserted % 100 === 0) console.log(`    已采集: ${totalInserted}条`);
      await sleep(400);
    } catch (e) {
      // skip
    }
  }
  console.log(`  注册列名总计: ${totalInserted}`);
  return totalInserted;
}

async function collectRecallData() {
  console.log('\n========== 5. FDA 召回数据采集 ==========');
  let totalInserted = 0;

  for (const keyword of PPE_KEYWORDS) {
    try {
      const url = `https://api.fda.gov/device/recall.json?search=product_description:${keyword}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const item of result.results) {
        const name = item.product_description || '';
        if (!name) continue;
        const category = categorizePPE(name);

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (item.recalling_firm || '').substring(0, 500),
          country_of_origin: 'US',
          risk_level: 'high',
          product_code: item.product_code || '',
          registration_number: item.recall_number || '',
          registration_authority: 'FDA',
          data_source: 'FDA Recall Database',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            recall_number: item.recall_number || '',
            recall_initiation_date: item.recall_initiation_date || '',
            recall_status: item.status || '',
            reason: item.reason_for_recall || '',
            classification: item.classification || '',
            product_quantity: item.product_quantity || '',
            distribution_pattern: item.distribution_pattern || '',
            event_id: item.event_id || '',
          }),
        };

        if (await insertProduct(product)) { totalInserted++; }
      }
      await sleep(400);
    } catch (e) {
      // skip
    }
  }
  console.log(`  召回数据总计: ${totalInserted}`);
  return totalInserted;
}

async function collectMAUDEData() {
  console.log('\n========== 6. FDA MAUDE不良事件数据采集 ==========');
  let totalInserted = 0;

  for (const keyword of PPE_KEYWORDS) {
    try {
      const url = `https://api.fda.gov/device/event.json?search=device.brand_name:${keyword}+OR+device.generic_name:${keyword}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const event of result.results) {
        const device = event.device?.[0] || {};
        const name = device.brand_name || device.generic_name || '';
        if (!name) continue;
        const category = categorizePPE(name);
        if (category === '其他' && !device.device_report_product_code) continue;

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (device.manufacturer_d_name || '').substring(0, 500),
          country_of_origin: 'US',
          risk_level: 'high',
          product_code: device.device_report_product_code || '',
          registration_number: `MAUDE-${event.mdr_report_key || ''}`,
          registration_authority: 'FDA',
          data_source: 'FDA MAUDE',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'medium',
          specifications: JSON.stringify({
            event_type: event.event_type || '',
            report_date: event.date_received || '',
            report_key: event.mdr_report_key || '',
            patient_problems: event.patient?.[0]?.patient_problems || '',
          }),
        };

        if (await insertProduct(product)) { totalInserted++; }
      }
      await sleep(700);
    } catch (e) {
      // skip
    }
  }
  console.log(`  MAUDE数据总计: ${totalInserted}`);
  return totalInserted;
}

async function collectUDIData() {
  console.log('\n========== 7. FDA UDI/GUDID数据采集 ==========');
  let totalInserted = 0;
  const allCodes = Object.values(PPE_PRODUCT_CODES).flat();
  const uniqueCodes = [...new Set(allCodes)].slice(0, 30);

  for (const code of uniqueCodes) {
    try {
      const url = `https://api.fda.gov/device/udi.json?search=product_code:${code}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      for (const item of result.results) {
        const name = item.brand_name || item.gtin || '';
        if (!name) continue;
        const category = categorizePPE(name);

        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (item.company_name || '').substring(0, 500),
          country_of_origin: 'US',
          risk_level: determineRiskLevel(code, name),
          product_code: code,
          registration_number: item.gtin || item.di || '',
          registration_authority: 'FDA',
          data_source: 'FDA GUDID Database',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            gtin: item.gtin || '',
            di: item.di || '',
            version_model: item.version_or_model || '',
            catalog_number: item.catalog_number || '',
            device_count: item.device_count || '',
            is_combination: item.is_combination_product || '',
            sterilization: item.sterilization_method || '',
          }),
        };

        if (await insertProduct(product)) { totalInserted++; }
      }
      await sleep(400);
    } catch (e) {
      // skip
    }
  }
  console.log(`  UDI数据总计: ${totalInserted}`);
  return totalInserted;
}

async function main() {
  console.log('========================================');
  console.log('FDA openFDA 全面PPE数据采集');
  console.log('========================================');
  console.log(`开始时间: ${new Date().toISOString()}`);

  await loadExistingProducts();

  let grandTotal = 0;

  grandTotal += await collect510kByProductCodes();
  grandTotal += await collect510kByKeywords();
  grandTotal += await collectClassificationData();
  grandTotal += await collectRegistrationListing();
  grandTotal += await collectRecallData();
  grandTotal += await collectMAUDEData();
  grandTotal += await collectUDIData();

  console.log('\n========================================');
  console.log(`FDA数据采集完成! 总计新增: ${grandTotal}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
  console.log('========================================');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
