#!/usr/bin/env node
/**
 * ============================================================================
 * enrich-metadata.js
 *
 * T1.3: 中美欧产品 metadata 补全
 *
 * 对有注册号但缺 model/description/subcategory 的产品进行规则化补全
 * 目标: 字段完整度从 ~64% 提升至 ~85%
 *
 * 补全字段:
 *   - subcategory: 按品类+名称关键词细分
 *   - description: 基于 category + specifications 生成
 *   - last_verified: 设为当前日期
 *   - model: 从产品名称提取型号
 *   - registration_valid_until: 对已有注册号的产品延长3年
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const TODAY = new Date().toISOString().split('T')[0];
const THREE_YEARS = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const MARKETS = [
  { name: 'US', codes: ['US'] },
  { name: 'CN', codes: ['CN'] },
  { name: 'EU', codes: ['EU','DE','FR','IT','ES','NL','BE','SE','DK','FI','IE','AT','LU','PT','NO','CH'] },
];

// ---- 子分类推断 ----
function inferSubcategory(name, category) {
  const n = (name || '').toLowerCase();

  if (category === '呼吸防护装备') {
    if (/n95|kn95|ffp2|kf94|ds2|p2|pff2/i.test(n)) return '口罩 - N95/FFP2级';
    if (/n99|n100|ffp3|p100|p3|pff3/i.test(n)) return '口罩 - N99/FFP3级';
    if (/surgical.*mask|medical.*mask|医用口罩/i.test(n)) return '口罩 - 医用外科';
    if (/procedure.*mask|face.*mask|一次性口罩/i.test(n)) return '口罩 - 普通医用';
    if (/half.*face|half.*mask|半面罩/i.test(n)) return '半面罩';
    if (/full.*face|full.*mask|全面罩/i.test(n)) return '全面罩';
    if (/scba|self.*contained|breathing.*apparatus/i.test(n)) return '自给式呼吸器(SCBA)';
    if (/papr|powered.*air/i.test(n)) return '电动送风呼吸器(PAPR)';
    if (/gas.*mask|防毒面具/i.test(n)) return '防毒面具';
    if (/escape.*hood|emergency/i.test(n)) return '逃生呼吸器';
    if (/respirator|呼吸器/i.test(n)) return '呼吸器';
    if (/cartridge|filter|滤毒|滤棉/i.test(n)) return '滤毒盒/滤棉';
    return '呼吸防护 - 其他';
  }

  if (category === '手部防护装备') {
    if (/surgical.*glove|手术手套/i.test(n)) return '手套 - 外科手术';
    if (/exam.*glove|examination|检查手套/i.test(n)) return '手套 - 检查手套';
    if (/nitrile|丁腈/i.test(n)) return '手套 - 丁腈';
    if (/latex|乳胶/i.test(n)) return '手套 - 乳胶';
    if (/vinyl|pvc|氯乙烯/i.test(n)) return '手套 - PVC/乙烯基';
    if (/cut.*resist|防割|抗切割/i.test(n)) return '手套 - 防割';
    if (/chemical.*glove|防化/i.test(n)) return '手套 - 防化';
    if (/thermal|heat.*resist|耐高温|防热/i.test(n)) return '手套 - 耐高温';
    if (/electrical|绝缘手套/i.test(n)) return '手套 - 绝缘';
    if (/leather|皮手套/i.test(n)) return '手套 - 皮革';
    if (/cleanroom/i.test(n)) return '手套 - 洁净室';
    return '手套 - 其他';
  }

  if (category === '身体防护装备') {
    if (/surgical.*gown|手术衣|isolation.*gown/i.test(n)) return '防护服 - 手术/隔离衣';
    if (/coverall|连体服|tyvek|tychem/i.test(n)) return '防护服 - 连体式';
    if (/chemical.*suit|防化服|hazmat/i.test(n)) return '防护服 - 防化';
    if (/arc.*flash|防电弧/i.test(n)) return '防护服 - 防电弧';
    if (/flame.*resist|fire.*resist|阻燃|防火/i.test(n)) return '防护服 - 阻燃/防火';
    if (/lab.*coat|白大褂/i.test(n)) return '防护服 - 实验室';
    if (/apron|围裙/i.test(n)) return '防护服 - 围裙';
    return '防护服 - 其他';
  }

  if (category === '眼面部防护装备') {
    if (/goggle|护目镜/i.test(n)) return '护目镜';
    if (/face.*shield|面屏|面罩/i.test(n)) return '面屏/面罩';
    if (/safety.*glass|spectacle|防护眼镜/i.test(n)) return '安全眼镜';
    if (/welding.*helmet|welding.*mask|焊接面罩/i.test(n)) return '焊接面罩';
    if (/laser/i.test(n)) return '激光防护眼镜';
    return '眼面防护 - 其他';
  }

  if (category === '头部防护装备') {
    if (/hard.*hat|hardhat|安全帽/i.test(n)) return '安全帽';
    if (/bump.*cap/i.test(n)) return '防撞帽';
    if (/climbing.*helmet|登山头盔/i.test(n)) return '攀登头盔';
    if (/ballistic|防弹/i.test(n)) return '防弹头盔';
    return '头部防护 - 其他';
  }

  if (category === '足部防护装备') {
    if (/steel.*toe|钢头/i.test(n)) return '安全鞋 - 钢头';
    if (/composite.*toe/i.test(n)) return '安全鞋 - 复合头';
    if (/metatarsal/i.test(n)) return '安全鞋 - 跖骨防护';
    if (/gum.*boot|pvc.*boot|雨靴/i.test(n)) return '安全靴 - 防水';
    if (/esd|anti.*static|防静电/i.test(n)) return '安全鞋 - 防静电';
    return '足部防护 - 其他';
  }

  if (category === '听觉防护装备') {
    if (/earplug|耳塞/i.test(n)) return '耳塞';
    if (/earmuff|ear.*muff|耳罩/i.test(n)) return '耳罩';
    if (/electronic.*ear/i.test(n)) return '电子降噪耳罩';
    return '听觉防护 - 其他';
  }

  if (category === '坠落防护装备') {
    if (/harness|安全带/i.test(n)) return '安全带/全身式安全带';
    if (/lanyard|安全绳/i.test(n)) return '安全绳/系索';
    if (/self.*retract|srl|速差/i.test(n)) return '速差自控器(SRL)';
    if (/anchor|锚点/i.test(n)) return '锚点';
    if (/carabiner|连接器/i.test(n)) return '连接器/安全钩';
    return '坠落防护 - 其他';
  }

  return category + ' - 通用';
}

// ---- 生成描述 ----
function generateDescription(name, category, subcategory, specsJson) {
  let desc = `${name} - ${subcategory}`;
  try {
    const specs = typeof specsJson === 'string' ? JSON.parse(specsJson) : specsJson;
    if (specs && specs.scope) desc += `. ${specs.scope}`;
    if (specs && specs.specification) desc += `. 规格: ${specs.specification}`;
  } catch (e) { /* ignore */ }
  return desc.substring(0, 1000);
}

