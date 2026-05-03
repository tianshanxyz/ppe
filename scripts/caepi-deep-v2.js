#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE_URL = 'https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx';

function categorizeEPI(nome) {
  const n = (nome || '').toUpperCase();
  if (/MÁSCARA|MASCARA|RESPIRADOR|SEMIRESPIRADOR|PURIFICADOR DE AR/i.test(n)) return '呼吸防护装备';
  if (/LUVA|MANGOTE|MANGA|TALA|DEDEIRA/i.test(n)) return '手部防护装备';
  if (/ÓCULOS|OCULOS|VISOR|PROTETOR FACIAL|PROTEÇÃO FACIAL/i.test(n)) return '眼面部防护装备';
  if (/CAPACETE|CAPUZ|BALACLAVA/i.test(n)) return '头部防护装备';
  if (/PROTETOR AURICULAR|ABAFADOR|PLUG|AUDITIV/i.test(n)) return '听觉防护装备';
  if (/BOTA|BOTAS|CALÇADO|CALÇADOS|PERNEIRA|BOTINA|SAPATO/i.test(n)) return '足部防护装备';
  if (/AVENTAL|COLETE|JALECO|CINTURÃO|CINTURAO|CINTO|TALABARTE|TRAVA/i.test(n)) return '躯干防护装备';
  if (/MACACÃO|MACACAO|VESTIMENTA|ROUPA|CALÇA/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(nome) {
  const n = (nome || '').toUpperCase();
  if (/RESPIRADOR|AUTÔNOMO|SCBA|RADIOATIV|QUÍMIC|ELÉTRIC|INCÊNDIO|COMBATE/i.test(n)) return 'high';
  if (/CAPACETE|BOTA|LUVA|ÓCULOS|CINTO|QUEDA|BALA/i.test(n)) return 'medium';
  return 'low';
}

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function httpsPost(url, formData) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(formData).toString();
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': url,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

function extractHidden(html) {
  const vs = html.match(/id="__VIEWSTATE"\s+value="([^"]*)"/i);
  const ev = html.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/i);
  const vsg = html.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/i);
  return {
    '__VIEWSTATE': vs ? vs[1] : '',
    '__EVENTVALIDATION': ev ? ev[1] : '',
    '__VIEWSTATEGENERATOR': vsg ? vsg[1] : '',
  };
}

function extractEquipOptions(html) {
  const options = [];
  const regex = /<option\s+value="(\d+)"[^>]*>([^<]+)<\/option>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1] && match[2].trim()) {
      options.push({ value: match[1], label: match[2].trim() });
    }
  }
  return options;
}

function parseResultRows(html) {
  const results = [];
  const tableMatch = html.match(/id="gvResultado"[\s\S]*?<\/table>/i);
  if (!tableMatch) return results;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    if (cells.length >= 3) results.push(cells);
  }
  return results;
}

