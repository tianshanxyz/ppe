#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function upsertRecords(table, records) {
  if (!records || records.length === 0) return 0;
  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      const { error: insErr } = await supabase.from(table).insert(batch);
      if (!insErr) inserted += batch.length;
    } else {
      inserted += batch.length;
    }
    await sleep(100);
  }
  return inserted;
}

const PPE_REGULATIONS = [
  {
    title: 'EU Regulation (EU) 2016/425 - Personal Protective Equipment',
    title_zh: '欧盟个人防护装备法规 (EU) 2016/425',
    jurisdiction: 'EU',
    type: 'regulation',
    category: 'PPE',
    effective_date: '2018-04-21',
    content: 'Regulation (EU) 2016/425 of the European Parliament and of the Council of 9 March 2016 on personal protective equipment and repealing Council Directive 89/686/EEC. This regulation lays down requirements for the design and manufacture of personal protective equipment (PPE) so that it can be placed on the Union market. It applies to all PPE intended for use in professional, domestic, leisure, and sports activities.',
    keywords: ['PPE', 'EU', 'regulation', '2016/425', 'certification', 'CE marking'],
    risk_categories: ['Category I - Minimal risks', 'Category II - Risks other than those in Cat I and III', 'Category III - Very serious or fatal risks'],
  },
  {
    title: 'FDA 21 CFR Part 820 - Quality System Regulation',
    title_zh: 'FDA 21 CFR Part 820 质量体系法规',
    jurisdiction: 'US',
    type: 'regulation',
    category: 'Quality System',
    effective_date: '1996-10-07',
    content: 'The Quality System (QS) regulation covers the methods and documentation of the design, production, and delivery of medical devices. It requires manufacturers to establish and follow quality systems to ensure their products consistently meet applicable requirements and specifications.',
    keywords: ['FDA', 'QSR', '21 CFR 820', 'quality system', 'GMP'],
  },
  {
    title: 'FDA 510(k) Premarket Notification',
    title_zh: 'FDA 510(k) 上市前通知',
    jurisdiction: 'US',
    type: 'guidance',
    category: 'Premarket',
    effective_date: '1976-05-28',
    content: 'Section 510(k) of the Federal Food, Drug, and Cosmetic Act requires device manufacturers to register and notify FDA of their intent to market a medical device at least 90 days in advance. This is known as Premarket Notification or 510(k). Most PPE devices (surgical masks, gloves, gowns) require 510(k) clearance.',
    keywords: ['FDA', '510k', 'premarket', 'notification', 'clearance'],
  },
  {
    title: 'NIOSH 42 CFR Part 84 - Respiratory Protective Devices',
    title_zh: 'NIOSH 42 CFR Part 84 呼吸防护设备',
    jurisdiction: 'US',
    type: 'regulation',
    category: 'Respiratory Protection',
    effective_date: '1995-07-10',
    content: 'This regulation establishes the approval requirements for respiratory protective devices. It classifies respirators into three series: N (Not resistant to oil), R (Resistant to oil), and P (Oil-proof), each with three efficiency levels (95, 99, 100). N95 respirators are the most commonly used PPE under this regulation.',
    keywords: ['NIOSH', '42 CFR 84', 'N95', 'respirator', 'approval', 'certification'],
  },
  {
    title: 'ISO 13485:2016 - Medical Devices Quality Management Systems',
    title_zh: 'ISO 13485:2016 医疗器械质量管理体系',
    jurisdiction: 'International',
    type: 'standard',
    category: 'Quality Management',
    effective_date: '2016-03-01',
    content: 'ISO 13485:2016 specifies requirements for a quality management system where an organization needs to demonstrate its ability to provide medical devices and related services that consistently meet customer and applicable regulatory requirements. It is the most widely used QMS standard for medical device manufacturers worldwide.',
    keywords: ['ISO 13485', 'QMS', 'medical device', 'quality management'],
  },
  {
    title: 'EN 149:2001+A1:2009 - Filtering Half Masks',
    title_zh: 'EN 149:2001+A1:2009 过滤式半面罩',
    jurisdiction: 'EU',
    type: 'standard',
    category: 'Respiratory Protection',
    effective_date: '2009-03-01',
    content: 'This European Standard specifies the requirements for filtering half masks used as respiratory protective devices, excluding escape devices and devices for use in oxygen-deficient atmospheres. It classifies masks into FFP1, FFP2, and FFP3 based on filtration efficiency.',
    keywords: ['EN 149', 'FFP1', 'FFP2', 'FFP3', 'filtering half mask', 'respirator'],
  },
  {
    title: 'EN 374 - Protective Gloves Against Chemicals and Micro-organisms',
    title_zh: 'EN 374 防化学品和微生物防护手套',
    jurisdiction: 'EU',
    type: 'standard',
    category: 'Hand Protection',
    effective_date: '2016-12-01',
    content: 'EN 374 series specifies the requirements for protective gloves against chemicals and micro-organisms. Part 1 defines terminology and performance requirements, Part 2 covers determination of resistance to penetration, and Part 3 covers determination of resistance to permeation by chemicals.',
    keywords: ['EN 374', 'chemical glove', 'micro-organism', 'penetration', 'permeation'],
  },
  {
    title: 'EN 14126 - Protective Clothing Against Infective Agents',
    title_zh: 'EN 14126 防感染因子防护服',
    jurisdiction: 'EU',
    type: 'standard',
    category: 'Body Protection',
    effective_date: '2003-10-01',
    content: 'This European Standard specifies the requirements and test methods for re-usable and limited use protective clothing providing protection against infective agents. It must be used in combination with EN ISO 13688 for general requirements.',
    keywords: ['EN 14126', 'infective agent', 'protective clothing', 'biological'],
  },
  {
    title: 'ASTM F2100 - Standard Specification for Performance of Materials Used in Medical Face Masks',
    title_zh: 'ASTM F2100 医用口罩材料性能标准规范',
    jurisdiction: 'US',
    type: 'standard',
    category: 'Respiratory Protection',
    effective_date: '2024-01-01',
    content: 'This specification covers the classification and performance requirements for materials used in medical face masks. It establishes three levels of barrier performance: Level 1 (low), Level 2 (moderate), and Level 3 (high) based on bacterial filtration efficiency, particulate filtration efficiency, fluid resistance, and other parameters.',
    keywords: ['ASTM F2100', 'medical mask', 'barrier', 'filtration', 'BFE', 'PFE'],
  },
  {
    title: 'ASTM D6319 - Standard Specification for Nitrile Examination Gloves',
    title_zh: 'ASTM D6319 丁腈检查手套标准规范',
    jurisdiction: 'US',
    type: 'standard',
    category: 'Hand Protection',
    effective_date: '2023-01-01',
    content: 'This specification covers nitrile rubber gloves used in medical examinations, diagnostic and therapeutic procedures, and handling of contaminated materials. It includes requirements for physical dimensions, physical properties, and pinhole defects.',
    keywords: ['ASTM D6319', 'nitrile glove', 'examination', 'medical'],
  },
  {
    title: 'ASTM F2407 - Standard Specification for Surgical Gowns',
    title_zh: 'ASTM F2407 手术服标准规范',
    jurisdiction: 'US',
    type: 'standard',
    category: 'Body Protection',
    effective_date: '2020-01-01',
    content: 'This specification covers the minimum requirements for surgical gowns intended for use in health care facilities. It addresses liquid barrier performance, strength, and other properties. Gowns are classified into four levels based on AAMI PB70 liquid barrier performance.',
    keywords: ['ASTM F2407', 'surgical gown', 'liquid barrier', 'AAMI'],
  },
  {
    title: 'GB 19083-2010 - Medical Protective Mask',
    title_zh: 'GB 19083-2010 医用防护口罩技术要求',
    jurisdiction: 'CN',
    type: 'standard',
    category: 'Respiratory Protection',
    effective_date: '2011-08-01',
    content: 'This Chinese national standard specifies the technical requirements, test methods, marking and instructions for medical protective masks. It classifies masks into three levels based on filtration efficiency: Level 1 (≥95%), Level 2 (≥99%), Level 3 (≥99.97%).',
    keywords: ['GB 19083', 'medical protective mask', 'China', 'filtration efficiency'],
  },
  {
    title: 'GB 14866-2006 - Personal Protective Equipment for Eyes and Face',
    title_zh: 'GB 14866-2006 个人用眼面防护装备',
    jurisdiction: 'CN',
    type: 'standard',
    category: 'Eye/Face Protection',
    effective_date: '2007-04-01',
    content: 'This Chinese standard specifies the technical requirements, test methods, and marking for personal protective equipment for eyes and face, including protective goggles, face shields, and welding protective equipment.',
    keywords: ['GB 14866', 'eye protection', 'face protection', 'China'],
  },
  {
    title: 'GB 10213-2006 - Single-use Medical Examination Gloves',
    title_zh: 'GB 10213-2006 一次性使用医用检查手套',
    jurisdiction: 'CN',
    type: 'standard',
    category: 'Hand Protection',
    effective_date: '2007-04-01',
    content: 'This Chinese standard specifies the requirements for single-use medical examination gloves made from rubber latex or rubber solution. It covers physical dimensions, physical properties, and pinhole defects.',
    keywords: ['GB 10213', 'examination glove', 'single-use', 'China'],
  },
  {
    title: 'GB 19082-2009 - Medical Protective Clothing',
    title_zh: 'GB 19082-2009 医用防护服技术要求',
    jurisdiction: 'CN',
    type: 'standard',
    category: 'Body Protection',
    effective_date: '2010-03-01',
    content: 'This Chinese standard specifies the technical requirements, test methods, marking and instructions for medical protective clothing. It covers requirements for liquid barrier, filtration efficiency, microbial penetration resistance, and other properties.',
    keywords: ['GB 19082', 'protective clothing', 'medical', 'China'],
  },
  {
    title: 'MDD 93/42/EEC - Medical Devices Directive',
    title_zh: '欧盟医疗器械指令 93/42/EEC',
    jurisdiction: 'EU',
    type: 'regulation',
    category: 'Medical Devices',
    effective_date: '1993-06-14',
    content: 'The Medical Devices Directive establishes the regulatory framework for medical devices in the European Economic Area. Some PPE products that also qualify as medical devices (surgical masks, examination gloves) fall under this directive. Being replaced by MDR 2017/745.',
    keywords: ['MDD', '93/42/EEC', 'medical device', 'directive', 'CE marking'],
  },
  {
    title: 'MDR 2017/745 - Medical Devices Regulation',
    title_zh: '欧盟医疗器械法规 2017/745',
    jurisdiction: 'EU',
    type: 'regulation',
    category: 'Medical Devices',
    effective_date: '2021-05-26',
    content: 'The Medical Devices Regulation replaces the MDD 93/42/EEC and Active Implantable Medical Device Directive. It introduces stricter requirements for clinical evidence, post-market surveillance, and transparency. PPE products that are also medical devices must comply with this regulation.',
    keywords: ['MDR', '2017/745', 'medical device', 'regulation', 'clinical evidence'],
  },
  {
    title: 'ANSI/AAMI PB70 - Liquid Barrier Performance',
    title_zh: 'ANSI/AAMI PB70 液体阻隔性能',
    jurisdiction: 'US',
    type: 'standard',
    category: 'Body Protection',
    effective_date: '2012-01-01',
    content: 'This standard establishes a classification system for liquid barrier performance of protective apparel and drapes used in health care facilities. It defines four levels of liquid barrier protection, with Level 4 providing the highest protection against liquid and viral penetration.',
    keywords: ['AAMI PB70', 'liquid barrier', 'protective apparel', 'classification'],
  },
  {
    title: 'EN 166 - Personal Eye Protection',
    title_zh: 'EN 166 个人眼部防护',
    jurisdiction: 'EU',
    type: 'standard',
    category: 'Eye/Face Protection',
    effective_date: '2002-01-01',
    content: 'This European Standard specifies the general requirements for personal eye protection. It covers optical requirements, mechanical strength, and other properties for various types of eye protectors including goggles, face shields, and spectacles.',
    keywords: ['EN 166', 'eye protection', 'goggles', 'face shield'],
  },
  {
    title: 'NMPA 医疗器械监督管理条例',
    title_zh: '医疗器械监督管理条例（国务院令第739号）',
    jurisdiction: 'CN',
    type: 'regulation',
    category: 'Medical Devices',
    effective_date: '2021-06-01',
    content: '《医疗器械监督管理条例》是中国医疗器械监管的最高行政法规，规定了医疗器械的研制、生产、经营、使用和监督管理活动。个人防护装备中属于医疗器械的产品（如医用口罩、医用手套、医用防护服）需按照本条例进行注册和备案。',
    keywords: ['NMPA', '医疗器械', '监督管理', '注册', '备案'],
  },
  {
    title: 'TGA Therapeutic Goods Act 1989',
    title_zh: 'TGA 治疗商品法 1989',
    jurisdiction: 'AU',
    type: 'regulation',
    category: 'Medical Devices',
    effective_date: '1989-01-01',
    content: 'The Therapeutic Goods Act 1989 is the Australian legislation governing the import, export, manufacture, and supply of therapeutic goods, including medical devices. PPE products classified as medical devices must be included in the Australian Register of Therapeutic Goods (ARTG).',
    keywords: ['TGA', 'Therapeutic Goods Act', 'ARTG', 'Australia', 'medical device'],
  },
  {
    title: 'Health Canada Medical Devices Regulations (SOR/98-282)',
    title_zh: '加拿大医疗器械法规 SOR/98-282',
    jurisdiction: 'CA',
    type: 'regulation',
    category: 'Medical Devices',
    effective_date: '1998-05-28',
    content: 'The Medical Devices Regulations establish the requirements for the sale, importation, and advertisement of medical devices in Canada. PPE products that are medical devices must hold a Medical Device Licence (MDL) and be listed in the Medical Devices Active Licence Listing (MDALL).',
    keywords: ['Health Canada', 'SOR/98-282', 'MDL', 'MDALL', 'medical device'],
  },
  {
    title: 'EN 455 - Medical Gloves for Single Use',
    title_zh: 'EN 455 一次性医用手套',
    jurisdiction: 'EU',
    type: 'standard',
    category: 'Hand Protection',
    effective_date: '2020-03-01',
    content: 'EN 455 series specifies requirements for single-use medical gloves. Part 1 covers requirements and testing for freedom from holes, Part 2 covers physical properties, Part 3 covers biological evaluation, and Part 4 covers determination of shelf life.',
    keywords: ['EN 455', 'medical glove', 'single-use', 'biological evaluation'],
  },
  {
    title: 'EN 14605 - Protective Clothing Against Liquid Chemicals',
    title_zh: 'EN 14605 防液体化学品防护服',
    jurisdiction: 'EU',
    type: 'standard',
    category: 'Body Protection',
    effective_date: '2005-12-01',
    content: 'This European Standard specifies the requirements for protective clothing providing protection against liquid chemicals. It covers garments with liquid-tight or spray-tight connections between different parts of the clothing.',
    keywords: ['EN 14605', 'liquid chemical', 'protective clothing', 'Type 3', 'Type 4'],
  },
  {
    title: 'ISO 16604 - Clothing for Protection Against Contact with Blood and Body Fluids',
    title_zh: 'ISO 16604 防血液和体液接触防护服',
    jurisdiction: 'International',
    type: 'standard',
    category: 'Body Protection',
    effective_date: '2024-01-01',
    content: 'This International Standard specifies a test method for measuring the resistance of materials used in protective clothing to penetration by blood-borne pathogens using a surrogate bacteriophage. This test is critical for evaluating the viral penetration resistance of surgical gowns and other PPE.',
    keywords: ['ISO 16604', 'blood penetration', 'viral penetration', 'protective clothing'],
  },
];

