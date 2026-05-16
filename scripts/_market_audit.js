const { createClient } = require('@supabase/supabase-js');
const sup = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');

async function fetchAll(column) {
  const results = [];
  let page = 0;
  while (true) {
    const { data, error } = await sup.from('ppe_products').select(column).range(page*1000,(page+1)*1000-1);
    if (error || !data || data.length===0) break;
    results.push(...data);
    if (data.length<1000) break;
    page++;
  }
  return results;
}

const MARKET_MAP = {
  US: { codes: ['US'], desc: '美国' },
  CN: { codes: ['CN'], desc: '中国' },
  EU: { codes: ['EU','DE','FR','IT','ES','NL','BE','SE','DK','FI','IE','AT','LU','PT','EL','PL','CZ','RO','HU','BG','HR','SK','SI','EE','LV','LT','CY','MT','NO','CH'], desc: '欧洲' },
};

// Market-specific analysis
async function analyzeMarket(market, codes, label) {
  const all = await fetchAll('country_of_origin,category,data_source,data_confidence_level,risk_level,registration_authority,registration_number,manufacturer_name,related_standards,certifications,product_images');
  const data = all.filter(r => codes.includes(r.country_of_origin));
  
  if (data.length === 0) { console.log(`${label}: 0 条记录`); return null; }

  const cats = {}, srcs = {}, confs = {}, risks = {}, auths = {};
  const mfrs = new Set();
  let hasRegNum = 0, hasStandards = 0, hasCert = 0, hasImg = 0;

  data.forEach(r => {
    cats[r.category] = (cats[r.category]||0)+1;
    srcs[r.data_source] = (srcs[r.data_source]||0)+1;
    confs[r.data_confidence_level] = (confs[r.data_confidence_level]||0)+1;
    risks[r.risk_level] = (risks[r.risk_level]||0)+1;
    auths[r.registration_authority] = (auths[r.registration_authority]||0)+1;
    if (r.manufacturer_name) mfrs.add(r.manufacturer_name.toLowerCase().trim());
    if (r.registration_number) hasRegNum++;
    if (r.related_standards && r.related_standards.length>0 && JSON.stringify(r.related_standards)!=='[]') hasStandards++;
    if (r.certifications && r.certifications.length>0 && JSON.stringify(r.certifications)!=='[]') hasCert++;
    if (r.product_images && r.product_images.length>0 && JSON.stringify(r.product_images)!=='[]') hasImg++;
  });

  return {
    label, total: data.length,
    cats: Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,8),
    srcs: Object.entries(srcs).sort((a,b)=>b[1]-a[1]).slice(0,8),
    confs: Object.entries(confs).sort((a,b)=>b[1]-a[1]),
    risks: Object.entries(risks).sort((a,b)=>b[1]-a[1]),
    auths: Object.entries(auths).sort((a,b)=>b[1]-a[1]).slice(0,10),
    mfrs: mfrs.size,
    regNumPct: (hasRegNum/data.length*100).toFixed(1),
    stdsPct: (hasStandards/data.length*100).toFixed(1),
    certPct: (hasCert/data.length*100).toFixed(1),
    imgPct: (hasImg/data.length*100).toFixed(1),
  };
}

