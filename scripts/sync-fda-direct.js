#!/usr/bin/env node

/**
 * FDA 增量同步脚本 (直接插入版)
 * 目标：下载最近 5 年的 10,000 条核心数据
 * 使用 INSERT 而非 UPSERT
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FDA_API_KEY = process.env.FDA_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase credentials are not set');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

if (!FDA_API_KEY) {
  console.error('Error: FDA_API_KEY environment variable is not set');
  console.error('Please set FDA_API_KEY in your .env file or obtain one from https://api.fda.gov/');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncFDA510k() {
  console.log('🚀 开始同步 FDA 510(k) 数据...');
  console.log('目标：下载最近 5 年的 10,000 条核心数据\n');

  const baseUrl = 'https://api.fda.gov/device/510k.json';
  const limit = 1000;
  const maxRecords = 10000;
  let allResults = [];
  let skip = 0;

  // 检查现有数据
  const { count: existingCount } = await supabase
    .from('fda_510k')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 现有 FDA 510(k) 数据: ${existingCount || 0} 条\n`);

  // 如果数据已足够，跳过
  if ((existingCount || 0) >= maxRecords * 0.8) {
    console.log('✅ FDA 数据已足够，跳过同步');
    return { imported: 0, total: existingCount };
  }

  // 下载数据
  while (allResults.length < maxRecords) {
    const url = `${baseUrl}?api_key=${FDA_API_KEY}&limit=${limit}&skip=${skip}`;
    
    console.log(`📥 正在获取记录 ${skip} - ${skip + limit}...`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FDA API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.log('✅ 所有数据已获取');
        break;
      }

      // 提取需要的字段 (适配实际表结构)
      // 实际字段: id, k_number, device_name, applicant, decision_code, decision_date, product_code, device_class, summary, source_type, scraped_at
      const records = data.results.map(item => ({
        k_number: item.k_number,
        device_name: item.device_name || item.openfda?.device_name?.[0] || 'Unknown',
        applicant: item.applicant || 'Unknown',
        decision_code: item.decision_code,
        decision_date: item.decision_date,
        product_code: item.product_code,
        device_class: item.openfda?.device_class?.[0] || null,
        summary: item.statement_summary || null,
        source_type: '510k',
        scraped_at: new Date().toISOString()
      }));

      allResults = [...allResults, ...records];
      skip += limit;

      console.log(`   ✅ 获取 ${records.length} 条，累计 ${allResults.length} 条\n`);

      if (allResults.length >= maxRecords) {
        break;
      }

      await sleep(1500);

    } catch (error) {
      console.error(`   ❌ 错误: ${error.message}`);
      await sleep(5000);
    }
  }

  console.log(`\n✅ 共获取 ${allResults.length} 条记录`);

  // 插入数据库
  console.log('\n💾 正在插入数据库...');
  
  const batchSize = 1000;
  let insertedCount = 0;

  for (let i = 0; i < allResults.length; i += batchSize) {
    const batch = allResults.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('fda_510k')
      .insert(batch);

    if (error) {
      console.error(`   ❌ 批次 ${i / batchSize + 1} 插入失败: ${error.message}`);
    } else {
      insertedCount += batch.length;
      console.log(`   ✅ 批次 ${i / batchSize + 1}: ${batch.length} 条已插入`);
    }
  }

  console.log(`\n✅ 成功插入 ${insertedCount} 条记录`);

  // 更新数据源统计
  const { count: newCount } = await supabase
    .from('fda_510k')
    .select('*', { count: 'exact', head: true });

  await supabase
    .from('data_sources')
    .update({
      record_count: newCount,
      last_sync_at: new Date().toISOString()
    })
    .eq('name', 'fda');

  console.log(`\n📊 FDA 510(k) 总记录数: ${newCount}`);

  return { imported: insertedCount, total: newCount };
}

async function syncFDAPMA() {
  console.log('\n🚀 开始同步 FDA PMA 数据...');
  console.log('目标：下载最近 5 年的 5,000 条核心数据\n');

  const baseUrl = 'https://api.fda.gov/device/pma.json';
  const limit = 1000;
  const maxRecords = 5000;
  let allResults = [];
  let skip = 0;

  // 检查现有数据
  const { count: existingCount } = await supabase
    .from('fda_pma')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 现有 FDA PMA 数据: ${existingCount || 0} 条\n`);

  // 如果数据已足够，跳过
  if ((existingCount || 0) >= maxRecords * 0.8) {
    console.log('✅ FDA PMA 数据已足够，跳过同步');
    return { imported: 0, total: existingCount };
  }

  // 下载数据
  while (allResults.length < maxRecords) {
    const url = `${baseUrl}?api_key=${FDA_API_KEY}&limit=${limit}&skip=${skip}`;
    
    console.log(`📥 正在获取记录 ${skip} - ${skip + limit}...`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FDA PMA API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.log('✅ 所有数据已获取');
        break;
      }

      // 提取需要的字段 (适配实际表结构)
      // 实际字段: id, pma_number, device_name, applicant, approval_order_date, product_code, device_class, summary, source_type, scraped_at
      const records = data.results.map(item => ({
        pma_number: item.pma_number,
        device_name: item.device_name || item.openfda?.device_name?.[0] || 'Unknown',
        applicant: item.applicant || 'Unknown',
        approval_order_date: item.approval_order_date,
        product_code: item.product_code,
        device_class: item.openfda?.device_class?.[0] || null,
        summary: null,
        source_type: 'pma',
        scraped_at: new Date().toISOString()
      }));

      allResults = [...allResults, ...records];
      skip += limit;

      console.log(`   ✅ 获取 ${records.length} 条，累计 ${allResults.length} 条\n`);

      if (allResults.length >= maxRecords) {
        break;
      }

      await sleep(1500);

    } catch (error) {
      console.error(`   ❌ 错误: ${error.message}`);
      await sleep(5000);
    }
  }

  console.log(`\n✅ 共获取 ${allResults.length} 条记录`);

  // 插入数据库
  console.log('\n💾 正在插入数据库...');
  
  const batchSize = 1000;
  let insertedCount = 0;

  for (let i = 0; i < allResults.length; i += batchSize) {
    const batch = allResults.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('fda_pma')
      .insert(batch);

    if (error) {
      console.error(`   ❌ 批次 ${i / batchSize + 1} 插入失败: ${error.message}`);
    } else {
      insertedCount += batch.length;
      console.log(`   ✅ 批次 ${i / batchSize + 1}: ${batch.length} 条已插入`);
    }
  }

  console.log(`\n✅ 成功插入 ${insertedCount} 条记录`);

  // 更新数据源统计
  const { count: newCount } = await supabase
    .from('fda_pma')
    .select('*', { count: 'exact', head: true });

  await supabase
    .from('data_sources')
    .update({
      record_count: newCount,
      last_sync_at: new Date().toISOString()
    })
    .eq('name', 'fda_pma');

  console.log(`\n📊 FDA PMA 总记录数: ${newCount}`);

  return { imported: insertedCount, total: newCount };
}

async function main() {
  console.log('========================================');
  console.log('FDA 数据增量同步 (直接插入版)');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  const result510k = await syncFDA510k();
  const resultPMA = await syncFDAPMA();

  console.log('\n========================================');
  console.log('同步完成');
  console.log('========================================');
  console.log(`FDA 510(k): ${result510k.imported} 条已插入 (总计: ${result510k.total})`);
  console.log(`FDA PMA: ${resultPMA.imported} 条已插入 (总计: ${resultPMA.total})`);
  console.log('========================================');
}

main().catch(console.error);
