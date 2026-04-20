#!/usr/bin/env node

/**
 * MDLooker 全球PPE数据同步主脚本
 * 
 * 功能：统一调度各数据源的增量同步
 * 使用方法：
 *   node scripts/sync-all-data.js              # 执行所有数据源
 *   node scripts/sync-all-data.js --fda        # 仅同步FDA数据
 *   node scripts/sync-all-data.js --eudamed     # 仅同步EUDAMED数据
 *   node scripts/sync-all-data.js --nmpa        # 仅同步NMPA数据
 *   node scripts/sync-all-data.js --status     # 查看同步状态
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'blue');
  log('='.repeat(60) + '\n', 'blue');
}

function logSection(title) {
  log(`\n--- ${title} ---\n`, 'cyan');
}

const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  fdaApiKey: process.env.FDA_API_KEY,
};

if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
  log('\n❌ 错误: Supabase 配置未设置\n', 'red');
  log('请在 .env.local 文件中配置以下环境变量:', 'yellow');
  log('  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url', 'cyan');
  log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key', 'cyan');
  log('\n或者复制 .env.example 为 .env.local 并填入实际值\n', 'yellow');
  process.exit(1);
}

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

const SYNC_STATS = {
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  startTime: new Date(),
  sources: {},
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

const PPE_KEYWORDS = [
  'glove', 'gloves', 'hand protection',
  'mask', 'masks', 'respirator', 'respirators',
  'ffp2', 'ffp3', 'n95', 'kn95',
  'surgical mask', 'face mask',
  'gown', 'gowns', 'protective clothing',
  'coverall', 'coveralls', 'suit',
  'goggle', 'goggles', 'face shield',
  'eye protection', 'protective eyewear',
  'shoe cover', 'boot cover',
  'cap', 'head cover', 'bouffant',
  'ppe', 'personal protective equipment',
  'protective', 'medical', 'surgical',
  'isolation', 'examination',
  'nitrile', 'latex', 'vinyl',
];

function isPPEProduct(deviceName, applicant) {
  if (!deviceName && !applicant) return false;
  const text = `${deviceName || ''} ${applicant || ''}`.toLowerCase();
  return PPE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

function categorizeProduct(deviceName) {
  if (!deviceName) return '其他';
  const text = deviceName.toLowerCase();
  if (text.includes('glove')) return '手部防护装备';
  if (text.includes('mask') || text.includes('respirator') || text.includes('ffp')) return '呼吸防护装备';
  if (text.includes('gown') || text.includes('coverall') || text.includes('clothing') || text.includes('suit')) return '身体防护装备';
  if (text.includes('goggle') || text.includes('face shield') || text.includes('eye') || text.includes('eyewear')) return '眼面部防护装备';
  if (text.includes('shoe') || text.includes('boot')) return '足部防护装备';
  if (text.includes('cap') || text.includes('head')) return '头部防护装备';
  return '其他';
}

async function syncFDA() {
  logSection('FDA 数据同步');
  
  if (!CONFIG.fdaApiKey) {
    log('⚠️  FDA_API_KEY 未设置，跳过FDA同步', 'yellow');
    log('   请从 https://api.fda.gov/ 申请API密钥', 'cyan');
    return;
  }

  const baseUrl = 'https://api.fda.gov/device/510k.json';
  const limit = 1000;
  const maxRecords = 10000;
  let allResults = [];
  let skip = 0;

  try {
    const { count: existingCount } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'fda_510k');

    log(`📊 现有FDA数据: ${existingCount || 0} 条`);

    if ((existingCount || 0) >= maxRecords * 0.8) {
      log('✅ FDA数据已足够，跳过同步', 'green');
      return;
    }

    while (allResults.length < maxRecords) {
      const url = `${baseUrl}?api_key=${CONFIG.fdaApiKey}&limit=${limit}&skip=${skip}&sort=decision_date:desc`;
      log(`📥 获取记录 ${skip} - ${skip + limit}...`);

      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        const ppeRecords = data.results
          .filter(item => isPPEProduct(item.device_name, item.applicant))
          .map(item => ({
            product_name: item.device_name || 'Unknown',
            product_code: item.product_code || '',
            product_category: categorizeProduct(item.device_name),
            sub_category: '',
            ppe_category: item.openfda?.device_class?.[0] || 'Unknown',
            description: item.statement_summary || '',
            manufacturer_name: item.applicant || 'Unknown',
            manufacturer_country: 'US',
            brand_name: item.openfda?.brand_name?.[0] || '',
            fda_k_number: item.k_number || '',
            fda_decision_date: item.decision_date || null,
            target_markets: ['US'],
            source: 'fda_510k',
            created_at: new Date().toISOString(),
          }));

        allResults = [...allResults, ...ppeRecords];
        skip += limit;

        log(`   ✅ 获取 ${ppeRecords.length} 条PPE产品，累计 ${allResults.length} 条`);

        if (allResults.length >= maxRecords) break;
        await sleep(1500);

      } catch (error) {
        log(`   ❌ 错误: ${error.message}`, 'red');
        await sleep(5000);
      }
    }

    if (allResults.length === 0) {
      log('⚠️  未获取到任何PPE数据', 'yellow');
      return;
    }

    log(`\n💾 插入 ${allResults.length} 条数据到数据库...`);

    const batchSize = 500;
    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('ppe_products')
        .upsert(batch, { onConflict: 'fda_k_number' });

      if (error) {
        log(`   ❌ 批次插入失败: ${error.message}`, 'red');
        SYNC_STATS.totalErrors += batch.length;
      } else {
        SYNC_STATS.totalInserted += batch.length;
        log(`   ✅ 批次 ${Math.floor(i / batchSize) + 1}: ${batch.length} 条`, 'green');
      }
    }

    log(`✅ FDA同步完成: ${SYNC_STATS.totalInserted} 条`, 'green');
    SYNC_STATS.sources['FDA'] = allResults.length;

  } catch (error) {
    log(`❌ FDA同步失败: ${error.message}`, 'red');
    SYNC_STATS.totalErrors++;
  }
}

async function syncEUDAMED() {
  logSection('EUDAMED 数据同步');
  
  const baseUrl = 'https://ec.europa.eu/tools/eudamed/api/devices/search';
  const limit = 100;
  const maxRecords = 5000;
  let allResults = [];
  let page = 0;

  try {
    const { count: existingCount } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'eudamed');

    log(`📊 现有EUDAMED数据: ${existingCount || 0} 条`);

    if ((existingCount || 0) >= maxRecords * 0.8) {
      log('✅ EUDAMED数据已足够，跳过同步', 'green');
      return;
    }

    while (allResults.length < maxRecords) {
      const url = `${baseUrl}?page=${page}&size=${limit}&sort=lastUpdatedDate,desc`;
      log(`📥 获取第 ${page + 1} 页...`);

      try {
        const data = await fetchJson(url);
        
        if (!data.result || !data.result.devices || data.result.devices.length === 0) {
          log('✅ 所有数据已获取', 'green');
          break;
        }

        const ppeRecords = data.result.devices
          .filter(item => isPPEProduct(item.name, item.manufacturerName))
          .map(item => ({
            product_name: item.tradeName || item.name || 'Unknown',
            product_code: item.primaryDi || item.basicUdi || '',
            product_category: categorizeProduct(item.name),
            sub_category: item.deviceType || '',
            ppe_category: item.riskClass || 'Class II',
            description: item.description || '',
            manufacturer_name: item.manufacturerName || 'Unknown',
            manufacturer_country: item.manufacturerCountry || 'EU',
            brand_name: item.brandName || '',
            ce_certificate_number: item.notifiedBody || '',
            target_markets: ['EU'],
            source: 'eudamed',
            created_at: new Date().toISOString(),
          }));

        allResults = [...allResults, ...ppeRecords];
        page++;

        log(`   ✅ 获取 ${ppeRecords.length} 条PPE产品，累计 ${allResults.length} 条`);

        if (allResults.length >= maxRecords) break;
        await sleep(2000);

      } catch (error) {
        if (error.message.includes('404') || error.message.includes('403')) {
          log('⚠️  EUDAMED API 不可用，尝试备用方案...', 'yellow');
          break;
        }
        log(`   ❌ 错误: ${error.message}`, 'red');
        await sleep(5000);
      }
    }

    if (allResults.length > 0) {
      log(`\n💾 插入 ${allResults.length} 条数据...`);
      
      const batchSize = 500;
      for (let i = 0; i < allResults.length; i += batchSize) {
        const batch = allResults.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('ppe_products')
          .upsert(batch, { onConflict: 'product_code' });

        if (error) {
          log(`   ❌ 批次插入失败: ${error.message}`, 'red');
        } else {
          SYNC_STATS.totalInserted += batch.length;
          log(`   ✅ 批次 ${Math.floor(i / batchSize) + 1}: ${batch.length} 条`, 'green');
        }
      }

      SYNC_STATS.sources['EUDAMED'] = allResults.length;
      log(`✅ EUDAMED同步完成: ${allResults.length} 条`, 'green');
    }

  } catch (error) {
    log(`❌ EUDAMED同步失败: ${error.message}`, 'red');
  }
}

async function syncNMPA() {
  logSection('NMPA 数据同步');
  
  log('⚠️  NMPA API 需要特殊处理（反爬、验证码等）', 'yellow');
  log('   建议方案：', 'cyan');
  log('   1. 购买第三方NMPA数据服务', 'cyan');
  log('   2. 使用现有的 extract-ppe-from-nmpa.js 脚本', 'cyan');
  log('   3. 手动导入历史数据', 'cyan');
  
  const { count: existingCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'nmpa');

  log(`\n📊 现有NMPA数据: ${existingCount || 0} 条`);
  log('   如需接入NMPA数据，请在完成环境配置后运行:', 'cyan');
  log('   node scripts/extract-ppe-from-nmpa.js', 'cyan');
}

async function syncHealthCanada() {
  logSection('Health Canada 数据同步');
  
  const baseUrl = 'https://health-products.canada.ca/api/medical-devices/v1/devices';
  const limit = 100;
  const maxRecords = 2000;
  let allResults = [];
  let offset = 0;

  try {
    const { count: existingCount } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'health_canada');

    log(`📊 现有Health Canada数据: ${existingCount || 0} 条`);

    while (allResults.length < maxRecords) {
      const url = `${baseUrl}?sort=modified&dir=desc&limit=${limit}&start=${offset}`;
      log(`📥 获取记录 ${offset} - ${offset + limit}...`);

      try {
        const data = await fetchJson(url);
        
        if (!data || data.length === 0) {
          log('✅ 所有数据已获取', 'green');
          break;
        }

        const ppeRecords = data
          .filter(item => isPPEProduct(item.device_name, item.company_name))
          .map(item => ({
            product_name: item.device_name || 'Unknown',
            product_code: item.licence_number || '',
            product_category: categorizeProduct(item.device_name),
            sub_category: item.device_type || '',
            ppe_category: item.licence_class || 'II',
            manufacturer_name: item.company_name || 'Unknown',
            manufacturer_country: 'Canada',
            target_markets: ['CA'],
            source: 'health_canada',
            created_at: new Date().toISOString(),
          }));

        allResults = [...allResults, ...ppeRecords];
        offset += limit;

        log(`   ✅ 获取 ${ppeRecords.length} 条PPE产品，累计 ${allResults.length} 条`);

        if (allResults.length >= maxRecords) break;
        await sleep(2000);

      } catch (error) {
        log(`   ❌ 错误: ${error.message}`, 'red');
        break;
      }
    }

    if (allResults.length > 0) {
      log(`\n💾 插入 ${allResults.length} 条数据...`);
      
      const batchSize = 500;
      for (let i = 0; i < allResults.length; i += batchSize) {
        const batch = allResults.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('ppe_products')
          .upsert(batch, { onConflict: 'product_code' });

        if (error) {
          log(`   ❌ 批次插入失败: ${error.message}`, 'red');
        } else {
          SYNC_STATS.totalInserted += batch.length;
          log(`   ✅ 批次成功`, 'green');
        }
      }

      SYNC_STATS.sources['Health Canada'] = allResults.length;
      log(`✅ Health Canada同步完成: ${allResults.length} 条`, 'green');
    }

  } catch (error) {
    log(`❌ Health Canada同步失败: ${error.message}`, 'red');
  }
}

async function showStatus() {
  logHeader('数据同步状态');
  
  const sources = ['fda_510k', 'eudamed', 'nmpa', 'health_canada', 'tga', 'pmda'];
  
  for (const source of sources) {
    try {
      const { count } = await supabase
        .from('ppe_products')
        .select('*', { count: 'exact', head: true })
        .eq('source', source);

      const { data: lastSync } = await supabase
        .from('data_sources')
        .select('last_sync_at')
        .eq('name', source)
        .single();

      const sourceName = {
        'fda_510k': 'FDA 510(k)',
        'eudamed': 'EUDAMED',
        'nmpa': 'NMPA',
        'health_canada': 'Health Canada',
        'tga': 'TGA',
        'pmda': 'PMDA',
      }[source] || source;

      log(`${sourceName}:`, 'cyan');
      log(`  记录数: ${count || 0}`, 'white');
      log(`  最后同步: ${lastSync?.last_sync_at || '从未同步'}`, 'white');
    } catch (error) {
      log(`⚠️  查询 ${source} 状态失败`, 'yellow');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--all';

  logHeader('MDLooker 全球PPE数据同步');
  log(`⏰ 开始时间: ${SYNC_STATS.startTime.toLocaleString()}\n`, 'cyan');

  const commands = {
    '--all': async () => {
      await syncFDA();
      await syncEUDAMED();
      await syncNMPA();
    },
    '--fda': syncFDA,
    '--eudamed': syncEUDAMED,
    '--nmpa': syncNMPA,
    '--canada': syncHealthCanada,
    '--status': showStatus,
    '--help': () => {
      log('使用方式:', 'cyan');
      log('  node scripts/sync-all-data.js              执行所有数据源', 'white');
      log('  node scripts/sync-all-data.js --fda        仅同步FDA数据', 'white');
      log('  node scripts/sync-all-data.js --eudamed    仅同步EUDAMED数据', 'white');
      log('  node scripts/sync-all-data.js --nmpa       仅同步NMPA数据', 'white');
      log('  node scripts/sync-all-data.js --canada     仅同步Health Canada数据', 'white');
      log('  node scripts/sync-all-data.js --status     查看同步状态', 'white');
      log('  node scripts/sync-all-data.js --help       显示帮助', 'white');
    },
  };

  const handler = commands[command];
  if (!handler) {
    log(`❌ 未知命令: ${command}`, 'red');
    log('使用 --help 查看可用命令', 'yellow');
    process.exit(1);
  }

  await handler();

  const endTime = new Date();
  const duration = (endTime - SYNC_STATS.startTime) / 1000;

  logHeader('同步完成');
  log(`⏱️  总耗时: ${duration.toFixed(1)} 秒`, 'cyan');
  log(`📥 总插入: ${SYNC_STATS.totalInserted} 条`, 'green');
  log(`❌ 总错误: ${SYNC_STATS.totalErrors} 条`, SYNC_STATS.totalErrors > 0 ? 'red' : 'green');
  
  if (Object.keys(SYNC_STATS.sources).length > 0) {
    log('\n📊 按来源统计:', 'cyan');
    for (const [source, count] of Object.entries(SYNC_STATS.sources)) {
      log(`   ${source}: ${count} 条`, 'white');
    }
  }

  process.exit(SYNC_STATS.totalErrors > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ 执行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
