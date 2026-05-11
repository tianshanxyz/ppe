#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const trim = v => typeof v === 'string' ? v.trim() : (Array.isArray(v) ? v.join(',').trim() : '');

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

function isNotPPE(name) {
  const n = (name || '').toLowerCase();
  const nonPPEPatterns = [
    /\b(surgical.*instrument|surgical.*kit|surgical.*drill|surgical.*blade|surgical.*scissor|surgical.*forcep|surgical.*clamp|surgical.*retract)\b/i,
    /\b(dental|dentist|orthodont|endodont|periodont)\b/i,
    /\b(implant|prosthe|orthopedic.*nail|bone.*screw|bone.*plate|spinal.*system|hip.*system|knee.*system)\b/i,
    /\b(endoscop|laparoscop|arthroscop|bronchoscop|colonoscop|cystoscop|hysteroscop)\b/i,
    /\b(catheter|stent|dialysis|infusion|syringe|needle|biopsy)\b/i,
    /\b(electrocardiograph|ecg|eeg|emg|ultrasound|ct.*scan|mri|x.?ray)\b/i,
    /\b(defibrillat|pacemaker|ventilat.*machine|anesthesi|monitor.*system)\b/i,
    /\b(suture|staple.*skin|wound.*clos|tissue.*adhes)\b/i,
    /\b(drill.*bit|reamer|saw.*blade|osteotom|chisel|curett|elevat|rasp)\b/i,
    /\b(myringotom|tonsillectom|rhinoplast|septoplast|sinus.*dilat)\b/i,
    /\b(handpiece.*dental|handpiece.*surgical|ultrasonic.*scaler|polishing)\b/i,
    /\b(orthognath|maxillofacial|craniofacial|mandibul)\b/i,
    /\b(flowmeter.*medical|gas.*anesthesi|breathing.*circuit.*anesthesi)\b/i,
    /\b(navigation.*system|robotic.*surg|image.*guid)\b/i,
    /\b(steriliz|autoclav|disinfect.*device)\b/i,
    /\b(patient.*lift|hospital.*bed|wheelchair|stretcher|crutch|walker)\b/i,
    /\b(test.*kit|diagnostic|assay|sample.*collect|swab.*test|rapid.*test)\b/i,
    /\b(suction.*machine|aspirat.*surgical|irrigat.*surgical)\b/i,
    /\b(laser.*surgical|rf.*ablat|cryotherap|hypertherm)\b/i,
  ];
  for (const pattern of nonPPEPatterns) {
    if (pattern.test(n)) return true;
  }
  return false;
}

