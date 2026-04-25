#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const NON_PPE_STRONG = [
  /surgical system/i, /surgical instrument/i, /electrosurgical/i, /surgical mesh/i,
  /surgical device/i, /surgical spear/i, /surgical aspirat/i, /surgical handpiece/i,
  /surgical plan/i, /surgical smoke/i, /surgical knife/i, /surgical pad/i,
  /implant/i, /orthoped/i, /cardiac/i, /pacemaker/i, /stent/i,
  /catheter/i, /needle/i, /syringe/i, /scalpel/i, /scissor/i,
  /forceps/i, /retractor/i, /clamp/i, /suture/i, /drill/i,
  /dental/i, /endodont/i, /orthodont/i, /prosth/i, /hearing aid/i,
  /wheelchair/i, /monitor/i, /defibrill/i, /ventilat/i, /infusion/i,
  /dialysis/i, /x-ray/i, /ultrasound/i, /mri/i, /ct scan/i,
  /endoscop/i, /laparoscop/i, /arthroscop/i, /cystoscop/i,
  /electrode/i, /sensor/i, /transducer/i, /software/i, /algorithm/i,
  /diagnostic/i, /test kit/i, /reagent/i, /steriliz/i, /disinfect/i,
  /microscope/i, /centrifuge/i, /incubat/i, /vial/i, /container/i,
  /fixator/i, /distract/i, /compress/i, /traction/i, /cast/i,
  /splint/i, /brace/i, /bandage/i, /dressing/i, /wound/i,
  /biopsy/i, /specimen/i, /swab/i, /cotton/i, /gauze/i, /sponge/i,
  /stoma/i, /ostom/i, /drain/i, /suction/i, /irrigat/i,
  /inject/i, /transfus/i, /blood/i, /urine/i, /tumor/i, /cancer/i,
  /oncolog/i, /chemo/i, /radiat/i, /nuclear/i, /laser/i, /ablat/i,
  /cauter/i, /coagul/i, /knife/i, /blade/i, /saw/i, /screw/i,
  /plate/i, /rod/i, /wire/i, /pin/i, /bone/i, /joint/i, /spine/i,
  /kidney/i, /liver/i, /heart/i, /lung.*transplant/i, /brain/i,
  /breast.*implant/i, /thyroid/i, /stomach/i, /colon/i, /prostate/i,
  /da vinci/i, /robot/i, /transceiver/i, /probe/i, /charger/i,
  /aspirat/i, /handpiece/i, /contra-angle/i, /fluorotex/i,
  /plume.*pen/i, /electro.*surg/i, /mesh/i, /drape/i,
  /kit/i, /system/i, /pump/i, /generator/i, /battery/i,
  /cable/i, /tube/i, /cannula/i, /stylet/i, /obturator/i,
  /trocar/i, /seal/i, /anchor/i, /graft/i, /patch/i,
  /valve/i, /shunt/i, /stent/i, /filter.*vena/i,
];

const PPE_RESCUE = [
  { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium', patterns: [/protective garment/i, /surgical gown/i, /isolation gown/i, /protective cloth/i, /coverall/i] },
  { category: '呼吸防护装备', sub: 'Mask', risk: 'high', patterns: [/mask/i, /respirat/i, /n95/i, /filtering face/i] },
  { category: '手部防护装备', sub: 'Glove', risk: 'low', patterns: [/glove/i, /nitrile/i, /latex/i] },
  { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low', patterns: [/shield/i, /goggle/i, /eyewear/i] },
  { category: '头部防护装备', sub: 'Head Protection', risk: 'low', patterns: [/cap/i, /hood/i, /bouffant/i, /head cover/i] },
  { category: '足部防护装备', sub: 'Foot Protection', risk: 'low', patterns: [/shoe cover/i, /boot cover/i, /overshoe/i] },
];

async function targetedClean() {
  console.log('\n=== Targeted Clean: Remove Surgical Devices, Keep PPE ===\n');

  const batchSize = 2000;
  let offset = 0;
  let toDelete = [];
  let toReclassify = [];

  const { count: totalOther } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`"其他" products: ${totalOther.toLocaleString()}`);

  while (offset < totalOther + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description, subcategory')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = [(p.name || ''), (p.description || ''), (p.subcategory || '')].join(' ');

      let isPPE = false;
      for (const rule of PPE_RESCUE) {
        if (rule.patterns.some(pat => pat.test(text))) {
          toReclassify.push({ id: p.id, category: rule.category, sub: rule.sub, risk: rule.risk });
          isPPE = true;
          break;
        }
      }

      if (!isPPE && NON_PPE_STRONG.some(pat => pat.test(text))) {
        toDelete.push(p.id);
      }
    }

    offset += batchSize;
  }

  console.log(`  To delete: ${toDelete.length}`);
  console.log(`  To reclassify: ${toReclassify.length}`);

  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 500) {
    const batch = toDelete.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
  }
  console.log(`  ✅ Deleted ${deleted} non-PPE products`);

  let reclassified = 0;
  for (const item of toReclassify) {
    const { error } = await supabase
      .from('ppe_products')
      .update({ category: item.category, subcategory: item.sub, risk_level: item.risk })
      .eq('id', item.id);
    if (!error) reclassified++;
  }
  console.log(`  ✅ Reclassified ${reclassified} PPE products`);

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: other } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log(`\n  Total products: ${total.toLocaleString()}`);
  console.log(`  Remaining "其他": ${other.toLocaleString()} (${(other / total * 100).toFixed(1)}%)`);
}

async function main() {
  await targetedClean();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