(async()=>{
  console.log('══════════════════════════════════════════════════════');
  console.log('  中美欧三大市场 - 专项深度审计');
  console.log('══════════════════════════════════════════════════════\n');

  // US market
  const us = await analyzeMarket('US', MARKET_MAP.US.codes, '🇺🇸 美国');
  // CN market  
  const cn = await analyzeMarket('CN', MARKET_MAP.CN.codes, '🇨🇳 中国');
  // EU market
  const eu = await analyzeMarket('EU', MARKET_MAP.EU.codes, '🇪🇺 欧洲(含CH/NO)');

  [us, cn, eu].filter(Boolean).forEach(m => {
    console.log(`\n━━━ ${m.label} — ${m.total.toLocaleString()} 条 ━━━`);
    console.log('  品类:', m.cats.map(([k,v])=>k+':'+v).join(', '));
    console.log('  来源:', m.srcs.map(([k,v])=>k.substring(0,40)+':'+v).join(', '));
    console.log('  可信度:', m.confs.map(([k,v])=>k+':'+v).join(', '));
    console.log('  风险:', m.risks.map(([k,v])=>k+':'+v).join(', '));
    console.log('  监管:', m.auths.map(([k,v])=>k.substring(0,25)+':'+v).join(', '));
    console.log('  制造商:', m.mfrs, '家');
    console.log('  注册号覆盖:', m.regNumPct+'%');
    console.log('  标准数据:', m.stdsPct+'%');
    console.log('  认证数据:', m.certPct+'%');
    console.log('  图片数据:', m.imgPct+'%');
  });

  // EU country breakdown
  console.log('\n\n── 欧洲各国明细 ──');
  const euCodes = ['DE','FR','IT','ES','NL','BE','SE','DK','FI','IE','AT','LU','PT','NO','CH','EU','GB'];
  const allData = await fetchAll('country_of_origin');
  const cc = {};
  allData.forEach(r => { cc[r.country_of_origin] = (cc[r.country_of_origin]||0)+1; });
  euCodes.forEach(c => { if (cc[c]) console.log('  '+c+': '+cc[c]); });

  // Check what EU countries are missing
  const missingEU = ['PL','CZ','RO','HU','BG','HR','SK','SI','EE','LV','LT','CY','MT','EL'];
  const missingButNeeded = missingEU.filter(c => !cc[c]);
  console.log('  缺失的欧盟国家:', missingButNeeded.join(', '));

  // US regulations in ppe_regulations
  console.log('\n── ppe_regulations 中美欧覆盖 ──');
  const { data: regs } = await sup.from('ppe_regulations').select('region').limit(1000);
  const regReg = {};
  regs.forEach(r => {
    const reg = r.region || 'unknown';
    regReg[reg] = (regReg[reg]||0)+1;
  });
  ['US','EU','CN','GB','CA','AU','JP','KR','GCC','ASEAN'].forEach(r => {
    console.log('  '+r+': '+(regReg[r]||0)+' 条');
  });

  // ppe_manufacturers for US/CN/EU
  console.log('\n── ppe_manufacturers 中美欧厂商数 ──');
  const { data: mfrs } = await sup.from('ppe_manufacturers').select('country').limit(10000);
  const mc = {};
  mfrs.forEach(r => { mc[r.country] = (mc[r.country]||0)+1; });
  ['US','CN','DE','FR','IT','ES','NL','BE','SE','DK','FI','IE','AT','LU','PT','NO','CH','GB'].forEach(r => {
    console.log('  '+r+': '+(mc[r]||0)+' 家');
  });

  // ======== 数据完整性深度检查 ========
  console.log('\n\n── 数据完整性深度检查 (全字段判定) ──');
  
  // Check how many products have ALL key fields filled
  const keyFields = await fetchAll('name,model,category,subcategory,description,manufacturer_name,risk_level,registration_number,registration_authority,registration_valid_until,data_source,data_source_url,last_verified,data_confidence_level,country_of_origin');
  
  const completenessByMarket = { US: [], CN: [], EU: [] };
  keyFields.forEach(r => {
    const co = r.country_of_origin || '';
    let target = null;
    if (co === 'US') target = 'US';
    else if (co === 'CN') target = 'CN';
    else if (MARKET_MAP.EU.codes.includes(co)) target = 'EU';
    else return;
    
    const fields = {name:!!r.name, model:!!r.model, category:!!r.category, subcategory:!!r.subcategory,
      description:!!r.description, manufacturer_name:!!r.manufacturer_name, risk_level:!!r.risk_level,
      registration_number:!!r.registration_number, registration_authority:!!r.registration_authority,
      registration_valid_until:!!r.registration_valid_until, data_source:!!r.data_source,
      data_source_url:!!r.data_source_url, last_verified:!!r.last_verified,
      data_confidence_level:!!r.data_confidence_level};
    const filled = Object.values(fields).filter(Boolean).length;
    const total = Object.keys(fields).length;
    completenessByMarket[target].push({ filled, total, pct: filled/total });
  });

  for (const [mkt, items] of Object.entries(completenessByMarket)) {
    const avgPct = items.reduce((s,i)=>s+i.pct,0) / items.length * 100;
    const fullComplete = items.filter(i=>i.pct===1).length;
    const mostlyComplete = items.filter(i=>i.pct>=0.8).length;
    const poor = items.filter(i=>i.pct<0.5).length;
    console.log(`  ${mkt}: 平均完整度 ${avgPct.toFixed(1)}%, 全字段完整: ${fullComplete}/${items.length}, >=80%: ${mostlyComplete}, <50%: ${poor}`);
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  审计完成');
  console.log('══════════════════════════════════════════════════════');
})();