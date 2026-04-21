#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS_CN = ['手套', '口罩', '防护服', '护目镜', '面罩', '鞋套', '帽子', '防护', '医用', '外科', '隔离', '一次性', '呼吸', 'n95', 'kn95'];
const PPE_KEYWORDS_EN = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe', 'surgical', 'disposable', 'isolation', 'nitrile', 'latex'];

function isPPE(name) {
  if (!name) return false;
  const t = name.toLowerCase();
  return [...PPE_KEYWORDS_CN, ...PPE_KEYWORDS_EN].some(k => t.includes(k.toLowerCase()));
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

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://app1.nmpa.gov.cn/',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function crawlNMPA() {
  console.log('\n=== NMPA Crawler ===\n');
  
  const urls = [
    'https://app1.nmpa.gov.cn/daohangcx/query/list.html?page=1&pageSize=20',
    'https://app1.nmpa.gov.cn/daohangcx/query/list.json?page=1&pageSize=20',
    'https://app1.nmpa.gov.cn/zwfw/taizhen/',
    'https://www.nmpa.gov.cn/zwfw/taizhen/',
  ];

  for (const url of urls) {
    console.log(`Trying: ${url}`);
    try {
      const result = await fetchUrl(url);
      console.log(`  Status: ${result.status}`);
      console.log(`  Content-Type: ${result.headers['content-type']}`);
      console.log(`  Preview: ${result.data.substring(0, 200)}`);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
    console.log('');
  }

  console.log('Testing NMPA API endpoints...');
  
  const apiUrls = [
    'https://app1.nmpa.gov.cn/daohangcx/query/yxzl',
    'https://app1.nmpa.gov.cn/daohangcx/query/ylqx',
    'https://app1.nmpa.gov.cn/daohangcx/query/tzsy',
    'https://app1.nmpa.gov.cn/daohangcx/query/zwfw',
  ];

  for (const url of apiUrls) {
    console.log(`\nTrying API: ${url}`);
    try {
      const result = await fetchUrl(url);
      console.log(`  Status: ${result.status}`);
      if (result.status === 200 && result.data) {
        const preview = result.data.substring(0, 300);
        console.log(`  Preview: ${preview}`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log('\n\nNote: NMPA website may require special handling.');
  console.log('Consider using official data download or manual import.\n');
  
  process.exit(0);
}

crawlNMPA();
