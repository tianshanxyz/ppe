#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const NON_PPE = [
  /implant/i, /dental/i, /orthoped/i, /prosthe/i, /stent/i, /catheter/i,
  /pacemaker/i, /defibrillat/i, /endoscop/i, /laparoscop/i, /arthroscop/i,
  /dialysis/i, /infusion/i, /syringe/i, /needle/i, /scalpel/i, /forceps/i,
  /retractor/i, /clamp/i, /suture/i, /staple/i, /drill/i, /saw/i,
  /plate.*bone/i, /screw.*bone/i, /pin.*bone/i, /rod.*bone/i,
  /joint.*replac/i, /hip.*replac/i, /knee.*replac/i, /shoulder.*replac/i,
  /lens.*intraocul/i, /iol/i, /corneal/i, /retina/i, /glaucoma/i,
  /hearing.*aid/i, /cochlear/i, /audiomet/i,
  /x.?ray/i, /ct.*scan/i, /mri/i, /ultrasound/i, /ecg|ekg/i,
  /blood.*pressure/i, /thermometer/i, /oximet/i, /monitor/i, /monitoring/i,
  /ventilat/i, /anesthes/i, /oxygen.*concentr/i,
  /wheelchair/i, /crutch/i, /walker/i, /brace/i, /splint/i,
  /bed.*hospital/i, /stretcher/i, /table.*operat/i,
  /software/i, /algorithm/i, /app.*medic/i,
  /test.*diagnost/i, /assay/i, /reagent/i, /kit.*test/i,
  /tissue.*engineer/i, /cell.*therapy/i, /gene.*therapy/i,
  /cosmetic/i, /aesthetic/i, /filler/i, /botox/i,
  /co2/i, /capnograph/i, /capnometer/i, /anesthesia/i, /nasal.*cannula/i,
  /sampling.*line/i, /airway.*adapter/i, /mass.*spectrometr/i,
  /etco2/i, /tidal/i, /carbon.*dioxide/i, /oxy.*deliver/i,
  /cannula/i, /breathing.*circuit/i, /ventilator/i,
  /electrode/i, /sensor/i, /transducer/i, /cable/i, /lead.*wire/i,
  /pump/i, /battery.*charger/i, /charger/i, /power.*supply/i,
  /module/i, /analyzer/i, /detector/i, /alarm/i,
  /tube/i, /circuit/i, /connector/i, /adapter/i, /filter.*line/i,
  /bipap/i, /cpap/i, /nebuliz/i, /spiromet/i,
  /suction/i, /aspirat/i, /irrigat/i,
  /inject/i, /dispens/i, /dilut/i,
  /curette/i, /dilator/i, /elevat/i, /resect/i, /biops/i,
  /cauter/i, /ligat/i, /probe/i, /scope/i,
  /stoma/i, /tracheo/i, /laryng/i, /intubat/i,
  /tourniquet/i, /compress/i, /bandag/i, /dressing/i, /wound/i,
  /surgic.*instrument/i, /instrument.*surgic/i,
  /disposable.*device/i, /single.*use.*device/i,
  /accessories/i, /accessory/i, /attachment/i,
  /植入|牙科|骨科|假体|支架|导管|起搏器|内窥镜|透析|输液|注射器|缝合|手术刀|手术器械/,
  /关节|置换|心脏|瓣膜|人工|诊断|检测|试剂|美容|监测|麻醉|呼吸机|导管/,
  /电极|传感器|探头|泵|电池|充电器|模块|分析仪|报警|管路|回路/,
];

