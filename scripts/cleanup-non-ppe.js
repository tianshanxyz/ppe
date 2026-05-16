#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PPE_POSITIVE = [
  /respirat/i, /n95|kn95|ffp[123]|kf94|kf95/i, /mask/i, /breathing/i, /scba/i,
  /gas.?mask/i, /air.?purif/i, /papr/i, /dust/i, /particulate/i, /smoke.?hood/i,
  /escape.?hood/i, /powered.*air/i, /p100|p99|r95/i,
  /口罩|呼吸|防尘|防毒|过滤式|送风式/,
  /glove/i, /gauntlet/i, /hand.?protect/i, /nitrile/i, /latex/i, /vinyl/i,
  /cut.?resist/i, /welding.*glove/i, /chemical.*glove/i, /examination.*glove/i,
  /surgical.*glove/i, /finger.*cot/i, /chainmail/i, /anti.?vibration/i,
  /手套|手部防护|防切割/,
  /goggle/i, /eye.?protect/i, /face.?shield|faceshield/i, /visor/i,
  /safety.*glass/i, /welding.*helmet/i, /welding.*mask/i, /auto.?dark/i,
  /护目|眼镜|面屏|面罩|电焊|防飞溅/,
  /hard.?hat/i, /bump.?cap/i, /safety.*helmet/i, /industrial.*helmet/i,
  /climbing.*helmet/i, /head.*protect/i, /hardhat/i, /forestry.*helmet/i,
  /安全帽|头盔|头部防护/,
  /safety.*boot|safety.*shoe/i, /protective.*footwear/i, /steel.*toe/i,
  /metatarsal/i, /composite.*toe/i, /puncture.*resist/i, /slip.*resist/i,
  /安全鞋|安全靴|防护鞋|劳保鞋|足部防护/,
  /earplug/i, /ear.*muff/i, /hearing.*protect/i, /noise.*reduc/i,
  /earmuff/i, /ear.*defender/i,
  /耳塞|耳罩|听力防护|降噪/,
  /safety.*harness/i, /lanyard/i, /self.?retract/i, /srl/i, /lifeline/i,
  /fall.*arrest|fall.*protect/i, /shock.*absorb/i, /retractable/i,
  /anchor.*device/i, /descender/i, /rescue.*device/i, /carabiner/i,
  /snap.*hook/i, /tie.?off/i, /body.*belt/i, /chest.*harness/i,
  /安全带|安全绳|防坠|坠落防护|生命线|自锁器|速差器/,
  /coverall/i, /protective.*suit/i, /chemical.*suit/i, /hazmat.*suit/i,
  /arc.*flash/i, /isolation.*gown/i, /surgical.*gown/i, /protective.*gown/i,
  /protective.*apron/i, /tyvek/i, /tychem/i, /nomex/i, /fire.*suit/i,
  /welding.*apron/i, /flame.*resist/i, /fr.*cloth/i, /fire.*resist/i,
  /fire.*fight/i, /turnout/i, /bunker.*gear/i, /aluminized/i,
  /molten.*metal/i, /leather.*apron/i, /overall/i, /smock/i, /jumpsuit/i,
  /boiler.*suit/i, /lab.*coat/i, /knee.*pad/i, /arm.*guard/i,
  /防护服|隔离衣|手术衣|防化服|防辐射|阻燃|防静电服|防电弧|防寒服|防酸碱|围裙|套袖|护膝|连体服|实验服/,
  /hi.?vis/i, /safety.*vest/i, /reflective.*vest/i, /high.?visibility/i,
  /fluorescent/i, /conspicuity/i, /mesh.*vest/i, /flagger.*vest/i,
  /反光衣|反光背心|安全背心|高可见|荧光服|警示服|防雨服/,
  /ppe/i, /personal.*protect/i, /protective.*equip/i, /safety.*equip/i,
  /防护装备|个人防护|劳保用品|安全防护/,
  /surgical.*mask/i, /procedure.*mask/i, /isolation.*mask/i,
  /医用口罩|外科口罩|手术口罩/,
  /cap.*surgical/i, /bouffant/i, /hair.*cover/i, /shoe.*cover/i,
  /手术帽|鞋套|发帽/,
  /shield/i, /protect/i, /guard/i, /safety/i,
];