function classifyPPE(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  const original = name;

  if (/\b(respirat|mask|n95|ffp[123]|scba|breathing|papr|air.?purif|gas.?mask|filter.*cartr|half.?mask|full.?face|supplied.?air|airline|dust.?mask|particulate|smoke.?hood|escape.?hood|powered.*air|cartridge|canister|p100|p99|r95|kn95|kp95|kf94|kf95)\b/i.test(n)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|过滤式|送风式/i.test(original)) return '呼吸防护装备';

  if (/\b(glove|gauntlet|hand.?protect|fingercot|nitrile|latex.*glove|vinyl.*glove|cut.?resist|welding.*glove|chemical.*glove|anti.?static.*glove|examination.*glove|surgical.*glove|finger.*cots?|hand.*guard|palm.*coat|mechanic.*glove|impact.*glove|chainmail|cryogenic.*glove|anti.?vibration)\b/i.test(n)) return '手部防护装备';
  if (/手套|手部防护|防切割/i.test(original)) return '手部防护装备';

  if (/\b(goggle|eye.?protect|face.?shield|visor|spectacle.*protect|welding.*helmet|welding.*mask|safety.*glass|eye.*guard|laser.*protect|auto.?dark|faceshield|chemical.*splash|impact.*eye|side.*shield|welding.*goggle|chip.*guard)\b/i.test(n)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|电焊|防飞溅/i.test(original)) return '眼面部防护装备';

  if (/\b(hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat|construction.*hat|miner.*helmet|electrical.*helmet|vented.*helmet|full.*brim|forestry.*helmet)\b/i.test(n)) return '头部防护装备';
  if (/安全帽|头盔|头部防护/i.test(original)) return '头部防护装备';

  if (/\b(safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|wellington.*safety|clog.*safety|overshoe|chemical.*boot|foundry.*boot|composite.*toe|puncture.*resist|slip.*resist|static.*dissipat|conductive.*shoe|chain.*saw.*boot|logger.*boot|ice.*cleat|spats?|gaiter|toe.*guard)\b/i.test(n)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋|足部防护/i.test(original)) return '足部防护装备';

  if (/\b(earplug|ear.*muff|hearing.*protect|noise.*reduc|aural|band.*ear|electronic.*ear|canal.*cap|ear.*plug|earmuff|ear.*defender|nrr|snr)\b/i.test(n)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(original)) return '听觉防护装备';

  if (/\b(safety.*harness|lanyard|self.?retract|srl|lifeline|fall.*arrest|fall.*protect|anchor.*device|shock.*absorb|retractable|positioning|descender|rescue.*device|climbing.*gear|scaffold.*belt|beam.*clamp|roof.*anchor|horizontal.*lifeline|vertical.*lifeline|confined.*space|tripod|winch|carabiner|snap.*hook|tie.?off|body.*belt|chest.*harness)\b/i.test(n)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线|自锁器|速差器/i.test(original)) return '坠落防护装备';

  if (/\b(coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash.*suit|isolation.*gown|surgical.*gown|protective.*gown|protective.*apron|scrub.*suit|tyvek|tychem|nomex|flash.*suit|fire.*suit|welding.*apron|chemical.*apron|cut.*resist.*sleeve|arm.*guard|knee.*pad|lab.*coat|cleanroom.*coverall|paint.*suit|disposable.*suit|particulate.*suit|bio.*hazard|level.*[abcd].*suit|splash.*suit|thermal.*protect|cold.*stress|cryogenic.*suit|anti.?static.*suit|flame.*resist|fr.*cloth|fire.*resist|fire.*fight|turnout|bunker.*gear|proximity.*suit|aluminized|molten.*metal|foundry.*cloth|leather.*apron|spatter|chaps|bib.*overall|overall|smock|jumpsuit|boiler.*suit)\b/i.test(n)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|防辐射|阻燃|防静电服|防电弧|防寒服|防酸碱|围裙|套袖|护膝|连体服|实验服/i.test(original)) return '身体防护装备';

  if (/\b(hi.?vis.*vest|safety.*vest|reflective.*vest|high.?visibility.*vest|high.?visibility.*jacket|safety.*rainwear|protective.*jacket|safety.*coat|rain.*suit.*protect|surveyor.*vest|mesh.*vest|flagger.*vest|breakaway.*vest|construction.*vest|class.*[123].*vest|fluorescent|neon.*vest|visibility|conspicuity)\b/i.test(n)) return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服|防雨服/i.test(original)) return '躯干防护装备';

  // 次级
  if (/\b(mask|filter|cartridge|breath|air.*purif|dust|fume|vapor|gas.*protect)\b/i.test(n)) return '呼吸防护装备';
  if (/\b(glove|hand|finger|palm|grip|nitrile|latex|vinyl|wrist.*protect)\b/i.test(n)) return '手部防护装备';
  if (/\b(eye|goggle|shield|visor|lens|spectacle|face.*protect|weld|splash|laser.*protect)\b/i.test(n)) return '眼面部防护装备';
  if (/\b(helmet|hat|cap.*protect|head.*protect|bump)\b/i.test(n)) return '头部防护装备';
  if (/\b(boot|shoe|foot|toe.*protect|sole|heel|ankle.*protect|clog|overshoe)\b/i.test(n)) return '足部防护装备';
  if (/\b(ear|hear|noise|sound|decibel|acoustic)\b/i.test(n)) return '听觉防护装备';
  if (/\b(fall|harness|lanyard|anchor|srl|lifeline|arrest|climb|suspend|retract|descend|rescue|carabiner)\b/i.test(n)) return '坠落防护装备';
  if (/\b(suit|gown|coverall|apron|sleeve|arm.*guard|knee.*pad|overall|coat|smock|jumpsuit|flame|fire.*fight|thermal|chemical.*protect|radiation|arc.*flash|isolation|surgical.*gown|lab|cleanroom|disposable|bio.*hazard)\b/i.test(n)) return '身体防护装备';
  if (/\b(vest|jacket|rainwear|parka|poncho|hi.*vis|reflective|visibility)\b/i.test(n)) return '躯干防护装备';

  if (/罩|滤|尘|毒|气.*防护/i.test(original)) return '呼吸防护装备';
  if (/套|手.*防护/i.test(original) && !/套服|套装/i.test(original)) return '手部防护装备';
  if (/镜|屏|面罩/i.test(original)) return '眼面部防护装备';
  if (/帽|盔/i.test(original)) return '头部防护装备';
  if (/鞋|靴|脚/i.test(original)) return '足部防护装备';
  if (/耳|噪/i.test(original)) return '听觉防护装备';
  if (/带|绳|坠|锁|钩/i.test(original)) return '坠落防护装备';
  if (/服|衣|裙|袖|膝|腿/i.test(original)) return '身体防护装备';
  if (/背心|反光|荧光|雨衣/i.test(original)) return '躯干防护装备';

  return null;
}

