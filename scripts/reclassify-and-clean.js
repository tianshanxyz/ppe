const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CATEGORY_RULES = [
  { category: '呼吸防护装备', keywords: ['respirator', 'mask', 'n95', 'n99', 'n100', 'ffp1', 'ffp2', 'ffp3', 'kn95', 'kp95', 'filtering facepiece', 'air purifying', 'supplied air', 'scba', 'breathing', 'particulate respirat', 'surgical mask', 'face mask', 'dust mask', 'gas mask', 'cartridge respirat', 'half mask', 'full facepiece'] },
  { category: '手部防护装备', keywords: ['glove', 'gloves', 'hand protection', 'nitrile', 'latex glove', 'vinyl glove', 'cut resistant', 'chemical resistant glove', 'exam glove', 'surgical glove', 'work glove', 'protective glove', 'heat resistant glove', 'anti static glove'] },
  { category: '眼面部防护装备', keywords: ['goggle', 'goggles', 'eye protection', 'face shield', 'faceshield', 'safety glasses', 'spectacle', 'visor', 'eye guard', 'splash guard', 'laser eye', 'welding lens', 'eye wash'] },
  { category: '头部防护装备', keywords: ['helmet', 'hard hat', 'head protection', 'bump cap', 'welding helmet', 'cranial', 'scalp protection', 'hair net', 'head guard'] },
  { category: '听觉防护装备', keywords: ['earplug', 'earmuff', 'hearing protection', 'ear protection', 'noise reduction', 'canal cap', 'hearing band', 'aural', 'ear defender', 'hearing protector'] },
  { category: '足部防护装备', keywords: ['boot', 'shoe', 'foot protection', 'safety footwear', 'toe cap', 'metatarsal', 'anti slip', 'safety toe', 'steel toe', 'composite toe', 'foundry boot', 'chemical boot', 'electrical hazard boot'] },
  { category: '躯干防护装备', keywords: ['vest', 'jacket', 'coat', 'apron', 'coverall', 'body protection', 'high visibility', 'hi vis', 'flame resistant', 'arc flash', 'chemical suit', 'rain suit', 'thermal', 'cooling vest', 'welding apron', 'bibs', 'smock', 'lab coat'] },
  { category: '身体防护装备', keywords: ['gown', 'coverall', 'suit', 'protective apparel', 'isolation', 'surgical gown', 'protective clothing', 'hazmat suit', 'chemical protective', 'biological protective', 'tyvek', 'cover up', 'jump suit'] },
];

const NON_PPE_KEYWORDS = [
  'dental', 'orthopedic', 'implant', 'catheter', 'stent', 'pacemaker',
  'syringe', 'needle', 'infusion pump', 'dialysis', 'endoscope', 'ultrasound',
  'x-ray', 'mri', 'ct scanner', 'defibrillator', 'ventilator',
  'surgical instrument', 'suture', 'wheelchair', 'prosthetic',
  'hearing aid', 'blood pressure monitor', 'thermometer',
  'blood glucose', 'insulin pump', 'ostomy', 'colostomy',
  'electrode', 'ecg', 'ekg', 'electrosurgical', 'cautery',
  'tongue depressor', 'scalpel', 'retractor', 'forceps', 'clamp',
  'drain', 'tube', 'cannula', 'intubation', 'tracheal',
  'bone', 'joint', 'spinal', 'hip', 'knee replacement',
  'breast implant', 'cosmetic', 'laser surgical', 'phaco',
  'dialyzer', 'hemodialysis', 'peritoneal', 'stethoscope',
  'otoscope', 'ophthalmoscope', 'speculum', 'dilator'
];

const PPE_OVERRIDE_KEYWORDS = [
  'glove', 'respirator', 'mask', 'goggle', 'helmet', 'boot', 'shoe',
  'earplug', 'earmuff', 'vest', 'gown', 'coverall', 'apron', 'shield',
  'protection', 'protective', 'safety', 'guard'
];

