#!/usr/bin/env node

/**
 * 全球PPE监管数据爬虫
 * 1. UK MHRA PARD - 公共访问注册数据库
 * 2. Korea MFDS - 医疗器械安全信息/开放数据门户
 * 3. Brazil ANVISA - 开放数据CSV + 咨询API
 */

const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8,pt-BR;q=0.7,pt;q=0.6',
          'Accept-Encoding': 'gzip, deflate, br',
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        console.log(`    Rate limited, waiting 60s...`);
        await sleep(60000);
        continue;
      }

      if (response.status === 403) {
        console.log(`    403 Forbidden: ${url}`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (e) {
      if (i === retries) {
        console.log(`    Failed after ${retries} retries: ${e.message}`);
        return null;
      }
      await sleep(3000 * (i + 1));
    }
  }
  return null;
}

// PPE关键词映射
const PPE_KEYWORDS = {
  mask: { category: '呼吸防护装备', sub: 'Mask', risk: 'high' },
  respirator: { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  glove: { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  gown: { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  shield: { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  goggle: { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  cap: { category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
  hood: { category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
  coverall: { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  apron: { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  overshoe: { category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
  mascara: { category: '呼吸防护装备', sub: 'Mask', risk: 'high' },
  luva: { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  avental: { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  protetor: { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  보호마스크: { category: '呼吸防护装备', sub: 'Mask', risk: 'high' },
  마스크: { category: '呼吸防护装备', sub: 'Mask', risk: 'high' },
  장갑: { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  보호복: { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  보호구: { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  면갑: { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
};

function classifyPPE(text) {
  const lower = text.toLowerCase();
  for (const [keyword, info] of Object.entries(PPE_KEYWORDS)) {
    if (lower.includes(keyword.toLowerCase())) {
      return info;
    }
  }
  return { category: '其他', sub: 'Other', risk: 'medium' };
}

async function insertProduct(productData) {
  const { error } = await supabase
    .from('ppe_products')
    .insert(productData);
  return !error;
}

async function insertManufacturer(name, country, website = '') {
  if (!name || name === 'Unknown') return;
  await supabase
    .from('ppe_manufacturers')
    .insert({ name, country, website }, { onConflict: 'name' });
}

// ==================== 1. UK MHRA PARD 爬虫 ====================
async function crawlUKMHRA() {
  console.log('\n=== UK MHRA PARD 爬虫 ===\n');
  let totalProducts = 0;

  // MHRA PARD 搜索端点
  // PARD支持按GMDN代码和设备类型搜索
  // GMDN PPE相关代码:
  // 35226 - Surgical mask
  // 35227 - Respiratory mask
  // 37246 - Examination glove
  // 47647 - Surgical glove
  // 47524 - Surgical gown
  // 35228 - Protective face shield
  // 40980 - Protective eyewear

  const gmdnCodes = [
    { code: '35226', name: 'Surgical mask' },
    { code: '35227', name: 'Respiratory mask' },
    { code: '37246', name: 'Examination glove' },
    { code: '47647', name: 'Surgical glove' },
    { code: '47524', name: 'Surgical gown' },
    { code: '35228', name: 'Protective face shield' },
    { code: '40980', name: 'Protective eyewear' },
    { code: '47523', name: 'Isolation gown' },
    { code: '37245', name: 'Protective glove' },
    { code: '35225', name: 'Respirator' },
    { code: '47525', name: 'Protective clothing' },
    { code: '37247', name: 'Nitrile glove' },
    { code: '40981', name: 'Safety goggle' },
    { code: '47526', name: 'Surgical cap' },
    { code: '47527', name: 'Shoe cover' },
  ];

  // 尝试PARD搜索API
  const pardSearchTerms = [
    'surgical mask', 'respirator', 'examination glove', 'surgical glove',
    'face shield', 'isolation gown', 'protective gown', 'safety goggle',
    'surgical cap', 'nitrile glove', 'protective clothing', 'shoe cover',
    'N95', 'FFP2', 'FFP3', 'coverall', 'bouffant cap',
  ];

  for (const term of pardSearchTerms) {
    console.log(`  搜索: "${term}"`);

    // PARD搜索URL (尝试多种端点)
    const urls = [
      `https://pard.mhra.gov.uk/search?searchTerm=${encodeURIComponent(term)}&searchType=device`,
      `https://aic.mhra.gov.uk/era/pdr.nsf/search?openagent&searchterm=${encodeURIComponent(term)}`,
    ];

    for (const url of urls) {
      try {
        const response = await fetchWithRetry(url, { timeout: 20000 });
        if (!response) continue;

        const contentType = response.headers.get('content-type') || '';
        let text = '';

        if (contentType.includes('json')) {
          const data = await response.json();
          // 处理JSON响应
          const results = data.results || data.items || data.data || [];
          for (const item of results) {
            const deviceName = item.deviceName || item.device_name || item.name || term;
            const mfrName = item.manufacturerName || item.manufacturer_name || item.company_name || 'Unknown';
            const classification = item.classification || item.riskClass || '';

            const info = classifyPPE(deviceName);

            await insertManufacturer(mfrName, 'GB');

            const productData = {
              name: deviceName,
              category: info.category,
              subcategory: info.sub,
              risk_level: info.risk,
              manufacturer_name: mfrName,
              country_of_origin: 'GB',
              model: `MHRA-${item.reference || item.id || Date.now()}`,
              description: `UK MHRA PARD Registered\nDevice: ${deviceName}\nManufacturer: ${mfrName}\nClassification: ${classification}\nSource: MHRA PARD`,
              certifications: JSON.stringify([{ type: 'MHRA PARD Registration', status: 'active' }]),
              status: 'approved',
            };

            if (await insertProduct(productData)) totalProducts++;
          }
        } else {
          // 处理HTML响应
          text = await response.text();
          const $ = cheerio.load(text);

          // 尝试多种HTML结构
          const rows = $('table tr, .search-result, .device-result, .result-item, [data-device]');
          if (rows.length > 0) {
            rows.each((i, el) => {
              const deviceName = $(el).find('.device-name, .name, td:nth-child(1)').text().trim() || term;
              const mfrName = $(el).find('.manufacturer, .company, td:nth-child(2)').text().trim() || 'Unknown';

              const info = classifyPPE(deviceName);
              if (info.category === '其他') return;

              insertManufacturer(mfrName, 'GB');

              const productData = {
                name: deviceName,
                category: info.category,
                subcategory: info.sub,
                risk_level: info.risk,
                manufacturer_name: mfrName,
                country_of_origin: 'GB',
                model: `MHRA-${Date.now()}-${i}`,
                description: `UK MHRA PARD Registered\nDevice: ${deviceName}\nManufacturer: ${mfrName}\nSource: MHRA PARD`,
                certifications: JSON.stringify([{ type: 'MHRA PARD Registration', status: 'active' }]),
                status: 'approved',
              };

              insertProduct(productData).then(ok => { if (ok) totalProducts++; });
            });
          }
        }

        console.log(`    URL: ${url.substring(0, 60)}... → ${totalProducts} 条`);
        await sleep(2000);
      } catch (e) {
        console.log(`    跳过: ${e.message}`);
      }
    }
  }

  // 备用: 尝试MHRA旧版AIC数据库
  console.log('\n  尝试MHRA AIC旧版数据库...');
  const aicUrls = [
    'https://aic.mhra.gov.uk/era/pdr.nsf/devicecode?openpage&RestrictToCategory=Surgical%20mask',
    'https://aic.mhra.gov.uk/era/pdr.nsf/devicecode?openpage&RestrictToCategory=Examination%20glove',
    'https://aic.mhra.gov.uk/era/pdr.nsf/devicecode?openpage&RestrictToCategory=Surgical%20gown',
    'https://aic.mhra.gov.uk/era/pdr.nsf/devicecode?openpage&RestrictToCategory=Face%20shield',
  ];

  for (const url of aicUrls) {
    try {
      const response = await fetchWithRetry(url, { timeout: 20000 });
      if (!response) continue;

      const text = await response.text();
      const $ = cheerio.load(text);

      // 解析设备列表
      $('table tr').each((i, el) => {
        const cells = $(el).find('td');
        if (cells.length >= 2) {
          const deviceName = $(cells[0]).text().trim();
          const mfrName = $(cells[1]).text().trim() || 'Unknown';

          if (!deviceName || deviceName.length < 3) return;

          const info = classifyPPE(deviceName);
          if (info.category === '其他') return;

          insertManufacturer(mfrName, 'GB');

          const productData = {
            name: deviceName,
            category: info.category,
            subcategory: info.sub,
            risk_level: info.risk,
            manufacturer_name: mfrName,
            country_of_origin: 'GB',
            model: `MHRA-AIC-${Date.now()}-${i}`,
            description: `UK MHRA AIC Registered\nDevice: ${deviceName}\nManufacturer: ${mfrName}\nSource: MHRA AIC`,
            certifications: JSON.stringify([{ type: 'MHRA Registration', status: 'active' }]),
            status: 'approved',
          };

          insertProduct(productData).then(ok => { if (ok) totalProducts++; });
        }
      });

      await sleep(3000);
    } catch (e) {
      console.log(`    AIC跳过: ${e.message}`);
    }
  }

  console.log(`  ✅ UK MHRA采集: ${totalProducts.toLocaleString()} 条`);
  return totalProducts;
}

// ==================== 2. Korea MFDS 爬虫 ====================
async function crawlKoreaMFDS() {
  console.log('\n=== Korea MFDS 爬虫 ===\n');
  let totalProducts = 0;

  // 韩国MFDS医疗器械搜索 - nedrug.mfds.go.kr
  // 搜索PPE相关医疗器械

  const searchTerms = [
    { term: '마스크', name: 'Mask' },
    { term: '보호마스크', name: 'Protective Mask' },
    { term: '의료용마스크', name: 'Medical Mask' },
    { term: '장갑', name: 'Glove' },
    { term: '의료용장갑', name: 'Medical Glove' },
    { term: '보호복', name: 'Protective Clothing' },
    { term: '보호구', name: 'Protective Equipment' },
    { term: '면갑', name: 'Face Shield' },
    { term: '안전고글', name: 'Safety Goggle' },
    { term: '수술모', name: 'Surgical Cap' },
    { term: '수술가운', name: 'Surgical Gown' },
    { term: '호흡보호구', name: 'Respiratory Protection' },
  ];

  // 尝试nedrug搜索API
  for (const { term, name } of searchTerms) {
    console.log(`  搜索: "${term}" (${name})`);

    const urls = [
      `https://nedrug.mfds.go.kr/pbp/CCBCC01/getList?totalRows=100&limit=100&page=1&searchValue=${encodeURIComponent(term)}`,
      `https://nedrug.mfds.go.kr/pbp/CCBCC01/getList?totalRows=100&limit=100&page=1&searchValue=${encodeURIComponent(term)}&searchType=1`,
      `https://data.mfds.go.kr/openapi/service/MedicalDeviceService/getMedicalDeviceList?serviceKey=&pageNo=1&numOfRows=100&itemName=${encodeURIComponent(term)}&_type=json`,
    ];

    for (const url of urls) {
      try {
        const response = await fetchWithRetry(url, { timeout: 20000 });
        if (!response) continue;

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('json')) {
          const data = await response.json();
          const items = data.response?.body?.items?.item || data.items || data.data || [];

          const itemList = Array.isArray(items) ? items : [items];

          for (const item of itemList) {
            const itemName = item.ITEM_NAME || item.itemName || item.item_name || name;
            const entpName = item.ENTP_NAME || item.entpName || item.entp_name || 'Unknown';
            const itemSeq = item.ITEM_SEQ || item.itemSeq || item.item_seq || '';
            const itemPermitDate = item.ITEM_PERMIT_DATE || item.itemPermitDate || '';
            const className = item.CLASS_NAME || item.className || '';

            const info = classifyPPE(itemName);

            await insertManufacturer(entpName, 'KR');

            const productData = {
              name: itemName,
              category: info.category,
              subcategory: info.sub,
              risk_level: info.risk,
              manufacturer_name: entpName,
              country_of_origin: 'KR',
              product_code: itemSeq || undefined,
              model: `MFDS-${itemSeq || Date.now()}`,
              description: `Korea MFDS Registered\nProduct: ${itemName}\nManufacturer: ${entpName}\nClass: ${className}\nPermit Date: ${itemPermitDate}\nSource: MFDS NEDRUG`,
              certifications: JSON.stringify([{ type: 'MFDS Registration', number: itemSeq, status: 'active', date: itemPermitDate }]),
              status: 'approved',
            };

            if (await insertProduct(productData)) totalProducts++;
          }
        } else {
          // HTML响应 - 解析表格
          const text = await response.text();
          const $ = cheerio.load(text);

          // 尝试多种HTML结构
          const rows = $('table tbody tr, .board_list tr, #content tr');
          rows.each((i, el) => {
            const cells = $(el).find('td');
            if (cells.length >= 3) {
              const itemName = $(cells[1]).text().trim() || name;
              const entpName = $(cells[2]).text().trim() || 'Unknown';
              const permitDate = cells.length > 3 ? $(cells[3]).text().trim() : '';

              const info = classifyPPE(itemName);
              if (info.category === '其他') return;

              insertManufacturer(entpName, 'KR');

              const productData = {
                name: itemName,
                category: info.category,
                subcategory: info.sub,
                risk_level: info.risk,
                manufacturer_name: entpName,
                country_of_origin: 'KR',
                model: `MFDS-${Date.now()}-${i}`,
                description: `Korea MFDS Registered\nProduct: ${itemName}\nManufacturer: ${entpName}\nPermit Date: ${permitDate}\nSource: MFDS NEDRUG`,
                certifications: JSON.stringify([{ type: 'MFDS Registration', status: 'active', date: permitDate }]),
                status: 'approved',
              };

              insertProduct(productData).then(ok => { if (ok) totalProducts++; });
            }
          });
        }

        console.log(`    → ${totalProducts} 条`);
        await sleep(2000);
      } catch (e) {
        console.log(`    跳过: ${e.message}`);
      }
    }
  }

  // 备用: Korea MFDS 医疗器械安心搜索
  console.log('\n  尝试MFDS医疗器械安心搜索...');
  const safeSearchTerms = ['마스크', '장갑', '보호복', '면갑'];

  for (const term of safeSearchTerms) {
    try {
      const url = `https://emedi.mfds.go.kr/cs/ME/ME01/search?searchWord=${encodeURIComponent(term)}&pageNo=1&pageSize=100`;
      const response = await fetchWithRetry(url, { timeout: 20000 });
      if (!response) continue;

      const text = await response.text();
      const $ = cheerio.load(text);

      $('table tbody tr, .result-list .item').each((i, el) => {
        const itemName = $(el).find('.device-name, td:nth-child(2)').text().trim();
        const entpName = $(el).find('.company-name, td:nth-child(3)').text().trim() || 'Unknown';

        if (!itemName) return;

        const info = classifyPPE(itemName);
        if (info.category === '其他') return;

        insertManufacturer(entpName, 'KR');

        const productData = {
          name: itemName,
          category: info.category,
          subcategory: info.sub,
          risk_level: info.risk,
          manufacturer_name: entpName,
          country_of_origin: 'KR',
          model: `MFDS-SAFE-${Date.now()}-${i}`,
          description: `Korea MFDS Medical Device Safety Search\nProduct: ${itemName}\nManufacturer: ${entpName}\nSource: MFDS eMedi`,
          certifications: JSON.stringify([{ type: 'MFDS Registration', status: 'active' }]),
          status: 'approved',
        };

        insertProduct(productData).then(ok => { if (ok) totalProducts++; });
      });

      await sleep(2000);
    } catch (e) {
      console.log(`    安心搜索跳过: ${e.message}`);
    }
  }

  console.log(`  ✅ Korea MFDS采集: ${totalProducts.toLocaleString()} 条`);
  return totalProducts;
}

// ==================== 3. Brazil ANVISA 爬虫 ====================
async function crawlBrazilANVISA() {
  console.log('\n=== Brazil ANVISA 爬虫 ===\n');
  let totalProducts = 0;

  // 策略1: 下载ANVISA开放数据CSV
  console.log('策略1: 下载ANVISA开放数据');

  const csvUrls = [
    'https://dados.anvisa.gov.br/dados/TA_PRODUTO_SAUDE_MODELO.txt',
    'https://dados.anvisa.gov.br/dados/TA_PRODUTO_SAUDE_PETICAO.txt',
    'https://dados.anvisa.gov.br/dados/CONSULTAS/EMPRESA_FISCALIZACAO_PRODUTO/TA_CONSULTA_PRODUTO_SAUDE_DETALHE.CSV',
  ];

  for (const csvUrl of csvUrls) {
    console.log(`  下载: ${csvUrl.split('/').pop()}`);

    try {
      const response = await fetchWithRetry(csvUrl, { timeout: 60000 });
      if (!response) continue;

      const text = await response.text();
      const lines = text.split('\n');

      if (lines.length < 2) {
        console.log(`    空文件或格式错误`);
        continue;
      }

      // 解析CSV/TSV
      const separator = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
      const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));

      console.log(`    列: ${headers.slice(0, 10).join(', ')}...`);
      console.log(`    总行数: ${lines.length.toLocaleString()}`);

      // PPE关键词过滤
      const ppeKeywords = [
        'mascara', 'máscara', 'luva', 'avental', 'protetor', 'face shield',
        'goggle', 'cap', 'hood', 'coverall', 'respirador', 'respirat',
        'proteção', 'protecao', 'epi', 'epc', 'descartável', 'descartavel',
        'cirurgica', 'cirúrgica', 'exame', 'nitrilica', 'nitrílica',
        'latex', 'látex', 'isolamento', 'esteril', 'procedimento',
      ];

      let ppeCount = 0;
      const batchSize = 500;
      let batch = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        // 检查是否是PPE产品
        const searchText = `${row.NOME_TECNICO || ''} ${row.NOME_COMERCIAL || ''} ${row.CATEGORIA || ''} ${row.TIPO || ''} ${row.PRODUTO || ''} ${row.NOME || ''}`.toLowerCase();

        const isPPE = ppeKeywords.some(kw => searchText.includes(kw));

        if (!isPPE) continue;

        ppeCount++;

        // 提取产品信息
        const productName = row.NOME_TECNICO || row.NOME_COMERCIAL || row.PRODUTO || row.NOME || 'PPE Device';
        const mfrName = row.RAZAO_SOCIAL || row.NOME_FANTASIA || row.EMPRESA || row.FABRICANTE || 'Unknown';
        const regNumber = row.NUMERO_REGISTRO || row.NUM_REGISTRO || row.REGISTRO || '';
        const country = row.PAIS_FABRICACAO || row.PAIS || 'BR';

        const info = classifyPPE(productName);

        await insertManufacturer(mfrName, country || 'BR');

        const productData = {
          name: productName.substring(0, 500),
          category: info.category,
          subcategory: info.sub,
          risk_level: info.risk,
          manufacturer_name: mfrName,
          country_of_origin: country || 'BR',
          product_code: row.CODIGO || row.PRODUCT_CODE || undefined,
          model: `ANVISA-${regNumber || Date.now()}-${i}`,
          description: `Brazil ANVISA Registered\nProduct: ${productName}\nManufacturer: ${mfrName}\nRegistration: ${regNumber}\nCategory: ${row.CATEGORIA || ''}\nSource: ANVISA Open Data`,
          certifications: JSON.stringify([{ type: 'ANVISA Registration', number: regNumber, status: 'active' }]),
          status: 'approved',
        };

        batch.push(productData);

        if (batch.length >= batchSize) {
          const { error } = await supabase
            .from('ppe_products')
            .insert(batch);
          if (!error) totalProducts += batch.length;
          batch = [];
          console.log(`    进度: ${ppeCount} PPE产品, 已入库 ${totalProducts}`);
        }
      }

      // 插入剩余批次
      if (batch.length > 0) {
        const { error } = await supabase
          .from('ppe_products')
          .insert(batch);
        if (!error) totalProducts += batch.length;
      }

      console.log(`    PPE产品: ${ppeCount}, 已入库: ${totalProducts}`);
    } catch (e) {
      console.log(`    下载失败: ${e.message}`);
    }
  }

  // 策略2: ANVISA咨询API
  console.log('\n策略2: ANVISA咨询API');

  const apiSearchTerms = [
    'mascara cirurgica', 'luva de exame', 'avental hospitalar',
    'protetor facial', 'respirador', 'mascara n95', 'luva nitrilica',
    'capote cirurgico', 'protecao ocular', 'macacao',
  ];

  for (const term of apiSearchTerms) {
    console.log(`  搜索: "${term}"`);

    const urls = [
      `https://consultas.anvisa.gov.br/api/consulta/produtos?filter[nome]=${encodeURIComponent(term)}&page=1&size=100`,
      `https://consultas.anvisa.gov.br/api/consulta/registrados?filter[nome]=${encodeURIComponent(term)}&page=1&size=100`,
    ];

    for (const url of urls) {
      try {
        const response = await fetchWithRetry(url, {
          timeout: 20000,
          headers: {
            'Authorization': 'Guest',
            'Accept': 'application/json',
          },
        });

        if (!response) continue;

        const data = await response.json();
        const items = data.content || data.results || data.items || data.data || [];

        for (const item of items) {
          const productName = item.nomeTecnico || item.nomeComercial || item.nome || term;
          const mfrName = item.razaoSocial || item.empresa || item.fabricante || 'Unknown';
          const regNumber = item.numeroRegistro || item.registro || '';
          const country = item.paisFabricacao || item.pais || 'BR';

          const info = classifyPPE(productName);

          await insertManufacturer(mfrName, country);

          const productData = {
            name: productName.substring(0, 500),
            category: info.category,
            subcategory: info.sub,
            risk_level: info.risk,
            manufacturer_name: mfrName,
            country_of_origin: country,
            product_code: item.codigo || undefined,
            model: `ANVISA-API-${regNumber || Date.now()}`,
            description: `Brazil ANVISA API\nProduct: ${productName}\nManufacturer: ${mfrName}\nRegistration: ${regNumber}\nSource: ANVISA Consultas API`,
            certifications: JSON.stringify([{ type: 'ANVISA Registration', number: regNumber, status: 'active' }]),
            status: 'approved',
          };

          if (await insertProduct(productData)) totalProducts++;
        }

        console.log(`    → ${totalProducts} 条`);
        await sleep(3000);
      } catch (e) {
        console.log(`    API跳过: ${e.message}`);
      }
    }
  }

  console.log(`  ✅ Brazil ANVISA采集: ${totalProducts.toLocaleString()} 条`);
  return totalProducts;
}

// ==================== 主函数 ====================
async function main() {
  console.log('============================================================');
  console.log('  全球PPE监管数据爬虫');
  console.log('  UK MHRA / Korea MFDS / Brazil ANVISA');
  console.log('============================================================\n');

  const { count: totalBefore } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrBefore } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log('采集前状态:');
  console.log(`  产品总数: ${totalBefore.toLocaleString()}`);
  console.log(`  制造商总数: ${mfrBefore.toLocaleString()}`);

  const ukCount = await crawlUKMHRA();
  const krCount = await crawlKoreaMFDS();
  const brCount = await crawlBrazilANVISA();

  const { count: totalAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log('\n============================================================');
  console.log('  爬虫采集结果');
  console.log('============================================================\n');
  console.log(`  产品总数: ${totalBefore.toLocaleString()} → ${totalAfter.toLocaleString()} (+${(totalAfter - totalBefore).toLocaleString()})`);
  console.log(`  制造商总数: ${mfrBefore.toLocaleString()} → ${mfrAfter.toLocaleString()} (+${(mfrAfter - mfrBefore).toLocaleString()})`);
  console.log('');
  console.log(`  UK MHRA: ${ukCount.toLocaleString()} 条`);
  console.log(`  Korea MFDS: ${krCount.toLocaleString()} 条`);
  console.log(`  Brazil ANVISA: ${brCount.toLocaleString()} 条`);
}

main().catch(console.error);
