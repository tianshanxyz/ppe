#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const BACKUP_PATH = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/database_backup/ppe_products.json';

async function main() {
  console.log('========================================');
  console.log('  从备份恢复被误删的PPE产品数据');
  console.log('========================================');

  // Load backup data
  console.log('\n[1/3] 读取备份文件...');
  const raw = fs.readFileSync(BACKUP_PATH, 'utf-8');
  const backupData = JSON.parse(raw);
  console.log(`  备份包含: ${backupData.length.toLocaleString()} 条记录`);

  // Load existing keys from database
  console.log('\n[2/3] 加载现有数据库记录用于去重...');
  const existingKeys = new Set();
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`  现有记录: ${existingKeys.size.toLocaleString()} 条`);

  // Filter and prepare records to insert
  console.log('\n[3/3] 筛选缺失记录并批量插入...');
  const toInsert = [];
  let skipped = 0;

  for (const record of backupData) {
    const key = `${(record.name || '').substring(0, 200).toLowerCase().trim()}|${(record.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(record.data_source || '').toLowerCase().trim()}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    existingKeys.add(key);

    // Remove id/created_at to let DB generate new ones
    const { id, created_at, updated_at, ...cleanRecord } = record;
    toInsert.push(cleanRecord);
  }

  console.log(`  跳过(已存在): ${skipped.toLocaleString()}`);
  console.log(`  待插入: ${toInsert.length.toLocaleString()} 条`);

  // Batch insert
  let inserted = 0;
  const batchSize = 100;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (error) {
      // Fall back to single insert
      for (const item of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(item);
        if (!e2) inserted++;
      }
    } else {
      inserted += batch.length;
    }
    if ((i / batchSize) % 10 === 0) {
      console.log(`  进度: ${inserted.toLocaleString()} / ${toInsert.length.toLocaleString()}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`  恢复完成!`);
  console.log(`  成功插入: ${inserted.toLocaleString()} 条`);
  console.log(`========================================`);
}

main().catch(console.error);