#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const BACKUP_DIR = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/database_backup';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toCSV(data, headers) {
  if (data.length === 0) return '';
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

async function backupProducts() {
  console.log('备份 ppe_products 表...');
  const allData = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error('Error fetching products:', error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allData.push(...data);
    console.log(`  已获取 ${allData.length} 条...`);
    
    if (data.length < pageSize) break;
    page++;
  }
  
  // JSON备份
  const jsonPath = path.join(BACKUP_DIR, 'ppe_products.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2));
  console.log(`  JSON备份: ${jsonPath} (${allData.length} 条)`);
  
  // CSV备份
  if (allData.length > 0) {
    const headers = Object.keys(allData[0]);
    const csv = toCSV(allData, headers);
    const csvPath = path.join(BACKUP_DIR, 'ppe_products.csv');
    fs.writeFileSync(csvPath, csv);
    console.log(`  CSV备份: ${csvPath}`);
  }
  
  return allData.length;
}

async function backupManufacturers() {
  console.log('备份 ppe_manufacturers 表...');
  const allData = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error('Error fetching manufacturers:', error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allData.push(...data);
    console.log(`  已获取 ${allData.length} 条...`);
    
    if (data.length < pageSize) break;
    page++;
  }
  
  // JSON备份
  const jsonPath = path.join(BACKUP_DIR, 'ppe_manufacturers.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2));
  console.log(`  JSON备份: ${jsonPath} (${allData.length} 条)`);
  
  // CSV备份
  if (allData.length > 0) {
    const headers = Object.keys(allData[0]);
    const csv = toCSV(allData, headers);
    const csvPath = path.join(BACKUP_DIR, 'ppe_manufacturers.csv');
    fs.writeFileSync(csvPath, csv);
    console.log(`  CSV备份: ${csvPath}`);
  }
  
  return allData.length;
}

async function backupRegulations() {
  console.log('备份 ppe_regulations 表...');
  const allData = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('ppe_regulations')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error('Error fetching regulations:', error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allData.push(...data);
    console.log(`  已获取 ${allData.length} 条...`);
    
    if (data.length < pageSize) break;
    page++;
  }
  
  // JSON备份
  const jsonPath = path.join(BACKUP_DIR, 'ppe_regulations.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2));
  console.log(`  JSON备份: ${jsonPath} (${allData.length} 条)`);
  
  // CSV备份
  if (allData.length > 0) {
    const headers = Object.keys(allData[0]);
    const csv = toCSV(allData, headers);
    const csvPath = path.join(BACKUP_DIR, 'ppe_regulations.csv');
    fs.writeFileSync(csvPath, csv);
    console.log(`  CSV备份: ${csvPath}`);
  }
  
  return allData.length;
}

async function createSummary(productCount, mfrCount, regCount) {
  const summary = {
    backup_date: new Date().toISOString(),
    tables: {
      ppe_products: { count: productCount, files: ['ppe_products.json', 'ppe_products.csv'] },
      ppe_manufacturers: { count: mfrCount, files: ['ppe_manufacturers.json', 'ppe_manufacturers.csv'] },
      ppe_regulations: { count: regCount, files: ['ppe_regulations.json', 'ppe_regulations.csv'] }
    },
    total_records: productCount + mfrCount + regCount
  };
  
  const summaryPath = path.join(BACKUP_DIR, 'backup_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n备份摘要: ${summaryPath}`);
  return summary;
}

async function main() {
  console.log('========================================');
  console.log('MDLooker PPE 数据库备份');
  console.log('========================================\n');
  
  ensureDir(BACKUP_DIR);
  console.log(`备份目录: ${BACKUP_DIR}\n`);
  
  const productCount = await backupProducts();
  console.log('');
  
  const mfrCount = await backupManufacturers();
  console.log('');
  
  const regCount = await backupRegulations();
  console.log('');
  
  const summary = await createSummary(productCount, mfrCount, regCount);
  
  console.log('\n========================================');
  console.log('备份完成!');
  console.log('========================================');
  console.log(`产品: ${productCount.toLocaleString()} 条`);
  console.log(`制造商: ${mfrCount.toLocaleString()} 条`);
  console.log(`法规: ${regCount.toLocaleString()} 条`);
  console.log(`总计: ${summary.total_records.toLocaleString()} 条`);
  console.log(`\n备份位置: ${BACKUP_DIR}`);
}

main().catch(e => {
  console.error('备份失败:', e);
  process.exit(1);
});