async function main() {
  console.log('========================================');
  console.log('清理非PPE产品 + 最终分类优化');
  console.log('========================================');

  // ===== 1. 删除明显非PPE产品 =====
  console.log('\n--- 1. 识别并删除非PPE产品 ---');
  const otherProducts = await fetchAll('ppe_products', 'id,name,category,data_source');
  const stillOther = otherProducts.filter(p => p.category === '其他');
  console.log(`  当前"其他"类产品: ${stillOther.length} 条`);

  const nonPPEIds = [];
  const canClassifyIds = {};
  stillOther.forEach(p => {
    if (isNotPPE(p.name)) {
      nonPPEIds.push(p.id);
    } else {
      const newCat = classifyPPE(p.name);
      if (newCat) {
        if (!canClassifyIds[newCat]) canClassifyIds[newCat] = [];
        canClassifyIds[newCat].push(p.id);
      }
    }
  });

  console.log(`  非PPE产品: ${nonPPEIds.length} 条`);
  console.log(`  可分类PPE产品: ${Object.values(canClassifyIds).reduce((a, b) => a + b.length, 0)} 条`);

  // 删除非PPE产品
  let nonPPEDeleted = 0;
  for (let i = 0; i < nonPPEIds.length; i += 500) {
    const batch = nonPPEIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) nonPPEDeleted += batch.length;
    await sleep(100);
  }
  console.log(`  删除非PPE产品: ${nonPPEDeleted} 条`);

  // 分类剩余PPE产品
  let reclassified = 0;
  for (const [cat, ids] of Object.entries(canClassifyIds)) {
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('ppe_products').update({ category: cat }).in('id', batch);
      if (!error) reclassified += batch.length;
      await sleep(100);
    }
    console.log(`  ${cat}: ${ids.length} 条`);
  }
  console.log(`  重新分类: ${reclassified} 条`);

  // ===== 2. 修正误分类 - 检查已分类产品中是否有非PPE =====
  console.log('\n--- 2. 检查已分类产品中的非PPE ---');
  const classifiedProducts = await fetchAll('ppe_products', 'id,name,category');
  const misclassifiedNonPPE = classifiedProducts.filter(p => p.category !== '其他' && isNotPPE(p.name));
  console.log(`  已分类中的非PPE: ${misclassifiedNonPPE.length} 条`);

  let misDeleted = 0;
  const misIds = misclassifiedNonPPE.map(p => p.id);
  for (let i = 0; i < misIds.length; i += 500) {
    const batch = misIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) misDeleted += batch.length;
    await sleep(100);
  }
  console.log(`  删除已分类非PPE: ${misDeleted} 条`);

  // ===== 3. 最终验证 =====
  console.log('\n========== 最终验证 ==========\n');
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  产品总数: ${totalProducts}`);
  console.log(`  制造商总数: ${totalMfrs}`);

  const finalProducts = await fetchAll('ppe_products', 'id,category');
  const catStats = {};
  finalProducts.forEach(p => { const c = p.category || '?'; catStats[c] = (catStats[c] || 0) + 1; });
  console.log('\n  分类分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`    ${c}: ${n} (${((n/totalProducts)*100).toFixed(1)}%)`);
  });

  const otherCount = catStats['其他'] || 0;
  const preciseCount = totalProducts - otherCount;
  console.log(`\n  精确分类率: ${preciseCount}/${totalProducts} (${((preciseCount/totalProducts)*100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('清理与分类完成');
  console.log('========================================');
}

main().catch(console.error);
