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
  if (/MÁSCARA|MASCARA|RESPIRADOR|SEMIRESPIRADOR|PURIFICADOR/i.test(n)) return '呼吸防护装备';
  if (/LUVA|MANGOTE|MANGA|TALA|DEDEIRA/i.test(n)) return '手部防护装备';
  if (/ÓCULOS|OCULOS|VISOR|PROTETOR FACIAL/i.test(n)) return '眼面部防护装备';
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
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCADetail(html) {
  const result = {};
  const fields = [
    { regex: /Nº do CA:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'ca' },
    { regex: /Equipamento:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'equipamento' },
    { regex: /Fabricante:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'fabricante' },
    { regex: /Natureza:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'natureza' },
    { regex: /Situação:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'situacao' },
    { regex: /Validade:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'validade' },
    { regex: /CNPJ:[\s\S]*?<span[^>]*>([^<]*)<\/span>/i, key: 'cnpj' },
  ];
  for (const f of fields) {
    const m = html.match(f.regex);
    result[f.key] = m ? m[1].trim() : '';
  }
  return result;
}

async function main() {
  console.log('========================================');
  console.log('CAEPI CA编号逐个查询');
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
  let totalErrors = 0;

  // CAEPI CA numbers range from ~1000 to ~40000+
  // We'll scan in batches, checking which CAs exist
  console.log('\n扫描CA编号...');
  const startCA = 1000;
  const endCA = 45000;
  const batchSize = 100;

  for (let caStart = startCA; caStart < endCA; caStart += batchSize) {
    let batchCount = 0;
    for (let caNum = caStart; caNum < caStart + batchSize && caNum < endCA; caNum++) {
      const regKey = `CA-${caNum}`;
      if (existingRegKeys.has(regKey)) continue;

      try {
        const url = `${BASE_URL}?txtNumeroCA=${caNum}`;
        const html = await httpsGet(url);

        // Check if this CA exists
        if (!html.includes('Nº do CA:') && !html.includes('Equipamento:')) {
          continue;
        }

        const detail = parseCADetail(html);
        if (!detail.ca || !detail.equipamento) continue;

        const situacao = (detail.situacao || '').toUpperCase();
        if (situacao.includes('VENCIDO') || situacao.includes('CANCELADO')) continue;

        const category = categorizeEPI(detail.equipamento);
        const riskLevel = determineRiskLevel(detail.equipamento);
        const key = `${detail.equipamento.toLowerCase()}|${detail.fabricante.toLowerCase()}|${detail.ca.toLowerCase()}`;

        if (existingKeys.has(key) || existingRegKeys.has(regKey)) continue;

        const product = {
          name: detail.equipamento.substring(0, 500),
          category,
          subcategory: detail.natureza || null,
          manufacturer_name: detail.fabricante.substring(0, 500) || 'Unknown',
          country_of_origin: 'BR',
          product_code: detail.ca.substring(0, 100),
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
          batchCount++;
          totalInserted++;

          if (detail.fabricante && detail.fabricante !== 'Unknown' && !existingMfrNames.has(detail.fabricante.toLowerCase().trim())) {
            const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
              name: detail.fabricante.substring(0, 500),
              country: 'BR',
              data_source: 'Brazil CAEPI',
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'high',
            });
            if (!mfrErr) {
              existingMfrNames.add(detail.fabricante.toLowerCase().trim());
              totalMfrInserted++;
            }
          }
        }
      } catch (e) {
        totalErrors++;
      }
      await sleep(100);
    }

    if (batchCount > 0) {
      console.log(`  CA ${caStart}-${caStart + batchSize - 1}: ${batchCount} 条新数据 (总计: ${totalInserted})`);
    } else if ((caStart - startCA) % 5000 === 0) {
      console.log(`  进度: CA ${caStart}... (总计: ${totalInserted})`);
    }
  }

  console.log('\n========================================');
  console.log('CAEPI CA编号扫描完成');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  错误: ${totalErrors}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);
}

main().catch(console.error);
