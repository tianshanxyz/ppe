#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS_CN = ['手套', '口罩', '防护服', '护目镜', '面罩', '鞋套', '帽子', '防护', '医用', '外科', '隔离', '一次性', '呼吸', 'n95', 'kn95'];
const PPE_KEYWORDS_EN = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe', 'surgical', 'disposable', 'isolation', 'nitrile', 'latex', 'ffp2', 'ffp3'];
const ALL_KEYWORDS = [...PPE_KEYWORDS_CN, ...PPE_KEYWORDS_EN];

function isPPE(name) {
  if (!name) return false;
  const t = name.toLowerCase();
  return ALL_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('手套') || t.includes('glove')) return '手部防护装备';
  if (t.includes('口罩') || t.includes('呼吸') || t.includes('mask') || t.includes('respirator')) return '呼吸防护装备';
  if (t.includes('防护服') || t.includes('gown') || t.includes('coverall')) return '身体防护装备';
  if (t.includes('护目镜') || t.includes('面罩') || t.includes('goggle') || t.includes('face shield')) return '眼面部防护装备';
  if (t.includes('鞋套') || t.includes('boot')) return '足部防护装备';
  return '其他';
}

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.nmpa.gov.cn/',
        ...options.headers
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function insertBatch(records) {
  if (!records || records.length === 0) return 0;
  const { error } = await supabase.from('ppe_products').insert(records);
  if (error) {
    console.log(`  DB Error: ${error.message}`);
    return 0;
  }
  return records.length;
}

async function collectNMPA() {
  console.log('\n=== NMPA Data Collector ===\n');

  const nmpaEndpoints = [
    'https://app1.nmpa.gov.cn/daohangcx/query/list.html?page=1&pageSize=100',
    'https://app1.nmpa.gov.cn/daohangcx/query/list.json?page=1&pageSize=100',
    'https://www.nmpa.gov.cn/zwfw/taizhen/',
    'https://app1.nmpa.gov.cn/daohangcx/query/yxzl',
    'https://app1.nmpa.gov.cn/daohangcx/query/ylqx',
  ];

  let availableEndpoint = null;
  let testResult = null;

  for (const endpoint of nmpaEndpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      testResult = await httpGet(endpoint);
      console.log(`  Status: ${testResult.status}`);
      if (testResult.status === 200) {
        if (testResult.data.includes('{') || testResult.data.includes('[')) {
          try {
            JSON.parse(testResult.data);
            availableEndpoint = endpoint;
            console.log(`  ✅ Valid JSON endpoint found!`);
            break;
          } catch {
            if (testResult.data.length > 100) {
              availableEndpoint = endpoint;
              console.log(`  ✅ HTML endpoint available`);
              break;
            }
          }
        }
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
  }

  if (!availableEndpoint) {
    console.log('\n⚠️  NMPA endpoints not accessible from current network.');
    console.log('NMPA requires China network or official data files.');
    return 0;
  }

  console.log('\n📥 Fetching from NMPA...');
  let totalInserted = 0;

  try {
    if (testResult && (testResult.data.includes('[') || testResult.data.includes('{'))) {
      const data = JSON.parse(testResult.data);
      const items = data.results || data.list || data.data || (Array.isArray(data) ? data : []);
      
      const ppeRecords = items
        .filter(item => {
          const name = item.product_name || item.productName || item.name || '';
          return isPPE(name);
        })
        .map(item => ({
          name: item.product_name || item.productName || item.name || 'Unknown',
          model: item.product_code || item.productCode || item.model || '',
          category: item.category || categorize(item.product_name || ''),
          subcategory: '',
          description: item.description || item.manufacturer || '',
          country_of_origin: 'CN',
          updated_at: new Date().toISOString(),
        }));

      console.log(`Found ${ppeRecords.length} PPE records`);
      
      if (ppeRecords.length > 0) {
        const inserted = await insertBatch(ppeRecords);
        totalInserted += inserted;
        console.log(`✅ Inserted ${inserted} records`);
      }
    } else {
      console.log('HTML response - scraping not implemented');
      console.log('Consider using official NMPA data exports.');
    }
  } catch (e) {
    console.log(`Parse Error: ${e.message}`);
  }

  console.log(`\n📊 NMPA Collection: ${totalInserted} records`);
  return totalInserted;
}

collectNMPA().then(count => {
  console.log(`\n✅ Done: ${count} records collected`);
  process.exit(0);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
