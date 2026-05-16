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
  console.log(`已加载 ${existingKeys.size} 条现有记录`);
}

function isDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}
function markDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

function cat(n) {
  const s = (n || '').toLowerCase();
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|filter.*cartr|half.?mask|full.?face|supplied.?air|dust.?mask|particulate|smoke.?hood|escape.?hood|powered.*air|p100|p99|r95|kp95|kf94|kf95/i.test(s)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|过滤式|送风式/i.test(n)) return '呼吸防护装备';
  if (/glove|gauntlet|hand.?protect|fingercot|nitrile|latex|vinyl|cut.?resist|welding.*glove|chemical.*glove|examination.*glove|surgical.*glove|chainmail|anti.?vibration/i.test(s)) return '手部防护装备';
  if (/手套|手部防护|防切割/i.test(n)) return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield/i.test(s)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|电焊|防飞溅/i.test(n)) return '眼面部防护装备';
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat/i.test(s)) return '头部防护装备';
  if (/安全帽|头盔|头部防护/i.test(n)) return '头部防护装备';
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|composite.*toe/i.test(s)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋/i.test(n)) return '足部防护装备';
  if (/earplug|ear.*muff|hearing.*protect|noise.*reduc|earmuff/i.test(s)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(n)) return '听觉防护装备';
  if (/safety.*harness|lanyard|self.?retract|lifeline|fall.*arrest|fall.*protect|shock.*absorb|retractable|carabiner/i.test(s)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线/i.test(n)) return '坠落防护装备';
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash|isolation.*gown|surgical.*gown|protective.*gown|tyvek|tychem|nomex|fire.*suit|flame.*resist|fire.*resist|fire.*fight|turnout|aluminized|leather.*apron|overall|smock|jumpsuit|lab.*coat|knee.*pad/i.test(s)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|阻燃|防静电|防电弧|防寒|围裙|护膝|连体服/i.test(n)) return '身体防护装备';
  if (/hi.?vis|safety.*vest|reflective.*vest|high.?visibility|fluorescent|mesh.*vest/i.test(s)) return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服/i.test(n)) return '躯干防护装备';
  return null;
}

async function fetchJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MDLooker/2.0' }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429) { await sleep(5000); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { if (i === 2) return null; await sleep(2000); }
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
    else for (const p of batch) { const { error: e2 } = await supabase.from('ppe_products').insert(p); if (!e2) inserted++; }
    await sleep(30);
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

const KEYWORDS = [
  'surgical+mask', 'respirator+n95', 'n95+respirator', 'kn95+mask',
  'protective+glove', 'nitrile+glove', 'examination+glove', 'surgical+glove',
  'protective+gown', 'isolation+gown', 'surgical+gown',
  'face+shield', 'safety+glasses', 'protective+eyewear', 'goggles',
  'hard+hat', 'safety+helmet', 'bump+cap',
  'safety+shoe', 'protective+boot', 'steel+toe',
  'earplug', 'earmuff', 'hearing+protection',
  'fall+protection+harness', 'safety+harness', 'lanyard',
  'protective+clothing', 'coverall', 'chemical+suit',
  'welding+helmet', 'welding+mask', 'gas+mask', 'scba',
  'high+visibility+vest', 'reflective+vest', 'cut+resistant+glove',
  'arc+flash+suit', 'fire+resistant+clothing',
];

async function collectFDA510k() {
  console.log('\n-- FDA 510(k) 产品代码 --');
  let total = 0;
  const allCodes = [...new Set(Object.values(PPE_CODES).flat())];
  for (const code of allCodes) {
    const url = `https://api.fda.gov/device/510k.json?search=product_code:${code}&limit=100`;
    const result = await fetchJSON(url);
    if (!result || !result.results) continue;
    const products = [];
    for (const item of result.results) {
      const name = item.device_name || '';
      const category = cat(name);
      if (!category) continue;
      const mfr = (item.applicant || 'Unknown').substring(0, 500);
      const src = 'FDA 510(k) Database';
      if (isDup(name, mfr, src)) continue;
      markDup(name, mfr, src);
      products.push({
        name: name.substring(0, 500), category, manufacturer_name: mfr,
        country_of_origin: item.country_code || 'US',
        risk_level: /respirat|n95|scba|gas mask/i.test(name.toLowerCase()) ? 'high' : 'medium',
        product_code: code, registration_number: item.k_number || '',
        registration_authority: 'FDA', data_source: src,
        last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
        specifications: JSON.stringify({ k_number: item.k_number || '', decision_date: item.decision_date || '', product_code: code }),
      });
    }
    const inserted = await batchInsert(products);
    if (inserted > 0) console.log(`  ${code}: ${inserted}`);
    total += inserted;
    await sleep(400);
  }
  console.log(`  总计: ${total}`);
  return total;
}

