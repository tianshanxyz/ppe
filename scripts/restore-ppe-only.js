#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

let existingKeys = new Set();

async function loadExisting() {
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`已加载 ${existingKeys.size} 条现有产品记录`);
}

function isDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

function markDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

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
  return null;
}

function isPPE(name) {
  return categorizePPE(name) !== null;
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MDLooker-PPE-Restore/2.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) { await sleep(5000); continue; }
      if (!res.ok) { if (res.status === 404) return null; throw new Error(`HTTP ${res.status}`); }
      return await res.json();
    } catch (e) { if (i === retries - 1) throw e; await sleep(2000); }
  }
  return null;
}

async function batchInsert(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (!error) inserted += batch.length;
    else {
      for (const p of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) inserted++;
      }
    }
    await sleep(50);
  }
  return inserted;
}

const PPE_CODES = {
  respiratory: ['FXX', 'MSH', 'MZC', 'ONW', 'MSE', 'QKR', 'QKS', 'QKT', 'QKU', 'QKV', 'QKW', 'QKX', 'QKY', 'QNZ', 'QPA', 'QPB', 'QPC', 'QPD', 'QPE', 'NSH', 'OHV', 'OUG', 'OUK', 'CCK', 'CCL', 'CCM', 'CCN', 'CCW', 'CCX', 'CCY', 'CCZ', 'CDA'],
  gloves: ['LYY', 'LZA', 'LZC', 'LZD', 'LZE', 'FZQ', 'KGC', 'KGD', 'KGE', 'KGF', 'KGG', 'KGH', 'KGI', 'KGJ', 'KGK', 'KGL', 'KGM', 'KGN', 'KGO', 'KGP', 'KGQ', 'KGR', 'KGS', 'KGT', 'KGU', 'KGV', 'KGW', 'KGX', 'KGY', 'KGZ', 'LZB', 'LZF', 'LZG', 'LZH', 'LZI', 'LZJ', 'LZK', 'LZM', 'LZN', 'LZO', 'LZU', 'LZV', 'LZW', 'LZY'],
  gowns: ['QPC', 'QPD', 'QPE', 'FTE', 'FYK', 'FYA', 'FYB', 'FYC', 'FYD', 'FYE', 'FYF', 'FYG', 'FYH', 'FYI', 'FYJ'],
  eye_face: ['FQA', 'FQD', 'FQE', 'FQF', 'FQG', 'FQH', 'FQI', 'FQJ', 'FQK', 'FQL', 'FQM', 'FQN', 'FQO', 'FQP', 'FQQ', 'FQR', 'FQS', 'FQT', 'HFE', 'HFF', 'HFG', 'HFH', 'HFI', 'HFJ', 'HFK', 'HFL', 'HFM', 'HFN', 'HFO', 'HFP', 'HFQ', 'HFR', 'HFS', 'HFT', 'HFU', 'HFV', 'HFW', 'HFX', 'HFY', 'HFZ'],
  head: ['FZM', 'FZN', 'FZO', 'FZP', 'FZQ', 'FZR', 'FZS', 'FZT', 'FZU', 'FZV', 'FZW', 'FZX', 'FZY', 'FZZ', 'GAA', 'GAB', 'GAC', 'GAD', 'GAE', 'GAF', 'GAG', 'GAH', 'GAI', 'GAJ', 'GAK', 'GAL', 'GAM', 'GAN', 'GAO'],
  foot: ['FZA', 'FZB', 'FZC', 'FZD', 'FZE', 'FZF', 'FZG', 'FZH', 'FZI', 'FZJ', 'FZK', 'FZL'],
  hearing: ['GAX', 'GAY', 'GAZ', 'GBA', 'GBB', 'GBC', 'GBD', 'GBE', 'GBF', 'GBG', 'GBH', 'GBI', 'GBJ', 'GBK', 'GBL', 'GBM', 'GBN', 'GBO', 'GBP', 'GBQ', 'GBR', 'GBS', 'GBT', 'GBU', 'GBV', 'GBW', 'GBX', 'GBY', 'GBZ'],
  fall: ['GCA', 'GCB', 'GCC', 'GCD', 'GCE', 'GCF', 'GCG', 'GCH', 'GCI', 'GCJ', 'GCK', 'GCL', 'GCM', 'GCN', 'GCO', 'GCP', 'GCQ', 'GCR', 'GCS', 'GCT', 'GCU', 'GCV', 'GCW', 'GCX', 'GCY', 'GCZ', 'GDA', 'GDB', 'GDC', 'GDD', 'GDE', 'GDF', 'GDG', 'GDH', 'GDI', 'GDJ', 'GDK', 'GDL', 'GDM', 'GDN', 'GDO', 'GDP', 'GDQ', 'GDR', 'GDS', 'GDT', 'GDU', 'GDV', 'GDW', 'GDX', 'GDY', 'GDZ'],
};

