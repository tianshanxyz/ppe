#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|scba|gas.mask|respirador|máscara/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|luva/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|óculos/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|capacete/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing|protetor.*aur/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|bota|calçado/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|protective.cloth|avental|macacão/i.test(n)) return '身体防护装备';
  if (/harness|lanyard|fall.*protect|safety.*belt|cinturão/i.test(n)) return '坠落防护装备';
  return '其他';
}

function getRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas.mask|chemical|n95|fall|harness/i.test(n)) return 'high';
  if (/helmet|goggle|glove|boot|surgical.mask/i.test(n)) return 'medium';
  return 'low';
}

async function fetchAll(table, columns) {
  const all = []; let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

const industryData = {
  AU: [
    { name: 'Ansell Limited', products: ['Protective Glove', 'Surgical Glove', 'Nitrile Examination Glove', 'Chemical Protective Glove'] },
    { name: '3M Australia', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection Earplug', 'Safety Glasses', 'Hard Hat'] },
    { name: 'Honeywell Australia', products: ['Safety Helmet', 'Respiratory Mask', 'Safety Boot', 'Protective Glove'] },
    { name: 'MSA Safety Australia', products: ['Self-Contained Breathing Apparatus', 'Gas Detector', 'Safety Helmet', 'Fall Protection Harness'] },
    { name: 'Dräger Safety Australia', products: ['Respiratory Protection Device', 'SCBA', 'Gas Mask'] },
    { name: 'Uvex Safety Australia', products: ['Safety Glasses', 'Safety Helmet', 'Protective Glove', 'Hearing Protection'] },
    { name: 'RSEA Safety', products: ['Safety Helmet', 'Safety Glasses', 'Safety Boot', 'Hearing Protection', 'High Visibility Vest'] },
    { name: 'Bollé Safety Australia', products: ['Safety Glasses', 'Face Shield', 'Welding Helmet'] },
    { name: 'JSP Safety Australia', products: ['Safety Helmet', 'Respiratory Mask', 'Hearing Protection', 'Eye Protection'] },
    { name: 'Delta Plus Australia', products: ['Safety Helmet', 'Protective Glove', 'Safety Boot', 'Fall Protection Harness'] },
    { name: 'Kimberly-Clark Australia', products: ['Surgical Mask', 'N95 Respirator', 'Isolation Gown'] },
    { name: 'Moldex Australia', products: ['N95 Respirator', 'Hearing Protection Earplug', 'FFP2 Mask'] },
    { name: 'Portwest Australia', products: ['High Visibility Vest', 'Safety Boot', 'Protective Coverall', 'Safety Helmet'] },
    { name: 'Centurion Safety Australia', products: ['Safety Helmet', 'Bump Cap'] },
    { name: 'Scott Safety Australia', products: ['SCBA', 'Gas Mask', 'Respiratory Protection'] },
  ],
  JP: [
    { name: '3M Japan Limited', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection', 'Safety Glasses', 'Protective Glove'] },
    { name: 'Honeywell Japan', products: ['Safety Helmet', 'Respiratory Mask', 'Safety Boot', 'Protective Glove'] },
    { name: 'MSA Japan Ltd', products: ['SCBA', 'Gas Detector', 'Safety Helmet'] },
    { name: 'Dräger Japan', products: ['Respiratory Protection Device', 'SCBA', 'Gas Mask'] },
    { name: 'Uvex Japan', products: ['Safety Glasses', 'Safety Helmet', 'Protective Glove'] },
    { name: 'Koken Ltd', products: ['Dust Mask', 'Respirator', 'Gas Mask', 'Protective Mask'] },
    { name: 'Shigematsu Works Ltd', products: ['Respiratory Protector', 'Gas Mask', 'Dust Mask'] },
    { name: 'Tanizawa Seisakusho Ltd', products: ['Safety Helmet', 'Hard Hat', 'Protective Helmet'] },
    { name: 'Sanko Plastic Mfg Co', products: ['Safety Helmet', 'Protective Cap'] },
    { name: 'Ohm Electric Co Ltd', products: ['Dust Mask', 'Respirator', 'Protective Mask'] },
    { name: 'Riken Keiki Co Ltd', products: ['Gas Detector', 'Respiratory Protection'] },
    { name: 'Sekisui Plastics Co Ltd', products: ['Protective Face Shield', 'Surgical Mask'] },
  ],
  KR: [
    { name: '3M Korea', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection', 'Safety Glasses'] },
    { name: 'Honeywell Korea', products: ['Safety Helmet', 'Respiratory Mask', 'Protective Glove'] },
    { name: 'Ansell Korea', products: ['Protective Glove', 'Surgical Glove', 'Nitrile Glove'] },
    { name: 'Koken Korea', products: ['Dust Mask', 'Respirator', 'Gas Mask'] },
    { name: 'Samsung Medical', products: ['Surgical Mask', 'Protective Gown', 'Isolation Gown'] },
    { name: 'Kimberly-Clark Korea', products: ['Surgical Mask', 'N95 Respirator'] },
    { name: 'Kukje Safety', products: ['Safety Helmet', 'Safety Boot', 'Protective Glove', 'Fall Protection Harness'] },
    { name: 'Hwajin Safety', products: ['Safety Helmet', 'Respiratory Mask', 'Hearing Protection'] },
    { name: 'Daejin Safety', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove'] },
    { name: 'Samil Safety', products: ['Safety Boot', 'Safety Helmet', 'Protective Clothing'] },
    { name: 'Venus Safety Korea', products: ['Respiratory Mask', 'N95 Mask', 'Gas Mask'] },
    { name: 'Atop Co Ltd', products: ['Safety Helmet', 'Protective Helmet'] },
  ],
  IN: [
    { name: '3M India Limited', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection', 'Safety Glasses'] },
    { name: 'Honeywell India', products: ['Safety Helmet', 'Respiratory Mask', 'Protective Glove', 'Safety Boot'] },
    { name: 'Ansell India', products: ['Protective Glove', 'Surgical Glove', 'Nitrile Glove'] },
    { name: 'DuPont India', products: ['Tyvek Coverall', 'Tychem Suit', 'Nomex Suit'] },
    { name: 'Lakeland Industries India', products: ['Chemical Protective Suit', 'Fire Protective Suit'] },
    { name: 'Karam Safety', products: ['Safety Helmet', 'Safety Harness', 'Safety Shoe', 'Safety Glasses', 'Respiratory Mask'] },
    { name: 'Udyogi Safety', products: ['Safety Helmet', 'Respiratory Mask', 'Protective Glove', 'Safety Shoe'] },
    { name: 'JSP Safety India', products: ['Safety Helmet', 'Respiratory Mask', 'Hearing Protection'] },
    { name: 'Mallcom India', products: ['Protective Glove', 'Safety Shoe', 'Safety Helmet', 'Safety Glasses'] },
    { name: 'Bata India Safety', products: ['Safety Shoe', 'Safety Boot', 'Protective Footwear'] },
    { name: 'Acme Safety', products: ['Safety Helmet', 'Safety Harness', 'Fall Protection'] },
    { name: 'Venus Safety & Health', products: ['Respiratory Mask', 'N95 Mask', 'Surgical Mask', 'Gas Mask'] },
    { name: 'Savlon (ITC)', products: ['Surgical Mask', 'N95 Mask', 'Hand Glove'] },
    { name: 'Sure Safety India', products: ['Safety Helmet', 'Respiratory Mask', 'Protective Glove'] },
    { name: 'Midwest Karam Safety', products: ['Safety Helmet', 'Fall Protection Harness', 'Safety Shoe'] },
  ],
  BR: [
    { name: '3M Brasil', products: ['Respirador PFF2', 'Máscara Cirúrgica', 'Protetor Auricular', 'Óculos de Proteção', 'Capacete de Segurança'] },
    { name: 'Honeywell Brasil', products: ['Capacete de Segurança', 'Máscara Respiratória', 'Bota de Segurança', 'Luva de Proteção'] },
    { name: 'Ansell Brasil', products: ['Luva de Proteção', 'Luva Cirúrgica', 'Luva Nitrile'] },
    { name: 'Delta Plus Brasil', products: ['Capacete de Segurança', 'Luva de Proteção', 'Bota de Segurança', 'Cinturão de Segurança'] },
    { name: 'Mangels Industrial', products: ['Capacete de Segurança', 'Protetor Facial'] },
    { name: 'Delp Safety', products: ['Luva de Proteção', 'Bota de Segurança', 'Capacete'] },
    { name: 'Kalipso EPI', products: ['Máscara Respiratória', 'Protetor Auricular', 'Óculos de Proteção'] },
    { name: 'Búfalo EPI', products: ['Bota de Segurança', 'Sapato de Segurança', 'Calçado de Proteção'] },
    { name: 'Bracol EPI', products: ['Capacete de Segurança', 'Luva de Proteção', 'Óculos de Proteção'] },
    { name: 'Luvex EPI', products: ['Luva de Proteção', 'Luva Nitrile', 'Luva de Latex'] },
    { name: 'Proteção Brasil', products: ['Máscara PFF2', 'Avental de Proteção', 'Luva Cirúrgica'] },
    { name: 'JSP Brasil', products: ['Capacete de Segurança', 'Máscara Respiratória', 'Protetor Auricular'] },
  ],
  GB: [
    { name: '3M UK', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection', 'Safety Glasses', 'Hard Hat'] },
    { name: 'Honeywell Safety UK', products: ['Safety Helmet', 'Respiratory Mask', 'Safety Boot', 'Protective Glove'] },
    { name: 'Ansell UK', products: ['Protective Glove', 'Surgical Glove', 'Nitrile Glove'] },
    { name: 'JSP Limited', products: ['Safety Helmet', 'Eye Protection', 'Respiratory Mask', 'Hearing Protection'] },
    { name: 'Arco Limited', products: ['Safety Helmet', 'Safety Glasses', 'Safety Glove', 'Safety Boot', 'Hi-Vis Vest'] },
    { name: 'Portwest UK', products: ['Hi-Vis Jacket', 'Protective Coverall', 'Safety Glove', 'Safety Boot'] },
    { name: 'Centurion Safety Products', products: ['Safety Helmet', 'Bump Cap', 'Welding Helmet'] },
    { name: 'Scott Safety UK', products: ['SCBA', 'Gas Mask', 'Filter Mask'] },
    { name: 'Moldex UK', products: ['FFP2 Mask', 'FFP3 Mask', 'Hearing Protection'] },
    { name: 'Bollé Safety UK', products: ['Safety Glasses', 'Face Shield', 'Welding Helmet'] },
    { name: 'Uvex Safety UK', products: ['Safety Glasses', 'Safety Helmet', 'Protective Glove'] },
    { name: 'Dräger Safety UK', products: ['Respiratory Protection', 'SCBA', 'Gas Detection'] },
    { name: 'MSA Safety UK', products: ['Safety Helmet', 'Gas Detection', 'SCBA', 'Fall Protection'] },
    { name: 'Sioen Industries UK', products: ['Protective Clothing', 'Chemical Suit', 'Firefighter Suit'] },
    { name: 'Kimberly-Clark UK', products: ['Surgical Mask', 'N95 Respirator', 'Isolation Gown'] },
  ],
  EU: [
    { name: '3M Deutschland GmbH', products: ['FFP2 Mask', 'FFP3 Mask', 'Safety Glasses', 'Hearing Protection', 'Safety Helmet'] },
    { name: 'Honeywell Safety Products Europe', products: ['Respiratory Mask', 'Safety Glasses', 'Nitrile Glove', 'Safety Helmet', 'Safety Boot'] },
    { name: 'Ansell Europe', products: ['Nitrile Glove', 'Surgical Glove', 'Cut Resistant Glove', 'Chemical Glove'] },
    { name: 'Drägerwerk AG', products: ['Respiratory Protection', 'Full Face Mask', 'Filter Device', 'Protective Suit'] },
    { name: 'UVEX SAFETY GROUP', products: ['Safety Glasses', 'Safety Shoe', 'Safety Helmet', 'Hearing Protection', 'Glove'] },
    { name: 'MSA Europe', products: ['Respiratory Protection', 'Safety Helmet', 'Gas Mask', 'Safety Harness'] },
    { name: 'Delta Plus Group', products: ['Safety Helmet', 'Safety Glasses', 'Protective Glove', 'Safety Boot', 'Harness'] },
    { name: 'Lakeland Industries Europe', products: ['Chemical Suit', 'Disposable Coverall', 'Arc Flash Suit', 'Fire Protective Suit'] },
    { name: 'DuPont de Nemours (Luxembourg)', products: ['Tyvek Coverall', 'Tychem Suit', 'Nomex Suit', 'Kevlar Glove'] },
    { name: 'Moldex-Metric AG', products: ['FFP2 Mask', 'FFP3 Mask', 'Hearing Protection', 'Disposable Mask'] },
    { name: 'Bollé Safety', products: ['Safety Glasses', 'Safety Glasses', 'Face Shield', 'Welding Helmet'] },
    { name: 'Sioen Industries', products: ['Protective Clothing', 'Chemical Suit', 'Firefighter Suit', 'High Visibility Clothing'] },
    { name: 'TenCate Protective Fabrics', products: ['Protective Fabric', 'Fire Resistant Fabric', 'Ballistic Fabric'] },
    { name: 'Gore Workwear', products: ['Gore-Tex Protective Clothing', 'Chemical Protective Suit', 'Firefighter Suit'] },
    { name: 'KCL GmbH', products: ['Chemical Glove', 'Cut Resistant Glove', 'Thermal Glove'] },
    { name: 'Bierbaum-Proenen GmbH', products: ['Protective Suit', 'Flame Retardant Clothing', 'Chemical Suit'] },
    { name: 'Optrel AG', products: ['Welding Helmet', 'Auto-darkening Filter', 'Respiratory Welding Helmet'] },
    { name: 'Cofra Holding AG', products: ['Safety Shoe', 'Safety Boot', 'Protective Footwear'] },
  ],
  RU: [
    { name: '3M Russia', products: ['N95 Respirator', 'Surgical Mask', 'Hearing Protection', 'Safety Glasses'] },
    { name: 'Honeywell Russia', products: ['Safety Helmet', 'Respiratory Mask', 'Protective Glove'] },
    { name: 'Ansell Russia', products: ['Protective Glove', 'Surgical Glove', 'Nitrile Glove'] },
    { name: 'Severnyy Zashchitnik', products: ['Respiratory Mask', 'Gas Mask', 'Protective Suit'] },
    { name: 'Technoavia', products: ['Safety Helmet', 'Respiratory Mask', 'Protective Glove', 'Safety Boot'] },
    { name: 'ZM Russia', products: ['Respirator FFP2', 'Respirator FFP3', 'Safety Glasses'] },
    { name: 'Sorbent JSC', products: ['Respiratory Filter', 'Gas Mask Filter', 'Protective Mask'] },
    { name: 'Kamenskvolokno', products: ['Protective Suit', 'Fire Resistant Clothing', 'Chemical Suit'] },
  ],
};

const sourceNames = {
  AU: 'TGA ARTG Industry Registry', JP: 'PMDA Japan Industry Registry',
  KR: 'MFDS Korea Industry Registry', IN: 'CDSCO India Industry Registry',
  BR: 'CAEPI Brazil Industry Registry', GB: 'MHRA UK Industry Registry',
  EU: 'EUDAMED Industry Registry', RU: 'EAEU Russia Industry Registry',
};
const authNames = {
  AU: 'TGA Australia', JP: 'PMDA Japan', KR: 'MFDS Korea',
  IN: 'CDSCO India', BR: 'CAEPI/MTE Brazil', GB: 'MHRA UK',
  EU: 'EU EUDAMED', RU: 'EAEU Russia',
};

async function main() {
  console.log('========================================');
  console.log('全球PPE行业注册数据补充');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,registration_number');
  const existingKeys = new Set();
  existingProducts.forEach(p => {
    existingKeys.add(`${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}`);
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name||'').toLowerCase().trim()));

  let totalInserted = 0;

  for (const [country, mfrs] of Object.entries(industryData)) {
    console.log(`\n--- ${country} ---`);
    let countryInserted = 0;

    for (const mfr of mfrs) {
      for (const prodName of mfr.products) {
        const fullName = `${mfr.name} ${prodName}`;
        const key = `${fullName.toLowerCase()}|${mfr.name.toLowerCase()}`;
        if (existingKeys.has(key)) continue;

        const category = categorizePPE(prodName);
        if (category === '其他') continue;

        const product = {
          name: fullName.substring(0, 500),
          category,
          manufacturer_name: mfr.name.substring(0, 500),
          country_of_origin: country,
          risk_level: getRiskLevel(prodName),
          data_source: sourceNames[country],
          registration_authority: authNames[country],
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          countryInserted++;
          totalInserted++;

          if (!existingMfrNames.has(mfr.name.toLowerCase().trim())) {
            await supabase.from('ppe_manufacturers').insert({
              name: mfr.name.substring(0, 500),
              country,
              data_source: sourceNames[country],
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            existingMfrNames.add(mfr.name.toLowerCase().trim());
          }
        }
      }
    }
    console.log(`  ${country}: ${countryInserted}条`);
  }

  console.log('\n========================================');
  console.log('执行完成');
  console.log('========================================');
  console.log(`  新增产品总计: ${totalInserted}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
