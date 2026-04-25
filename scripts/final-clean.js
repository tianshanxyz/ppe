#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_PATTERNS = [
  { category: '呼吸防护装备', sub: 'Mask', risk: 'high', patterns: [/mask/i, /respirat/i, /n95/i, /kn95/i, /ffp[123]/i, /filtering face/i, /air.purif/i, /papr/i, /particulate/i, /breathing/i, /gas mask/i, /dust/i] },
  { category: '手部防护装备', sub: 'Glove', risk: 'low', patterns: [/glove/i, /nitrile/i, /latex/i, /vinyl/i, /hand protect/i, /finger cot/i] },
  { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium', patterns: [/gown/i, /coverall/i, /protective cloth/i, /isolation/i, /apron/i, /cover suit/i, /scrub/i, /lab coat/i, /smock/i, /hazmat/i, /tyvek/i, /barrier/i, /impervious/i, /fluid resist/i] },
  { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low', patterns: [/shield/i, /goggle/i, /eyewear/i, /eye protect/i, /visors/i, /spectacle/i, /splash guard/i] },
  { category: '头部防护装备', sub: 'Head Protection', risk: 'low', patterns: [/cap/i, /hood/i, /bouffant/i, /head cover/i, /hair net/i, /helmet/i, /hard hat/i] },
  { category: '足部防护装备', sub: 'Foot Protection', risk: 'low', patterns: [/shoe cover/i, /boot cover/i, /overshoe/i, /foot cover/i, /foot protect/i] },
];

const NON_PPE_PATTERNS = [
  /implant/i, /orthoped/i, /cardiac/i, /pacemaker/i, /stent/i,
  /catheter/i, /needle/i, /syringe/i, /scalpel/i, /scissor/i,
  /forceps/i, /retractor/i, /clamp/i, /suture/i, /drill/i,
  /saw/i, /screw/i, /plate/i, /rod/i, /wire/i, /pin/i,
  /dental/i, /endodont/i, /orthodont/i, /prosth/i, /hearing aid/i,
  /wheelchair/i, /crutch/i, /walker/i, /bed/i, /stretcher/i,
  /monitor/i, /defibrill/i, /ventilat/i, /infusion/i, /pump/i,
  /dialysis/i, /x-ray/i, /ultrasound/i, /mri/i, /ct scan/i,
  /endoscop/i, /laparoscop/i, /arthroscop/i, /cystoscop/i,
  /electrode/i, /sensor/i, /transducer/i, /cable/i, /battery/i,
  /software/i, /algorithm/i, /analyz/i, /diagnostic/i, /test kit/i,
  /reagent/i, /calibrat/i, /steriliz/i, /disinfect/i, /autoclave/i,
  /microscope/i, /centrifuge/i, /incubat/i, /pipette/i, /vial/i,
  /tube/i, /container/i, /tray/i, /basin/i, /bucket/i,
  /fixator/i, /distract/i, /compress/i, /traction/i, /cast/i,
  /splint/i, /brace/i, /support/i, /belt/i, /bandage/i,
  /dressing/i, /wound/i, /burn/i, /skin/i, /tissue/i,
  /bone/i, /joint/i, /spine/i, /disc/i, /vertebr/i,
  /kidney/i, /liver/i, /heart/i, /lung/i, /brain/i,
  /eye.*surgery/i, /laser/i, /ablat/i, /cauter/i, /coagul/i,
  /biopsy/i, /specimen/i, /sample/i, /collect/i, /swab/i,
  /cotton/i, /gauze/i, /sponge/i, /tape/i, /adhesive/i,
  /stoma/i, /ostom/i, /cath/i, /drain/i, /suction/i,
  /irrigat/i, /inject/i, /infus/i, /transfus/i, /blood/i,
  /urine/i, /fecal/i, /bowel/i, /bladder/i, /prostate/i,
  /breast/i, /thyroid/i, /pancrea/i, /stomach/i, /intestin/i,
  /colon/i, /rectum/i, /append/i, /gallblad/i, /spleen/i,
  /lymph/i, /tumor/i, /cancer/i, /oncolog/i, /chemo/i,
  /radiat/i, /nuclear/i, /isotope/i, /radio/i,
];

async function finalClean() {
  console.log('\n=== Final Clean: Remove Remaining Non-PPE ===\n');

  const { count: totalOther } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`"其他" products: ${totalOther.toLocaleString()}`);

  const batchSize = 2000;
  let offset = 0;
  let toDelete = [];
  let toReclassify = [];

  while (offset < totalOther + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description, subcategory, model, product_code')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = [
        p.name || '',
        p.description || '',
        p.subcategory || '',
      ].join(' ');

      const isNonPPE = NON_PPE_PATTERNS.some(pat => pat.test(text));

      if (isNonPPE) {
        toDelete.push(p.id);
        continue;
      }

      for (const rule of PPE_PATTERNS) {
        if (rule.patterns.some(pat => pat.test(text))) {
          toReclassify.push({ id: p.id, category: rule.category, sub: rule.sub, risk: rule.risk });
          break;
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  Scanned ${offset}, delete: ${toDelete.length}, reclassify: ${toReclassify.length}`);
    }
  }

  console.log(`\n  To delete: ${toDelete.length.toLocaleString()}`);
  console.log(`  To reclassify: ${toReclassify.length.toLocaleString()}`);

  let deleted = 0;
  const deleteBatch = 500;
  for (let i = 0; i < toDelete.length; i += deleteBatch) {
    const batch = toDelete.slice(i, i + deleteBatch);
    const { error } = await supabase
      .from('ppe_products')
      .delete()
      .in('id', batch);
    if (!error) deleted += batch.length;
    if ((i + deleteBatch) % 5000 === 0) console.log(`  Deleted ${deleted}/${toDelete.length}`);
  }
  console.log(`  ✅ Deleted ${deleted.toLocaleString()} non-PPE products`);

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
  await finalClean();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
