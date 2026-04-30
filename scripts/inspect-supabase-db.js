#!/usr/bin/env node
/**
 * 连接Supabase数据库，核查数据表和视图情况
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

async function inspectDatabase() {
  console.log('='.repeat(70));
  console.log('  Supabase 数据库核查');
  console.log('='.repeat(70));
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 测试连接
  console.log('\n[1] 测试数据库连接...');
  const { error: connError } = await supabase.from('companies').select('count').limit(1);
  
  if (connError) {
    console.log(`  ✗ 连接失败: ${connError.message}`);
    console.log(`  错误代码: ${connError.code}`);
    if (connError.code === 'PGRST301') {
      console.log('  → 表不存在，需要创建');
    }
    return { tables: [] };
  }
  console.log('  ✓ 连接成功');

  // 查询所有表
  console.log('\n[2] 查询所有表和视图...');
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
  
  if (tablesError) {
    console.log(`  RPC不可用，尝试查询pg_tables...`);
    const { data: pgTables, error: pgError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public');
    
    if (pgError) {
      console.log(`  查询pg_tables失败: ${pgError.message}`);
      // 直接查询已知表
      const knownTables = ['companies', 'all_products', 'ppe_products', 'ppe_products_enhanced', 'ppe_manufacturers', 'ppe_manufacturers_enhanced', 'ppe_regulations'];
      const existingTables = [];
      
      for (const table of knownTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error || error.code !== 'PGRST301') {
          const { data: count } = await supabase.from(table).select('*', { count: 'exact', head: true });
          existingTables.push({ name: table, count: count?.length || 0 });
        }
      }
      
      console.log('\n  已知表检查结果:');
      for (const t of existingTables) {
        console.log(`    ✓ ${t.name}: ${t.count} 条记录`);
      }
      
      for (const table of knownTables) {
        if (!existingTables.find(t => t.name === table)) {
          console.log(`    ✗ ${table}: 不存在`);
        }
      }
      
      return { tables: existingTables };
    }
    return { tables: pgTables };
  }
  
  console.log('  找到表:', JSON.stringify(tables, null, 2));
  return { tables };
}

inspectDatabase().catch(console.error);
