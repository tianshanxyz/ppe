#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const FDA_BASE = 'https://api.fda.gov';

async function main() {
  console.log('============================================================');
  console.log('  FDA 510k制造商名称补充');
  console.log('  为缺失manufacturer_name的产品从FDA API获取制造商信息');
  console.log('============================================================\n');

  const BATCH_SIZE = 500;
  let offset = 0;
  let totalFixed = 0;
  let totalProcessed = 0;

  while (true) {
    const { data: products, error } = await supabase
      .from('ppe_products')
      .select('id, name, model, product_code, description, data_source')
      .is('manufacturer_name', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !products || products.length === 0) {
      console.log(`  没有更多数据需要处理`);
      break;
    }

    for (const p of products) {
      totalProcessed++;

      let mfrName = null;
      const searchTerms = [];

      if (p.product_code) searchTerms.push(p.product_code);
      if (p.name && p.name.length > 3) searchTerms.push(p.name.substring(0, 50));

      for (const term of searchTerms.slice(0, 2)) {
        try {
          const url = `${FDA_BASE}/device/510k.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(term)}&limit=3`;
          const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

          if (!response.ok) continue;

          const data = await response.json();
          if (data.results && data.results.length > 0) {
            for (const r of data.results) {
              if (r.applicant) {
                mfrName = r.applicant.substring(0, 200);
                break;
              }
              if (r.contact) {
                mfrName = r.contact.substring(0, 200);
                break;
              }
            }
          }
          if (mfrName) break;
        } catch (e) {
          continue;
        }
      }

      if (mfrName) {
        const { error: updateError } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName })
          .eq('id', p.id);
        if (!updateError) totalFixed++;
      }

      if (totalProcessed % 100 === 0) {
        console.log(`  已处理: ${totalProcessed}, 修复: ${totalFixed}`);
      }

      await new Promise(r => setTimeout(r, 150));
    }

    if (products.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
    console.log(`  批次完成 - 已处理: ${totalProcessed}, 修复: ${totalFixed}`);
  }

  console.log(`\n  ✅ 总处理: ${totalProcessed.toLocaleString()}, 总修复: ${totalFixed.toLocaleString()}`);

  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  console.log(`  manufacturer_name缺失率: ${totalProducts ? ((nullMfr || 0) / totalProducts * 100).toFixed(1) : 0}%`);
}

main().catch(console.error);
