#!/usr/bin/env node

/**
 * 统一PPE数据抓取脚本
 * 抓取多个权威平台的免费数据：
 * 1. PPE-INFO (美国NIOSH) - 标准和法规
 * 2. PPE_RFU (欧盟) - 使用建议和协调文件
 * 3. NANDO (欧盟) - 公告机构信息
 * 4. 欧盟协调标准 - PPE标准列表
 * 5. EUDAMED (欧盟) - 医疗器械/PPE注册信息
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase客户端
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// 数据存储路径
const DATA_DIR = path.join(__dirname, '..', 'data', 'crawled');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 通用HTTP请求函数
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, application/xhtml+xml, application/pdf',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers
      }
    }, (res) => {
      if (options.followRedirect !== false && (res.statusCode === 301 || res.statusCode === 302)) {
        resolve({ redirect: res.headers.location, status: res.statusCode });
        return;
      }
      
      const contentType = res.headers['content-type'] || '';
      let data = '';
      
      if (contentType.includes('application/pdf')) {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ 
          data: Buffer.concat(chunks), 
          status: res.statusCode, 
          contentType,
          isBinary: true 
        }));
      } else {
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ 
          data, 
          status: res.statusCode, 
          contentType,
          isBinary: false 
        }));
      }
    });
    
    req.on('error', reject);
    req.on('timeout', () => { 
      req.destroy(); 
      reject(new Error('Timeout')); 
    });
  });
}

// 保存JSON数据
function saveJson(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  💾 Saved: ${filepath}`);
  return filepath;
}

// 保存二进制文件（PDF等）
function saveBinary(filename, buffer) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`  💾 Saved: ${filepath} (${(buffer.length / 1024).toFixed(2)} KB)`);
  return filepath;
}

// ==================== 1. PPE-INFO 数据抓取 ====================

async function crawlPPEInfo() {
  console.log('\n📋 === PPE-INFO (NIOSH) Data Collection ===\n');
  
  const results = {
    source: 'PPE-INFO',
    url: 'https://www.cdc.gov/niosh/npptl/pce.html',
    timestamp: new Date().toISOString(),
    data: []
  };

  try {
    // PPE-INFO数据库介绍页面
    console.log('Fetching PPE-INFO overview...');
    const overview = await fetchUrl('https://www.cdc.gov/niosh/npptl/pce.html');
    
    if (overview.status === 200) {
      results.overview = {
        status: 'success',
        contentPreview: overview.data.substring(0, 500)
      };
      
      // 提取关键信息
      const standardsMentioned = [];
      const stdMatches = overview.data.match(/(ANSI|ISO|ASTM|NFPA|OSHA)[\s/-]?[A-Z]?\d{2,5}/gi) || [];
      stdMatches.forEach(match => {
        if (!standardsMentioned.includes(match)) {
          standardsMentioned.push(match);
        }
      });
      
      results.standardsMentioned = standardsMentioned.slice(0, 20);
      console.log(`  Found ${standardsMentioned.length} standard references`);
    }

    // NIOSH认证设备列表
    console.log('Fetching NIOSH Certified Equipment List...');
    const celUrl = 'https://www.cdc.gov/niosh/npptl/topics/respirators/cel/';
    const cel = await fetchUrl(celUrl);
    
    if (cel.status === 200) {
      results.certifiedEquipment = {
        status: 'success',
        url: celUrl,
        contentPreview: cel.data.substring(0, 500)
      };
    }

    // 尝试获取PPE-INFO数据库API（如果可用）
    console.log('Checking for PPE-INFO API endpoints...');
    const apiEndpoints = [
      'https://www.cdc.gov/niosh/npptl/api/standards',
      'https://www.cdc.gov/niosh/npptl/api/ppe'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetchUrl(endpoint, { timeout: 10000 });
        if (response.status === 200) {
          console.log(`  ✅ API available: ${endpoint}`);
          results.apiEndpoints = results.apiEndpoints || [];
          results.apiEndpoints.push({ url: endpoint, status: 'available' });
        }
      } catch (e) {
        // API不可用，这是正常的
      }
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.error = error.message;
  }

  saveJson('ppe-info-data.json', results);
  console.log(`\n✅ PPE-INFO collection complete`);
  return results;
}

// ==================== 2. PPE_RFU 文档抓取 ====================

async function crawlPPERFU() {
  console.log('\n📄 === PPE_RFU Document Collection ===\n');
  
  const results = {
    source: 'PPE_RFU',
    baseUrl: 'https://ppe-rfu.eu',
    timestamp: new Date().toISOString(),
    documents: []
  };

  // RFU文档列表（基于调研结果）
  const rfuDocuments = [
    {
      id: 'horizontal-rfu',
      title: 'Horizontal Recommendation for Use Sheets',
      description: '跨产品类别的通用建议',
      url: 'https://www.ppe-rfu.eu/ppedownload?id=13e44453-68b9-4516-bc0e-4fea367d2daf',
      category: 'horizontal'
    },
    {
      id: 'vertical-group-1',
      title: 'Vertical Group 1 - Head Protection',
      description: '头部防护设备RFU',
      url: 'https://ppe-rfu.eu/ppedownload?id=851afa0b-e179-4be0-8983-089658dcf87d',
      category: 'vertical'
    },
    {
      id: 'vertical-group-2',
      title: 'Vertical Group 2 - Eye and Face Protection',
      description: '眼面部防护设备RFU',
      url: 'https://www.ppe-rfu.eu/ppedownload?id=b3ab4253-6d7c-48ae-940c-58eef911ff95',
      category: 'vertical'
    },
    {
      id: 'regulation-guide',
      title: 'PPE Regulation 2016/425 Guide',
      description: 'PPE法规指南',
      url: 'https://eurogip.fr/wp-content/uploads/2021/09/ppe-vertical-rfu_Reglement_en_2025-05.pdf',
      category: 'guide'
    }
  ];

  for (const doc of rfuDocuments) {
    console.log(`Fetching: ${doc.title}`);
    try {
      const response = await fetchUrl(doc.url, { timeout: 30000 });
      
      if (response.status === 200) {
        const filename = `rfu-${doc.id}.pdf`;
        
        if (response.isBinary) {
          saveBinary(filename, response.data);
        } else {
          saveJson(`rfu-${doc.id}.html`, { 
            url: doc.url, 
            content: response.data.substring(0, 5000) 
          });
        }
        
        results.documents.push({
          ...doc,
          status: 'downloaded',
          filename: response.isBinary ? filename : `rfu-${doc.id}.html`,
          size: response.isBinary ? response.data.length : response.data.length
        });
        
        console.log(`  ✅ Downloaded`);
      } else {
        console.log(`  ⚠️ Status: ${response.status}`);
        results.documents.push({ ...doc, status: 'failed', error: `HTTP ${response.status}` });
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.documents.push({ ...doc, status: 'error', error: error.message });
    }
  }

  saveJson('ppe-rfu-documents.json', results);
  console.log(`\n✅ PPE_RFU collection complete: ${results.documents.filter(d => d.status === 'downloaded').length}/${results.documents.length} documents`);
  return results;
}

// ==================== 3. NANDO 公告机构数据抓取 ====================

async function crawlNANDO() {
  console.log('\n🏛️ === NANDO Notified Bodies Collection ===\n');
  
  const results = {
    source: 'NANDO',
    baseUrl: 'https://ec.europa.eu/growth/tools-databases/nando/',
    timestamp: new Date().toISOString(),
    notifiedBodies: []
  };

  try {
    // NANDO数据库页面
    console.log('Fetching NANDO database...');
    const nandoUrl = 'https://ec.europa.eu/growth/tools-databases/nando/index.cfm?fuseaction=directive.notifiedbody&dir_id=1551';
    const response = await fetchUrl(nandoUrl);
    
    if (response.status === 200) {
      // 解析HTML提取公告机构信息
      const html = response.data;
      
      // 提取公告机构编号和名称
      const nbPattern = /(\d{4})\s*-\s*([^<\n]+)/g;
      const matches = [];
      let match;
      
      while ((match = nbPattern.exec(html)) !== null && matches.length < 100) {
        const nbNumber = match[1];
        const nbName = match[2].trim();
        if (nbNumber && nbName && nbName.length > 3) {
          matches.push({
            number: nbNumber,
            name: nbName,
            country: extractCountryFromName(nbName),
            regulation: 'EU 2016/425 (PPE)'
          });
        }
      }
      
      results.notifiedBodies = matches;
      console.log(`  Found ${matches.length} notified bodies`);
      
      // 保存到数据库
      if (matches.length > 0) {
        await saveNotifiedBodiesToDB(matches);
      }
    }

    // 尝试获取JSON格式数据
    console.log('Trying alternative NANDO API...');
    const apiUrls = [
      'https://ec.europa.eu/growth/tools-databases/nando/api/notifiedbodies',
      'https://ec.europa.eu/growth/tools-databases/nando/api/data'
    ];
    
    for (const apiUrl of apiUrls) {
      try {
        const apiResponse = await fetchUrl(apiUrl, { timeout: 10000 });
        if (apiResponse.status === 200) {
          try {
            const jsonData = JSON.parse(apiResponse.data);
            results.apiData = jsonData;
            console.log(`  ✅ API data available`);
            break;
          } catch (e) {
            // 不是JSON格式
          }
        }
      } catch (e) {
        // API不可用
      }
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.error = error.message;
  }

  saveJson('nando-notified-bodies.json', results);
  console.log(`\n✅ NANDO collection complete: ${results.notifiedBodies.length} bodies`);
  return results;
}

function extractCountryFromName(name) {
  const countryPatterns = {
    'Germany': ['Germany', 'Deutschland', 'TÜV', 'DIN'],
    'France': ['France', 'AFNOR', 'LNE', 'INRS'],
    'Italy': ['Italy', 'Italia', 'UNI', 'IMQ'],
    'UK': ['UK', 'United Kingdom', 'BSI', 'Britain'],
    'Netherlands': ['Netherlands', 'Holland', 'NEN', 'Kema'],
    'Spain': ['Spain', 'España', 'AENOR'],
    'Belgium': ['Belgium', 'België', 'NBN'],
    'Sweden': ['Sweden', 'Sverige', 'SEK'],
    'Poland': ['Poland', 'Polska', 'PKN']
  };
  
  for (const [country, patterns] of Object.entries(countryPatterns)) {
    if (patterns.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
      return country;
    }
  }
  return 'Unknown';
}

async function saveNotifiedBodiesToDB(bodies) {
  try {
    const records = bodies.map(body => ({
      name: body.name,
      country: body.country,
      certification_body: `NB ${body.number}`,
      certification_number: body.number,
      status: 'active',
      source: 'NANDO',
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('ppe_manufacturers')
      .upsert(records, { onConflict: 'certification_number' });
    
    if (error) {
      console.log(`  DB Error: ${error.message}`);
    } else {
      console.log(`  💾 Saved ${records.length} notified bodies to database`);
    }
  } catch (e) {
    console.log(`  DB Save Error: ${e.message}`);
  }
}

// ==================== 4. 欧盟协调标准列表抓取 ====================

async function crawlEUHarmonizedStandards() {
  console.log('\n📚 === EU Harmonized Standards Collection ===\n');
  
  const results = {
    source: 'EU Harmonized Standards',
    regulation: 'EU 2016/425 (PPE)',
    timestamp: new Date().toISOString(),
    standards: []
  };

  try {
    // 欧盟协调标准页面
    console.log('Fetching harmonized standards list...');
    const stdUrl = 'https://single-market-economy.ec.europa.eu/single-market/european-standards/harmonised-standards/personal-protective-equipment_en';
    const response = await fetchUrl(stdUrl);
    
    if (response.status === 200) {
      const html = response.data;
      
      // 提取EN标准编号
      const enPattern = /EN\s*(\d{4,5})[-:]?(\d{4})?/g;
      const standards = new Set();
      let match;
      
      while ((match = enPattern.exec(html)) !== null) {
        const stdNum = match[1];
        const year = match[2] || '';
        standards.add(`EN ${stdNum}${year ? ':' + year : ''}`);
      }
      
      results.standards = Array.from(standards).slice(0, 200).map(std => ({
        standard_number: std,
        regulation: 'EU 2016/425',
        category: categorizeStandard(std),
        status: 'harmonized'
      }));
      
      console.log(`  Found ${results.standards.length} harmonized standards`);
      
      // 保存到数据库
      await saveStandardsToDB(results.standards);
    }

    // 尝试获取官方PDF列表
    console.log('Fetching official standards PDF...');
    const pdfUrls = [
      'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:02023D0941',
      'https://single-market-economy.ec.europa.eu/single-market/european-standards/harmonised-standards/personal-protective-equipment_en?format=pdf'
    ];
    
    for (const pdfUrl of pdfUrls) {
      try {
        const pdfResponse = await fetchUrl(pdfUrl, { timeout: 20000 });
        if (pdfResponse.status === 200 && pdfResponse.isBinary) {
          saveBinary('eu-ppe-standards-official.pdf', pdfResponse.data);
          console.log(`  ✅ Official PDF downloaded`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个
      }
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.error = error.message;
  }

  saveJson('eu-harmonized-standards.json', results);
  console.log(`\n✅ Standards collection complete: ${results.standards.length} standards`);
  return results;
}

function categorizeStandard(stdNum) {
  const num = parseInt(stdNum.match(/\d+/)?.[0] || '0');
  
  if (num >= 136 && num <= 140) return 'Head Protection';
  if (num >= 166 && num <= 175) return 'Eye and Face Protection';
  if (num >= 340 && num <= 352) return 'Foot and Leg Protection';
  if (num >= 420 && num <= 450) return 'Protective Clothing';
  if (num >= 460 && num <= 480) return 'Hand and Arm Protection';
  if (num >= 943 && num <= 949) return 'Chemical Protection';
  if (num >= 1080 && num <= 1096) return 'Fall Protection';
  if (num >= 1149 && num <= 1150) return 'Electrostatic Properties';
  if (num >= 1200 && num <= 1250) return 'Hearing Protection';
  if (num >= 14000 && num <= 15000) return 'High Visibility';
  if (num >= 20000 && num <= 21000) return 'Chemical and Biological';
  if (num >= 60000 && num <= 61000) return 'Respiratory Protection';
  
  return 'General';
}

async function saveStandardsToDB(standards) {
  try {
    const records = standards.map(std => ({
      standard_number: std.standard_number,
      regulation: std.regulation,
      category: std.category,
      status: std.status,
      source: 'EU Official Journal',
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('ppe_regulations')
      .upsert(records, { onConflict: 'standard_number' });
    
    if (error) {
      console.log(`  DB Error: ${error.message}`);
    } else {
      console.log(`  💾 Saved ${records.length} standards to database`);
    }
  } catch (e) {
    console.log(`  DB Save Error: ${e.message}`);
  }
}

// ==================== 5. EUDAMED 数据抓取 ====================

async function crawlEUDAMED() {
  console.log('\n🏥 === EUDAMED Data Collection ===\n');
  
  const results = {
    source: 'EUDAMED',
    timestamp: new Date().toISOString(),
    data: []
  };

  // EUDAMED公共端点
  const endpoints = [
    {
      name: 'Public Device Search',
      url: 'https://ec.europa.eu/tools/eudamed/public/devices-search'
    },
    {
      name: 'Actor Registration',
      url: 'https://ec.europa.eu/tools/eudamed/api/actors'
    },
    {
      name: 'Notified Bodies',
      url: 'https://ec.europa.eu/tools/eudamed/api/notifiedBodies'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`Trying: ${endpoint.name}`);
    try {
      const response = await fetchUrl(endpoint.url, { timeout: 20000 });
      
      if (response.status === 200) {
        try {
          const jsonData = JSON.parse(response.data);
          results.data.push({
            endpoint: endpoint.name,
            url: endpoint.url,
            status: 'success',
            recordCount: Array.isArray(jsonData) ? jsonData.length : 'N/A',
            sample: Array.isArray(jsonData) ? jsonData.slice(0, 3) : jsonData
          });
          console.log(`  ✅ Data retrieved`);
          
          // 如果是PPE相关数据，保存到数据库
          if (endpoint.name === 'Public Device Search' && Array.isArray(jsonData)) {
            await saveEUDAMEDDevicesToDB(jsonData);
          }
        } catch (e) {
          results.data.push({
            endpoint: endpoint.name,
            url: endpoint.url,
            status: 'html_response',
            preview: response.data.substring(0, 500)
          });
          console.log(`  ⚠️ HTML response (not JSON)`);
        }
      } else {
        console.log(`  ⚠️ Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  saveJson('eudamed-data.json', results);
  console.log(`\n✅ EUDAMED collection complete`);
  return results;
}

async function saveEUDAMEDDevicesToDB(devices) {
  try {
    const ppeKeywords = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe'];
    
    const ppeDevices = devices
      .filter(d => {
        const name = (d.deviceName || d.name || '').toLowerCase();
        return ppeKeywords.some(k => name.includes(k));
      })
      .map(d => ({
        name: d.deviceName || d.name || 'Unknown',
        model: d.model || d.productCode || '',
        manufacturer: d.manufacturerName || d.manufacturer || '',
        country: d.country || 'EU',
        certification_body: d.notifiedBody || '',
        source: 'EUDAMED',
        updated_at: new Date().toISOString()
      }));
    
    if (ppeDevices.length > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .upsert(ppeDevices, { onConflict: 'name' });
      
      if (error) {
        console.log(`  DB Error: ${error.message}`);
      } else {
        console.log(`  💾 Saved ${ppeDevices.length} EUDAMED devices to database`);
      }
    }
  } catch (e) {
    console.log(`  DB Save Error: ${e.message}`);
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  Unified PPE Data Crawler');
  console.log('  Collecting data from multiple authoritative sources');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();
  const allResults = {};

  try {
    // 1. PPE-INFO
    allResults.ppeInfo = await crawlPPEInfo();
  } catch (e) {
    console.log(`PPE-INFO failed: ${e.message}`);
  }

  try {
    // 2. PPE_RFU
    allResults.ppeRFU = await crawlPPERFU();
  } catch (e) {
    console.log(`PPE_RFU failed: ${e.message}`);
  }

  try {
    // 3. NANDO
    allResults.nando = await crawlNANDO();
  } catch (e) {
    console.log(`NANDO failed: ${e.message}`);
  }

  try {
    // 4. EU Harmonized Standards
    allResults.euStandards = await crawlEUHarmonizedStandards();
  } catch (e) {
    console.log(`EU Standards failed: ${e.message}`);
  }

  try {
    // 5. EUDAMED
    allResults.eudamed = await crawlEUDAMED();
  } catch (e) {
    console.log(`EUDAMED failed: ${e.message}`);
  }

  // 保存汇总报告
  const summary = {
    crawlDate: new Date().toISOString(),
    duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
    dataDirectory: DATA_DIR,
    results: {
      ppeInfo: allResults.ppeInfo ? 'completed' : 'failed',
      ppeRFU: allResults.ppeRFU ? `${allResults.ppeRFU.documents?.filter(d => d.status === 'downloaded').length || 0} documents` : 'failed',
      nando: allResults.nando ? `${allResults.nando.notifiedBodies?.length || 0} bodies` : 'failed',
      euStandards: allResults.euStandards ? `${allResults.euStandards.standards?.length || 0} standards` : 'failed',
      eudamed: allResults.eudamed ? 'completed' : 'failed'
    }
  };

  saveJson('crawl-summary.json', summary);

  console.log('\n' + '='.repeat(60));
  console.log('  Crawl Summary');
  console.log('='.repeat(60));
  console.log(`Duration: ${summary.duration}`);
  console.log(`Data saved to: ${DATA_DIR}`);
  console.log('\nResults:');
  Object.entries(summary.results).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
