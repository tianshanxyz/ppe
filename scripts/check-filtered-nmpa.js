#!/usr/bin/env node
const AdmZip = require('adm-zip');

// 读取一个 XML 文件，检查被过滤的产品
const zip = new AdmZip('/tmp/nmpa_full.zip');
const entry = zip.getEntry('UDID_FULL_DOWNLOAD_PART26_Of_1136_2026-05-01.xml');
const xmlStr = entry.getData().toString('utf-8');

// 提取所有产品名称
const nameMatches = xmlStr.match(/<cpmctymc>([^<]*)<\/cpmctymc>/g) || [];
const names = nameMatches.map(m => {
  const match = m.match(/<cpmctymc>([^<]*)<\/cpmctymc>/);
  return match ? match[1].trim() : '';
}).filter(n => n.length > 0);

console.log(`文件总产品数: ${names.length}`);

// 检查匹配情况
const PPE_RE = /口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩|面具|衣|镜|靴|面屏|围裙/i;
const matched = names.filter(n => PPE_RE.test(n));
const notMatched = names.filter(n => !PPE_RE.test(n));

console.log(`\n匹配 PPE 关键词: ${matched.length}`);
console.log(`不匹配 PPE 关键词: ${notMatched.length}`);

console.log('\n=== 匹配的 PPE 产品示例（前20）===');
matched.slice(0, 20).forEach((n, i) => console.log(`  ${i+1}. ${n}`));

console.log('\n=== 不匹配的 产品示例（前20）===');
notMatched.slice(0, 20).forEach((n, i) => console.log(`  ${i+1}. ${n}`));

// 统计匹配产品的分类
function cat(n) {
  const s = (n || '');
  if (/口罩|mask|n95|kn95|ffp/i.test(s)) return '呼吸防护';
  if (/手套|glove/i.test(s)) return '手部防护';
  if (/护目镜|面罩|面屏|goggle/i.test(s)) return '眼面部防护';
  if (/安全帽|防护帽|helmet/i.test(s)) return '头部防护';
  if (/耳塞|耳罩|earplug/i.test(s)) return '听觉防护';
  if (/防护鞋|安全鞋|boot/i.test(s)) return '足部防护';
  if (/反光衣|反光背心|vest/i.test(s)) return '躯干防护';
  if (/防护服|隔离衣|手术衣|防护围裙|gown|coverall|suit/i.test(s)) return '身体防护';
  return '其他';
}

const catCount = {};
matched.forEach(n => {
  const c = cat(n);
  catCount[c] = (catCount[c] || 0) + 1;
});

console.log('\n=== 匹配产品的分类分布 ===');
Object.entries(catCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
  console.log(`  ${k}: ${v}`);
});

const otherCount = catCount['其他'] || 0;
console.log(`\n被分类为"其他"而过滤的: ${otherCount} / ${matched.length} (${(otherCount/matched.length*100).toFixed(1)}%)`);