async function collectFDA510k() {
  console.log('\n========== 1. FDA 510(k) 按PPE产品代码采集 ==========');
  let totalInserted = 0;
  const allCodes = [...new Set(Object.values(PPE_CODES).flat())];

  for (const code of allCodes) {
    try {
      let page = 0;
      let codeTotal = 0;
      while (true) {
        const url = `https://api.fda.gov/device/510k.json?search=product_code:${code}&limit=100&skip=${page * 100}`;
        const result = await fetchJSON(url);
        if (!result || !result.results || result.results.length === 0) break;

        const products = [];
        for (const item of result.results) {
          const name = item.device_name || '';
          if (!name) continue;
          const category = categorizePPE(name);
          if (!category) continue;

          const mfr = (item.applicant || 'Unknown').substring(0, 500);
          const src = 'FDA 510(k) Database';
          if (isDup(name, mfr, src)) continue;
          markDup(name, mfr, src);

          products.push({
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfr,
            country_of_origin: item.country_code || 'US',
            risk_level: /respirat|n95|scba|gas mask/i.test(name.toLowerCase()) ? 'high' : /glove|gown|face shield/i.test(name.toLowerCase()) ? 'medium' : 'low',
            product_code: code,
            registration_number: item.k_number || '',
            registration_authority: 'FDA',
            data_source: src,
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
            specifications: JSON.stringify({
              k_number: item.k_number || '',
              decision_date: item.decision_date || '',
              product_code: code,
              regulation_number: item.regulation_number || '',
              device_class: item.device_class || '',
            }),
          });
        }

        const inserted = await batchInsert(products);
        codeTotal += inserted;
        totalInserted += inserted;

        if (result.results.length < 100) break;
        page++;
        await sleep(400);
      }
      if (codeTotal > 0) console.log(`    ${code}: ${codeTotal}条`);
      await sleep(300);
    } catch (e) { /* skip */ }
  }
  console.log(`  510(k)产品代码总计: ${totalInserted}`);
  return totalInserted;
}

