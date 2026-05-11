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

const FAKE_MFR_PATTERNS = [
  'AusSafe', 'OzPPE', 'AUSProtect', 'TGAReg', 'JPNProtect', 'PMDAReg',
  'NihonGuard', 'TokyoSafe', 'KORProtect', 'MFDSReg', 'SeoulGuard',
  'KoreaPPE', 'IndiaSafe', 'BharatPPE', 'HindSafe', 'ProIndia',
  'JapanSafe', 'NihonPPE', 'TokyoGuard', 'OsakaSafe', 'KoreaSafe',
  'KorPPE', 'BusanSafe', 'AusPPE', 'SafeAUS', 'OzSafety', 'AUSGuard',
  'FallSafe', 'FallGuard'
];

function isFakeMfrName(name) {
  if (!name) return false;
  for (const pattern of FAKE_MFR_PATTERNS) {
    if (new RegExp(`^${pattern} \\d{2,3}$`).test(name)) return true;
  }
  return false;
}

function classifyFromProductName(name) {
  if (!name) return null;
  const n = name.toLowerCase();

  if (/\b(earmuff|earplug|ear.?plug|ear.?muff|hearing|noise|acoustic|nrr|snr|aural|level.?dependent)\b/i.test(n)) return '听觉防护装备';
  if (/\b(glasses|goggle|eye.?protect|face.?shield|visor|spectacle|lens|faceshield|splash|welding|auto.?dark|ir.?glass|safety.?glass|prescription.?glass)\b/i.test(n)) return '眼面部防护装备';
  if (/\b(toe|boot|shoe|foot|sole|heel|clog|overshoe|gaiter|spat|wellington|steel.?toe|composite.?toe|safety.?boot|safety.?shoe)\b/i.test(n)) return '足部防护装备';
  if (/\b(harness|fall|lanyard|anchor|srl|lifeline|arrest|climb|retract|descend|carabiner|tripod|descent.?device|shock.?absorb|guardrail|stairway|tower.?climb)\b/i.test(n)) return '坠落防护装备';
  if (/\b(glove|hand|finger|palm|grip|nitrile|latex|vinyl|wrist|cut.?resist|firefighter.?glove)\b/i.test(n)) return '手部防护装备';
  if (/\b(mask|respirat|n95|ffp|scba|breathing|papr|filter|cartridge|dust|fume|vapor|gas|non.?valved|escape.?device|paint.?spray|healthcare.?unit)\b/i.test(n)) return '呼吸防护装备';
  if (/\b(chemical|coverall|suit|gown|apron|sleeve|overall|smock|jumpsuit|tyvek|nomex|flame|thermal|radiation|arc|isolation|disposable|bio.?hazard|hazmat|fire.?fight|turnout|bunker|aluminized|cold.?stress|cryogenic|firefighter.?unit)\b/i.test(n)) return '身体防护装备';
  if (/\b(helmet|hard.?hat|bump.?cap|head.?protect|hardhat|safety.?helmet)\b/i.test(n)) return '头部防护装备';
  if (/\b(vest|jacket|rainwear|parka|poncho|hi.?vis|reflective|visibility|conspicuity|fluorescent)\b/i.test(n)) return '躯干防护装备';

  if (/\b(mold|system|unit|device|kit)\b/i.test(n)) {
    if (/\b(ear|hear|noise|acoustic)\b/i.test(n)) return '听觉防护装备';
    if (/\b(eye|glass|goggle|face|visor|dark)\b/i.test(n)) return '眼面部防护装备';
    if (/\b(foot|boot|shoe|toe)\b/i.test(n)) return '足部防护装备';
    if (/\b(fall|harness|climb|descent|anchor|guardrail)\b/i.test(n)) return '坠落防护装备';
    if (/\b(hand|glove|finger)\b/i.test(n)) return '手部防护装备';
    if (/\b(mask|respirat|breath|air|filter|valve|escape|spray)\b/i.test(n)) return '呼吸防护装备';
    if (/\b(suit|gown|coverall|fire|chemical|thermal|isolation)\b/i.test(n)) return '身体防护装备';
    if (/\b(helmet|hat|head)\b/i.test(n)) return '头部防护装备';
    if (/\b(vest|jacket|rain|vis|reflective)\b/i.test(n)) return '躯干防护装备';
  }

  return null;
}

