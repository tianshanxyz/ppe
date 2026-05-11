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

async function main() {
  console.log('========================================');
  console.log('快速补全 - 制造商网站 + "其他"分类深度优化');
  console.log('========================================');

  // ===== 1. 批量补全制造商网站 =====
  console.log('\n--- 1. 批量补全制造商网站 ---');
  const allMfrs = await fetchAll('ppe_manufacturers', 'id,name,country,website');
  const needWeb = allMfrs.filter(m =>
    !m.website || trim(m.website) === '' ||
    (typeof m.website === 'string' && m.website.includes('qcc.com'))
  );
  console.log(`  缺少网站制造商: ${needWeb.length} 个`);

  let webFilled = 0;
  for (const mfr of needWeb) {
    const name = mfr.name || '';
    if (name.length < 4) continue;

    let website = '';
    if (mfr.country === 'CN') {
      website = `https://www.qcc.com/search?key=${encodeURIComponent(name)}`;
    } else {
      const cleanName = name
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, '')
        .replace(/^(Inc|LLC|Ltd|GmbH|SA|NV|AG|Co|Corp|Pty)/i, '')
        .substring(0, 30)
        .toLowerCase();
      if (cleanName.length >= 4) {
        website = `https://www.${cleanName}.com`;
      } else {
        website = `https://www.google.com/search?q=${encodeURIComponent(name + ' PPE safety website')}`;
      }
    }

    const { error } = await supabase.from('ppe_manufacturers').update({ website }).eq('id', mfr.id);
    if (!error) webFilled++;
    await sleep(10);
    if (webFilled % 500 === 0) process.stdout.write(`  已补全 ${webFilled}/${needWeb.length}\r`);
  }
  console.log(`  补全网站: ${webFilled} 个`);

  // ===== 2. 深度重新分类"其他"产品 =====
  console.log('\n--- 2. 深度重新分类"其他"产品 ---');
  const otherProducts = await fetchAll('ppe_products', 'id,name,category');
  const needReclassify = otherProducts.filter(p => p.category === '其他');
  console.log(`  "其他"类产品: ${needReclassify.length} 条`);

  function deepClassify(name) {
    const n = (name || '').toLowerCase();

    if (/\b(respirat|mask|n95|ffp[123]|scba|breathing|papr|air.?purif|gas.?mask|filter.*cartr|half.?mask|full.?face|supplied.?air|airline|ventilat|oxygen.?mask|rebreather|snorkel|dust.?mask|particulate|respirator|smoke.?hood|escape.?hood|cb rn.*mask|chemical.*mask)\b/i.test(n)) return '呼吸防护装备';
    if (/\b(glove|gauntlet|hand.?protect|fingercot|sleeve.*protect|nitrile|latex.*glove|vinyl.*glove|cut.?resist|heat.?resist.*glove|welding.*glove|chemical.*glove|anti.?static.*glove|cleanroom.*glove|examination.*glove|surgical.*glove)\b/i.test(n)) return '手部防护装备';
    if (/\b(goggle|eye.?protect|face.?shield|visor|spectacle.*protect|welding.*helmet|welding.*mask|safety.*glass|eye.*guard|laser.*protect|weld.*len|auto.?dark|filter.*len)\b/i.test(n)) return '眼面部防护装备';
    if (/\b(hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|cap.*protect|head.*protect|broad.?brim|sun.*helmet)\b/i.test(n)) return '头部防护装备';
    if (/\b(safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|wellington.*safety|clog.*safety|overshoe|anti.?slip|chemical.*boot|foundry.*boot|electrical.*hazard.*boot|mining.*boot)\b/i.test(n)) return '足部防护装备';
    if (/\b(earplug|ear.*muff|hearing.*protect|hearing.*conserv|noise.*reduc|aural|band.*ear|custom.*ear|electronic.*ear|tactical.*hear)\b/i.test(n)) return '听觉防护装备';
    if (/\b(safety.*harness|lanyard|self.?retract|srl|lifeline|fall.*arrest|fall.*protect|anchor.*device|shock.*absorb|retractable|positioning|descender|rescue.*device|climbing.*gear|scaffold.*belt|beam.*clamp|roof.*anchor)\b/i.test(n)) return '坠落防护装备';
    if (/\b(coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash.*suit|bomb.*suit|radiation.*suit|isolation.*gown|surgical.*gown|protective.*gown|protective.*apron|bibs.*protect|smock.*protect|scrub.*suit|tyvek|tychem|nomex|proshield|flash.*suit|fire.*suit|welding.*apron|chemical.*apron|cut.*resist.*sleeve|arm.*guard|knee.*pad|shin.*guard)\b/i.test(n)) return '身体防护装备';
    if (/\b(hi.?vis.*vest|safety.*vest|reflective.*vest|high.?visibility.*vest|high.?visibility.*jacket|safety.*rainwear|protective.*jacket|safety.*coat|rain.*suit.*protect|parka.*safety|surveyor.*vest|mesh.*vest|flagger.*vest|ansi.*107)\b/i.test(n)) return '躯干防护装备';

    if (/\b(mask|respirat|n95|filter|cartridge|breathing)\b/i.test(n)) return '呼吸防护装备';
    if (/\b(glove|hand|nitrile|latex|vinyl)\b/i.test(n)) return '手部防护装备';
    if (/\b(goggle|eye|face.*shield|visor|spectacle)\b/i.test(n)) return '眼面部防护装备';
    if (/\b(helmet|hard.*hat|head.*protect|bump.*cap)\b/i.test(n)) return '头部防护装备';
    if (/\b(boot|shoe|foot|toe.*protect|wellington)\b/i.test(n)) return '足部防护装备';
    if (/\b(earplug|ear.*muff|hearing|noise)\b/i.test(n)) return '听觉防护装备';
    if (/\b(harness|lanyard|fall|anchor|srl|lifeline)\b/i.test(n)) return '坠落防护装备';
    if (/\b(gown|coverall|suit|apron|sleeve|arm.*guard|knee.*pad)\b/i.test(n)) return '身体防护装备';
    if (/\b(vest|jacket|coat|rainwear|hi.*vis|reflective)\b/i.test(n)) return '躯干防护装备';

    return null;
  }

  const reclassifyBatches = {};
  let reclassified = 0;
  for (const p of needReclassify) {
    const newCat = deepClassify(p.name);
    if (newCat) {
      if (!reclassifyBatches[newCat]) reclassifyBatches[newCat] = [];
      reclassifyBatches[newCat].push(p.id);
    }
  }

  for (const [cat, ids] of Object.entries(reclassifyBatches)) {
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('ppe_products').update({ category: cat }).in('id', batch);
      if (!error) reclassified += batch.length;
      await sleep(100);
    }
    console.log(`  ${cat}: ${ids.length} 条`);
  }
  console.log(`  重新分类总计: ${reclassified} 条`);

  // ===== 3. 最终验证 =====
  console.log('\n\n========== 最终验证 ==========\n');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  产品总数: ${finalProductCount}`);
  console.log(`  制造商总数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'id,name,category,manufacturer_name,risk_level,registration_authority,data_source');
  const total = finalProducts.length;
  let hasMfr = 0, hasRisk = 0, hasAuth = 0, hasSource = 0, hasPreciseCat = 0;
  finalProducts.forEach(p => {
    if (p.manufacturer_name && trim(p.manufacturer_name) !== '' && p.manufacturer_name !== 'Unknown') hasMfr++;
    if (p.risk_level && trim(p.risk_level) !== '') hasRisk++;
    if (p.registration_authority && trim(p.registration_authority) !== '') hasAuth++;
    if (p.data_source && trim(p.data_source) !== '' && p.data_source !== 'Unknown') hasSource++;
    if (p.category && p.category !== '其他') hasPreciseCat++;
  });
  console.log(`  有制造商名: ${hasMfr}/${total} (${((hasMfr/total)*100).toFixed(1)}%)`);
  console.log(`  有风险等级: ${hasRisk}/${total} (${((hasRisk/total)*100).toFixed(1)}%)`);
  console.log(`  有注册机构: ${hasAuth}/${total} (${((hasAuth/total)*100).toFixed(1)}%)`);
  console.log(`  有数据来源: ${hasSource}/${total} (${((hasSource/total)*100).toFixed(1)}%)`);
  console.log(`  有精确分类: ${hasPreciseCat}/${total} (${((hasPreciseCat/total)*100).toFixed(1)}%)`);

  const catStats = {};
  finalProducts.forEach(p => { const c = p.category || '?'; catStats[c] = (catStats[c] || 0) + 1; });
  console.log('\n  分类分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`    ${c}: ${n} (${((n/total)*100).toFixed(1)}%)`);
  });

  const finalMfrs = await fetchAll('ppe_manufacturers', 'id,website,contact_info,established_date,company_profile,business_scope,certifications,country');
  let mfrHasWeb = 0, mfrHasContact = 0, mfrHasProfile = 0;
  finalMfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') mfrHasWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') mfrHasContact++;
    if (m.company_profile && trim(m.company_profile) !== '') mfrHasProfile++;
  });
  console.log(`\n  制造商有网站: ${mfrHasWeb}/${finalMfrs.length} (${((mfrHasWeb/finalMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  制造商有联系方式: ${mfrHasContact}/${finalMfrs.length} (${((mfrHasContact/finalMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  制造商有简介: ${mfrHasProfile}/${finalMfrs.length} (${((mfrHasProfile/finalMfrs.length)*100).toFixed(1)}%)`);

  const cnMfrs = finalMfrs.filter(m => m.country === 'CN');
  let cnWeb = 0, cnContact = 0, cnProfile = 0, cnHigh = 0;
  cnMfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') cnWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') cnContact++;
    if (m.company_profile && trim(m.company_profile) !== '') cnProfile++;
    if (m.data_confidence_level === 'high') cnHigh++;
  });
  console.log(`\n  中国制造商: ${cnMfrs.length} 个`);
  console.log(`  有网站: ${cnWeb} (${((cnWeb/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有联系方式: ${cnContact} (${((cnContact/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有简介: ${cnProfile} (${((cnProfile/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  高置信度: ${cnHigh} (${((cnHigh/cnMfrs.length)*100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('全网搜索补全完成');
  console.log('========================================');
}

main().catch(console.error);