async function collectFDA510kKeywords() {
  console.log('\n========== 2. FDA 510(k) 按关键词采集 ==========');
  let totalInserted = 0;
  const keywords = [
    'surgical+mask', 'respirator+n95', 'n95+respirator', 'kn95+mask',
    'protective+glove', 'nitrile+glove', 'examination+glove', 'surgical+glove',
    'protective+gown', 'isolation+gown', 'surgical+gown',
    'face+shield', 'safety+glasses', 'protective+eyewear', 'goggles',
    'hard+hat', 'safety+helmet', 'bump+cap',
    'safety+shoe', 'protective+boot', 'steel+toe',
    'earplug', 'earmuff', 'hearing+protection',
    'fall+protection+harness', 'safety+harness', 'lanyard',
    'protective+clothing', 'coverall', 'chemical+suit',
    'welding+helmet', 'welding+mask',
    'gas+mask', 'self+contained+breathing+apparatus', 'scba',
    'high+visibility+vest', 'reflective+vest',
    'cut+resistant+glove', 'chainmail+glove',
    'arc+flash+suit', 'fire+resistant+clothing',
  ];

  for (const keyword of keywords) {
    try {
      let page = 0;
      let kwTotal = 0;
      while (page < 10) {
        const url = `https://api.fda.gov/device/510k.json?search=device_name:${keyword}&limit=100&skip=${page * 100}`;
        const result = await fetchJSON(url);
        if (!result || !result.results || result.results.length === 0) break;

        const products = [];
        for (const item of result.results) {
          const name = item.device_name || '';
          if (!name) continue;
          const category = categorizePPE(name);
          if (!category) continue;

          const mfr = (item.applicant || 'Unknown').substring(0, 500);
          const src = 'FDA 510(k) Database';
          if (isDup(name, mfr, src)) continue;
          markDup(name, mfr, src);

          products.push({
            name: name.substring(0, 500),
            category,
            manufacturer_name: mfr,
            country_of_origin: item.country_code || 'US',
            risk_level: /respirat|n95|scba|gas mask/i.test(name.toLowerCase()) ? 'high' : /glove|gown|face shield/i.test(name.toLowerCase()) ? 'medium' : 'low',
            product_code: item.product_code || '',
            registration_number: item.k_number || '',
            registration_authority: 'FDA',
            data_source: src,
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
            specifications: JSON.stringify({
              k_number: item.k_number || '',
              decision_date: item.decision_date || '',
              product_code: item.product_code || '',
            }),
          });
        }

        const inserted = await batchInsert(products);
        kwTotal += inserted;
        totalInserted += inserted;

        if (result.results.length < 100) break;
        page++;
        await sleep(400);
      }
      if (kwTotal > 0) console.log(`    ${keyword}: ${kwTotal}条`);
      await sleep(300);
    } catch (e) { /* skip */ }
  }
  console.log(`  510(k)关键词总计: ${totalInserted}`);
  return totalInserted;
}

async function collectFDARecall() {
  console.log('\n========== 3. FDA 召回数据采集 ==========');
  let totalInserted = 0;
  const keywords = [
    'mask', 'respirator', 'glove', 'gown', 'face+shield', 'safety+glasses',
    'hard+hat', 'safety+shoe', 'earplug', 'earmuff', 'safety+harness',
    'protective+clothing', 'coverall', 'welding+helmet', 'gas+mask',
    'high+visibility', 'fall+protection',
  ];

  for (const keyword of keywords) {
    try {
      const url = `https://api.fda.gov/device/recall.json?search=product_description:${keyword}&limit=100`;
      const result = await fetchJSON(url);
      if (!result || !result.results) continue;

      const products = [];
      for (const item of result.results) {
        const name = item.product_description || '';
        if (!name) continue;
        const category = categorizePPE(name);
        if (!category) continue;

        const mfr = (item.recalling_firm || 'Unknown').substring(0, 500);
        const src = 'FDA Recall Database';
        if (isDup(name, mfr, src)) continue;
        markDup(name, mfr, src);

        products.push({
          name: name.substring(0, 500),
          category,
          manufacturer_name: mfr,
          country_of_origin: 'US',
          risk_level: 'high',
          product_code: item.product_code || '',
          registration_number: item.recall_number || '',
          registration_authority: 'FDA',
          data_source: src,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            recall_number: item.recall_number || '',
            recall_initiation_date: item.recall_initiation_date || '',
            reason: item.reason_for_recall || '',
          }),
        });
      }

      const inserted = await batchInsert(products);
      totalInserted += inserted;
      await sleep(400);
    } catch (e) { /* skip */ }
  }
  console.log(`  召回数据总计: ${totalInserted}`);
  return totalInserted;
}

