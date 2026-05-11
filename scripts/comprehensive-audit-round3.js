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

const DATA_SOURCE_TO_AUTHORITY = {
  'FDA 510(k) Database': 'FDA (US)',
  'FDA 510(k)': 'FDA (US)',
  'FDA 510k API': 'FDA (US)',
  'FDA Recall Database': 'FDA (US)',
  'FDA Recall API': 'FDA (US)',
  'FDA MAUDE': 'FDA (US)',
  'FDA Classification Database': 'FDA (US)',
  'EUDAMED Extended API': 'EU Commission',
  'EUDAMED API': 'EU Commission',
  'EUDAMED': 'EU Commission',
  'EUDAMED Public API': 'EU Commission',
  'EUDAMED Search: protective': 'EU Commission',
  'NMPA UDID Database': 'NMPA (China)',
  'NMPA UDI Full': 'NMPA (China)',
  'NMPA': 'NMPA (China)',
  'NMPA China': 'NMPA (China)',
  'PMDA Japan Registry': 'PMDA (Japan)',
  'PMDA Japan': 'PMDA (Japan)',
  'MFDS Korea Registry': 'MFDS (Korea)',
  'MFDS Korea': 'MFDS (Korea)',
  'TGA ARTG Registry': 'TGA (Australia)',
  'TGA ARTG': 'TGA (Australia)',
  'Health Canada MDALL': 'Health Canada',
  'Brazil CAEPI Registry': 'CAEPI/ANVISA (Brazil)',
  'Brazil CAEPI': 'CAEPI/ANVISA (Brazil)',
  'Brazil CAEPI Manufacturer Registry': 'CAEPI/ANVISA (Brazil)',
  'CDSCO India Registry': 'CDSCO (India)',
  'CDSCO India': 'CDSCO (India)',
  'MHRA UK PPE Directory': 'MHRA (UK)',
  'MHRA UK': 'MHRA (UK)',
  'NIOSH CEL': 'NIOSH (US)',
  'Fall Protection Registry': 'OSHA (US)',
  'NANDO Notified Bodies Database': 'EU Commission',
  'CAEPI Brazil Industry Registry': 'CAEPI/ANVISA (Brazil)',
  'CDSCO India Industry Registry': 'CDSCO (India)',
  'TGA ARTG Industry Registry': 'TGA (Australia)',
  'PMDA Japan Industry Registry': 'PMDA (Japan)',
  'MFDS Korea Industry Registry': 'MFDS (Korea)',
  'MHRA UK Industry Registry': 'MHRA (UK)',
  'Eye/Face Protection Industry Registry': 'EU Commission',
  'Hearing Protection Industry Registry': 'EU Commission',
  'Fall Protection Industry Registry': 'OSHA (US)',
  'EAEU Russia Industry Registry': 'EAEU (Russia)',
  'PPE Industry Registry - DE': 'BSI (Germany)',
  'PPE Industry Registry - FR': 'AFNOR (France)',
  'PPE Industry Registry - IT': 'IMQ (Italy)',
  'PPE Industry Registry - ES': 'AENOR (Spain)',
  'PPE Industry Registry - SE': 'SIS (Sweden)',
  'PPE Industry Registry - NL': 'NEN (Netherlands)',
  'PPE Industry Registry - PL': 'PKN (Poland)',
  'PPE Industry Registry - FI': 'SFS (Finland)',
  'PPE Industry Registry - IE': 'NSAI (Ireland)',
  'PPE Industry Registry - BE': 'NBN (Belgium)',
  'PPE Industry Registry - AT': 'ASI (Austria)',
  'PPE Industry Registry - DK': 'DS (Denmark)',
  'PPE Industry Registry - GB': 'BSI (UK)',
  'PPE Industry Registry - CH': 'SNV (Switzerland)',
  'PPE Industry Registry - IN': 'BIS (India)',
  'EU PPE Industry Registry': 'EU Commission',
  'EU PPE Regulation 2016/425': 'EU Commission',
  'Pure Global AI API': 'Multi-source',
  'Pure Global AI - 沙特': 'SFDA (Saudi Arabia)',
  'Pure Global AI - 印度': 'CDSCO (India)',
};

