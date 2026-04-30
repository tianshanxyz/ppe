#!/usr/bin/env node

/**
 * 深度数据优化脚本 v2
 * 采用更激进的策略提升数据质量
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

// ==================== 1. 深度优化product_code ====================
async function deepOptimizeProductCode() {
  console.log('\n=== 深度优化product_code ===\n');

  let totalFixed = 0;

  // 策略1: 更宽松的正则匹配model字段
  console.log('策略1: 宽松匹配model字段');
  let fixed1 = 0;
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
      // 更宽松的模式：任何3-7个连续大写字母
      const matches = model.match(/[A-Z]{3,7}/g);
      if (matches && matches.length > 0) {
        // 取第一个匹配
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: matches[0] })
          .eq('id', p.id);
        if (!error) fixed1++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已修复 ${fixed1.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 修复: ${fixed1.toLocaleString()} 条`);
  totalFixed += fixed1;

  // 策略2: 从name字段提取
  console.log('\n策略2: 从name字段提取');
  let fixed2 = 0;
  offset = 0;

  const { count: nameCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null)
    .not('name', 'is', null);

  console.log(`  待处理: ${nameCount?.toLocaleString() || 0} 条`);

  while (offset < (nameCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name')
      .is('product_code', null)
      .not('name', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const name = p.name || '';
      // 查找类似 "Product Code XXXXX" 或 "[XXXXX]" 的模式
      const match = name.match(/(?:Product\s*Code|Prod\.?\s*Code)?[:\s\[([]?\s*([A-Z]{3,7})[\])\]]?/i);
      if (match && match[1]) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: match[1] })
          .eq('id', p.id);
        if (!error) fixed2++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${nameCount?.toLocaleString()} - 已修复 ${fixed2.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 修复: ${fixed2.toLocaleString()} 条`);
  totalFixed += fixed2;

  return totalFixed;
}

// ==================== 2. 深度优化manufacturer_name ====================
async function deepOptimizeManufacturer() {
  console.log('\n=== 深度优化manufacturer_name ===\n');

  let totalFixed = 0;

  // 策略1: 更激进的description解析
  console.log('策略1: 深度解析description');
  let fixed1 = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  const patterns = [
    // 英文模式
    /(?:manufactured|produced|made)\s*by[:\s]+([^,\n.]+)/i,
    /(?:owner|applicant|sponsor|submitter|regulant)[\s:]+([^,\n.]+)/i,
    /([^,\n]+?)\s+(?:Corp|Corporation|Inc|Incorporated|LLC|Ltd|Limited|Company|Co\.?)/i,
    /(?:company|manufacturer|producer|maker)[\s:]+([^,\n.]+)/i,
    // 中文模式
    /(?:生产|制造|出品|厂商|企业|公司)[者]?[\s:：]+([^,\n.，。]+)/,
    /([^,\n.，。]+?)(?:公司|企业|集团|有限公司|股份)/,
  ];

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description')
      .is('manufacturer_name', null)
      .not('description', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const desc = p.description || '';

      for (const pattern of patterns) {
        const match = desc.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim();
          // 过滤掉太短或太长的名称
          if (name.length > 2 && name.length < 150) {
            // 过滤掉明显不是公司名称的词
            if (!/^(product|device|equipment|system|model|type|class|category|brand|the|this|that|for|with|from|and|but)/i.test(name)) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ manufacturer_name: name })
                .eq('id', p.id);
              if (!error) {
                fixed1++;
                break;
              }
            }
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已修复 ${fixed1.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 修复: ${fixed1.toLocaleString()} 条`);
  totalFixed += fixed1;

  // 策略2: 基于现有制造商名称模糊匹配
  console.log('\n策略2: 基于现有制造商模糊匹配');
  let fixed2 = 0;

  // 获取所有已知制造商名称
  const { data: manufacturers } = await supabase
    .from('ppe_manufacturers')
    .select('name')
    .limit(50000);

  const mfrNames = (manufacturers || [])
    .map(m => m.name)
    .filter(n => n && n.length > 3 && n.length < 100);

  console.log(`  已知制造商: ${mfrNames.length} 个`);

  // 分批处理无制造商的产品
  offset = 0;
  const { count: prodCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null);

  console.log(`  待匹配产品: ${prodCount?.toLocaleString() || 0} 条`);

  // 使用description进行匹配
  while (offset < (prodCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description')
      .is('manufacturer_name', null)
      .not('description', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const desc = (p.description || '').toLowerCase();

      // 尝试匹配已知制造商名称
      for (const mfrName of mfrNames) {
        if (desc.includes(mfrName.toLowerCase().substring(0, Math.min(20, mfrName.length)))) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ manufacturer_name: mfrName })
            .eq('id', p.id);
          if (!error) {
            fixed2++;
            break;
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${prodCount?.toLocaleString()} - 已匹配 ${fixed2.toLocaleString()}`);
      // 限制处理数量以避免过长运行时间
      if (offset >= 30000) break;
    }
  }
  console.log(`  ✅ 匹配: ${fixed2.toLocaleString()} 条`);
  totalFixed += fixed2;

  return totalFixed;
}

// ==================== 3. 深度减少"其他"类别 ====================
async function deepReduceOther() {
  console.log('\n=== 深度减少"其他"类别 ===\n');

  // 更全面的分类规则
  const reclassifyRules = [
    { category: '呼吸防护装备', sub: 'Mask', patterns: [/mask/i, /respirat/i, /n95/i, /kn95/i, /ffp/i, /filtering.*face/i, /particulate/i, /dust.*mask/i, /surgical.*mask/i, /medical.*mask/i, /disposable.*mask/i, /procedure.*mask/i, /isolation.*mask/i, /dental.*mask/i, /face.*mask/i] },
    { category: '呼吸防护装备', sub: 'Respirator', patterns: [/respirator/i, /breathing.*apparatus/i, /self-contained.*breathing/i, /escape.*respirator/i, /gas.*mask/i, /powered.*air/i, /half.*mask/i, /full.*facepiece/i, /cartridge/i, /canister/i, /air.*purifying/i] },
    { category: '手部防护装备', sub: 'Glove', patterns: [/glove/i, /nitrile/i, /latex/i, /vinyl.*glove/i, /exam.*glove/i, /surgical.*glove/i, /patient.*glove/i, /surgeon.*glove/i, /chemotherapy.*glove/i, /sterile.*glove/i, /procedure.*glove/i, /hand.*protection/i, /disposable.*glove/i] },
    { category: '身体防护装备', sub: 'Protective Garment', patterns: [/gown/i, /coverall/i, /protective.*cloth/i, /isolation.*gown/i, /surgical.*gown/i, /protective.*garment/i, /lab.*coat/i, /scrub.*suit/i, /apron/i, /drape/i, /barrier.*gown/i, /impervious.*gown/i, /reinforced.*gown/i, /protective.*suit/i, /coverall/i, /disposable.*gown/i] },
    { category: '眼面部防护装备', sub: 'Face Shield', patterns: [/face.*shield/i, /goggle/i, /eye.*protection/i, /safety.*glass/i, /protective.*visor/i, /splash.*shield/i, /welding.*helmet/i, /spectacle/i, /eyewear/i] },
    { category: '头部防护装备', sub: 'Head Protection', patterns: [/cap/i, /hood/i, /bouffant/i, /head.*cover/i, /surgical.*cap/i, /hair.*cover/i, /protective.*hood/i, /bump.*cap/i, /hard.*hat/i, /helmet/i, /skull.*cap/i, /tie.*on.*cap/i] },
    { category: '足部防护装备', sub: 'Foot Protection', patterns: [/shoe.*cover/i, /boot.*cover/i, /overshoe/i, /foot.*cover/i, /safety.*shoe/i, /steel.*toe/i, /clog/i, /footwear/i] },
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
      .select('id, name, description, subcategory, model')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''} ${p.model || ''}`;

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

// ==================== 主函数 ====================
async function main() {
  console.log('============================================================');
  console.log('  深度数据优化 v2');
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

  // 执行深度优化
  const pcFixed = await deepOptimizeProductCode();
  const mfrFixed = await deepOptimizeManufacturer();
  const otherReduced = await deepReduceOther();

  // 优化后统计
  const { count: pcNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOtherAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('\n============================================================');
  console.log('  深度优化后状态');
  console.log('============================================================\n');
  console.log(`  product_code缺失: ${pcNullAfter.toLocaleString()} (${(pcNullAfter / totalProducts * 100).toFixed(1)}%) - 改善 ${pcFixed.toLocaleString()} 条`);
  console.log(`  manufacturer_name缺失: ${mfrNullAfter.toLocaleString()} (${(mfrNullAfter / totalProducts * 100).toFixed(1)}%) - 改善 ${mfrFixed.toLocaleString()} 条`);
  console.log(`  "其他"类别: ${catOtherAfter.toLocaleString()} (${(catOtherAfter / totalProducts * 100).toFixed(1)}%) - 减少 ${otherReduced.toLocaleString()} 条`);
  
  console.log('\n  完整率:');
  console.log(`  product_code: ${((totalProducts - pcNullAfter) / totalProducts * 100).toFixed(1)}%`);
  console.log(`  manufacturer_name: ${((totalProducts - mfrNullAfter) / totalProducts * 100).toFixed(1)}%`);
  console.log(`  category(非其他): ${((totalProducts - catOtherAfter) / totalProducts * 100).toFixed(1)}%`);
}

main().catch(console.error);
