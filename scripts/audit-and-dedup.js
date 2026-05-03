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
    if (error) { console.error(`Error fetching ${table}:`, error.message); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('PPE 数据库全面审计与去重');
  console.log('========================================');
  console.log('时间:', new Date().toISOString());
  console.log('');

  // ===== Step 1: 数据量统计 =====
  console.log('Step 1: 数据量统计');
  const { count: productCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: regCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log(`  产品: ${productCount}, 制造商: ${mfrCount}, 法规: ${regCount}`);

  // ===== Step 2: 产品数据质量分析 =====
  console.log('\nStep 2: 产品数据质量分析');
  const products = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,country_of_origin,category,subcategory,risk_level,data_source,registration_number,registration_authority,description,model,last_verified,data_confidence_level');

  const totalProducts = products.length;
  const missingName = products.filter(p => !p.name || p.name.trim() === '').length;
  const missingMfr = products.filter(p => !p.manufacturer_name || p.manufacturer_name.trim() === '' || p.manufacturer_name === 'Unknown').length;
  const missingProductCode = products.filter(p => !p.product_code || p.product_code.trim() === '').length;
  const missingCountry = products.filter(p => !p.country_of_origin || p.country_of_origin.trim() === '' || p.country_of_origin === 'Unknown').length;
  const missingCategory = products.filter(p => !p.category || p.category.trim() === '').length;
  const missingRiskLevel = products.filter(p => !p.risk_level || p.risk_level.trim() === '').length;
  const missingDescription = products.filter(p => !p.description || p.description.trim() === '').length;
  const missingRegAuth = products.filter(p => !p.registration_authority || p.registration_authority.trim() === '').length;
  const missingRegNum = products.filter(p => !p.registration_number || p.registration_number.trim() === '').length;
  const missingDataSource = products.filter(p => !p.data_source || p.data_source.trim() === '').length;

  console.log(`  总产品数: ${totalProducts}`);
  console.log(`  缺少名称: ${missingName} (${(missingName/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少制造商: ${missingMfr} (${(missingMfr/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少产品代码: ${missingProductCode} (${(missingProductCode/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少国家: ${missingCountry} (${(missingCountry/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少类别: ${missingCategory} (${(missingCategory/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少风险等级: ${missingRiskLevel} (${(missingRiskLevel/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少描述: ${missingDescription} (${(missingDescription/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少注册机构: ${missingRegAuth} (${(missingRegAuth/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少注册号: ${missingRegNum} (${(missingRegNum/totalProducts*100).toFixed(1)}%)`);
  console.log(`  缺少数据来源: ${missingDataSource} (${(missingDataSource/totalProducts*100).toFixed(1)}%)`);

  // ===== Step 3: 数据来源分布 =====
  console.log('\nStep 3: 数据来源分布');
  const sourceStats = {};
  products.forEach(p => {
    const src = p.data_source || 'Unknown';
    sourceStats[src] = (sourceStats[src] || 0) + 1;
  });
  Object.entries(sourceStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/totalProducts*100).toFixed(1)}%)`);
  });

  // ===== Step 4: 类别分布 =====
  console.log('\nStep 4: 类别分布');
  const catStats = {};
  products.forEach(p => {
    const cat = p.category || 'Unknown';
    catStats[cat] = (catStats[cat] || 0) + 1;
  });
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/totalProducts*100).toFixed(1)}%)`);
  });

  // ===== Step 5: 国家分布 =====
  console.log('\nStep 5: 国家分布');
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/totalProducts*100).toFixed(1)}%)`);
  });

  // ===== Step 6: 产品去重 =====
  console.log('\nStep 6: 产品去重');
  const productGroups = {};
  products.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    if (!productGroups[key]) productGroups[key] = [];
    productGroups[key].push(p);
  });

  const duplicateProductGroups = Object.entries(productGroups).filter(([_, group]) => group.length > 1);
  const totalDuplicateProducts = duplicateProductGroups.reduce((sum, [_, group]) => sum + group.length - 1, 0);
  console.log(`  唯一产品组: ${Object.keys(productGroups).length}`);
  console.log(`  重复组数: ${duplicateProductGroups.length}`);
  console.log(`  需删除重复: ${totalDuplicateProducts}`);

  // 按注册号去重
  const regGroups = {};
  products.forEach(p => {
    if (p.registration_number && p.registration_number.trim() !== '') {
      const key = p.registration_number.trim();
      if (!regGroups[key]) regGroups[key] = [];
      regGroups[key].push(p);
    }
  });
  const duplicateRegGroups = Object.entries(regGroups).filter(([_, group]) => group.length > 1);
  const totalDuplicateByReg = duplicateRegGroups.reduce((sum, [_, group]) => sum + group.length - 1, 0);
  console.log(`  注册号重复组: ${duplicateRegGroups.length}`);
  console.log(`  需删除(按注册号): ${totalDuplicateByReg}`);

  // ===== Step 7: 制造商去重 =====
  console.log('\nStep 7: 制造商去重');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,data_source,website');

  const mfrGroups = {};
  manufacturers.forEach(m => {
    const key = (m.name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });
  const duplicateMfrGroups = Object.entries(mfrGroups).filter(([_, group]) => group.length > 1);
  const totalDuplicateMfrs = duplicateMfrGroups.reduce((sum, [_, group]) => sum + group.length - 1, 0);
  console.log(`  唯一制造商组: ${Object.keys(mfrGroups).length}`);
  console.log(`  重复组数: ${duplicateMfrGroups.length}`);
  console.log(`  需删除重复: ${totalDuplicateMfrs}`);

  // ===== Step 8: 非PPE产品识别 =====
  console.log('\nStep 8: 非PPE产品识别');
  const nonPPEKeywords = [
    'dental', 'orthopedic', 'implant', 'catheter', 'stent', 'pacemaker',
    'syringe', 'needle', 'infusion', 'dialysis', 'endoscope', 'ultrasound',
    'x-ray', 'mri', 'ct scan', 'defibrillator', 'ventilator',
    'surgical instrument', 'suture', 'bandage', 'wheelchair',
    'prosthetic', 'hearing aid', 'blood pressure', 'thermometer',
    'blood glucose', 'insulin', 'ostomy', 'colostomy'
  ];
  const nonPPEProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return nonPPEKeywords.some(kw => name.includes(kw) || desc.includes(kw));
  });
  console.log(`  疑似非PPE产品: ${nonPPEProducts.length}`);

  // ===== Step 9: 执行去重 =====
  console.log('\nStep 9: 执行产品去重');
  let deletedProducts = 0;

  // 9.1: 按名称+制造商+产品代码去重
  const productIdsToDelete = [];
  duplicateProductGroups.forEach(([key, group]) => {
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
    for (let i = 1; i < group.length; i++) {
      productIdsToDelete.push(group[i].id);
    }
  });

  // 9.2: 按注册号去重（补充）
  duplicateRegGroups.forEach(([regNum, group]) => {
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.manufacturer_name && a.manufacturer_name !== 'Unknown' ? 2 : 0);
      const bScore = (b.description ? 2 : 0) + (b.manufacturer_name && b.manufacturer_name !== 'Unknown' ? 2 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) {
      if (!productIdsToDelete.includes(group[i].id)) {
        productIdsToDelete.push(group[i].id);
      }
    }
  });

  console.log(`  待删除产品ID数: ${productIdsToDelete.length}`);

  // 批量删除
  for (let i = 0; i < productIdsToDelete.length; i += 500) {
    const batch = productIdsToDelete.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (error) {
      console.log(`  删除批次 ${i/500 + 1} 错误: ${error.message}`);
    } else {
      deletedProducts += batch.length;
    }
    await sleep(200);
  }
  console.log(`  已删除重复产品: ${deletedProducts}`);

  // ===== Step 10: 执行制造商去重 =====
  console.log('\nStep 10: 执行制造商去重');
  let deletedMfrs = 0;
  const mfrIdsToDelete = [];

  duplicateMfrGroups.forEach(([key, group]) => {
    group.sort((a, b) => {
      const aScore = (a.website ? 2 : 0) + (a.country && a.country !== 'Unknown' ? 1 : 0) +
        (a.data_source?.includes('FDA') ? 2 : 1);
      const bScore = (b.website ? 2 : 0) + (b.country && b.country !== 'Unknown' ? 1 : 0) +
        (b.data_source?.includes('FDA') ? 2 : 1);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    const keepId = group[0].id;
    const removeIds = group.slice(1).map(m => m.id);
    mfrIdsToDelete.push(...removeIds);
  });

  console.log(`  待删除制造商ID数: ${mfrIdsToDelete.length}`);

  for (let i = 0; i < mfrIdsToDelete.length; i += 500) {
    const batch = mfrIdsToDelete.slice(i, i + 500);
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (error) {
      console.log(`  删除批次 ${i/500 + 1} 错误: ${error.message}`);
    } else {
      deletedMfrs += batch.length;
    }
    await sleep(200);
  }
  console.log(`  已删除重复制造商: ${deletedMfrs}`);

  // ===== Step 11: 清理孤立制造商 =====
  console.log('\nStep 11: 清理孤立制造商（无关联产品的制造商）');
  const remainingProducts = await fetchAll('ppe_products', 'manufacturer_name');
  const activeMfrNames = new Set(remainingProducts.map(p => (p.manufacturer_name || '').toLowerCase().trim()).filter(n => n && n !== 'unknown'));
  const remainingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanMfrs = remainingMfrs.filter(m => !activeMfrNames.has((m.name || '').toLowerCase().trim()));
  console.log(`  活跃制造商名: ${activeMfrNames.size}`);
  console.log(`  孤立制造商: ${orphanMfrs.length}`);

  let deletedOrphans = 0;
  for (let i = 0; i < orphanMfrs.length; i += 500) {
    const batch = orphanMfrs.slice(i, i + 500).map(m => m.id);
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (!error) deletedOrphans += batch.length;
    await sleep(200);
  }
  console.log(`  已删除孤立制造商: ${deletedOrphans}`);

  // ===== Step 12: 最终统计 =====
  console.log('\n========================================');
  console.log('去重后最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: finalRegCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log(`  产品: ${productCount} → ${finalProductCount} (删除 ${productCount - finalProductCount})`);
  console.log(`  制造商: ${mfrCount} → ${finalMfrCount} (删除 ${mfrCount - finalMfrCount})`);
  console.log(`  法规: ${regCount} → ${finalRegCount}`);

  // ===== Step 13: 去重后数据来源分布 =====
  console.log('\n去重后数据来源分布:');
  const finalProducts = await fetchAll('ppe_products', 'data_source');
  const finalSourceStats = {};
  finalProducts.forEach(p => {
    const src = p.data_source || 'Unknown';
    finalSourceStats[src] = (finalSourceStats[src] || 0) + 1;
  });
  Object.entries(finalSourceStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  // ===== Step 14: 去重后类别分布 =====
  console.log('\n去重后类别分布:');
  const finalCatProducts = await fetchAll('ppe_products', 'category');
  const finalCatStats = {};
  finalCatProducts.forEach(p => {
    const cat = p.category || 'Unknown';
    finalCatStats[cat] = (finalCatStats[cat] || 0) + 1;
  });
  Object.entries(finalCatStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  // ===== Step 15: 去重后国家分布 =====
  console.log('\n去重后国家分布:');
  const finalCountryProducts = await fetchAll('ppe_products', 'country_of_origin');
  const finalCountryStats = {};
  finalCountryProducts.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    finalCountryStats[c] = (finalCountryStats[c] || 0) + 1;
  });
  Object.entries(finalCountryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n审计与去重完成!');
}

main().catch(console.error);
