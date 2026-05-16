#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const categoryEnMap = {
  '呼吸防护装备': 'Respiratory Protection',
  '手部防护装备': 'Hand Protection',
  '眼面部防护装备': 'Eye & Face Protection',
  '头部防护装备': 'Head Protection',
  '足部防护装备': 'Foot Protection',
  '听觉防护装备': 'Hearing Protection',
  '坠落防护装备': 'Fall Protection',
  '身体防护装备': 'Body Protection',
  '躯干防护装备': 'Torso Protection',
  '其他': 'Other',
};

async function main() {
  console.log('补全剩余英文分类');
  let totalUpdated = 0;

  for (const [cnCat, enCat] of Object.entries(categoryEnMap)) {
    const { count: totalCount } = await supabase.from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', cnCat);

    const { count: withSubcat } = await supabase.from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', cnCat)
      .not('subcategory', 'is', null);

    const remaining = totalCount - withSubcat;
    if (remaining <= 0) {
      console.log(`  ${cnCat} → ${enCat}: 已完成`);
      continue;
    }

    let page = 0;
    let updated = 0;
    while (true) {
      const { data: products } = await supabase.from('ppe_products')
        .select('id')
        .eq('category', cnCat)
        .is('subcategory', null)
        .range(0, 499);

      if (!products || products.length === 0) break;

      const ids = products.map(p => p.id);
      const { error } = await supabase.from('ppe_products')
        .update({ subcategory: enCat })
        .in('id', ids);
      if (!error) updated += ids.length;
      await sleep(100);

      if (products.length < 500) break;
      page++;
    }
    totalUpdated += updated;
    console.log(`  ${cnCat} → ${enCat}: +${updated} (剩余已补全)`);
  }

  console.log(`\n总计补全: ${totalUpdated} 条`);

  const { count: totalWithSubcat } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .not('subcategory', 'is', null);
  const { count: totalProducts } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`\n英文分类覆盖: ${totalWithSubcat}/${totalProducts} (${((totalWithSubcat/totalProducts)*100).toFixed(1)}%)`);
}

main().catch(console.error);
