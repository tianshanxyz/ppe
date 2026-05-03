#!/usr/bin/env node
const https = require('https');

const url = 'https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx';

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
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing CAEPI POST request...');
  
  const html = await httpsGet(url);
  console.log('Page size:', html.length);
  
  const vs = html.match(/id="__VIEWSTATE"\s+value="([^"]*)"/i);
  const ev = html.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/i);
  const vsg = html.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/i);
  
  console.log('VS length:', vs ? vs[1].length : 0);
  console.log('EV length:', ev ? ev[1].length : 0);
  console.log('VSG:', vsg ? vsg[1] : '');
  
  console.log('\nSending POST for CAPACETE CLASSE A (id=68)...');
  const result = await httpsPost(url, {
    '__VIEWSTATE': vs[1],
    '__VIEWSTATEGENERATOR': vsg[1],
    '__EVENTVALIDATION': ev[1],
    'ddlEquipamento': '68',
    'btnConsultar': 'Consultar',
  });
  
  console.log('Response size:', result.length);
  console.log('Has result table:', result.includes('gvResultado'));
  
  // Extract table rows
  const tableMatch = result.match(/id="gvResultado"[\s\S]*?<\/table>/i);
  if (tableMatch) {
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowCount = 0;
    let match;
    while ((match = rowRegex.exec(tableMatch[0])) !== null) {
      const cells = [];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(match[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length >= 3) {
        rowCount++;
        if (rowCount <= 5) {
          console.log(`  Row ${rowCount}: CA=${cells[0]}, Equip=${cells[1].substring(0, 50)}, Mfr=${cells[2].substring(0, 30)}`);
        }
      }
    }
    console.log(`Total rows: ${rowCount}`);
  } else {
    console.log('No result table found. Checking for errors...');
    if (result.includes('Erro')) console.log('  Page contains error message');
    if (result.includes('Nenhum')) console.log('  No results found');
    // Check if page has the form
    console.log('  Has form:', result.includes('ConsultaCAInternet'));
    console.log('  Has ddlEquipamento:', result.includes('ddlEquipamento'));
  }
}

main().catch(console.error);
