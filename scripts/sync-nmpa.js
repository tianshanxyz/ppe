#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS_CN = ['手套', '口罩', '防护服', '护目镜', '面罩', '鞋套', '帽子', '防护', '医用', '外科', '隔离', '一次性'];
const PPE_KEYWORDS_EN = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe', 'medical', 'surgical', 'disposable', 'isolation'];

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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { 
      timeout: 30000, 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      } 
    }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ html: data }); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function syncNMPA() {
  console.log('\n=== NMPA Data Sync ===\n');
  
  const urls = [
    'https://app1.nmpa.gov.cn/daohangcx/query/list.html?page=1&pageSize=100&productName=&regDate=',
    'https://app1.nmpa.gov.cn/daohangcx/query/list.json?page=1&pageSize=100'
  ];

  let totalInserted = 0;

  for (const url of urls) {
    console.log(`Trying: ${url}`);
    try {
      const data = await fetchJson(url);
      console.log('Response type:', typeof data);
      if (data.results || data.list) {
        console.log('Found data!');
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  console.log('\nNote: NMPA website requires special handling (anti-scraping measures).');
  console.log('Recommended: Use official data download or manual import.\n');
  
  console.log('Trying CDX data service...');
  
  try {
    const cdxUrl = 'https://www.cde.org.cn/';
    console.log(`Fetching from: ${cdxUrl}`);
    const data = await fetchJson(cdxUrl);
    console.log('Response received');
  } catch(e) {
    console.log('CDX error:', e.message);
  }

  console.log('\n✅ NMPA: Manual data import required');
  process.exit(0);
}

syncNMPA();
