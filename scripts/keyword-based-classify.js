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

function classifyByKeywords(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  const original = name;

  // 非PPE关键词 - 删除
  const nonPPEKeywords = [
    'screw', 'plate', 'femoral', 'cannulated', 'threaded', 'locking',
    'orthopedic', 'bone', 'spinal', 'hip', 'knee replacement',
    'dental', 'implant', 'prosthesis', 'stent', 'catheter',
    'endoscop', 'laparoscop', 'arthroscop', 'biopsy',
    'scalpel', 'retract', 'forcep', 'clamp', 'surgical instrument',
    'drill bit', 'saw blade', 'osteotom', 'chisel',
    'suture', 'staple', 'wound clos',
    'pacemaker', 'defibrillat', 'ventilat machine',
    'wheelchair', 'stretcher', 'hospital bed',
    'ultrasound', 'x-ray', 'ct scan', 'mri',
    'dialysis', 'infusion pump', 'syringe',
    'breast implant', 'augment', 'cosmetic',
  ];
  for (const kw of nonPPEKeywords) {
    if (n.includes(kw)) return 'DELETE';
  }

  // PPE分类 - 基于高频词分析
  // 听觉防护 - earmuffs, earplug, hearing
  if (/\b(earmuff|earplug|hearing|noise|acoustic|nrr|snr|aural)\b/i.test(n)) return '听觉防护装备';
  if (/耳塞|耳罩|听力|降噪/i.test(original)) return '听觉防护装备';

  // 眼面部防护 - glasses, goggles, shield
  if (/\b(glasses|goggle|eye|shield|visor|spectacle|lens|faceshield|splash|welding)\b/i.test(n)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|电焊/i.test(original)) return '眼面部防护装备';

  // 足部防护 - toe, boot, shoe
  if (/\b(toe|boot|shoe|foot|sole|heel|clog|overshoe|gaiter|spat|wellington)\b/i.test(n)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋|足部/i.test(original)) return '足部防护装备';

  // 坠落防护 - anclaje, largo, harness, fall
  if (/\b(anclaje|largo|harness|fall|lanyard|anchor|srl|lifeline|arrest|climb|retract|descend|carabiner|tripod|posicionamiento)\b/i.test(n)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落|生命线/i.test(original)) return '坠落防护装备';

  // 手部防护 - glove, hand
  if (/\b(glove|hand|finger|palm|grip|nitrile|latex|vinyl|wrist|cut.?resist)\b/i.test(n)) return '手部防护装备';
  if (/手套|手部防护|防切割/i.test(original)) return '手部防护装备';

  // 呼吸防护 - mask, respirator
  if (/\b(mask|respirat|n95|ffp|scba|breathing|papr|filter|cartridge|dust|fume|vapor|gas)\b/i.test(n)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|过滤/i.test(original)) return '呼吸防护装备';

  // 身体防护 - chemical, coverall, suit, gown
  if (/\b(chemical|coverall|suit|gown|apron|sleeve|overall|smock|jumpsuit|tyvek|nomex|flame|thermal|radiation|arc|isolation|disposable|bio.?hazard|hazmat|fire.?fight|turnout|bunker|aluminized|provena|cold.?stress|cryogenic)\b/i.test(n)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|防辐射|阻燃|防静电|防电弧|防寒|防酸碱|围裙|连体服/i.test(original)) return '身体防护装备';

  // 头部防护 - helmet, hard hat
  if (/\b(helmet|hard.?hat|bump.?cap|head.?protect|hardhat)\b/i.test(n)) return '头部防护装备';
  if (/安全帽|头盔|头部防护/i.test(original)) return '头部防护装备';

  // 躯干防护 - vest, jacket, hi-vis
  if (/\b(vest|jacket|rainwear|parka|poncho|hi.?vis|reflective|visibility|conspicuity|fluorescent)\b/i.test(n)) return '躯干防护装备';
  if (/反光|背心|荧光|警示|防雨/i.test(original)) return '躯干防护装备';

  // 安全类通用
  if (/\b(safety|protect|guard|ppe|secure|resist)\b/i.test(n)) {
    if (/\b(ear|hear|noise)\b/i.test(n)) return '听觉防护装备';
    if (/\b(eye|face|goggle|glass)\b/i.test(n)) return '眼面部防护装备';
    if (/\b(head|helmet|hat|cap)\b/i.test(n)) return '头部防护装备';
    if (/\b(hand|glove|finger)\b/i.test(n)) return '手部防护装备';
    if (/\b(foot|boot|shoe|toe)\b/i.test(n)) return '足部防护装备';
    if (/\b(fall|harness|anchor|climb)\b/i.test(n)) return '坠落防护装备';
    if (/\b(body|suit|gown|coverall|apron)\b/i.test(n)) return '身体防护装备';
    if (/\b(vest|jacket|rain|vis)\b/i.test(n)) return '躯干防护装备';
    if (/\b(mask|respirat|breath|air)\b/i.test(n)) return '呼吸防护装备';
  }

  // comfort关键词 - 可能是PPE配件
  if (/\b(comfort|cushion|pad|insert|liner|replacement|accessory)\b/i.test(n)) {
    if (/\b(ear|hear|noise)\b/i.test(n)) return '听觉防护装备';
    if (/\b(eye|glass|goggle|face)\b/i.test(n)) return '眼面部防护装备';
    if (/\b(head|helmet|hat|cap)\b/i.test(n)) return '头部防护装备';
    if (/\b(hand|glove)\b/i.test(n)) return '手部防护装备';
    if (/\b(foot|boot|shoe|toe|insole)\b/i.test(n)) return '足部防护装备';
    if (/\b(fall|harness)\b/i.test(n)) return '坠落防护装备';
    if (/\b(mask|respirat)\b/i.test(n)) return '呼吸防护装备';
  }

  // 西班牙语PPE关键词
  if (/\b(protecci[oó]n|proteger|seguridad|guante|m[aá]scara|casco|botas?|gafas?|arn[eé]s|cuerda|antica[ií]das?|respirador|tap[oó]n|orejera|chaleco)\b/i.test(n)) return '身体防护装备';
  if (/protecci[oó]n/i.test(n) && /\b(cabeza|mano|pie|o[ií]do|ojo|cuerpo|ca[ií]da)\b/i.test(n)) {
    if (/cabeza/i.test(n)) return '头部防护装备';
    if (/mano|guante/i.test(n)) return '手部防护装备';
    if (/pie|bota/i.test(n)) return '足部防护装备';
    if (/o[ií]do|orejera/i.test(n)) return '听觉防护装备';
    if (/ojo|gafa/i.test(n)) return '眼面部防护装备';
    if (/ca[ií]da|arn[eé]s/i.test(n)) return '坠落防护装备';
    return '身体防护装备';
  }

  return null;
}

