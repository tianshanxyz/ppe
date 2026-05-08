#!/usr/bin/env node
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function insertRegulations(records) {
  if (!records || records.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase.from('ppe_regulations').insert(batch);
    if (!error) inserted += batch.length;
    await sleep(100);
  }
  return inserted;
}

async function main() {
  console.log('========================================');
  console.log('PPE 法规标准数据采集');
  console.log('========================================');

  const existingRegs = await fetchAll('ppe_regulations', 'id,name,code');
  const existingCodes = new Set(existingRegs.map(r => (r.code || '').toLowerCase().trim()));
  console.log(`现有法规: ${existingRegs.length}`);

  let totalInserted = 0;

  // ===== ISO Standards =====
  console.log('\n========================================');
  console.log('ISO 国际标准采集');
  console.log('========================================');

  const isoStandards = [
    { code: 'ISO 4869-1', name: 'Acoustics - Hearing protectors - Part 1', category: '听力保护', status: 'Published', region: 'Global' },
    { code: 'ISO 4869-2', name: 'Hearing protectors - Estimation of effective A-weighted sound pressure levels', category: '听力保护', status: 'Published', region: 'Global' },
    { code: 'ISO 11611', name: 'Protective clothing for use in welding and allied processes', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 11612', name: 'Protective clothing - Clothing to protect against heat and flame', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 13997', name: 'Protective clothing - Mechanical properties - Determination of resistance to cutting', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 13998', name: 'Protective clothing - Protection against cut and stab', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 14877', name: 'Protective clothing for gaseous chemical agents', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 15738', name: 'Protective clothing - Protection against gaseous chemicals', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 15768', name: 'Determination of resistance to chemical attack - Protective gloves', category: '手套', status: 'Published', region: 'Global' },
    { code: 'ISO 20344', name: 'Personal protective equipment - Test methods for footwear', category: '鞋类', status: 'Published', region: 'Global' },
    { code: 'ISO 20345', name: 'Personal protective equipment - Safety footwear', category: '鞋类', status: 'Published', region: 'Global' },
    { code: 'ISO 20346', name: 'Personal protective equipment - Protective footwear', category: '鞋类', status: 'Published', region: 'Global' },
    { code: 'ISO 20347', name: 'Personal protective equipment - Occupational footwear', category: '鞋类', status: 'Published', region: 'Global' },
    { code: 'ISO 21420', name: 'Protective gloves - General requirements and test methods', category: '手套', status: 'Published', region: 'Global' },
    { code: 'ISO 22526', name: 'Protective clothing for use against viruses', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 23616', name: 'Cleaning, inspection and repair of firefighters PPE', category: '消防', status: 'Published', region: 'Global' },
    { code: 'ISO/TS 20141', name: 'PPE compatibility testing guidelines', category: '综合', status: 'Published', region: 'Global' },
    { code: 'ISO 13688', name: 'Protective clothing - General requirements', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 16602', name: 'Protective clothing for protection against chemicals', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 27065', name: 'Protective clothing - Protection against pesticides', category: '防护服', status: 'Published', region: 'Global' },
    { code: 'ISO 45001', name: 'Occupational health and safety management systems', category: '管理体系', status: 'Published', region: 'Global' },
    { code: 'ISO 13485', name: 'Medical devices - Quality management systems', category: '质量管理体系', status: 'Published', region: 'Global' },
  ];

  const isoRecords = isoStandards
    .filter(s => !existingCodes.has(s.code.toLowerCase()))
    .map(s => ({
      name: s.name,
      code: s.code,
      region: s.region,
      description: `ISO标准 - ${s.category}: ${s.name}`,
      effective_date: '2020-01-01',
      document_url: `https://www.iso.org/standard/${s.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.html`,
      created_at: new Date().toISOString(),
    }));

  const isoInserted = await insertRegulations(isoRecords);
  console.log(`  ISO标准: ${isoInserted} 条`);
  totalInserted += isoInserted;

  // ===== EN Harmonized Standards =====
  console.log('\n========================================');
  console.log('EN 协调标准采集');
  console.log('========================================');

  const enStandards = [
    { code: 'EN 340', name: 'Protective clothing - General requirements', category: '综合' },
    { code: 'EN 343', name: 'Protective clothing - Protection against rain', category: '防护服' },
    { code: 'EN 348', name: 'Protective clothing - Behaviour of materials on contact with molten metal', category: '防护服' },
    { code: 'EN 352-1', name: 'Hearing protectors - Ear-muffs', category: '听力' },
    { code: 'EN 352-2', name: 'Hearing protectors - Ear-plugs', category: '听力' },
    { code: 'EN 352-3', name: 'Hearing protectors - Attached to industrial safety helmets', category: '听力' },
    { code: 'EN 353-1', name: 'Personal fall protection equipment - Guided type fall arresters', category: '坠落' },
    { code: 'EN 353-2', name: 'Personal fall protection equipment - Guided type fall arresters on flexible anchor line', category: '坠落' },
    { code: 'EN 358', name: 'Personal protection equipment for preventing falls from a height', category: '坠落' },
    { code: 'EN 360', name: 'Personal fall protection equipment - Retractable type fall arresters', category: '坠落' },
    { code: 'EN 361', name: 'Personal fall protection equipment - Full body harnesses', category: '坠落' },
    { code: 'EN 362', name: 'Personal protection equipment against falls from a height - Connectors', category: '坠落' },
    { code: 'EN 363', name: 'Personal fall protection equipment - Fall arrest systems', category: '坠落' },
    { code: 'EN 364', name: 'Personal fall protection equipment - Test methods', category: '坠落' },
    { code: 'EN 365', name: 'Personal fall protection equipment - Maintenance instructions', category: '坠落' },
    { code: 'EN 374-1', name: 'Protective gloves against dangerous chemicals and micro-organisms', category: '手套' },
    { code: 'EN 374-2', name: 'Protective gloves - Determination of resistance to penetration', category: '手套' },
    { code: 'EN 374-3', name: 'Protective gloves - Determination of resistance to permeation by chemicals', category: '手套' },
    { code: 'EN 374-4', name: 'Protective gloves - Determination of resistance to degradation by chemicals', category: '手套' },
    { code: 'EN 381-5', name: 'Protective clothing for users of hand-held chainsaws', category: '防护服' },
    { code: 'EN 381-9', name: 'Protective clothing for users of hand-held chainsaws - Anti-chipping trousers', category: '防护服' },
    { code: 'EN 388', name: 'Protective gloves against mechanical risks', category: '手套' },
    { code: 'EN 397', name: 'Industrial safety helmets', category: '头部' },
    { code: 'EN 402', name: 'Respiratory protective devices - Lung-regulated demand valve', category: '呼吸' },
    { code: 'EN 404', name: 'Respiratory protective devices - Self-contained closed-circuit escape apparatus', category: '呼吸' },
    { code: 'EN 405', name: 'Respiratory protective devices - Valved filtering half masks', category: '呼吸' },
    { code: 'EN 407', name: 'Protective gloves against thermal risks', category: '手套' },
    { code: 'EN 420', name: 'Protective gloves - General requirements and test methods', category: '手套' },
    { code: 'EN 421', name: 'Protective gloves against ionising radiation and radioactive contamination', category: '手套' },
    { code: 'EN 455-1', name: 'Medical gloves for single use - Requirements and testing for freedom from holes', category: '手套' },
    { code: 'EN 455-2', name: 'Medical gloves for single use - Physical properties', category: '手套' },
    { code: 'EN 455-3', name: 'Medical gloves for single use - Biological evaluation', category: '手套' },
    { code: 'EN 455-4', name: 'Medical gloves for single use - Shelf life determination', category: '手套' },
    { code: 'EN 469', name: 'Protective clothing for firefighters', category: '消防' },
    { code: 'EN 795', name: 'Protection against falls from a height - Anchor devices', category: '坠落' },
    { code: 'EN 1149-1', name: 'Protective clothing - Electrostatic properties - Test method', category: '防护服' },
    { code: 'EN 1149-3', name: 'Protective clothing - Electrostatic properties - Charge decay', category: '防护服' },
    { code: 'EN 1149-5', name: 'Protective clothing - Electrostatic properties - Performance requirements', category: '防护服' },
    { code: 'EN 12492', name: 'Mountaineering equipment - Helmets for mountaineers', category: '头部' },
    { code: 'EN 14052', name: 'High performance industrial helmets', category: '头部' },
    { code: 'EN 14120', name: 'Protective clothing - Wrist, palm and knuckle protectors', category: '防护服' },
    { code: 'EN 14126', name: 'Protective clothing - Performance requirements for protective clothing against infective agents', category: '防护服' },
    { code: 'EN 14328', name: 'Protective clothing - Protection against cuts by hand knives', category: '防护服' },
    { code: 'EN ISO 20344', name: 'Footwear - Test methods', category: '鞋类' },
    { code: 'EN ISO 20345', name: 'Footwear - Safety footwear', category: '鞋类' },
    { code: 'EN ISO 20346', name: 'Footwear - Protective footwear', category: '鞋类' },
    { code: 'EN ISO 20347', name: 'Footwear - Occupational footwear', category: '鞋类' },
  ];

  const enRecords = enStandards
    .filter(s => !existingCodes.has(s.code.toLowerCase()))
    .map(s => ({
      name: s.name,
      code: s.code,
      region: 'EU',
      description: `EN协调标准 - ${s.category}: ${s.name}`,
      effective_date: '2020-01-01',
      document_url: `https://www.cencenelec.eu/standards/Defines/PPE/${s.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      created_at: new Date().toISOString(),
    }));

  const enInserted = await insertRegulations(enRecords);
  console.log(`  EN标准: ${enInserted} 条`);
  totalInserted += enInserted;

  // ===== OSHA Regulations =====
  console.log('\n========================================');
  console.log('OSHA 联邦法规采集');
  console.log('========================================');

  const oshaRegs = [
    { code: '29 CFR 1910.132', name: 'General requirements - Personal protective equipment', description: '雇主必须进行危害评估并提供适当PPE' },
    { code: '29 CFR 1910.132(a)', name: 'Hazard assessment', description: '工作场所危害评估要求' },
    { code: '29 CFR 1910.132(b)', name: 'Equipment selection', description: '根据危害选择适当PPE' },
    { code: '29 CFR 1910.132(c)', name: 'Employee use', description: '确保员工正确使用PPE' },
    { code: '29 CFR 1910.132(d)', name: 'Training', description: 'PPE使用培训要求' },
    { code: '29 CFR 1910.132(e)', name: 'Retraining', description: '工作场所变化时重新培训' },
    { code: '29 CFR 1910.132(f)', name: 'Written certification', description: '培训记录书面认证' },
    { code: '29 CFR 1910.133', name: 'Eye and face protection', description: '眼面部防护要求' },
    { code: '29 CFR 1910.134', name: 'Respiratory protection', description: '呼吸防护要求，包含书面呼吸防护计划' },
    { code: '29 CFR 1910.134(a)', name: 'Written program', description: '书面呼吸防护计划' },
    { code: '29 CFR 1910.134(b)', name: 'Hazard evaluation', description: '呼吸危害评估' },
    { code: '29 CFR 1910.134(c)', name: 'Medical evaluation', description: '员工医学评估' },
    { code: '29 CFR 1910.134(d)', name: 'Fit testing', description: '定量适配测试' },
    { code: '29 CFR 1910.134(e)', name: 'Training', description: '呼吸防护培训' },
    { code: '29 CFR 1910.135', name: 'Head protection', description: '头部防护要求' },
    { code: '29 CFR 1910.136', name: 'Foot protection', description: '足部防护要求' },
    { code: '29 CFR 1910.137', name: 'Electrical protective devices', description: '电绝缘防护设备' },
    { code: '29 CFR 1910.138', name: 'Hand protection', description: '手部防护要求' },
    { code: '42 CFR Part 84', name: 'Respiratory protective devices approval', description: 'NIOSH呼吸防护设备批准标准' },
  ];

  const oshaRecords = oshaRegs
    .filter(s => !existingCodes.has(s.code.toLowerCase()))
    .map(s => ({
      name: s.name,
      code: s.code,
      region: 'US',
      description: `${s.description}`,
      effective_date: '1970-01-01',
      document_url: `https://www.osha.gov/laws-regs/regulations/standardnumber/${s.code.split(' ')[2]}`,
      created_at: new Date().toISOString(),
    }));

  const oshaInserted = await insertRegulations(oshaRecords);
  console.log(`  OSHA法规: ${oshaInserted} 条`);
  totalInserted += oshaInserted;

  // ===== China GB Standards =====
  console.log('\n========================================');
  console.log('中国国家标准采集');
  console.log('========================================');

  const gbStandards = [
    { code: 'GB/T 32166.1', name: '个体防护装备 防护服装 化学防护服的选择、使用和维护', category: '防护服' },
    { code: 'GB/T 32166.2', name: '个体防护装备 防护服装 化学防护服的试验方法', category: '防护服' },
    { code: 'GB/T 29510', name: '个体防护装备配备规范', category: '综合' },
    { code: 'GB/T 30012', name: '个人防护装备术语', category: '综合' },
    { code: 'GB/T 11651', name: '个体防护装备选用规范', category: '综合' },
    { code: 'GB/T 12624', name: '手部防护 通用技术条件及测试方法', category: '手套' },
    { code: 'GB 2626-2019', name: '呼吸防护 自吸过滤式防颗粒物呼吸器', category: '呼吸防护' },
    { code: 'GB 19083-2010', name: '医用防护口罩技术要求', category: '呼吸防护' },
    { code: 'GB 19082-2009', name: '医用一次性防护服技术要求', category: '防护服' },
    { code: 'YY/T 0691', name: '医用一次性防护服', category: '医疗' },
    { code: 'YY/T 0866', name: '医用防护口罩', category: '医疗' },
    { code: 'YY/T 0969', name: '一次性使用医用口罩', category: '医疗' },
    { code: 'GB 14866', name: '个人用眼护具技术要求', category: '眼面部' },
    { code: 'GB/T 32610', name: '日常防护型口罩技术规范', category: '呼吸防护' },
    { code: 'GB 2890', name: '呼吸防护 自吸过滤式防毒面具', category: '呼吸防护' },
    { code: 'GB 12011', name: '足部防护 电绝缘鞋', category: '足部' },
    { code: 'GB 2811', name: '头部防护 安全帽', category: '头部' },
    { code: 'GB/T 23466', name: '护听器的选择指南', category: '听力' },
  ];

  const gbRecords = gbStandards
    .filter(s => !existingCodes.has(s.code.toLowerCase()))
    .map(s => ({
      name: s.name,
      code: s.code,
      region: 'CN',
      description: `中国国家标准 - ${s.category}: ${s.name}`,
      effective_date: '2019-01-01',
      document_url: `https://www.nmpa.gov.cn/`,
      created_at: new Date().toISOString(),
    }));

  const gbInserted = await insertRegulations(gbRecords);
  console.log(`  中国标准: ${gbInserted} 条`);
  totalInserted += gbInserted;

  // ===== EU Regulations =====
  console.log('\n========================================');
  console.log('欧盟法规采集');
  console.log('========================================');

  const euRegs = [
    { code: 'EU 2016/425', name: 'Regulation on personal protective equipment', description: '欧盟PPE法规，替代89/686/EEC指令' },
    { code: 'EU 2017/745', name: 'Regulation on medical devices (MDR)', description: '欧盟医疗器械法规' },
    { code: 'EU 2017/746', name: 'Regulation on in vitro diagnostic medical devices (IVDR)', description: '欧盟体外诊断医疗器械法规' },
  ];

  const euRegRecords = euRegs
    .filter(s => !existingCodes.has(s.code.toLowerCase()))
    .map(s => ({
      name: s.name,
      code: s.code,
      region: 'EU',
      description: s.description,
      effective_date: '2016-01-01',
      document_url: `https://eur-lex.europa.eu/eli/reg/${s.code.toLowerCase().replace(/\//g, '/')}`,
      created_at: new Date().toISOString(),
    }));

  const euInserted = await insertRegulations(euRegRecords);
  console.log(`  欧盟法规: ${euInserted} 条`);
  totalInserted += euInserted;

  // ===== Summary =====
  console.log('\n========================================');
  console.log('法规标准采集完成');
  console.log('========================================');
  console.log(`  ISO标准: ${isoInserted}`);
  console.log(`  EN标准: ${enInserted}`);
  console.log(`  OSHA法规: ${oshaInserted}`);
  console.log(`  中国标准: ${gbInserted}`);
  console.log(`  欧盟法规: ${euInserted}`);
  console.log(`  新增法规总计: ${totalInserted}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
