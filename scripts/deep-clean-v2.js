const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const PPE_PRODUCT_CODES = [
  'MSH', 'MSR', 'MST', 'MSW', 'OEA', 'OEB', 'OEC', 'OED', 'OEE', 'OEF', 'OEG', 'OEH',
  'OEI', 'OEJ', 'OEK', 'OEL', 'OEM', 'OEN', 'OEO', 'OEP', 'OEQ', 'OER', 'OES', 'OET',
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

const PPE_KEYWORDS_STRICT = [
  'respirator', 'mask', 'n95', 'n99', 'n100', 'ffp1', 'ffp2', 'ffp3', 'kn95',
  'glove', 'gloves', 'nitrile', 'latex glove',
  'goggle', 'goggles', 'face shield', 'faceshield', 'safety glasses', 'eye protection',
  'helmet', 'hard hat', 'head protection',
  'earplug', 'earmuff', 'hearing protection',
  'safety boot', 'safety shoe', 'steel toe', 'toe cap', 'safety footwear',
  'protective gown', 'isolation gown', 'surgical gown', 'coverall', 'protective suit',
  'safety vest', 'high visibility', 'hi-vis', 'hi vis',
  'protective apron', 'welding apron',
  'ppe', 'personal protective', 'protective equipment',
  'face mask', 'surgical mask', 'dust mask',
  'safety helmet', 'bump cap',
  'chemical protective', 'hazmat',
  'fall protection', 'safety harness',
  'cut resistant', 'heat resistant', 'cold resistant',
  'flame resistant', 'arc flash',
  'protective clothing', 'protective apparel',
];

const NON_PPE_KEYWORDS_EXPANDED = [
  'laser', 'co2 laser', 'nd:yag', 'diode laser', 'hair removal',
  'syringe', 'needle', 'cannula', 'catheter', 'stent', 'implant',
  'dialysis', 'hemodialysis', 'peritoneal',
  'endoscope', 'laparoscop', 'arthroscop', 'cystoscop', 'bronchoscop',
  'ultrasound', 'x-ray', 'mri', 'ct scan', 'pet scan', 'fluoroscopy',
  'defibrillator', 'pacemaker', 'ecg', 'ekg', 'electrocardiograph',
  'ventilator', 'respirator device', 'bi-level', 'cpap', 'bipap',
  'infusion pump', 'syringe pump', 'iv pump',
  'blood pressure', 'sphygmomanometer', 'stethoscope',
  'thermometer', 'pulse oximeter', 'oximetry',
  'blood glucose', 'glucometer', 'insulin',
  'hearing aid', 'audiometer', 'cochlear implant',
  'wheelchair', 'walker', 'crutch', 'cane', 'stretcher',
  'surgical instrument', 'scalpel', 'retractor', 'forceps', 'clamp',
  'suture', 'staple', 'ligature',
  'bone', 'orthopedic', 'spinal', 'hip replacement', 'knee replacement',
  'dental', 'tooth', 'orthodontic',
  'breast implant', 'cosmetic', 'plastic surgery',
  'electrosurgical', 'cautery', 'bipolar forceps',
  'culture medium', 'agar', 'petri dish', 'test kit', 'assay',
  'sterilization indicator', 'biological indicator', 'chemical indicator',
  'patient restraint', 'body holder', 'strap restraint',
  'oxygenator', 'heart-lung', 'bypass',
  'tubing', 'iv set', 'administration set', 'extension set',
  'drain', 'suction', 'wound vac',
  'prosthetic', 'prosthesis',
  'otoscope', 'ophthalmoscope', 'speculum', 'dilator',
  'colostomy', 'ostomy', 'urostomy',
  'phaco', 'intraocular lens', 'iol',
  'monitor', 'monitoring system', 'telemetry',
  'electrode', 'sensor', 'transducer',
  'bed', 'mattress', 'cushion',
  'software', 'algorithm', 'ai', 'digital health',
  'test pack', 'process indicator', 'integrator',
  'medium', 'agar', 'broth', 'culture',
  'disposable drape', 'surgical drape', 'surgical towel',
  'trocar', 'cannula', 'obturator',
  'circuit', 'breathing circuit', 'anesthesia circuit',
  'filter - iv', 'blood filter', 'transfusion',
  'microscope', 'slide', 'stain',
  'radiotherapy', 'radiation therapy',
  'contrast', 'injectable', 'contrast agent',
  'disposable pack', 'tray', 'kit - surgical',
  'shaver', 'arthroscopic shaver',
  'ablation', 'rf ablation', 'cryoablation',
  'stapler', 'linear stapler', 'circular stapler',
  'clip applier', 'ligating clip',
  'cement', 'bone cement', 'acrylic cement',
  'mesh', 'hernia mesh', 'surgical mesh',
  'patch', 'vascular patch', 'cardiac patch',
  'graft', 'vascular graft', 'stent graft',
  'valve', 'heart valve', 'prosthetic valve',
  'lead', 'pacing lead', 'electrode lead',
  'generator', 'pulse generator', 'implantable generator',
  'programmer', 'programmer - implantable',
  'accessory - surgical', 'accessory - endoscope',
  'scope', 'flexible scope', 'rigid scope',
  'camera', 'video system', 'image capture',
  'insufflator', 'irrigator',
  'harmonic', 'ultrasonic', 'vessel sealing',
  'biopsy', 'biopsy needle', 'biopsy device',
  'marker', 'tissue marker', 'localization',
  'cryosurgery', 'cryoprobe',
  'lithotripsy', 'shockwave', 'stone',
  'nasogastric', 'feeding tube', 'enteral',
  'tracheostomy', 'tracheal tube', 'airway',
  'intubation', 'laryngoscope', 'stylet',
  'suction', 'aspirator', 'evacuator',
  'injector', 'power injector', 'contrast injector',
  'dissector', 'retractor - surgical',
  'dilator - esophageal', 'dilator - urethral',
  'curettage', 'curette',
  'punch', 'biopsy punch',
  'saw', 'bone saw', 'surgical saw',
  'drill', 'bone drill', 'surgical drill',
  'reamer', 'broach',
  'chisel', 'osteotome', 'rongeur',
  'elevator', 'periosteal elevator',
  'kerrison', 'rongeur - kerrison',
  'pituitary', 'forceps - pituitary',
  'alligator', 'forceps - alligator',
  'scissors', 'surgical scissors',
  'knife', 'surgical knife',
];

function isPPE(name, description, productCode) {
  const text = `${name || ''} ${description || ''}`.toLowerCase();
  const code = (productCode || '').toUpperCase().trim();

  if (PPE_PRODUCT_CODES.includes(code)) return true;

  if (PPE_KEYWORDS_STRICT.some(kw => text.includes(kw))) return true;

  if (NON_PPE_KEYWORDS_EXPANDED.some(kw => text.includes(kw))) return false;

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
  console.log('深度清理非PPE产品');
  console.log('========================================');

  const products = await fetchAll('ppe_products', 'id,name,description,category,product_code,manufacturer_name');
  console.log(`总产品数: ${products.length}`);

  const toDelete = [];
  const toReclassify = {};
  let ppeCount = 0;
  let nonPPECount = 0;
  let uncertainCount = 0;

  products.forEach(p => {
    const result = isPPE(p.name, p.description, p.product_code);
    if (result === true) {
      ppeCount++;
    } else if (result === false) {
      nonPPECount++;
      toDelete.push(p.id);
    } else {
      uncertainCount++;
      if (p.category === '其他') {
        // uncertain and in "其他" category - likely not PPE
      }
    }
  });

  console.log(`  确认PPE: ${ppeCount}`);
  console.log(`  确认非PPE: ${nonPPECount}`);
  console.log(`  不确定: ${uncertainCount}`);
  console.log(`  待删除: ${toDelete.length}`);

  // Execute deletion
  console.log('\n执行删除非PPE产品...');
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 500) {
    const batch = toDelete.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    else console.log(`  批次错误: ${error.message}`);
    await sleep(100);
  }
  console.log(`  已删除: ${deleted}`);

  // Now handle "其他" category products that are still uncertain
  console.log('\n处理"其他"类别中的不确定产品...');
  const otherProducts = products.filter(p => p.category === '其他' && !toDelete.includes(p.id));
  console.log(`  "其他"中剩余: ${otherProducts.length}`);

  // For "其他" products that are uncertain, check if they have any PPE-related product codes
  const otherToDelete = [];
  const otherToKeep = [];
  otherProducts.forEach(p => {
    const code = (p.product_code || '').toUpperCase().trim();
    if (PPE_PRODUCT_CODES.includes(code)) {
      otherToKeep.push(p);
    } else {
      otherToDelete.push(p);
    }
  });
  console.log(`  有PPE产品代码: ${otherToKeep.length}`);
  console.log(`  无PPE产品代码(删除): ${otherToDelete.length}`);

  let deletedOther = 0;
  for (let i = 0; i < otherToDelete.length; i += 500) {
    const batch = otherToDelete.slice(i, i + 500).map(p => p.id);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deletedOther += batch.length;
    await sleep(100);
  }
  console.log(`  已删除不确定"其他"产品: ${deletedOther}`);

  // Final stats
  console.log('\n========================================');
  console.log('深度清理后最终统计');
  console.log('========================================');
  const { count: finalCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  产品: ${products.length} → ${finalCount} (删除 ${products.length - finalCount})`);
  console.log(`  制造商: ${finalMfrCount}`);

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
    console.log(`  ${k}: ${v} (${(v/finalCount*100).toFixed(1)}%)`);
  });

  console.log('\n数据来源分布:');
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalCount*100).toFixed(1)}%)`);
  });

  console.log('\n国家分布:');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalCount*100).toFixed(1)}%)`);
  });

  console.log('\n深度清理完成!');
}

main().catch(console.error);
