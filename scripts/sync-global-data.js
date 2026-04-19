#!/usr/bin/env node

/**
 * 全球数据同步脚本
 * 从各监管机构 API 同步数据到 Supabase
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

// 数据同步统计
const syncStats = {
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  bySource: {},
};

/**
 * 从 FDA API 同步数据
 */
async function syncFDAData() {
  log('\n========================================', 'blue');
  log('   同步 FDA 数据', 'blue');
  log('========================================\n', 'blue');

  const endpoints = [
    {
      name: '510k Clearances',
      path: '/device/510k.json',
      table: 'fda_510k',
      limit: 1000,
    },
    {
      name: 'PMA Approvals',
      path: '/device/pma.json',
      table: 'fda_pma',
      limit: 1000,
    },
    {
      name: 'Recalls',
      path: '/device/recall.json',
      table: 'fda_recalls',
      limit: 1000,
    },
  ];

  for (const endpoint of endpoints) {
    log(`📥 同步 ${endpoint.name}...`, 'yellow');
    
    try {
      const url = `https://api.fda.gov${endpoint.path}?api_key=${FDA_API_KEY}&limit=${endpoint.limit}`;
      
      const data = await fetchJson(url);
      
      if (data && data.results) {
        const records = data.results;
        log(`  📊 获取 ${records.length} 条记录`, 'blue');
        
        // 批量插入到 Supabase
        const { error } = await supabase
          .from(endpoint.table)
          .upsert(records, { onConflict: 'k_number,pma_number,recall_number' });
        
        if (error) {
          log(`  ❌ 插入失败：${error.message}`, 'red');
          syncStats.totalErrors++;
        } else {
          log(`  ✅ 成功插入 ${records.length} 条`, 'green');
          syncStats.totalInserted += records.length;
          
          if (!syncStats.bySource['FDA']) {
            syncStats.bySource['FDA'] = 0;
          }
          syncStats.bySource['FDA'] += records.length;
        }
      }
    } catch (error) {
      log(`  ❌ 同步失败：${error.message}`, 'red');
      syncStats.totalErrors++;
    }
    
    // 避免频率限制
    await sleep(500);
  }
}

/**
 * 同步 EUDAMED 数据 (示例)
 */
async function syncEUDAMEDData() {
  log('\n========================================', 'blue');
  log('   同步 EUDAMED 数据', 'blue');
  log('========================================\n', 'blue');

  log('⚠️  EUDAMED API 需要认证，暂不自动同步', 'yellow');
  log('💡 建议：手动从 ec.europa.eu/tools/eudamed 下载数据', 'blue');
}

/**
 * 同步 Health Canada 数据
 */
async function syncHealthCanadaData() {
  log('\n========================================', 'blue');
  log('   同步 Health Canada 数据', 'blue');
  log('========================================\n', 'blue');

  log('⚠️  Health Canada API 需要特殊处理', 'yellow');
  log('💡 建议：从 health-products.canada.ca 获取数据', 'blue');
}

/**
 * 辅助函数：获取 JSON 数据
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`解析失败：${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 辅助函数：延迟
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成同步报告
 */
function generateReport() {
  log('\n========================================', 'blue');
  log('   同步报告', 'blue');
  log('========================================\n', 'blue');

  log('📊 同步统计:', 'cyan');
  log(`  总插入记录：${syncStats.totalInserted}`, 'blue');
  log(`  总更新记录：${syncStats.totalUpdated}`, 'blue');
  log(`  总错误数：${syncStats.totalErrors}`, 'blue');

  log('\n📈 按来源统计:', 'cyan');
  for (const [source, count] of Object.entries(syncStats.bySource)) {
    log(`  ${source}: ${count} 条`, 'blue');
  }

  log('');
}

/**
 * 主函数
 */
async function main() {
  log('\n🚀 开始全球数据同步...', 'blue');
  log('⏰ 同步时间：' + new Date().toLocaleString(), 'blue');
  log('');

  try {
    // 同步各市场数据
    await syncFDAData();
    await syncEUDAMEDData();
    await syncHealthCanadaData();
    
    // 生成报告
    generateReport();
    
    log('✅ 数据同步完成！', 'green');
    log('');
  } catch (error) {
    log(`\n❌ 同步失败：${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
main();
