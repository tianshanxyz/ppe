#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

async function main() {
  console.log('============================================================');
  console.log('  批量manufacturer_name补充 (FDA Registration API)');
  console.log('============================================================\n');

  let totalFixed = 0;
  let totalProcessed = 0;

  const BATCH = 1000;
  let offset = 0;

  while (true) {
    const { data: products, error } = await supabase
      .from('ppe_products')
      .select('id, name, model, product_code, description, data_source')
      .is('manufacturer_name', null)
      .range(offset, offset + BATCH - 1);

    if (error || !products || products.length === 0) break;

    for (const p of products) {
      totalProcessed++;
      let mfrName = null;

      if (p.data_source && p.data_source.includes('FDA') && p.product_code) {
        try {
          const url = `https://api.fda.gov/device/registration.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(p.product_code)}&limit=1`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            const data = await resp.json();
            if (data.results && data.results[0]) {
              const r = data.results[0];
              mfrName = r.firm_name || r.owner_operator_name || null;
            }
          }
        } catch (e) {}
      }

      if (!mfrName && p.product_code) {
        try {
          const url = `https://api.fda.gov/device/classification.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(p.product_code)}&limit=1`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            const data = await resp.json();
            if (data.results && data.results[0]) {
              const r = data.results[0];
              mfrName = r.review_panel || r.medical_specialty || null;
            }
          }
        } catch (e) {}
      }

      if (!mfrName && p.name && p.name.length > 3) {
        try {
          const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=device_name:${encodeURIComponent(`"${p.name.substring(0, 40)}"`)}&limit=1`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            const data = await resp.json();
            if (data.results && data.results[0]) {
              mfrName = data.results[0].applicant || data.results[0].contact || null;
            }
          }
        } catch (e) {}
      }

      if (!mfrName && p.description) {
        const desc = p.description;
        const patterns = [
          /Manufacturer:\s*(.+?)(?:\n|$)/i,
          /Applicant:\s*(.+?)(?:\n|$)/i,
          /Company:\s*(.+?)(?:\n|$)/i,
          /Firm:\s*(.+?)(?:\n|$)/i,
          /Owner\/Operator:\s*(.+?)(?:\n|$)/i,
        ];
        for (const pat of patterns) {
          const m = desc.match(pat);
          if (m && m[1] && m[1].trim().length > 2 && m[1].trim().length < 200) {
            mfrName = m[1].trim();
            break;
          }
        }
      }

      if (mfrName) {
        mfrName = mfrName.substring(0, 200);
        const { error: updateError } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName })
          .eq('id', p.id);
        if (!updateError) totalFixed++;
      }

      if (totalProcessed % 200 === 0) {
        console.log(`  已处理: ${totalProcessed}, 修复: ${totalFixed}`);
      }

      await new Promise(r => setTimeout(r, 120));
    }

    if (products.length < BATCH) break;
    offset += BATCH;
    console.log(`  批次完成 - 已处理: ${totalProcessed}, 修复: ${totalFixed}`);
  }

  console.log(`\n  ✅ 总处理: ${totalProcessed.toLocaleString()}, 总修复: ${totalFixed.toLocaleString()}`);

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  console.log(`  manufacturer_name缺失率: ${total ? ((nullMfr || 0) / total * 100).toFixed(1) : 0}%`);
}

main().catch(console.error);
