#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizeEPI(nome, natureza) {
  const nameUpper = (nome || '').toUpperCase();
  const natUpper = (natureza || '').toUpperCase();
  if (natUpper.includes('CABEÇA') || natUpper.includes('CABECA')) return '头部防护装备';
  if (natUpper.includes('TRONCO')) return '躯干防护装备';
  if (natUpper.includes('MEMBROS SUPERIORES') || natUpper.includes('SUPERIORES')) return '手部防护装备';
  if (natUpper.includes('MEMBROS INFERIORES') || natUpper.includes('INFERIORES')) return '足部防护装备';
  if (natUpper.includes('RESPIRATÓRIA') || natUpper.includes('RESPIRATORIA')) return '呼吸防护装备';
  if (natUpper.includes('AUDITIVA')) return '听觉防护装备';
  if (natUpper.includes('OLHOS') || natUpper.includes('FACE')) return '眼面部防护装备';
  if (natUpper.includes('CORPO INTEIRO') || natUpper.includes('CORPO')) return '身体防护装备';
  if (natUpper.includes('QUEDAS')) return '躯干防护装备';

  if (/MÁSCARA|MASCARA|RESPIRADOR|SEMIRESPIRADOR/i.test(nameUpper)) return '呼吸防护装备';
  if (/LUVA|GLOVE|MANGOTE|TALA/i.test(nameUpper)) return '手部防护装备';
  if (/ÓCULOS|OCULOS|VISOR|FACE SHIELD/i.test(nameUpper)) return '眼面部防护装备';
  if (/CAPACETE/i.test(nameUpper)) return '头部防护装备';
  if (/PROTETOR AURICULAR|ABAFADOR|PLUG/i.test(nameUpper)) return '听觉防护装备';
  if (/BOTA|BOTAS|CALÇADO|CALÇADOS|PERNEIRA/i.test(nameUpper)) return '足部防护装备';
  if (/AVENTAL|COLETE|JALECO|CINTO|CINTURÃO|CINTURAO/i.test(nameUpper)) return '躯干防护装备';
  if (/MACACÃO|MACACAO|VESTIMENTA|ROUPA/i.test(nameUpper)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(nome) {
  const nameUpper = (nome || '').toUpperCase();
  if (/RESPIRADOR|AUTÔNOMA|SCBA|RADIOATIVA|QUÍMICA|ELÉTRIC/i.test(nameUpper)) return 'high';
  if (/CAPACETE|BOTA|LUVA|ÓCULOS|CINTO|QUEDA/i.test(nameUpper)) return 'medium';
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

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const newUrl = loc.startsWith('http') ? loc : `https://${urlObj.hostname}${loc}`;
        return httpsRequest(newUrl, options).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, headers: res.headers, statusCode: res.statusCode }));
      res.on('error', reject);
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function extractViewState(html) {
  const viewstateMatch = html.match(/id="__VIEWSTATE"\s+value="([^"]*)"/i);
  const eventvalidationMatch = html.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/i);
  const viewstategeneratorMatch = html.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/i);
  return {
    viewstate: viewstateMatch ? viewstateMatch[1] : '',
    eventvalidation: eventvalidationMatch ? eventvalidationMatch[1] : '',
    viewstategenerator: viewstategeneratorMatch ? viewstategeneratorMatch[1] : '',
  };
}

function extractDropdownOptions(html, selectId) {
  const regex = new RegExp(`id="${selectId}"[\\s\\S]*?<\\/select>`, 'i');
  const match = html.match(regex);
  if (!match) return [];
  const options = [];
  const optRegex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
  let optMatch;
  while ((optMatch = optRegex.exec(match[0])) !== null) {
    if (optMatch[1] && optMatch[1] !== '0' && optMatch[1] !== '') {
      options.push({ value: optMatch[1], label: optMatch[2].trim() });
    }
  }
  return options;
}

