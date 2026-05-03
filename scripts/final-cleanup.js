const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  console.log('最终数据清理');
  console.log('========================================');

  // Step 1: 去重
  console.log('\nStep 1: 产品去重');
  const products = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,country_of_origin,category,risk_level,description,registration_number,data_source,created_at');

  const groups = {};
  products.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const dupIds = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.risk_level ? 1 : 0) +
        (a.data_source?.includes('FDA') ? 3 : a.data_source?.includes('Health Canada') ? 2 : 1) +
        (a.registration_number ? 2 : 0) + (a.country_of_origin && a.country_of_origin !== 'Unknown' ? 1 : 0);
      const bScore = (b.description ? 2 : 0) + (b.risk_level ? 1 : 0) +
        (b.data_source?.includes('FDA') ? 3 : b.data_source?.includes('Health Canada') ? 2 : 1) +
        (b.registration_number ? 2 : 0) + (b.country_of_origin && b.country_of_origin !== 'Unknown' ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIds.push(group[i].id);
  });

  console.log(`  待删除重复: ${dupIds.length}`);
  let deleted = 0;
  for (let i = 0; i < dupIds.length; i += 500) {
    const batch = dupIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    await sleep(100);
  }
  console.log(`  已删除: ${deleted}`);

  // Step 2: 重新分类"其他"
  console.log('\nStep 2: 重新分类"其他"产品');
  const otherProducts = await fetchAll('ppe_products', 'id,name,description,category,product_code,manufacturer_name');

  const CATEGORY_RULES = [
    { category: '呼吸防护装备', keywords: ['respirator', 'mask', 'n95', 'n99', 'n100', 'ffp1', 'ffp2', 'ffp3', 'kn95', 'kp95', 'filtering facepiece', 'air purifying', 'supplied air', 'scba', 'breathing', 'particulate respirat', 'surgical mask', 'face mask', 'dust mask', 'gas mask', 'cartridge', 'half mask', 'full facepiece', 'bi-pap', 'cpap', 'ventilat'] },
    { category: '手部防护装备', keywords: ['glove', 'gloves', 'hand protection', 'nitrile', 'latex glove', 'vinyl glove', 'cut resistant', 'chemical resistant glove', 'exam glove', 'surgical glove', 'work glove', 'protective glove', 'heat resistant glove', 'anti static glove', 'sleeve'] },
    { category: '眼面部防护装备', keywords: ['goggle', 'goggles', 'eye protection', 'face shield', 'faceshield', 'safety glasses', 'spectacle', 'visor', 'eye guard', 'splash guard', 'laser eye', 'welding lens', 'eye wash', 'laser protective', 'optical'] },
    { category: '头部防护装备', keywords: ['helmet', 'hard hat', 'head protection', 'bump cap', 'welding helmet', 'cranial', 'scalp protection', 'hair net', 'head guard', 'welding cap'] },
    { category: '听觉防护装备', keywords: ['earplug', 'earmuff', 'hearing protection', 'ear protection', 'noise reduction', 'canal cap', 'hearing band', 'aural', 'ear defender', 'hearing protector', 'audiometric'] },
    { category: '足部防护装备', keywords: ['boot', 'shoe', 'foot protection', 'safety footwear', 'toe cap', 'metatarsal', 'anti slip', 'safety toe', 'steel toe', 'composite toe', 'foundry boot', 'chemical boot', 'electrical hazard', 'overshoe', 'gaiter'] },
    { category: '躯干防护装备', keywords: ['vest', 'jacket', 'coat', 'apron', 'high visibility', 'hi vis', 'flame resistant', 'arc flash', 'rain suit', 'thermal', 'cooling vest', 'welding apron', 'bibs', 'smock', 'lab coat', 'life jacket', 'buoyancy'] },
    { category: '身体防护装备', keywords: ['gown', 'coverall', 'suit', 'protective apparel', 'isolation', 'surgical gown', 'protective clothing', 'hazmat suit', 'chemical protective', 'biological protective', 'tyvek', 'cover up', 'jump suit', 'barrier', 'scrub'] },
  ];

  let reclassified = 0;
  const otherItems = otherProducts.filter(p => p.category === '其他');

  for (const p of otherItems) {
    const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
    let newCat = null;

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        newCat = rule.category;
        break;
      }
    }

    if (newCat) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ category: newCat, product_category: newCat })
        .eq('id', p.id);
      if (!error) reclassified++;
    }
  }
  console.log(`  重新分类: ${reclassified} 条`);

  // Step 3: 清理孤立制造商
  console.log('\nStep 3: 清理孤立制造商');
  const remainingProducts = await fetchAll('ppe_products', 'manufacturer_name');
  const activeMfrNames = new Set(remainingProducts.map(p => (p.manufacturer_name || '').toLowerCase().trim()).filter(n => n && n !== 'unknown'));
  const allMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanMfrs = allMfrs.filter(m => !activeMfrNames.has((m.name || '').toLowerCase().trim()));
  console.log(`  孤立制造商: ${orphanMfrs.length}`);

  let deletedOrphans = 0;
  for (let i = 0; i < orphanMfrs.length; i += 500) {
    const batch = orphanMfrs.slice(i, i + 500).map(m => m.id);
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (!error) deletedOrphans += batch.length;
    await sleep(100);
  }
  console.log(`  已删除: ${deletedOrphans}`);

  // Step 4: 最终统计
  console.log('\n========================================');
  console.log('最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: finalRegCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log(`  产品: ${finalProductCount}`);
  console.log(`  制造商: ${finalMfrCount}`);
  console.log(`  法规: ${finalRegCount}`);

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
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n数据来源分布:');
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n国家分布(前15):');
  const COUNTRY_NAMES = {
    'US': '美国', 'CN': '中国', 'CA': '加拿大', 'MY': '马来西亚', 'GB': '英国',
    'TW': '台湾', 'ID': '印尼', 'TH': '泰国', 'DE': '德国', 'KR': '韩国',
    'IN': '印度', 'FR': '法国', 'CH': '瑞士', 'AU': '澳大利亚', 'NZ': '新西兰',
  };
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${COUNTRY_NAMES[k] || k}(${k}): ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n最终清理完成!');
}

main().catch(console.error);
