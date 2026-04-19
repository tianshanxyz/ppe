#!/usr/bin/env node

/**
 * 数据映射和转换脚本
 * 将 API 数据转换为 Supabase 兼容格式
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FDA_API_KEY = process.env.FDA_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('Error: Supabase credentials are not set', 'red');
  log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file', 'red');
  process.exit(1);
}

if (!FDA_API_KEY) {
  log('Error: FDA_API_KEY environment variable is not set', 'red');
  log('Please set FDA_API_KEY in your .env file or obtain one from https://api.fda.gov/', 'red');
  process.exit(1);
}

const syncStats = {
  inserted: 0,
  updated: 0,
  errors: 0,
};

/**
 * 转换 FDA 510k 数据格式
 */
function transformFDA510k(data) {
  return {
    k_number: data.k_number,
    device_name: data.device_name,
    applicant: data.applicant,
    decision_date: data.decision_date,
    decision_code: data.decision_code,
    product_code: data.product_code,
    regulation_number: data.regulation_number,
    submission_type: data.submission_type,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * 转换 FDA PMA 数据格式
 */
function transformFDAPMA(data) {
  return {
    pma_number: data.pma_number,
    device_name: data.trade_name,
    applicant: data.applicant,
    approval_date: data.approval_date,
    decision_code: data.decision_code,
    product_code: data.product_code,
    regulation_number: data.regulation_number,
    submission_type: data.submission_type,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * 同步并转换 FDA 数据
 */
async function syncAndTransformFDA() {
  log('\n========================================', 'blue');
  log('   同步并转换 FDA 数据', 'blue');
  log('========================================\n', 'blue');

  // 同步 510k
  log('📥 同步 FDA 510k...', 'yellow');
  const url510k = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&limit=100`;
  
  try {
    const data510k = await fetchJson(url510k);
    
    if (data510k && data510k.results) {
      const transformed = data510k.results.map(transformFDA510k);
      
      // 只插入必要的字段
      const { error } = await supabase
        .from('fda_510k')
        .upsert(transformed, { onConflict: 'k_number' });
      
      if (error) {
        log(`  ❌ 插入失败：${error.message}`, 'red');
        syncStats.errors++;
      } else {
        log(`  ✅ 成功插入 ${transformed.length} 条`, 'green');
        syncStats.inserted += transformed.length;
      }
    }
  } catch (error) {
    log(`  ❌ 同步失败：${error.message}`, 'red');
    syncStats.errors++;
  }

  // 同步 PMA
  log('\n📥 同步 FDA PMA...', 'yellow');
  const urlPma = `https://api.fda.gov/device/pma.json?api_key=${FDA_API_KEY}&limit=100`;
  
  try {
    const dataPma = await fetchJson(urlPma);
    
    if (dataPma && dataPma.results) {
      const transformed = dataPma.results.map(transformFDAPMA);
      
      const { error } = await supabase
        .from('fda_pma')
        .upsert(transformed, { onConflict: 'pma_number' });
      
      if (error) {
        log(`  ❌ 插入失败：${error.message}`, 'red');
        syncStats.errors++;
      } else {
        log(`  ✅ 成功插入 ${transformed.length} 条`, 'green');
        syncStats.inserted += transformed.length;
      }
    }
  } catch (error) {
    log(`  ❌ 同步失败：${error.message}`, 'red');
    syncStats.errors++;
  }
}

/**
 * 辅助函数
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
  log('\n🚀 开始数据同步 (带转换)...', 'blue');
  log('⏰ 时间：' + new Date().toLocaleString(), 'blue');

  try {
    await syncAndTransformFDA();
    
    log('\n========================================', 'blue');
    log('   同步报告', 'blue');
    log('========================================\n', 'blue');
    
    log(`✅ 插入：${syncStats.inserted} 条`, 'green');
    log(`🔄 更新：${syncStats.updated} 条`, 'blue');
    log(`❌ 错误：${syncStats.errors} 个`, syncStats.errors > 0 ? 'red' : 'green');
    log('');
  } catch (error) {
    log(`\n❌ 失败：${error.message}`, 'red');
    process.exit(1);
  }
}

main();