async function collectFDAKeywords() {
  console.log('\n-- FDA 510(k) 关键词 --');
  let total = 0;
  for (const kw of KEYWORDS) {
    const url = `https://api.fda.gov/device/510k.json?search=device_name:${kw}&limit=100`;
    const result = await fetchJSON(url);
    if (!result || !result.results) continue;
    const products = [];
    for (const item of result.results) {
      const name = item.device_name || '';
      const category = cat(name);
      if (!category) continue;
      const mfr = (item.applicant || 'Unknown').substring(0, 500);
      const src = 'FDA 510(k) Database';
      if (isDup(name, mfr, src)) continue;
      markDup(name, mfr, src);
      products.push({
        name: name.substring(0, 500), category, manufacturer_name: mfr,
        country_of_origin: item.country_code || 'US',
        risk_level: /respirat|n95|scba|gas mask/i.test(name.toLowerCase()) ? 'high' : 'medium',
        product_code: item.product_code || '', registration_number: item.k_number || '',
        registration_authority: 'FDA', data_source: src,
        last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
        specifications: JSON.stringify({ k_number: item.k_number || '' }),
      });
    }
    const inserted = await batchInsert(products);
    if (inserted > 0) console.log(`  ${kw}: ${inserted}`);
    total += inserted;
    await sleep(300);
  }
  console.log(`  总计: ${total}`);
  return total;
}

async function collectNMPA() {
  console.log('\n-- NMPA UDID --');
  const UDID_DIR = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/UDID_FULL_RELEASE_20260501';
  if (!fs.existsSync(UDID_DIR)) { console.log('  跳过'); return 0; }

  const RE = /口罩|mask|n95|kn95|ffp|respirator|防护服|隔离衣|手术衣|gown|coverall|suit|手套|glove|护目镜|面屏|面罩|goggle|防护帽|安全帽|helmet|防护鞋|安全鞋|鞋套|boot|shoe.?cover|耳塞|耳罩|earplug|earmuff|防护|protection|protective|医用|防尘口罩|防毒|防化服|防静电|防电弧|阻燃|防辐射|防切割|绝缘|安全带|安全绳|防坠|fall.*arrest|焊接|welding|消防/i;

  function ccn(n) {
    const s = (n || '').toLowerCase();
    if (/口罩|mask|n95|kn95|ffp|respirator|防尘|防毒/i.test(s)) return '呼吸防护装备';
    if (/手套|glove/i.test(s)) return '手部防护装备';
    if (/护目镜|面屏|面罩|goggle/i.test(s)) return '眼面部防护装备';
    if (/防护帽|安全帽|helmet/i.test(s)) return '头部防护装备';
    if (/耳塞|耳罩|earplug|earmuff/i.test(s)) return '听觉防护装备';
    if (/防护鞋|安全鞋|鞋套|boot|shoe.?cover/i.test(s)) return '足部防护装备';
    if (/反光衣|反光背心|vest/i.test(s)) return '躯干防护装备';
    if (/防护服|隔离衣|手术衣|gown|coverall|suit|防化服|防电弧|耐高温|阻燃/i.test(s)) return '身体防护装备';
    if (/安全带|安全绳|防坠|fall.*arrest/i.test(s)) return '坠落防护装备';
    return null;
  }

  function et(xml, tag) { const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'); const m = xml.match(re); return m ? m[1].trim() : ''; }

  const files = fs.readdirSync(UDID_DIR).filter(f => f.endsWith('.xml')).map(f => path.join(UDID_DIR, f)).sort();
  let inserted = 0;

  for (let i = 0; i < files.length; i++) {
    try {
      const xml = fs.readFileSync(files[i], 'utf-8');
      const blocks = xml.split('<device>');
      const prods = [];
      for (let j = 1; j < blocks.length; j++) {
        const b = blocks[j].split('</device>')[0];
        if (!b) continue;
        const name = et(b, 'cpmctymc') || et(b, 'spmc') || '';
        if (!name || !RE.test(name)) continue;
        const category = ccn(name);
        if (!category) continue;
        const mfr = et(b, 'ylqxzcrbarmc') || et(b, 'scqymc') || 'Unknown';
        const rn = et(b, 'zczbhhzbapzbh') || et(b, 'yxqz') || '';
        const src = 'NMPA UDID Database';
        if (isDup(name, mfr, src)) continue;
        markDup(name, mfr, src);
        prods.push({
          name: name.substring(0, 500), category, manufacturer_name: mfr.substring(0, 500),
          country_of_origin: 'CN',
          risk_level: /N95|KN95|FFP|防毒|防护服/i.test(name) ? 'high' : 'medium',
          product_code: rn.substring(0, 50), registration_number: rn,
          registration_authority: rn.startsWith('国械注进') ? 'NMPA (Imported)' : 'NMPA (Domestic)',
          data_source: src, last_verified: new Date().toISOString().split('T')[0], data_confidence_level: 'high',
          specifications: JSON.stringify({ udi: et(b, 'zxxsdycpbs'), specification: et(b, 'ggxh'), description: et(b, 'cpms') }),
        });
      }
      if (prods.length > 0) inserted += await batchInsert(prods);
      if ((i + 1) % 100 === 0) console.log(`  进度: ${i+1}/${files.length}, 新增 ${inserted}`);
    } catch (e) {}
  }
  console.log(`  NMPA总计: ${inserted}`);
  return inserted;
}

async function main() {
  const { count: b4 } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`恢复前: ${b4?.toLocaleString()}`);
  await loadExisting();
  let total = 0;
  total += await collectFDA510k();
  total += await collectFDAKeywords();
  total += await collectNMPA();
  const { count: af } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`\n恢复前: ${b4?.toLocaleString()}, 恢复后: ${af?.toLocaleString()}, 新增: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); });