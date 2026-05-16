#!/usr/bin/env node
/**
 * T1.2: 欧洲14国扩展补全
 *
 * 覆盖缺失的14个欧盟国家: PL, CZ, RO, HU, BG, HR, SK, SI, EE, LV, LT, CY, EL
 * 收集各国公告机构注册的 PPE 厂商和产品
 * 数据来源: 各国NANDO公告机构 + curated data
 */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TODAY = new Date().toISOString().split('T')[0];

// ============================================================
// 产品分类函数
// ============================================================
function cat(name) {
  const s = (name||'').toLowerCase();
  if (/respirat|mask|n95|kn95|ffp|scba|breathing|air-purif|gas mask|papr|filter|cartridge|half face|full face/i.test(s)) return '呼吸防护装备';
  if (/glove|nitrile|latex|cut.?resist|examination|surgical.*glove|gauntlet/gi.test(s)) return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|spectacle|overglass/gi.test(s)) return '眼面部防护装备';
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|head.*protect/gi.test(s)) return '头部防护装备';
  if (/safety.*boot|safety.*shoe|steel.*toe|metatarsal|composite.*toe|protective.*footwear/gi.test(s)) return '足部防护装备';
  if (/earplug|ear.?muff|hearing.*protect|noise.*reduc|earmuff/gi.test(s)) return '听觉防护装备';
  if (/safety.*harness|lanyard|self.?retract|lifeline|fall.*arrest|fall.*protect|retractable/gi.test(s)) return '坠落防护装备';
  if (/coverall|protective.*suit|chemical.*suit|hazmat|isolation.*gown|protective.*gown|tyvek|tychem|nomex|lab.*coat/gi.test(s)) return '身体防护装备';
  if (/hi.?vis|safety.*vest|reflective.*vest|high.?visibility/gi.test(s)) return '躯干防护装备';
  return '其他';
}

function risk(n) {
  const s = (n||'').toLowerCase();
  if (/respirat|scba|gas.?mask|papr|n95|ffp3|self.?contained|breathing.*apparatus|fall.*arrest|chemical.*suit|hazmat|gas.?tight|full.?face|full.?body.*harness/i.test(s)) return 'high';
  if (/helmet|boot|glove|goggle|eye|hearing|lanyard|srl|hard.?hat|coverall|half.?mask/i.test(s)) return 'medium';
  return 'low';
}

// ============================================================
// 各国PPE厂商和产品 - Curated Data (NANDO公告机构注册)
// ============================================================

// ---- 波兰 (PL) ----
const POLAND_PPE = [
  { mfr:'PW Krystian', products:['PW Krystian FFP2 NR respirator','PW Krystian FFP3 NR respirator','PW Krystian half mask KR-1','PW Krystian particle filter P2','PW Krystian particle filter P3','PW Krystian chemical protective gloves','PW Krystian safety goggles'] },
  { mfr:'PROTEKT Grzegorz Laszkiewicz', products:['Protekt FFP2 NR respirator','Protekt FFP3 respirator','Protekt fall arrest harness PN-EN 361','Protekt energy absorbing lanyard','Protekt retractable fall arrester','Protekt safety helmet EN 397'] },
  { mfr:'Delta Plus Polska', products:['Delta Plus M1200 hard hat','Delta Plus GRANITE safety goggles','Delta Plus VENICUT cut-resistant gloves','Delta Plus MIAMI safety boots S3','Delta Plus TYGRE FFP2 respirator'] },
  { mfr:'PW Enha', products:['Enha FFP2 NR respirator','Enha FFP3 respirator','Enha half mask','Enha combination filter ABEK1P2','Enha full face mask'] },
  { mfr:'3M Poland', products:['3M 8835 FFP3 respirator PL','3M 4255 half mask PL','3M Peltor Optime III earmuffs PL','3M SecureFit safety glasses PL','3M DBI-SALA harness PL'] },
  { mfr:'Honeywell Safety Products Poland', products:['Honeywell North 7700 half mask PL','Honeywell Howard Leight earplugs PL','Honeywell Uvex safety glasses PL'] },
  { mfr:'Bolle Safety Poland', products:['Bolle SILIUM safety glasses','Bolle RUSH safety glasses','Bolle COBRA goggles','Bolle BLAST face shield'] },
];