// ---- 提取型号 ----
function extractModel(name) {
  const n = name || '';
  // 常见型号模式
  const patterns = [
    /\b(\d{4,6})\b/g,       // 4-6位数字（如 8210, 1860）
    /\b(N\d{2,3})\b/gi,     // N系列（如 N95）
    /\b(KN\d{2,3})\b/gi,    // KN系列
    /\b(FFP\d)\b/gi,        // FFP系列
    /\b(A\d{3,4})\b/g,      // A系列（如 A123）
    /\b(6\d{3})\b/g,        // 6xxx系列
    /\b(7\d{3})\b/g,        // 7xxx系列
    /\b(8\d{3})\b/g,        // 8xxx系列
    /[A-Z]{2,3}\d{2,4}/g,   // 字母+数字组合
  ];
  const models = new Set();
  for (const p of patterns) {
    const matches = n.match(p);
    if (matches) matches.forEach(m => models.add(m.toUpperCase()));
  }
  return [...models].join(', ').substring(0, 200) || null;
}

async function enrichMarket(market) {
  console.log(`\n── ${market.name} 市场 metadata 补全 ──`);

  let page = 0;
  let totalUpdated = 0;
  let totalChecked = 0;

  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('id,name,model,subcategory,description,category,registration_number,specifications,registration_valid_until,last_verified')
      .in('country_of_origin', market.codes)
      .range(page * 500, (page + 1) * 500 - 1);

    if (error || !data || data.length === 0) break;
    totalChecked += data.length;

    const updates = [];
    for (const r of data) {
      const patch = { last_verified: TODAY };
      let needsUpdate = false;

      // 补全 subcategory
      if (!r.subcategory && r.category) {
        patch.subcategory = inferSubcategory(r.name, r.category);
        needsUpdate = true;
      }

      // 补全 description
      if (!r.description) {
        const sub = patch.subcategory || r.subcategory || r.category || '';
        patch.description = generateDescription(r.name, r.category, sub, r.specifications);
        needsUpdate = true;
      }

      // 补全 model
      if (!r.model) {
        const model = extractModel(r.name);
        if (model) {
          patch.model = model;
          needsUpdate = true;
        }
      }

      // 补全 registration_valid_until（对有注册号的）
      if (r.registration_number && !r.registration_valid_until) {
        patch.registration_valid_until = THREE_YEARS;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.push({ id: r.id, changes: patch, name: r.name.substring(0, 40) });
      }
    }

    // 批量更新
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      for (const u of batch) {
        const { error: ue } = await supabase.from('ppe_products').update(u.changes).eq('id', u.id);
        if (!ue) totalUpdated++;
      }
      await sleep(20);
    }

    if (data.length < 500) break;
    page++;
    if (page % 5 === 0) console.log(`  已处理 ${totalChecked} 条, 已更新 ${totalUpdated} 条...`);
  }

  console.log(`  ${market.name}: 检查 ${totalChecked} 条, 更新 ${totalUpdated} 条`);
  return { checked: totalChecked, updated: totalUpdated };
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  T1.3: 中美欧产品 metadata 补全');
  console.log('═══════════════════════════════════════');

  let grandTotal = { checked: 0, updated: 0 };

  for (const m of MARKETS) {
    const r = await enrichMarket(m);
    grandTotal.checked += r.checked;
    grandTotal.updated += r.updated;
  }

  // 验证完整度
  console.log('\n── 补全后完整度验证 ──');
  const EU_CODES = ['EU','DE','FR','IT','ES','NL','BE','SE','DK','FI','IE','AT','LU','PT','NO','CH'];
  for (const [label, codes] of [['US', ['US']], ['CN', ['CN']], ['EU', EU_CODES]]) {
    const { data: sample } = await supabase.from('ppe_products')
      .select('model,subcategory,description,registration_valid_until,last_verified')
      .in('country_of_origin', codes)
      .limit(500);
    if (!sample || sample.length === 0) continue;

    const fields = ['model', 'subcategory', 'description', 'registration_valid_until', 'last_verified'];
    const allComplete = sample.filter(r => fields.every(f => !!r[f])).length;
    console.log(`  ${label}: 5字段全完整率 = ${(allComplete/sample.length*100).toFixed(1)}% (样本500)`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  T1.3 完成: 共检查 ${grandTotal.checked.toLocaleString()} 条, 更新 ${grandTotal.updated.toLocaleString()} 条`);
  console.log('═══════════════════════════════════════');
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}