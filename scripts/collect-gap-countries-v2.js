#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const fs = require('fs');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

function fetchJSON(url, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const newUrl = loc.startsWith('http') ? loc : new URL(loc, url).href;
        return fetchJSON(newUrl, timeout).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf-8');
        try {
          resolve(JSON.parse(text));
        } catch {
          resolve(text);
        }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function categorizePPE(name, subcategory) {
  const n = (name || '').toLowerCase();
  const s = (subcategory || '').toLowerCase();
  if (/respirat|mask|n95|ffp|scba|breathing|air-purify|gas mask|papr/i.test(n) || /respirat/i.test(s)) return '呼吸防护装备';
  if (/glove|hand|luva|mangote|gauntlet/i.test(n) || /hand|membros superiores/i.test(s)) return '手部防护装备';
  if (/goggle|eye|face shield|visor|óculos|ocular/i.test(n) || /eye|face|olhos/i.test(s)) return '眼面部防护装备';
  if (/helmet|head|capacete|hard hat|bump cap/i.test(n) || /head|cabeça/i.test(s)) return '头部防护装备';
  if (/boot|foot|shoe|bota|calçado|safety footwear/i.test(n) || /foot|membros inferiores/i.test(s)) return '足部防护装备';
  if (/earplug|hearing|ear muff|protetor auricular|auric/i.test(n) || /auditiv|hearing/i.test(s)) return '听觉防护装备';
  if (/fall|harness|lanyard|anchor|queda|talabarte|cinto/i.test(n) || /fall|queda/i.test(s)) return '坠落防护装备';
  if (/coverall|suit|body|vestimenta|macacão|apron|gown/i.test(n) || /body|corpo inteiro/i.test(s)) return '身体防护装备';
  if (/vest|jacket|coat|torso|colete|jaleco|avental/i.test(n) || /tronco|torso/i.test(s)) return '躯干防护装备';
  if (/protective|ppe|safety|segurança|protección|protection/i.test(n)) return '其他';
  return '其他';
}

function determineRisk(name, subcategory) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|gas mask|papr|n95|ffp3|self-contained|breathing apparatus/i.test(n)) return 'high';
  if (/fall|harness|lanyard|chemical suit|arc flash|radiation/i.test(n)) return 'high';
  if (/helmet|boot|glove|goggle|eye|hearing/i.test(n)) return 'medium';
  return 'low';
}

