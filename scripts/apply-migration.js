#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 执行SQL迁移文件到Supabase数据库
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少环境变量');
  console.error('请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationFile = path.join(__dirname, '../supabase/migrations/20250424000002_add_product_columns.sql');
  
  console.log('读取迁移文件...');
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  console.log('执行迁移...');
  
  // 分割SQL语句并逐一执行
  const statements = sql.split(';').filter(s => s.trim());
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // 如果exec_sql不存在，尝试直接执行
        const { error: directError } = await supabase.from('_temp_query').select('*').limit(0);
        
        if (directError && directError.message.includes('does not exist')) {
          console.log(`执行语句 ${i + 1}/${statements.length}...`);
          // 使用REST API直接执行
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ query: statement + ';' })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`警告: 语句 ${i + 1} 执行失败: ${errorText}`);
          }
        } else {
          console.warn(`警告: 语句 ${i + 1} 执行失败: ${error.message}`);
        }
      } else {
        console.log(`✓ 语句 ${i + 1}/${statements.length} 执行成功`);
      }
    } catch (err) {
      console.warn(`警告: 语句 ${i + 1} 执行失败: ${err.message}`);
    }
  }
  
  console.log('\n迁移完成！');
  console.log('请检查Supabase Dashboard确认列已添加。');
}

// 或者使用更简单的方法：直接输出SQL让用户在Supabase Dashboard中执行
function printMigrationInstructions() {
  const migrationFile = path.join(__dirname, '../supabase/migrations/20250424000002_add_product_columns.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  console.log('='.repeat(80));
  console.log('数据库迁移说明');
  console.log('='.repeat(80));
  console.log('\n请在Supabase Dashboard中执行以下SQL：');
  console.log('\n1. 打开 https://app.supabase.com');
  console.log('2. 选择你的项目');
  console.log('3. 进入 SQL Editor');
  console.log('4. 复制并执行以下SQL：\n');
  console.log('-'.repeat(80));
  console.log(sql);
  console.log('-'.repeat(80));
}

// 主函数
async function main() {
  console.log('Supabase 数据库迁移工具\n');
  
  // 检查是否可以通过API执行
  try {
    const { data, error } = await supabase.from('ppe_products').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('表不存在，请先运行初始迁移。');
      process.exit(1);
    }
    
    console.log('数据库连接成功！\n');
    printMigrationInstructions();
    
  } catch (err) {
    console.error('连接数据库失败:', err.message);
    printMigrationInstructions();
  }
}

main().catch(console.error);
