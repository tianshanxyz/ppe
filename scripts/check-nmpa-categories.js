#!/usr/bin/env node
const AdmZip = require('adm-zip');

// 读取一个XML文件，查看所有可能的分类
const zip = new AdmZip('/tmp/nmpa_full_latest.zip');
const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));

console.log(`共${entries.length}个XML文件\n`);

// 读取前3个文件，收集分类信息
const categories = new Set();
const productCategories = new Set();
const classificationCodes = new Set();
let sampleProducts = [];

for (let i = 0; i < Math.min(3, entries.length); i++) {
  const xmlStr = entries[i].getData().toString('utf-8');
  const blocks = xmlStr.split('<device>');
  
  for (let j = 1; j < Math.min(blocks.length, 100); j++) {
    const block = blocks[j].split('</device>')[0];
    if (!block) continue;
    
    // 提取分类相关字段
    const cplb = block.match(/<cplb>([^<]*)<\/cplb>/);
    const flbm = block.match(/<flbm>([^<]*)<\/flbm>/);
    const cpmctymc = block.match(/<cpmctymc>([^<]*)<\/cpmctymc>/);
    
    if (cplb) productCategories.add(cplb[1].trim());
    if (flbm) classificationCodes.add(flbm[1].trim());
    
    if (cpmctymc && sampleProducts.length < 20) {
      sampleProducts.push({
        name: cpmctymc[1].trim(),
        cplb: cplb ? cplb[1].trim() : '',
        flbm: flbm ? flbm[1].trim() : ''
      });
    }
  }
}

console.log('产品类别 (cplb):');
Array.from(productCategories).slice(0, 20).forEach(c => console.log(`  - ${c}`));

console.log('\n分类编码 (flbm):');
Array.from(classificationCodes).slice(0, 20).forEach(c => console.log(`  - ${c}`));

console.log('\n样本产品:');
sampleProducts.forEach((p, i) => {
  console.log(`  ${i+1}. ${p.name.substring(0, 40)}`);
  console.log(`      类别: ${p.cplb} | 编码: ${p.flbm}`);
});

// 搜索可能包含"劳动防护"、"特种防护"的产品
console.log('\n搜索劳动防护/特种防护相关产品:');
const laborProtection = [];
const specialProtection = [];

for (let i = 0; i < Math.min(5, entries.length); i++) {
  const xmlStr = entries[i].getData().toString('utf-8');
  const blocks = xmlStr.split('<device>');
  
  for (let j = 1; j < blocks.length; j++) {
    const block = blocks[j].split('</device>')[0];
    if (!block) continue;
    
    const name = (block.match(/<cpmctymc>([^<]*)<\/cpmctymc>/) || ['', ''])[1].trim();
    const cplb = (block.match(/<cplb>([^<]*)<\/cplb>/) || ['', ''])[1].trim();
    
    if (/劳动防护|防尘|防毒|安全鞋|防护手套/i.test(name + ' ' + cplb)) {
      if (laborProtection.length < 5) {
        laborProtection.push({ name, cplb });
      }
    }
    
    if (/特种防护|核|航天/i.test(name + ' ' + cplb)) {
      if (specialProtection.length < 5) {
        specialProtection.push({ name, cplb });
      }
    }
  }
}

console.log('\n劳动防护相关产品:');
laborProtection.forEach(p => console.log(`  - ${p.name.substring(0, 40)} [${p.cplb}]`));

console.log('\n特种防护相关产品:');
specialProtection.forEach(p => console.log(`  - ${p.name.substring(0, 40)} [${p.cplb}]`));
