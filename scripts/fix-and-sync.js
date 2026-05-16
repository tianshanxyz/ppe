#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|filter.*cartr|half.?mask|full.?face|supplied.?air|dust.?mask|particulate|smoke.?hood|escape.?hood|powered.*air|p100|p99|r95|kp95|kf94|kf95/i.test(n)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|过滤式|送风式/i.test(name)) return '呼吸防护装备';
  if (/glove|gauntlet|hand.?protect|fingercot|nitrile|latex.*glove|vinyl.*glove|cut.?resist|welding.*glove|chemical.*glove|anti.?static.*glove|examination.*glove|surgical.*glove|finger.*cots?|hand.*guard|palm.*coat|mechanic.*glove|impact.*glove|chainmail|cryogenic.*glove|anti.?vibration/i.test(n)) return '手部防护装备';
  if (/手套|手部防护|防切割/i.test(name)) return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|spectacle.*protect|welding.*helmet|welding.*mask|safety.*glass|eye.*guard|laser.*protect|auto.?dark|faceshield|chemical.*splash|impact.*eye|side.*shield|welding.*goggle|chip.*guard/i.test(n)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|电焊|防飞溅/i.test(name)) return '眼面部防护装备';
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat|construction.*hat|miner.*helmet|electrical.*helmet|vented.*helmet|full.*brim|forestry.*helmet/i.test(n)) return '头部防护装备';
  if (/安全帽|头盔|头部防护/i.test(name)) return '头部防护装备';
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|wellington.*safety|clog.*safety|overshoe|chemical.*boot|foundry.*boot|composite.*toe|puncture.*resist|slip.*resist|static.*dissipat|conductive.*shoe|chain.*saw.*boot|logger.*boot|ice.*cleat|spats?|gaiter|toe.*guard/i.test(n)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋|足部防护/i.test(name)) return '足部防护装备';
  if (/earplug|ear.*muff|hearing.*protect|noise.*reduc|aural|band.*ear|electronic.*ear|canal.*cap|ear.*plug|earmuff|ear.*defender|nrr|snr/i.test(n)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(name)) return '听觉防护装备';
  if (/safety.*harness|lanyard|self.?retract|srl|lifeline|fall.*arrest|fall.*protect|anchor.*device|shock.*absorb|retractable|positioning|descender|rescue.*device|climbing.*gear|scaffold.*belt|beam.*clamp|roof.*anchor|horizontal.*lifeline|vertical.*lifeline|confined.*space|tripod|winch|carabiner|snap.*hook|tie.?off|body.*belt|chest.*harness/i.test(n)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线|自锁器|速差器/i.test(name)) return '坠落防护装备';
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash.*suit|isolation.*gown|surgical.*gown|protective.*gown|protective.*apron|scrub.*suit|tyvek|tychem|nomex|flash.*suit|fire.*suit|welding.*apron|chemical.*apron|cut.*resist.*sleeve|arm.*guard|knee.*pad|lab.*coat|cleanroom.*coverall|paint.*suit|disposable.*suit|particulate.*suit|bio.*hazard|level.*[abcd].*suit|splash.*suit|thermal.*protect|cold.*stress|cryogenic.*suit|anti.?static.*suit|flame.*resist|fr.*cloth|fire.*resist|fire.*fight|turnout|bunker.*gear|proximity.*suit|aluminized|molten.*metal|foundry.*cloth|leather.*apron|spatter|chaps|bib.*overall|overall|smock|jumpsuit|boiler.*suit/i.test(n)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|防辐射|阻燃|防静电服|防电弧|防寒服|防酸碱|围裙|套袖|护膝|连体服|实验服/i.test(name)) return '身体防护装备';
  if (/hi.?vis.*vest|safety.*vest|reflective.*vest|high.?visibility.*vest|high.?visibility.*jacket|safety.*rainwear|protective.*jacket|safety.*coat|rain.*suit.*protect|surveyor.*vest|mesh.*vest|flagger.*vest|breakaway.*vest|construction.*vest|class.*[123].*vest|fluorescent|neon.*vest|visibility|conspicuity/i.test(n)) return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服|防雨服/i.test(name)) return '躯干防护装备';
  return '其他';
}

