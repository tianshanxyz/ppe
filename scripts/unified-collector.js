#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const LOG_TABLE = 'data_collection_logs';

const COLLECTORS = {};

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

function log(level, source, message, details = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    details
  };
  console.log(`[${level.toUpperCase()}] ${source}: ${message}`, details || '');
  return entry;
}

async function writeLog(logEntry) {
  try {
    await supabase.from(LOG_TABLE).insert({
      ...logEntry,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.log('Log write error (non-fatal):', e.message);
  }
}

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/html, */*',
      ...options.headers
    };
    
    const req = https.get(url, { timeout: 30000, headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && options.followRedirect !== false) {
        resolve({ redirect: res.headers.location, status: res.statusCode });
        return;
      }
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

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : querystring.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        ...headers
      }
    }, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(result)); }
        catch { resolve(result); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function rateLimit(ms) {
  await new Promise(r => setTimeout(r, ms));
}

async function insertBatch(records) {
  if (!records || records.length === 0) return 0;
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (error) {
      log('ERROR', 'DB', `Insert error: ${error.message}`);
    } else {
      inserted += batch.length;
    }
    await rateLimit(200);
  }
  return inserted;
}

class MedplumCollector {
  constructor() {
    this.name = 'Medplum';
    this.baseUrl = 'https://api.medplum.com';
    this.clientId = '8e009a1e-d51f-44d2-b5a0-a852712255c3';
    this.clientSecret = '205a1c68105113ad0ddaf921181d6a220fba3a80c6cc1ede06ca64f38d88f268';
    this.accessToken = null;
  }

  async authenticate() {
    log('INFO', this.name, 'Authenticating...');
    try {
      const data = await httpPost(`${this.baseUrl}/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });
      this.accessToken = data.access_token;
      log('INFO', this.name, 'Authenticated successfully');
      return true;
    } catch (e) {
      log('ERROR', this.name, `Auth failed: ${e.message}`);
      return false;
    }
  }

  async fetchResource(resourceType, params = '') {
    if (!this.accessToken) await this.authenticate();
    const url = `${this.baseUrl}/fhir/R4/${resourceType}${params ? '?' + params : ''}`;
    return httpGet(url, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
      followRedirect: false
    });
  }

  async collect() {
    log('INFO', this.name, 'Starting collection...');
    const startTime = Date.now();
    let totalInserted = 0;

    if (!this.accessToken) {
      const ok = await this.authenticate();
      if (!ok) return 0;
    }

    const resources = ['Device', 'Organization', 'Practitioner', 'Location'];
    
    for (const type of resources) {
      try {
        log('INFO', this.name, `Fetching ${type}...`);
        const result = await this.fetchResource(type, '_count=100');
        const data = JSON.parse(result.data);
        const entries = data.entry || [];
        
        log('INFO', this.name, `Got ${entries.length} ${type} entries`);

        if (type === 'Device') {
          const ppeDevices = entries
            .map(e => e.resource)
            .filter(d => {
              const name = d.deviceName?.[0]?.name || d.identifier?.[0]?.value || '';
              return isPPE(name);
            })
            .map(d => ({
              name: d.deviceName?.[0]?.name || d.identifier?.[0]?.value || 'Unknown',
              model: d.identifier?.[0]?.value || '',
              category: categorize(d.deviceName?.[0]?.name || ''),
              subcategory: '',
              description: d.description || '',
              country_of_origin: d.country || 'Unknown',
              updated_at: new Date().toISOString(),
            }));

          const inserted = await insertBatch(ppeDevices);
          totalInserted += inserted;
          log('INFO', this.name, `Inserted ${inserted} PPE devices`);
        }

        await rateLimit(1000);
      } catch (e) {
        log('ERROR', this.name, `${type} fetch error: ${e.message}`);
      }
    }

    await writeLog({
      source: this.name,
      records_collected: totalInserted,
      duration_ms: Date.now() - startTime,
      status: 'completed'
    });

    return totalInserted;
  }
}

class FDACollector {
  constructor() {
    this.name = 'FDA';
    this.baseUrl = 'https://api.fda.gov/device/510k.json';
    this.apiKey = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
    this.limit = 100;
  }

  async collect(maxRecords = 5000) {
    log('INFO', this.name, 'Starting FDA 510(k) collection...');
    const startTime = Date.now();
    let totalInserted = 0;
    let skip = 0;

    while (totalInserted < maxRecords) {
      const url = `${this.baseUrl}?api_key=${this.apiKey}&limit=${this.limit}&skip=${skip}&sort=decision_date:desc`;
      
      try {
        const result = await httpGet(url);
        const data = JSON.parse(result.data);
        
        if (!data.results || data.results.length === 0) {
          log('INFO', this.name, 'No more results');
          break;
        }

        const ppeRecords = data.results
          .filter(item => isPPE(item.device_name || ''))
          .map(item => ({
            name: item.device_name || 'Unknown',
            model: (item.product_code || '') + '_' + (item.k_number || ''),
            category: categorize(item.device_name || ''),
            subcategory: '',
            description: item.statement_or_summary || item.statement_summary || '',
            country_of_origin: 'US',
            updated_at: new Date().toISOString(),
          }));

        const inserted = await insertBatch(ppeRecords);
        totalInserted += inserted;
        skip += this.limit;
        
        log('INFO', this.name, `Progress: ${totalInserted}/${maxRecords}`);
        await rateLimit(500);

      } catch (e) {
        log('ERROR', this.name, `Fetch error: ${e.message}, retrying...`);
        await rateLimit(2000);
        if (e.message.includes('400') || e.message.includes('429')) {
          break;
        }
      }
    }

    await writeLog({
      source: this.name,
      records_collected: totalInserted,
      duration_ms: Date.now() - startTime,
      status: 'completed'
    });

    return totalInserted;
  }
}

class LocalDataCollector {
  constructor() {
    this.name = 'LocalFiles';
  }

  async collect() {
    log('INFO', this.name, 'Starting local data import...');
    const startTime = Date.now();
    let totalInserted = 0;

    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '..', 'data');

    const files = [
      'ppe_products_extracted.json',
      'ppe_products_extracted_v2.json',
      'ppe_products_extracted_extended.json',
      'ppe_products_cleaned.json',
      'ppe_products_cleaned_v2.json',
      'ppe_products_cleaned_extended.json',
    ];

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      if (!fs.existsSync(filePath)) continue;
      
      const stat = fs.statSync(filePath);
      if (stat.size < 100) continue;

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        let data = JSON.parse(content);
        if (!Array.isArray(data)) continue;

        const records = data
          .map(item => {
            const name = item.product_name || item.name || item.productName || '';
            if (!name) return null;
            return {
              name,
              model: item.product_code || item.model || '',
              category: item.category || categorize(name),
              subcategory: item.sub_category || '',
              description: item.description || '',
              country_of_origin: item.country_of_origin || 'Unknown',
              updated_at: new Date().toISOString(),
            };
          })
          .filter(r => r && r.name);

        const inserted = await insertBatch(records);
        totalInserted += inserted;
        log('INFO', this.name, `${file}: ${inserted} records`);
      } catch (e) {
        log('ERROR', this.name, `${file}: ${e.message}`);
      }
    }

    await writeLog({
      source: this.name,
      records_collected: totalInserted,
      duration_ms: Date.now() - startTime,
      status: 'completed'
    });

    return totalInserted;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Data Collection System - Unified Collector');
  console.log('='.repeat(60) + '\n');

  const args = process.argv.slice(2);
  const runAll = !args.includes('--source');
  const source = args.find(a => a.startsWith('--source='))?.split('=')[1];

  let totalRecords = 0;
  const results = [];

  if (runAll || source === 'medplum') {
    const collector = new MedplumCollector();
    const count = await collector.collect();
    results.push({ source: 'Medplum', count });
    totalRecords += count;
  }

  if (runAll || source === 'fda') {
    const collector = new FDACollector();
    const count = await collector.collect(5000);
    results.push({ source: 'FDA', count });
    totalRecords += count;
  }

  if (runAll || source === 'local') {
    const collector = new LocalDataCollector();
    const count = await collector.collect();
    results.push({ source: 'Local', count });
    totalRecords += count;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Collection Summary');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`  ${r.source}: ${r.count} records`);
  }
  console.log(`\n  TOTAL: ${totalRecords} records`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