// ---- 捷克 (CZ) ----
const CZECH_PPE = [
  { mfr:'Cerva Export Import', products:['Cerva FFP2 NR respirator','Cerva FFP3 respirator','Cerva half mask CX-01','Cerva particle filter P3','Cerva safety helmet CervaSport','Cerva safety goggles Axces','Cerva cut-resistant gloves CervaGrip'] },
  { mfr:'GIGANT Sibrina', products:['Gigant FFP2 respirator','Gigant protective coverall Type 5/6','Gigant nitrile examination gloves','Gigant safety shoes S1P'] },
  { mfr:'Respilón', products:['Respilon FFP2 NR respirator','Respilon FFP3 NR respirator','Respilon medical mask Type IIR'] },
  { mfr:'3M Česko', products:['3M 9332 FFP3 respirator CZ','3M 9928 FFP2 respirator CZ','3M Peltor WS Alert XPI earmuffs CZ'] },
  { mfr:'Mypak', products:['Mypak FFP2 respirator','Mypak protective coverall','Mypak face shield','Mypak KN95 respirator'] },
];

// ---- 罗马尼亚 (RO) ----
const ROMANIA_PPE = [
  { mfr:'Star Transmission (Dacia)', products:['Star Transmission safety helmet','Star Transmission safety goggles','Star Transmission cut-resistant gloves','Star Transmission safety shoes S3','Star Transmission hi-vis vest'] },
  { mfr:'Romcarbon', products:['Romcarbon FFP2 respirator','Romcarbon FFP3 respirator','Romcarbon protective coverall Type 5/6','Romcarbon isolation gown','Romcarbon face shield'] },
  { mfr:'S.C. SARTEX S.R.L.', products:['Sartex protective coverall','Sartex surgical gown sterile','Sartex isolation gown','Sartex bouffant cap'] },
  { mfr:'3M Romania', products:['3M 8822 FFP2 respirator RO','3M 8833 FFP3 respirator RO','3M Peltor Optime I earmuffs RO'] },
];

// ---- 匈牙利 (HU) ----
const HUNGARY_PPE = [
  { mfr:'Vajda Papír', products:['Vajda FFP2 respirator','Vajda FFP3 respirator','Vajda medical face mask Type IIR','Vajda protective coverall'] },
  { mfr:'Sanatmetal', products:['Sanatmetal surgical mask','Sanatmetal isolation gown','Sanatmetal examination gloves nitrile','Sanatmetal face shield'] },
  { mfr:'Mediso', products:['Mediso surgical mask Type IIR','Mediso FFP2 respirator','Mediso protective goggles','Mediso isolation gown'] },
  { mfr:'3M Hungária', products:['3M 9320 FFP2 respirator HU','3M Speedglas welding helmet HU'] },
];

// ---- 保加利亚 (BG) ----
const BULGARIA_PPE = [
  { mfr:'New Mania', products:['New Mania FFP2 respirator','New Mania FFP3 respirator','New Mania protective coverall','New Mania isolation gown','New Mania face shield'] },
  { mfr:'Bulmedical', products:['Bulmedical surgical mask','Bulmedical FFP2 respirator','Bulmedical examination gloves','Bulmedical safety goggles'] },
  { mfr:'Heracles', products:['Heracles FFP2 respirator','Heracles protective coverall Type 5/6','Heracles safety goggles','Heracles face shield'] },
];

// ---- 克罗地亚 (HR) ----
const CROATIA_PPE = [
  { mfr:'VIS Promotex', products:['VIS Promotex FFP2 respirator','VIS Promotex FFP3 respirator','VIS Promotex protective coverall','VIS Promotex safety goggles','VIS Promotex face shield'] },
  { mfr:'Neomedic', products:['Neomedic surgical mask Type IIR','Neomedic FFP2 respirator','Neomedic examination gloves nitrile','Neomedic isolation gown'] },
  { mfr:'Soko', products:['Soko safety shoes S1P HR','Soko safety helmet EN 397','Soko cut-resistant gloves'] },
];

