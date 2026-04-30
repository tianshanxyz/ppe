#!/usr/bin/env node

/**
 * 深度优化脚本 v4
 * 1. FDA UDI数据库深度采集
 * 2. FDA 510k产品去重后重新插入
 * 3. manufacturer_name批量回填
 * 4. product_code批量回填
 * 5. "其他"类别深度清理
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

const PPE_CODES = {
  'FXX': { category: '呼吸防护装备', sub: 'Mask', risk: 'high' },
  'MSH': { category: '呼吸防护装备', sub: 'Mask', risk: 'high' },
  'LYU': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'NZJ': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'OWF': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'QKR': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'KND': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'KPF': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZC': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LXA': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'MYB': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'FYA': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FXO': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'LYZ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEA': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEM': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEO': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEP': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'HZA': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'HZE': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'KMF': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LNP': { category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
  'KCF': { category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
  'FRO': { category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
  'KST': { category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
};

// ==================== 1. FDA UDI深度采集 ====================
async function collectFDAUDI() {
  console.log('\n=== FDA UDI数据库深度采集 ===\n');
  let totalInserted = 0;
  let totalMfrs = 0;

  const productCodes = Object.keys(PPE_CODES);

  for (const code of productCodes) {
    const info = PPE_CODES[code];
    const limit = 100;
    let skip = 0;
    let codeCount = 0;

    for (let page = 0; page < 20; page++) {
      const url = `https://api.fda.gov/device/udi.json?api_key=${FDA_API_KEY}&search=device_identifier:*+product_code:${code}&limit=${limit}&skip=${skip}`;

      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const deviceName = item.device_name || item.brand_name || '';
          const mfrName = item.company_name || item.openfda?.manufacturer_name?.[0] || '';
          const country = (item.country_of_origin || item.openfda?.country_code?.[0] || 'US').substring(0, 2);
          const di = item.device_identifier || '';
          const versionModel = item.version_or_model_number || '';
          const catalogNumber = item.catalog_number || '';
          const deviceClass = item.openfda?.device_class?.[0] || '';

          if (!mfrName) continue;

          // 插入制造商
          const { error: mfrError } = await supabase
            .from('ppe_manufacturers')
            .insert({ name: mfrName, country, website: '' }, { onConflict: 'name' });
          if (!mfrError) totalMfrs++;

          // 检查是否已存在
          const { data: existing } = await supabase
            .from('ppe_products')
            .select('id')
            .or(`model.ilike.%${di}%,model.ilike.%${catalogNumber}%`)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const productData = {
            name: deviceName || `PPE Device ${code}`,
            category: info.category,
            subcategory: info.sub,
            risk_level: info.risk,
            manufacturer_name: mfrName,
            country_of_origin: country,
            product_code: code,
            model: di || catalogNumber || versionModel || `UDI-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            description: `FDA UDI Database\nDevice: ${deviceName}\nManufacturer: ${mfrName}\nProduct Code: ${code}\nDI: ${di}\nModel: ${versionModel}\nCatalog: ${catalogNumber}\nClass: ${deviceClass}`,
            certifications: JSON.stringify([{ type: 'FDA UDI', number: di, status: 'active' }]),
            status: 'approved',
          };

          const { error } = await supabase
            .from('ppe_products')
            .insert(productData);

          if (!error) {
            codeCount++;
            totalInserted++;
          }
        }

        skip += limit;
        await sleep(200);
      } catch (e) {
        break;
      }
    }

    if (codeCount > 0) {
      console.log(`  UDI ${code} (${info.sub}): +${codeCount}`);
    }
  }

  console.log(`  ✅ FDA UDI采集: ${totalInserted.toLocaleString()} 条产品, ${totalMfrs.toLocaleString()} 个制造商`);
  return totalInserted;
}

// ==================== 2. FDA 510k去重后重新插入 ====================
async function collectFDA510kDeduped() {
  console.log('\n=== FDA 510k去重后重新插入 ===\n');
  let totalInserted = 0;
  let totalMfrs = 0;

  const productCodes = Object.keys(PPE_CODES);

  for (const code of productCodes) {
    const info = PPE_CODES[code];
    const limit = 100;
    let skip = 0;
    let codeCount = 0;

    for (let page = 0; page < 30; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=product_code:${code}&limit=${limit}&skip=${skip}`;

      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.openfda?.manufacturer_name?.[0] || item.applicant || '';
          const country = (item.openfda?.country_code?.[0] || 'US').substring(0, 2);
          const kNumber = item.k_number || '';
          const deviceName = item.device_name || '';
          const decisionDate = item.decision_date || '';

          if (!applicant || !kNumber) continue;

          // 检查是否已存在
          const { data: existing } = await supabase
            .from('ppe_products')
            .select('id, manufacturer_name, product_code')
            .ilike('model', `%${kNumber}%`)
            .limit(1);

          if (existing && existing.length > 0) {
            // 更新缺失字段
            const updates = {};
            if (!existing[0].manufacturer_name) updates.manufacturer_name = applicant;
            if (!existing[0].product_code) updates.product_code = code;

            if (Object.keys(updates).length > 0) {
              await supabase
                .from('ppe_products')
                .update(updates)
                .eq('id', existing[0].id);
            }
            continue;
          }

          // 插入制造商
          const { error: mfrError } = await supabase
            .from('ppe_manufacturers')
            .insert({ name: applicant, country, website: '' }, { onConflict: 'name' });
          if (!mfrError) totalMfrs++;

          const productData = {
            name: deviceName || `PPE Device ${kNumber}`,
            category: info.category,
            subcategory: info.sub,
            risk_level: info.risk,
            manufacturer_name: applicant,
            country_of_origin: country,
            product_code: code,
            model: kNumber,
            description: `510(k) Number: ${kNumber}\nDevice: ${deviceName}\nApplicant: ${applicant}\nProduct Code: ${code}\nDecision Date: ${decisionDate}`,
            certifications: JSON.stringify([{ type: '510(k)', number: kNumber, status: 'cleared', date: decisionDate }]),
            status: 'approved',
          };

          const { error } = await supabase
            .from('ppe_products')
            .insert(productData);

          if (!error) {
            codeCount++;
            totalInserted++;
          }
        }

        skip += limit;
        await sleep(200);
      } catch (e) {
        break;
      }
    }

    if (codeCount > 0) {
      console.log(`  510k ${code} (${info.sub}): +${codeCount}`);
    }
  }

  console.log(`  ✅ FDA 510k采集: ${totalInserted.toLocaleString()} 条产品, ${totalMfrs.toLocaleString()} 个制造商`);
  return totalInserted;
}

// ==================== 3. manufacturer_name批量回填 ====================
async function batchFillManufacturer() {
  console.log('\n=== manufacturer_name批量回填 ===\n');
  let totalFixed = 0;

  // 策略1: 基于制造商表交叉匹配（使用更精确的匹配）
  console.log('策略1: 基于制造商表交叉匹配');
  let matchFixed = 0;

  const { data: manufacturers } = await supabase
    .from('ppe_manufacturers')
    .select('name, country')
    .limit(50000);

  const mfrMap = {};
  for (const m of (manufacturers || [])) {
    if (m.name && m.name.length > 3) {
      const key = m.name.toLowerCase().trim();
      mfrMap[key] = m;
    }
  }

  console.log(`  已知制造商: ${Object.keys(mfrMap).length} 个`);

  // 分批处理
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
      const desc = (p.description || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const text = `${desc} ${name}`;

      // 尝试匹配已知制造商
      for (const [mfrKey, mfr] of Object.entries(mfrMap)) {
        // 精确匹配制造商名称
        if (text.includes(mfrKey)) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ manufacturer_name: mfr.name, country_of_origin: mfr.country || undefined })
            .eq('id', p.id);
          if (!error) {
            matchFixed++;
          }
          break;
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已匹配 ${matchFixed.toLocaleString()}`);
      if (offset >= 30000) break;
    }
  }
  console.log(`  ✅ 交叉匹配: ${matchFixed.toLocaleString()} 条`);
  totalFixed += matchFixed;

  // 策略2: FDA 510k API回填
  console.log('\n策略2: FDA 510k API回填');
  let apiFixed = 0;

  const keywords = [
    'mask', 'glove', 'gown', 'respirator', 'shield', 'protective',
    'surgical', 'examination', 'isolation', 'nitrile', 'latex',
    'coverall', 'apron', 'cap', 'hood', 'boot cover', 'shoe cover',
    'disposable', 'sterile', 'face mask', 'exam glove',
    'n95', 'kn95', 'ffp2', 'ffp3', 'half mask', 'full facepiece',
    'patient examination', 'surgeon glove', 'chemotherapy glove',
    'bouffant cap', 'head cover', 'protective garment',
    'safety goggle', 'protective eyewear', 'lab coat', 'scrub suit',
  ];

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;

    for (let page = 0; page < 10; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=device_name:"${encodeURIComponent(keyword)}"&limit=${limit}&skip=${skip}`;

      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.openfda?.manufacturer_name?.[0] || item.applicant || '';
          const kNumber = item.k_number || '';
          const productCode = item.openfda?.product_code?.[0] || '';
          const country = (item.openfda?.country_code?.[0] || 'US').substring(0, 2);

          if (!applicant) continue;

          if (kNumber) {
            const { data: existing } = await supabase
              .from('ppe_products')
              .select('id')
              .or(`model.ilike.%${kNumber}%,name.ilike.%${kNumber}%`)
              .is('manufacturer_name', null)
              .limit(1);

            if (existing && existing.length > 0) {
              const updates = { manufacturer_name: applicant, country_of_origin: country };
              if (productCode) updates.product_code = productCode;

              const { error } = await supabase
                .from('ppe_products')
                .update(updates)
                .eq('id', existing[0].id);

              if (!error) apiFixed++;
            }
          }
        }

        skip += limit;
        await sleep(200);
      } catch (e) {
        break;
      }
    }
  }
  console.log(`  ✅ FDA API回填: ${apiFixed.toLocaleString()} 条`);
  totalFixed += apiFixed;

  // 策略3: 深度解析description
  console.log('\n策略3: 深度解析description');
  let descFixed = 0;
  offset = 0;

  const { count: descCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('description', 'is', null);

  console.log(`  待处理: ${descCount?.toLocaleString() || 0} 条`);

  const patterns = [
    /(?:manufactured|produced|made)\s*by[:\s]+([^,\n.]+)/i,
    /(?:owner|applicant|sponsor|submitter)[\s:]+([^,\n.]+)/i,
    /(?:distributed|marketed|sold|supplied)\s*by[:\s]+([^,\n.]+)/i,
    /([^,\n.]+?)\s+(?:Corp|Corporation|Inc|Incorporated|LLC|Ltd|Limited|Company|Co\.?|Group|International|Industries|Manufacturing|Technologies|Medical|Healthcare|Biotech|Scientific|Equipment|Supply|Global)/i,
    /(?:company|manufacturer|producer)[\s:]+([^,\n.]+)/i,
    /(?:注册|生产|制造|出品|厂商|企业|公司)[者]?[\s:：]+([^,\n.，。]+)/,
    /([^,\n.，。]+?)(?:公司|企业|集团|有限公司|股份)/,
  ];

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
            if (!/^(product|device|equipment|system|model|type|class|category|brand|the|this|that|for|with|from|and|but|or|not|are|were|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|need|dare|ought|used)/i.test(name)) {
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

  return totalFixed;
}

// ==================== 4. product_code批量回填 ====================
async function batchFillProductCode() {
  console.log('\n=== product_code批量回填 ===\n');
  let totalFixed = 0;

  // 策略1: 从description/model中提取PPE产品代码
  console.log('策略1: 从文本中提取PPE产品代码');
  let codeFixed = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null);

  console.log(`  待处理: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model, name, description, category')
      .is('product_code', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = `${p.model || ''} ${p.name || ''} ${p.description || ''}`;

      for (const [code, info] of Object.entries(PPE_CODES)) {
        // 匹配产品代码
        const codeRegex = new RegExp(`\\b${code}\\b`, 'i');
        if (codeRegex.test(text)) {
          const updates = { product_code: code };
          // 同时更新category和risk_level
          if (!p.category || p.category === '其他') {
            updates.category = info.category;
            updates.subcategory = info.sub;
            updates.risk_level = info.risk;
          }

          const { error } = await supabase
            .from('ppe_products')
            .update(updates)
            .eq('id', p.id);
          if (!error) codeFixed++;
          break;
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()} - 已修复 ${codeFixed.toLocaleString()}`);
    }
  }
  console.log(`  ✅ 文本提取: ${codeFixed.toLocaleString()} 条`);
  totalFixed += codeFixed;

  // 策略2: 从model字段提取3-7位大写字母代码
  console.log('\n策略2: 从model字段提取代码');
  let modelFixed = 0;
  offset = 0;

  const { count: modelCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null)
    .not('model', 'is', null);

  console.log(`  待处理: ${modelCount?.toLocaleString() || 0} 条`);

  while (offset < (modelCount || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model')
      .is('product_code', null)
      .not('model', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const model = p.model || '';
      const matches = model.match(/[A-Z]{3,7}/g);
      if (matches && matches.length > 0) {
        // 优先匹配PPE产品代码
        const ppeMatch = matches.find(m => PPE_CODES[m]);
        const code = ppeMatch || matches[0];

        const updates = { product_code: code };
        if (ppeMatch && PPE_CODES[ppeMatch]) {
          // 不更新已有category
        }

        const { error } = await supabase
          .from('ppe_products')
          .update(updates)
          .eq('id', p.id);
        if (!error) modelFixed++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()} - 已修复 ${modelFixed.toLocaleString()}`);
    }
  }
  console.log(`  ✅ model提取: ${modelFixed.toLocaleString()} 条`);
  totalFixed += modelFixed;

  return totalFixed;
}

// ==================== 5. "其他"类别深度清理 ====================
async function deepCleanOther() {
  console.log('\n=== "其他"类别深度清理 ===\n');

  // 策略1: 重新分类
  console.log('策略1: 重新分类');
  let reclassified = 0;
  const batchSize = 2000;
  let offset = 0;

  const reclassifyRules = [
    { category: '呼吸防护装备', sub: 'Mask', patterns: [/mask/i, /respirat/i, /n95/i, /kn95/i, /ffp/i, /filtering.*face/i, /particulate/i, /face.*mask/i, /mouth.*cover/i, /surgical.*mask/i, /medical.*mask/i, /dental.*mask/i, /procedure.*mask/i] },
    { category: '呼吸防护装备', sub: 'Respirator', patterns: [/respirator/i, /breathing.*apparatus/i, /self-contained/i, /gas.*mask/i, /powered.*air/i, /half.*mask/i, /full.*facepiece/i, /cartridge/i, /air.*purifying/i, /scba/i] },
    { category: '手部防护装备', sub: 'Glove', patterns: [/glove/i, /nitrile/i, /latex/i, /vinyl.*glove/i, /exam.*glove/i, /surgical.*glove/i, /hand.*protection/i, /disposable.*glove/i, /sterile.*glove/i, /procedure.*glove/i, /chemotherapy.*glove/i] },
    { category: '身体防护装备', sub: 'Protective Garment', patterns: [/gown/i, /coverall/i, /protective.*cloth/i, /isolation.*gown/i, /lab.*coat/i, /scrub.*suit/i, /apron/i, /drape/i, /protective.*suit/i, /barrier.*gown/i, /hazmat/i, /tyvek/i, /protective.*garment/i] },
    { category: '眼面部防护装备', sub: 'Face Shield', patterns: [/face.*shield/i, /goggle/i, /eye.*protection/i, /safety.*glass/i, /visor/i, /eyewear/i, /splash.*shield/i, /spectacle/i] },
    { category: '头部防护装备', sub: 'Head Protection', patterns: [/cap/i, /hood/i, /bouffant/i, /head.*cover/i, /surgical.*cap/i, /hair.*cover/i, /helmet/i, /skull.*cap/i] },
    { category: '足部防护装备', sub: 'Foot Protection', patterns: [/shoe.*cover/i, /boot.*cover/i, /overshoe/i, /foot.*cover/i, /footwear/i, /safety.*shoe/i, /clog/i] },
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

// ==================== 主函数 ====================
async function main() {
  console.log('============================================================');
  console.log('  深度优化 v4 - 填补缺失 + 扩充数据');
  console.log('============================================================\n');

  const { count: totalBefore } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrBefore } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: pcNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('优化前状态:');
  console.log(`  产品总数: ${totalBefore.toLocaleString()}`);
  console.log(`  制造商总数: ${mfrBefore.toLocaleString()}`);
  console.log(`  product_code缺失: ${pcNull.toLocaleString()} (${(pcNull / totalBefore * 100).toFixed(1)}%)`);
  console.log(`  manufacturer_name缺失: ${mfrNull.toLocaleString()} (${(mfrNull / totalBefore * 100).toFixed(1)}%)`);
  console.log(`  "其他"类别: ${catOther.toLocaleString()} (${(catOther / totalBefore * 100).toFixed(1)}%)`);

  // 执行优化
  const udiCount = await collectFDAUDI();
  const fda510kCount = await collectFDA510kDeduped();
  const mfrFixed = await batchFillManufacturer();
  const pcFixed = await batchFillProductCode();
  const { reclassified, deleted } = await deepCleanOther();

  // 优化后统计
  const { count: totalAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: pcNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNullAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOtherAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('\n============================================================');
  console.log('  深度优化后状态');
  console.log('============================================================\n');
  console.log(`  产品总数: ${totalBefore.toLocaleString()} → ${totalAfter.toLocaleString()} (${totalAfter > totalBefore ? '+' : ''}${(totalAfter - totalBefore).toLocaleString()})`);
  console.log(`  制造商总数: ${mfrBefore.toLocaleString()} → ${mfrAfter.toLocaleString()} (+${(mfrAfter - mfrBefore).toLocaleString()})`);
  console.log(`  product_code缺失: ${pcNullAfter.toLocaleString()} (${(pcNullAfter / totalAfter * 100).toFixed(1)}%)`);
  console.log(`  manufacturer_name缺失: ${mfrNullAfter.toLocaleString()} (${(mfrNullAfter / totalAfter * 100).toFixed(1)}%)`);
  console.log(`  "其他"类别: ${catOtherAfter.toLocaleString()} (${(catOtherAfter / totalAfter * 100).toFixed(1)}%)`);

  console.log('\n  完整率:');
  console.log(`  product_code: ${((totalAfter - pcNullAfter) / totalAfter * 100).toFixed(1)}%`);
  console.log(`  manufacturer_name: ${((totalAfter - mfrNullAfter) / totalAfter * 100).toFixed(1)}%`);
  console.log(`  category(非其他): ${((totalAfter - catOtherAfter) / totalAfter * 100).toFixed(1)}%`);

  console.log('\n  优化详情:');
  console.log(`  FDA UDI新增: ${udiCount.toLocaleString()} 条`);
  console.log(`  FDA 510k新增: ${fda510kCount.toLocaleString()} 条`);
  console.log(`  manufacturer_name回填: ${mfrFixed.toLocaleString()} 条`);
  console.log(`  product_code回填: ${pcFixed.toLocaleString()} 条`);
  console.log(`  "其他"重新分类: ${reclassified.toLocaleString()} 条`);
  console.log(`  非PPE删除: ${deleted.toLocaleString()} 条`);
}

main().catch(console.error);