function categorizeProduct(name, description) {
  const text = `${name || ''} ${description || ''}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) return rule.category;
    }
  }
  return null;
}

function isNonPPE(name, description) {
  const text = `${name || ''} ${description || ''}`.toLowerCase();
  const hasPPEKeyword = PPE_OVERRIDE_KEYWORDS.some(kw => text.includes(kw));
  if (hasPPEKeyword) return false;
  return NON_PPE_KEYWORDS.some(kw => text.includes(kw));
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
  console.log('重新分类"其他"类别 + 清理非PPE产品');
  console.log('========================================');

  // Step 1: 获取所有"其他"类别的产品
  console.log('\nStep 1: 获取"其他"类别产品');
  const otherProducts = await fetchAll('ppe_products', 'id,name,description,category,product_code,manufacturer_name,country_of_origin');
  const otherCategory = otherProducts.filter(p => p.category === '其他');
  console.log(`  "其他"类别产品: ${otherCategory.length}`);

  // Step 2: 重新分类
  console.log('\nStep 2: 重新分类"其他"产品');
  const reclassified = {};
  const nonPPE = [];
  const stillOther = [];

  otherCategory.forEach(p => {
    const newCat = categorizeProduct(p.name, p.description);
    if (newCat) {
      reclassified[newCat] = (reclassified[newCat] || 0) + 1;
    } else if (isNonPPE(p.name, p.description)) {
      nonPPE.push(p);
    } else {
      stillOther.push(p);
    }
  });

  console.log('  可重新分类:');
  Object.entries(reclassified).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`    ${k}: ${v}`);
  });
  console.log(`  非PPE产品: ${nonPPE.length}`);
  console.log(`  仍为"其他": ${stillOther.length}`);

  // Step 3: 执行重新分类
  console.log('\nStep 3: 执行重新分类');
  const reclassifyMap = {};
  otherCategory.forEach(p => {
    const newCat = categorizeProduct(p.name, p.description);
    if (newCat) {
      reclassifyMap[p.id] = newCat;
    }
  });

  let reclassifiedCount = 0;
  const reclassifyIds = Object.keys(reclassifyMap);
  for (let i = 0; i < reclassifyIds.length; i += 500) {
    const batch = reclassifyIds.slice(i, i + 500);
    for (const id of batch) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ category: reclassifyMap[id], product_category: reclassifyMap[id] })
        .eq('id', id);
      if (!error) reclassifiedCount++;
    }
    await sleep(100);
  }
  console.log(`  已重新分类: ${reclassifiedCount}`);

  // Step 4: 删除非PPE产品
  console.log('\nStep 4: 删除非PPE产品');
  const nonPPEIds = nonPPE.map(p => p.id);
  let deletedNonPPE = 0;
  for (let i = 0; i < nonPPEIds.length; i += 500) {
    const batch = nonPPEIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deletedNonPPE += batch.length;
    await sleep(100);
  }
  console.log(`  已删除非PPE产品: ${deletedNonPPE}`);

  // Step 5: 对仍为"其他"的产品做进一步分析
  console.log('\nStep 5: 分析剩余"其他"产品');
  const remainingOther = stillOther.filter(p => !nonPPEIds.includes(p.id));
  console.log(`  剩余"其他"产品: ${remainingOther.length}`);

  // 按product_code分组分析
  const codeGroups = {};
  remainingOther.forEach(p => {
    const code = (p.product_code || 'NO_CODE').substring(0, 3).toUpperCase();
    if (!codeGroups[code]) codeGroups[code] = { count: 0, samples: [] };
    codeGroups[code].count++;
    if (codeGroups[code].samples.length < 3) {
      codeGroups[code].samples.push(p.name);
    }
  });
  console.log('\n  按产品代码前缀分布:');
  Object.entries(codeGroups).sort((a, b) => b[1].count - a[1].count).slice(0, 15).forEach(([code, info]) => {
    console.log(`    ${code}: ${info.count} 条`);
    info.samples.forEach(s => console.log(`      - ${s.substring(0, 80)}`));
  });

  // Step 6: 最终统计
  console.log('\n========================================');
  console.log('清理后最终统计');
  console.log('========================================');
  const { count: finalCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  产品: ${finalCount}`);
  console.log(`  制造商: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'category');
  const finalCatStats = {};
  finalProducts.forEach(p => {
    const cat = p.category || 'Unknown';
    finalCatStats[cat] = (finalCatStats[cat] || 0) + 1;
  });
  console.log('\n  类别分布:');
  Object.entries(finalCatStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`    ${k}: ${v} (${(v/finalCount*100).toFixed(1)}%)`);
  });

  console.log('\n分类与清理完成!');
}

main().catch(console.error);
