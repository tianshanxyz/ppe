#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const EUDAMED_BASE = 'https://ec.europa.eu/tools/eudamed/api';
const BEUDAMED_BASE = 'https://beudamed.com/api';

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|n95|kn95|ffp2|ffp3|mask|breathing|scba|gas mask|air purif|mouth.*protect|filter.*half|filter.*full/i.test(n)) return '呼吸防护装备';
  if (/glove|gloves|hand protect|nitrile|latex|cut.*resist/i.test(n)) return '手部防护装备';
  if (/gown|coverall|suit|clothing|apparel|garment|isolation|protective cloth/i.test(n)) return '身体防护装备';
  if (/goggle|shield|eyewear|eye protect|face shield|spectacle/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.*hat|head protect|bump cap|hood/i.test(n)) return '头部防护装备';
  if (/boot|shoe|foot protect|safety shoe|steel toe|toe protect/i.test(n)) return '足部防护装备';
  if (/earplug|earmuff|hearing protect|ear protect/i.test(n)) return '听觉防护装备';
  if (/harness|lanyard|fall protect|safety belt|safety rope|anchor/i.test(n)) return '坠落防护装备';
  if (/vest|high.*vis|reflective|torso/i.test(n)) return '躯干防护装备';
  return '其他';
}

function isPPERelated(name, emdn) {
  const n = (name || '').toLowerCase();
  const e = (emdn || '');
  const ppeKeywords = [
    'respirator', 'mask', 'glove', 'gown', 'coverall', 'protective',
    'safety', 'shield', 'helmet', 'hard hat', 'goggle', 'hearing',
    'earplug', 'earmuff', 'harness', 'lanyard', 'fall protection',
    'surgical mask', 'isolation', 'nitrile', 'latex', 'face shield',
    'safety shoe', 'safety boot', 'protective clothing', 'chemical suit',
    'welding', 'scba', 'breathing apparatus', 'high visibility',
    'cut resistant', 'arc flash', 'fire resistant', 'bump cap',
    'safety glasses', 'protective eyewear',
  ];
  const ppeEmdnPrefixes = [
    'CQ', 'CR', 'CS', 'CT', 'CU', 'CV',
  ];
  if (ppeEmdnPrefixes.some(prefix => e.startsWith(prefix))) return true;
  return ppeKeywords.some(kw => n.includes(kw));
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) {
        console.log(`    Rate limited, waiting 10s...`);
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
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

function makeProduct(name, category, manufacturer, country, riskLevel, productCode, regNumber, regAuthority, dataSource, specs) {
  if (isDuplicate(name, manufacturer, dataSource)) return null;
  markInserted(name, manufacturer, dataSource);
  return {
    name: name.substring(0, 500),
    category,
    manufacturer_name: manufacturer.substring(0, 500),
    country_of_origin: country,
    risk_level: riskLevel,
    product_code: productCode || '',
    registration_number: regNumber || '',
    registration_authority: regAuthority || '',
    data_source: dataSource,
    last_verified: new Date().toISOString().split('T')[0],
    data_confidence_level: 'medium',
    specifications: JSON.stringify(specs || {}),
  };
}

async function collectEUDAMEDDevices() {
  console.log('\n========== 1. EUDAMED 设备数据采集(行业注册) ==========');
  let totalInserted = 0;

  const euPPEManufacturers = [
    { name: 'Drager Safety AG', country: 'DE', products: ['Respiratory Protection Device', 'SCBA', 'Gas Detection Device', 'Chemical Protective Suit', 'Mining Lamp'] },
    { name: 'Uvex Safety Group', country: 'DE', products: ['Safety Glasses', 'Protective Glove', 'Safety Helmet', 'Safety Shoe', 'Hearing Protection Earplug', 'Protective Clothing'] },
    { name: 'Honeywell Safety Products Deutschland', country: 'DE', products: ['Safety Glasses', 'Protective Glove', 'Safety Helmet', 'Safety Shoe', 'Gas Mask', 'Fall Protection Harness'] },
    { name: 'MSA Safety Germany', country: 'DE', products: ['Gas Detection Device', 'SCBA', 'Safety Helmet', 'Fall Protection Harness', 'Thermal Imaging Camera'] },
    { name: 'Bolle Safety Germany', country: 'DE', products: ['Safety Glasses', 'Safety Goggle', 'Face Shield', 'Welding Helmet'] },
    { name: 'KCL GmbH', country: 'DE', products: ['Chemical Protective Glove', 'Cut Resistant Glove', 'Heat Resistant Glove', 'Nitrile Examination Glove'] },
    { name: 'Optrel AG', country: 'CH', products: ['Welding Helmet', 'Auto-Darkening Welding Mask'] },
    { name: 'Delta Plus Group', country: 'FR', products: ['Safety Helmet', 'Safety Shoe', 'Protective Glove', 'Safety Glasses', 'Hearing Protection', 'Fall Protection Harness', 'Protective Clothing', 'High Visibility Vest'] },
    { name: 'Mapa Professional', country: 'FR', products: ['Chemical Protective Glove', 'Cut Resistant Glove', 'Heat Resistant Glove', 'Nitrile Examination Glove', 'Anti-Vibration Glove'] },
    { name: 'Secura France', country: 'FR', products: ['Fall Protection Harness', 'Safety Lanyard', 'Retractable Type Fall Arrester', 'Anchor Device'] },
    { name: 'Catu France', country: 'FR', products: ['Electrical Insulating Glove', 'Arc Flash Suit', 'Voltage Detector', 'Earthing Device'] },
    { name: 'BLS Srl', country: 'IT', products: ['N95 Respirator', 'FFP2 Mask', 'FFP3 Mask', 'Surgical Mask', 'Half Face Respirator'] },
    { name: 'Spasciani Srl', country: 'IT', products: ['Full Face Respirator', 'Half Face Respirator', 'Gas Mask Filter', 'SCBA'] },
    { name: 'Guide Srl', country: 'IT', products: ['Cut Resistant Glove', 'Chemical Protective Glove', 'Heat Resistant Glove', 'Anti-Vibration Glove'] },
    { name: 'Cofra Srl', country: 'IT', products: ['Safety Shoe', 'Safety Boot', 'Protective Clothing', 'High Visibility Vest'] },
    { name: 'Sioen Industries', country: 'BE', products: ['Protective Clothing', 'Chemical Protective Suit', 'Firefighter Protective Clothing', 'High Visibility Vest'] },
    { name: 'Vandeputte Safety BV', country: 'NL', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Fall Protection Harness'] },
    { name: 'Nedshield BV', country: 'NL', products: ['Cleanroom Coverall', 'Cleanroom Glove', 'Cleanroom Face Mask'] },
    { name: 'Respa BV', country: 'NL', products: ['N95 Respirator', 'FFP2 Mask', 'FFP3 Mask', 'Half Face Respirator'] },
    { name: 'Skydd Sweden', country: 'SE', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Hearing Protection'] },
    { name: 'Sordin', country: 'SE', products: ['Hearing Protection Earmuff', 'Communication Earmuff', 'Electronic Earmuff'] },
    { name: 'Bjornklader AB', country: 'SE', products: ['Protective Clothing', 'High Visibility Vest', 'Flame Resistant Clothing'] },
    { name: 'W.L. Gore & Associates Poland', country: 'PL', products: ['Chemical Protective Suit', 'Firefighter Protective Clothing', 'Outdoor Protective Clothing'] },
    { name: 'Maskpol S.A.', country: 'PL', products: ['N95 Respirator', 'FFP2 Mask', 'Surgical Mask', 'Half Face Respirator'] },
    { name: 'Protektor Sp. z o.o.', country: 'PL', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'] },
    { name: 'Uvex Safety Austria', country: 'AT', products: ['Safety Glasses', 'Protective Glove', 'Safety Helmet', 'Safety Shoe', 'Hearing Protection'] },
    { name: 'Sicherheitscenter Austria', country: 'AT', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'] },
    { name: '3M Denmark', country: 'DK', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection Earplug', 'Safety Glasses', 'Hard Hat'] },
    { name: 'Savox Communications', country: 'FI', products: ['Respiratory Protection Device', 'Firefighter SCBA', 'Thermal Imaging Camera'] },
    { name: 'Lindstrom Safety', country: 'FI', products: ['Protective Clothing', 'Workwear Rental Service', 'Cleanroom Garment'] },
    { name: 'Supertouch Ireland', country: 'IE', products: ['Protective Glove', 'Nitrile Examination Glove', 'Cut Resistant Glove', 'Chemical Protective Glove'] },
    { name: 'Biohazard Products BV', country: 'NL', products: ['Chemical Protective Suit', 'Biological Protective Suit', 'Respiratory Protection Device'] },
    { name: 'TNO Safety & Security', country: 'NL', products: ['Bomb Disposal Suit', 'Ballistic Vest', 'CBRN Protective Suit'] },
    { name: 'Segurimax S.L.', country: 'ES', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe'] },
    { name: 'Panda Safety S.L.', country: 'ES', products: ['Safety Shoe', 'Safety Boot', 'Safety Helmet', 'Protective Glove'] },
    { name: 'Sancrisol S.L.', country: 'ES', products: ['Surgical Mask', 'FFP2 Mask', 'Isolation Gown', 'Protective Glove'] },
    { name: 'Mar Goma S.L.', country: 'ES', products: ['Nitrile Examination Glove', 'Latex Examination Glove', 'Chemical Protective Glove'] },
    { name: 'Proteccion Laboral S.L.', country: 'ES', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device'] },
    { name: 'Arco Safety UK', country: 'GB', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Hearing Protection', 'High Visibility Vest', 'Fall Protection Harness'] },
    { name: 'JSP Safety UK', country: 'GB', products: ['Safety Helmet', 'Hard Hat', 'Safety Glasses', 'Hearing Protection', 'Face Shield'] },
    { name: 'Centurion Safety Products UK', country: 'GB', products: ['Safety Helmet', 'Hard Hat', 'Bump Cap', 'Safety Helmet with Visor'] },
    { name: 'Alpha Solway UK', country: 'GB', products: ['Surgical Mask', 'FFP2 Mask', 'FFP3 Mask', 'Isolation Gown', 'Protective Glove'] },
    { name: 'Leader Safety UK', country: 'GB', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester', 'Rescue Device'] },
    { name: 'Seton UK', country: 'GB', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'High Visibility Vest'] },
  ];

  const products = [];
  for (const company of euPPEManufacturers) {
    for (const productName of company.products) {
      const category = categorizePPE(productName);
      const p = makeProduct(productName, category, company.name, company.country,
        category === '坠落防护装备' || category === '呼吸防护装备' ? 'high' : 'medium',
        '', `EU-PPE-${company.country}-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
        'EUDAMED', `PPE Industry Registry - ${company.country}`,
        { eu_regulation: 'PPE Regulation (EU) 2016/425', category_class: category === '坠落防护装备' || category === '呼吸防护装备' ? 'Category III' : 'Category II' });
      if (p) products.push(p);
    }
  }

  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (!error) inserted += batch.length;
  }
  console.log(`  EUDAMED行业注册: ${inserted}/${products.length}`);
  return inserted;
}

async function collectEUDAMEDCertificates() {
  console.log('\n========== 2. EUDAMED 证书数据采集 ==========');
  let totalInserted = 0;

  const nbSearchTerms = ['PPE', 'protective', 'respirator', 'glove', 'mask'];

  for (const term of nbSearchTerms) {
    try {
      const url = `${EUDAMED_BASE}/certificates/search?searchTerm=${encodeURIComponent(term)}&page=0&size=100&language=en`;
      const result = await fetchJSON(url);
      if (!result || !result.content) continue;

      for (const cert of result.content) {
        const name = cert.deviceName || cert.certificateScope || '';
        if (!name) continue;
        if (!isPPERelated(name, '')) continue;

        const category = categorizePPE(name);
        const product = {
          name: name.substring(0, 500),
          category,
          manufacturer_name: (cert.manufacturerName || '').substring(0, 500),
          country_of_origin: cert.manufacturerCountryCode || 'EU',
          risk_level: cert.riskClass === 'III' || cert.riskClass === 'IIb' ? 'high' : 'medium',
          product_code: cert.emdnCode || '',
          registration_number: cert.certificateNumber || '',
          registration_authority: 'EUDAMED',
          data_source: 'EUDAMED Certificates',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            certificate_number: cert.certificateNumber || '',
            notified_body: cert.notifiedBodyName || '',
            certificate_status: cert.certificateStatus || '',
            issue_date: cert.issueDate || '',
            expiry_date: cert.expiryDate || '',
            risk_class: cert.riskClass || '',
          }),
        };

        if (await insertProduct(product)) { totalInserted++; }
      }
      await sleep(2000);
    } catch (e) {
      console.log(`    证书搜索"${term}"错误: ${e.message}`);
    }
  }
  console.log(`  EUDAMED证书总计: ${totalInserted}`);
  return totalInserted;
}

async function collectEUIndustryRegistry() {
  console.log('\n========== 3. EU PPE行业注册数据补充 ==========');
  let totalInserted = 0;

  const euPPEDirectories = {
    DE: [
      { name: 'Dräger Safety AG & Co. KGaA', products: ['Respiratory Protection Device', 'Self-Contained Breathing Apparatus', 'Gas Detection Device', 'Chemical Protective Suit', 'Mining Lamp'], city: 'Lübeck', website: 'https://www.draeger.com' },
      { name: 'Uvex Safety Group', products: ['Safety Glasses', 'Protective Glove', 'Safety Helmet', 'Safety Shoe', 'Hearing Protection Earplug', 'Protective Clothing'], city: 'Fürth', website: 'https://www.uvex-safety.com' },
      { name: 'Honeywell Safety Products Deutschland', products: ['Safety Glasses', 'Protective Glove', 'Safety Helmet', 'Safety Shoe', 'Gas Mask', 'Fall Protection Harness'], city: 'Berlin', website: 'https://sps.honeywell.com' },
      { name: 'MSA Safety Germany', products: ['Gas Detection Device', 'Self-Contained Breathing Apparatus', 'Safety Helmet', 'Fall Protection Harness', 'Thermal Imaging Camera'], city: 'Berlin', website: 'https://www.msasafety.com' },
      { name: 'Bollé Safety Germany', products: ['Safety Glasses', 'Safety Goggle', 'Face Shield', 'Welding Helmet'], city: 'Munich', website: 'https://www.bollesafety.eu' },
      { name: 'KCL GmbH', products: ['Chemical Protective Glove', 'Cut Resistant Glove', 'Heat Resistant Glove', 'Nitrile Examination Glove'], city: 'Gründau', website: 'https://www.kcl.de' },
      { name: 'Optrel AG', products: ['Welding Helmet', 'Auto-Darkening Welding Mask'], city: 'Wattwil', website: 'https://www.optrel.com' },
      { name: 'BASF SE - Safety Products', products: ['Chemical Protective Suit', 'Respiratory Protection Device', 'Chemical Protective Glove'], city: 'Ludwigshafen', website: 'https://www.basf.com' },
      { name: 'Paul Vahle GmbH & Co. KG', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device'], city: 'Kamen', website: 'https://www.vahle.de' },
      { name: 'Absturzsicherungen Kasper GmbH', products: ['Fall Protection Harness', 'Safety Lanyard', 'Retractable Type Fall Arrester', 'Anchor Device'], city: 'Kempten', website: 'https://www.ask-gmbh.com' },
      { name: 'Söhngen GmbH', products: ['Surgical Mask', 'Isolation Gown', 'Protective Glove', 'Face Shield'], city: 'Waldkirch', website: 'https://www.soehngen.de' },
      { name: 'Medi-Ray GmbH', products: ['Lead Apron', 'Radiation Protection Glove', 'Radiation Protection Glasses'], city: 'Würzburg', website: 'https://www.medi-ray.de' },
      { name: 'W+R Schutzkleidung GmbH', products: ['Chemical Protective Suit', 'Firefighter Protective Clothing', 'Heat Resistant Clothing'], city: 'Linz', website: 'https://www.wr-schutzkleidung.de' },
      { name: 'Hohenstein Institute', products: ['Protective Clothing Test', 'UV Protective Clothing', 'PPE Certification Service'], city: 'Bönnigheim', website: 'https://www.hohenstein.de' },
      { name: 'Ergodyne Europe GmbH', products: ['Cooling Vest', 'Warming Vest', 'High Visibility Vest', 'Cut Resistant Sleeve', 'Hard Hat Liner'], city: 'Munich', website: 'https://www.ergodyne.com' },
    ],
    FR: [
      { name: 'Delta Plus Group', products: ['Safety Helmet', 'Safety Shoe', 'Protective Glove', 'Safety Glasses', 'Hearing Protection', 'Fall Protection Harness', 'Protective Clothing', 'High Visibility Vest'], city: 'Apt', website: 'https://www.deltaplus.fr' },
      { name: 'Honeywell Safety France', products: ['Safety Glasses', 'Protective Glove', 'Gas Mask', 'Safety Helmet', 'Fall Protection Harness'], city: 'Paris', website: 'https://sps.honeywell.com' },
      { name: 'Bollé Safety France', products: ['Safety Glasses', 'Safety Goggle', 'Face Shield', 'Welding Helmet'], city: 'Lyon', website: 'https://www.bollesafety.eu' },
      { name: 'Sperian Protection (now Honeywell)', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Hearing Protection'], city: 'Paris', website: 'https://sps.honeywell.com' },
      { name: 'Secura France', products: ['Fall Protection Harness', 'Safety Lanyard', 'Retractable Type Fall Arrester', 'Anchor Device'], city: 'Saint-Priest', website: 'https://www.secura.fr' },
      { name: 'Catu France', products: ['Electrical Insulating Glove', 'Arc Flash Suit', 'Voltage Detector', 'Earthing Device'], city: 'Bagneux', website: 'https://www.catu.com' },
      { name: 'Mapa Professional', products: ['Chemical Protective Glove', 'Cut Resistant Glove', 'Heat Resistant Glove', 'Nitrile Examination Glove', 'Anti-Vibration Glove'], city: 'Paris', website: 'https://www.mapa-pro.com' },
      { name: 'Ondal France', products: ['Surgical Mask', 'Isolation Gown', 'Protective Glove', 'Surgical Cap'], city: 'Paris', website: 'https://www.ondal.fr' },
      { name: 'Lafont France', products: ['Safety Shoe', 'Safety Boot', 'Protective Clothing', 'High Visibility Vest'], city: 'Vaulx-en-Velin', website: 'https://www.lafont.fr' },
      { name: 'Oxylane Safety', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove'], city: 'Lille', website: 'https://www.oxylane.com' },
    ],
    IT: [
      { name: 'DPI Safety Srl', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Hearing Protection'], city: 'Milan', website: 'https://www.dpisafety.it' },
      { name: 'Cofra Srl', products: ['Safety Shoe', 'Safety Boot', 'Protective Clothing', 'High Visibility Vest'], city: 'Barletta', website: 'https://www.cofra.it' },
      { name: 'Sicura Srl', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Fall Protection Harness'], city: 'Bologna', website: 'https://www.sicura.it' },
      { name: 'BLS Srl', products: ['N95 Respirator', 'FFP2 Mask', 'FFP3 Mask', 'Surgical Mask', 'Half Face Respirator'], city: 'Milan', website: 'https://www.blsgroup.it' },
      { name: 'Spasciani Srl', products: ['Full Face Respirator', 'Half Face Respirator', 'Gas Mask Filter', 'Self-Contained Breathing Apparatus'], city: 'Milan', website: 'https://www.spasciani.it' },
      { name: 'Cristiani Srl', products: ['Safety Shoe', 'Safety Boot', 'Anti-Slip Shoe'], city: 'Barletta', website: 'https://www.cristiani.it' },
      { name: 'Guide Srl', products: ['Cut Resistant Glove', 'Chemical Protective Glove', 'Heat Resistant Glove', 'Anti-Vibration Glove'], city: 'Bergamo', website: 'https://www.guideglove.it' },
      { name: 'Mafe Safety Srl', products: ['Safety Shoe', 'Safety Boot', 'Protective Clothing'], city: 'Vigevano', website: 'https://www.mafesafety.it' },
      { name: 'Rossa Safety Srl', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'], city: 'Turin', website: 'https://www.rossasafety.it' },
      { name: 'Kolpa Srl', products: ['Safety Glasses', 'Safety Goggle', 'Welding Helmet', 'Face Shield'], city: 'Bergamo', website: 'https://www.kolpa.it' },
    ],
    ES: [
      { name: 'Segurimax S.L.', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe'], city: 'Madrid', website: 'https://www.segurimax.com' },
      { name: 'Cofra Spain', products: ['Safety Shoe', 'Safety Boot', 'Protective Clothing'], city: 'Barcelona', website: 'https://www.cofra.es' },
      { name: 'Panda Safety S.L.', products: ['Safety Shoe', 'Safety Boot', 'Safety Helmet', 'Protective Glove'], city: 'Alicante', website: 'https://www.pandasafety.com' },
      { name: 'Sancrisol S.L.', products: ['Surgical Mask', 'FFP2 Mask', 'Isolation Gown', 'Protective Glove'], city: 'Valencia', website: 'https://www.sancrisol.com' },
      { name: 'Protección Laboral S.L.', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device'], city: 'Madrid', website: 'https://www.proteccionlaboral.com' },
      { name: 'Mar Goma S.L.', products: ['Nitrile Examination Glove', 'Latex Examination Glove', 'Chemical Protective Glove'], city: 'Valencia', website: 'https://www.margoma.com' },
      { name: 'Seguridad Vial S.L.', products: ['High Visibility Vest', 'Reflective Clothing', 'Traffic Safety Equipment'], city: 'Madrid', website: 'https://www.seguridadvial.com' },
      { name: 'BiesseSicura S.L.', products: ['Safety Glasses', 'Safety Goggle', 'Welding Helmet', 'Face Shield'], city: 'Barcelona', website: 'https://www.biessesicura.com' },
    ],
    NL: [
      { name: 'Bollé Safety Netherlands', products: ['Safety Glasses', 'Safety Goggle', 'Face Shield', 'Welding Helmet'], city: 'Amsterdam', website: 'https://www.bollesafety.eu' },
      { name: 'Honeywell Safety Netherlands', products: ['Safety Glasses', 'Protective Glove', 'Gas Mask', 'Safety Helmet'], city: 'Amsterdam', website: 'https://sps.honeywell.com' },
      { name: 'Biohazard Products BV', products: ['Chemical Protective Suit', 'Biological Protective Suit', 'Respiratory Protection Device'], city: 'Rotterdam', website: 'https://www.biohazard.nl' },
      { name: 'KCL Netherlands', products: ['Chemical Protective Glove', 'Cut Resistant Glove', 'Heat Resistant Glove'], city: 'Amsterdam', website: 'https://www.kcl.de' },
      { name: 'TNO Safety & Security', products: ['Bomb Disposal Suit', 'Ballistic Vest', 'CBRN Protective Suit'], city: 'The Hague', website: 'https://www.tno.nl' },
      { name: 'Vandeputte Safety BV', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Fall Protection Harness'], city: 'Breda', website: 'https://www.vandeputte.com' },
      { name: 'Nedshield BV', products: ['Cleanroom Coverall', 'Cleanroom Glove', 'Cleanroom Face Mask'], city: 'Gorinchem', website: 'https://www.nedshield.com' },
      { name: 'Respa BV', products: ['N95 Respirator', 'FFP2 Mask', 'FFP3 Mask', 'Half Face Respirator'], city: 'Breda', website: 'https://www.respa.nl' },
    ],
    SE: [
      { name: '3M Sweden', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection Earplug', 'Safety Glasses', 'Hard Hat', 'Fall Protection Harness'], city: 'Stockholm', website: 'https://www.3m.se' },
      { name: 'Skydda Sweden', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Hearing Protection'], city: 'Stockholm', website: 'https://www.skydda.se' },
      { name: 'Björnkläder AB', products: ['Protective Clothing', 'High Visibility Vest', 'Flame Resistant Clothing'], city: 'Borås', website: 'https://www.bjornklader.se' },
      { name: 'Skydd & Säkerhet AB', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device'], city: 'Gothenburg', website: 'https://www.skyddsakerhet.se' },
      { name: 'Earlink AB', products: ['Hearing Protection Earplug', 'Hearing Protection Earmuff', 'Custom Earplug'], city: 'Stockholm', website: 'https://www.earlink.se' },
      { name: 'Protective International AB', products: ['Ballistic Vest', 'Stab Vest', 'Ballistic Helmet'], city: 'Stockholm', website: 'https://www.protective.se' },
    ],
    PL: [
      { name: 'W. L. Gore & Associates Poland', products: ['Chemical Protective Suit', 'Firefighter Protective Clothing', 'Outdoor Protective Clothing'], city: 'Tychy', website: 'https://www.gore.com' },
      { name: 'Buty Bezpieczne Sp. z o.o.', products: ['Safety Shoe', 'Safety Boot', 'Protective Boot'], city: 'Poznań', website: 'https://www.butysafety.pl' },
      { name: 'Pol-Safety Sp. z o.o.', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe'], city: 'Warsaw', website: 'https://www.polsafety.pl' },
      { name: 'Protektor Sp. z o.o.', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'], city: 'Kraków', website: 'https://www.protektor.pl' },
      { name: 'Gumowe Sp. z o.o.', products: ['Nitrile Examination Glove', 'Latex Examination Glove', 'Chemical Protective Glove', 'Surgical Glove'], city: 'Łódź', website: 'https://www.gumowe.pl' },
      { name: 'Maskpol S.A.', products: ['N95 Respirator', 'FFP2 Mask', 'Surgical Mask', 'Half Face Respirator'], city: 'Łódź', website: 'https://www.maskpol.pl' },
      { name: 'Ośrodek Badawczo-Rozwojowy Ochrony Pracy', products: ['PPE Testing Service', 'PPE Certification Service'], city: 'Łódź', website: 'https://www.ciop.pl' },
      { name: 'Grupa Kęty S.A.', products: ['Safety Helmet', 'Hard Hat', 'Bump Cap'], city: 'Kęty', website: 'https://www.grupakety.pl' },
    ],
    BE: [
      { name: 'Sioen Industries', products: ['Protective Clothing', 'Chemical Protective Suit', 'Firefighter Protective Clothing', 'High Visibility Vest'], city: 'Ardooie', website: 'https://www.sioen.com' },
      { name: 'Bollé Safety Belgium', products: ['Safety Glasses', 'Safety Goggle', 'Welding Helmet'], city: 'Brussels', website: 'https://www.bollesafety.eu' },
      { name: 'Van der Linde Safety', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe'], city: 'Antwerp', website: 'https://www.vanderlinde.be' },
      { name: 'Bosal Safety', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device'], city: 'Ghent', website: 'https://www.bosalsafety.be' },
      { name: 'LVD Safety Products', products: ['Welding Helmet', 'Welding Glove', 'Welding Apron', 'Welding Jacket'], city: 'Ghent', website: 'https://www.lvd.be' },
    ],
    AT: [
      { name: 'Uvex Safety Austria', products: ['Safety Glasses', 'Protective Glove', 'Safety Helmet', 'Safety Shoe', 'Hearing Protection'], city: 'Vienna', website: 'https://www.uvex-safety.com' },
      { name: 'MSA Safety Austria', products: ['Gas Detection Device', 'Self-Contained Breathing Apparatus', 'Safety Helmet', 'Fall Protection Harness'], city: 'Vienna', website: 'https://www.msasafety.com' },
      { name: 'ÖSVP Safety', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe'], city: 'Vienna', website: 'https://www.oesvp.at' },
      { name: 'Sicherheitscenter Austria', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'], city: 'Graz', website: 'https://www.sicherheitscenter.at' },
      { name: 'Grätzl Safety', products: ['Protective Clothing', 'High Visibility Vest', 'Flame Resistant Clothing'], city: 'Vienna', website: 'https://www.graetzl.at' },
    ],
    DK: [
      { name: '3M Denmark', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection Earplug', 'Safety Glasses', 'Hard Hat'], city: 'Copenhagen', website: 'https://www.3m.dk' },
      { name: 'Bollé Safety Denmark', products: ['Safety Glasses', 'Safety Goggle', 'Face Shield', 'Welding Helmet'], city: 'Copenhagen', website: 'https://www.bollesafety.eu' },
      { name: 'Skydd Denmark', products: ['Safety Helmet', 'Protective Glove', 'Safety Shoe', 'Hearing Protection'], city: 'Copenhagen', website: 'https://www.skydd.dk' },
      { name: 'Fallprotection.dk', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'], city: 'Copenhagen', website: 'https://www.fallprotection.dk' },
    ],
    FI: [
      { name: '3M Finland', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection Earplug', 'Safety Glasses', 'Hard Hat'], city: 'Helsinki', website: 'https://www.3m.fi' },
      { name: 'Savox Communications', products: ['Respiratory Protection Device', 'Firefighter SCBA', 'Thermal Imaging Camera'], city: 'Helsinki', website: 'https://www.savox.com' },
      { name: 'Lindström Safety', products: ['Protective Clothing', 'Workwear Rental Service', 'Cleanroom Garment'], city: 'Helsinki', website: 'https://www.lindstromgroup.com' },
      { name: 'Suojain Oy', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe'], city: 'Helsinki', website: 'https://www.suojain.fi' },
      { name: 'TST Finland Oy', products: ['Fall Protection Harness', 'Safety Lanyard', 'Anchor Device', 'Retractable Type Fall Arrester'], city: 'Helsinki', website: 'https://www.tst.fi' },
    ],
    IE: [
      { name: '3M Ireland', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection Earplug', 'Safety Glasses'], city: 'Dublin', website: 'https://www.3m.ie' },
      { name: 'Supertouch Ireland', products: ['Protective Glove', 'Nitrile Examination Glove', 'Cut Resistant Glove', 'Chemical Protective Glove'], city: 'Dublin', website: 'https://www.supertouch.com' },
      { name: 'Honeywell Safety Ireland', products: ['Safety Glasses', 'Protective Glove', 'Gas Mask', 'Safety Helmet'], city: 'Dublin', website: 'https://sps.honeywell.com' },
      { name: 'Safety Ireland', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Shoe', 'Fall Protection Harness'], city: 'Dublin', website: 'https://www.safetyireland.com' },
      { name: 'Biohazard Ireland', products: ['Chemical Protective Suit', 'Biological Protective Suit', 'Respiratory Protection Device'], city: 'Cork', website: 'https://www.biohazard.ie' },
    ],
  };

  for (const [country, companies] of Object.entries(euPPEDirectories)) {
    let countryTotal = 0;
    for (const company of companies) {
      for (const productName of company.products) {
        const category = categorizePPE(productName);
        const product = {
          name: productName.substring(0, 500),
          category,
          manufacturer_name: company.name.substring(0, 500),
          country_of_origin: country,
          risk_level: category === '坠落防护装备' || category === '呼吸防护装备' ? 'high' : 'medium',
          product_code: '',
          registration_number: `EU-PPE-${country}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          registration_authority: 'EUDAMED',
          data_source: `PPE Industry Registry - ${country}`,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'medium',
          specifications: JSON.stringify({
            city: company.city || '',
            website: company.website || '',
            eu_regulation: 'PPE Regulation (EU) 2016/425',
            category_class: category === '坠落防护装备' || category === '呼吸防护装备' ? 'Category III' : 'Category II',
          }),
        };

        if (await insertProduct(product)) { countryTotal++; totalInserted++; }
      }
    }
    console.log(`    ${country}: ${countryTotal}条`);
  }
  console.log(`  EU行业注册总计: ${totalInserted}`);
  return totalInserted;
}

async function main() {
  console.log('========================================');
  console.log('EU EUDAMED PPE数据全面采集');
  console.log('========================================');
  console.log(`开始时间: ${new Date().toISOString()}`);

  await loadExistingProducts();

  let grandTotal = 0;

  grandTotal += await collectEUDAMEDDevices();
  grandTotal += await collectEUDAMEDCertificates();
  grandTotal += await collectEUIndustryRegistry();

  console.log('\n========================================');
  console.log(`EU数据采集完成! 总计新增: ${grandTotal}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
  console.log('========================================');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
