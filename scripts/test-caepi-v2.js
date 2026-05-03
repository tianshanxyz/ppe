#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const url = 'https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx';

function httpsGet(u) {
  return new Promise((resolve, reject) => {
    https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); res.on('error', reject);
    }).on('error', reject);
  });
}

function httpsPost(u, formData) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(formData).toString();
    const uo = new URL(u);
    const req = https.request({
      hostname: uo.hostname, path: uo.pathname, method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': u,
      },
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const html = await httpsGet(url);
  const vs = html.match(/id="__VIEWSTATE"\s+value="([^"]*)"/i);
  const ev = html.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/i);
  const vsg = html.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/i);

  console.log('Testing with correct field names...');

  // Test 1: Standard POST
  const result = await httpsPost(url, {
    '__VIEWSTATE': vs[1],
    '__VIEWSTATEGENERATOR': vsg[1],
    '__EVENTVALIDATION': ev[1],
    'ctl00$PlaceHolderConteudo$cboEquipamento': '68',
    'ctl00$PlaceHolderConteudo$btnConsultar': 'Consultar',
  });
  console.log('Test 1 - Standard POST:', result.length, 'bytes');
  console.log('  Has gvResultado:', result.includes('gvResultado'));
  console.log('  Has result data:', result.includes('CA'));
  fs.writeFileSync('/tmp/caepi_test1.html', result);

  // Test 2: With ScriptManager (ASP.NET AJAX)
  const result2 = await httpsPost(url, {
    '__VIEWSTATE': vs[1],
    '__VIEWSTATEGENERATOR': vsg[1],
    '__EVENTVALIDATION': ev[1],
    'ctl00$ScriptManager1': 'ctl00$PlaceHolderConteudo$UpdatePanel1|ctl00$PlaceHolderConteudo$btnConsultar',
    '__ASYNCPOST': 'true',
    'ctl00$PlaceHolderConteudo$cboEquipamento': '68',
    'ctl00$PlaceHolderConteudo$btnConsultar': 'Consultar',
  });
  console.log('\nTest 2 - AJAX POST:', result2.length, 'bytes');
  console.log('  Has gvResultado:', result2.includes('gvResultado'));
  console.log('  Has result data:', result2.includes('CA'));
  fs.writeFileSync('/tmp/caepi_test2.html', result2);

  // Check content of test2
  if (result2.length < 50000) {
    console.log('\nTest 2 content (first 2000 chars):');
    console.log(result2.substring(0, 2000));
  }

  // Test 3: Search by CA number directly
  const result3 = await httpsPost(url, {
    '__VIEWSTATE': vs[1],
    '__VIEWSTATEGENERATOR': vsg[1],
    '__EVENTVALIDATION': ev[1],
    'ctl00$PlaceHolderConteudo$txtNumeroCA': '3890',
    'ctl00$PlaceHolderConteudo$btnConsultar': 'Consultar',
  });
  console.log('\nTest 3 - CA number search:', result3.length, 'bytes');
  console.log('  Has gvResultado:', result3.includes('gvResultado'));
  fs.writeFileSync('/tmp/caepi_test3.html', result3);

  // Test 4: AJAX with CA number
  const result4 = await httpsPost(url, {
    '__VIEWSTATE': vs[1],
    '__VIEWSTATEGENERATOR': vsg[1],
    '__EVENTVALIDATION': ev[1],
    'ctl00$ScriptManager1': 'ctl00$PlaceHolderConteudo$UpdatePanel1|ctl00$PlaceHolderConteudo$btnConsultar',
    '__ASYNCPOST': 'true',
    'ctl00$PlaceHolderConteudo$txtNumeroCA': '3890',
    'ctl00$PlaceHolderConteudo$btnConsultar': 'Consultar',
  });
  console.log('\nTest 4 - AJAX CA number:', result4.length, 'bytes');
  console.log('  Has gvResultado:', result4.includes('gvResultado'));
  fs.writeFileSync('/tmp/caepi_test4.html', result4);

  if (result4.length < 50000) {
    console.log('\nTest 4 content (first 2000 chars):');
    console.log(result4.substring(0, 2000));
  }
}

main().catch(console.error);
