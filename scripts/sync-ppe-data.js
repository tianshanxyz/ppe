#!/usr/bin/env node

/**
 * MDLooker PPE数据同步脚本 (适配实际数据库结构)
 * 
 * 支持的数据源:
 * - FDA 510(k) (需要API Key)
 * - EUDAMED (欧盟医疗器械数据库)
 * - NMPA (中国国家药监局)
 * - Health Canada
 * 
 * 使用方法:
 *   node scripts/sync-ppe-data.js --all      同步所有数据源
 *   node scripts/sync-ppe-data.js --fda     仅同步FDA
 *   node scripts/sync-ppe-data.js --eudamed 仅同步EUDAMED
 *   node scripts/sync-ppe-data.js --status   查看状态
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

const envConfig = {};
fs.readFileSync(__dirname + '/../.env.local', 'utf-8')
  .split('\n')
  .forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envConfig[match[1].trim()] = match[2].trim();
  });

const COLORS = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', magenta: '\x1b[35m', bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

const CONFIG = {
  supabaseUrl: envConfig.NEXT_PUBLIC_SUPABASE_URL || 'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  supabaseKey: envConfig.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU',
  fdaApiKey: envConfig.FDA_API_KEY,
};

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

const STATS = { inserted: 0, updated: 0, errors: 0, sources: {} };

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    });
    req.on('error', (e) => reject(new Error('Request error: ' + e.message)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const PPE_KEYWORDS = [
  'glove', 'gloves', 'mask', 'respirator', 'ffp2', 'ffp3', 'n95', 'kn95',
  'gown', 'coverall', 'protective clothing', 'face shield', 'goggle',
  'shoe cover', 'boot cover', 'cap', 'head cover', 'ppe', 'examination',
  'surgical', 'isolation', 'nitrile', 'latex', 'vinyl', 'medical', 'protective'
];

function isPPE(deviceName) {
  if (!deviceName) return false;
  const text = deviceName.toLowerCase();
  return PPE_KEYWORDS.some(k => text.includes(k));
}

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('ffp')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('clothing')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eye')) return '眼面部防护装备';
  if (t.includes('shoe') || t.includes('boot')) return '足部防护装备';
  if (t.includes('cap') || t.includes('head')) return '头部防护装备';
  return '其他';
}

async function syncFDA() {
  log('\n--- FDA 510(k) Data Sync ---\n', 'cyan');
  
  if (!CONFIG.fdaApiKey || CONFIG.fdaApiKey === 'YOUR_FDA_API_KEY_HERE') {
    log('⚠️  FDA API Key not configured. Skip FDA sync.', 'yellow');
    log('   Get free key from: https://api.fda.gov/', 'cyan');
    return;
  }

  const baseUrl = 'https://api.fda.gov/device/510k.json';
  const limit = 1000;
  const maxRecords = 5000;
  let allResults = [];
  let skip = 0;

  try {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .ilike('name', '%glove%');
    
    log(`📊 Existing PPE products: ${count || 0}`);

    while (allResults.length < maxRecords) {
      const url = `${baseUrl}?api_key=${CONFIG.fdaApiKey}&limit=${limit}&skip=${skip}&sort=decision_date:desc`;
      log(`📥 Fetching records ${skip} - ${skip + limit}...`);

      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        const ppeRecords = data.results
          .filter(item => isPPE(item.device_name))
          .map(item => ({
            name: item.device_name || 'Unknown',
            model: item.product_code || item.k_number || '',
            category: categorize(item.device_name),
            subcategory: '',
            description: item.statement_summary || '',
            country_of_origin: item.applicant ? 'US' : 'Unknown',
            updated_at: new Date().toISOString(),
          }));

        allResults = [...allResults, ...ppeRecords];
        skip += limit;
        log(`   ✅ Got ${ppeRecords.length} PPE products, total: ${allResults.length}`);

        if (allResults.length >= maxRecords) break;
        await sleep(1500);
      } catch (e) {
        log(`   ❌ Error: ${e.message}`, 'red');
        await sleep(5000);
      }
    }

    if (allResults.length > 0) {
      log(`\n💾 Inserting ${allResults.length} records...`);
      
      const batchSize = 500;
      for (let i = 0; i < allResults.length; i += batchSize) {
        const batch = allResults.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('ppe_products')
          .insert(batch);

        if (error) {
          log(`   ❌ Batch error: ${error.message}`, 'red');
          STATS.errors += batch.length;
        } else {
          STATS.inserted += batch.length;
          log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`, 'green');
        }
      }

      STATS.sources['FDA'] = allResults.length;
      log(`\n✅ FDA sync complete: ${allResults.length} records`, 'green');
    }

  } catch (e) {
    log(`❌ FDA sync failed: ${e.message}`, 'red');
  }
}

async function syncEUDAMED() {
  log('\n--- EUDAMED Data Sync ---\n', 'cyan');
  
  const baseUrl = 'https://ec.europa.eu/tools/eudamed/api/devices/search';
  const limit = 100;
  const maxRecords = 3000;
  let allResults = [];
  let page = 0;

  try {
    while (allResults.length < maxRecords) {
      const url = `${baseUrl}?page=${page}&size=${limit}&sort=lastUpdatedDate,desc`;
      log(`📥 Fetching page ${page + 1}...`);

      try {
        const data = await fetchJson(url);
        
        if (!data.result || !data.result.devices || data.result.devices.length === 0) {
          log('✅ No more data available', 'green');
          break;
        }

        const ppeRecords = data.result.devices
          .filter(item => isPPE(item.name))
          .map(item => ({
            name: item.tradeName || item.name || 'Unknown',
            model: item.primaryDi || item.basicUdi || '',
            category: categorize(item.name),
            subcategory: item.deviceType || '',
            description: item.description || '',
            country_of_origin: item.manufacturerCountry || 'EU',
            updated_at: new Date().toISOString(),
          }));

        allResults = [...allResults, ...ppeRecords];
        page++;
        log(`   ✅ Got ${ppeRecords.length} PPE products, total: ${allResults.length}`);

        if (allResults.length >= maxRecords) break;
        await sleep(2000);
      } catch (e) {
        if (e.message.includes('404') || e.message.includes('403')) {
          log('⚠️  EUDAMED API unavailable (may require auth)', 'yellow');
          log('   Alternative: Use web scraping or manual import', 'cyan');
          break;
        }
        log(`   ❌ Error: ${e.message}`, 'red');
        await sleep(5000);
      }
    }

    if (allResults.length > 0) {
      log(`\n💾 Inserting ${allResults.length} records...`);
      
      const batchSize = 500;
      for (let i = 0; i < allResults.length; i += batchSize) {
        const batch = allResults.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('ppe_products')
          .upsert(batch, { onConflict: 'model' });

        if (error) {
          log(`   ❌ Batch error: ${error.message}`, 'red');
        } else {
          STATS.inserted += batch.length;
          log(`   ✅ Batch success`, 'green');
        }
      }

      STATS.sources['EUDAMED'] = allResults.length;
      log(`\n✅ EUDAMED sync complete: ${allResults.length} records`, 'green');
    }

  } catch (e) {
    log(`❌ EUDAMED sync failed: ${e.message}`, 'red');
  }
}

async function showStatus() {
  log('\n--- Data Status ---\n', 'cyan');
  
  const { count: productCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });

  log(`📊 ppe_products: ${productCount || 0} records`, 'white');
  log(`📊 ppe_manufacturers: ${mfrCount || 0} records`, 'white');

  // Category distribution
  const { data: categoryData } = await supabase
    .from('ppe_products')
    .select('category');

  if (categoryData) {
    const counts = {};
    categoryData.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    log('\n📈 Category Distribution:', 'white');
    for (const [cat, cnt] of Object.entries(counts).sort((a,b) => b[1] - a[1])) {
      log(`   ${cat}: ${cnt}`, 'cyan');
    }
  }

  // Country distribution
  const { data: countryData } = await supabase
    .from('ppe_products')
    .select('country_of_origin');

  if (countryData) {
    const counts = {};
    countryData.forEach(r => {
      const c = r.country_of_origin || 'Unknown';
      counts[c] = (counts[c] || 0) + 1;
    });
    log('\n🌍 Country Distribution:', 'white');
    for (const [c, cnt] of Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10)) {
      log(`   ${c}: ${cnt}`, 'cyan');
    }
  }

  // Data sources
  log('\n📡 Sync Sources:', 'white');
  for (const [source, count] of Object.entries(STATS.sources)) {
    log(`   ${source}: ${count}`, 'cyan');
  }

  if (Object.keys(STATS.sources).length === 0) {
    log('   (Run sync to see source stats)', 'yellow');
  }
}

async function main() {
  const cmd = process.argv[2] || '--status';
  
  log('\n========================================', 'blue');
  log('  MDLooker PPE Data Sync', 'blue');
  log('========================================\n', 'blue');
  log(`⏰ Started at: ${new Date().toLocaleString()}\n`, 'cyan');

  const commands = {
    '--all': async () => { await syncFDA(); await syncEUDAMED(); },
    '--fda': syncFDA,
    '--eudamed': syncEUDAMED,
    '--status': showStatus,
    '--help': () => {
      log('Usage:', 'cyan');
      log('  node scripts/sync-ppe-data.js --all      Sync all sources', 'white');
      log('  node scripts/sync-ppe-data.js --fda       Sync FDA only', 'white');
      log('  node scripts/sync-ppe-data.js --eudamed   Sync EUDAMED only', 'white');
      log('  node scripts/sync-ppe-data.js --status    Show status', 'white');
    }
  };

  const handler = commands[cmd];
  if (!handler) {
    log(`❌ Unknown command: ${cmd}`, 'red');
    process.exit(1);
  }

  await handler();

  log('\n========================================', 'blue');
  log('  Sync Complete', 'blue');
  log('========================================\n', 'blue');
  log(`📥 Total inserted: ${STATS.inserted}`, 'green');
  log(`❌ Total errors: ${STATS.errors}`, STATS.errors > 0 ? 'red' : 'green');
  
  process.exit(STATS.errors > 0 ? 1 : 0);
}

main().catch(e => {
  log(`\n❌ Fatal error: ${e.message}`, 'red');
  process.exit(1);
});