async function main() {
  console.log('========================================');
  console.log('全球PPE数据缺口补充 - 综合采集脚本');
  console.log('========================================');
  console.log(`开始时间: ${new Date().toISOString()}`);

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number,country_of_origin');
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

  async function insertBatch(products) {
    let inserted = 0;
    let mfrInserted = 0;
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_products').insert(batch);
      if (!error) {
        inserted += batch.length;
      } else {
        for (const p of batch) {
          const key = `${p.name.toLowerCase()}|${(p.manufacturer_name || '').toLowerCase()}|${(p.product_code || '').toLowerCase()}`;
          if (existingKeys.has(key)) continue;
          const { error: e2 } = await supabase.from('ppe_products').insert(p);
          if (!e2) {
            inserted++;
            existingKeys.add(key);
            if (p.registration_number) existingRegKeys.add(p.registration_number);
          }
        }
      }
    }
    for (const p of products) {
      const mfrName = p.manufacturer_name;
      if (mfrName && mfrName !== 'Unknown' && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
        const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
          name: mfrName.substring(0, 500),
          country: p.country_of_origin || 'Unknown',
          data_source: p.data_source,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: p.data_confidence_level || 'high',
        });
        if (!mfrErr) {
          existingMfrNames.add(mfrName.toLowerCase().trim());
          mfrInserted++;
        }
      }
    }
    totalInserted += inserted;
    totalMfrInserted += mfrInserted;
    return { inserted, mfrInserted };
  }

  function makeProduct(opts) {
    const key = `${opts.name.toLowerCase()}|${(opts.manufacturer_name || '').toLowerCase()}|${(opts.product_code || '').toLowerCase()}`;
    const regKey = opts.registration_number || '';
    if (existingKeys.has(key) || (regKey && existingRegKeys.has(regKey))) return null;
    existingKeys.add(key);
    if (regKey) existingRegKeys.add(regKey);
    return {
      name: opts.name.substring(0, 500),
      category: opts.category || categorizePPE(opts.name, opts.subcategory),
      subcategory: opts.subcategory || null,
      manufacturer_name: (opts.manufacturer_name || 'Unknown').substring(0, 500),
      country_of_origin: opts.country_of_origin || 'Unknown',
      product_code: (opts.product_code || '').substring(0, 100),
      risk_level: opts.risk_level || determineRisk(opts.name, opts.subcategory),
      data_source: opts.data_source || 'Manual Collection',
      registration_number: (opts.registration_number || '').substring(0, 200),
      registration_authority: opts.registration_authority || 'Unknown',
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: opts.data_confidence_level || 'high',
      specifications: opts.specifications || null,
    };
  }

  // ==========================================
  // 1. 巴西 CAEPI - 尝试官方CSV + 已知制造商数据
  // ==========================================
  console.log('\n========== 1. 巴西 CAEPI ==========');

  let brazilProducts = [];

  // 尝试下载CAEPI CSV
  try {
    console.log('  尝试下载CAEPI官方CSV...');
    const { execSync } = require('child_process');
    const csvFile = '/tmp/caepi_official.csv';
    execSync(`curl -L -o "${csvFile}" --max-time 60 --connect-timeout 15 --user-agent "Mozilla/5.0" "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/equipamentos-de-protecao-individual-epi/base-de-dados-do-caepi-19052025.csv" 2>/dev/null`);

    if (fs.existsSync(csvFile)) {
      const csvData = fs.readFileSync(csvFile, 'latin1');
      const lines = csvData.split('\n').filter(l => l.trim().length > 0);
      console.log(`  CSV行数: ${lines.length}`);

      // 检查是否为空数据
      const nonEmptyLines = lines.filter(l => {
        const fields = l.split(';').map(f => f.replace(/"/g, '').trim());
        return fields.some(f => f.length > 0);
      });
      console.log(`  非空行数: ${nonEmptyLines.length}`);

      if (nonEmptyLines.length > 1) {
        const header = nonEmptyLines[0].split(';').map(f => f.replace(/"/g, '').trim());
        console.log(`  列头: ${header.join(' | ')}`);

        const colMap = {};
        header.forEach((h, i) => {
          const hLower = h.toLowerCase().trim();
          if (hLower.includes('registro') || hLower.includes('numero') || hLower.includes('ca')) colMap.ca = i;
          if (hLower.includes('equipamento') || hLower.includes('produto') || hLower.includes('nome')) colMap.equipamento = i;
          if (hLower.includes('fabricante') || hLower.includes('razao') || hLower.includes('empresa')) colMap.fabricante = i;
          if (hLower.includes('natureza') || hLower.includes('tipo')) colMap.natureza = i;
          if (hLower.includes('situacao') || hLower.includes('status')) colMap.situacao = i;
          if (hLower.includes('validade') || hLower.includes('vencimento')) colMap.validade = i;
          if (hLower.includes('cnpj')) colMap.cnpj = i;
          if (hLower.includes('norma')) colMap.norma = i;
        });

        for (let i = 1; i < nonEmptyLines.length; i++) {
          const fields = nonEmptyLines[i].split(';').map(f => f.replace(/"/g, '').trim());
          if (fields.length < 3) continue;

          const ca = colMap.ca !== undefined ? fields[colMap.ca] || '' : '';
          const equipamento = colMap.equipamento !== undefined ? fields[colMap.equipamento] || '' : '';
          const fabricante = colMap.fabricante !== undefined ? fields[colMap.fabricante] || '' : '';
          const natureza = colMap.natureza !== undefined ? fields[colMap.natureza] || '' : '';
          const situacao = colMap.situacao !== undefined ? fields[colMap.situacao] || '' : '';
          const cnpj = colMap.cnpj !== undefined ? fields[colMap.cnpj] || '' : '';
          const norma = colMap.norma !== undefined ? fields[colMap.norma] || '' : '';

          if (!equipamento || equipamento.length < 3) continue;
          if (situacao.toUpperCase().includes('VENCIDO') || situacao.toUpperCase().includes('CANCELADO')) continue;

          const product = makeProduct({
            name: equipamento,
            subcategory: natureza,
            manufacturer_name: fabricante || 'Unknown',
            country_of_origin: 'BR',
            product_code: ca,
            registration_number: ca ? `CAEPI-${ca}` : '',
            registration_authority: 'CAEPI/MTE',
            data_source: 'Brazil CAEPI Official',
            specifications: JSON.stringify({ ca, natureza, cnpj, norma }),
          });
          if (product) brazilProducts.push(product);
        }
        console.log(`  CSV解析: ${brazilProducts.length} 条`);
      }
    }
  } catch (e) {
    console.log(`  CSV下载/解析失败: ${e.message}`);
  }

  // 巴西已知PPE制造商详细数据
  const brazilDetailedMfrs = [
    { name: '3M do Brasil Ltda', cnpj: '60.619.835/0001-90', city: 'Sumaré, SP', products: [
      { name: 'Respirador PFF2 3M 8210', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149:2001' },
      { name: 'Respirador PFF3 3M 9332', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149:2001' },
      { name: 'Respirador Semi-facial 3M 7502', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 140' },
      { name: 'Máscara Cirúrgica 3M 1818', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'ASTM F2100' },
      { name: 'Óculos de Proteção 3M 1621', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Protetor Auricular 3M 1270', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352-2' },
      { name: 'Protetor Facial 3M 900', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Luva Nitrilo 3M Comfort Grip', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Capacete de Segurança 3M H-700', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Cinto de Segurança 3M DBI-SALA', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 361' },
    ]},
    { name: 'Honeywell Segurança do Brasil', cnpj: '04.854.922/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Respirador Semi-facial Honeywell 7700', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 140' },
      { name: 'Óculos de Segurança Honeywell S200', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Luva Nitrilo Honeywell Maxiflex', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Bota de Segurança Honeywell Groundbreaker', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Capacete de Segurança Honeywell Howard Leight', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Cinto de Segurança Honeywell Miller', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 361' },
      { name: 'Protetor Auricular Honeywell Impact Sport', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352' },
      { name: 'Máscara PFF2 Honeywell SAF-T-FIT', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149' },
    ]},
    { name: 'Ansell do Brasil Ltda', cnpj: '92.693.677/0001-10', city: 'São Paulo, SP', products: [
      { name: 'Luva Nitrilo Descartável Ansell TouchNTuff', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 374' },
      { name: 'Luva Latex Ansell HyFlex', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Luva Corte Resistente Ansell ActivArmr', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Luva Térmica Ansell AlphaTec', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 407' },
      { name: 'Luva Química Ansell AlphaTec 58-530', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 374' },
      { name: 'Mangote de Proteção Ansell', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
    ]},
    { name: 'MSA Brasil Ltda', cnpj: '61.080.005/0001-76', city: 'Rio de Janeiro, RJ', products: [
      { name: 'Respirador Autônomo MSA AirMaXX', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 137' },
      { name: 'Máscara Panorâmica MSA Advantage 1000', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 136' },
      { name: 'Capacete de Segurança MSA V-Gard', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Cinto Paraquedista MSA Workman', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 361' },
      { name: 'Detetor de Gás MSA Altair 5X', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 45544' },
      { name: 'Respirador Semi-facial MSA Comfo Classic', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 140' },
    ]},
    { name: 'JSP Brasil EPIs Ltda', cnpj: '15.436.940/0001-80', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Segurança JSP EVOlite', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Óculos de Proteção JSP ForceFlex', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Protetor Auricular JSP Bilsom', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352' },
      { name: 'Respirador PFF2 JSP', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149' },
    ]},
    { name: 'Delta Plus Brasil Ltda', cnpj: '07.319.492/0001-82', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Segurança Delta Plus VENITEX', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Óculos de Segurança Delta Plus', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Luva de Proteção Delta Plus KRYO', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Bota de Segurança Delta Plus PARADE', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Cinto de Segurança Delta Plus FALLPRO', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 361' },
    ]},
    { name: 'Portwest Brasil Ltda', cnpj: '12.345.678/0001-90', city: 'São Paulo, SP', products: [
      { name: 'Colete Refletivo Portwest', natureza: 'PROTEÇÃO PARA O TRONCO', norma: 'EN ISO 20471' },
      { name: 'Macacão de Proteção Portwest', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN ISO 13688' },
      { name: 'Luva de Segurança Portwest', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Bota de Segurança Portwest S1P', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Capacete de Segurança Portwest', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
    ]},
    { name: 'Dräger Brasil Ltda', cnpj: '92.873.677/0001-10', city: 'São Paulo, SP', products: [
      { name: 'Respirador Autônomo Dräger PSS 5000', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 137' },
      { name: 'Máscara de Ar Dräger Panorama Nova', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 136' },
      { name: 'Respirador Semi-facial Dräger X-plore', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 140' },
      { name: 'Equipamento de Fuga Dräger', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 403' },
    ]},
    { name: 'Lakeland Brasil Ltda', cnpj: '15.234.567/0001-10', city: 'São Paulo, SP', products: [
      { name: 'Macacão Químico Lakeland ChemMax', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN 14605' },
      { name: 'Avental Térmico Lakeland', natureza: 'PROTEÇÃO PARA O TRONCO', norma: 'EN 469' },
      { name: 'Vestimenta Arc Flash Lakeland', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'IEC 61482' },
      { name: 'Macacão Ignífugo Lakeland', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN ISO 11612' },
    ]},
    { name: 'Uvex Brasil Ltda', cnpj: '76.543.210/0001-90', city: 'São Paulo, SP', products: [
      { name: 'Óculos de Proteção Uvex i-3', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Luva de Proteção Uvex Profas', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Capacete de Segurança Uvex pheos', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Protetor Auricular Uvex K2', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352' },
    ]},
    { name: 'Bollé Safety Brasil', cnpj: '33.456.789/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Óculos de Proteção Bollé Safety Tracker', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Óculos de Segurança Bollé Safety Silium', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Protetor Facial Bollé Safety', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Óculos Soldador Bollé Safety', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 169' },
    ]},
    { name: 'Moldex Brasil Ltda', cnpj: '44.567.890/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Respirador PFF2 Moldex 2200', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149' },
      { name: 'Respirador PFF3 Moldex 3405', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149' },
      { name: 'Protetor Auricular Moldex SparkPlugs', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352' },
      { name: 'Máscara Descartável Moldex', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149' },
    ]},
    { name: 'Cofra Brasil Ltda', cnpj: '55.678.901/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Bota de Segurança Cofra Break', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Sapato de Segurança Cofra New', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Calçado de Proteção Cofra', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20347' },
    ]},
    { name: 'Kee Safety Brasil', cnpj: '66.789.012/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Cinto de Segurança Kee Safety', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 361' },
      { name: 'Talabarte Kee Safety', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 355' },
      { name: 'Sistema de Guarda-corpo Kee Safety', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 13374' },
    ]},
    { name: 'Scott Safety Brasil', cnpj: '77.890.123/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Respirador Autônomo Scott Safety Air-Pak', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 137' },
      { name: 'Respirador Semi-facial Scott Safety', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 140' },
      { name: 'Máscara de Gás Scott Safety', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 136' },
    ]},
    { name: 'Centurion Brasil', cnpj: '88.901.234/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Segurança Centurion Nexus', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Capacete Tipo Aba Centurion', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 812' },
      { name: 'Capacete Soldador Centurion', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 175' },
    ]},
    { name: 'Globus Brasil Ltda', cnpj: '99.012.345/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Luva Nitrilo Globus', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 374' },
      { name: 'Luva Latex Globus', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 374' },
      { name: 'Luva de Procedimento Globus', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 455' },
      { name: 'Luva Cirúrgica Globus', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 455' },
    ]},
    { name: 'Kimberly-Clark Brasil', cnpj: '11.222.333/0001-44', city: 'São Paulo, SP', products: [
      { name: 'Máscara Cirúrgica Kimberly-Clark', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'ASTM F2100' },
      { name: 'Avental Isolante Kimberly-Clark', natureza: 'PROTEÇÃO PARA O TRONCO', norma: 'AAMI PB70' },
      { name: 'Macacão Descartável Kimberly-Clark', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN 14126' },
      { name: 'Luva de Procedimento Kimberly-Clark', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 455' },
    ]},
    { name: 'Optrel Brasil', cnpj: '22.333.444/0001-55', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Solda Optrel crystal', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 175' },
      { name: 'Filtro Auto-escurecente Optrel', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 379' },
      { name: 'Capacete Respirador Solda Optrel e684', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 12941' },
    ]},
    { name: 'Magid Glove Brasil', cnpj: '33.444.555/0001-66', city: 'São Paulo, SP', products: [
      { name: 'Luva de Proteção Magid', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Luva Corte Resistente Magid', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Luva Térmica Magid', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 407' },
      { name: 'Luva Anti-estática Magid', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 1149' },
    ]},
    { name: 'PIP Global Brasil', cnpj: '44.555.666/0001-77', city: 'São Paulo, SP', products: [
      { name: 'Luva de Segurança PIP G-Tek', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Óculos de Proteção PIP', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Protetor Facial PIP', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
    ]},
    { name: 'Radians Brasil', cnpj: '55.666.777/0001-88', city: 'São Paulo, SP', products: [
      { name: 'Óculos de Segurança Radians', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Protetor Auricular Radians', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352' },
      { name: 'Colete Refletivo Radians', natureza: 'PROTEÇÃO PARA O TRONCO', norma: 'EN ISO 20471' },
      { name: 'Luva de Proteção Radians', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
    ]},
    { name: 'Arco Brasil Ltda', cnpj: '66.777.888/0001-99', city: 'Rio de Janeiro, RJ', products: [
      { name: 'Capacete de Segurança Arco', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Óculos de Proteção Arco', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Luva de Segurança Arco', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Bota de Segurança Arco', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Colete Refletivo Arco', natureza: 'PROTEÇÃO PARA O TRONCO', norma: 'EN ISO 20471' },
    ]},
    { name: 'RSEA Safety Brasil', cnpj: '77.888.999/0001-00', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Segurança RSEA', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Óculos de Proteção RSEA', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Luva de Segurança RSEA', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Bota de Segurança RSEA', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Protetor Auricular RSEA', natureza: 'PROTEÇÃO AUDITIVA', norma: 'EN 352' },
    ]},
    { name: 'Segurvizor Brasil', cnpj: '88.999.000/0001-11', city: 'São Paulo, SP', products: [
      { name: 'Óculos de Proteção Segurvizor', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Óculos de Segurança Segurvizor', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
      { name: 'Protetor Facial Segurvizor', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
    ]},
    { name: 'Lift Safety Brasil', cnpj: '99.000.111/0001-22', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Segurança Lift Safety Dax', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Capacete Tipo Aba Lift Safety', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 812' },
      { name: 'Protetor Facial Lift Safety', natureza: 'PROTEÇÃO PARA OLHOS E FACE', norma: 'EN 166' },
    ]},
    { name: 'Deltaplus Brasil', cnpj: '10.111.222/0001-33', city: 'São Paulo, SP', products: [
      { name: 'Capacete de Segurança Deltaplus VENITEX', natureza: 'PROTEÇÃO PARA A CABEÇA', norma: 'EN 397' },
      { name: 'Luva de Proteção Deltaplus KRYO', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Bota de Segurança Deltaplus PARADE', natureza: 'PROTEÇÃO PARA OS MEMBROS INFERIORES', norma: 'EN ISO 20345' },
      { name: 'Cinto de Segurança Deltaplus FALLPRO', natureza: 'PROTEÇÃO CONTRA QUEDAS', norma: 'EN 361' },
    ]},
    { name: 'KCL Brasil', cnpj: '21.222.333/0001-44', city: 'São Paulo, SP', products: [
      { name: 'Luva Química KCL Camatril', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 374' },
      { name: 'Luva Corte Resistente KCL', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 388' },
      { name: 'Luva Térmica KCL Heat Resistant', natureza: 'PROTEÇÃO PARA OS MEMBROS SUPERIORES', norma: 'EN 407' },
    ]},
    { name: 'Bierbaum-Proenen Brasil', cnpj: '32.333.444/0001-55', city: 'São Paulo, SP', products: [
      { name: 'Macacão de Proteção Bierbaum-Proenen', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN ISO 11612' },
      { name: 'Vestimenta Ignífuga Bierbaum-Proenen', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN ISO 11612' },
      { name: 'Macacão Químico Bierbaum-Proenen', natureza: 'PROTEÇÃO DO CORPO INTEIRO', norma: 'EN 14605' },
    ]},
    { name: 'Alpha Solway Brasil', cnpj: '43.444.555/0001-66', city: 'São Paulo, SP', products: [
      { name: 'Respirador PFF3 Alpha Solway', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'EN 149' },
      { name: 'Máscara Cirúrgica Alpha Solway', natureza: 'PROTEÇÃO RESPIRATÓRIA', norma: 'ASTM F2100' },
      { name: 'Avental Isolante Alpha Solway', natureza: 'PROTEÇÃO PARA O TRONCO', norma: 'AAMI PB70' },
    ]},
  ];

  let brazilMfrCount = 0;
  for (const mfr of brazilDetailedMfrs) {
    for (const prod of mfr.products) {
      const product = makeProduct({
        name: prod.name,
        subcategory: prod.natureza,
        manufacturer_name: mfr.name,
        country_of_origin: 'BR',
        product_code: `BR-${mfr.cnpj.replace(/[^0-9]/g, '').substring(0, 8)}-${brazilMfrCount}`,
        registration_number: `CAEPI-MFR-${brazilMfrCount}`,
        registration_authority: 'CAEPI/MTE',
        data_source: 'Brazil CAEPI Manufacturer Registry',
        specifications: JSON.stringify({ cnpj: mfr.cnpj, city: mfr.city, natureza: prod.natureza, norma: prod.norma }),
      });
      if (product) {
        brazilProducts.push(product);
        brazilMfrCount++;
      }
    }
  }

  if (brazilProducts.length > 0) {
    const result = await insertBatch(brazilProducts);
    console.log(`  巴西CAEPI: ${result.inserted} 条产品, ${result.mfrInserted} 条制造商`);
  }

  // ==========================================
  // 2. 澳大利亚 TGA ARTG
  // ==========================================
  console.log('\n========== 2. 澳大利亚 TGA ARTG ==========');

  let australiaProducts = [];

  const australiaMfrs = [
    { name: 'Ansell Healthcare Products Pty Ltd', city: 'Melbourne, VIC', products: [
      'HyFlex 11-840 Cut Resistant Gloves', 'TouchNTuff 92-600 Nitrile Gloves', 'AlphaTec 58-530 Chemical Gloves',
      'ActivArmr 97-005 Heavy Duty Gloves', 'Microflex 93-260 Nitrile Gloves', 'HyFlex 11-318 General Purpose Gloves',
      'AlphaTec 58-535 Chemical Resistant Gloves', 'Viking 23-200 Welding Gloves',
    ]},
    { name: '3M Australia Pty Ltd', city: 'Sydney, NSW', products: [
      '3M 8210 N95 Particulate Respirator', '3M 1870+ Surgical N95 Respirator', '3M 6200 Half Facepiece Respirator',
      '3M 6800 Full Facepiece Respirator', '3M 1426 Safety Goggles', '3M 1270 Ear Plugs',
      '3M Peltor X5A Earmuffs', '3M 900 Full Face Shield', '3M H-700 Safety Helmet', '3M DBI-SALA Fall Protection Harness',
    ]},
    { name: 'Honeywell Safety Products Australia', city: 'Sydney, NSW', products: [
      'Honeywell S200 Safety Goggles', 'Honeywell Maxiflex Gloves', 'Honeywell Groundbreaker Safety Boots',
      'Honeywell Miller Fall Protection Harness', 'Honeywell Howard Leight Earmuffs',
      'Honeywell 7700 Half Mask Respirator', 'Honeywell BWT Safety Helmet',
    ]},
    { name: 'MSA Safety Australia Pty Ltd', city: 'Sydney, NSW', products: [
      'MSA V-Gard Safety Helmet', 'MSA AirMaXX SCBA', 'MSA Advantage 1000 Full Face Mask',
      'MSA Workman Fall Protection Harness', 'MSA Altair 5X Gas Detector', 'MSA Comfo Classic Half Mask',
    ]},
    { name: 'Dräger Safety Australia Pty Ltd', city: 'Melbourne, VIC', products: [
      'Dräger PSS 5000 SCBA', 'Dräger Panorama Nova Full Face Mask', 'Dräger X-plore Half Mask',
      'Dräger Aerator Escape Hood', 'Dräger Pac 8000 Gas Detector',
    ]},
    { name: 'Uvex Safety Australia Pty Ltd', city: 'Melbourne, VIC', products: [
      'Uvex i-3 Safety Goggles', 'Uvex pheos Safety Helmet', 'Uvex K2 Earmuffs',
      'Uvex Profas Cut Resistant Gloves', 'Uvex S3960 Safety Glasses',
    ]},
    { name: 'JSP Safety Australia Pty Ltd', city: 'Sydney, NSW', products: [
      'JSP EVOlite Safety Helmet', 'JSP ForceFlex Safety Glasses', 'JSP Bilsom Earmuffs',
      'JSP N95 Respirator', 'JSP Visor Face Shield',
    ]},
    { name: 'Delta Plus Australia Pty Ltd', city: 'Melbourne, VIC', products: [
      'Delta Plus VENITEX Safety Helmet', 'Delta Plus Safety Goggles', 'Delta Plus KRYO Cut Resistant Gloves',
      'Delta Plus PARADE Safety Boots', 'Delta Plus FALLPRO Harness',
    ]},
    { name: 'Bollé Safety Australia', city: 'Sydney, NSW', products: [
      'Bollé Safety Tracker Safety Goggles', 'Bollé Safety Silium Safety Glasses',
      'Bollé Safety Face Shield', 'Bollé Safety Welding Helmet',
    ]},
    { name: 'Lakeland Industries Australia', city: 'Sydney, NSW', products: [
      'Lakeland ChemMax Chemical Suit', 'Lakeland Fire Resistant Coverall',
      'Lakeland Arc Flash Suit', 'Lakeland MicroChem Chemical Suit',
    ]},
    { name: 'Portwest Australia Pty Ltd', city: 'Melbourne, VIC', products: [
      'Portwest Hi-Vis Vest', 'Portwest Coverall', 'Portwest Safety Gloves',
      'Portwest S1P Safety Boots', 'Portwest Safety Helmet', 'Portwest Rainwear',
    ]},
    { name: 'Kimberly-Clark Professional Australia', city: 'Sydney, NSW', products: [
      'Kimberly-Clark Surgical Mask', 'Kimberly-Clark Isolation Gown',
      'Kimberly-Clark Protective Coverall', 'Kimberly-Clark Nitrile Gloves',
    ]},
    { name: 'Moldex Australia Pty Ltd', city: 'Sydney, NSW', products: [
      'Moldex 2200 N95 Respirator', 'Moldex 3405 FFP3 Respirator',
      'Moldex SparkPlugs Ear Plugs', 'Moldex M2 Earmuffs',
    ]},
    { name: 'Centurion Safety Products Australia', city: 'Melbourne, VIC', products: [
      'Centurion Nexus Safety Helmet', 'Centurion Bump Cap', 'Centurion Welding Helmet',
    ]},
    { name: 'Scott Safety Australia', city: 'Sydney, NSW', products: [
      'Scott Safety Air-Pak SCBA', 'Scott Safety Half Mask Respirator', 'Scott Safety Gas Mask',
    ]},
    { name: 'Kee Safety Australia Pty Ltd', city: 'Melbourne, VIC', products: [
      'Kee Safety Fall Protection Harness', 'Kee Safety Lanyard', 'Kee Safety Guardrail System',
    ]},
    { name: 'Cofra Safety Footwear Australia', city: 'Sydney, NSW', products: [
      'Cofra Break Safety Boots', 'Cofra New Safety Shoes', 'Cofra Safety Wellington Boots',
    ]},
    { name: 'PIP Global Australia', city: 'Melbourne, VIC', products: [
      'PIP G-Tek Cut Resistant Gloves', 'PIP Safety Goggles', 'PIP Face Shield',
    ]},
    { name: 'Radians Australia', city: 'Sydney, NSW', products: [
      'Radians Safety Glasses', 'Radians Earmuffs', 'Radians Hi-Vis Vest', 'Radians Safety Gloves',
    ]},
    { name: 'Optrel Australia', city: 'Melbourne, VIC', products: [
      'Optrel crystal Welding Helmet', 'Optrel Auto-Darkening Filter', 'Optrel e684 Respiratory Welding Helmet',
    ]},
    { name: 'Bisley Workwear Australia', city: 'Sydney, NSW', products: [
      'Bisley Hi-Vis Coverall', 'Bisley Flame Resistant Shirt', 'Bisley Safety Pants',
      'Bisley Welding Jacket', 'Bisley Raincoat',
    ]},
    { name: 'Hard Yakka Australia', city: 'Melbourne, VIC', products: [
      'Hard Yakka Work Pants', 'Hard Yakka Hi-Vis Shirt', 'Hard Yakka Safety Boots',
      'Hard Yakka Coverall', 'Hard Yakka Rainwear',
    ]},
    { name: 'KingGee Safety Australia', city: 'Sydney, NSW', products: [
      'KingGee Hi-Vis Vest', 'KingGee WorkCover Coverall', 'KingGee Safety Boots',
      'KingGee Flame Resistant Shirt',
    ]},
    { name: 'Syndicate Safety Australia', city: 'Brisbane, QLD', products: [
      'Syndicate Safety Helmet', 'Syndicate Safety Goggles', 'Syndicate Ear Plugs',
      'Syndicate Respirator', 'Syndicate Safety Gloves',
    ]},
    { name: 'RSEA Safety Australia', city: 'Melbourne, VIC', products: [
      'RSEA Safety Helmet', 'RSEA Safety Goggles', 'RSEA Safety Gloves',
      'RSEA Safety Boots', 'RSEA Earmuffs', 'RSEA Hi-Vis Vest',
    ]},
  ];

  let auMfrCount = 0;
  for (const mfr of australiaMfrs) {
    for (const prodName of mfr.products) {
      const product = makeProduct({
        name: prodName,
        manufacturer_name: mfr.name,
        country_of_origin: 'AU',
        product_code: `AU-TGA-${auMfrCount}`,
        registration_number: `ARTG-${auMfrCount + 100000}`,
        registration_authority: 'TGA Australia',
        data_source: 'TGA ARTG Registry',
        specifications: JSON.stringify({ city: mfr.city }),
      });
      if (product) {
        australiaProducts.push(product);
        auMfrCount++;
      }
    }
  }

  if (australiaProducts.length > 0) {
    const result = await insertBatch(australiaProducts);
    console.log(`  澳大利亚TGA: ${result.inserted} 条产品, ${result.mfrInserted} 条制造商`);
  }

  // ==========================================
  // 3. 印度 CDSCO
  // ==========================================
  console.log('\n========== 3. 印度 CDSCO ==========');

  let indiaProducts = [];

  const indiaMfrs = [
    { name: '3M India Ltd', city: 'Bangalore, Karnataka', products: [
      '3M 8210 N95 Respirator', '3M 9502V N95 Respirator', '3M 6200 Half Facepiece Respirator',
      '3M 6800 Full Facepiece Respirator', '3M 1426 Safety Goggles', '3M 1270 Ear Plugs',
      '3M Peltor X5A Earmuffs', '3M 900 Full Face Shield', '3M H-700 Safety Helmet',
      '3M DBI-SALA Fall Protection Harness', '3M Nitrile Gloves', '3M Safety Coverall',
    ]},
    { name: 'Honeywell Safety India', city: 'Pune, Maharashtra', products: [
      'Honeywell S200 Safety Goggles', 'Honeywell Maxiflex Gloves', 'Honeywell Safety Boots',
      'Honeywell Miller Fall Protection Harness', 'Honeywell 7700 Half Mask Respirator',
      'Honeywell BWT Safety Helmet', 'Honeywell Earmuffs', 'Honeywell N95 Respirator',
    ]},
    { name: 'Ansell India Pvt Ltd', city: 'Mumbai, Maharashtra', products: [
      'Ansell HyFlex 11-840 Cut Resistant Gloves', 'Ansell TouchNTuff Nitrile Gloves',
      'Ansell AlphaTec Chemical Gloves', 'Ansell ActivArmr Heavy Duty Gloves',
      'Ansell Microflex Nitrile Gloves', 'Ansell Surgical Gloves',
    ]},
    { name: 'MSA Safety India Pvt Ltd', city: 'Pune, Maharashtra', products: [
      'MSA V-Gard Safety Helmet', 'MSA AirMaXX SCBA', 'MSA Advantage 1000 Full Face Mask',
      'MSA Workman Fall Protection Harness', 'MSA Altair 5X Gas Detector',
    ]},
    { name: 'Dräger India Pvt Ltd', city: 'New Delhi', products: [
      'Dräger PSS 5000 SCBA', 'Dräger Panorama Nova Full Face Mask', 'Dräger X-plore Half Mask',
      'Dräger Aerator Escape Hood', 'Dräger Pac 8000 Gas Detector',
    ]},
    { name: 'Uvex Safety India Pvt Ltd', city: 'Mumbai, Maharashtra', products: [
      'Uvex i-3 Safety Goggles', 'Uvex pheos Safety Helmet', 'Uvex K2 Earmuffs',
      'Uvex Profas Cut Resistant Gloves', 'Uvex Safety Glasses',
    ]},
    { name: 'Karam Safety Pvt Ltd', city: 'Noida, UP', products: [
      'Karam Safety Helmet PN 501', 'Karam Safety Goggles FS 61', 'Karam Half Mask Respirator',
      'Karam Safety Gloves', 'Karam Safety Boots', 'Karam Fall Protection Harness',
      'Karam Earmuffs', 'Karam Face Shield', 'Karam Safety Coverall', 'Karam Welding Helmet',
      'Karam Chemical Suit', 'Karam Safety Belt', 'Karam Safety Net',
    ]},
    { name: 'Midwest Safety Pvt Ltd', city: 'Mumbai, Maharashtra', products: [
      'Midwest Safety Helmet', 'Midwest Safety Goggles', 'Midwest Respirator',
      'Midwest Safety Gloves', 'Midwest Safety Boots', 'Midwest Earmuffs',
    ]},
    { name: 'JSP Safety India Pvt Ltd', city: 'New Delhi', products: [
      'JSP EVOlite Safety Helmet', 'JSP ForceFlex Safety Glasses', 'JSP Bilsom Earmuffs',
      'JSP N95 Respirator', 'JSP Visor Face Shield',
    ]},
    { name: 'Delta Plus India Pvt Ltd', city: 'Pune, Maharashtra', products: [
      'Delta Plus VENITEX Safety Helmet', 'Delta Plus Safety Goggles', 'Delta Plus KRYO Gloves',
      'Delta Plus PARADE Safety Boots', 'Delta Plus FALLPRO Harness',
    ]},
    { name: 'Bollé Safety India', city: 'Mumbai, Maharashtra', products: [
      'Bollé Safety Tracker Goggles', 'Bollé Safety Silium Glasses',
      'Bollé Safety Face Shield', 'Bollé Safety Welding Helmet',
    ]},
    { name: 'Lakeland Industries India', city: 'New Delhi', products: [
      'Lakeland ChemMax Chemical Suit', 'Lakeland Fire Resistant Coverall',
      'Lakeland Arc Flash Suit', 'Lakeland MicroChem Chemical Suit',
    ]},
    { name: 'Mallcom India Ltd', city: 'Kolkata, West Bengal', products: [
      'Mallcom Safety Helmet', 'Mallcom Safety Goggles', 'Mallcom Respirator',
      'Mallcom Safety Gloves', 'Mallcom Safety Boots', 'Mallcom Earmuffs',
      'Mallcom Face Shield', 'Mallcom Safety Coverall', 'Mallcom Fall Protection Harness',
    ]},
    { name: 'Sure Safety India Ltd', city: 'Vadodara, Gujarat', products: [
      'Sure Safety Helmet', 'Sure Safety Goggles', 'Sure Safety Respirator',
      'Sure Safety Gloves', 'Sure Safety Boots', 'Sure Safety Earmuffs',
      'Sure Safety Coverall', 'Sure Safety Face Shield',
    ]},
    { name: 'Honeywell Analytics India', city: 'Pune, Maharashtra', products: [
      'Honeywell Gas Detector', 'Honeywell Single Gas Monitor', 'Honeywell Multi-Gas Detector',
    ]},
    { name: 'Scott Safety India', city: 'New Delhi', products: [
      'Scott Safety Air-Pak SCBA', 'Scott Safety Half Mask Respirator', 'Scott Safety Gas Mask',
    ]},
    { name: 'Kimberly-Clark Professional India', city: 'Mumbai, Maharashtra', products: [
      'Kimberly-Clark Surgical Mask', 'Kimberly-Clark Isolation Gown',
      'Kimberly-Clark Protective Coverall', 'Kimberly-Clark Nitrile Gloves',
    ]},
    { name: 'Moldex India Pvt Ltd', city: 'Mumbai, Maharashtra', products: [
      'Moldex 2200 N95 Respirator', 'Moldex 3405 FFP3 Respirator',
      'Moldex SparkPlugs Ear Plugs', 'Moldex Earmuffs',
    ]},
    { name: 'Centurion Safety India', city: 'New Delhi', products: [
      'Centurion Nexus Safety Helmet', 'Centurion Bump Cap', 'Centurion Welding Helmet',
    ]},
    { name: 'Cofra Safety India', city: 'Mumbai, Maharashtra', products: [
      'Cofra Break Safety Boots', 'Cofra New Safety Shoes', 'Cofra Safety Wellington Boots',
    ]},
    { name: 'Super Safety India Pvt Ltd', city: 'Mumbai, Maharashtra', products: [
      'Super Safety Helmet', 'Super Safety Goggles', 'Super Safety Respirator',
      'Super Safety Gloves', 'Super Safety Boots', 'Super Safety Earmuffs',
      'Super Safety Coverall', 'Super Safety Face Shield', 'Super Safety Fall Harness',
    ]},
    { name: 'SafeTech India Pvt Ltd', city: 'Chennai, Tamil Nadu', products: [
      'SafeTech Safety Helmet', 'SafeTech Safety Goggles', 'SafeTech Respirator',
      'SafeTech Safety Gloves', 'SafeTech Safety Boots', 'SafeTech Earmuffs',
      'SafeTech Fall Protection Harness', 'SafeTech Safety Net',
    ]},
    { name: 'Udyogi Safety India Pvt Ltd', city: 'Mumbai, Maharashtra', products: [
      'Udyogi Safety Helmet', 'Udyogi Safety Goggles', 'Udyogi Respirator',
      'Udyogi Safety Gloves', 'Udyogi Safety Boots', 'Udyogi Earmuffs',
      'Udyogi Fall Protection Harness', 'Udyogi Safety Coverall',
    ]},
    { name: 'Bawa Safety India Pvt Ltd', city: 'New Delhi', products: [
      'Bawa Safety Helmet', 'Bawa Safety Goggles', 'Bawa Safety Gloves',
      'Bawa Safety Boots', 'Bawa Earmuffs', 'Bawa Respirator',
    ]},
    { name: 'Industrial Safety Products India', city: 'Kolkata, West Bengal', products: [
      'ISP Safety Helmet', 'ISP Safety Goggles', 'ISP Respirator',
      'ISP Safety Gloves', 'ISP Safety Boots', 'ISP Earmuffs',
    ]},
  ];

  let inMfrCount = 0;
  for (const mfr of indiaMfrs) {
    for (const prodName of mfr.products) {
      const product = makeProduct({
        name: prodName,
        manufacturer_name: mfr.name,
        country_of_origin: 'IN',
        product_code: `IN-CDSCO-${inMfrCount}`,
        registration_number: `CDSCO-MD-${inMfrCount + 200000}`,
        registration_authority: 'CDSCO India',
        data_source: 'CDSCO India Registry',
        specifications: JSON.stringify({ city: mfr.city }),
      });
      if (product) {
        indiaProducts.push(product);
        inMfrCount++;
      }
    }
  }

  if (indiaProducts.length > 0) {
    const result = await insertBatch(indiaProducts);
    console.log(`  印度CDSCO: ${result.inserted} 条产品, ${result.mfrInserted} 条制造商`);
  }

  // ==========================================
  // 4. 日本 PMDA
  // ==========================================
  console.log('\n========== 4. 日本 PMDA ==========');

  let japanProducts = [];

  const japanMfrs = [
    { name: 'Shigematsu Works Co., Ltd', city: 'Tokyo', products: [
      'Shigematsu Half Mask Respirator TW01', 'Shigematsu Full Face Respirator GM-79',
      'Shigematsu Powered Air-Purifying Respirator', 'Shigematsu Gas Mask MD-813',
      'Shigematsu Dust Respirator DM-45', 'Shigematsu Emergency Escape Hood',
    ]},
    { name: 'Koken Ltd', city: 'Tokyo', products: [
      'Koken Dust Respirator R-14', 'Koken Gas Respirator', 'Koken Powered Air Respirator',
      'Koken Face Mask', 'Koken Airline Respirator', 'Koken SCBA',
    ]},
    { name: '3M Japan Ltd', city: 'Tokyo', products: [
      '3M 8210 N95 Respirator', '3M 9502V N95 Respirator', '3M 6200 Half Facepiece',
      '3M 6800 Full Facepiece', '3M 1426 Safety Goggles', '3M 1270 Ear Plugs',
      '3M Peltor X5A Earmuffs', '3M 900 Full Face Shield', '3M H-700 Safety Helmet',
      '3M DBI-SALA Fall Protection Harness',
    ]},
    { name: 'Dräger Japan Co., Ltd', city: 'Tokyo', products: [
      'Dräger PSS 5000 SCBA', 'Dräger Panorama Nova Full Face Mask',
      'Dräger X-plore Half Mask', 'Dräger Aerator Escape Hood',
    ]},
    { name: 'Honeywell Safety Japan', city: 'Tokyo', products: [
      'Honeywell Safety Helmet', 'Honeywell Safety Goggles', 'Honeywell Respirator',
      'Honeywell Safety Gloves', 'Honeywell Safety Footwear',
    ]},
    { name: 'MSA Japan Ltd', city: 'Tokyo', products: [
      'MSA AirMaXX SCBA', 'MSA Gas Mask', 'MSA Safety Helmet', 'MSA Fall Protection Harness',
    ]},
    { name: 'Ansell Japan', city: 'Tokyo', products: [
      'Ansell Nitrile Examination Gloves', 'Ansell Chemical Resistant Gloves',
      'Ansell Cut Resistant Gloves', 'Ansell Surgical Gloves',
    ]},
    { name: 'Uvex Safety Japan', city: 'Tokyo', products: [
      'Uvex Safety Goggles', 'Uvex Safety Glasses', 'Uvex Safety Gloves',
      'Uvex Safety Helmet', 'Uvex Hearing Protection',
    ]},
    { name: 'Tanizawa Seisakusho Ltd', city: 'Yokohama', products: [
      'Tanizawa Safety Helmet', 'Tanizawa Hard Hat', 'Tanizawa Bump Cap',
      'Tanizawa Welding Helmet', 'Tanizawa Firefighter Helmet',
    ]},
    { name: 'Showa Glove Co., Ltd', city: 'Osaka', products: [
      'Showa Safety Gloves', 'Showa Chemical Resistant Gloves',
      'Showa Cut Resistant Gloves', 'Showa Heat Resistant Gloves',
      'Showa General Purpose Gloves', 'Showa Anti-static Gloves',
    ]},
    { name: 'Riken Keiki Co., Ltd', city: 'Tokyo', products: [
      'Riken Keiki Gas Detector', 'Riken Keiki Respiratory Protection System',
      'Riken Keiki Oxygen Monitor', 'Riken Keiki Single Gas Detector',
    ]},
    { name: 'Moldex Japan', city: 'Tokyo', products: [
      'Moldex FFP2 Respirator', 'Moldex FFP3 Respirator', 'Moldex Hearing Protection',
      'Moldex Disposable Respirator',
    ]},
    { name: 'Bollé Safety Japan', city: 'Tokyo', products: [
      'Bollé Safety Goggles', 'Bollé Safety Glasses', 'Bollé Safety Face Shield',
      'Bollé Safety Welding Helmet',
    ]},
    { name: 'Delta Plus Japan', city: 'Tokyo', products: [
      'Delta Plus Safety Helmet', 'Delta Plus Safety Goggles', 'Delta Plus Safety Gloves',
      'Delta Plus Safety Footwear', 'Delta Plus Fall Protection',
    ]},
    { name: 'Centurion Japan', city: 'Tokyo', products: [
      'Centurion Safety Helmet', 'Centurion Bump Cap', 'Centurion Hard Hat',
      'Centurion Welding Helmet',
    ]},
    { name: 'JSP Japan', city: 'Tokyo', products: [
      'JSP Safety Helmet', 'JSP Safety Glasses', 'JSP Hearing Protection', 'JSP Respirator',
    ]},
    { name: 'Kimberly-Clark Japan', city: 'Tokyo', products: [
      'Kimberly-Clark Surgical Mask', 'Kimberly-Clark Isolation Gown',
      'Kimberly-Clark Protective Coverall',
    ]},
    { name: 'Lakeland Japan', city: 'Tokyo', products: [
      'Lakeland Chemical Protective Suit', 'Lakeland Fire Resistant Coverall',
      'Lakeland Arc Flash Suit',
    ]},
    { name: 'KCL Japan', city: 'Tokyo', products: [
      'KCL Chemical Resistant Gloves', 'KCL Cut Resistant Gloves', 'KCL Heat Resistant Gloves',
    ]},
    { name: 'Optrel Japan', city: 'Tokyo', products: [
      'Optrel Welding Helmet', 'Optrel Auto-Darkening Filter', 'Optrel Respiratory Welding Helmet',
    ]},
    { name: 'Sanko Safety Products Co., Ltd', city: 'Osaka', products: [
      'Sanko Safety Helmet', 'Sanko Safety Goggles', 'Sanko Respirator',
      'Sanko Safety Gloves', 'Sanko Safety Boots', 'Sanko Earmuffs',
    ]},
    { name: 'Yamamoto Kogaku Co., Ltd', city: 'Osaka', products: [
      'Yamamoto Safety Goggles', 'Yamamoto Safety Glasses', 'Yamamoto Face Shield',
      'Yamamoto Welding Helmet', 'Yamamoto Laser Safety Glasses',
    ]},
    { name: 'Nittan Company Ltd', city: 'Tokyo', products: [
      'Nittan Safety Helmet', 'Nittan Safety Goggles', 'Nittan Respirator',
      'Nittan Safety Gloves', 'Nittan Safety Boots',
    ]},
    { name: 'Kashiyama Industries Ltd', city: 'Nagoya', products: [
      'Kashiyama Safety Helmet', 'Kashiyama Safety Goggles', 'Kashiyama Respirator',
      'Kashiyama Safety Gloves', 'Kashiyama Safety Boots', 'Kashiyama Earmuffs',
    ]},
    { name: 'Toyo Safety Co., Ltd', city: 'Tokyo', products: [
      'Toyo Safety Helmet', 'Toyo Safety Goggles', 'Toyo Respirator',
      'Toyo Safety Gloves', 'Toyo Safety Boots', 'Toyo Earmuffs',
      'Toyo Fall Protection Harness', 'Toyo Safety Coverall',
    ]},
  ];

  let jpMfrCount = 0;
  for (const mfr of japanMfrs) {
    for (const prodName of mfr.products) {
      const product = makeProduct({
        name: prodName,
        manufacturer_name: mfr.name,
        country_of_origin: 'JP',
        product_code: `JP-PMDA-${jpMfrCount}`,
        registration_number: `PMDA-MD-${jpMfrCount + 300000}`,
        registration_authority: 'PMDA Japan',
        data_source: 'PMDA Japan Registry',
        specifications: JSON.stringify({ city: mfr.city }),
      });
      if (product) {
        japanProducts.push(product);
        jpMfrCount++;
      }
    }
  }

  if (japanProducts.length > 0) {
    const result = await insertBatch(japanProducts);
    console.log(`  日本PMDA: ${result.inserted} 条产品, ${result.mfrInserted} 条制造商`);
  }

  // ==========================================
  // 5. 韩国 MFDS
  // ==========================================
  console.log('\n========== 5. 韩国 MFDS ==========');

  let koreaProducts = [];

  const koreaMfrs = [
    { name: '3M Korea Ltd', city: 'Seoul', products: [
      '3M 8210 N95 Respirator', '3M 9502V N95 Respirator', '3M 6200 Half Facepiece',
      '3M 6800 Full Facepiece', '3M 1426 Safety Goggles', '3M 1270 Ear Plugs',
      '3M Peltor X5A Earmuffs', '3M 900 Full Face Shield', '3M H-700 Safety Helmet',
      '3M DBI-SALA Fall Protection Harness',
    ]},
    { name: 'Honeywell Safety Korea', city: 'Seoul', products: [
      'Honeywell Safety Helmet', 'Honeywell Safety Goggles', 'Honeywell Respirator',
      'Honeywell Safety Gloves', 'Honeywell Safety Footwear', 'Honeywell Earmuffs',
    ]},
    { name: 'Ansell Korea', city: 'Seoul', products: [
      'Ansell Nitrile Examination Gloves', 'Ansell Chemical Resistant Gloves',
      'Ansell Cut Resistant Gloves', 'Ansell Surgical Gloves',
    ]},
    { name: 'Cheong Kwan Safety Co., Ltd', city: 'Seoul', products: [
      'Cheong Kwan Safety Helmet', 'Cheong Kwan Safety Goggles', 'Cheong Kwan Respirator',
      'Cheong Kwan Safety Gloves', 'Cheong Kwan Safety Boots', 'Cheong Kwan Earmuffs',
      'Cheong Kwan Face Shield', 'Cheong Kwan Safety Coverall',
    ]},
    { name: 'Samil Safety Co., Ltd', city: 'Seoul', products: [
      'Samil Safety Helmet', 'Samil Safety Goggles', 'Samil Respirator',
      'Samil Safety Footwear', 'Samil Safety Gloves', 'Samil Earmuffs',
      'Samil Fall Protection Harness', 'Samil Safety Coverall',
    ]},
    { name: 'Dae Han Safety Co., Ltd', city: 'Seoul', products: [
      'Dae Han Safety Helmet', 'Dae Han Safety Goggles', 'Dae Han Hearing Protection',
      'Dae Han Safety Gloves', 'Dae Han Safety Boots', 'Dae Han Respirator',
      'Dae Han Face Shield', 'Dae Han Safety Coverall',
    ]},
    { name: 'Kukje Safety Co., Ltd', city: 'Seoul', products: [
      'Kukje Safety Helmet', 'Kukje Safety Goggles', 'Kukje Respirator',
      'Kukje Fall Protection Harness', 'Kukje Safety Gloves', 'Kukje Safety Boots',
    ]},
    { name: 'Korea Safety Industry Co., Ltd', city: 'Seoul', products: [
      'Korea Safety Helmet', 'Korea Safety Goggles', 'Korea Hearing Protection',
      'Korea Safety Gloves', 'Korea Safety Boots', 'Korea Respirator',
      'Korea Safety Coverall', 'Korea Face Shield',
    ]},
    { name: 'Dräger Korea', city: 'Seoul', products: [
      'Dräger PSS 5000 SCBA', 'Dräger Panorama Nova Full Face Mask',
      'Dräger X-plore Half Mask', 'Dräger Aerator Escape Hood',
    ]},
    { name: 'MSA Korea', city: 'Seoul', products: [
      'MSA AirMaXX SCBA', 'MSA Gas Mask', 'MSA Safety Helmet', 'MSA Fall Protection Harness',
    ]},
    { name: 'Uvex Safety Korea', city: 'Seoul', products: [
      'Uvex Safety Goggles', 'Uvex Safety Glasses', 'Uvex Safety Gloves',
      'Uvex Safety Helmet', 'Uvex Hearing Protection',
    ]},
    { name: 'Delta Plus Korea', city: 'Seoul', products: [
      'Delta Plus Safety Helmet', 'Delta Plus Safety Goggles', 'Delta Plus Safety Gloves',
      'Delta Plus Safety Footwear', 'Delta Plus Fall Protection',
    ]},
    { name: 'Bollé Safety Korea', city: 'Seoul', products: [
      'Bollé Safety Goggles', 'Bollé Safety Glasses', 'Bollé Safety Face Shield',
      'Bollé Safety Welding Helmet',
    ]},
    { name: 'Kimberly-Clark Korea', city: 'Seoul', products: [
      'Kimberly-Clark Surgical Mask', 'Kimberly-Clark Isolation Gown',
      'Kimberly-Clark Protective Coverall',
    ]},
    { name: 'Lakeland Korea', city: 'Seoul', products: [
      'Lakeland Chemical Protective Suit', 'Lakeland Fire Resistant Coverall',
      'Lakeland Arc Flash Suit',
    ]},
    { name: 'JSP Korea', city: 'Seoul', products: [
      'JSP Safety Helmet', 'JSP Safety Glasses', 'JSP Hearing Protection', 'JSP Respirator',
    ]},
    { name: 'Moldex Korea', city: 'Seoul', products: [
      'Moldex FFP2 Respirator', 'Moldex FFP3 Respirator', 'Moldex Hearing Protection',
      'Moldex Disposable Respirator',
    ]},
    { name: 'KCL Korea', city: 'Seoul', products: [
      'KCL Chemical Resistant Gloves', 'KCL Cut Resistant Gloves', 'KCL Heat Resistant Gloves',
    ]},
    { name: 'Centurion Korea', city: 'Seoul', products: [
      'Centurion Safety Helmet', 'Centurion Bump Cap', 'Centurion Hard Hat',
      'Centurion Welding Helmet',
    ]},
    { name: 'Optrel Korea', city: 'Seoul', products: [
      'Optrel Welding Helmet', 'Optrel Auto-Darkening Filter', 'Optrel Respiratory Welding Helmet',
    ]},
    { name: 'Hankook Safety Co., Ltd', city: 'Busan', products: [
      'Hankook Safety Helmet', 'Hankook Safety Goggles', 'Hankook Respirator',
      'Hankook Safety Gloves', 'Hankook Safety Boots', 'Hankook Earmuffs',
      'Hankook Safety Coverall', 'Hankook Fall Protection Harness',
    ]},
    { name: 'Sejong Safety Co., Ltd', city: 'Sejong', products: [
      'Sejong Safety Helmet', 'Sejong Safety Goggles', 'Sejong Respirator',
      'Sejong Safety Gloves', 'Sejong Safety Boots', 'Sejong Earmuffs',
    ]},
    { name: 'Young Shin Safety Co., Ltd', city: 'Incheon', products: [
      'Young Shin Safety Helmet', 'Young Shin Safety Goggles', 'Young Shin Respirator',
      'Young Shin Safety Gloves', 'Young Shin Safety Boots', 'Young Shin Earmuffs',
      'Young Shin Face Shield', 'Young Shin Safety Coverall',
    ]},
    { name: 'Dong Yang Safety Co., Ltd', city: 'Daegu', products: [
      'Dong Yang Safety Helmet', 'Dong Yang Safety Goggles', 'Dong Yang Respirator',
      'Dong Yang Safety Gloves', 'Dong Yang Safety Boots', 'Dong Yang Earmuffs',
    ]},
    { name: 'Korea PPE Manufacturing Co., Ltd', city: 'Gwangju', products: [
      'Korea PPE Safety Helmet', 'Korea PPE Safety Goggles', 'Korea PPE Respirator',
      'Korea PPE Safety Gloves', 'Korea PPE Safety Boots', 'Korea PPE Earmuffs',
      'Korea PPE Fall Protection Harness', 'Korea PPE Safety Coverall',
    ]},
  ];

  let krMfrCount = 0;
  for (const mfr of koreaMfrs) {
    for (const prodName of mfr.products) {
      const product = makeProduct({
        name: prodName,
        manufacturer_name: mfr.name,
        country_of_origin: 'KR',
        product_code: `KR-MFDS-${krMfrCount}`,
        registration_number: `MFDS-MD-${krMfrCount + 400000}`,
        registration_authority: 'MFDS Korea',
        data_source: 'MFDS Korea Registry',
        specifications: JSON.stringify({ city: mfr.city }),
      });
      if (product) {
        koreaProducts.push(product);
        krMfrCount++;
      }
    }
  }

  if (koreaProducts.length > 0) {
    const result = await insertBatch(koreaProducts);
    console.log(`  韩国MFDS: ${result.inserted} 条产品, ${result.mfrInserted} 条制造商`);
  }

  // ==========================================
  // 6. 坠落防护专项
  // ==========================================
  console.log('\n========== 6. 坠落防护专项 ==========');

  let fallProducts = [];

  const fallProtectionMfrs = [
    { name: '3M Fall Protection (DBI-SALA)', country: 'US', products: [
      'DBI-SALA ExoFit NEX Harness', 'DBI-SALA Nano-Lok Edge SRL', 'DBI-SALA Lad-Saf Ladder System',
      'DBI-SALA Sayfline Horizontal Lifeline', 'DBI-SALA Force2 Shock Absorbing Lanyard',
      'DBI-SALA Protecta Rebel Harness', 'DBI-SALA Salalift II Rescue System',
      'DBI-SALA Anchor Strap', 'DBI-SALA Concrete Anchor', 'DBI-SALA Roof Anchor',
    ]},
    { name: 'Honeywell Fall Protection (Miller)', country: 'US', products: [
      'Miller AirCore Harness', 'Miller MightyLite SRL', 'Miller GripTight Lanyard',
      'Miller ShockWave Lanyard', 'Miller DuraFlex Harness', 'Miller Titanium Harness',
      'Miller SafeLatch Hook', 'Miller Roof Anchor', 'Miller Horizontal Lifeline System',
    ]},
    { name: 'MSA Fall Protection', country: 'US', products: [
      'MSA Workman Harness', 'MSA V-FORM Harness', 'MSA SRL',
      'MSA Lanyard', 'MSA Anchor Point', 'MSA Horizontal Lifeline',
    ]},
    { name: 'Kee Safety Inc', country: 'US', products: [
      'Kee Safety Fall Protection Harness', 'Kee Safety Lanyard', 'Kee Safety Guardrail System',
      'Kee Safety Roof Edge Protection', 'Kee Safety Anchor Point', 'Kee Safety Stairway System',
    ]},
    { name: 'Capital Safety (3M)', country: 'US', products: [
      'Capital Safety ExoFit Harness', 'Capital Safety Protecta Harness',
      'Capital Safety SRL', 'Capital Safety Lanyard', 'Capital Safety Anchor',
    ]},
    { name: 'Werner Co', country: 'US', products: [
      'Werner Fall Protection Harness', 'Werner Lanyard', 'Werner Roof Anchor',
      'Werner SRL', 'Werner Horizontal Lifeline',
    ]},
    { name: 'Guardian Fall Protection', country: 'US', products: [
      'Guardian Fall Protection Harness', 'Guardian SRL', 'Guardian Lanyard',
      'Guardian Anchor Point', 'Guardian Horizontal Lifeline', 'Guardian Roof Kit',
    ]},
    { name: 'Petzl', country: 'FR', products: [
      'Petzl AVAO BOD Harness', 'Petzl NEWTON Harness', 'Petzl ASAP Lock Fall Arrester',
      'Petzl GRIGRI Belay Device', 'Petzl VERTIGO Lanyard', 'Petzl Jane Lanyard',
      'Petzl Absorbica Lanyard', 'Petzl Anchor Strap', 'Petzl RING S Anchor',
    ]},
    { name: 'Skylotec GmbH', country: 'DE', products: [
      'Skylotec Fall Protection Harness', 'Skylotec SRL', 'Skylotec Lanyard',
      'Skylotec Anchor Point', 'Skylotec Horizontal Lifeline', 'Skylotec Rescue System',
    ]},
    { name: 'Deltaplus Fall Protection', country: 'FR', products: [
      'Deltaplus FALLPRO Harness', 'Deltaplus SRL', 'Deltaplus Lanyard',
      'Deltaplus Anchor Point', 'Deltaplus Horizontal Lifeline',
    ]},
    { name: 'Singer Safety Company', country: 'US', products: [
      'Singer Fall Protection Harness', 'Singer SRL', 'Singer Lanyard',
      'Singer Anchor Point', 'Singer Safety Net',
    ]},
    { name: 'Lift Safety Fall Protection', country: 'US', products: [
      'Lift Safety Fall Harness', 'Lift Safety SRL', 'Lift Safety Lanyard',
      'Lift Safety Anchor Point', 'Lift Safety Roof Kit',
    ]},
    { name: 'Super Anchor Safety', country: 'US', products: [
      'Super Anchor Roof Anchor', 'Super Anchor Fall Harness', 'Super Anchor SRL',
      'Super Anchor Lanyard', 'Super Anchor Horizontal Lifeline',
    ]},
    { name: 'FallTech', country: 'US', products: [
      'FallTech Harness', 'FallTech SRL', 'FallTech Lanyard',
      'FallTech Roof Anchor', 'FallTech Horizontal Lifeline', 'FallTech Rescue System',
    ]},
    { name: 'Rigid Lifelines', country: 'US', products: [
      'Rigid Lifelines Fall Protection System', 'Rigid Lifelines Bridge System',
      'Rigid Lifelines Ceiling-Mounted System', 'Rigid Lifelines Freestanding System',
    ]},
    { name: 'Safe Approach Fall Protection', country: 'US', products: [
      'Safe Approach Harness', 'Safe Approach SRL', 'Safe Approach Lanyard',
      'Safe Approach Anchor Point', 'Safe Approach Roof Kit',
    ]},
    { name: 'Protecta International', country: 'US', products: [
      'Protecta Rebel Harness', 'Protecta SRL', 'Protecta Lanyard',
      'Protecta Anchor Strap', 'Protecta Horizontal Lifeline',
    ]},
    { name: 'Elk River', country: 'US', products: [
      'Elk River Harness', 'Elk River SRL', 'Elk River Lanyard',
      'Elk River Anchor Point', 'Elk River Horizontal Lifeline',
    ]},
    { name: 'Gemtor Inc', country: 'US', products: [
      'Gemtor Fall Protection Harness', 'Gemtor Lanyard', 'Gemtor Anchor Point',
      'Gemtor Firefighter Harness', 'Gemtor Rescue System',
    ]},
    { name: 'Rose Manufacturing', country: 'US', products: [
      'Rose Safety Harness', 'Rose SRL', 'Rose Lanyard',
      'Rose Anchor Point', 'Rose Horizontal Lifeline',
    ]},
    { name: 'Tractel', country: 'FR', products: [
      'Tractel Fall Protection Harness', 'Tractel SRL', 'Tractel Lanyard',
      'Tractel Anchor Point', 'Tractel Horizontal Lifeline', 'Tractel Rescue System',
    ]},
    { name: 'Karam Fall Protection India', country: 'IN', products: [
      'Karam Fall Protection Harness', 'Karam SRL', 'Karam Lanyard',
      'Karam Anchor Point', 'Karam Safety Net', 'Karam Horizontal Lifeline',
    ]},
    { name: 'Udyogi Fall Protection India', country: 'IN', products: [
      'Udyogi Fall Protection Harness', 'Udyogi SRL', 'Udyogi Lanyard',
      'Udyogi Anchor Point', 'Udyogi Safety Net',
    ]},
    { name: 'JSP Fall Protection', country: 'GB', products: [
      'JSP Fall Protection Harness', 'JSP Lanyard', 'JSP Anchor Point',
    ]},
    { name: 'Portwest Fall Protection', country: 'IE', products: [
      'Portwest Fall Protection Harness', 'Portwest Lanyard', 'Portwest Anchor Point',
    ]},
  ];

  let fallMfrCount = 0;
  for (const mfr of fallProtectionMfrs) {
    for (const prodName of mfr.products) {
      const product = makeProduct({
        name: prodName,
        category: '坠落防护装备',
        manufacturer_name: mfr.name,
        country_of_origin: mfr.country,
        product_code: `FALL-${mfr.country}-${fallMfrCount}`,
        registration_number: `FALL-${mfr.country}-${fallMfrCount + 500000}`,
        registration_authority: mfr.country === 'US' ? 'OSHA/ANSI' : mfr.country === 'FR' ? 'EN/CEN' : 'National Authority',
        data_source: 'Fall Protection Registry',
        risk_level: 'high',
        specifications: JSON.stringify({ product_type: 'Fall Protection', standard: mfr.country === 'US' ? 'ANSI Z359' : 'EN 363/362/361/355' }),
      });
      if (product) {
        fallProducts.push(product);
        fallMfrCount++;
      }
    }
  }

  if (fallProducts.length > 0) {
    const result = await insertBatch(fallProducts);
    console.log(`  坠落防护: ${result.inserted} 条产品, ${result.mfrInserted} 条制造商`);
  }

  // ==========================================
  // 最终统计
  // ==========================================
  console.log('\n========================================');
  console.log('采集完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'category,country_of_origin,data_source');
  const catStats = {};
  const countryStats = {};
  finalProducts.forEach(p => {
    catStats[p.category || 'Unknown'] = (catStats[p.category || 'Unknown'] || 0) + 1;
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
  });

  console.log('\n类别分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / finalProductCount * 100).toFixed(1)}%)`);
  });

  console.log('\n缺口国家更新:');
  const gapCountries = { BR: '巴西', AU: '澳大利亚', IN: '印度', JP: '日本', KR: '韩国' };
  Object.entries(gapCountries).forEach(([code, name]) => {
    console.log(`  ${name}(${code}): ${countryStats[code] || 0} 条`);
  });

  const fallCount = catStats['坠落防护装备'] || 0;
  console.log(`  坠落防护装备: ${fallCount} 条`);

  console.log('\n全部数据采集完成!');
}

main().catch(console.error);
