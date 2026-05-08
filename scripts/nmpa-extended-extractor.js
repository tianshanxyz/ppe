#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const AdmZip = require('adm-zip');
const fs = require('fs');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// 扩展的PPE关键词 - 包含劳动防护用品和特种防护用品
const EXTENDED_PPE_KEYWORDS = [
  // 原有医用PPE关键词
  '口罩', 'mask', 'n95', 'kn95', 'ffp', 'respirator',
  '防护服', '隔离衣', '手术衣', '防护围裙', 'gown', 'coverall', 'suit',
  '手套', 'glove',
  '护目镜', '面屏', '面罩', 'goggle', 'face shield', 'faceshield',
  '防护帽', '安全帽', '手术帽', 'cap', 'helmet',
  '防护鞋', '安全鞋', '鞋套', 'boot', 'shoe cover',
  '耳塞', '耳罩', 'earplug', 'earmuff',
  '防护', 'protection', 'protective',
  '医用', 'medical', 'surgical',
  
  // 新增：劳动防护用品关键词（可能漏掉的7200条）
  '防尘口罩', 'dust mask', '防尘',
  '防毒', 'gas mask', '防毒面具',
  '防化服', 'chemical protective', 'chemical protection',
  '防酸碱', 'acid resistant', 'alkali resistant',
  '防静电', 'anti-static', 'ESD', 'electrostatic',
  '防电弧', 'arc flash', 'arc protection',
  '耐高温', 'heat resistant', 'high temperature',
  '耐低温', 'cold resistant', 'low temperature',
  '阻燃', 'flame retardant', 'fire resistant',
  '防辐射', 'radiation protective',
  '防切割', 'cut resistant',
  '防刺穿', 'puncture resistant',
  '绝缘', 'insulating', 'insulation',
  '耐油', 'oil resistant',
  '耐磨', 'abrasion resistant',
  '安全带', 'safety belt', 'safety harness',
  '安全绳', 'safety rope', 'lanyard',
  '防坠', 'fall arrest', 'fall protection',
  '救生', 'life jacket', 'life vest', 'lifesaving',
  '焊接', 'welding', 'weld',
  '矿工', 'mining', 'miner',
  '消防', 'fire fighting', 'firefighter',
  '应急', 'emergency', 'rescue',
  '工业', 'industrial',
  '职业', 'occupational',
  
  // 新增：特种防护用品关键词（可能漏掉的470条）
  '核防护', 'nuclear protective',
  '航天', 'aerospace', 'space',
  '军用', 'military',
  '防爆', 'explosion proof', 'explosion protection',
  '防化', 'chemical defense',
  '生化', 'biochemical', 'biological',
  '防疫', 'epidemic prevention',
  '洁净', 'cleanroom', 'clean room',
  '无菌', 'sterile', 'aseptic',
];

const PPE_RE = new RegExp(EXTENDED_PPE_KEYWORDS.join('|'), 'i');

