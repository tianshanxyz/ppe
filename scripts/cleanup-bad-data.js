#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function cleanup() {
  console.log('清理错误数据...');

  const specialties = [
    'Anesthesiology', 'Cardiovascular', 'Clinical Chemistry', 'Clinical Toxicology',
    'Dental', 'Ear, Nose, Throat', 'Gastroenterology, Urology', 'General Hospital',
    'General, Plastic Surgery', 'Hematology', 'Immunology', 'Microbiology',
    'Neurology', 'Obstetrics/Gynecology', 'Ophthalmic', 'Orthopedic',
    'Pathology', 'Physical Medicine', 'Radiology', 'Clinical Toxicology',
    'Unknown',
  ];

  let totalDeleted = 0;

  for (const spec of specialties) {
    const { data, error } = await supabase.from('ppe_products')
      .delete()
      .eq('name', spec);
    if (data) {
      totalDeleted += data.length;
      if (data.length > 0) console.log(`  删除 "${spec}": ${data.length} 条`);
    }
  }

  // Also delete any products with data_source containing "Pure Global AI" that have null country
  const { data: nullCountry } = await supabase.from('ppe_products')
    .delete()
    .like('data_source', 'Pure Global AI%')
    .is('country_of_origin', null);
  if (nullCountry) {
    totalDeleted += nullCountry.length;
    console.log(`  删除null国家Pure Global AI数据: ${nullCountry.length} 条`);
  }

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`\n清理完成: 删除 ${totalDeleted} 条, 剩余 ${count} 条`);
}

cleanup().catch(console.error);
