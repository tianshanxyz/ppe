#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('========================================');
  console.log('数据库清理 - 删除批量生成假公司数据');
  console.log('========================================');

  const fakePatterns = [
    /^AusSafe \d{3}$/, /^OzPPE \d{3}$/, /^AUSProtect \d{3}$/, /^TGAReg \d{3}$/,
    /^JPNProtect \d{3}$/, /^PMDAReg \d{3}$/, /^NihonGuard \d{3}$/, /^TokyoSafe \d{3}$/,
    /^KORProtect \d{3}$/, /^MFDSReg \d{3}$/, /^SeoulGuard \d{3}$/, /^KoreaPPE \d{3}$/,
    /^IndiaSafe \d{3}$/, /^BharatPPE \d{3}$/, /^HindSafe \d{3}$/, /^ProIndia \d{3}$/,
    /^JapanSafe \d{3}$/, /^NihonPPE \d{3}$/, /^TokyoGuard \d{3}$/, /^OsakaSafe \d{3}$/,
    /^KoreaSafe \d{3}$/, /^KorPPE \d{3}$/, /^BusanSafe \d{3}$/,
    /^FallSafe \d{3}$/, /^FallGuard \d{3}$/,
    /^AusPPE \d{3}$/, /^SafeAUS \d{3}$/, /^OzSafety \d{3}$/, /^AUSGuard \d{3}$/,
  ];

  let totalProductsDeleted = 0;
  let totalMfrsDeleted = 0;

  // Step 1: 删除假公司名对应的产品
  console.log('\n========== Step 1: 删除假公司名产品 ==========');
  for (const pattern of fakePatterns) {
    const { data: fakeProducts, error } = await supabase.from('ppe_products')
      .select('id,manufacturer_name')
      .like('manufacturer_name', pattern.source.replace(/\^/, '').replace(/\\d\{3\}\$/, '%').replace(/\\/g, ''));

    if (error || !fakeProducts || fakeProducts.length === 0) continue;

    const fakeIds = fakeProducts.map(p => p.id);
    const mfrName = fakeProducts[0].manufacturer_name;

    // 分批删除
    const batchSize = 500;
    let deleted = 0;
    for (let i = 0; i < fakeIds.length; i += batchSize) {
      const batch = fakeIds.slice(i, i + batchSize);
      const { error: delError, count } = await supabase.from('ppe_products').delete().in('id', batch);
      if (!delError) deleted += batch.length;
      await sleep(50);
    }

    if (deleted > 0) {
      totalProductsDeleted += deleted;
      console.log(`  删除 "${mfrName}" 类: ${deleted} 条产品`);
    }
  }

  // Step 2: 删除假公司名对应的制造商记录
  console.log('\n========== Step 2: 删除假公司名制造商 ==========');
  for (const pattern of fakePatterns) {
    const patternStr = pattern.source.replace(/\^/, '').replace(/\\d\{3\}\$/, '%').replace(/\\/g, '');
    const { data: fakeMfrs, error } = await supabase.from('ppe_manufacturers')
      .select('id,name')
      .like('name', patternStr);

    if (error || !fakeMfrs || fakeMfrs.length === 0) continue;

    const fakeIds = fakeMfrs.map(m => m.id);
    const { error: delError } = await supabase.from('ppe_manufacturers').delete().in('id', fakeIds);
    if (!delError) {
      totalMfrsDeleted += fakeIds.length;
      console.log(`  删除 "${fakeMfrs[0].name}" 类: ${fakeIds.length} 条制造商`);
    }
    await sleep(50);
  }

  console.log(`\n  总计删除产品: ${totalProductsDeleted}`);
  console.log(`  总计删除制造商: ${totalMfrsDeleted}`);

  // Step 3: 修复分类错误
  console.log('\n========== Step 3: 修复分类错误 ==========');
  const { count: catMismatchCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true });

  // 获取所有产品重新分类
  let page = 0;
  let fixedCategories = 0;
  const pageSize = 500;

  while (true) {
    const { data: products, error } = await supabase.from('ppe_products')
      .select('id,name,category')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !products || products.length === 0) break;

    for (const p of products) {
      const name = (p.name || '').toLowerCase();
      let expectedCat = '';
      if (/respirat|mask|n95|ffp|scba|breathing|air-purif|gas mask|papr|filter|cartridge/i.test(name)) expectedCat = '呼吸防护装备';
      else if (/glove|hand|luva|gauntlet/i.test(name)) expectedCat = '手部防护装备';
      else if (/goggle|eye|face shield|visor|spectacle/i.test(name)) expectedCat = '眼面部防护装备';
      else if (/helmet|head|hard hat|bump cap/i.test(name)) expectedCat = '头部防护装备';
      else if (/boot|foot|shoe|footwear|wellington/i.test(name)) expectedCat = '足部防护装备';
      else if (/earplug|hearing|ear muff/i.test(name)) expectedCat = '听觉防护装备';
      else if (/fall|harness|lanyard|anchor|srl|lifeline/i.test(name)) expectedCat = '坠落防护装备';
      else if (/coverall|suit|body|gown|chemical suit|arc flash/i.test(name)) expectedCat = '身体防护装备';
      else if (/vest|jacket|coat|shirt|rainwear/i.test(name)) expectedCat = '躯干防护装备';

      if (expectedCat && p.category !== expectedCat) {
        const { error: updateError } = await supabase.from('ppe_products')
          .update({ category: expectedCat })
          .eq('id', p.id);
        if (!updateError) fixedCategories++;
      }
    }

    page++;
    if (products.length < pageSize) break;
    if (page % 20 === 0) console.log(`  已处理 ${page * pageSize} 条...`);
  }

  console.log(`  修复分类: ${fixedCategories} 条`);

  // Step 4: 去重处理
  console.log('\n========== Step 4: 去重处理 ==========');
  page = 0;
  const seenKeys = new Map();
  let duplicatesDeleted = 0;

  while (true) {
    const { data: products, error } = await supabase.from('ppe_products')
      .select('id,name,manufacturer_name')
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !products || products.length === 0) break;

    const idsToDelete = [];
    for (const p of products) {
      const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}`;
      if (seenKeys.has(key)) {
        idsToDelete.push(p.id);
      } else {
        seenKeys.set(key, p.id);
      }
    }

    if (idsToDelete.length > 0) {
      for (let i = 0; i < idsToDelete.length; i += 500) {
        const batch = idsToDelete.slice(i, i + 500);
        const { error: delError } = await supabase.from('ppe_products').delete().in('id', batch);
        if (!delError) duplicatesDeleted += batch.length;
        await sleep(50);
      }
    }

    page++;
    if (products.length < pageSize) break;
    if (page % 20 === 0) console.log(`  已处理 ${page * pageSize} 条, 删除重复 ${duplicatesDeleted} 条`);
  }

  console.log(`  删除重复: ${duplicatesDeleted} 条`);

  // Step 5: 删除无制造商信息的空记录
  console.log('\n========== Step 5: 清理空制造商产品 ==========');
  const { data: emptyMfrProducts, error: emptyErr } = await supabase.from('ppe_products')
    .select('id')
    .or('manufacturer_name.is.null,manufacturer_name.eq.,manufacturer_name.eq.Unknown')
    .limit(50000);

  if (emptyMfrProducts && emptyMfrProducts.length > 0) {
    const emptyIds = emptyMfrProducts.map(p => p.id);
    let emptyDeleted = 0;
    for (let i = 0; i < emptyIds.length; i += 500) {
      const batch = emptyIds.slice(i, i + 500);
      const { error: delError } = await supabase.from('ppe_products').delete().in('id', batch);
      if (!delError) emptyDeleted += batch.length;
      await sleep(50);
    }
    console.log(`  删除空制造商产品: ${emptyDeleted} 条`);
  }

  // 最终统计
  console.log('\n========================================');
  console.log('清理完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  删除假公司产品: ${totalProductsDeleted}`);
  console.log(`  删除假公司制造商: ${totalMfrsDeleted}`);
  console.log(`  修复分类: ${fixedCategories}`);
  console.log(`  删除重复: ${duplicatesDeleted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
