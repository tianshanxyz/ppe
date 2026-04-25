#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const categoryRules = [
  {
    category: '呼吸防护装备',
    keywords: ['mask', 'respirator', 'n95', 'n99', 'n100', 'ffp1', 'ffp2', 'ffp3', 'kn95', 'kp95', 'filtering facepiece', 'surgical mask', 'procedure mask', 'isolation mask', 'medical mask', 'disposable mask', 'face mask', 'air purifying', 'breathing', '口罩', '呼吸', 'filtering face', 'half mask', 'full face', 'powered air', 'papr', 'elastomeric', 'gas mask', 'dust mask', 'particulate respirator'],
    riskLevel: 'high',
  },
  {
    category: '手部防护装备',
    keywords: ['glove', 'gloves', 'nitrile', 'latex', 'vinyl glove', 'examination glove', 'surgical glove', 'chemotherapy glove', 'medical glove', 'cleanroom glove', 'sterile glove', 'non-sterile glove', 'patient exam', 'surgeon glove', 'procedure glove', 'hand protection', 'protective glove', 'finger cot', '手套'],
    riskLevel: 'low',
  },
  {
    category: '身体防护装备',
    keywords: ['gown', 'coverall', 'protective clothing', 'isolation gown', 'surgical gown', 'lab coat', 'apron', 'jumpsuit', 'cover suit', 'protective suit', 'hazmat suit', 'chemical suit', 'tyvek', 'impervious', 'fluid resistant', 'barrier gown', 'patient gown', '防护服', '隔离衣', '手术衣', 'cover up', 'smock', 'scrub suit'],
    riskLevel: 'medium',
  },
  {
    category: '眼面部防护装备',
    keywords: ['goggle', 'shield', 'face shield', 'eye protection', 'safety glasses', 'protective eyewear', 'splash guard', 'visors', '护目镜', '面罩', 'face protection', 'laser shield', 'welding helmet', 'spectacles'],
    riskLevel: 'low',
  },
  {
    category: '头部防护装备',
    keywords: ['cap', 'hood', 'hat', 'head cover', 'bouffant', 'skull cap', 'surgical cap', 'hair cover', 'helmet', 'hard hat', 'balaclava', '头罩', '帽子', 'head protection', 'hair net'],
    riskLevel: 'low',
  },
  {
    category: '足部防护装备',
    keywords: ['shoe cover', 'boot cover', 'overshoe', 'foot cover', 'boot', 'safety shoe', 'toe protection', '鞋套', '靴套', 'foot protection', 'anti-slip', 'shoe protector'],
    riskLevel: 'low',
  },
];

async function reclassifyProducts() {
  console.log('\n=== Reclassify "其他" Category Products ===\n');

  const batchSize = 2000;
  let offset = 0;
  let totalReclassified = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`Total "其他" products: ${count.toLocaleString()}\n`);

  while (offset < count + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description, subcategory, model, category')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    const updates = [];

    for (const product of data) {
      const text = [
        product.name || '',
        product.description || '',
        product.subcategory || '',
        product.model || '',
      ].join(' ').toLowerCase();

      let matched = false;
      for (const rule of categoryRules) {
        if (rule.keywords.some(kw => text.includes(kw.toLowerCase()))) {
          updates.push({
            id: product.id,
            category: rule.category,
            risk_level: rule.riskLevel,
          });
          matched = true;
          break;
        }
      }
    }

    if (updates.length > 0) {
      for (const u of updates) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ category: u.category, risk_level: u.risk_level })
          .eq('id', u.id);
        if (!error) totalReclassified++;
      }
    }

    console.log(`  Offset ${offset}: reclassified ${updates.length} in this batch (total: ${totalReclassified})`);
    offset += batchSize;
  }

  console.log(`\n  ✅ Total reclassified: ${totalReclassified}`);

  const { count: newOther } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`  Remaining "其他": ${newOther.toLocaleString()} (${(newOther / 86681 * 100).toFixed(1)}%)`);
}

async function main() {
  await reclassifyProducts();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