async function main() {
  console.log('========================================');
  console.log('基于高频词分析的深度分类');
  console.log('========================================');

  const allProducts = await fetchAll('ppe_products', 'id,name,category');
  const otherProducts = allProducts.filter(p => p.category === '其他');
  console.log(`"其他"类产品: ${otherProducts.length} 条`);

  const deleteIds = [];
  const classifyBatches = {};
  otherProducts.forEach(p => {
    const result = classifyByKeywords(p.name);
    if (result === 'DELETE') {
      deleteIds.push(p.id);
    } else if (result) {
      if (!classifyBatches[result]) classifyBatches[result] = [];
      classifyBatches[result].push(p.id);
    }
  });

  console.log(`\n需删除非PPE: ${deleteIds.length} 条`);
  console.log(`可分类PPE: ${Object.values(classifyBatches).reduce((a, b) => a + b.length, 0)} 条`);

  // 删除
  let deleted = 0;
  for (let i = 0; i < deleteIds.length; i += 500) {
    const batch = deleteIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    await sleep(100);
  }
  console.log(`删除非PPE: ${deleted} 条`);

  // 分类
  let reclassified = 0;
  for (const [cat, ids] of Object.entries(classifyBatches)) {
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('ppe_products').update({ category: cat }).in('id', batch);
      if (!error) reclassified += batch.length;
      await sleep(100);
    }
    console.log(`  ${cat}: ${ids.length} 条`);
  }
  console.log(`重新分类: ${reclassified} 条`);

  // 最终验证
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
  console.log(`\n  精确分类率: ${((totalProducts - otherCount) / totalProducts * 100).toFixed(1)}%`);

  // 分析剩余"其他"类
  const remaining = finalProducts.filter(p => p.category === '其他');
  console.log(`\n  剩余"其他"类: ${remaining.length} 条`);
  console.log('  前20个产品名:');
  const remainingProducts = await fetchAll('ppe_products', 'id,name,category');
  const remainingOther = remainingProducts.filter(p => p.category === '其他');
  remainingOther.slice(0, 20).forEach(p => console.log(`    "${p.name}"`));
}

main().catch(console.error);