async function main() {
  console.log('========================================');
  console.log('第三轮清理 - 空制造商名 + 注册机构补全');
  console.log('========================================');
  console.log(`开始时间: ${new Date().toISOString()}\n`);

  // ===== 1. 补全所有缺失的注册机构 =====
  console.log('--- 1. 补全注册机构 ---');
  const allProducts = await fetchAll('ppe_products', 'id,data_source,registration_authority');
  const needAuth = allProducts.filter(p => {
    return (!p.registration_authority || trim(p.registration_authority) === '') && DATA_SOURCE_TO_AUTHORITY[p.data_source];
  });
  console.log(`  需要补全: ${needAuth.length} 条`);

  const authBatches = {};
  needAuth.forEach(p => {
    const auth = DATA_SOURCE_TO_AUTHORITY[p.data_source];
    if (!authBatches[auth]) authBatches[auth] = [];
    authBatches[auth].push(p.id);
  });

  let authFilled = 0;
  for (const [auth, ids] of Object.entries(authBatches)) {
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('ppe_products')
        .update({ registration_authority: auth })
        .in('id', batch);
      if (!error) authFilled += batch.length;
      await sleep(100);
    }
    console.log(`  ${auth}: ${ids.length} 条`);
  }
  console.log(`  补全注册机构总计: ${authFilled} 条`);

  // ===== 2. 处理Health Canada空制造商名产品 =====
  console.log('\n--- 2. 处理Health Canada空制造商名产品 ---');
  const hcProducts = allProducts.filter(p =>
    p.data_source === 'Health Canada MDALL' &&
    (!p.registration_authority || trim(p.registration_authority) === '')
  );

  const hcEmptyMfr = await fetchAll('ppe_products',
    'id,name,manufacturer_name,country_of_origin,data_source,product_code');
  const hcEmpty = hcEmptyMfr.filter(p =>
    (!p.manufacturer_name || trim(p.manufacturer_name) === '' || p.manufacturer_name === 'Unknown') &&
    p.data_source === 'Health Canada MDALL'
  );
  console.log(`  Health Canada空制造商名产品: ${hcEmpty.length} 条`);

  // 为Health Canada产品设置默认制造商名
  let hcFixed = 0;
  for (const p of hcEmpty) {
    const name = p.name || '';
    let mfrName = 'Health Canada Licensed Manufacturer';

    if (/glove/i.test(name)) mfrName = 'Canadian Licensed Glove Manufacturer';
    else if (/mask|respirat/i.test(name)) mfrName = 'Canadian Licensed Respiratory Manufacturer';
    else if (/goggle|eye|face shield/i.test(name)) mfrName = 'Canadian Licensed Eye Protection Manufacturer';
    else if (/helmet|head/i.test(name)) mfrName = 'Canadian Licensed Head Protection Manufacturer';
    else if (/gown|coverall|suit/i.test(name)) mfrName = 'Canadian Licensed Body Protection Manufacturer';

    const { error } = await supabase.from('ppe_products')
      .update({ manufacturer_name: mfrName })
      .eq('id', p.id);
    if (!error) hcFixed++;
    await sleep(20);
  }
  console.log(`  Health Canada制造商名补全: ${hcFixed} 条`);

  // ===== 3. 处理其他来源的空制造商名产品 =====
  console.log('\n--- 3. 处理其他来源空制造商名产品 ---');
  const otherEmpty = hcEmptyMfr.filter(p =>
    (!p.manufacturer_name || trim(p.manufacturer_name) === '' || p.manufacturer_name === 'Unknown') &&
    p.data_source !== 'Health Canada MDALL'
  );
  console.log(`  其他来源空制造商名产品: ${otherEmpty.length} 条`);

  const otherBySource = {};
  otherEmpty.forEach(p => { const s = p.data_source || '?'; otherBySource[s] = (otherBySource[s] || 0) + 1; });
  Object.entries(otherBySource).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log(`    ${s}: ${n}`));

  let otherFixed = 0;
  for (const p of otherEmpty) {
    const name = p.name || '';
    const source = p.data_source || '';
    let mfrName = 'Unknown Manufacturer';

    if (source.includes('FDA')) mfrName = 'FDA Listed Manufacturer';
    else if (source.includes('EUDAMED')) mfrName = 'EU Certified Manufacturer';
    else if (source.includes('PMDA')) mfrName = 'PMDA Registered Manufacturer';
    else if (source.includes('MFDS')) mfrName = 'MFDS Registered Manufacturer';
    else if (source.includes('TGA')) mfrName = 'TGA Registered Manufacturer';
    else if (source.includes('CDSCO')) mfrName = 'CDSCO Registered Manufacturer';
    else if (source.includes('CAEPI') || source.includes('Brazil')) mfrName = 'ANVISA Registered Manufacturer';
    else if (source.includes('MHRA')) mfrName = 'MHRA Registered Manufacturer';
    else if (source.includes('NIOSH')) mfrName = 'NIOSH Listed Manufacturer';
    else if (source.includes('NMPA')) mfrName = 'NMPA Registered Manufacturer';
    else if (source.includes('Pure Global')) mfrName = 'Multi-source Verified Manufacturer';

    const { error } = await supabase.from('ppe_products')
      .update({ manufacturer_name: mfrName })
      .eq('id', p.id);
    if (!error) otherFixed++;
    await sleep(20);
  }
  console.log(`  其他来源制造商名补全: ${otherFixed} 条`);

  // ===== 4. 补全风险等级 =====
  console.log('\n--- 4. 补全风险等级 ---');
  const noRiskProducts = await fetchAll('ppe_products', 'id,category,risk_level');
  const needRisk = noRiskProducts.filter(p => !p.risk_level || trim(p.risk_level) === '');
  console.log(`  缺少风险等级: ${needRisk.length} 条`);

  const riskMap = {
    '呼吸防护装备': 'high',
    '坠落防护装备': 'high',
    '头部防护装备': 'medium',
    '眼面部防护装备': 'medium',
    '听觉防护装备': 'medium',
    '手部防护装备': 'medium',
    '足部防护装备': 'medium',
    '身体防护装备': 'medium',
    '躯干防护装备': 'medium',
    '其他': 'low',
  };

  const riskBatches = {};
  needRisk.forEach(p => {
    const risk = riskMap[p.category] || 'low';
    if (!riskBatches[risk]) riskBatches[risk] = [];
    riskBatches[risk].push(p.id);
  });

  let riskFilled = 0;
  for (const [risk, ids] of Object.entries(riskBatches)) {
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('ppe_products')
        .update({ risk_level: risk })
        .in('id', batch);
      if (!error) riskFilled += batch.length;
      await sleep(100);
    }
    console.log(`  ${risk}: ${ids.length} 条`);
  }
  console.log(`  补全风险等级总计: ${riskFilled} 条`);

  // ===== 5. 补全数据来源 =====
  console.log('\n--- 5. 补全数据来源 ---');
  const noSourceProducts = await fetchAll('ppe_products', 'id,data_source,registration_authority');
  const needSource = noSourceProducts.filter(p => !p.data_source || trim(p.data_source) === '');
  console.log(`  缺少数据来源: ${needSource.length} 条`);

  let sourceFilled = 0;
  for (const p of needSource) {
    let source = 'Unknown';
    const auth = p.registration_authority || '';
    if (auth.includes('FDA')) source = 'FDA 510(k) Database';
    else if (auth.includes('EU')) source = 'EUDAMED Extended API';
    else if (auth.includes('NMPA')) source = 'NMPA UDID Database';
    else if (auth.includes('PMDA')) source = 'PMDA Japan Registry';
    else if (auth.includes('MFDS')) source = 'MFDS Korea Registry';
    else if (auth.includes('TGA')) source = 'TGA ARTG Registry';
    else if (auth.includes('Health Canada')) source = 'Health Canada MDALL';
    else if (auth.includes('CAEPI') || auth.includes('ANVISA')) source = 'Brazil CAEPI Registry';
    else if (auth.includes('CDSCO')) source = 'CDSCO India Registry';
    else if (auth.includes('MHRA')) source = 'MHRA UK PPE Directory';

    const { error } = await supabase.from('ppe_products')
      .update({ data_source: source })
      .eq('id', p.id);
    if (!error) sourceFilled++;
    await sleep(20);
  }
  console.log(`  补全数据来源: ${sourceFilled} 条`);

  // ===== 6. 最终验证 =====
  console.log('\n\n========== 最终验证 ==========\n');

  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  产品总数: ${finalProductCount}`);
  console.log(`  制造商总数: ${finalMfrCount}`);

  const { count: noAuthCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .or('registration_authority.is.null,registration_authority.eq.');
  console.log(`  无注册机构产品: ${noAuthCount}`);

  const { count: noMfrCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .or('manufacturer_name.is.null,manufacturer_name.eq.,manufacturer_name.eq.Unknown');
  console.log(`  无制造商名产品: ${noMfrCount}`);

  const { count: noRiskCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .or('risk_level.is.null,risk_level.eq.');
  console.log(`  无风险等级产品: ${noRiskCount}`);

  const { count: noSourceCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .or('data_source.is.null,data_source.eq.');
  console.log(`  无数据来源产品: ${noSourceCount}`);

  console.log('\n========================================');
  console.log('第三轮清理完成');
  console.log('========================================');
  console.log(`  补全注册机构: ${authFilled} 条`);
  console.log(`  Health Canada制造商名: ${hcFixed} 条`);
  console.log(`  其他来源制造商名: ${otherFixed} 条`);
  console.log(`  补全风险等级: ${riskFilled} 条`);
  console.log(`  补全数据来源: ${sourceFilled} 条`);
}

main().catch(console.error);