async function collectRegulations() {
  console.log('\n=== Collecting PPE Regulations & Standards ===\n');

  const records = PPE_REGULATIONS.map((reg, idx) => ({
    name: reg.title,
    code: reg.type === 'standard' ? reg.title.split(' - ')[0]?.split(' ').slice(0, 3).join(' ') : `${reg.jurisdiction}-${reg.type}-${idx + 1}`,
    region: reg.jurisdiction,
    description: `${reg.type.toUpperCase()} | ${reg.category}\n\n${reg.content}${reg.risk_categories ? '\n\nRisk Categories: ' + reg.risk_categories.join(', ') : ''}\n\nKeywords: ${(reg.keywords || []).join(', ')}`,
  }));

  let inserted = 0;
  for (const record of records) {
    const { error } = await supabase.from('ppe_regulations').insert(record);
    if (!error) {
      inserted++;
      console.log(`  ✅ ${record.region} - ${record.name.substring(0, 60)}...`);
    } else {
      console.log(`  ❌ ${record.region} - ${error.message}`);
    }
  }

  console.log(`\n  Total: ${inserted}/${records.length} regulations inserted`);
  return inserted;
}

async function collectFDARecallsAsRegulations() {
  console.log('\n=== FDA Recalls as Regulation References ===\n');
  let totalInserted = 0;

  const keywords = ['mask', 'respirator', 'glove', 'gown', 'protective', 'face shield'];
  
  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;

    for (let page = 0; page < 5; page++) {
      const url = `https://api.fda.gov/device/recall.json?api_key=${FDA_KEY}&search=device:${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        const records = data.results.map((item, idx) => ({
          name: `FDA Recall: ${(item.product_description || 'Unknown').substring(0, 200)}`,
          code: `RECALL-${item.classification || 'UNK'}-${skip + idx + 1}`,
          region: 'US',
          description: `Product: ${item.product_description || ''}\nReason: ${item.reason_for_recall || ''}\nFirm: ${item.recalling_firm || ''}\nClassification: ${item.classification || ''}\nStatus: ${item.status || ''}`,
        }));

        for (const record of records) {
          const { error } = await supabase.from('ppe_regulations').insert(record);
          if (!error) totalInserted++;
        }

        skip += limit;
        await sleep(400);
      } catch (e) {
        break;
      }
    }
  }

  console.log(`  Total: ${totalInserted} recall records inserted`);
  return totalInserted;
}

async function collectFDASafetyCommunications() {
  console.log('\n=== FDA Safety Communications ===\n');
  let totalInserted = 0;

  const keywords = ['mask', 'respirator', 'glove', 'gown', 'ppe', 'protective equipment'];
  
  for (const keyword of keywords) {
    const url = `https://api.fda.gov/device/safety.json?api_key=${FDA_KEY}&search=${encodeURIComponent(keyword)}&limit=100`;
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results.map((item, idx) => ({
        name: item.title || `FDA Safety Communication - ${keyword}`,
        code: `SAFETY-${keyword.toUpperCase()}-${idx + 1}`,
        region: 'US',
        description: item.content || item.summary || '',
      }));

      for (const record of records) {
        const { error } = await supabase.from('ppe_regulations').insert(record);
        if (!error) totalInserted++;
      }

      console.log(`  ${keyword}: ${records.length} records`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }

  console.log(`  Total: ${totalInserted} safety records inserted`);
  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Regulations & Standards Collection');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  if (command === 'all' || command === 'core') {
    await collectRegulations();
  }

  if (command === 'all' || command === 'recalls') {
    await collectFDARecallsAsRegulations();
  }

  if (command === 'all' || command === 'safety') {
    await collectFDASafetyCommunications();
  }

  const { count } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log(`\n  Total regulations in database: ${count}`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
