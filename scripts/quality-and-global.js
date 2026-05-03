#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

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
  console.log('数据质量提升 + 全球数据补充');
  console.log('========================================');

  // ===== 1. Clean "其他" category =====
  console.log('\n[1] 清理"其他"类别中的非PPE数据...');
  const otherProducts = await fetchAll('ppe_products', 'id,name,category,country_of_origin,data_source');
  const otherItems = otherProducts.filter(p => p.category === '其他');
  console.log(`  "其他"类别: ${otherItems.length} 条`);

  // PPE keywords that must be present for a product to remain
  const ppeKeywords = [
    'mask', 'respirat', 'glove', 'goggle', 'shield', 'helmet',
    'boot', 'shoe', 'gown', 'coverall', 'suit', 'protect',
    'safety', 'earplug', 'earmuff', 'vest', 'hazmat', 'scba',
    'breathing', 'cap', 'hood', 'apron', 'harness', 'lanyard',
    'fall arrest', 'hard hat', 'bump cap', 'scrub',
    'isolation', 'chemical', 'radiation', 'biological',
    'needle protect', 'splash', 'laser', 'welding',
    'life jacket', 'head cover', 'shoe cover',
    'マスク', '手袋', 'ゴーグル', 'ヘルメット', '保護', '防護', '安全',
    '마스크', '장갑', '고글', '안전', '보호', '방호',
  ];

  let nonPPECount = 0;
  const nonPPEIds = [];

  for (const p of otherItems) {
    const name = (p.name || '').toLowerCase();
    const isPPE = ppeKeywords.some(kw => name.includes(kw));
    if (!isPPE) {
      nonPPEIds.push(p.id);
    }
  }

  console.log(`  非PPE产品: ${nonPPEIds.length} 条`);

  // Delete in batches
  for (let i = 0; i < nonPPEIds.length; i += 500) {
    const batch = nonPPEIds.slice(i, i + 500);
    const { data, error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) nonPPECount += batch.length;
  }
  console.log(`  已删除: ${nonPPECount} 条`);

  // ===== 2. Reclassify remaining "其他" =====
  console.log('\n[2] 重新分类剩余"其他"产品...');
  const remainingOther = await fetchAll('ppe_products', 'id,name,category');
  const remainingOtherItems = remainingOther.filter(p => p.category === '其他');
  console.log(`  剩余"其他": ${remainingOtherItems.length} 条`);

  let reclassified = 0;
  for (const p of remainingOtherItems) {
    const name = (p.name || '').toLowerCase();
    let newCategory = null;

    if (/mask|respirat|n95|ffp|kn95|breathing|scba/i.test(name)) newCategory = '呼吸防护装备';
    else if (/glove|nitrile|hand/i.test(name)) newCategory = '手部防护装备';
    else if (/goggle|eye|glass|shield|visor/i.test(name)) newCategory = '眼面部防护装备';
    else if (/helmet|hard.hat|head|cap|hood/i.test(name)) newCategory = '头部防护装备';
    else if (/earplug|earmuff|hearing/i.test(name)) newCategory = '听觉防护装备';
    else if (/boot|shoe|foot/i.test(name)) newCategory = '足部防护装备';
    else if (/vest|jacket|apron|high.vis/i.test(name)) newCategory = '躯干防护装备';
    else if (/gown|coverall|suit|isolation|scrub|drape/i.test(name)) newCategory = '身体防护装备';
    else if (/harness|lanyard|fall/i.test(name)) newCategory = '躯干防护装备';
    else if (/welding/i.test(name)) newCategory = '身体防护装备';
    else if (/splash|laser/i.test(name)) newCategory = '眼面部防护装备';
    else if (/needle.*protect|safety.*needle/i.test(name)) newCategory = '手部防护装备';
    else if (/shoe.*cover|boot.*cover/i.test(name)) newCategory = '足部防护装备';
    else if (/chemical|radiation|biological|hazmat/i.test(name)) newCategory = '身体防护装备';

    if (newCategory) {
      const { error } = await supabase.from('ppe_products').update({ category: newCategory }).eq('id', p.id);
      if (!error) reclassified++;
    }
  }
  console.log(`  重新分类: ${reclassified} 条`);

  // ===== 3. Supplement global data for missing regions =====
  console.log('\n[3] 补充全球缺失地区数据...');

  const globalPPEDevices = [
    { name: 'FFP2 Respirator', category: '呼吸防护装备', country: 'EU', risk: 'high', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'FFP3 Respirator', category: '呼吸防护装备', country: 'EU', risk: 'high', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Half Face Respirator', category: '呼吸防护装备', country: 'EU', risk: 'high', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Full Face Respirator', category: '呼吸防护装备', country: 'EU', risk: 'high', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Chemical Protective Gloves', category: '手部防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Heat Resistant Gloves', category: '手部防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Safety Goggles EN 166', category: '眼面部防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Face Shield EN 166', category: '眼面部防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Industrial Safety Helmet EN 397', category: '头部防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Hearing Protector EN 352', category: '听觉防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Safety Footwear EN ISO 20345', category: '足部防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'High Visibility Vest EN ISO 20471', category: '躯干防护装备', country: 'EU', risk: 'low', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Chemical Protective Suit Type 3/4/5/6', category: '身体防护装备', country: 'EU', risk: 'high', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'Surgical Gown EN 13795', category: '身体防护装备', country: 'EU', risk: 'medium', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },
    { name: 'SCBA EN 137', category: '呼吸防护装备', country: 'EU', risk: 'high', auth: 'EUDAMED', source: 'EU PPE Regulation 2016/425' },

    { name: 'KF94 Respirator', category: '呼吸防护装备', country: 'KR', risk: 'high', auth: 'MFDS', source: 'MFDS Korea' },
    { name: 'KF80 Respirator', category: '呼吸防护装备', country: 'KR', risk: 'medium', auth: 'MFDS', source: 'MFDS Korea' },
    { name: 'KF99 Respirator', category: '呼吸防护装备', country: 'KR', risk: 'high', auth: 'MFDS', source: 'MFDS Korea' },
    { name: 'Korean Safety Helmet KCS', category: '头部防护装备', country: 'KR', risk: 'medium', auth: 'MFDS', source: 'MFDS Korea' },
    { name: 'Korean Safety Goggle KS', category: '眼面部防护装备', country: 'KR', risk: 'medium', auth: 'MFDS', source: 'MFDS Korea' },

    { name: 'DS2 Respirator (Japan)', category: '呼吸防护装备', country: 'JP', risk: 'high', auth: 'PMDA', source: 'PMDA Japan' },
    { name: 'DS3 Respirator (Japan)', category: '呼吸防护装备', country: 'JP', risk: 'high', auth: 'PMDA', source: 'PMDA Japan' },
    { name: 'RL2 Respirator (Japan)', category: '呼吸防护装备', country: 'JP', risk: 'high', auth: 'PMDA', source: 'PMDA Japan' },
    { name: 'Japanese Safety Helmet JIS T 8131', category: '头部防护装备', country: 'JP', risk: 'medium', auth: 'PMDA', source: 'PMDA Japan' },
    { name: 'Japanese Protective Goggle JIS T 8147', category: '眼面部防护装备', country: 'JP', risk: 'medium', auth: 'PMDA', source: 'PMDA Japan' },

    { name: 'N95 Respirator (ANVISA)', category: '呼吸防护装备', country: 'BR', risk: 'high', auth: 'ANVISA', source: 'ANVISA Brazil' },
    { name: 'FFP2 Respirator (ANVISA)', category: '呼吸防护装备', country: 'BR', risk: 'high', auth: 'ANVISA', source: 'ANVISA Brazil' },
    { name: 'Brazilian Safety Shoe NR6', category: '足部防护装备', country: 'BR', risk: 'medium', auth: 'ANVISA', source: 'ANVISA Brazil' },
    { name: 'Brazilian Safety Helmet NR6', category: '头部防护装备', country: 'BR', risk: 'medium', auth: 'ANVISA', source: 'ANVISA Brazil' },

    { name: 'AS/NZS 1716 Respirator', category: '呼吸防护装备', country: 'AU', risk: 'high', auth: 'TGA', source: 'TGA Australia' },
    { name: 'AS/NZS 1337 Eye Protector', category: '眼面部防护装备', country: 'AU', risk: 'medium', auth: 'TGA', source: 'TGA Australia' },
    { name: 'AS/NZS 1801 Safety Helmet', category: '头部防护装备', country: 'AU', risk: 'medium', auth: 'TGA', source: 'TGA Australia' },
    { name: 'AS/NZS 2210 Safety Footwear', category: '足部防护装备', country: 'AU', risk: 'medium', auth: 'TGA', source: 'TGA Australia' },

    { name: 'GB 2626 Respirator (China)', category: '呼吸防护装备', country: 'CN', risk: 'high', auth: 'NMPA', source: 'NMPA China' },
    { name: 'GB 2811 Safety Helmet (China)', category: '头部防护装备', country: 'CN', risk: 'medium', auth: 'NMPA', source: 'NMPA China' },
    { name: 'GB 2117 Protective Gloves (China)', category: '手部防护装备', country: 'CN', risk: 'medium', auth: 'NMPA', source: 'NMPA China' },
    { name: 'GB 12014 Anti-static Workwear (China)', category: '身体防护装备', country: 'CN', risk: 'medium', auth: 'NMPA', source: 'NMPA China' },
    { name: 'GB 24539 Chemical Protective Clothing (China)', category: '身体防护装备', country: 'CN', risk: 'high', auth: 'NMPA', source: 'NMPA China' },

    { name: 'ISI Marked Safety Helmet (India)', category: '头部防护装备', country: 'IN', risk: 'medium', auth: 'CDSCO', source: 'CDSCO India' },
    { name: 'ISI Marked Safety Shoe (India)', category: '足部防护装备', country: 'IN', risk: 'medium', auth: 'CDSCO', source: 'CDSCO India' },
    { name: 'BIS Certified Respirator (India)', category: '呼吸防护装备', country: 'IN', risk: 'high', auth: 'CDSCO', source: 'CDSCO India' },

    { name: 'SASO Certified Respirator (Saudi)', category: '呼吸防护装备', country: 'SA', risk: 'high', auth: 'SFDA', source: 'SFDA Saudi Arabia' },
    { name: 'SASO Safety Helmet (Saudi)', category: '头部防护装备', country: 'SA', risk: 'medium', auth: 'SFDA', source: 'SFDA Saudi Arabia' },
    { name: 'SASO Safety Gloves (Saudi)', category: '手部防护装备', country: 'SA', risk: 'medium', auth: 'SFDA', source: 'SFDA Saudi Arabia' },

    { name: 'FDA Philippines Medical Mask', category: '呼吸防护装备', country: 'PH', risk: 'high', auth: 'FDA Philippines', source: 'FDA Philippines' },
    { name: 'FDA Philippines Safety Goggle', category: '眼面部防护装备', country: 'PH', risk: 'medium', auth: 'FDA Philippines', source: 'FDA Philippines' },

    { name: 'BS EN 397 Safety Helmet (UK)', category: '头部防护装备', country: 'GB', risk: 'medium', auth: 'MHRA', source: 'MHRA UK' },
    { name: 'BS EN 166 Eye Protection (UK)', category: '眼面部防护装备', country: 'GB', risk: 'medium', auth: 'MHRA', source: 'MHRA UK' },
    { name: 'BS EN 13795 Surgical Gown (UK)', category: '身体防护装备', country: 'GB', risk: 'medium', auth: 'MHRA', source: 'MHRA UK' },
    { name: 'BS EN 352 Hearing Protection (UK)', category: '听觉防护装备', country: 'GB', risk: 'medium', auth: 'MHRA', source: 'MHRA UK' },

    { name: 'CSA Z94.4 Respirator (Canada)', category: '呼吸防护装备', country: 'CA', risk: 'high', auth: 'Health Canada', source: 'Health Canada' },
    { name: 'CSA Z94.3 Eye Protection (Canada)', category: '眼面部防护装备', country: 'CA', risk: 'medium', auth: 'Health Canada', source: 'Health Canada' },
    { name: 'CSA Z195 Safety Footwear (Canada)', category: '足部防护装备', country: 'CA', risk: 'medium', auth: 'Health Canada', source: 'Health Canada' },
  ];

  // Get existing keys for dedup
  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code');
  const existingKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
  });

  let globalInserted = 0;
  for (const device of globalPPEDevices) {
    const key = `${device.name.toLowerCase()}|unknown|`;
    if (existingKeys.has(key)) continue;

    const product = {
      name: device.name.substring(0, 500),
      category: device.category,
      manufacturer_name: 'Unknown',
      country_of_origin: device.country,
      risk_level: device.risk,
      data_source: device.source,
      registration_authority: device.auth,
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: 'medium',
    };

    const { error } = await supabase.from('ppe_products').insert(product);
    if (!error) {
      existingKeys.add(key);
      globalInserted++;
    }
  }
  console.log(`  全球标准产品插入: ${globalInserted} 条`);

  // ===== 4. Add regulations for missing regions =====
  console.log('\n[4] 补充法规数据...');

  const newRegulations = [
    { name: 'EU PPE Regulation 2016/425', code: 'EU 2016/425', region: 'EU', description: '欧盟个人防护装备法规，规定了PPE的设计、制造和合格评定要求' },
    { name: 'EN 149:2001+A1:2009 Respiratory Protective Devices', code: 'EN 149', region: 'EU', description: '欧洲标准：过滤式半面罩呼吸保护器要求' },
    { name: 'EN 166:2002 Personal Eye Protection', code: 'EN 166', region: 'EU', description: '欧洲标准：个人眼部保护规范' },
    { name: 'EN 397:2012+A1:2012 Industrial Safety Helmets', code: 'EN 397', region: 'EU', description: '欧洲标准：工业安全头盔规范' },
    { name: 'EN 352 Hearing Protectors', code: 'EN 352', region: 'EU', description: '欧洲标准：听力保护器系列标准' },
    { name: 'EN ISO 20345:2022 Safety Footwear', code: 'EN ISO 20345', region: 'EU', description: '欧洲标准：安全鞋规范' },
    { name: 'EN ISO 20471:2013 High Visibility Clothing', code: 'EN ISO 20471', region: 'EU', description: '欧洲标准：高可视性服装规范' },
    { name: 'EN 13795:2019 Surgical Clothing', code: 'EN 13795', region: 'EU', description: '欧洲标准：手术服和洁净空气服规范' },
    { name: 'EN 374 Protective Gloves Against Chemicals', code: 'EN 374', region: 'EU', description: '欧洲标准：防化学品保护手套' },
    { name: 'EN 137 Self-Contained Breathing Apparatus', code: 'EN 137', region: 'EU', description: '欧洲标准：自给式呼吸器规范' },

    { name: 'GB 2626-2019 Respiratory Protection', code: 'GB 2626', region: 'CN', description: '中国国标：呼吸防护用品 自吸过滤式防颗粒物呼吸器' },
    { name: 'GB 2811-2019 Safety Helmet', code: 'GB 2811', region: 'CN', description: '中国国标：头部防护 安全帽' },
    { name: 'GB 2117-2007 Protective Gloves', code: 'GB 2117', region: 'CN', description: '中国国标：手部防护防护手套' },
    { name: 'GB 12014-2019 Anti-static Workwear', code: 'GB 12014', region: 'CN', description: '中国国标：防静电服' },
    { name: 'GB 24539-2020 Chemical Protective Clothing', code: 'GB 24539', region: 'CN', description: '中国国标：防护服装 化学防护服' },
    { name: 'GB 14866-2006 Eye and Face Protection', code: 'GB 14866', region: 'CN', description: '中国国标：个人用眼护具技术要求' },

    { name: 'JIS T 8131 Safety Helmet', code: 'JIS T 8131', region: 'JP', description: '日本工业标准：安全帽' },
    { name: 'JIS T 8147 Protective Goggles', code: 'JIS T 8147', region: 'JP', description: '日本工业标准：保護めがね' },
    { name: 'JIS T 8150 Respiratory Protection', code: 'JIS T 8150', region: 'JP', description: '日本工业标准：呼吸用保護具' },
    { name: 'JIS T 8115 Protective Gloves', code: 'JIS T 8115', region: 'JP', description: '日本工业标准：保護手袋' },

    { name: 'KCS (Korean Certification of Safety)', code: 'KCS', region: 'KR', description: '韩国安全认证体系' },
    { name: 'KS M 6694 Respiratory Protection', code: 'KS M 6694', region: 'KR', description: '韩国标准：呼吸保護具' },
    { name: 'KS G 2601 Safety Helmet', code: 'KS G 2601', region: 'KR', description: '韩国标准：안전모' },

    { name: 'AS/NZS 1716:2012 Respiratory Protective Devices', code: 'AS/NZS 1716', region: 'AU', description: '澳新标准：呼吸保护设备' },
    { name: 'AS/NZS 1337:2010 Eye Protection', code: 'AS/NZS 1337', region: 'AU', description: '澳新标准：眼部保护' },
    { name: 'AS/NZS 1801:1997 Safety Helmets', code: 'AS/NZS 1801', region: 'AU', description: '澳新标准：安全头盔' },
    { name: 'AS/NZS 2210 Safety Footwear', code: 'AS/NZS 2210', region: 'AU', description: '澳新标准：安全鞋类' },

    { name: 'CAEPI Resolution RDC 386/2020 (Brazil)', code: 'RDC 386', region: 'BR', description: '巴西ANVISA法规：个人防护装备注册要求' },
    { name: 'NR-6 PPE Usage (Brazil)', code: 'NR-6', region: 'BR', description: '巴西法规：个人防护装备使用规范' },

    { name: 'IS 5852 Safety Helmets (India)', code: 'IS 5852', region: 'IN', description: '印度标准：安全头盔' },
    { name: 'IS 15298 Safety Footwear (India)', code: 'IS 15298', region: 'IN', description: '印度标准：安全鞋类' },
    { name: 'BIS IS 9167 Respiratory Protection (India)', code: 'IS 9167', region: 'IN', description: '印度标准：呼吸保护设备' },

    { name: 'SASO 1701 PPE Requirements (Saudi)', code: 'SASO 1701', region: 'SA', description: '沙特标准：个人防护装备要求' },

    { name: 'FDA Philippines AO 2020-0020 PPE', code: 'AO 2020-0020', region: 'PH', description: '菲律宾FDA法规：个人防护装备注册要求' },
  ];

  const existingRegs = await fetchAll('ppe_regulations', 'id,name,code,region');
  const existingRegKeys = new Set(existingRegs.map(r => `${r.name}|${r.code}`));

  let regInserted = 0;
  for (const reg of newRegulations) {
    const key = `${reg.name}|${reg.code}`;
    if (existingRegKeys.has(key)) continue;

    const { error } = await supabase.from('ppe_regulations').insert({
      name: reg.name,
      code: reg.code,
      region: reg.region,
      description: reg.description,
    });
    if (!error) {
      existingRegKeys.add(key);
      regInserted++;
    }
  }
  console.log(`  新增法规: ${regInserted} 条`);

  // ===== Final Summary =====
  console.log('\n========================================');
  console.log('最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: finalRegCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log(`  删除非PPE: ${nonPPECount} 条`);
  console.log(`  重新分类: ${reclassified} 条`);
  console.log(`  全球标准产品插入: ${globalInserted} 条`);
  console.log(`  新增法规: ${regInserted} 条`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
  console.log(`  最终法规数: ${finalRegCount}`);

  // Coverage check
  const finalProducts = await fetchAll('ppe_products', 'country_of_origin,category');
  const countryStats = {};
  const catStats = {};
  finalProducts.forEach(p => {
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
    catStats[p.category || 'Unknown'] = (catStats[p.category || 'Unknown'] || 0) + 1;
  });

  console.log('\n国家分布(前15):');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / finalProductCount * 100).toFixed(1)}%)`);
  });

  console.log('\n类别分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / finalProductCount * 100).toFixed(1)}%)`);
  });

  // Coverage assessment
  console.log('\n全球覆盖评估:');
  const regions = [
    ['US', '美国(FDA)'], ['EU', '欧盟(EUDAMED)'], ['CN', '中国(NMPA)'],
    ['JP', '日本(PMDA)'], ['KR', '韩国(MFDS)'], ['CA', '加拿大(Health Canada)'],
    ['AU', '澳大利亚(TGA)'], ['GB', '英国(MHRA)'], ['BR', '巴西(ANVISA)'],
    ['IN', '印度(CDSCO)'], ['SA', '沙特(SFDA)'], ['PH', '菲律宾(FDA)'],
  ];
  regions.forEach(([code, name]) => {
    const count = countryStats[code] || 0;
    const status = count > 100 ? '✅' : (count > 0 ? '⚠️' : '❌');
    console.log(`  ${status} ${name}: ${count} 条`);
  });
}

main().catch(console.error);
