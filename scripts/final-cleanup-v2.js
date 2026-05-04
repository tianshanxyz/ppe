#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  console.log('最终清理 - 删除非PPE + 重新分类...');

  // Delete clearly non-PPE products
  const nonPPEDeletes = [
    'blood collection', 'infusion set', 'hypodermic', 'safety syringe',
    'safety lancet', 'heelstick', 'needle safety', 'safety scalpel',
    'safety pin', 'iv catheter', 'slit knife', 'safety cradle',
    'wheelchair safety', 'safety insert', 'obstetrical safety',
    'limb protector', 'heel protector', 'elbow protector', 'skin pressure',
    'tendon protector', 'ecm envelope', 'gas detection', 'guardrail',
    'safety blood', 'safety winged', 'safety huber', 'safety vaculet',
    'monoject insulin', 'argyle uvc', 'cormatrix',
  ];

  let totalDeleted = 0;
  for (const term of nonPPEDeletes) {
    const { data, error } = await supabase.from('ppe_products')
      .delete()
      .ilike('name', `%${term}%`)
      .eq('category', '其他');
    if (data && data.length > 0) {
      totalDeleted += data.length;
      console.log(`  删除 "${term}": ${data.length} 条`);
    }
  }
  console.log(`总计删除: ${totalDeleted} 条`);

  // Reclassify remaining "其他" items
  const { data: remaining } = await supabase.from('ppe_products')
    .select('id,name,category')
    .eq('category', '其他')
    .limit(100);

  console.log(`\n剩余"其他": ${remaining?.length || 0} 条`);

  let reclassified = 0;
  for (const p of remaining || []) {
    const name = (p.name || '').toLowerCase();
    let newCategory = null;

    if (/face protection|facial.*protect|protetor facial/i.test(name)) newCategory = '眼面部防护装备';
    else if (/toga|personal protection|protective.*toga/i.test(name)) newCategory = '身体防护装备';
    else if (/safety poncho/i.test(name)) newCategory = '身体防护装备';
    else if (/protective.*division|protective.*products/i.test(name)) newCategory = '身体防护装备';
    else if (/patient protective/i.test(name)) newCategory = '身体防护装备';

    if (newCategory) {
      const { error } = await supabase.from('ppe_products').update({ category: newCategory }).eq('id', p.id);
      if (!error) {
        reclassified++;
        console.log(`  重新分类: ${p.name?.substring(0, 50)} -> ${newCategory}`);
      }
    }
  }
  console.log(`重新分类: ${reclassified} 条`);

  // Final stats
  const { count: pc } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mc } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rc } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  // Count remaining "其他"
  const { count: otherCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`\n========================================`);
  console.log(`最终数据库状态`);
  console.log(`========================================`);
  console.log(`  产品: ${pc}`);
  console.log(`  制造商: ${mc}`);
  console.log(`  法规: ${rc}`);
  console.log(`  "其他"类别: ${otherCount} (${(otherCount / pc * 100).toFixed(1)}%)`);
}

main().catch(console.error);
