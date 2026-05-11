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

function deepClassifyV3(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  const original = name;

  // ===== 呼吸防护 =====
  if (/\b(respirat|mask|n95|ffp[123]|scba|breathing|papr|air.?purif|gas.?mask|filter.*cartr|half.?mask|full.?face.*mask|supplied.?air|airline|ventilat|oxygen.?mask|rebreather|dust.?mask|particulate|smoke.?hood|escape.?hood|cb.?rn.*mask|chemical.*mask|saratoga|powered.*air|purifying|cartridge|canister|breather|air.?mask|face.?piece|snorkel|respir|p100|p99|r95|kn95|kp95|kf94|kf95|ds[12]|dl[12])\b/i.test(n)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|面罩.*呼吸|过滤式|送风式/i.test(original)) return '呼吸防护装备';

  // ===== 手部防护 =====
  if (/\b(glove|gauntlet|hand.?protect|fingercot|sleeve.*protect|nitrile|latex.*glove|vinyl.*glove|cut.?resist|heat.?resist.*glove|welding.*glove|chemical.*glove|anti.?static.*glove|cleanroom.*glove|examination.*glove|surgical.*glove|finger.*cots?|hand.*guard|palm.*coat|dot.*glove|grip.*glove|leather.*palm|mechanic.*glove|impact.*glove|chainmail|chain.*mail|butcher|metal.*mesh|cryogenic.*glove|anti.?vibration|fingerless)\b/i.test(n)) return '手部防护装备';
  if (/手套|手部防护|防切割|耐高温.*手|绝缘.*手/i.test(original)) return '手部防护装备';

  // ===== 眼面部防护 =====
  if (/\b(goggle|eye.?protect|face.?shield|visor|spectacle.*protect|welding.*helmet|welding.*mask|safety.*glass|eye.*guard|laser.*protect|weld.*len|auto.?dark|filter.*len|spoggle|faceshield|face.?screen|chin.*guard|brow.*guard|safety.*goggle|chemical.*splash|impact.*eye|side.*shield|prescription.*safety|over.*glass|magnifying.*safety|welding.*goggle|chip.*guard)\b/i.test(n)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|防护面罩|电焊|焊接.*面|防飞溅/i.test(original)) return '眼面部防护装备';

  // ===== 头部防护 =====
  if (/\b(hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|cap.*protect|head.*protect|broad.?brim|sun.*helmet|hardhat|construction.*hat|miner.*helmet|electrical.*helmet|vented.*helmet|slotted.*helmet|full.*brim|cap.*style|forestry.*helmet|chainsaw.*helmet|equestrian.*helmet|bicycle.*helmet|sport.*helmet)\b/i.test(n)) return '头部防护装备';
  if (/安全帽|头盔|头部防护|防砸帽/i.test(original)) return '头部防护装备';

  // ===== 足部防护 =====
  if (/\b(safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|wellington.*safety|clog.*safety|overshoe|anti.?slip|chemical.*boot|foundry.*boot|electrical.*hazard.*boot|mining.*boot|composite.*toe|aluminum.*toe|puncture.*resist|slip.*resist|static.*dissipat|conductive.*shoe|chain.*saw.*boot|logger.*boot|ice.*cleat|spats?|gaiter|toe.*guard|ankle.*protect|leg.*guard|shin.*guard)\b/i.test(n)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋|足部防护|防砸鞋|防刺穿鞋|绝缘鞋/i.test(original)) return '足部防护装备';

  // ===== 听觉防护 =====
  if (/\b(earplug|ear.*muff|hearing.*protect|hearing.*conserv|noise.*reduc|aural|band.*ear|custom.*ear|electronic.*ear|tactical.*hear|canal.*cap|push.*fit|roll.*down|detectable.*ear|metal.*detect|banded|ear.*seal|nrr|snr|hml|ear.*plug|earplug|earmuff|ear.*defender)\b/i.test(n)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪|隔音|听觉防护/i.test(original)) return '听觉防护装备';

  // ===== 坠落防护 =====
  if (/\b(safety.*harness|lanyard|self.?retract|srl|lifeline|fall.*arrest|fall.*protect|anchor.*device|shock.*absorb|retractable|positioning|descender|rescue.*device|climbing.*gear|scaffold.*belt|beam.*clamp|roof.*anchor|horizontal.*lifeline|vertical.*lifeline|retracting|confined.*space|tripod|winch|davit|carabiner|snap.*hook|rebar.*hook|tie.?off|fall.*restrain|work.*position|body.*belt|chest.*harness|suspension|trauma|relief.*strap)\b/i.test(n)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线|自锁器|速差器|缓冲器|安全网/i.test(original)) return '坠落防护装备';

  // ===== 身体防护 =====
  if (/\b(coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash.*suit|bomb.*suit|radiation.*suit|isolation.*gown|surgical.*gown|protective.*gown|protective.*apron|bibs.*protect|smock.*protect|scrub.*suit|tyvek|tychem|nomex|proshield|flash.*suit|fire.*suit|welding.*apron|chemical.*apron|cut.*resist.*sleeve|arm.*guard|knee.*pad|shin.*guard|lab.*coat|cleanroom.*coverall|paint.*suit|disposable.*suit|particulate.*suit|bio.*hazard|ebola.*suit|level.*[abcd].*suit|encapsulated|splash.*suit|liquid.*protect|thermal.*protect|cold.*stress|cryogenic.*suit|anti.?static.*suit|conductive.*suit|faraday|rf.*protect|microwave.*protect|lead.*apron|x.?ray.*protect|radiation.*apron|flame.*resist|fr.*cloth|fire.*resist|fire.*fight|turnout|bunker.*gear|proximity.*suit|aluminized|molten.*metal|foundry.*cloth|slag|welder.*cloth|leather.*apron|spatter|chaps|bib.*overall|overall|smock|jumpsuit|onesie|boiler.*suit)\b/i.test(n)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|防辐射|阻燃|防静电服|防电弧|防寒服|防酸碱|防油|围裙|套袖|护膝|护腿|连体服|实验服/i.test(original)) return '身体防护装备';

  // ===== 躯干防护 =====
  if (/\b(hi.?vis.*vest|safety.*vest|reflective.*vest|high.?visibility.*vest|high.?visibility.*jacket|safety.*rainwear|protective.*jacket|safety.*coat|rain.*suit.*protect|parka.*safety|surveyor.*vest|mesh.*vest|flagger.*vest|ansi.*107|breakaway.*vest|incident.*command|public.*safety|sheriff|police.*vest|ems.*vest|fire.*vest|construction.*vest|survey.*vest|class.*[123].*vest|silver.*reflect|fluorescent|neon.*vest|orange.*vest|lime.*vest|visibility|conspicuity)\b/i.test(n)) return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服|防雨服|躯干防护/i.test(original)) return '躯干防护装备';

  // ===== 次级匹配 - 更宽松的关键词 =====
  // 呼吸
  if (/\b(mask|filter|cartridge|breath|air|purif|dust|fume|vapor|mist|gas|oxygen|lung|inhale|exhale)\b/i.test(n)) return '呼吸防护装备';
  // 手部
  if (/\b(glove|hand|finger|palm|grip|nitrile|latex|vinyl|cut.*resist|wrist)\b/i.test(n)) return '手部防护装备';
  // 眼面
  if (/\b(eye|goggle|shield|visor|lens|spectacle|face|weld|splash|laser)\b/i.test(n)) return '眼面部防护装备';
  // 头部
  if (/\b(helmet|hat|cap|head|bump|cranial|skull|brain)\b/i.test(n)) return '头部防护装备';
  // 足部
  if (/\b(boot|shoe|foot|toe|sole|heel|ankle|clog|overshoe|spat|gaiter)\b/i.test(n)) return '足部防护装备';
  // 听觉
  if (/\b(ear|hear|noise|sound|decibel|acoustic|auditory|nrr|snr)\b/i.test(n)) return '听觉防护装备';
  // 坠落
  if (/\b(fall|harness|lanyard|anchor|srl|lifeline|arrest|climb|suspend|retract|descend|rescue|carabiner|hook)\b/i.test(n)) return '坠落防护装备';
  // 身体
  if (/\b(suit|gown|coverall|apron|sleeve|arm|knee|shin|overall|coat|smock|jumpsuit|tyvek|nomex|flame|fire.*fight|thermal|chemical.*protect|radiation|arc.*flash|isolation|surgical|scrub|lab|cleanroom|disposable|bio.*hazard)\b/i.test(n)) return '身体防护装备';
  // 躯干
  if (/\b(vest|jacket|rainwear|parka|poncho|hi.*vis|reflective|visibility|conspicuity|ansi.*107|fluorescent|neon)\b/i.test(n)) return '躯干防护装备';

  // ===== 中文次级匹配 =====
  if (/罩|滤|尘|毒|气/i.test(original)) return '呼吸防护装备';
  if (/套|手/i.test(original) && !/套服|套装|套袖/i.test(original)) return '手部防护装备';
  if (/镜|屏/i.test(original)) return '眼面部防护装备';
  if (/帽|盔/i.test(original)) return '头部防护装备';
  if (/鞋|靴|脚/i.test(original)) return '足部防护装备';
  if (/耳|噪/i.test(original)) return '听觉防护装备';
  if (/带|绳|坠|锁|钩/i.test(original)) return '坠落防护装备';
  if (/服|衣|裙|袖|膝|腿/i.test(original)) return '身体防护装备';
  if (/背心|反光|荧光|雨衣|雨披/i.test(original)) return '躯干防护装备';

  return null;
}