async function main() {
  console.log('========================================');
  console.log('CAEPI 深度爬取 (ASP.NET WebForms)');
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

  // Step 1: Get the form page
  console.log('\nStep 1: 获取CAEPI查询页面...');
  const baseUrl = 'https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx';
  let response;
  try {
    response = await httpsRequest(baseUrl);
    console.log(`  状态码: ${response.statusCode}, 页面大小: ${response.data.length}`);
  } catch (e) {
    console.log(`  获取页面失败: ${e.message}`);
    return;
  }

  // Step 2: Extract dropdown options for equipment types
  console.log('\nStep 2: 提取设备类型下拉选项...');
  const equipTypes = extractDropdownOptions(response.data, 'ddlTipoProtecao');
  console.log(`  找到 ${equipTypes.length} 个设备类型:`);
  equipTypes.forEach(t => console.log(`    ${t.value}: ${t.label}`));

  if (equipTypes.length === 0) {
    console.log('  未找到设备类型，尝试直接POST请求...');
  }

  // Step 3: Submit search for each type
  console.log('\nStep 3: 按类型搜索EPI...');
  const vs = extractViewState(response.data);

  for (const type of equipTypes) {
    try {
      console.log(`  搜索: ${type.label}...`);

      const postData = new URLSearchParams({
        '__VIEWSTATE': vs.viewstate,
        '__VIEWSTATEGENERATOR': vs.viewstategenerator,
        '__EVENTVALIDATION': vs.eventvalidation,
        'ddlTipoProtecao': type.value,
        'btnConsultar': 'Consultar',
      }).toString();

      const searchResponse = await httpsRequest(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Referer': baseUrl,
        },
        body: postData,
      });

      if (searchResponse.statusCode !== 200) {
        console.log(`    HTTP ${searchResponse.statusCode}`);
        continue;
      }

      // Parse results table
      const tableRegex = /id="gvResultado"[\s\S]*?<\/table>/i;
      const tableMatch = searchResponse.data.match(tableRegex);

      if (!tableMatch) {
        console.log(`    无结果表格`);
        continue;
      }

      const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
      const rows = tableMatch[0].match(rowRegex) || [];
      let typeCount = 0;

      for (const row of rows) {
        const cells = [];
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let match;
        while ((match = cellRegex.exec(row)) !== null) {
          cells.push(match[1].replace(/<[^>]+>/g, '').trim());
        }
        if (cells.length < 3) continue;

        const ca = cells[0] || '';
        const equipamento = cells[1] || '';
        const fabricante = cells[2] || '';
        const situacao = cells[3] || '';
        if (!ca || !equipamento || ca.length < 2) continue;
        if (situacao.toUpperCase().includes('VENCIDO') || situacao.toUpperCase().includes('CANCELADO')) continue;

        const category = categorizeEPI(equipamento, type.label);
        const riskLevel = determineRiskLevel(equipamento);

        const key = `${equipamento.toLowerCase()}|${fabricante.toLowerCase()}|${ca.toLowerCase()}`;
        const regKey = `CA-${ca}`;

        if (existingKeys.has(key) || existingRegKeys.has(regKey)) continue;

        const product = {
          name: equipamento.substring(0, 500),
          category,
          subcategory: type.label,
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
      console.log(`    ${type.label}: ${typeCount} 条新数据`);
      await sleep(2000);
    } catch (e) {
      console.log(`    错误: ${e.message}`);
    }
  }

  // Step 4: Also try Pure Global AI with specific device pages
  console.log('\n========================================');
  console.log('Pure Global AI 深度爬取');
  console.log('========================================');

  const PG_COUNTRIES = [
    { code: 'japan', cc: 'JP', auth: 'PMDA' },
    { code: 'korea', cc: 'KR', auth: 'MFDS' },
    { code: 'brazil', cc: 'BR', auth: 'ANVISA' },
  ];

  const PPE_CODES_PG = ['MSH', 'MSR', 'OEA', 'OEB', 'KNC', 'KNG', 'LMA', 'LZA', 'LYY', 'FXX', 'BZD', 'KKX', 'DSA', 'HCC', 'FMI', 'FTL', 'NHA'];

  let pgInserted = 0;

  for (const country of PG_COUNTRIES) {
    console.log(`  爬取 ${country.code}...`);

    for (const code of PPE_CODES_PG) {
      try {
        const searchUrl = `https://www.pureglobal.ai/${country.code}/medical-device/database?productCode=${code}`;
        const resp = await httpsRequest(searchUrl);

        // Try to find device links in the page
        const linkRegex = new RegExp(`href="(/${country.code}/medical-device/database/[^"]+)"`, 'gi');
        const links = [];
        let linkMatch;
        while ((linkMatch = linkRegex.exec(resp.data)) !== null) {
          links.push(linkMatch[1]);
        }

        if (links.length === 0) {
          // Try to find device data in JSON format (SPA might have embedded data)
          const jsonRegex = /"devices"\s*:\s*(\[[\s\S]*?\])/g;
          const jsonMatch = jsonRegex.exec(resp.data);
          if (jsonMatch) {
            try {
              const devices = JSON.parse(jsonMatch[1]);
              for (const device of devices) {
                const name = device.name || device.deviceName || '';
                const mfrName = device.manufacturerName || device.manufacturer || '';
                if (!name || name.length < 3) continue;

                const category = categorizeEPI(name, '');
                const riskLevel = determineRiskLevel(name);

                const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${code.toLowerCase()}`;
                if (existingKeys.has(key)) continue;

                const product = {
                  name: name.substring(0, 500),
                  category,
                  manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
                  country_of_origin: country.cc,
                  product_code: code,
                  risk_level: riskLevel,
                  data_source: `Pure Global AI - ${country.code}`,
                  registration_authority: country.auth,
                  last_verified: new Date().toISOString().split('T')[0],
                  data_confidence_level: 'medium',
                };

                const { error } = await supabase.from('ppe_products').insert(product);
                if (!error) {
                  existingKeys.add(key);
                  pgInserted++;
                  totalInserted++;
                }
              }
            } catch (e) {
              // skip
            }
          }
        }

        // Visit individual device pages
        for (const link of links.slice(0, 20)) {
          try {
            const deviceUrl = `https://www.pureglobal.ai${link}`;
            const deviceResp = await httpsRequest(deviceUrl);

            const nameMatch = deviceResp.data.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
              deviceResp.data.match(/"deviceName"\s*:\s*"([^"]+)"/i) ||
              deviceResp.data.match(/"name"\s*:\s*"([^"]+)"/i);
            const mfrMatch = deviceResp.data.match(/"manufacturerName"\s*:\s*"([^"]+)"/i) ||
              deviceResp.data.match(/"manufacturer"\s*:\s*"([^"]+)"/i);

            const name = nameMatch ? nameMatch[1].trim() : '';
            const mfrName = mfrMatch ? mfrMatch[1].trim() : '';

            if (!name || name.length < 3) continue;

            const category = categorizeEPI(name, '');
            const riskLevel = determineRiskLevel(name);

            const key = `${name.toLowerCase()}|${mfrName.toLowerCase()}|${code.toLowerCase()}`;
            if (existingKeys.has(key)) continue;

            const product = {
              name: name.substring(0, 500),
              category,
              manufacturer_name: mfrName.substring(0, 500) || 'Unknown',
              country_of_origin: country.cc,
              product_code: code,
              risk_level: riskLevel,
              data_source: `Pure Global AI - ${country.code}`,
              registration_authority: country.auth,
              last_verified: new Date().toISOString().split('T')[0],
              data_confidence_level: 'medium',
            };

            const { error } = await supabase.from('ppe_products').insert(product);
            if (!error) {
              existingKeys.add(key);
              pgInserted++;
              totalInserted++;
            }
            await sleep(300);
          } catch (e) {
            // skip
          }
        }

        await sleep(500);
      } catch (e) {
        // skip
      }
    }
    console.log(`  ${country.code}: ${pgInserted} 条`);
  }
  console.log(`  Pure Global总计: ${pgInserted}`);

  // Final Summary
  console.log('\n========================================');
  console.log('深度爬取完成 - 最终统计');
  console.log('========================================');
  const { count: finalProductCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  新增产品: ${totalInserted}`);
  console.log(`  新增制造商: ${totalMfrInserted}`);
  console.log(`  最终产品数: ${finalProductCount}`);
  console.log(`  最终制造商数: ${finalMfrCount}`);

  const finalProducts = await fetchAll('ppe_products', 'country_of_origin,data_source');
  const countryStats = {};
  const srcStats = {};
  finalProducts.forEach(p => {
    countryStats[p.country_of_origin || 'Unknown'] = (countryStats[p.country_of_origin || 'Unknown'] || 0) + 1;
    srcStats[p.data_source || 'Unknown'] = (srcStats[p.data_source || 'Unknown'] || 0) + 1;
  });

  console.log('\n国家分布(前10):');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n数据来源分布:');
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/finalProductCount*100).toFixed(1)}%)`);
  });

  console.log('\n深度爬取完成!');
}

main().catch(console.error);