function cat(n) {
  const s = (n || '').toLowerCase();
  if (/口罩|mask|n95|kn95|ffp|respirator|防尘|防毒/i.test(s)) return '呼吸防护装备';
  if (/手套|glove/i.test(s)) return '手部防护装备';
  if (/护目镜|面屏|面罩|goggle|face shield|faceshield/i.test(s)) return '眼面部防护装备';
  if (/防护帽|安全帽|手术帽|cap|helmet/i.test(s)) return '头部防护装备';
  if (/耳塞|耳罩|earplug|earmuff/i.test(s)) return '听觉防护装备';
  if (/防护鞋|安全鞋|鞋套|boot|shoe cover/i.test(s)) return '足部防护装备';
  if (/反光衣|反光背心|vest/i.test(s)) return '躯干防护装备';
  if (/防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit|防化服|防电弧|耐高温|耐低温|阻燃|核防护|航天|军用/i.test(s)) return '身体防护装备';
  if (/安全带|安全绳|防坠|救生/i.test(s)) return '坠落防护装备';
  if (/焊接|welding|weld/i.test(s)) return '焊接防护装备';
  if (/消防|fire/i.test(s)) return '消防防护装备';
  return '其他';
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function parseDeviceBlock(block) {
  const name = extractTag(block, 'cpmctymc') || extractTag(block, 'spmc') || '';
  if (!name || !PPE_RE.test(name)) return null;

  const c = cat(name);
  // 保留更多分类，不只是排除"其他"
  if (c === '其他' && !/防护|protective|防尘|防毒|防化|阻燃|绝缘|耐高温|耐低温|防电弧|核|航天/i.test(name)) return null;

  return {
    name: name.substring(0, 500),
    category: c,
    manufacturer_name: (extractTag(block, 'ylqxzcrbarmc') || extractTag(block, 'scqymc') || 'Unknown').substring(0, 500),
    product_code: (extractTag(block, 'zczbhhzbapzbh') || extractTag(block, 'yxqz') || '').substring(0, 50),
    specification: (extractTag(block, 'ggxh') || '').substring(0, 500),
    description: (extractTag(block, 'cpms') || '').substring(0, 2000),
    classification_code: (extractTag(block, 'flbm') || '').substring(0, 50),
    product_category: (extractTag(block, 'cplb') || '').substring(0, 50),
    country_of_origin: 'CN',
    risk_level: 'medium',
    data_source: 'NMPA UDI Extended',
    registration_authority: 'NMPA',
    last_verified: new Date().toISOString().split('T')[0],
    data_confidence_level: 'high',
  };
}

async function main() {
  console.log('=== NMPA UDI 扩展筛选（补全劳动防护和特种防护）===');
  const t0 = Date.now();

  // 获取现有数据用于去重
  let keys = new Set();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('name,manufacturer_name,product_code')
      .range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => keys.add(`${(r.name||'').toLowerCase().trim()}|${(r.manufacturer_name||'').toLowerCase().trim()}|${(r.product_code||'').toLowerCase().trim()}`));
    if (data.length < 1000) break;
  }
  console.log(`现有数据: ${keys.size}条`);

  let totalPPE = 0, ins = 0, batch = [];
  const BS = 50;

  async function flush() {
    if (batch.length === 0) return;
    const toInsert = [...batch];
    batch = [];
    for (const prod of toInsert) {
      const k = `${prod.name.toLowerCase()}|${(prod.manufacturer_name||'').toLowerCase()}|${(prod.product_code||'').toLowerCase()}`;
      if (keys.has(k)) continue;
      try {
        const { error } = await supabase.from('ppe_products').insert(prod);
        if (!error) {
          keys.add(k);
          ins++;
        }
      } catch(e) {}
    }
  }

  // 解析ZIP文件
  const filePath = '/tmp/nmpa_full_latest.zip';
  console.log('Loading ZIP...');
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));
  console.log(`共${entries.length}个XML文件`);

  // 处理全部文件
  console.log(`\n处理全部${entries.length}个文件...`);

  for (let i = 0; i < entries.length; i++) {
    const xmlStr = entries[i].getData().toString('utf-8');
    const blocks = xmlStr.split('<device>');

    let filePPE = 0;
    for (let j = 1; j < blocks.length; j++) {
      const block = blocks[j].split('</device>')[0];
      if (!block) continue;
      const result = parseDeviceBlock(block);
      if (result) {
        batch.push(result);
        totalPPE++;
        filePPE++;
        if (batch.length >= BS) await flush();
      }
    }

    if ((i + 1) % 50 === 0 || (filePPE > 0 && i < 100)) {
      const pct = ((i + 1) / entries.length * 100).toFixed(1);
      process.stdout.write(`\r  进度: ${i+1}/${entries.length} (${pct}%), PPE=${totalPPE}, 新增=${ins}`);
    }
  }

  await flush();

  // 清理临时文件
  // fs.unlinkSync(filePath);

  console.log(`\n=== 最终结果 ===`);
  console.log(`PPE产品: ${totalPPE}, 新增: ${ins}`);

  // 统计
  const { count: finalCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: cnCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'CN');
  console.log(`总产品: ${finalCount}, 中国产品: ${cnCount}`);
}

main().catch(e => { console.error(e); process.exit(1); });