const PPE_SPECIFIC = [
  { re: /respirat/i, cat: '呼吸防护装备' },
  { re: /n95|kn95|ffp[123]|kf94|kf95/i, cat: '呼吸防护装备' },
  { re: /mask/i, cat: '呼吸防护装备' },
  { re: /scba/i, cat: '呼吸防护装备' },
  { re: /gas.?mask/i, cat: '呼吸防护装备' },
  { re: /papr/i, cat: '呼吸防护装备' },
  { re: /dust/i, cat: '呼吸防护装备' },
  { re: /particulate/i, cat: '呼吸防护装备' },
  { re: /smoke.?hood/i, cat: '呼吸防护装备' },
  { re: /escape.?hood/i, cat: '呼吸防护装备' },
  { re: /powered.*air/i, cat: '呼吸防护装备' },
  { re: /p100|p99|r95/i, cat: '呼吸防护装备' },
  { re: /口罩|呼吸|防尘|防毒|过滤式|送风式/, cat: '呼吸防护装备' },
  { re: /glove/i, cat: '手部防护装备' },
  { re: /gauntlet/i, cat: '手部防护装备' },
  { re: /nitrile/i, cat: '手部防护装备' },
  { re: /cut.?resist/i, cat: '手部防护装备' },
  { re: /examination.*glove/i, cat: '手部防护装备' },
  { re: /surgical.*glove/i, cat: '手部防护装备' },
  { re: /chainmail/i, cat: '手部防护装备' },
  { re: /anti.?vibration/i, cat: '手部防护装备' },
  { re: /手套|手部防护|防切割/, cat: '手部防护装备' },
  { re: /goggle/i, cat: '眼面部防护装备' },
  { re: /eye.?protect/i, cat: '眼面部防护装备' },
  { re: /face.?shield|faceshield/i, cat: '眼面部防护装备' },
  { re: /safety.*glass/i, cat: '眼面部防护装备' },
  { re: /welding.*helmet/i, cat: '眼面部防护装备' },
  { re: /welding.*mask/i, cat: '眼面部防护装备' },
  { re: /auto.?dark/i, cat: '眼面部防护装备' },
  { re: /护目|眼镜|面屏|面罩|电焊|防飞溅/, cat: '眼面部防护装备' },
  { re: /hard.?hat/i, cat: '头部防护装备' },
  { re: /bump.?cap/i, cat: '头部防护装备' },
  { re: /safety.*helmet/i, cat: '头部防护装备' },
  { re: /industrial.*helmet/i, cat: '头部防护装备' },
  { re: /climbing.*helmet/i, cat: '头部防护装备' },
  { re: /head.*protect/i, cat: '头部防护装备' },
  { re: /hardhat/i, cat: '头部防护装备' },
  { re: /安全帽|头盔|头部防护/, cat: '头部防护装备' },
  { re: /safety.*boot|safety.*shoe/i, cat: '足部防护装备' },
  { re: /protective.*footwear/i, cat: '足部防护装备' },
  { re: /steel.*toe/i, cat: '足部防护装备' },
  { re: /metatarsal/i, cat: '足部防护装备' },
  { re: /composite.*toe/i, cat: '足部防护装备' },
  { re: /puncture.*resist/i, cat: '足部防护装备' },
  { re: /安全鞋|安全靴|防护鞋|劳保鞋|足部防护/, cat: '足部防护装备' },
  { re: /earplug/i, cat: '听觉防护装备' },
  { re: /ear.*muff/i, cat: '听觉防护装备' },
  { re: /hearing.*protect/i, cat: '听觉防护装备' },
  { re: /noise.*reduc/i, cat: '听觉防护装备' },
  { re: /earmuff/i, cat: '听觉防护装备' },
  { re: /耳塞|耳罩|听力防护|降噪/, cat: '听觉防护装备' },
  { re: /safety.*harness/i, cat: '坠落防护装备' },
  { re: /lanyard/i, cat: '坠落防护装备' },
  { re: /self.?retract/i, cat: '坠落防护装备' },
  { re: /lifeline/i, cat: '坠落防护装备' },
  { re: /fall.*arrest|fall.*protect/i, cat: '坠落防护装备' },
  { re: /shock.*absorb/i, cat: '坠落防护装备' },
  { re: /retractable/i, cat: '坠落防护装备' },
  { re: /carabiner/i, cat: '坠落防护装备' },
  { re: /snap.*hook/i, cat: '坠落防护装备' },
  { re: /安全带|安全绳|防坠|坠落防护|生命线|自锁器|速差器/, cat: '坠落防护装备' },
  { re: /coverall/i, cat: '身体防护装备' },
  { re: /protective.*suit/i, cat: '身体防护装备' },
  { re: /chemical.*suit/i, cat: '身体防护装备' },
  { re: /hazmat.*suit/i, cat: '身体防护装备' },
  { re: /arc.*flash/i, cat: '身体防护装备' },
  { re: /isolation.*gown/i, cat: '身体防护装备' },
  { re: /surgical.*gown/i, cat: '身体防护装备' },
  { re: /protective.*gown/i, cat: '身体防护装备' },
  { re: /protective.*apron/i, cat: '身体防护装备' },
  { re: /tyvek|tychem/i, cat: '身体防护装备' },
  { re: /nomex/i, cat: '身体防护装备' },
  { re: /fire.*suit/i, cat: '身体防护装备' },
  { re: /welding.*apron/i, cat: '身体防护装备' },
  { re: /flame.*resist/i, cat: '身体防护装备' },
  { re: /fire.*resist/i, cat: '身体防护装备' },
  { re: /fire.*fight/i, cat: '身体防护装备' },
  { re: /turnout/i, cat: '身体防护装备' },
  { re: /bunker.*gear/i, cat: '身体防护装备' },
  { re: /aluminized/i, cat: '身体防护装备' },
  { re: /molten.*metal/i, cat: '身体防护装备' },
  { re: /leather.*apron/i, cat: '身体防护装备' },
  { re: /lab.*coat/i, cat: '身体防护装备' },
  { re: /knee.*pad/i, cat: '身体防护装备' },
  { re: /防护服|隔离衣|手术衣|防化服|防辐射|阻燃|防静电服|防电弧|防寒服|防酸碱|围裙|套袖|护膝|连体服|实验服/, cat: '身体防护装备' },
  { re: /hi.?vis/i, cat: '躯干防护装备' },
  { re: /safety.*vest/i, cat: '躯干防护装备' },
  { re: /reflective.*vest/i, cat: '躯干防护装备' },
  { re: /high.?visibility/i, cat: '躯干防护装备' },
  { re: /fluorescent/i, cat: '躯干防护装备' },
  { re: /反光衣|反光背心|安全背心|高可见|荧光服|警示服|防雨服/, cat: '躯干防护装备' },
  { re: /ppe/i, cat: '其他' },
  { re: /personal.*protect/i, cat: '其他' },
  { re: /protective.*equip/i, cat: '其他' },
  { re: /safety.*equip/i, cat: '其他' },
  { re: /防护装备|个人防护|劳保用品|安全防护/, cat: '其他' },
];