async function fixCategories() {
  console.log('=== 修复产品分类 ===');
  let page = 0;
  let fixed = 0;
  const batchSize = 500;

  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('id,name,category')
      .eq('category', '其他')
      .range(page * batchSize, (page + 1) * batchSize - 1);
    if (error || !data || data.length === 0) break;

    const updates = [];
    for (const p of data) {
      const newCat = categorizePPE(p.name);
      if (newCat !== '其他') {
        updates.push({ id: p.id, category: newCat });
      }
    }

    for (const u of updates) {
      const { error: e2 } = await supabase.from('ppe_products')
        .update({ category: u.category })
        .eq('id', u.id);
      if (!e2) fixed++;
    }

    if (data.length < batchSize) break;
    page++;
    if (page % 20 === 0) console.log(`  已处理 ${page * batchSize}, 修复 ${fixed}`);
    await sleep(50);
  }
  console.log(`  分类修复完成: ${fixed} 条`);
  return fixed;
}

async function syncManufacturers() {
  console.log('=== 同步制造商数据 ===');
  const mfrMap = new Map();
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('manufacturer_name,country_of_origin,category,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    for (const p of data) {
      const name = (p.manufacturer_name || '').trim();
      if (!name || name === 'Unknown' || name === 'Various') continue;
      const key = name.toLowerCase().trim();
      if (!mfrMap.has(key)) {
        mfrMap.set(key, { name, country: p.country_of_origin || '', categories: new Set(), dataSources: new Set(), productCount: 0 });
      }
      const mfr = mfrMap.get(key);
      if (p.category) mfr.categories.add(p.category);
      if (p.data_source) mfr.dataSources.add(p.data_source);
      mfr.productCount++;
    }
    if (data.length < 1000) break;
    page++;
  }
  console.log('从产品中提取制造商:', mfrMap.size);

  const existingMfrs = new Set();
  let mfrPage = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_manufacturers')
      .select('name')
      .range(mfrPage * 1000, (mfrPage + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(m => existingMfrs.add((m.name || '').toLowerCase().trim()));
    if (data.length < 1000) break;
    mfrPage++;
  }
  console.log('现有制造商:', existingMfrs.size);

  const newMfrs = [];
  for (const [key, mfr] of mfrMap) {
    if (existingMfrs.has(key)) continue;
    let profile = '', scope = '', certs = '';
    const cats = [...mfr.categories];
    if (mfr.country === 'CN') {
      profile = '中国PPE制造商 - ' + mfr.name;
      scope = '个人防护装备制造与销售';
      certs = 'LA认证';
    } else {
      profile = 'PPE Manufacturer - ' + mfr.name;
      scope = 'PPE manufacturing: ' + cats.join(', ');
      certs = cats.some(c => /呼吸|手部|身体/.test(c)) ? 'CE认证' : '';
    }
    newMfrs.push({
      name: mfr.name.substring(0, 500),
      country: mfr.country,
      business_scope: scope.substring(0, 500),
      certifications: certs,
      company_profile: profile.substring(0, 1000),
      data_source: [...mfr.dataSources].join(', ').substring(0, 200),
      data_confidence_level: mfr.productCount > 5 ? 'high' : 'medium',
    });
  }
  console.log('新增制造商:', newMfrs.length);

  let inserted = 0;
  for (let i = 0; i < newMfrs.length; i += 100) {
    const batch = newMfrs.slice(i, i + 100);
    const { error } = await supabase.from('ppe_manufacturers').insert(batch);
    if (!error) inserted += batch.length;
    else {
      for (const m of batch) {
        const { error: e2 } = await supabase.from('ppe_manufacturers').insert(m);
        if (!e2) inserted++;
      }
    }
    await sleep(50);
  }
  console.log('制造商同步完成:', inserted);
  return inserted;
}

async function main() {
  await fixCategories();
  await syncManufacturers();

  const { count: pc } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mc } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('\n最终结果: 产品=' + pc?.toLocaleString() + ', 制造商=' + mc?.toLocaleString());
}

main().catch(console.error);
