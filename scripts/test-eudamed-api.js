#!/usr/bin/env node
const https = require('https');

const url = 'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?tradeName=mask&pageSize=300&size=300&page=0&iso2Code=en&languageCode=en';
const start = Date.now();

https.get(url, {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  timeout: 30000,
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const elapsed = Date.now() - start;
    try {
      const json = JSON.parse(data);
      console.log('Status:', res.statusCode);
      console.log('Time:', elapsed + 'ms');
      console.log('totalElements:', json.totalElements);
      console.log('content length:', json.content?.length);
      console.log('First item tradeName:', json.content?.[0]?.tradeName);
      console.log('First item manufacturerName:', json.content?.[0]?.manufacturerName);
      console.log('First item riskClass:', json.content?.[0]?.riskClass?.code);
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Data length:', data.length);
      console.log('First 500 chars:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.log('Error:', e.message);
  console.log('Time:', Date.now() - start + 'ms');
});