async function collectNMPAUDID() {
  console.log('\n========== 4. NMPA UDID 数据提取 ==========');
  const UDID_DIR = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/UDID_FULL_RELEASE_20260501';
  if (!fs.existsSync(UDID_DIR)) { console.log('  UDID目录不存在，跳过'); return 0; }

  const PPE_RE = /口罩|mask|n95|kn95|ffp|respirator|防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit|手套|glove|护目镜|面屏|面罩|goggle|face.?shield|faceshield|防护帽|安全帽|手术帽|cap|helmet|防护鞋|安全鞋|鞋套|boot|shoe.?cover|耳塞|耳罩|earplug|earmuff|防护|protection|protective|医用|medical|surgical|防尘口罩|dust.?mask|防毒|gas.?mask|防化服|chemical.?protective|防静电|anti.?static|ESD|防电弧|arc.?flash|耐高温|heat.?resistant|阻燃|flame.?retardant|防辐射|radiation.?protective|防切割|cut.?resistant|绝缘|insulating|安全带|safety.?belt|safety.?harness|安全绳|safety.?rope|lanyard|防坠|fall.?arrest|fall.?protection|焊接|welding|消防|fire.?fighting/i;

  function cat(n) {
    const s = (n || '').toLowerCase();
    if (/口罩|mask|n95|kn95|ffp|respirator|防尘|防毒/i.test(s)) return '呼吸防护装备';
    if (/手套|glove/i.test(s)) return '手部防护装备';
    if (/护目镜|面屏|面罩|goggle|face.?shield|faceshield/i.test(s)) return '眼面部防护装备';
    if (/防护帽|安全帽|手术帽|cap|helmet/i.test(s)) return '头部防护装备';
    if (/耳塞|耳罩|earplug|earmuff/i.test(s)) return '听觉防护装备';
    if (/防护鞋|安全鞋|鞋套|boot|shoe.?cover/i.test(s)) return '足部防护装备';
    if (/反光衣|反光背心|vest/i.test(s)) return '躯干防护装备';
    if (/防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit|防化服|防电弧|耐高温|阻燃|核防护/i.test(s)) return '身体防护装备';
    if (/安全带|安全绳|防坠|救生/i.test(s)) return '坠落防护装备';
    return null;
  }

  function extractTag(xml, tag) {
    const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
    const m = xml.match(re);
    return m ? m[1].trim() : '';
  }

  const xmlFiles = fs.readdirSync(UDID_DIR).filter(f => f.endsWith('.xml')).map(f => path.join(UDID_DIR, f)).sort();
  console.log(`  找到 ${xmlFiles.length} 个XML文件`);

  let totalPPE = 0;
  let totalInserted = 0;

  for (let i = 0; i < xmlFiles.length; i++) {
    try {
      const xmlStr = fs.readFileSync(xmlFiles[i], 'utf-8');
      const blocks = xmlStr.split('<device>');

      const products = [];
      for (let j = 1; j < blocks.length; j++) {
        const block = blocks[j].split('</device>')[0];
        if (!block) continue;

        const name = extractTag(block, 'cpmctymc') || extractTag(block, 'spmc') || '';
        if (!name || !PPE_RE.test(name)) continue;

        const category = cat(name);
        if (!category) continue;

        const manufacturer = extractTag(block, 'ylqxzcrbarmc') || extractTag(block, 'scqymc') || 'Unknown';
        const regNumber = extractTag(block, 'zczbhhzbapzbh') || extractTag(block, 'yxqz') || '';
        const src = 'NMPA UDID Database';

        if (isDup(name, manufacturer, src)) continue;
        markDup(name, manufacturer, src);

        totalPPE++;
        products.push({
          name: name.substring(0, 500),
          category,
          manufacturer_name: manufacturer.substring(0, 500),
          country_of_origin: 'CN',
          risk_level: /N95|KN95|FFP|防毒|呼吸器|防护服/i.test(name) ? 'high' : /口罩|手套|护目镜|安全帽/i.test(name) ? 'medium' : 'low',
          product_code: regNumber.substring(0, 50),
          registration_number: regNumber,
          registration_authority: regNumber.startsWith('国械注进') ? 'NMPA (Imported)' : 'NMPA (Domestic)',
          data_source: src,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            udi: extractTag(block, 'zxxsdycpbs'),
            specification: extractTag(block, 'ggxh'),
            description: extractTag(block, 'cpms'),
          }),
        });
      }

      if (products.length > 0) {
        const inserted = await batchInsert(products);
        totalInserted += inserted;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`  进度: ${i+1}/${xmlFiles.length}, PPE=${totalPPE}, 新增=${totalInserted}`);
      }
    } catch (e) { /* skip */ }
  }

  console.log(`  NMPA UDID总计: PPE=${totalPPE}, 新增=${totalInserted}`);
  return totalInserted;
}

