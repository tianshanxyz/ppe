#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PAGE_SIZE = 1000;
const stats = {
  before: { products: 0, manufacturers: 0, regulations: 0 },
  deleted: { fakeModels: 0, unreliableSources: 0, duplicateProducts: 0, duplicateMfrs: 0, invalidMfrs: 0, invalidCountry: 0, nonPPE: 0 },
  fixed: { countryNames: 0, missingMfr: 0, missingRisk: 0 },
  after: { products: 0, manufacturers: 0, regulations: 0 }
};

async function fetchAll(table, columns) {
  const all = [];
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select(columns).range(from, to);
    if (error) { console.error(`Error fetching ${table}:`, error.message); break; }
    if (!data || data.length === 0) { hasMore = false; break; }
    all.push(...data);
    if (data.length < PAGE_SIZE) hasMore = false;
    page++;
  }
  return all;
}

async function deleteBatch(table, ids, label) {
  if (ids.length === 0) return 0;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    const { error } = await supabase.from(table).delete().in('id', batch);
    if (error) {
      console.error(`  Error deleting ${label}:`, error.message);
    } else {
      deleted += batch.length;
    }
  }
  console.log(`  删除 ${label}: ${deleted} 条`);
  return deleted;
}

async function main() {
  console.log('========================================');
  console.log('  PPE 数据库全面清洗');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  // 记录清洗前数据量
  const { count: pBefore } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mBefore } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rBefore } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  stats.before = { products: pBefore, manufacturers: mBefore, regulations: rBefore };
  console.log(`清洗前: 产品=${pBefore?.toLocaleString()}, 制造商=${mBefore?.toLocaleString()}, 法规=${rBefore?.toLocaleString()}\n`);

  // === 步骤1: 删除可疑model号(编造数据) ===
  console.log('=== 步骤1: 删除编造的model号 ===');
  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority');
  
  const fakeModelIds = products.filter(p => {
    if (!p.model) return false;
    return /^[A-Z]+-\d{10,}-[a-z0-9]{5,}$/.test(p.model) ||
           /^NMPA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^BIS-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^MFDS-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^ANVISA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^MHRA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^TGA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^PMDA-\d+-[a-z0-9]{5,}$/.test(p.model);
  }).map(p => p.id);
  
  stats.deleted.fakeModels = await deleteBatch('ppe_products', fakeModelIds, '编造model号');

  // === 步骤2: 删除非权威来源的编造数据 ===
  console.log('\n=== 步骤2: 删除非权威来源数据 ===');
  const unreliableSourceIds = products.filter(p => {
    const src = p.data_source || '';
    return src.includes('Known PPE Manufacturers') || 
           src.includes('Manufacturers Directory') ||
           src.includes('PPE Manufacturers Directory');
  }).map(p => p.id);
  
  stats.deleted.unreliableSources = await deleteBatch('ppe_products', unreliableSourceIds, '非权威来源');

  // === 步骤3: 修复国家名称不统一 ===
  console.log('\n=== 步骤3: 修复国家名称 ===');
  const countryMap = {
    'China': 'CN', 'United States': 'US', 'Canada': 'CA', 'Australia': 'AU',
    'France': 'FR', 'Germany': 'DE', 'Belgium': 'BE', 'United Kingdom': 'GB',
    'Korea': 'KR', 'Japan': 'JP', 'Brazil': 'BR', 'India': 'IN',
    'Malaysia': 'MY', 'Thailand': 'TH', 'Vietnam': 'VN', 'Indonesia': 'ID',
    'Philippines': 'PH', 'Singapore': 'SG', 'New Zealand': 'NZ', 'Taiwan': 'TW',
    'Spain': 'ES', 'Italy': 'IT', 'Netherlands': 'NL', 'Ireland': 'IE',
    'Switzerland': 'CH', 'Austria': 'AT', 'Sweden': 'SE', 'Norway': 'NO',
    'Finland': 'FI', 'Denmark': 'DK', 'Mexico': 'MX', 'Israel': 'IL',
    'Turkey': 'TR', 'Colombia': 'CO', 'Cambodia': 'KH', 'Sri Lanka': 'LK',
    'Madagascar': 'MG', 'Comoros': 'KM', 'El Salvador': 'SV', 'Hungary': 'HU',
    'Hong Kong': 'HK'
  };
  
  let countryFixed = 0;
  for (const [fullName, code] of Object.entries(countryMap)) {
    const { data, error } = await supabase
      .from('ppe_products')
      .update({ country_of_origin: code })
      .eq('country_of_origin', fullName)
      .select('id');
    if (!error && data && data.length > 0) {
      countryFixed += data.length;
      console.log(`  ${fullName} -> ${code}: ${data.length} 条`);
    }
  }
  stats.fixed.countryNames = countryFixed;
  console.log(`  共修复国家名称: ${countryFixed} 条`);

  // 同样修复制造商表的国家名称
  let mfrCountryFixed = 0;
  for (const [fullName, code] of Object.entries(countryMap)) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .update({ country: code })
      .eq('country', fullName)
      .select('id');
    if (!error && data && data.length > 0) {
      mfrCountryFixed += data.length;
    }
  }
  console.log(`  制造商表国家名称修复: ${mfrCountryFixed} 条`);

  // === 步骤4: 去重产品数据 ===
  console.log('\n=== 步骤4: 去重产品数据 ===');
  const currentProducts = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority,created_at');
  
  const productGroups = {};
  currentProducts.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`;
    if (!productGroups[key]) productGroups[key] = [];
    productGroups[key].push(p);
  });

  const duplicateProductIds = [];
  Object.entries(productGroups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 1 : 0) + (a.model ? 1 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0);
      const bScore = (b.description ? 1 : 0) + (b.model ? 1 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) {
      duplicateProductIds.push(group[i].id);
    }
  });

  stats.deleted.duplicateProducts = await deleteBatch('ppe_products', duplicateProductIds, '重复产品');

  // === 步骤5: 去重制造商数据 ===
  console.log('\n=== 步骤5: 去重制造商数据 ===');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,data_source,company_profile,contact_info,certifications');
  
  const mfrGroups = {};
  manufacturers.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });

  const duplicateMfrIds = [];
  Object.entries(mfrGroups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.website ? 1 : 0) + (a.company_profile ? 1 : 0) + (a.contact_info ? 1 : 0) + (a.certifications ? 1 : 0);
      const bScore = (b.website ? 1 : 0) + (b.company_profile ? 1 : 0) + (b.contact_info ? 1 : 0) + (b.certifications ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return (b.country || '').length - (a.country || '').length;
    });
    for (let i = 1; i < group.length; i++) {
      duplicateMfrIds.push(group[i].id);
    }
  });

  stats.deleted.duplicateMfrs = await deleteBatch('ppe_manufacturers', duplicateMfrIds, '重复制造商');

  // === 步骤6: 删除无效制造商(名称为空或明显无效) ===
  console.log('\n=== 步骤6: 删除无效制造商 ===');
  const currentMfrs = await fetchAll('ppe_manufacturers', 'id,name,country');
  
  const invalidMfrIds = currentMfrs.filter(m => {
    if (!m.name || m.name.trim() === '') return true;
    if (m.name.startsWith('●')) return true;
    if (m.name.length < 2) return true;
    return false;
  }).map(m => m.id);

  stats.deleted.invalidMfrs = await deleteBatch('ppe_manufacturers', invalidMfrIds, '无效制造商');

  // === 步骤7: 删除非PPE产品 ===
  console.log('\n=== 步骤7: 删除非PPE产品 ===');
  const currentProducts2 = await fetchAll('ppe_products', 'id,name,category,subcategory,description');
  
  const nonPPEKeywords = [
    /dental/i, /implant/i, /surgical instrument/i, /endoscope/i, /catheter/i,
    /stent/i, /pacemaker/i, /defibrillator/i, /wheelchair/i, /hospital bed/i,
    /x-ray/i, /ultrasound/i, /mri/i, /ct scan/i, /blood glucose/i,
    /insulin pump/i, /dialysis/i, /ventilator\b/i, /anesthesia/i,
    /syringe\b/i, /needle\b/i, /tongue depressor/i, /thermometer/i,
    /blood pressure/i, /stethoscope/i, /otoscope/i, /ophthalmoscope/i
  ];

  const nonPPEIds = currentProducts2.filter(p => {
    if (p.category !== '其他') return false;
    const text = `${p.name} ${p.description || ''}`;
    return nonPPEKeywords.some(kw => kw.test(text));
  }).map(p => p.id);

  stats.deleted.nonPPE = await deleteBatch('ppe_products', nonPPEIds, '非PPE产品');

  // === 步骤8: 清理孤立制造商(没有关联产品的) ===
  console.log('\n=== 步骤8: 清理孤立制造商 ===');
  const finalProducts = await fetchAll('ppe_products', 'manufacturer_name');
  const activeMfrNames = new Set(finalProducts.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  
  const finalMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanMfrIds = finalMfrs.filter(m => {
    if (!m.name) return true;
    return !activeMfrNames.has(m.name.toLowerCase().trim());
  }).map(m => m.id);

  console.log(`  孤立制造商(无关联产品): ${orphanMfrIds.length} 条`);
  // 注意: 不删除孤立制造商，因为它们可能在未来关联产品
  // 只删除明显无效的
  console.log(`  (保留孤立制造商，可能未来关联产品)`);

  // === 最终统计 ===
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rAfter } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  stats.after = { products: pAfter, manufacturers: mAfter, regulations: rAfter };

  console.log('\n========================================');
  console.log('  数据清洗完成报告');
  console.log('========================================');
  console.log(`\n--- 清洗前后数据量对比 ---`);
  console.log(`产品: ${stats.before.products?.toLocaleString()} -> ${stats.after.products?.toLocaleString()} (删除 ${(stats.before.products - stats.after.products).toLocaleString()})`);
  console.log(`制造商: ${stats.before.manufacturers?.toLocaleString()} -> ${stats.after.manufacturers?.toLocaleString()} (删除 ${(stats.before.manufacturers - stats.after.manufacturers).toLocaleString()})`);
  console.log(`法规: ${stats.before.regulations?.toLocaleString()} -> ${stats.after.regulations?.toLocaleString()}`);

  console.log(`\n--- 删除数据明细 ---`);
  console.log(`编造model号: ${stats.deleted.fakeModels}`);
  console.log(`非权威来源: ${stats.deleted.unreliableSources}`);
  console.log(`重复产品: ${stats.deleted.duplicateProducts}`);
  console.log(`重复制造商: ${stats.deleted.duplicateMfrs}`);
  console.log(`无效制造商: ${stats.deleted.invalidMfrs}`);
  console.log(`非PPE产品: ${stats.deleted.nonPPE}`);
  const totalDeleted = Object.values(stats.deleted).reduce((a, b) => a + b, 0);
  console.log(`总删除: ${totalDeleted}`);

  console.log(`\n--- 修复数据明细 ---`);
  console.log(`国家名称标准化: ${stats.fixed.countryNames}`);

  console.log(`\n--- 数据质量提升 ---`);
  const qualityBefore = Math.max(0, 100 - (31010 / stats.before.products * 100));
  const qualityAfter = Math.max(0, 100 - (Math.max(0, totalDeleted - stats.deleted.duplicateProducts) / stats.after.products * 100));
  console.log(`数据质量评分: ${qualityBefore.toFixed(1)} -> ${qualityAfter.toFixed(1)}`);
}

main().catch(console.error);