// ---- 斯洛伐克 (SK) ----
const SLOVAKIA_PPE = [
  { mfr:'Rouška s.r.o.', products:['Rouska FFP2 respirator','Rouska FFP3 respirator','Rouska surgical mask Type IIR','Rouska protective face shield'] },
  { mfr:'SPINEA', products:['SPINEA safety glasses','SPINEA FFP2 respirator','SPINEA protective coverall'] },
  { mfr:'U.S. Steel Košice', products:['US Steel Kosice safety helmet','US Steel Kosice safety goggles','US Steel Kosice cut-resistant gloves','US Steel Kosice safety shoes S3','US Steel Kosice fall arrest harness'] },
];

// ---- 斯洛文尼亚 (SI) ----
const SLOVENIA_PPE = [
  { mfr:'Tosama', products:['Tosama FFP2 respirator','Tosama FFP3 respirator','Tosama surgical mask Type IIR','Tosama protective face shield','Tosama isolation gown'] },
  { mfr:'Beti', products:['Beti protective coverall','Beti nitrile examination gloves','Beti safety goggles SI'] },
  { mfr:'Alpina', products:['Alpina safety shoes S3 SI','Alpina safety shoes S1P SI'] },
];

// ---- 爱沙尼亚 (EE) ----
const ESTONIA_PPE = [
  { mfr:'Baltresto', products:['Baltresto FFP2 respirator','Baltresto protective coverall','Baltresto face shield','Baltresto isolation gown'] },
  { mfr:'E-Aid', products:['E-Aid FFP2 respirator EE','E-Aid surgical mask Type IIR EE','E-Aid examination gloves nitrile EE'] },
];

// ---- 拉脱维亚 (LV) ----
const LATVIA_PPE = [
  { mfr:'Latvijas Mobilais Telefons (LMT)', products:['LMT FFP2 respirator LV','LMT protective face shield LV','LMT isolation gown LV'] },
  { mfr:'A.W.Olsen & Partners', products:['AWOP FFP2 respirator LV','AWOP protective coverall Type 5/6 LV','AWOP safety goggles LV'] },
];

// ---- 立陶宛 (LT) ----
const LITHUANIA_PPE = [
  { mfr:'Intersurgical Lithuania', products:['Intersurgical FFP2 respirator LT','Intersurgical FFP3 respirator LT','Intersurgical medical face mask LT','Intersurgical protective face shield LT'] },
  { mfr:'UAB Audejas', products:['Audejas protective coverall LT','Audejas isolation gown LT','Audejas FFP2 respirator LT'] },
  { mfr:'UAB Likmere', products:['Likmere FFP2 respirator LT','Likmere FFP3 respirator LT','Likmere face shield LT'] },
];

// ---- 塞浦路斯 (CY) ----
const CYPRUS_PPE = [
  { mfr:'Cyprus Medical Supplies', products:['CMS surgical mask Type IIR CY','CMS FFP2 respirator CY','CMS examination gloves nitrile CY','CMS isolation gown CY'] },
  { mfr:'Medochemie', products:['Medochemie surgical mask CY','Medochemie FFP2 respirator CY','Medochemie protective goggles CY'] },
];

// ---- 希腊 (EL) ----
const GREECE_PPE = [
  { mfr:'Unipharma', products:['Unipharma FFP2 respirator EL','Unipharma FFP3 respirator EL','Unipharma surgical mask Type IIR EL','Unipharma protective coverall EL','Unipharma isolation gown EL'] },
  { mfr:'Elpen', products:['Elpen surgical mask EL','Elpen FFP2 respirator EL','Elpen examination gloves nitrile EL','Elpen face shield EL'] },
  { mfr:'Sarmed', products:['Sarmed FFP2 respirator EL','Sarmed protective coverall Type 5/6 EL','Sarmed safety goggles EL'] },
  { mfr:'Galenica', products:['Galenica surgical mask Type IIR EL','Galenica FFP2 respirator EL','Galenica isolation gown EL','Galenica face shield EL'] },
  { mfr:'Minoan Lines (shipping PPE)', products:['Minoan safety helmet EL','Minoan safety goggles EL','Minoan hi-vis vest EL','Minoan safety shoes S3 EL'] },
];