function classifyProduct(name) {
  const n = (name || '').toLowerCase();
  for (const re of NON_PPE) {
    if (re.test(n)) return null;
  }
  for (const { re, cat } of PPE_SPECIFIC) {
    if (re.test(n)) return cat;
  }
  return null;
}

async function main() {
  console.log('=== 增强版清理非PPE产品 ===');
  const { count: beforeCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('处理前产品总数:', beforeCount?.toLocaleString());

  let page = 0;
  const pageSize = 500;
  let nonPPEDeleted = 0;
  let reclassified = 0;
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
      const result = classifyProduct(p.name);
      if (result === null) {
        idsToDelete.push(p.id);
      } else if (result !== '其他') {
        updates.push({ id: p.id, category: result });
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
    if (data.length < pageSize) break;
    page++;
    if (page % 20 === 0) {
      console.log(`  已处理 ${totalProcessed}, 删除 ${nonPPEDeleted}, 重分类 ${reclassified}`);
    }
    await sleep(30);
  }

  console.log('\n=== 处理完成 ===');
  console.log(`删除非PPE产品: ${nonPPEDeleted}`);
  console.log(`重新分类: ${reclassified}`);

  const { count: afterCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: otherCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  console.log(`处理后产品总数: ${afterCount?.toLocaleString()}`);
  console.log(`其他分类剩余: ${otherCount?.toLocaleString()}`);

  const categories = ['呼吸防护装备', '手部防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '听觉防护装备', '坠落防护装备', '身体防护装备', '躯干防护装备', '其他'];
  console.log('\n分类分布:');
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    console.log(`  ${cat}: ${count?.toLocaleString()}`);
  }

  const { count: mc } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n制造商总数: ${mc?.toLocaleString()}`);
}

main().catch(console.error);