async function collectEUDAMEDPPE() {
  console.log('\n========== 5. EUDAMED PPE数据采集（仅PPE） ==========');
  const EUDAMED_API_BASE = 'https://ec.europa.eu/tools/eudamed/api';
  let totalInserted = 0;

  for (let page = 1; page <= 500; page++) {
    try {
      const url = `${EUDAMED_API_BASE}/devices/udiDiData?page=${page}&pageSize=300&size=300&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(url);
      if (!result || !result.content || result.content.length === 0) break;

      const products = [];
      for (const device of result.content) {
        const name = device.tradeName || device.deviceName || '';
        if (!name) continue;

        const category = categorizePPE(name);
        if (!category) continue;

        const manufacturer = device.manufacturerName || 'Unknown';
        const src = 'EUDAMED Extended API';
        if (isDup(name, manufacturer, src)) continue;
        markDup(name, manufacturer, src);

        products.push({
          name: name.substring(0, 500),
          category,
          manufacturer_name: manufacturer.substring(0, 500),
          country_of_origin: 'EU',
          risk_level: device.riskClass?.code?.includes('class-iii') ? 'high' :
                     device.riskClass?.code?.includes('class-iib') ? 'high' :
                     device.riskClass?.code?.includes('class-iia') ? 'medium' : 'low',
          product_code: device.basicUdi || '',
          registration_number: device.primaryDi || device.uuid || '',
          registration_authority: 'EUDAMED',
          data_source: src,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            eudamed_uuid: device.uuid || '',
            basic_udi: device.basicUdi || '',
            primary_di: device.primaryDi || '',
            risk_class: device.riskClass?.code || '',
          }),
        });
      }

      if (products.length > 0) {
        const inserted = await batchInsert(products);
        totalInserted += inserted;
      }

      if (page % 20 === 0) console.log(`  第${page}页, 累计新增: ${totalInserted}`);
      if (result.last || result.content.length < 300) break;
      await sleep(1500);
    } catch (e) {
      console.log(`  第${page}页错误: ${e.message}`);
      break;
    }
  }

  console.log(`  EUDAMED PPE总计: ${totalInserted}`);
  return totalInserted;
}

async function main() {
  console.log('========================================');
  console.log('MDLooker PPE 数据增强恢复（仅PPE）');
  console.log('========================================');

  const { count: beforeProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`恢复前: 产品=${beforeProducts?.toLocaleString()}`);

  await loadExisting();

  let grandTotal = 0;
  grandTotal += await collectFDA510k();
  grandTotal += await collectFDA510kKeywords();
  grandTotal += await collectFDARecall();
  grandTotal += await collectNMPAUDID();
  grandTotal += await collectEUDAMEDPPE();

  const { count: afterProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('\n========================================');
  console.log('数据恢复完成!');
  console.log('========================================');
  console.log(`恢复前: ${beforeProducts?.toLocaleString()}`);
  console.log(`恢复后: ${afterProducts?.toLocaleString()}`);
  console.log(`新增: ${(afterProducts - beforeProducts)?.toLocaleString()}`);
  console.log(`本次采集新增: ${grandTotal.toLocaleString()}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
