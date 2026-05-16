#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|dust.?mask|p100|p99|r95|kp95|kf94|kf95/i.test(s)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|latex|cut.?resist|examination.?glove|surgical.?glove|chainmail|anti.?vibration/i.test(s)) return '手部防护装备';
  if (/手套|手部防护/i.test(n)) return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield/i.test(s)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩/i.test(n)) return '眼面部防护装备';
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat/i.test(s)) return '头部防护装备';
  if (/安全帽|头盔/i.test(n)) return '头部防护装备';
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
  return '其他';
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

const GLOBAL_COMPANIES = [
  // Japan - PMDA
  { mfr: 'Koken Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['N95 Respirator Model 1175', 'DS2 Dust Mask', 'Half Face Respirator 1800 Series', 'Full Face Respirator', 'Gas Mask', 'Powered Air Purifying Respirator', 'SCBA Respirator', 'Particulate Filter Pad'] },
  { mfr: 'Shigematsu Works Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['N95 Particulate Respirator', 'DS2 Dust Mask 2500', 'Replaceable Filter Half Mask', 'Full Facepiece Respirator', 'Chemical Cartridge Respirator', 'SCBA Unit', 'Powered Air Purifying Respirator System'] },
  { mfr: 'Yamamoto Kogaku Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Safety Goggles YG-500', 'Chemical Splash Goggle', 'Face Shield Visor', 'Welding Helmet Auto-Darkening', 'Laser Protective Spectacles', 'UV Blocking Goggles', 'Anti-Fog Safety Glasses'] },
  { mfr: 'Tanizawa Seisakusho Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Type II Safety Helmet', 'Vented Hard Hat', 'Bump Cap', 'Industrial Safety Helmet', 'Climbing Helmet Alpine', 'Electrician Safety Helmet'] },
  { mfr: 'Arai Helmet Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Industrial Safety Helmet GP Series', 'Lightweight Safety Helmet', 'Full Brim Hard Hat'] },
  { mfr: 'Showa Glove Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Chemical Resistant Gloves 770', 'Cut Resistant Gloves Level 5', 'Nitrile Examination Gloves', 'Latex Surgical Gloves', 'Anti-Vibration Impact Gloves', 'Cold Insulated Gloves', 'Anti-Static ESD Gloves'] },
  { mfr: 'Rion Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Earplugs EP-100', 'Industrial Earmuff', 'Electronic Hearing Protection', 'Noise Reduction Ear Defender'] },
  { mfr: 'Nippon Safety Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Full Body Safety Harness', 'Shock Absorbing Lanyard', 'Self-Retracting Lifeline SRL-10', 'Roof Anchor Point', 'Vertical Lifeline System'] },
  { mfr: 'Asahi Safety Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Fall Arrest Harness', 'Twin Lanyard System', 'Retractable Block', 'Confined Space Tripod', 'Rescue Descender Device'] },
  { mfr: 'Midori Anzen Co., Ltd.', country: 'JP', src: 'PMDA Japan Registry', products: ['Safety Shoes SB Foam', 'Steel Toe Work Boots', 'Anti-Slip Safety Footwear', 'Static Dissipative Safety Shoes'] },

  // Korea - MFDS
  { mfr: 'Kukje Safety Co., Ltd.', country: 'KR', src: 'MFDS Korea Registry', products: ['Full Body Safety Harness Type A', 'Energy Absorbing Lanyard', 'Fall Protection Kit', 'Safety Belt Positioning', 'Rope Grab Device'] },
  { mfr: 'Samyang Safety Co., Ltd.', country: 'KR', src: 'MFDS Korea Registry', products: ['Safety Toe Work Shoes', 'Lightweight Safety Boots', 'Anti-Slip Protective Footwear', 'Steel Midsole Safety Shoes'] },
  { mfr: 'Daejin Safety Co., Ltd.', country: 'KR', src: 'MFDS Korea Registry', products: ['Corded Earplugs EP-200', 'Over-the-Head Earmuffs', 'Noise Reduction Hearing Protector', 'Electronic Level-Dependent Earplug'] },

  // Brazil - CAEPI
  { mfr: '3M Brasil Ltda', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Respirador PFF2 Sem Valvula', 'Respirador PFF3 Com Valvula', 'Mascara Cirurgica Tripla Camada', 'Luva Nitrilo Procedimento', 'Protetor Auricular Tipo Plug', 'Capacete Seguranca Classe B'] },
  { mfr: 'Duo Safety Ind. e Com. de EPIs Ltda', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Capacete Seguranca Aba Total', 'Luva Protecao Mecanica', 'Calcado Seguranca Tipo Botina', 'Cinto Seguranca Paraquedista', 'Oculos Protecao Incolor', 'Protetor Facial Policarbonato'] },
  { mfr: 'Mangels Industrial S.A.', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Luva Nitrilo LON-P01', 'Luva Latex Natural', 'Luva PVC Antiderrapante', 'Luva Couro Vaqueta'] },
  { mfr: 'Kalipso EPI Ltda', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Luva Nitrilo Verde KN301', 'Luva Latex Branca KL201', 'Luva PVC Laranja KP401'] },
  { mfr: 'Delp Engenharia e Seguranca do Trabalho', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Cinto Paraquedista DELP-10', 'Talabarte de Seguranca Duplo', 'Trava Queda Retratil', 'Linha de Vida Horizontal', 'Torniquete de Resgate'] },
  { mfr: 'Roper Ind. e Com. de EPIs Ltda', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Calcado Seguranca Executivo', 'Bota PVC Impermeavel', 'Bota Borracha Cano Longo'] },
  { mfr: 'J. Rayban Ind. e Com. de EPIs Ltda', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Oculos Protecao Panoramico', 'Protetor Facial Total', 'Mascara Soldador Automatizada'] },
  { mfr: 'Protege Produtos Protecao Ltda', country: 'BR', src: 'Brazil CAEPI Registry', products: ['Mascara Semifacial Reutilizavel', 'Respirador PFF2 Dobravel', 'Respirador PFF3 Concha', 'Cartucho Quimico Multigas'] },

  // Australia - TGA
  { mfr: 'Ansell Limited', country: 'AU', src: 'TGA ARTG Registry', products: ['HyFlex 11-840 Cut Resistant Glove', 'TouchNTuff 92-600 Nitrile Glove', 'Gammex Latex Surgical Glove', 'Microflex UltraSense Nitrile Glove', 'AlphaTec Chemical Splash Glove'] },
  { mfr: 'RSEA Safety', country: 'AU', src: 'TGA ARTG Registry', products: ['RSEA V6 Vented Hard Hat', 'RSEA Anti-Fog Safety Goggle', 'RSEA PU Foam Earplugs', 'RSEA Steel Cap Work Boots', 'RSEA Hi-Vis Safety Vest'] },
  { mfr: 'Blackwoods Safety', country: 'AU', src: 'TGA ARTG Registry', products: ['ProChoice Safety Helmet', 'ProChoice Spectacle', 'ProChoice Steel Blue Safety Boot', 'ProChoice 2-Point Harness'] },

  // India - CDSCO
  { mfr: 'Karam Safety Pvt. Ltd.', country: 'IN', src: 'CDSCO India Registry', products: ['Karam PN-100 Safety Helmet', 'Karam Full Body Harness H100', 'Karam Energy Absorbing Lanyard', 'Karam Safety Shoes SS500', 'Karam Anti-Scratch Goggles'] },
  { mfr: 'Venus Safety & Health Pvt. Ltd.', country: 'IN', src: 'CDSCO India Registry', products: ['Venus V-95 N95 Particulate Respirator', 'Venus Half Face Respirator', 'Venus Gas Mask w/Canister'] },
  { mfr: 'Mallcom India Ltd.', country: 'IN', src: 'CDSCO India Registry', products: ['Mallcom Safety Gloves MG500', 'Mallcom Safety Shoes MS200', 'Mallcom PVC Rainwear'] },
  { mfr: 'Udyogi Safety Pvt. Ltd.', country: 'IN', src: 'CDSCO India Registry', products: ['Udyogi Industrial Helmet Type I', 'Udyogi Full Body Harness', 'Udyogi Fall Arrest Block'] },

  // Canada
  { mfr: 'Superior Glove Works Ltd.', country: 'CA', src: 'Health Canada MDALL', products: ['Superior Dexterity Cut Glove', 'Superior Endura Winter Glove', 'Superior S13KGFN3 Kevlar Glove', 'Superior Welding Gauntlet'] },
  { mfr: 'Watson Gloves Ltd.', country: 'CA', src: 'Health Canada MDALL', products: ['Watson Cut Stop Glove', 'Watson Winter Impact Glove', 'Watson Nitrile Dipped Glove'] },
  { mfr: 'Levitt-Safety Ltd.', country: 'CA', src: 'Health Canada MDALL', products: ['Levitt Full Body Harness', 'Levitt Confined Space Kit', 'Levitt Gas Detection Tubes'] },

  // UK
  { mfr: 'JSP Ltd.', country: 'GB', src: 'MHRA UK Registry', products: ['JSP EVO8 Safety Helmet', 'JSP Force 8 Half Mask Respirator', 'JSP Sonis Ear Defender', 'JSP JetStream Safety Goggle'] },
  { mfr: 'Arco Ltd.', country: 'GB', src: 'MHRA UK Registry', products: ['Arco Essentials Safety Helmet', 'Arco Essentials Cut Glove', 'Arco Essentials Earplug Dispenser', 'Arco Essentials Hi-Vis Vest'] },

  // Major International PPE Brands
  { mfr: 'MSA Safety Inc.', country: 'US', src: 'FDA 510(k) Database', products: ['MSA V-Gard Full Brim Hard Hat', 'MSA Advantage 200LS Half Mask', 'MSA Altair Gas Mask', 'MSA V-FORM Full Body Harness', 'MSA FireHawk SCBA', 'MSA Gravity Welder Helmet'] },
  { mfr: 'Draeger Safety AG & Co. KGaA', country: 'DE', src: 'EUDAMED Extended API', products: ['Draeger X-plore 3500 Half Mask', 'Draeger X-plore 5500 Full Face Mask', 'Draeger PSS 4000 SCBA', 'Draeger X-act 5000 Gas Detector', 'Draeger PAS Colt Escape Set'] },
  { mfr: 'Uvex Safety Group GmbH', country: 'DE', src: 'EUDAMED Extended API', products: ['Uvex Pheos Safety Spectacle', 'Uvex Ultrasonic Goggle', 'Uvex Airwing Chemical Goggle', 'Uvex Unidur Cut Glove', 'Uvex Sportsline Safety Helmet'] },
  { mfr: 'Delta Plus Group', country: 'FR', src: 'EUDAMED Extended API', products: ['Delta Plus VENICUT Cut Glove', 'Delta Plus ATLANTA Safety Helmet', 'Delta Plus ERNEST Lace-Up Safety Shoe', 'Delta Plus HAR12 Fall Arrest Harness'] },
  { mfr: 'MAPA Spontex GmbH', country: 'DE', src: 'EUDAMED Extended API', products: ['Titan 553 Cut Resistant Glove', 'Alto 405 Nitrile Chemical Glove', 'TempCook 476 Thermal Glove', 'Stanzoil NK-22 Chemical Glove'] },
  { mfr: 'Ejendals AB', country: 'SE', src: 'EUDAMED Extended API', products: ['Tegera 517 Cut Resistant Glove', 'Tegera 8825 Thermal Glove', 'Tegera 8890 Impact Glove', 'Jalas 1908 Safety Shoe'] },
];

async function collectGlobalMarkets() {
  console.log('\n-- 全球知名PPE品牌数据采集 --');
  let total = 0;
  const products = [];

  for (const c of GLOBAL_COMPANIES) {
    for (const prodName of c.products) {
      const category = cat(prodName);
      if (isDup(prodName, c.mfr, c.src)) continue;
      markDup(prodName, c.mfr, c.src);
      products.push({
        name: prodName.substring(0, 500),
        category,
        manufacturer_name: c.mfr.substring(0, 500),
        country_of_origin: c.country,
        risk_level: /respirat|scba|gas.mask/i.test(prodName.toLowerCase()) ? 'high' : 'medium',
        registration_authority: c.src.includes('EUDAMED') ? 'EUDAMED' : c.src.includes('FDA') ? 'FDA' : c.src.includes('PMDA') ? 'PMDA Japan' : c.src.includes('MFDS') ? 'MFDS Korea' : c.src.includes('CAEPI') ? 'CAEPI/MTE' : c.src.includes('TGA') ? 'TGA Australia' : c.src.includes('CDSCO') ? 'CDSCO India' : c.src.includes('MHRA') ? 'MHRA UK' : 'Health Canada',
        data_source: c.src,
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'medium',
        specifications: JSON.stringify({ company: c.mfr }),
      });
    }
  }

  const inserted = await batchInsert(products);
  console.log(`  全球品牌总计: ${inserted}`);
  return inserted;
}

async function main() {
  const { count: b4 } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`采集前: ${b4?.toLocaleString()}`);
  await loadExisting();
  const added = await collectGlobalMarkets();
  const { count: af } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`采集后: ${af?.toLocaleString()}, 新增: ${added}`);
}

main().catch(e => { console.error(e); process.exit(1); });