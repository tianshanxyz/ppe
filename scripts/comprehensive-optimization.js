#!/usr/bin/env node

/**
 * 综合数据优化脚本
 * 1. 优化product_code字段
 * 2. 减少"其他"类别
 * 3. 继续提升manufacturer_name
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// ==================== 1. 优化product_code ====================
async function optimizeProductCode() {
  console.log('\n=== 优化product_code字段 ===\n');

  // 策略1: 从model字段提取FDA产品代码（3-7个大写字母）
  console.log('策略1: 从model字段提取产品代码');
  let extracted = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null)
    .not('model', 'is', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model')
      .is('product_code', null)
      .not('model', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const model = p.model || '';
      // FDA产品代码通常是3-7个大写字母
      const match = model.match(/\b([A-Z]{3,7})\b/);
      if (match) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: match[1] })
          .eq('id', p.id);
        if (!error) extracted++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已提取 ${extracted.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 从model提取: ${extracted.toLocaleString()} 条`);

  // 策略2: 从description提取产品代码
  console.log('\n策略2: 从description提取产品代码');
  let extractedFromDesc = 0;
  offset = 0;

  const { count: descCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${descCount?.toLocaleString() || 0} 条`);

  while (offset < (descCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description')
      .is('product_code', null)
      .not('description', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const desc = p.description || '';
      // 查找 "Product Code: XXXXX" 或 "510(k) Number: KXXXXXX" 模式
      const prodCodeMatch = desc.match(/Product\s*Code[:\s]+([A-Z]{3,7})/i);
      if (prodCodeMatch) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: prodCodeMatch[1] })
          .eq('id', p.id);
        if (!error) extractedFromDesc++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${descCount?.toLocaleString()} - 已提取 ${extractedFromDesc.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 从description提取: ${extractedFromDesc.toLocaleString()} 条`);

  return extracted + extractedFromDesc;
}

// ==================== 2. 减少"其他"类别 ====================
async function reduceOtherCategory() {
  console.log('\n=== 减少"其他"类别产品 ===\n');

  // 基于subcategory和关键词重新分类
  const reclassifyRules = [
    { category: '呼吸防护装备', sub: 'Mask', patterns: [/mask/i, /respirat/i, /n95/i, /kn95/i, /ffp/i, /filtering.*face/i, /particulate/i, /dust.*mask/i, /surgical.*mask/i, /medical.*mask/i] },
    { category: '呼吸防护装备', sub: 'Respirator', patterns: [/respirator/i, /breathing.*apparatus/i, /self-contained.*breathing/i, /escape.*respirator/i, /gas.*mask/i, /powered.*air/i] },
    { category: '手部防护装备', sub: 'Glove', patterns: [/glove/i, /nitrile/i, /latex/i, /vinyl.*glove/i, /exam.*glove/i, /surgical.*glove/i, /patient.*glove/i, /surgeon.*glove/i, /chemotherapy.*glove/i, /sterile.*glove/i, /procedure.*glove/i] },
    { category: '身体防护装备', sub: 'Protective Garment', patterns: [/gown/i, /coverall/i, /protective.*cloth/i, /isolation.*gown/i, /surgical.*gown/i, /protective.*garment/i, /lab.*coat/i, /scrub.*suit/i, /apron/i, /drape/i] },
    { category: '眼面部防护装备', sub: 'Face Shield', patterns: [/face.*shield/i, /goggle/i, /eye.*protection/i, /safety.*glass/i, /protective.*visor/i] },
    { category: '头部防护装备', sub: 'Head Protection', patterns: [/cap/i, /hood/i, /bouffant/i, /head.*cover/i, /surgical.*cap/i, /hair.*cover/i, /protective.*hood/i] },
    { category: '足部防护装备', sub: 'Foot Protection', patterns: [/shoe.*cover/i, /boot.*cover/i, /overshoe/i, /foot.*cover/i] },
  ];

  let reclassified = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`  "其他"类别产品: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description, subcategory')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''}`;

      for (const rule of reclassifyRules) {
        for (const pattern of rule.patterns) {
          if (pattern.test(text)) {
            const { error } = await supabase
              .from('ppe_products')
              .update({ category: rule.category, subcategory: rule.sub })
              .eq('id', p.id);
            if (!error) {
              reclassified++;
            }
            break;
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已重新分类 ${reclassified.toLocaleString()}`);
    }
  }

  console.log(`  ✅ 重新分类: ${reclassified.toLocaleString()} 条`);
  return reclassified;
}

// ==================== 3. 继续提升manufacturer_name ====================
async function enrichManufacturerName() {
  console.log('\n=== 继续提升manufacturer_name ===\n');

  // 策略1: 从name字段提取公司信息
  console.log('策略1: 从产品名称提取制造商');
  let enriched = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name')
      .is('manufacturer_name', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const name = p.name || '';
      // 查找 "by Company" 或 "Company - Product" 模式
      const byMatch = name.match(/\bby\s+([^,\-]+)/i);
      const companyMatch = name.match(/^([^,\-]+?)(?:\s+(?:Corp|Inc|LLC|Ltd|Co\.?))/i);

      const mfrName = byMatch?.[1] || companyMatch?.[1];
      if (mfrName && mfrName.trim().length > 2 && mfrName.trim().length < 100) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName.trim() })
          .eq('id', p.id);
        if (!error) enriched++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已回填 ${enriched.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 从name提取: ${enriched.toLocaleString()} 条`);

  return enriched;
}

// ==================== 主函数 ====================
async function main() {
  console.log('============================================================');
  console.log('  综合数据优化');
  console.log('============================================================\n');

  // 优化前统计
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: pcNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('优化前状态:');
  console.log(`  产品总数: ${totalProducts.toLocaleString()}`);
  console.log(`  product_code缺失: ${pcNull.toLocaleString()} (${(pcNull / totalProducts * 100).toFixed(1)}%)`);
  console.log(`  manufacturer_name缺失: ${mfrNull.toLocaleString()} (${(mfrNull / totalProducts * 100).toFixed(1)}%)`);
  console.log(`  "其他"类别: ${catOther.toLocaleString()} (${(catOther / totalProducts * 100).toFixed(1)}%)`);

  // 执行优化
  const pcFixed = await optimizeProductCode();
  const otherReduced = await reduceOtherCategory();
  const mfrEnriched = await enrichManufacturerName();

  // 优化后统计
  const { count: pcNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOtherAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('\n============================================================');
  console.log('  优化后状态');
  console.log('============================================================\n');
  console.log(`  product_code缺失: ${pcNullAfter.toLocaleString()} (${(pcNullAfter / totalProducts * 100).toFixed(1)}%) - 改善 ${pcFixed.toLocaleString()} 条`);
  console.log(`  manufacturer_name缺失: ${mfrNullAfter.toLocaleString()} (${(mfrNullAfter / totalProducts * 100).toFixed(1)}%) - 改善 ${mfrEnriched.toLocaleString()} 条`);
  console.log(`  "其他"类别: ${catOtherAfter.toLocaleString()} (${(catOtherAfter / totalProducts * 100).toFixed(1)}%) - 减少 ${otherReduced.toLocaleString()} 条`);
}

main().catch(console.error);
