#!/usr/bin/env node
const AdmZip = require('adm-zip');
const fs = require('fs');

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
  };
}

async function main() {
  console.log('=== NMPA UDI 原始数据提取分析 ===\n');

  const filePath = '/tmp/nmpa_full_latest.zip';
  console.log('Loading ZIP...');
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));
  console.log(`共${entries.length}个XML文件\n`);

  let totalDevices = 0;
  let totalPPE = 0;
  const categoryCount = {};
  const industrialKeywords = {};
  const specialtyKeywords = {};
  const sampleProducts = [];

  // 工业PPE关键词
  const indKeywords = ['防尘', '防毒', '防化', '防酸碱', '防静电', '防电弧', '耐高温', '耐低温', '阻燃', '防辐射', '防切割', '防刺穿', '绝缘', '耐油', '耐磨', '安全带', '安全绳', '防坠', '焊接', '矿工', '消防'];
  // 特种PPE关键词
  const specKeywords = ['核防护', '航天', '军用', '防爆', '生化'];

  for (let i = 0; i < entries.length; i++) {
    const xmlStr = entries[i].getData().toString('utf-8');
    const blocks = xmlStr.split('<device>');

    for (let j = 1; j < blocks.length; j++) {
      const block = blocks[j].split('</device>')[0];
      if (!block) continue;

      totalDevices++;

      const result = parseDeviceBlock(block);
      if (result) {
        totalPPE++;
        categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;

        // 统计工业PPE关键词
        indKeywords.forEach(kw => {
          if (result.name.includes(kw)) {
            industrialKeywords[kw] = (industrialKeywords[kw] || 0) + 1;
          }
        });

        // 统计特种PPE关键词
        specKeywords.forEach(kw => {
          if (result.name.includes(kw)) {
            specialtyKeywords[kw] = (specialtyKeywords[kw] || 0) + 1;
          }
        });

        // 收集样本
        if (sampleProducts.length < 50) {
          sampleProducts.push(result);
        }
      }
    }

    if ((i + 1) % 100 === 0) {
      const pct = ((i + 1) / entries.length * 100).toFixed(1);
      process.stdout.write(`\r  进度: ${i+1}/${entries.length} (${pct}%), 设备=${totalDevices}, PPE=${totalPPE}`);
    }
  }

  console.log('\n\n=== 统计结果 ===');
  console.log(`总设备数: ${totalDevices.toLocaleString()}`);
  console.log(`PPE产品数: ${totalPPE.toLocaleString()}`);
  console.log(`PPE占比: ${(totalPPE/totalDevices*100).toFixed(2)}%`);

  console.log('\n=== 按分类统计 ===');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  console.log('\n=== 工业PPE关键词统计 ===');
  Object.entries(industrialKeywords)
    .sort((a, b) => b[1] - a[1])
    .forEach(([kw, count]) => {
      console.log(`  ${kw}: ${count}`);
    });

  console.log('\n=== 特种PPE关键词统计 ===');
  Object.entries(specialtyKeywords)
    .sort((a, b) => b[1] - a[2])
    .forEach(([kw, count]) => {
      console.log(`  ${kw}: ${count}`);
    });

  console.log('\n=== PPE产品样本（前20个）===');
  sampleProducts.slice(0, 20).forEach((p, i) => {
    console.log(`  ${i+1}. [${p.category}] ${p.name}`);
  });
}

main().catch(console.error);