async function main() {
  console.log('========================================');
  console.log('深度分类 - "其他"类产品三级分类');
  console.log('========================================');

  const otherProducts = await fetchAll('ppe_products', 'id,name,category');
  const needReclassify = otherProducts.filter(p => p.category === '其他');
  console.log(`"其他"类产品: ${needReclassify.length} 条`);

  // 先统计分类模式
  const sampleNames = needReclassify.slice(0, 100).map(p => p.name);
  console.log('\n前20个"其他"产品名:');
  sampleNames.slice(0, 20).forEach(name => console.log(`  "${name}"`));

  const reclassifyBatches = {};
  for (const p of needReclassify) {
    const newCat = deepClassifyV3(p.name);
    if (newCat) {
      if (!reclassifyBatches[newCat]) reclassifyBatches[newCat] = [];
      reclassifyBatches[newCat].push(p.id);
    }
  }

  console.log('\n分类结果:');
  let reclassified = 0;
  for (const [cat, ids] of Object.entries(reclassifyBatches)) {
    console.log(`  ${cat}: ${ids.length} 条`);
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('ppe_products').update({ category: cat }).in('id', batch);
      if (!error) reclassified += batch.length;
      await sleep(100);
    }
  }
  console.log(`重新分类总计: ${reclassified} 条`);

  // 最终验证
  console.log('\n========== 最终验证 ==========\n');
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const finalProducts = await fetchAll('ppe_products', 'id,category');
  const catStats = {};
  finalProducts.forEach(p => { const c = p.category || '?'; catStats[c] = (catStats[c] || 0) + 1; });
  console.log(`产品总数: ${totalProducts}`);
  console.log('\n分类分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  ${c}: ${n} (${((n/totalProducts)*100).toFixed(1)}%)`);
  });

  const otherCount = catStats['其他'] || 0;
  const preciseCount = totalProducts - otherCount;
  console.log(`\n精确分类率: ${preciseCount}/${totalProducts} (${((preciseCount/totalProducts)*100).toFixed(1)}%)`);
}

main().catch(console.error);