const NON_PPE_STRONG = [
  /implant/i, /dental/i, /orthoped/i, /prosthe/i, /stent/i, /catheter/i,
  /pacemaker/i, /defibrillat/i, /endoscop/i, /laparoscop/i, /arthroscop/i,
  /dialysis/i, /infusion/i, /syringe/i, /needle/i, /scalpel/i, /forceps/i,
  /retractor/i, /clamp.*surg/i, /suture/i, /staple.*surg/i, /drill.*surg/i,
  /saw.*surg/i, /plate.*bone/i, /screw.*bone/i, /pin.*bone/i, /rod.*bone/i,
  /joint.*replac/i, /hip.*replac/i, /knee.*replac/i, /shoulder.*replac/i,
  /lens.*intraocul/i, /iol/i, /corneal/i, /retina/i, /glaucoma/i,
  /hearing.*aid/i, /cochlear/i, /audiomet/i,
  /x.?ray/i, /ct.*scan/i, /mri/i, /ultrasound/i, /ecg|ekg/i,
  /blood.*pressure/i, /thermometer/i, /oximet/i, /monitor.*patient/i,
  /ventilat/i, /anesthes/i, /oxygen.*concentr/i,
  /wheelchair/i, /crutch/i, /walker/i, /brace/i, /splint/i,
  /bed.*hospital/i, /stretcher/i, /table.*operat/i,
  /software.*medic/i, /app.*medic/i, /algorithm.*medic/i,
  /test.*diagnost/i, /assay/i, /reagent/i, /kit.*test/i,
  /tissue.*engineer/i, /cell.*therapy/i, /gene.*therapy/i,
  /cosmetic/i, /aesthetic.*surg/i, /filler.*dermal/i, /botox/i,
  /植入|牙科|骨科|假体|支架|导管|起搏器|内窥镜|透析|输液|注射器|缝合|手术刀|手术器械/,
  /关节|置换|心脏|瓣膜|人工|诊断|检测|试剂|美容/,
];

function isPPE(name) {
  const n = (name || '').toLowerCase();
  for (const re of NON_PPE_STRONG) {
    if (re.test(n)) return false;
  }
  for (const re of PPE_POSITIVE) {
    if (re.test(n)) return true;
  }
  return false;
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
  return '其他';
}

async function main() {
  console.log('=== 清理非PPE产品并重新分类 ===');

  const { count: beforeCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('处理前产品总数:', beforeCount?.toLocaleString());

  let page = 0;
  const pageSize = 500;
  let nonPPEDeleted = 0;
  let reclassified = 0;
  let stillOther = 0;
  let totalProcessed = 0;

  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('id,name,category,data_source')
      .eq('category', '其他')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;

    const idsToDelete = [];
    const updates = [];

    for (const p of data) {
      if (!isPPE(p.name)) {
        idsToDelete.push(p.id);
      } else {
        const newCat = categorizePPE(p.name);
        if (newCat !== '其他') {
          updates.push({ id: p.id, category: newCat });
        } else {
          stillOther++;
        }
      }
    }

    if (idsToDelete.length > 0) {
      for (let i = 0; i < idsToDelete.length; i += 200) {
        const batch = idsToDelete.slice(i, i + 200);
        const { error: delError } = await supabase.from('ppe_products').delete().in('id', batch);
        if (!delError) nonPPEDeleted += batch.length;
        await sleep(30);
      }
    }

    for (const u of updates) {
      const { error: updError } = await supabase.from('ppe_products')
        .update({ category: u.category })
        .eq('id', u.id);
      if (!updError) reclassified++;
    }

    totalProcessed += data.length;
    nonPPEDeleted += 0;

    if (data.length < pageSize) break;
    page++;
    if (page % 20 === 0) {
      console.log(`  已处理 ${totalProcessed}, 删除非PPE ${nonPPEDeleted}, 重分类 ${reclassified}`);
    }
    await sleep(30);
  }

  console.log('\n=== 处理完成 ===');
  console.log(`删除非PPE产品: ${nonPPEDeleted}`);
  console.log(`重新分类: ${reclassified}`);
  console.log(`仍为其他: ${stillOther}`);

  const { count: afterCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: otherCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  console.log(`\n处理后产品总数: ${afterCount?.toLocaleString()}`);
  console.log(`其他分类剩余: ${otherCount?.toLocaleString()}`);

  const categories = ['呼吸防护装备', '手部防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '听觉防护装备', '坠落防护装备', '身体防护装备', '躯干防护装备', '其他'];
  console.log('\n分类分布:');
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    console.log(`  ${cat}: ${count?.toLocaleString()}`);
  }
}

main().catch(console.error);
