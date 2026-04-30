#!/usr/bin/env node

/**
 * 深度优化 v5 - 针对性填补缺失数据
 * 1. manufacturer_name深度回填（FDA 510k关键词搜索 + 制造商模糊匹配 + description深度解析）
 * 2. country_of_origin批量回填（基于制造商表国家数据）
 * 3. "其他"类别深度清理
 * 4. product_code深度回填
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      if (i === retries) throw e;
      await sleep(2000);
    }
  }
}

// ==================== 1. manufacturer_name深度回填 ====================
async function deepFillManufacturer() {
  console.log('\n=== manufacturer_name深度回填 ===\n');
  let totalFixed = 0;

  // 策略1: 从FDA 510k API按关键词搜索，更新匹配产品
  console.log('策略1: FDA 510k API关键词搜索');
  let apiFixed = 0;

  const keywords = [
    'surgical mask', 'n95', 'respirator', 'examination glove', 'surgical gown',
    'face shield', 'isolation gown', 'protective goggle', 'nitrile glove',
    'latex glove', 'surgical cap', 'protective clothing', 'coverall',
    'disposable mask', 'medical mask', 'surgical glove', 'procedure glove',
    'safety goggle', 'medical face shield', 'sterile glove', 'shoe cover',
    'kn95', 'ffp2', 'ffp3', 'half mask', 'full facepiece',
    'patient examination glove', 'surgeon glove', 'chemotherapy glove',
    'protective garment', 'isolation drape', 'bouffant cap', 'head cover',
    'boot cover', 'overshoe', 'protective hood', 'lab coat', 'scrub suit',
    'apron', 'barrier gown', 'splash shield', 'particulate respirator',
    'filtering facepiece', 'air purifying respirator', 'powered air',
    'self contained breathing', 'gas mask', 'escape respirator',
    'surgical scrub suit', 'protective eyewear', 'safety spectacle',
    'dental mask', 'procedure mask', 'isolation mask',
    'vinyl glove', 'polyethylene glove', 'chloroprene glove',
    'neoprene glove', 'butyl rubber glove', 'viton glove',
  ];

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;
    let keywordFixed = 0;

    for (let page = 0; page < 5; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=device_name:"${encodeURIComponent(keyword)}"&limit=${limit}&skip=${skip}`;

      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.openfda?.manufacturer_name?.[0] || item.applicant || '';
          const kNumber = item.k_number || '';
          const productCode = item.openfda?.product_code?.[0] || '';
          const country = (item.openfda?.country_code?.[0] || 'US').substring(0, 2);
          const deviceName = item.device_name || '';

          if (!applicant) continue;

          // 尝试匹配现有产品（按k_number或设备名）
          let matched = false;

          if (kNumber) {
            const { data: existing } = await supabase
              .from('ppe_products')
              .select('id, manufacturer_name, product_code, country_of_origin')
              .ilike('model', `%${kNumber}%`)
              .limit(1);

            if (existing && existing.length > 0) {
              const updates = {};
              if (!existing[0].manufacturer_name) updates.manufacturer_name = applicant;
              if (!existing[0].product_code && productCode) updates.product_code = productCode;
              if (!existing[0].country_of_origin) updates.country_of_origin = country;

              if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                  .from('ppe_products')
                  .update(updates)
                  .eq('id', existing[0].id);
                if (!error) {
                  keywordFixed++;
                  matched = true;
                }
              }
            }
          }

          // 如果没有匹配到现有产品，按设备名搜索
          if (!matched && deviceName) {
            const { data: existing } = await supabase
              .from('ppe_products')
              .select('id, manufacturer_name, product_code, country_of_origin')
              .ilike('name', `%${deviceName}%`)
              .is('manufacturer_name', null)
              .limit(1);

            if (existing && existing.length > 0) {
              const updates = { manufacturer_name: applicant };
              if (productCode) updates.product_code = productCode;
              if (country) updates.country_of_origin = country;

              const { error } = await supabase
                .from('ppe_products')
                .update(updates)
                .eq('id', existing[0].id);
              if (!error) keywordFixed++;
            }
          }
        }

        skip += limit;
        await sleep(200);
      } catch (e) {
        break;
      }
    }

    if (keywordFixed > 0) {
      console.log(`  "${keyword}": ${keywordFixed} 条`);
    }
    apiFixed += keywordFixed;
  }
  console.log(`  ✅ FDA API回填: ${apiFixed.toLocaleString()} 条`);
  totalFixed += apiFixed;

  // 策略2: 制造商模糊匹配
  console.log('\n策略2: 制造商模糊匹配');
  let fuzzyFixed = 0;

  const { data: manufacturers } = await supabase
    .from('ppe_manufacturers')
    .select('name, country')
    .limit(50000);

  const mfrNames = (manufacturers || [])
    .filter(m => m.name && m.name.length > 3 && m.name !== 'Unknown')
    .map(m => m.name);

  console.log(`  已知制造商: ${mfrNames.length} 个`);

  // 构建简化的制造商名映射
  const mfrSimplified = {};
  for (const name of mfrNames) {
    const simplified = name.toLowerCase()
      .replace(/[.,\/\\\-&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = simplified.split(' ').filter(w => w.length > 2);
    if (words.length > 0) {
      mfrSimplified[simplified] = name;
    }
  }

  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description, name')
      .is('manufacturer_name', null)
      .not('description', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = `${p.description || ''} ${p.name || ''}`.toLowerCase();

      // 尝试匹配已知制造商
      for (const [simplified, original] of Object.entries(mfrSimplified)) {
        if (text.includes(simplified) || text.includes(simplified.replace(/\s/g, ''))) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ manufacturer_name: original })
            .eq('id', p.id);
          if (!error) {
            fuzzyFixed++;
          }
          break;
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()} - 已匹配 ${fuzzyFixed.toLocaleString()}`);
      if (offset >= 30000) break;
    }
  }
  console.log(`  ✅ 模糊匹配: ${fuzzyFixed.toLocaleString()} 条`);
  totalFixed += fuzzyFixed;

  // 策略3: 深度解析description
  console.log('\n策略3: 深度解析description');
  let descFixed = 0;
  offset = 0;

  const patterns = [
    /Owner:\s*([^,\n]+)/i,
    /Applicant:\s*([^,\n]+)/i,
    /Manufacturer:\s*([^,\n]+)/i,
    /manufactured by[:\s]+([^,\n.]+)/i,
    /produced by[:\s]+([^,\n.]+)/i,
    /made by[:\s]+([^,\n.]+)/i,
    /distributed by[:\s]+([^,\n.]+)/i,
    /marketed by[:\s]+([^,\n.]+)/i,
    /supplied by[:\s]+([^,\n.]+)/i,
    /sold by[:\s]+([^,\n.]+)/i,
    /company[\s:]+([^,\n.]+)/i,
    /([^,\n.]{3,80}?)\s+(?:Corp|Corporation|Inc|Incorporated|LLC|Ltd|Limited|Company|Co\.?|Group|International|Industries|Manufacturing|Technologies|Medical|Healthcare|Biotech|Scientific|Equipment|Supply|Global|Systems|Devices|Diagnostics|Pharmaceutical|Therapeutics|Laboratories|Research)/i,
    /(?:注册|生产|制造|出品|厂商|企业|公司)[者]?[\s:：]+([^,\n.，。]+)/,
    /([^,\n.，。]+?)(?:公司|企业|集团|有限公司|股份)/,
  ];

  const { count: descCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${descCount?.toLocaleString() || 0} 条`);

  while (offset < (descCount || 0)) {
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
            const skipWords = /^(product|device|equipment|system|model|type|class|category|brand|the|this|that|for|with|from|and|but|or|not|are|were|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|need|dare|ought|used|new|old|high|low|medium|other|more|less|all|some|any|each|every|both|few|many|much|such|own|same|than|too|very|just|also|only|still|already|yet|ever|never|always|often|sometimes|usually|here|there|when|where|why|how|what|which|who|whom|whose|number|code|date|name|description|status|approved|pending|rejected|active|inactive)/i;
            if (!skipWords.test(name)) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ manufacturer_name: name })
                .eq('id', p.id);
              if (!error) {
                descFixed++;
                break;
              }
            }
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()} - 已修复 ${descFixed.toLocaleString()}`);
    }
  }
  console.log(`  ✅ description解析: ${descFixed.toLocaleString()} 条`);
  totalFixed += descFixed;

  // 策略4: 从name字段提取制造商
  console.log('\n策略4: 从name字段提取制造商');
  let nameFixed = 0;
  offset = 0;

  const { count: nameCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('name', 'is', null);

  console.log(`  待处理: ${nameCount?.toLocaleString() || 0} 条`);

  while (offset < (nameCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name')
      .is('manufacturer_name', null)
      .not('name', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const name = p.name || '';

      // 匹配 "BrandName by Manufacturer" 或 "Manufacturer ProductName"
      const byMatch = name.match(/^(.+?)\s+by\s+(.+)$/i);
      if (byMatch) {
        const mfr = byMatch[2].trim();
        if (mfr.length > 2 && mfr.length < 100) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ manufacturer_name: mfr })
            .eq('id', p.id);
          if (!error) {
            nameFixed++;
            continue;
          }
        }
      }

      // 匹配 "Manufacturer - Product" 或 "Manufacturer | Product"
      const dashMatch = name.match(/^(.+?)[\-\|]\s*(.+)$/);
      if (dashMatch) {
        const mfr = dashMatch[1].trim();
        if (mfr.length > 2 && mfr.length < 100 && !/^(n95|kn95|ffp|surgical|medical|disposable|protective|exam|isolation|sterile)/i.test(mfr)) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ manufacturer_name: mfr })
            .eq('id', p.id);
          if (!error) {
            nameFixed++;
            continue;
          }
        }
      }
    }

    offset += batchSize;
  }
  console.log(`  ✅ name字段提取: ${nameFixed.toLocaleString()} 条`);
  totalFixed += nameFixed;

  return totalFixed;
}

// ==================== 2. country_of_origin批量回填 ====================
async function batchFillCountry() {
  console.log('\n=== country_of_origin批量回填 ===\n');
  let totalFixed = 0;

  // 策略1: 基于制造商表的国家数据
  console.log('策略1: 基于制造商表的国家数据');
  let mfrCountryFixed = 0;

  const { data: manufacturers } = await supabase
    .from('ppe_manufacturers')
    .select('name, country')
    .not('country', 'is', null)
    .limit(50000);

  const mfrCountryMap = {};
  for (const m of (manufacturers || [])) {
    if (m.name && m.country) {
      mfrCountryMap[m.name.toLowerCase().trim()] = m.country;
    }
  }

  console.log(`  有国家信息的制造商: ${Object.keys(mfrCountryMap).length} 个`);

  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('country_of_origin', null)
    .not('manufacturer_name', 'is', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, manufacturer_name')
      .is('country_of_origin', null)
      .not('manufacturer_name', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const mfrKey = (p.manufacturer_name || '').toLowerCase().trim();
      const country = mfrCountryMap[mfrKey];

      if (country) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ country_of_origin: country })
          .eq('id', p.id);
        if (!error) mfrCountryFixed++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()} - 已修复 ${mfrCountryFixed.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 制造商国家回填: ${mfrCountryFixed.toLocaleString()} 条`);
  totalFixed += mfrCountryFixed;

  // 策略2: 从description中提取国家
  console.log('\n策略2: 从description中提取国家');
  let descCountryFixed = 0;
  offset = 0;

  const countryPatterns = [
    { pattern: /country[_\s]of[_\s]origin[:\s]+([A-Z]{2})/i, group: 1 },
    { pattern: /country[:\s]+(US|CA|CN|JP|KR|GB|DE|FR|IN|BR|AU|MX|IT|ES|NL|SE|CH|BE|AT|DK|NO|FI|PT|IE|PL|CZ|HU|RO|BG|HR|SK|SI|EE|LV|LT|LU|MT|CY|GR|NZ|SG|MY|TH|VN|ID|PH|TW|HK|IL|ZA|TR|AR|CL|CO|PE|VE)/i, group: 1 },
    { pattern: /(?:made|manufactured|produced)\s+in\s+([A-Z]{2})/i, group: 1 },
    { pattern: /(?:China|USA|Japan|Korea|Germany|France|UK|India|Brazil|Canada|Australia|Mexico|Italy|Spain|Netherlands|Sweden|Switzerland|Belgium|Austria|Denmark|Norway|Finland|Portugal|Ireland|Poland)/i, group: 0 },
  ];

  const countryNameMap = {
    'China': 'CN', 'USA': 'US', 'Japan': 'JP', 'Korea': 'KR', 'Germany': 'DE',
    'France': 'FR', 'UK': 'GB', 'India': 'IN', 'Brazil': 'BR', 'Canada': 'CA',
    'Australia': 'AU', 'Mexico': 'MX', 'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL',
    'Sweden': 'SE', 'Switzerland': 'CH', 'Belgium': 'BE', 'Austria': 'AT',
    'Denmark': 'DK', 'Norway': 'NO', 'Finland': 'FI', 'Portugal': 'PT',
    'Ireland': 'IE', 'Poland': 'PL',
  };

  const { count: descCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('country_of_origin', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${descCount?.toLocaleString() || 0} 条`);

  while (offset < (descCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description')
      .is('country_of_origin', null)
      .not('description', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const desc = p.description || '';

      for (const { pattern, group } of countryPatterns) {
        const match = desc.match(pattern);
        if (match) {
          let country = match[group];
          if (countryNameMap[country]) country = countryNameMap[country];
          if (country && country.length === 2) {
            const { error } = await supabase
              .from('ppe_products')
              .update({ country_of_origin: country })
              .eq('id', p.id);
            if (!error) descCountryFixed++;
            break;
          }
        }
      }
    }

    offset += batchSize;
  }
  console.log(`  ✅ description国家提取: ${descCountryFixed.toLocaleString()} 条`);
  totalFixed += descCountryFixed;

  return totalFixed;
}

// ==================== 3. "其他"类别深度清理 ====================
async function deepCleanOther() {
  console.log('\n=== "其他"类别深度清理 ===\n');

  // 策略1: 更精确的重新分类
  console.log('策略1: 重新分类');
  let reclassified = 0;
  const batchSize = 2000;
  let offset = 0;

  const reclassifyRules = [
    { category: '呼吸防护装备', sub: 'Mask', patterns: [/mask/i, /respirat/i, /n95/i, /kn95/i, /ffp/i, /filtering.*face/i, /particulate/i, /face.*mask/i, /mouth.*cover/i, /surgical.*mask/i, /medical.*mask/i, /dental.*mask/i, /procedure.*mask/i, /isolation.*mask/i, /disposable.*mask/i, /protective.*mask/i] },
    { category: '呼吸防护装备', sub: 'Respirator', patterns: [/respirator/i, /breathing.*apparatus/i, /self-contained/i, /gas.*mask/i, /powered.*air/i, /half.*mask/i, /full.*facepiece/i, /cartridge/i, /air.*purifying/i, /scba/i, /sar/i, /escape.*hood/i, /cba/i] },
    { category: '手部防护装备', sub: 'Glove', patterns: [/glove/i, /nitrile/i, /latex/i, /vinyl.*glove/i, /exam.*glove/i, /surgical.*glove/i, /hand.*protection/i, /disposable.*glove/i, /sterile.*glove/i, /procedure.*glove/i, /chemotherapy.*glove/i, /polyethylene.*glove/i, /chloroprene/i, /neoprene.*glove/i] },
    { category: '身体防护装备', sub: 'Protective Garment', patterns: [/gown/i, /coverall/i, /protective.*cloth/i, /isolation.*gown/i, /lab.*coat/i, /scrub.*suit/i, /apron/i, /protective.*suit/i, /barrier.*gown/i, /hazmat/i, /tyvek/i, /protective.*garment/i, /surgical.*gown/i, /isolation.*suit/i, /disposable.*gown/i, /patient.*gown/i, /protective.*apparel/i] },
    { category: '眼面部防护装备', sub: 'Face Shield', patterns: [/face.*shield/i, /goggle/i, /eye.*protection/i, /safety.*glass/i, /visor/i, /eyewear/i, /splash.*shield/i, /spectacle/i, /protective.*eyewear/i, /safety.*goggle/i, /welding.*helmet/i] },
    { category: '头部防护装备', sub: 'Head Protection', patterns: [/cap/i, /hood/i, /bouffant/i, /head.*cover/i, /surgical.*cap/i, /hair.*cover/i, /helmet/i, /skull.*cap/i, /surgeon.*cap/i, /scrub.*cap/i, /beanie/i] },
    { category: '足部防护装备', sub: 'Foot Protection', patterns: [/shoe.*cover/i, /boot.*cover/i, /overshoe/i, /foot.*cover/i, /footwear/i, /safety.*shoe/i, /clog/i, /bootie/i] },
  ];

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`  "其他"类别: ${count?.toLocaleString() || 0} 条`);

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
            if (!error) reclassified++;
            break;
          }
        }
      }
    }

    offset += batchSize;
  }
  console.log(`  ✅ 重新分类: ${reclassified.toLocaleString()} 条`);

  // 策略2: 删除明显非PPE产品
  console.log('\n策略2: 删除明显非PPE产品');
  let deleted = 0;

  const nonPPEPatterns = [
    /implant/i, /orthoped/i, /cardiac/i, /pacemaker/i, /stent/i,
    /catheter/i, /syringe/i, /scalpel/i, /dental.*implant/i,
    /wheelchair/i, /defibrill/i, /ventilat/i, /infusion/i,
    /dialysis/i, /x-ray/i, /ultrasound/i, /mri/i, /ct scan/i,
    /endoscop/i, /laparoscop/i, /electrode/i, /sensor/i,
    /diagnostic.*test/i, /reagent/i, /steriliz/i, /disinfect/i,
    /microscope/i, /centrifuge/i, /incubat/i,
    /prosth/i, /hearing aid/i, /blood.*transfus/i,
    /suture/i, /needle/i, /drill/i, /saw/i, /screw/i,
    /bone/i, /joint/i, /spine/i, /kidney/i, /liver/i, /heart/i,
    /tumor/i, /cancer/i, /oncolog/i, /chemo/i, /radiat/i,
    /laser/i, /ablat/i, /cauter/i, /knife/i, /blade/i,
    /breast.*implant/i, /thyroid/i, /stomach/i, /colon/i, /prostate/i,
    /robot/i, /transceiver/i, /probe/i, /pump/i, /generator/i,
    /cable/i, /tube/i, /cannula/i, /anchor/i, /graft/i,
    /valve/i, /shunt/i, /filter.*vena/i,
    /biopsy/i, /specimen/i, /swab/i, /gauze/i, /sponge/i,
    /stoma/i, /ostom/i, /drain/i, /suction/i, /irrigat/i,
    /inject/i, /transfus/i, /blood/i, /urine/i,
  ];

  const { count: otherCount2 } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  offset = 0;

  while (offset < (otherCount2 || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    const toDelete = [];

    for (const p of data) {
      const text = `${p.name || ''} ${p.description || ''}`;

      for (const pattern of nonPPEPatterns) {
        if (pattern.test(text)) {
          toDelete.push(p.id);
          break;
        }
      }
    }

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .delete()
        .in('id', toDelete);
      if (!error) deleted += toDelete.length;
    }

    offset += batchSize;
  }
  console.log(`  ✅ 删除非PPE: ${deleted.toLocaleString()} 条`);

  return { reclassified, deleted };
}

// ==================== 4. product_code深度回填 ====================
async function deepFillProductCode() {
  console.log('\n=== product_code深度回填 ===\n');
  let totalFixed = 0;

  // 策略1: FDA Classification API
  console.log('策略1: FDA Classification API');
  let classFixed = 0;

  const { count: pcNull } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null)
    .not('name', 'is', null);

  console.log(`  待处理: ${pcNull?.toLocaleString() || 0} 条`);

  // 获取FDA分类数据
  const ppeDeviceNames = [
    'mask', 'glove', 'gown', 'respirator', 'shield', 'protective',
    'surgical', 'examination', 'isolation', 'nitrile', 'latex',
    'coverall', 'apron', 'cap', 'hood', 'boot cover',
  ];

  const classificationMap = {};

  for (const name of ppeDeviceNames) {
    const url = `https://api.fda.gov/device/classification.json?api_key=${FDA_API_KEY}&search=device_name:"${encodeURIComponent(name)}"&limit=100`;

    try {
      const data = await fetchJson(url);
      if (data.results) {
        for (const item of data.results) {
          if (item.device_name && item.product_code) {
            classificationMap[item.device_name.toLowerCase()] = item.product_code;
          }
        }
      }
    } catch (e) {
      // continue
    }
    await sleep(200);
  }

  console.log(`  FDA分类映射: ${Object.keys(classificationMap).length} 条`);

  // 应用分类映射
  const batchSize = 2000;
  let offset = 0;

  while (offset < (pcNull || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name')
      .is('product_code', null)
      .not('name', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const name = (p.name || '').toLowerCase();

      for (const [deviceName, code] of Object.entries(classificationMap)) {
        if (name.includes(deviceName) || deviceName.includes(name)) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ product_code: code })
            .eq('id', p.id);
          if (!error) classFixed++;
          break;
        }
      }
    }

    offset += batchSize;
  }
  console.log(`  ✅ FDA分类回填: ${classFixed.toLocaleString()} 条`);
  totalFixed += classFixed;

  // 策略2: 基于subcategory推断product_code
  console.log('\n策略2: 基于subcategory推断product_code');
  let subFixed = 0;
  offset = 0;

  const subToCode = {
    'Mask': 'FXX',
    'Respirator': 'LYU',
    'Glove': 'KND',
    'Protective Garment': 'FYA',
    'Face Shield': 'HZA',
    'Head Protection': 'LNP',
    'Foot Protection': 'FRO',
  };

  const { count: pcNull2 } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null)
    .not('subcategory', 'is', null);

  console.log(`  待处理: ${pcNull2?.toLocaleString() || 0} 条`);

  while (offset < (pcNull2 || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, subcategory')
      .is('product_code', null)
      .not('subcategory', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const code = subToCode[p.subcategory];
      if (code) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: code })
          .eq('id', p.id);
        if (!error) subFixed++;
      }
    }

    offset += batchSize;
  }
  console.log(`  ✅ subcategory推断: ${subFixed.toLocaleString()} 条`);
  totalFixed += subFixed;

  return totalFixed;
}

// ==================== 主函数 ====================
async function main() {
  console.log('============================================================');
  console.log('  深度优化 v5 - 针对性填补缺失数据');
  console.log('============================================================\n');

  const { count: totalBefore } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrBefore } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: pcNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: countryNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);

  console.log('优化前状态:');
  console.log(`  产品总数: ${totalBefore.toLocaleString()}`);
  console.log(`  制造商总数: ${mfrBefore.toLocaleString()}`);
  console.log(`  product_code缺失: ${pcNull.toLocaleString()} (${(pcNull / totalBefore * 100).toFixed(1)}%)`);
  console.log(`  manufacturer_name缺失: ${mfrNull.toLocaleString()} (${(mfrNull / totalBefore * 100).toFixed(1)}%)`);
  console.log(`  "其他"类别: ${catOther.toLocaleString()} (${(catOther / totalBefore * 100).toFixed(1)}%)`);
  console.log(`  country_of_origin缺失: ${countryNull.toLocaleString()} (${(countryNull / totalBefore * 100).toFixed(1)}%)`);

  const mfrFixed = await deepFillManufacturer();
  const countryFixed = await batchFillCountry();
  const { reclassified, deleted } = await deepCleanOther();
  const pcFixed = await deepFillProductCode();

  const { count: totalAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: pcNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOtherAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: countryNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);

  console.log('\n============================================================');
  console.log('  深度优化后状态');
  console.log('============================================================\n');
  console.log(`  产品总数: ${totalBefore.toLocaleString()} → ${totalAfter.toLocaleString()} (${totalAfter > totalBefore ? '+' : ''}${(totalAfter - totalBefore).toLocaleString()})`);
  console.log(`  制造商总数: ${mfrBefore.toLocaleString()} → ${mfrAfter.toLocaleString()}`);
  console.log('');
  console.log(`  product_code完整率: ${((totalAfter - pcNullAfter) / totalAfter * 100).toFixed(1)}% (${(totalAfter - pcNullAfter).toLocaleString()}/${totalAfter.toLocaleString()})`);
  console.log(`  manufacturer_name完整率: ${((totalAfter - mfrNullAfter) / totalAfter * 100).toFixed(1)}% (${(totalAfter - mfrNullAfter).toLocaleString()}/${totalAfter.toLocaleString()})`);
  console.log(`  category(非其他): ${((totalAfter - catOtherAfter) / totalAfter * 100).toFixed(1)}% (${(totalAfter - catOtherAfter).toLocaleString()}/${totalAfter.toLocaleString()})`);
  console.log(`  country_of_origin完整率: ${((totalAfter - countryNullAfter) / totalAfter * 100).toFixed(1)}% (${(totalAfter - countryNullAfter).toLocaleString()}/${totalAfter.toLocaleString()})`);

  console.log('\n  优化详情:');
  console.log(`  manufacturer_name回填: ${mfrFixed.toLocaleString()} 条`);
  console.log(`  country_of_origin回填: ${countryFixed.toLocaleString()} 条`);
  console.log(`  "其他"重新分类: ${reclassified.toLocaleString()} 条`);
  console.log(`  非PPE删除: ${deleted.toLocaleString()} 条`);
  console.log(`  product_code回填: ${pcFixed.toLocaleString()} 条`);
}

main().catch(console.error);