async function main() {
  console.log('========================================');
  console.log('CAEPI 深度爬取 v2 (正确字段名)');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number');
  const existingKeys = new Set();
  const existingRegKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
    if (p.registration_number) existingRegKeys.add(p.registration_number.trim());
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name || '').toLowerCase().trim()));

  let totalInserted = 0;
  let totalMfrInserted = 0;

  // Step 1: Get form page
  console.log('\nStep 1: 获取CAEPI页面...');
  const html = await httpsGet(BASE_URL);
  console.log(`  页面大小: ${(html.length / 1024).toFixed(1)} KB`);

  // Step 2: Extract options
  const options = extractEquipOptions(html);
  console.log(`  设备类型: ${options.length}`);

  const ppeOptions = options.filter(o => {
    const label = o.label.toUpperCase();
    return /CAPACETE|LUVA|BOTA|CALÇADO|MÁSCARA|MASCARA|RESPIRADOR|ÓCULOS|OCULOS|PROTETOR|AVENTAL|COLETE|MACACÃO|MACACAO|VESTIMENTA|CINTURÃO|CINTURAO|CINTO|MANGOTE|PERNEIRA|CAPUZ|ABAFADOR|PLUG|BALACLAVA|BOTINA|SAPATO|DEDEIRA|MANGA|TALA|VISOR|FACE/i.test(label);
  });
  console.log(`  PPE相关: ${ppeOptions.length}`);

  const hidden = extractHidden(html);
  console.log(`  VIEWSTATE: ${hidden['__VIEWSTATE'].length} bytes`);

  // Step 3: Test with first option
  console.log('\nStep 2: 测试POST请求...');
  const testResult = await httpsPost(BASE_URL, {
    ...hidden,
    'ctl00$PlaceHolderConteudo$cboEquipamento': ppeOptions[0].value,
    'ctl00$PlaceHolderConteudo$btnConsultar': 'Consultar',
  });
  console.log(`  响应大小: ${testResult.length}`);
  console.log(`  有结果表格: ${testResult.includes('gvResultado')}`);

  const testRows = parseResultRows(testResult);
  console.log(`  测试行数: ${testRows.length}`);
  if (testRows.length > 0) {
    console.log(`  第一行: CA=${testRows[0][0]}, Equip=${testRows[0][1]?.substring(0, 50)}, Mfr=${testRows[0][2]?.substring(0, 30)}`);
  }

  // Step 3: Query all PPE types
  console.log('\nStep 3: 批量查询所有PPE类型...');
  let totalCAEPI = 0;

  for (let i = 0; i < ppeOptions.length; i++) {
    const opt = ppeOptions[i];
    try {
      const resultHtml = await httpsPost(BASE_URL, {
        ...hidden,
        'ctl00$PlaceHolderConteudo$cboEquipamento': opt.value,
        'ctl00$PlaceHolderConteudo$btnConsultar': 'Consultar',
      });

      const rows = parseResultRows(resultHtml);
      let typeCount = 0;

      for (const cells of rows) {
        const ca = (cells[0] || '').trim();
        const equipamento = (cells[1] || '').trim();
        const fabricante = (cells[2] || '').trim();
        const natureza = cells.length > 3 ? (cells[3] || '').trim() : '';
        const situacao = cells.length > 4 ? (cells[4] || '').trim() : '';

        if (!ca || !equipamento || ca.length < 2) continue;
        if (situacao.toUpperCase().includes('VENCIDO') || situacao.toUpperCase().includes('CANCELADO')) continue;

        const category = categorizeEPI(equipamento);
        const riskLevel = determineRiskLevel(equipamento);
        const key = `${equipamento.toLowerCase()}|${fabricante.toLowerCase()}|${ca.toLowerCase()}`;
        const regKey = `CA-${ca}`;

        if (existingKeys.has(key) || existingRegKeys.has(regKey)) continue;

        const product = {
          name: equipamento.substring(0, 500),
          category,
          subcategory: opt.label,
          manufacturer_name: fabricante.substring(0, 500) || 'Unknown',
          country_of_origin: 'BR',
          product_code: ca.substring(0, 100),
          risk_level: riskLevel,
          data_source: 'Brazil CAEPI',
          registration_number: regKey,
          registration_authority: 'CAEPI/MTE',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
        };

        const { error } = await supabase.from('ppe_products').insert(product);
        if (!error) {
          existingKeys.add(key);
          existingRegKeys.add(regKey);
          typeCount++;
          totalCAEPI++;
          totalInserted++;

          if (fabricante && fabricante !== 'Unknown' && !existingMfrNames.has(fabricante.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: fabricante.substring(0, 500),
              country: 'BR',
              data_source: 'Brazil CAEPI',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrNames.add(fabricante.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }
      }

      if (typeCount > 0) console.log(`  [${i + 1}/${ppeOptions.length}] ${opt.label}: ${typeCount} 条新数据`);
      else if ((i + 1) % 30 === 0) console.log(`  [${i + 1}/${ppeOptions.length}] 进度... (总计: ${totalCAEPI})`);

      await sleep(2000);
    } catch (e) {
      console.log(`  [${i + 1}/${ppeOptions.length}] ${opt.label}: 错误 ${e.message}`);
      await sleep(5000);
    }
  }

  console.log(`\n  CAEPI总计: ${totalCAEPI} 条新数据`);

  // Final Summary
  console.log('\n========================================');
  console.log('CAEPI深度爬取完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'country_of_origin');
  const countryStats = {};
  finalProducts.forEach(p => {
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
  });
  console.log('\n国家分布(前10):');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });
}

main().catch(console.error);
