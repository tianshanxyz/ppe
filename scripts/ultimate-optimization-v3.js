#!/usr/bin/env node

/**
 * 终极数据优化脚本 v3
 * 专注于提升manufacturer_name和减少"其他"类别
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

// ==================== 1. 终极优化manufacturer_name ====================
async function ultimateOptimizeManufacturer() {
  console.log('\n=== 终极优化manufacturer_name ===\n');

  let totalFixed = 0;

  // 策略1: 从FDA 510k API批量获取（使用更广泛的关键词）
  console.log('策略1: FDA 510k API批量获取');
  
  const keywords = [
    'mask', 'glove', 'gown', 'shield', 'goggle', 'respirator',
    'coverall', 'apron', 'cap', 'hood', 'boot cover', 'shoe cover',
    'protective clothing', 'surgical', 'examination', 'isolation',
    'nitrile', 'latex', 'vinyl', 'polyethylene',
    'face mask', 'surgical mask', 'procedure mask',
    'patient glove', 'surgeon glove', 'exam glove',
    'surgical gown', 'isolation gown', 'protective gown',
    'face shield', 'safety goggle', 'protective eyewear',
    'bouffant cap', 'surgical cap', 'nurse cap',
    'disposable', 'sterile', 'non-sterile',
  ];

  let apiEnriched = 0;
  let apiNewMfrs = 0;

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;
    let keywordEnriched = 0;

    for (let page = 0; page < 10; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=device_name:"${encodeURIComponent(keyword)}"&limit=${limit}&skip=${skip}`;
      
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.openfda.manufacturer_name?.[0] || item.applicant || '';
          const country = item.openfda.country_code?.[0] || 'US';
          const kNumber = item.k_number || '';

          if (!applicant || applicant.length < 2) continue;

          // 更新产品
          if (kNumber) {
            const { data: existing } = await supabase
              .from('ppe_products')
              .select('id')
              .or(`model.ilike.%${kNumber}%,name.ilike.%${kNumber}%`)
              .is('manufacturer_name', null)
              .limit(1);

            if (existing && existing.length > 0) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ 
                  manufacturer_name: applicant, 
                  country_of_origin: country.substring(0, 2) 
                })
                .eq('id', existing[0].id);
              
              if (!error) {
                keywordEnriched++;
                apiEnriched++;
              }
            }
          }
        }

        skip += limit;
        await sleep(200);
      } catch (e) {
        break;
      }
    }

    if (keywordEnriched > 0) {
      console.log(`  "${keyword}": +${keywordEnriched}`);
    }
  }

  console.log(`  ✅ FDA API回填: ${apiEnriched.toLocaleString()} 条`);
  totalFixed += apiEnriched;

  // 策略2: 深度解析description（更多模式）
  console.log('\n策略2: 深度解析description');
  let descEnriched = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  const patterns = [
    // 更多英文模式
    /(?:distributed|marketed|sold|supplied)\s*by[:\s]+([^,\n.]+)/i,
    /(?:importer|imported\s*by|exporter|exported\s*by)[:\s]+([^,\n.]+)/i,
    /(?:registered\s*office|headquarters|head\s*office)[:\s]+([^,\n.]+)/i,
    /(?:contact|inquiries)[:\s]+([^,\n.]+)/i,
    /(?:brand|trademark|label)[:\s]+([^,\n.]+)/i,
    // 公司名称模式
    /([A-Z][a-zA-Z\s&]+(?:Corp|Corporation|Inc|Incorporated|LLC|Ltd|Limited|Company|Co\.?|Group|International|Industries|Manufacturing|Technologies|Solutions|Systems|Products|Medical|Healthcare|Biotech|Pharma|Scientific|Equipment|Supply|Global|Americas|Europe|Asia|Pacific))/i,
    // 中文模式
    /(?:注册|总部|地址|联系|咨询|品牌|商标)[:\s：]+([^,\n.，。]+)/,
    /([^,\n.，。]+?)(?:医疗|科技|生物|制药|器械|用品|防护|安全|卫生|健康)(?:公司|企业|集团|有限公司|股份)/,
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
          if (name.length > 2 && name.length < 150) {
            if (!/^(product|device|equipment|system|model|type|class|category|brand|the|this|that|for|with|from|and|but|or|not|are|were|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|need|dare|ought|used)/i.test(name)) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ manufacturer_name: name })
                .eq('id', p.id);
              if (!error) {
                descEnriched++;
                break;
              }
            }
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已修复 ${descEnriched.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 从description提取: ${descEnriched.toLocaleString()} 条`);
  totalFixed += descEnriched;

  // 策略3: 基于model和name匹配已知制造商
  console.log('\n策略3: 基于model/name匹配制造商');
  let matchEnriched = 0;

  const { data: manufacturers } = await supabase
    .from('ppe_manufacturers')
    .select('name')
    .limit(50000);

  const mfrNames = (manufacturers || [])
    .map(m => m.name)
    .filter(n => n && n.length > 3 && n.length < 100);

  console.log(`  已知制造商: ${mfrNames.length} 个`);

  offset = 0;
  const { count: prodCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('model', 'is', null);

  console.log(`  待匹配产品(有model): ${prodCount?.toLocaleString() || 0} 条`);

  while (offset < (prodCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model, name')
      .is('manufacturer_name', null)
      .not('model', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const model = (p.model || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const text = `${model} ${name}`;

      for (const mfrName of mfrNames) {
        const mfrLower = mfrName.toLowerCase();
        // 匹配制造商名称的关键部分
        const mfrKey = mfrLower.split(/\s+/).filter(w => w.length > 3).slice(0, 2).join(' ');
        if (mfrKey && text.includes(mfrKey)) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ manufacturer_name: mfrName })
            .eq('id', p.id);
          if (!error) {
            matchEnriched++;
            break;
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${prodCount?.toLocaleString()} - 已匹配 ${matchEnriched.toLocaleString()}`);
      if (offset >= 40000) break;
    }
  }
  console.log(`  ✅ 匹配: ${matchEnriched.toLocaleString()} 条`);
  totalFixed += matchEnriched;

  return totalFixed;
}

// ==================== 2. 终极减少"其他"类别 ====================
async function ultimateReduceOther() {
  console.log('\n=== 终极减少"其他"类别 ===\n');

  // 更全面的分类规则（包括更多关键词）
  const reclassifyRules = [
    { category: '呼吸防护装备', sub: 'Mask', patterns: [/mask/i, /respirat/i, /n95/i, /kn95/i, /ffp/i, /filtering.*face/i, /particulate/i, /dust.*mask/i, /surgical.*mask/i, /medical.*mask/i, /disposable.*mask/i, /procedure.*mask/i, /isolation.*mask/i, /dental.*mask/i, /face.*mask/i, /mouth.*mask/i, /nose.*mask/i, /anti.*fog/i, /bacterial.*filter/i, /viral.*filter/i] },
    { category: '呼吸防护装备', sub: 'Respirator', patterns: [/respirator/i, /breathing.*apparatus/i, /self-contained.*breathing/i, /escape.*respirator/i, /gas.*mask/i, /powered.*air/i, /half.*mask/i, /full.*facepiece/i, /cartridge/i, /canister/i, /air.*purifying/i, /atmosphere.*supply/i, /supplied.*air/i, /rebreather/i, /scba/i] },
    { category: '手部防护装备', sub: 'Glove', patterns: [/glove/i, /nitrile/i, /latex/i, /vinyl.*glove/i, /exam.*glove/i, /surgical.*glove/i, /patient.*glove/i, /surgeon.*glove/i, /chemotherapy.*glove/i, /sterile.*glove/i, /procedure.*glove/i, /hand.*protection/i, /disposable.*glove/i, /powder.*free/i, /textured.*glove/i, /grip.*glove/i, /cut.*resistant/i, /heat.*resistant.*glove/i, /chemical.*glove/i] },
    { category: '身体防护装备', sub: 'Protective Garment', patterns: [/gown/i, /coverall/i, /protective.*cloth/i, /isolation.*gown/i, /surgical.*gown/i, /protective.*garment/i, /lab.*coat/i, /scrub.*suit/i, /apron/i, /drape/i, /barrier.*gown/i, /impervious.*gown/i, /reinforced.*gown/i, /protective.*suit/i, /disposable.*gown/i, /fluid.*resistant/i, /liquid.*proof/i, /chemical.*suit/i, /hazmat.*suit/i, /tyvek/i, /micro.*porous/i] },
    { category: '眼面部防护装备', sub: 'Face Shield', patterns: [/face.*shield/i, /goggle/i, /eye.*protection/i, /safety.*glass/i, /protective.*visor/i, /splash.*shield/i, /welding.*helmet/i, /spectacle/i, /eyewear/i, /anti.*fog.*lens/i, /impact.*resistant/i, /uv.*protection/i, /laser.*goggle/i, /chemical.*goggle/i, /dust.*goggle/i] },
    { category: '头部防护装备', sub: 'Head Protection', patterns: [/cap/i, /hood/i, /bouffant/i, /head.*cover/i, /surgical.*cap/i, /hair.*cover/i, /protective.*hood/i, /bump.*cap/i, /hard.*hat/i, /helmet/i, /skull.*cap/i, /tie.*on.*cap/i, /clip.*on.*cap/i, /ear.*loop.*cap/i, /beard.*cover/i, /mustache.*cover/i, /facial.*hair.*cover/i] },
    { category: '足部防护装备', sub: 'Foot Protection', patterns: [/shoe.*cover/i, /boot.*cover/i, /overshoe/i, /foot.*cover/i, /safety.*shoe/i, /steel.*toe/i, /clog/i, /footwear/i, /anti.*static.*shoe/i, /slip.*resistant/i, /puncture.*resistant/i, /metatarsal.*guard/i, /rubber.*boot/i, /safety.*boot/i] },
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
  console.log('  终极数据优化 v3');
  console.log('============================================================\n');

  // 优化前统计
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('优化前状态:');
  console.log(`  产品总数: ${totalProducts.toLocaleString()}`);
  console.log(`  manufacturer_name缺失: ${mfrNull.toLocaleString()} (${(mfrNull / totalProducts * 100).toFixed(1)}%)`);
  console.log(`  "其他"类别: ${catOther.toLocaleString()} (${(catOther / totalProducts * 100).toFixed(1)}%)`);

  // 执行终极优化
  const mfrFixed = await ultimateOptimizeManufacturer();
  const otherReduced = await ultimateReduceOther();

  // 优化后统计
  const { count: mfrNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOtherAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('\n============================================================');
  console.log('  终极优化后状态');
  console.log('============================================================\n');
  console.log(`  manufacturer_name缺失: ${mfrNullAfter.toLocaleString()} (${(mfrNullAfter / totalProducts * 100).toFixed(1)}%) - 改善 ${mfrFixed.toLocaleString()} 条`);
  console.log(`  "其他"类别: ${catOtherAfter.toLocaleString()} (${(catOtherAfter / totalProducts * 100).toFixed(1)}%) - 减少 ${otherReduced.toLocaleString()} 条`);
  
  console.log('\n  完整率:');
  console.log(`  manufacturer_name: ${((totalProducts - mfrNullAfter) / totalProducts * 100).toFixed(1)}%`);
  console.log(`  category(非其他): ${((totalProducts - catOtherAfter) / totalProducts * 100).toFixed(1)}%`);
}

main().catch(console.error);
