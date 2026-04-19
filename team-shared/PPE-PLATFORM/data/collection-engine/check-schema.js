#!/usr/bin/env node

/**
 * 检查新PPE项目的数据库表结构
 */

const { createClient } = require('@supabase/supabase-js');

const CONFIG = {
  supabaseUrl: 'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU',
};

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

async function checkSchema() {
  console.log('正在检查新PPE项目的数据库表结构...\n');

  try {
    // 检查 ppe_products 表结构
    console.log('=== ppe_products 表结构 ===');
    const { data: productColumns, error: productError } = await supabase
      .rpc('get_table_columns', { table_name: 'ppe_products' });
    
    if (productError) {
      console.log('无法获取列信息，尝试直接查询...');
      const { data: sampleProduct, error: sampleError } = await supabase
        .from('ppe_products')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('查询失败:', sampleError.message);
      } else {
        console.log('列名:', Object.keys(sampleProduct[0] || {}).join(', '));
      }
    } else {
      console.log(productColumns);
    }

    // 检查 ppe_manufacturers 表结构
    console.log('\n=== ppe_manufacturers 表结构 ===');
    const { data: mfgColumns, error: mfgError } = await supabase
      .rpc('get_table_columns', { table_name: 'ppe_manufacturers' });
    
    if (mfgError) {
      console.log('无法获取列信息，尝试直接查询...');
      const { data: sampleMfg, error: sampleError } = await supabase
        .from('ppe_manufacturers')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('查询失败:', sampleError.message);
      } else {
        console.log('列名:', Object.keys(sampleMfg[0] || {}).join(', '));
      }
    } else {
      console.log(mfgColumns);
    }

    // 检查 ppe_certifications 表结构
    console.log('\n=== ppe_certifications 表结构 ===');
    const { data: certColumns, error: certError } = await supabase
      .rpc('get_table_columns', { table_name: 'ppe_certifications' });
    
    if (certError) {
      console.log('无法获取列信息，尝试直接查询...');
      const { data: sampleCert, error: sampleError } = await supabase
        .from('ppe_certifications')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('查询失败:', sampleError.message);
      } else {
        console.log('列名:', Object.keys(sampleCert[0] || {}).join(', '));
      }
    } else {
      console.log(certColumns);
    }

  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

checkSchema();