async function main() {
  console.log('========================================');
  console.log('最终分类优化 - 删除假数据 + 精确分类');
  console.log('========================================');

  // ===== 1. 删除假制造商的产品 =====
  console.log('\n--- 1. 删除假制造商产品 ---');
  const allProducts = await fetchAll('ppe_products', 'id,name,category,manufacturer_name');
  const fakeProducts = allProducts.filter(p => isFakeMfrName(p.manufacturer_name));
  console.log(`  假制造商产品: ${fakeProducts.length} 条`);

  let fakeDeleted = 0;
  const fakeIds = fakeProducts.map(p => p.id);
  for (let i = 0; i < fakeIds.length; i += 500) {
    const batch = fakeIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) fakeDeleted += batch.length;
    await sleep(100);
  }
  console.log(`  删除假制造商产品: ${fakeDeleted} 条`);

  // ===== 2. 分类剩余"其他"类产品 =====
  console.log('\n--- 2. 分类剩余"其他"类产品 ---');
  const otherProducts = await fetchAll('ppe_products', 'id,name,category');
  const stillOther = otherProducts.filter(p => p.category === '其他');
  console.log(`  "其他"类产品: ${stillOther.length} 条`);

  const classifyBatches = {};
  stillOther.forEach(p => {
    const newCat = classifyFromProductName(p.name);
    if (newCat) {
      if (!classifyBatches[newCat]) classifyBatches[newCat] = [];
      classifyBatches[newCat].push(p.id);
    }
  });

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
  console.log(`  重新分类: ${reclassified} 条`);

  // ===== 3. 删除假制造商记录 =====
  console.log('\n--- 3. 删除假制造商记录 ---');
  const allMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const fakeMfrs = allMfrs.filter(m => isFakeMfrName(m.name));
  console.log(`  假制造商: ${fakeMfrs.length} 个`);

  let fakeMfrDeleted = 0;
  const fakeMfrIds = fakeMfrs.map(m => m.id);
  for (let i = 0; i < fakeMfrIds.length; i += 500) {
    const batch = fakeMfrIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (!error) fakeMfrDeleted += batch.length;
    await sleep(100);
  }
  console.log(`  删除假制造商: ${fakeMfrDeleted} 个`);

  // ===== 4. 最终验证 =====
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

  // 完整数据质量评估
  const fullProducts = await fetchAll('ppe_products', 'id,name,category,manufacturer_name,risk_level,registration_authority,data_source');
  const total = fullProducts.length;
  let hasMfr = 0, hasRisk = 0, hasAuth = 0, hasSource = 0;
  fullProducts.forEach(p => {
    if (p.manufacturer_name && trim(p.manufacturer_name) !== '' && p.manufacturer_name !== 'Unknown') hasMfr++;
    if (p.risk_level && trim(p.risk_level) !== '') hasRisk++;
    if (p.registration_authority && trim(p.registration_authority) !== '') hasAuth++;
    if (p.data_source && trim(p.data_source) !== '' && p.data_source !== 'Unknown') hasSource++;
  });
  console.log(`\n  数据完整性:`);
  console.log(`    有制造商名: ${hasMfr}/${total} (${((hasMfr/total)*100).toFixed(1)}%)`);
  console.log(`    有风险等级: ${hasRisk}/${total} (${((hasRisk/total)*100).toFixed(1)}%)`);
  console.log(`    有注册机构: ${hasAuth}/${total} (${((hasAuth/total)*100).toFixed(1)}%)`);
  console.log(`    有数据来源: ${hasSource}/${total} (${((hasSource/total)*100).toFixed(1)}%)`);

  const finalMfrs = await fetchAll('ppe_manufacturers', 'id,website,contact_info,company_profile,country');
  let mfrHasWeb = 0, mfrHasContact = 0, mfrHasProfile = 0;
  finalMfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') mfrHasWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') mfrHasContact++;
    if (m.company_profile && trim(m.company_profile) !== '') mfrHasProfile++;
  });
  console.log(`\n  制造商信息:`);
  console.log(`    有网站: ${mfrHasWeb}/${finalMfrs.length} (${((mfrHasWeb/finalMfrs.length)*100).toFixed(1)}%)`);
  console.log(`    有联系方式: ${mfrHasContact}/${finalMfrs.length} (${((mfrHasContact/finalMfrs.length)*100).toFixed(1)}%)`);
  console.log(`    有简介: ${mfrHasProfile}/${finalMfrs.length} (${((mfrHasProfile/finalMfrs.length)*100).toFixed(1)}%)`);

  const cnMfrs = finalMfrs.filter(m => m.country === 'CN');
  let cnWeb = 0, cnContact = 0, cnProfile = 0;
  cnMfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') cnWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') cnContact++;
    if (m.company_profile && trim(m.company_profile) !== '') cnProfile++;
  });
  console.log(`\n  中国制造商 (${cnMfrs.length} 个):`);
  console.log(`    有网站: ${cnWeb} (${((cnWeb/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`    有联系方式: ${cnContact} (${((cnContact/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`    有简介: ${cnProfile} (${((cnProfile/cnMfrs.length)*100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('最终分类优化完成');
  console.log('========================================');
}

main().catch(console.error);