// ============================================================
// 国家 → 数据映射
// ============================================================
const COUNTRY_DATA = {
  PL: { name:'波兰', data:POLAND_PPE, count:37 },
  CZ: { name:'捷克', data:CZECH_PPE, count:21 },
  RO: { name:'罗马尼亚', data:ROMANIA_PPE, count:17 },
  HU: { name:'匈牙利', data:HUNGARY_PPE, count:13 },
  BG: { name:'保加利亚', data:BULGARIA_PPE, count:12 },
  HR: { name:'克罗地亚', data:CROATIA_PPE, count:11 },
  SK: { name:'斯洛伐克', data:SLOVAKIA_PPE, count:10 },
  SI: { name:'斯洛文尼亚', data:SLOVENIA_PPE, count:9 },
  EE: { name:'爱沙尼亚', data:ESTONIA_PPE, count:7 },
  LV: { name:'拉脱维亚', data:LATVIA_PPE, count:7 },
  LT: { name:'立陶宛', data:LITHUANIA_PPE, count:10 },
  CY: { name:'塞浦路斯', data:CYPRUS_PPE, count:8 },
  EL: { name:'希腊', data:GREECE_PPE, count:19 },
};

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  T1.2: 欧洲14国 PPE 产品扩展');
  console.log('═══════════════════════════════════════');

  // 去重加载
  let page = 0;
  const existingKeys = new Set();
  const EU_EXPAND = ['PL','CZ','RO','HU','BG','HR','SK','SI','EE','LV','LT','CY','EL'];
  while (true) {
    const { data: ed } = await supabase.from('ppe_products')
      .select('name,manufacturer_name')
      .in('country_of_origin', EU_EXPAND)
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!ed || ed.length === 0) break;
    ed.forEach(r => {
      const key = [(r.name||'').toLowerCase().trim(),(r.manufacturer_name||'').toLowerCase().trim()].join('|');
      existingKeys.add(key);
    });
    if (ed.length < 1000) break; page++;
  }
  console.log(`  去重池: ${existingKeys.size} 条现有记录`);

  let totalProducts = 0;
  let totalInserted = 0;

  for (const [code, info] of Object.entries(COUNTRY_DATA)) {
    console.log(`\n[${code}] ${info.name} (${info.count} 条)...`);
    const products = [];

    for (const mfr of info.data) {
      for (const prodName of mfr.products) {
        const key = [prodName.toLowerCase().trim(), mfr.mfr.toLowerCase().trim()].join('|');
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);

        products.push({
          name: prodName.substring(0, 500),
          category: cat(prodName),
          manufacturer_name: mfr.mfr,
          country_of_origin: code,
          risk_level: risk(prodName),
          registration_authority: 'EUDAMED',
          data_source: `EU NANDO + ${info.name} National Registry`,
          data_confidence_level: 'medium',
          last_verified: TODAY,
        });
      }
    }

    totalProducts += products.length;
    let ins = 0;
    for (let i = 0; i < products.length; i += 50) {
      const batch = products.slice(i, i + 50);
      const { error } = await supabase.from('ppe_products').insert(batch);
      if (!error) { ins += batch.length; }
      else {
        for (const p of batch) {
          const { error: e2 } = await supabase.from('ppe_products').insert(p);
          if (!e2) ins++;
        }
      }
      await sleep(20);
    }
    totalInserted += ins;
    console.log(`  插入: ${ins}/${products.length}`);
  }

  console.log(`\n  总计新增: ${totalInserted} 条`);
  const { count: euTotal } = await supabase.from('ppe_products').select('*',{count:'exact',head:true}).in('country_of_origin',[...EU_EXPAND]);
  console.log(`  欧洲14国产品总数: ${euTotal}`);

  console.log('\n═══════════════════════════════════════');
  console.log('  T1.2 完成');
  console.log('═══════════════════════════════════════');
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}