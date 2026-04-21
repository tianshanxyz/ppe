#!/usr/bin/env node

/**
 * PPE_RFU 文档增强抓取脚本
 * 抓取欧盟PPE公告机构协调组织的所有RFU文档
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const DATA_DIR = path.join(__dirname, '..', 'data', 'crawled', 'rfu');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf, application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve({ redirect: res.headers.location, status: res.statusCode });
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        resolve({
          data: buffer,
          status: res.statusCode,
          contentType,
          isPdf: contentType.includes('application/pdf')
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// RFU文档完整列表
const RFU_DOCUMENTS = {
  horizontal: [
    {
      id: 'PPE-R-00.006',
      title: 'General Requirements for Notified Bodies',
      description: '公告机构的一般要求',
      url: 'https://www.ppe-rfu.eu/ppedownload?id=13e44453-68b9-4516-bc0e-4fea367d2daf',
      version: '2024',
      mandatory: true
    },
    {
      id: 'PPE-R-00.007',
      title: 'Module C2 - Internal Production Control Plus Supervised Product Checks',
      description: '内部生产控制加监督产品检查',
      url: 'https://www.ppe-rfu.eu/ppedownload?id=horizontal-rfu-007',
      version: '2024',
      mandatory: true
    },
    {
      id: 'PPE-R-00.008',
      title: 'Module D - Quality Assurance of the Production Process',
      description: '生产过程质量保证',
      url: 'https://www.ppe-rfu.eu/ppedownload?id=horizontal-rfu-008',
      version: '2024',
      mandatory: true
    }
  ],
  vertical: [
    {
      id: 'VG1-R-01',
      title: 'Head Protection - Industrial Safety Helmets',
      description: '头部防护-工业安全帽',
      url: 'https://ppe-rfu.eu/ppedownload?id=851afa0b-e179-4be0-8983-089658dcf87d',
      group: 'Vertical Group 1',
      category: 'Head Protection',
      standards: ['EN 397', 'EN 14052']
    },
    {
      id: 'VG1-R-02',
      title: 'Head Protection - High Performance Industrial Helmets',
      description: '头部防护-高性能工业头盔',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg1-r-02',
      group: 'Vertical Group 1',
      category: 'Head Protection',
      standards: ['EN 14052']
    },
    {
      id: 'VG2-R-01',
      title: 'Eye and Face Protection - Specifications',
      description: '眼面部防护-规范',
      url: 'https://www.ppe-rfu.eu/ppedownload?id=b3ab4253-6d7c-48ae-940c-58eef911ff95',
      group: 'Vertical Group 2',
      category: 'Eye and Face Protection',
      standards: ['EN 166', 'EN 167', 'EN 168']
    },
    {
      id: 'VG2-R-02',
      title: 'Eye and Face Protection - Filters for Welding',
      description: '眼面部防护-焊接滤光片',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg2-r-02',
      group: 'Vertical Group 2',
      category: 'Eye and Face Protection',
      standards: ['EN 169', 'EN 175']
    },
    {
      id: 'VG3-R-01',
      title: 'Hearing Protection - Ear Muffs',
      description: '听力防护-耳罩',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg3-r-01',
      group: 'Vertical Group 3',
      category: 'Hearing Protection',
      standards: ['EN 352-1']
    },
    {
      id: 'VG3-R-02',
      title: 'Hearing Protection - Ear Plugs',
      description: '听力防护-耳塞',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg3-r-02',
      group: 'Vertical Group 3',
      category: 'Hearing Protection',
      standards: ['EN 352-2']
    },
    {
      id: 'VG4-R-01',
      title: 'Foot and Leg Protection - Safety Footwear',
      description: '足腿防护-安全鞋',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg4-r-01',
      group: 'Vertical Group 4',
      category: 'Foot and Leg Protection',
      standards: ['EN ISO 20345']
    },
    {
      id: 'VG4-R-02',
      title: 'Foot and Leg Protection - Protective Footwear',
      description: '足腿防护-防护鞋',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg4-r-02',
      group: 'Vertical Group 4',
      category: 'Foot and Leg Protection',
      standards: ['EN ISO 20346']
    },
    {
      id: 'VG5-R-01',
      title: 'Hand and Arm Protection - Protective Gloves',
      description: '手部和臂部防护-防护手套',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg5-r-01',
      group: 'Vertical Group 5',
      category: 'Hand and Arm Protection',
      standards: ['EN 388', 'EN 420']
    },
    {
      id: 'VG6-R-01',
      title: 'Protective Clothing - General Requirements',
      description: '防护服-一般要求',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg6-r-01',
      group: 'Vertical Group 6',
      category: 'Protective Clothing',
      standards: ['EN 13688']
    },
    {
      id: 'VG6-R-02',
      title: 'Protective Clothing - Chemical Protection',
      description: '防护服-化学防护',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg6-r-02',
      group: 'Vertical Group 6',
      category: 'Protective Clothing',
      standards: ['EN 943', 'EN 14605']
    },
    {
      id: 'VG7-R-01',
      title: 'Respiratory Protection - Filtering Devices',
      description: '呼吸防护-过滤装置',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg7-r-01',
      group: 'Vertical Group 7',
      category: 'Respiratory Protection',
      standards: ['EN 149', 'EN 143']
    },
    {
      id: 'VG8-R-01',
      title: 'Fall Protection - Harnesses',
      description: '防坠落防护-安全带',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg8-r-01',
      group: 'Vertical Group 8',
      category: 'Fall Protection',
      standards: ['EN 361', 'EN 358']
    },
    {
      id: 'VG9-R-01',
      title: 'Drowning Protection - Lifejackets',
      description: '溺水防护-救生衣',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg9-r-01',
      group: 'Vertical Group 9',
      category: 'Drowning Protection',
      standards: ['EN 12402']
    },
    {
      id: 'VG10-R-01',
      title: 'Electrical Protection - Insulating Gloves',
      description: '电气防护-绝缘手套',
      url: 'https://ppe-rfu.eu/ppedownload?id=vg10-r-01',
      group: 'Vertical Group 10',
      category: 'Electrical Protection',
      standards: ['EN 60903']
    }
  ],
  guidelines: [
    {
      id: 'GUIDE-2016-425',
      title: 'Guide to Application of Regulation (EU) 2016/425',
      description: 'PPE法规2016/425应用指南',
      url: 'https://eurogip.fr/wp-content/uploads/2021/09/ppe-vertical-rfu_Reglement_en_2025-05.pdf',
      type: 'regulatory_guide',
      language: 'English',
      year: 2025
    },
    {
      id: 'BLUE-GUIDE',
      title: 'Blue Guide on the Implementation of EU Product Rules',
      description: '欧盟产品规则实施蓝皮书',
      url: 'https://single-market-economy.ec.europa.eu/single-market/goods/building-blocks/blue-guide_en',
      type: 'regulatory_guide',
      language: 'English',
      year: 2022
    }
  ]
};

async function downloadDocument(doc) {
  console.log(`\n📄 Downloading: ${doc.id} - ${doc.title}`);
  
  try {
    const response = await fetchUrl(doc.url, { timeout: 30000 });
    
    if (response.status === 200) {
      const ext = response.isPdf ? 'pdf' : 'html';
      const filename = `${doc.id}.${ext}`;
      const filepath = path.join(DATA_DIR, filename);
      
      fs.writeFileSync(filepath, response.data);
      
      const fileSize = (response.data.length / 1024).toFixed(2);
      console.log(`  ✅ Saved: ${filename} (${fileSize} KB)`);
      
      // 保存元数据
      const metadata = {
        ...doc,
        filename,
        fileSize: `${fileSize} KB`,
        downloadedAt: new Date().toISOString(),
        contentType: response.contentType
      };
      
      fs.writeFileSync(
        path.join(DATA_DIR, `${doc.id}.json`),
        JSON.stringify(metadata, null, 2)
      );
      
      // 保存到数据库
      await saveToDatabase(metadata);
      
      return { success: true, filename, metadata };
    } else if (response.redirect) {
      console.log(`  🔄 Redirect to: ${response.redirect}`);
      return { success: false, redirect: response.redirect };
    } else {
      console.log(`  ⚠️ HTTP ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function saveToDatabase(metadata) {
  try {
    const record = {
      document_id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      category: metadata.category || metadata.group || 'General',
      document_type: metadata.group ? 'Vertical RFU' : (metadata.mandatory ? 'Horizontal RFU' : 'Guideline'),
      standards_referenced: metadata.standards || [],
      source_url: metadata.url,
      filename: metadata.filename,
      version: metadata.version || metadata.year?.toString(),
      language: metadata.language || 'English',
      status: 'active',
      downloaded_at: metadata.downloadedAt,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('ppe_regulations')
      .upsert(record, { onConflict: 'document_id' });
    
    if (error) {
      console.log(`  DB Warning: ${error.message}`);
    } else {
      console.log(`  💾 Saved to database`);
    }
  } catch (e) {
    console.log(`  DB Error: ${e.message}`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  PPE_RFU Enhanced Document Crawler');
  console.log('  Downloading official EU PPE Recommendation for Use documents');
  console.log('='.repeat(70) + '\n');
  
  const results = {
    horizontal: [],
    vertical: [],
    guidelines: [],
    failed: []
  };
  
  // 下载Horizontal RFU文档
  console.log('\n📋 Horizontal RFU Documents:');
  console.log('-'.repeat(70));
  for (const doc of RFU_DOCUMENTS.horizontal) {
    const result = await downloadDocument(doc);
    if (result.success) {
      results.horizontal.push(result);
    } else {
      results.failed.push({ doc, result });
    }
  }
  
  // 下载Vertical RFU文档
  console.log('\n📋 Vertical RFU Documents:');
  console.log('-'.repeat(70));
  for (const doc of RFU_DOCUMENTS.vertical) {
    const result = await downloadDocument(doc);
    if (result.success) {
      results.vertical.push(result);
    } else {
      results.failed.push({ doc, result });
    }
  }
  
  // 下载指南文档
  console.log('\n📋 Guidelines and Regulatory Documents:');
  console.log('-'.repeat(70));
  for (const doc of RFU_DOCUMENTS.guidelines) {
    const result = await downloadDocument(doc);
    if (result.success) {
      results.guidelines.push(result);
    } else {
      results.failed.push({ doc, result });
    }
  }
  
  // 保存汇总报告
  const summary = {
    crawlDate: new Date().toISOString(),
    totalDocuments: RFU_DOCUMENTS.horizontal.length + RFU_DOCUMENTS.vertical.length + RFU_DOCUMENTS.guidelines.length,
    downloaded: {
      horizontal: results.horizontal.length,
      vertical: results.vertical.length,
      guidelines: results.guidelines.length,
      total: results.horizontal.length + results.vertical.length + results.guidelines.length
    },
    failed: results.failed.length,
    dataDirectory: DATA_DIR,
    documents: [
      ...results.horizontal.map(r => r.metadata),
      ...results.vertical.map(r => r.metadata),
      ...results.guidelines.map(r => r.metadata)
    ]
  };
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'rfu-collection-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n' + '='.repeat(70));
  console.log('  Collection Summary');
  console.log('='.repeat(70));
  console.log(`Total Documents: ${summary.totalDocuments}`);
  console.log(`Successfully Downloaded: ${summary.downloaded.total}`);
  console.log(`  - Horizontal RFU: ${summary.downloaded.horizontal}`);
  console.log(`  - Vertical RFU: ${summary.downloaded.vertical}`);
  console.log(`  - Guidelines: ${summary.downloaded.guidelines}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`\nData saved to: ${DATA_DIR}`);
  console.log('='.repeat(70) + '\n');
  
  // 显示失败的文档
  if (results.failed.length > 0) {
    console.log('⚠️  Failed downloads:');
    results.failed.forEach(({ doc, result }) => {
      console.log(`  - ${doc.id}: ${result.error || result.status || 'Unknown error'}`);
    });
    console.log('');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
